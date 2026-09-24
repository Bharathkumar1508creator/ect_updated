# Hostinger VPS static and media caching

The repaired project uses Django manifest static storage. `collectstatic` produces content-hashed filenames, so Nginx can cache `/static/` files for one year without serving stale CSS or JavaScript.

## Deployment commands

Run these after updating the application and installing dependencies, before restarting the application service:

```bash
python manage.py check --deploy
python manage.py collectstatic --noinput --clear
python manage.py warm_media_variants
```

If `collectstatic` reports a missing reference, stop the deployment and correct it. Do not restart the live service with an incomplete static manifest.

## Nginx configuration

Replace the example paths with the verified absolute `STATIC_ROOT` and `MEDIA_ROOT` paths on the VPS:

```nginx
location /static/ {
    alias /absolute/path/to/project/staticfiles/;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    access_log off;
}

location /media/ {
    alias /absolute/path/to/project/media/;
    expires 7d;
    add_header Cache-Control "public, max-age=604800" always;
}

gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    application/javascript
    application/json
    application/xml
    image/svg+xml;
```

Use immutable caching only for `/static/`. Uploaded `/media/` paths are not content-hashed and must use the shorter policy.

Validate before reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

No VPS or live Nginx configuration is changed by this repository checkpoint.