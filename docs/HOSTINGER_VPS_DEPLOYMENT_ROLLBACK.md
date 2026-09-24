# Hostinger VPS deployment and rollback

This procedure deploys the Phase 8 package without replacing production data. Commands use example paths and names. Verify every value on the VPS before running a mutating command.

## 1. Identify the current production setup

Run read-only discovery first:

```bash
pwd
python3 --version
sudo nginx -T | less
sudo systemctl list-units --type=service | grep -Ei 'ecog|gunicorn|uwsgi|django'
sudo find /etc/systemd/system /lib/systemd/system -maxdepth 1 -type f -iname '*ecog*' -o -iname '*gunicorn*'
```

Record the current project path, application service name, Nginx site file, Linux service user, virtual environment, `.env` path, database engine/name, and persistent media path.

Recommended layout used below:

```text
/var/www/ecog/
├── current -> /var/www/ecog/releases/<release-id>
├── releases/
├── shared/
│   ├── .env
│   ├── media/
│   └── backups/
└── venv/
```

Do not change the server layout until the current paths and services are understood.

## 2. Create and verify backups

Set values from the inspected server. Do not paste secrets into shell history.

```bash
export RELEASE_ID=$(date +%Y%m%d-%H%M%S)
export APP_ROOT=/var/www/ecog
export BACKUP_DIR="$APP_ROOT/shared/backups/$RELEASE_ID"
sudo mkdir -p "$BACKUP_DIR"
sudo chmod 700 "$BACKUP_DIR"
```

Back up application configuration and current source:

```bash
sudo cp -a "$APP_ROOT/shared/.env" "$BACKUP_DIR/env.backup"
sudo cp -a /etc/nginx/sites-available/ecog "$BACKUP_DIR/nginx-ecog.backup"
sudo cp -a /etc/systemd/system/ecog.service "$BACKUP_DIR/ecog.service.backup"
sudo tar -C "$APP_ROOT" -czf "$BACKUP_DIR/current-release.tar.gz" current
sudo tar -C "$APP_ROOT/shared" -czf "$BACKUP_DIR/media.tar.gz" media
```

For MySQL/MariaDB, read `DB_NAME` and `DB_USER` from the protected `.env`, then create a consistent dump. Enter the password only at the prompt:

```bash
mysqldump --single-transaction --routines --triggers --events -u DB_USER -p DB_NAME | gzip > "$BACKUP_DIR/database.sql.gz"
gzip -t "$BACKUP_DIR/database.sql.gz"
```

Verify every backup is non-empty before continuing:

```bash
sudo find "$BACKUP_DIR" -maxdepth 1 -type f -printf '%f %s bytes\n'
```

Copy the backup directory to storage outside the VPS before deployment.

## 3. Upload and verify the release

Upload the supplied ZIP to a temporary directory outside the public web root. Compare its SHA-256 value with `ECT_REPAIRED_PHASE_8_2026-09-24.sha256`:

```bash
sha256sum -c ECT_REPAIRED_PHASE_8_2026-09-24.sha256
sudo mkdir -p "$APP_ROOT/releases/$RELEASE_ID"
sudo unzip ECT_REPAIRED_PHASE_8_2026-09-24.zip -d "$APP_ROOT/releases/$RELEASE_ID"
```

The archive has a top-level `ECT-repaired-phase-8` directory. Set the release path:

```bash
export RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID/ECT-repaired-phase-8"
```

Merge bundled public media without replacing live uploads, then attach persistent media:

```bash
sudo mkdir -p "$APP_ROOT/shared/media"
sudo rsync -a --ignore-existing "$RELEASE_DIR/media/" "$APP_ROOT/shared/media/"
sudo mv "$RELEASE_DIR/media" "$RELEASE_DIR/media.bundled"
sudo ln -s "$APP_ROOT/shared/media" "$RELEASE_DIR/media"
sudo ln -s "$APP_ROOT/shared/.env" "$RELEASE_DIR/.env"
```

Confirm that both symlinks resolve inside `/var/www/ecog/shared` before continuing.

## 4. Prepare Python and static assets

Django 6 requires a supported modern Python version. Use the existing verified production interpreter or create the virtual environment with Python 3.12+.

```bash
sudo -u YOUR_LINUX_USER "$APP_ROOT/venv/bin/python" -m pip install --upgrade pip
sudo -u YOUR_LINUX_USER "$APP_ROOT/venv/bin/pip" install -r "$RELEASE_DIR/requirements.txt"
cd "$RELEASE_DIR"
sudo -u YOUR_LINUX_USER "$APP_ROOT/venv/bin/python" manage.py check --deploy
sudo -u YOUR_LINUX_USER "$APP_ROOT/venv/bin/python" manage.py makemigrations --check --dry-run
sudo -u YOUR_LINUX_USER "$APP_ROOT/venv/bin/python" manage.py migrate --plan
```

Stop if any check fails or if the migration plan contains an unexpected destructive operation. This release adds no application migration files.

After the backup and plan are verified:

```bash
sudo -u YOUR_LINUX_USER "$APP_ROOT/venv/bin/python" manage.py migrate
sudo -u YOUR_LINUX_USER "$APP_ROOT/venv/bin/python" manage.py collectstatic --noinput --clear
sudo -u YOUR_LINUX_USER "$APP_ROOT/venv/bin/python" manage.py warm_media_variants
```

Use the cache rules in `docs/HOSTINGER_STATIC_CACHE.md`. The example systemd and Nginx files are in `deploy/`.

## 5. Switch the release

Preserve the previous target before switching:

```bash
readlink -f "$APP_ROOT/current" | sudo tee "$BACKUP_DIR/previous-release-path.txt"
sudo ln -sfn "$RELEASE_DIR" "$APP_ROOT/current"
sudo systemctl daemon-reload
sudo systemctl restart ecog.service
sudo systemctl status ecog.service --no-pager
sudo nginx -t
sudo systemctl reload nginx
```

If the real service is not named `ecog.service`, use the verified current name.

## 6. Post-deployment validation

Run these immediately:

```bash
curl -I https://ecogcoretechnologies.com/
curl -I https://www.ecogcoretechnologies.com/
curl -I https://ecogcoretechnologies.com/robots.txt
curl -I https://ecogcoretechnologies.com/sitemap.xml
curl -I https://ecogcoretechnologies.com/static/css/base.css
sudo journalctl -u ecog.service -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

Verify in Chrome and a mobile device:

- Home, About, Services, Projects, Careers, Contact, Blog, and service pages load without horizontal scrolling.
- `www` redirects to the canonical non-www domain.
- Navigation, contact popup, FAQ, project media, Zoho Recruit redirect, Zoho SalesIQ, analytics, maps, and social links work.
- DevTools has no local 404/500 response, malformed `srcset` warning, or new CSP violation.
- Do not submit a real Zoho Bigin enquiry unless an authorized test record is acceptable.
- Admin login and existing content are present. Check row counts against the pre-deployment record.

Keep the previous release and all backups until the user accepts production validation.

## 7. Application rollback

If validation fails, switch back before investigating:

```bash
export PREVIOUS_RELEASE=$(cat "$BACKUP_DIR/previous-release-path.txt")
sudo ln -sfn "$PREVIOUS_RELEASE" "$APP_ROOT/current"
sudo systemctl restart ecog.service
sudo nginx -t
sudo systemctl reload nginx
```

Verify the old site and review logs. The static directory follows the release symlink, while media stays shared.

## 8. Database rollback

This repair contains no new application migrations, so an application rollback should normally require only the release symlink switch. Do not reverse migrations blindly.

If production data or schema was changed unexpectedly, place the site in maintenance mode, take another forensic dump, and restore the verified pre-deployment database backup under database-administrator supervision:

```bash
gunzip -c "$BACKUP_DIR/database.sql.gz" | mysql -u DB_USER -p DB_NAME
```

Restore shared media only when files were damaged or deleted, because doing so can remove legitimate uploads created after deployment. Compare first, then restore selected files or the verified archive.

## 9. Cleanup

After acceptance, retain at least the current release, the previous release, and the off-server backup according to the company's retention policy. Remove older releases only after resolving and verifying their absolute paths under `/var/www/ecog/releases/`.
