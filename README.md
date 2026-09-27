# Ritik Gupta — Portfolio

A static personal portfolio built with plain HTML, CSS and JavaScript. There is no build step, so GitHub Pages can serve it as is.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy to GitHub Pages (free)

1. Create a **public** repository named `ritikgupta1220.github.io` (use your exact GitHub username).
2. Push the contents of this folder to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<username>/<username>.github.io.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages → Build and deployment**. Set Source to *Deploy from a branch* and Branch to `main` / `(root)`.
4. After about a minute the site is live at `https://<username>.github.io`.

### Custom domain (optional)
In **Settings → Pages → Custom domain**, enter your domain. At your DNS provider, add a `CNAME` record pointing to `<username>.github.io`, then tick **Enforce HTTPS**.

## Editing content
- All text is in `index.html`, one `<section>` per page section.
- Colors and fonts are CSS variables at the top of `styles.css`, with separate `dark` and `light` blocks.
- Replace `assets/Ritik_Gupta_Resume.pdf` to update the downloadable résumé.
