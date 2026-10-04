"""Run deterministic frontend checks behind a temporary local Django server."""
import os
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parent.parent
HOST = "127.0.0.1"
PORT = 8765
BASE_URL = f"http://{HOST}:{PORT}"


def wait_for_server(process):
    for _ in range(80):
        if process.poll() is not None:
            raise RuntimeError("The frontend test server stopped during startup.")
        try:
            with urlopen(f"{BASE_URL}/health/", timeout=1) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(0.15)
    raise RuntimeError("Timed out waiting for the frontend test server.")


def run(command, env):
    print("+", " ".join(command), flush=True)
    subprocess.run(command, cwd=ROOT, env=env, check=True)


def main():
    (ROOT / "artifacts").mkdir(exist_ok=True)
    env = os.environ.copy()
    env["ECT_TEST_BASE_URL"] = BASE_URL
    env["DJANGO_DEBUG"] = "True"
    env["DJANGO_USE_SQLITE"] = "True"

    scripts = [
        ROOT / "scripts" / "performance_consent_audit.py",
        ROOT / "scripts" / "project_filter_interaction_audit.py",
        ROOT / "scripts" / "frontend_feature_audit.py",
    ]
    javascript = sorted(
        path for path in (ROOT / "home" / "static" / "js").glob("*.js")
        if not path.name.endswith(".min.js")
    )

    server = subprocess.Popen(
        [sys.executable, "manage.py", "runserver", f"{HOST}:{PORT}", "--noreload"],
        cwd=ROOT,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    try:
        wait_for_server(server)
        for path in javascript:
            run(["node", "--check", str(path)], env)
        run([sys.executable, str(scripts[0])], env)
        run([sys.executable, str(scripts[1]), "--browser", "chrome"], env)
        run([sys.executable, str(scripts[2])], env)
        run([
            sys.executable,
            "scripts/phase7_browser_audit.py",
            "--browser", "chrome",
            "--widths", "390",
            "--output", "artifacts/frontend-test-phase7.json",
            "--interactions",
            "--interactions-only",
        ], env)
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    print("Frontend test suite passed.")


if __name__ == "__main__":
    main()
