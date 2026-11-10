# OG&E Team Recipe Book

A holiday recipe book for fall and winter gatherings, built on a [Tandoor](https://tandoor.dev) instance. Sign in with your Tandoor API token, browse recipes in a book view, read details, and share new recipes.

## Run

```
npm install   # uses the CFS feed from .npmrc
npm run dev   # http://localhost:5173
```

Paste your Tandoor API token on the login page. It is validated against `/api/recipe/`, stored in `localStorage`, and sent as `Authorization: Bearer <token>`. Log out clears it. Tokens are never committed.

## Tandoor URL and CORS

The hosted Tandoor sends no CORS headers, so the browser calls same-origin `/api` and `/media`, which are proxied to Tandoor. Dev and `npm run preview` use the Vite proxy (target defaults to `https://oge-recipes.seiggy.com`; override with `TANDOOR_URL`).

For deployment, serve `dist/` as static files behind a reverse proxy that forwards `/api/` and `/media/` to Tandoor, for example nginx:

```
location /api/   { proxy_pass https://oge-recipes.seiggy.com; proxy_ssl_server_name on; }
location /media/ { proxy_pass https://oge-recipes.seiggy.com; proxy_ssl_server_name on; }
location /       { root /srv/app/dist; try_files $uri /index.html; }
```

Alternatively, enable CORS on the Tandoor server for the app origin.

## Container

A GitHub Actions workflow (`.github/workflows/container.yml`) builds the image on every push and PR, and pushes it to `ghcr.io/seiggy/holiday-recipe-book` on `main` (`latest`, `sha-…`) and `v*.*.*` tags (semver) using `GITHUB_TOKEN`.

```
docker run -p 8080:80 -e TANDOOR_URL=https://oge-recipes.seiggy.com ghcr.io/seiggy/holiday-recipe-book:latest
```

The nginx in the image serves the app and proxies `/api` and `/media` to `TANDOOR_URL` (default `https://oge-recipes.seiggy.com`). Build locally with `docker build -t holiday-recipe-book .`.

The npm registry comes from `.npmrc` (the Microsoft CFS feed). If a build environment can't reach it, set the repository variable `NPM_REGISTRY` (or pass `--build-arg NPM_REGISTRY=<url>`) to a reachable registry.
