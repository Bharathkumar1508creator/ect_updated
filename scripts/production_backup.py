"""Create and verify a production backup without exposing database credentials."""

import argparse
import hashlib
import os
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass(frozen=True)
class BackupConfig:
    app_root: Path
    backup_root: Path
    env_file: Path
    media_dir: Path
    nginx_config: Path
    systemd_service: Path
    mysql_defaults_file: Path
    db_name: str
    db_user: str
    db_host: str = "localhost"
    db_port: str = "3306"


def _absolute(value, name):
    path = Path(value).expanduser()
    if not path.is_absolute():
        raise ValueError(f"{name} must be an absolute path.")
    return path.resolve(strict=False)


def load_config(environ=os.environ):
    required = (
        "APP_ROOT",
        "BACKUP_ROOT",
        "ENV_FILE",
        "MEDIA_DIR",
        "NGINX_CONFIG",
        "SYSTEMD_SERVICE_FILE",
        "MYSQL_DEFAULTS_FILE",
        "DB_NAME",
        "DB_USER",
    )
    missing = [name for name in required if not environ.get(name, "").strip()]
    if missing:
        raise ValueError("Missing required settings: " + ", ".join(missing))
    return BackupConfig(
        app_root=_absolute(environ["APP_ROOT"], "APP_ROOT"),
        backup_root=_absolute(environ["BACKUP_ROOT"], "BACKUP_ROOT"),
        env_file=_absolute(environ["ENV_FILE"], "ENV_FILE"),
        media_dir=_absolute(environ["MEDIA_DIR"], "MEDIA_DIR"),
        nginx_config=_absolute(environ["NGINX_CONFIG"], "NGINX_CONFIG"),
        systemd_service=_absolute(environ["SYSTEMD_SERVICE_FILE"], "SYSTEMD_SERVICE_FILE"),
        mysql_defaults_file=_absolute(environ["MYSQL_DEFAULTS_FILE"], "MYSQL_DEFAULTS_FILE"),
        db_name=environ["DB_NAME"].strip(),
        db_user=environ["DB_USER"].strip(),
        db_host=environ.get("DB_HOST", "localhost").strip() or "localhost",
        db_port=environ.get("DB_PORT", "3306").strip() or "3306",
    )


def _is_within(path, parent):
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def validate_config(config, require_tools=True):
    current = (config.app_root / "current").resolve(strict=False)
    required_paths = {
        "APP_ROOT": config.app_root,
        "current release": current,
        "ENV_FILE": config.env_file,
        "MEDIA_DIR": config.media_dir,
        "NGINX_CONFIG": config.nginx_config,
        "SYSTEMD_SERVICE_FILE": config.systemd_service,
        "MYSQL_DEFAULTS_FILE": config.mysql_defaults_file,
    }
    missing = [label for label, path in required_paths.items() if not path.exists()]
    if missing:
        raise ValueError("Required path does not exist: " + ", ".join(missing))
    if not current.is_dir() or not config.media_dir.is_dir():
        raise ValueError("The current release and media paths must be directories.")
    if config.backup_root == Path(config.backup_root.anchor):
        raise ValueError("BACKUP_ROOT cannot be a filesystem root.")
    if _is_within(config.backup_root, config.media_dir):
        raise ValueError("BACKUP_ROOT cannot be inside MEDIA_DIR.")
    if _is_within(config.backup_root, current):
        raise ValueError("BACKUP_ROOT cannot be inside the current release.")
    if not config.db_port.isdigit() or not 1 <= int(config.db_port) <= 65535:
        raise ValueError("DB_PORT must be a valid TCP port.")
    if os.name != "nt":
        mode = stat.S_IMODE(config.mysql_defaults_file.stat().st_mode)
        if mode & (stat.S_IRWXG | stat.S_IRWXO):
            raise ValueError("MYSQL_DEFAULTS_FILE must not be readable by group or other users.")
    if require_tools and not shutil.which("mysqldump"):
        raise ValueError("mysqldump was not found on PATH.")
    return current


def mysql_dump_command(config):
    return [
        "mysqldump",
        f"--defaults-extra-file={config.mysql_defaults_file}",
        "--single-transaction",
        "--routines",
        "--triggers",
        "--events",
        "--hex-blob",
        f"--host={config.db_host}",
        f"--port={config.db_port}",
        f"--user={config.db_user}",
        config.db_name,
    ]


def _copy_private(source, destination):
    shutil.copy2(source, destination)
    destination.chmod(stat.S_IRUSR | stat.S_IWUSR)


def _write_tar(source, destination, arcname):
    with tarfile.open(destination, "w:gz") as archive:
        archive.add(source, arcname=arcname, recursive=True)
    with tarfile.open(destination, "r:gz") as archive:
        if not archive.getmembers():
            raise RuntimeError(f"Archive is empty: {destination.name}")


def _write_database_dump(config, destination):
    import gzip

    command = mysql_dump_command(config)
    with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as raw:
        raw_path = Path(raw.name)
    try:
        with raw_path.open("wb") as output:
            subprocess.run(command, stdout=output, stderr=subprocess.PIPE, check=True)
        if raw_path.stat().st_size == 0:
            raise RuntimeError("mysqldump produced an empty file.")
        with raw_path.open("rb") as source, gzip.open(destination, "wb") as compressed:
            shutil.copyfileobj(source, compressed)
        with gzip.open(destination, "rb") as verified:
            if not verified.read(1):
                raise RuntimeError("Compressed database dump is empty.")
    finally:
        raw_path.unlink(missing_ok=True)


def _write_checksums(directory, files):
    manifest = directory / "SHA256SUMS"
    lines = []
    for path in sorted(files, key=lambda item: item.name):
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        lines.append(f"{digest}  {path.name}")
    manifest.write_text("\n".join(lines) + "\n", encoding="ascii")
    for line in lines:
        expected, filename = line.split("  ", 1)
        actual = hashlib.sha256((directory / filename).read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError(f"Checksum verification failed: {filename}")
    return manifest


@contextmanager
def _backup_lock(backup_root):
    """Prevent two Linux backup jobs from writing at the same time."""
    backup_root.mkdir(parents=True, exist_ok=True)
    lock_path = backup_root / ".backup.lock"
    with lock_path.open("a+", encoding="utf-8") as lock:
        if os.name != "nt":
            import fcntl

            try:
                fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise RuntimeError("Another production backup is already running.") from exc
        lock.seek(0)
        lock.truncate()
        lock.write(f"pid={os.getpid()}\n")
        lock.flush()
        try:
            yield
        finally:
            if os.name != "nt":
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


def create_backup(config):
    current = validate_config(config)
    with _backup_lock(config.backup_root):
        return _create_backup_locked(config, current)


def _create_backup_locked(config, current):
    release_id = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%SZ")
    final_directory = config.backup_root / release_id
    if final_directory.exists():
        raise RuntimeError(f"Backup destination already exists: {final_directory}")

    work_directory = config.backup_root / f".{release_id}.incomplete"
    work_directory.mkdir(mode=0o700)
    try:
        _copy_private(config.env_file, work_directory / "env.backup")
        shutil.copy2(config.nginx_config, work_directory / "nginx.backup")
        shutil.copy2(config.systemd_service, work_directory / "systemd-service.backup")
        (work_directory / "current-release-path.txt").write_text(str(current) + "\n", encoding="utf-8")
        _write_tar(current, work_directory / "current-release.tar.gz", current.name)
        _write_tar(config.media_dir, work_directory / "media.tar.gz", "media")
        _write_database_dump(config, work_directory / "database.sql.gz")

        artifacts = [path for path in work_directory.iterdir() if path.is_file()]
        empty = [path.name for path in artifacts if path.stat().st_size == 0]
        if empty:
            raise RuntimeError("Empty backup artifacts: " + ", ".join(empty))
        _write_checksums(work_directory, artifacts)
        work_directory.rename(final_directory)
        return final_directory
    except Exception:
        shutil.rmtree(work_directory, ignore_errors=True)
        raise


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check-config",
        action="store_true",
        help="Validate paths, permissions and required tools without creating a backup.",
    )
    args = parser.parse_args(argv)
    try:
        config = load_config()
        validate_config(config)
        if args.check_config:
            print("Production backup configuration passed.")
            return 0
        destination = create_backup(config)
        print(f"Verified production backup created: {destination}")
        print("Copy this directory to storage outside the VPS before deployment.")
        return 0
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"Backup failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
