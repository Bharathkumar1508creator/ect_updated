"""Report safely removable, byte-identical, unreferenced media copies."""

import hashlib
import json
import os
import subprocess
import sys
import argparse
from collections import defaultdict
from pathlib import Path

project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ect.settings")

import django

django.setup()

from django.apps import apps
from django.conf import settings
from django.db.models import FileField


def normalized_media_name(value):
    return str(value or "").replace("\\", "/").lstrip("/")


parser = argparse.ArgumentParser()
parser.add_argument(
    "--delete",
    action="store_true",
    help="Delete only verified untracked, unreferenced byte-identical copies.",
)
args = parser.parse_args()

media_root = Path(settings.MEDIA_ROOT).resolve()
project_root = Path(settings.BASE_DIR).resolve()

referenced = set()
for model in apps.get_models():
    file_fields = [field for field in model._meta.fields if isinstance(field, FileField)]
    if not file_fields:
        continue
    for field in file_fields:
        values = model._default_manager.values_list(field.name, flat=True)
        referenced.update(normalized_media_name(value) for value in values if value)

tracked_output = subprocess.run(
    ["git", "ls-files", "--", "media"],
    cwd=project_root,
    check=True,
    capture_output=True,
    text=True,
).stdout
tracked = {
    Path(line.strip()).relative_to("media").as_posix()
    for line in tracked_output.splitlines()
    if line.strip()
}

hash_groups = defaultdict(list)
for path in media_root.rglob("*"):
    if not path.is_file():
        continue
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    hash_groups[digest].append(path.relative_to(media_root).as_posix())

duplicate_groups = []
candidates = []
for digest, names in sorted(hash_groups.items()):
    if len(names) < 2:
        continue
    keepers = sorted(name for name in names if name in tracked or name in referenced)
    removable = sorted(
        name for name in names if name not in tracked and name not in referenced
    )
    if keepers and removable:
        candidates.extend(removable)
        duplicate_groups.append(
            {
                "sha256": digest,
                "keepers": keepers,
                "removable": removable,
            }
        )

report = {
    "media_root": str(media_root),
    "file_count": sum(len(names) for names in hash_groups.values()),
    "database_reference_count": len(referenced),
    "tracked_media_count": len(tracked),
    "duplicate_group_count": len(duplicate_groups),
    "removable_file_count": len(candidates),
    "removable_bytes": sum((media_root / name).stat().st_size for name in candidates),
    "groups": duplicate_groups,
}

if args.delete:
    deleted = []
    for name in candidates:
        target = (media_root / name).resolve()
        if not target.is_relative_to(media_root):
            raise RuntimeError(f"Refusing path outside MEDIA_ROOT: {target}")
        target.unlink()
        deleted.append(name)
    report["deleted_file_count"] = len(deleted)
    report["deleted"] = deleted

print(json.dumps(report, indent=2))
