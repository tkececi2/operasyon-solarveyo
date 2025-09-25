# SolarVeyo — Arıza Takip (Vite + React 18 + TypeScript)

## Geliştirme
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
```
Çıktı `dist/` klasörüne alınır.

## Netlify Yayın
- `netlify.toml` ve `public/_redirects` SPA yönlendirmeleri için hazır.
- Netlify üzerinde Build command: `npm run build`, Publish directory: `dist`

## GitHub’a Push
```bash
git init
git add .
git commit -m "chore: pricing & hero görseli, bildirim refactor, netlify config"
git branch -M main
git remote add origin <REPO_URL>
git push -u origin main
```
