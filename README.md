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

## Replacing sample photos

Photos are hosted separately on Cloudflare R2 (not stored in this repo), so the site stays small on GitHub no matter how many photos you add. See "Connecting Cloudflare R2" below to set that up — once it's done, adding a photo is just filling in one attribute.

Every placeholder photo in the HTML looks like this:

    <img class="placeholder-photo" data-cdn-src="" src="assets/logo-alt.svg" alt="...">

To swap in a real photo, upload it to your R2 bucket, then fill in `data-cdn-src` with its path inside the bucket:

    <img class="placeholder-photo" data-cdn-src="live-music/show-01.jpg" src="assets/logo-alt.svg" alt="...">

The site's script automatically swaps the placeholder for the real photo and removes the placeholder styling — you don't need to touch `src` or remove any classes yourself.

For the Live Music album lightbox specifically, each `<button class="gallery-trigger">` has a `data-photos` attribute listing that album's photos. Replace the placeholder entries with real R2 paths the same way:

    data-photos='["live-music/basement-static-01.jpg","live-music/basement-static-02.jpg"]'

## Connecting Cloudflare R2

1. Create an R2 bucket in your Cloudflare dashboard.
2. Enable public access on the bucket (either the free `r2.dev` subdomain, or a custom domain like `photos.yngarchive.com`).
3. Upload your photos into the bucket — folders like `live-music/`, `events/`, `portraits/`, `creative/` keep things organized, matching the site's gallery names.
4. Open `script.js` and set `CDN_BASE_URL` near the top to your bucket's public URL, ending in a slash:

       const CDN_BASE_URL = "https://pub-xxxxxxxx.r2.dev/";

5. From then on, every `data-cdn-src` and `data-photos` path is just the filename/folder inside the bucket — the site builds the full URL for you.

Local image folders (`images/live-music`, etc.) are still here if you'd rather host a few photos directly in the repo instead — just point `src` at those instead of using `data-cdn-src`.

## Adding more gallery folders

1. Duplicate one of the gallery pages, such as `portraits.html`.
2. Rename it, for example `street.html`.
3. Change the page title and heading.
4. Add a new folder inside `images`.
5. Add a new folder card to `gallery.html`.
6. Optionally add it to the homepage folder grid.

## Before publishing

Change:

- `trent@yngarchive.com`
- The Instagram and Facebook links
- Sample text
- Sample photos

## Free hosting

Upload the full folder to GitHub and connect it to Cloudflare Pages, GitHub Pages or Netlify.
