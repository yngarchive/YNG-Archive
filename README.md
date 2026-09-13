# YNG Archive multi-page website

This version includes:

- Home page
- Main Gallery page
- Live Music gallery
- Events gallery
- Portraits gallery
- Creative gallery

## Previewing the website

Double-click `index.html`.

## How the galleries work

The Live Music, Events, Portraits, and Creative pages load their photos **automatically** from your Cloudflare R2 bucket — you don't edit any HTML to add new photos. Upload a photo to the bucket, refresh the site, it's there.

This is powered by a small Cloudflare Worker (`cloudflare-worker/gallery-worker.js`) that reads your bucket's folder contents and hands the list to the site. See "Connecting the gallery worker" below — it's a one-time setup.

### Folder convention inside the bucket

- **Portraits and Creative** (single photos): just drop files straight into the folder.

      portraits/some-photo.jpg
      creative/double-exposure.jpg

  The filename (cleaned up) becomes the caption on Creative. Portraits has no caption.

- **Live Music and Events** (albums/shows): put each show in its own subfolder.

      live-music/2025-11-14_The-Hollow-Room_Basement-Static/01.jpg
      live-music/2025-11-14_The-Hollow-Room_Basement-Static/02.jpg

  The subfolder name becomes the album title shown on the site. Segments split on `_`, dashes become spaces — so the folder above displays as "2025 11 14 — The Hollow Room — Basement Static". Name folders however reads best to you; this is just the default the worker uses.

- **Sort order** is alphabetical/numeric by filename or folder name. Prefix filenames with numbers (`01.jpg`, `02.jpg`) or folders with dates (`YYYY-MM-DD_...`) to control the order things appear in.

- Supported file types: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.

### Fixing a bad crop on a specific photo

Live Music and Events album covers (and Live Music/Events grid thumbnails generally) are cropped to a fixed box, which can occasionally cut off something important in a photo. If that happens, rename the file to end in `_top`, `_bottom`, `_left`, or `_right` (before the extension) to tell the site which edge to crop from instead of the default center — e.g. `01.jpg` → `01_top.jpg` crops from the top down instead of the middle out. Re-upload with the new name (R2 has no rename, so this means delete-and-reupload, same as any other R2 file change).

## Connecting Cloudflare R2

1. Create an R2 bucket in your Cloudflare dashboard.
2. Enable public access on the bucket (the free `r2.dev` subdomain is fine to start; a custom domain like `photos.yngarchive.com` is better for a live production site — see Cloudflare's docs on custom domains for R2).
3. Upload your photos following the folder convention above.
4. Open `script.js` and set `CDN_BASE_URL` near the top to your bucket's public URL, ending in a slash:

       const CDN_BASE_URL = "https://pub-xxxxxxxx.r2.dev/";

## Connecting the gallery worker

This is the one manual step that makes the galleries load automatically. Takes about 5 minutes, once.

1. In the Cloudflare dashboard, go to **Workers & Pages** > **Create** > **Create Worker**.
2. Give it a name (e.g. `yng-archive-gallery`) and deploy the default template.
3. Click **Edit code**, delete everything in the editor, and paste in the full contents of `cloudflare-worker/gallery-worker.js` from this folder.
4. Click **Deploy** (or Save and Deploy).
5. Go to the Worker's **Settings** > **Bindings** > **Add binding** > **R2 Bucket**. Set the variable name to exactly `PHOTOS`, and select your photo bucket. Save.
6. Copy the Worker's URL — it'll look like `https://yng-archive-gallery.<your-subdomain>.workers.dev`.
7. Open `script.js`, find `GALLERY_WORKER_URL` near the bottom, and paste your Worker's URL in (no trailing slash needed).

That's it. From now on, adding a photo to the bucket is the only step needed — the site picks it up on the next page load, no code changes.

### If a gallery page looks empty or shows an error

- Double-check the R2 binding variable name is exactly `PHOTOS` (case-sensitive) — the worker code expects that name specifically.
- Make sure photos are inside a folder matching the page (`live-music/`, `events/`, `portraits/`, `creative/`).
- Check `GALLERY_WORKER_URL` in `script.js` doesn't have a trailing slash and matches your Worker's actual URL exactly.

## Other static photo spots

A few spots on the site are still simple, one-off placeholders rather than dynamic galleries — the small preview photo on each gallery "folder card" (on the Home and Gallery pages), and the About page portrait. These use:

    <img class="placeholder-photo" data-cdn-src="" src="assets/logo-alt.svg" alt="...">

Fill in `data-cdn-src` with a path inside your R2 bucket (or point `src` at a local file in `images/`) and the site swaps it in automatically.

## Before publishing

Change:

- `trent@yngarchive.com`
- The Instagram and Facebook links
- Sample text

## Free hosting

Upload the full folder to GitHub and connect it to Cloudflare Pages, GitHub Pages or Netlify.
