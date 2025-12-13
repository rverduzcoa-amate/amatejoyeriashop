Image generation and client integration

This repository contains a Node script to generate responsive image variants (WebP/AVIF) and a manifest used by the client to serve optimized images and srcsets.

1) Install dependencies

```powershell
npm install
```

2) Generate responsive images

```powershell
npm run generate-images
```

This will scan `media/img` for JPG/PNG files and generate optimized variants under `media/optimized` and write `media/image-manifest.json`.

3) Deploy optimized images and manifest

- Copy the `media/optimized` folder and `media/image-manifest.json` to your static host.
- Ensure `media/image-manifest.json` is accessible at `/media/image-manifest.json` (the client fetches this path).

4) Client behaviour

- On load the client fetches `/media/image-manifest.json` and caches it in `window.imageManifest`.
- When rendering product lists, the client builds `picture` elements that prefer AVIF/WebP srcsets and falls back to the default image.
- Offscreen images are deferred via `IntersectionObserver` and a tiny placeholder to avoid simultaneous downloads.

Notes & recommendations

- Run the generator on a machine with enough memory; `sharp` uses native bindings and can be CPU-intensive when processing many files.
- Consider uploading `media/optimized` to a CDN for faster delivery.
- You can tune `SIZES` and `FORMATS` inside `tools/generate_responsive_images.js` to match your needs.

If you want, I can also:
- Add a small script to upload `media/optimized` to a specific CDN (S3/CloudFront, Netlify, etc.).
- Extend the manifest with exact variant URLs that include a CDN base URL.
