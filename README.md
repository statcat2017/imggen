## Deploy

```bash
# On the VPS
git pull
docker compose up -d --build
```

## DNS

Create an A record:

```
imggen.statcat.co.uk → <VPS IP>
```

## Caddy (on VPS, not in this repo)

Add to your existing Caddyfile:

```caddy
imggen.statcat.co.uk {
    reverse_proxy localhost:3000
}
```

Caddy auto-provisions the TLS certificate. The app container only listens on `127.0.0.1:3000` — zero public exposure.
