/**
 * YNG Archive — gallery listing worker
 *
 * Reads photo filenames/folders straight out of the R2 bucket and returns
 * them as JSON, so the website can build each gallery page from whatever
 * is actually in the bucket — no manual editing needed when you add photos.
 *
 * Setup (see README.md "Connecting the gallery worker" section for the
 * full walkthrough):
 *   1. Create a Worker in the Cloudflare dashboard, paste this file in.
 *   2. Bind your R2 bucket to it with the variable name PHOTOS.
 *   3. Copy the Worker's URL into GALLERY_WORKER_URL in script.js.
 *
 * Folder convention inside the bucket:
 *   - Flat photos (Portraits, Creative):
 *       portraits/some-photo.jpg            -> one gallery item
 *   - Albums (Live Music, Events) — put each show in its own subfolder:
 *       live-music/2025-11-14_The-Hollow-Room_Basement-Static/01.jpg
 *       live-music/2025-11-14_The-Hollow-Room_Basement-Static/02.jpg
 *     The subfolder name becomes the album title. Split it on "_" into
 *     segments, then swap "-" for spaces in each segment — so the folder
 *     above displays as "2025 11 14 — The Hollow Room — Basement Static".
 *     A cleaner date format needs a small tweak, this is intentionally simple.
 *
 * Sort order: alphabetical/numeric by filename or folder name. Prefix
 * filenames with numbers (01.jpg, 02.jpg) or folders with dates
 * (YYYY-MM-DD_...) to control display order.
 */

const ALLOWED_CATEGORIES = ["live-music", "events", "portraits", "creative"];
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return withCors(jsonResponse({ error: "Missing or invalid ?category=" }, 400));
    }

    const prefix = `${category}/`;
    const keys = [];
    let cursor;

    do {
      const listed = await env.PHOTOS.list({ prefix, cursor, limit: 1000 });
      for (const obj of listed.objects) keys.push(obj.key);
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    const imageKeys = keys.filter(key => IMAGE_EXTENSIONS.test(key));

    const groups = new Map();
    for (const key of imageKeys) {
      const rest = key.slice(prefix.length);
      const parts = rest.split("/");

      if (parts.length === 1) {
        const slug = parts[0].replace(/\.[^.]+$/, "");
        groups.set(key, { slug, title: titleize(slug), photos: [key] });
      } else {
        const albumSlug = parts[0];
        if (!groups.has(albumSlug)) {
          groups.set(albumSlug, { slug: albumSlug, title: titleize(albumSlug), photos: [] });
        }
        groups.get(albumSlug).photos.push(key);
      }
    }

    const items = Array.from(groups.values()).map(item => ({
      ...item,
      photos: item.photos.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    }));

    items.sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));

    return withCors(jsonResponse({ category, items }));
  },
};

function titleize(slug) {
  return slug
    .split("_")
    .map(segment => segment.replace(/-/g, " ").trim())
    .filter(Boolean)
    .join(" — ");
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Cache-Control", "public, max-age=120");
  return new Response(response.body, { status: response.status, headers });
}
