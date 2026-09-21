# Production static caching for Hostinger VPS

The application now uses content-hashed static filenames. Run this on every deployment after installing dependencies and before restarting the application:

```bash
python manage.py collectstatic --noinput --clear
python manage.py warm_media_variants
```

Configure Nginx with the real absolute `STATIC_ROOT` and `MEDIA_ROOT` paths from the VPS. Keep immutable caching only on `/static/`; uploaded `/media/` filenames may be replaced without a content hash.

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

Do not add `immutable` to HTML or `/media/`. Nginx should continue proxying application routes to Gunicorn or the current WSGI service. Test configuration before reloading:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

`warm_media_variants` creates cached WebP derivatives and does not update database fields or overwrite original uploads.

The exact VPS paths and service names must be collected during the deployment phase. No server configuration has been changed by Phase 5.
