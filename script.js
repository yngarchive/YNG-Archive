
// ---------- Image hosting (Cloudflare R2) ----------
// Once your R2 bucket is set up with public access (or a custom domain),
// paste its public base URL here, ending in a trailing slash.
// e.g. "https://pub-xxxxxxxx.r2.dev/" or "https://photos.yngarchive.com/"
const CDN_BASE_URL = "https://pub-ce6d23df189d423d955605600245ecb3.r2.dev/";

// Turns a plain filename/path into a full CDN url. Leaves local site
// assets (assets/...), full URLs, and data URIs untouched.
function resolveImage(path) {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("assets/")) {
    return path;
  }
  return CDN_BASE_URL + path;
}

// Any <img> with a filled-in data-cdn-src swaps its placeholder for the
// real CDN image automatically. Leave data-cdn-src empty to keep showing
// the placeholder mark until you have a real photo for that slot.
document.querySelectorAll("img[data-cdn-src]").forEach(img => {
  const path = img.getAttribute("data-cdn-src");
  if (path) {
    img.src = resolveImage(path);
    img.classList.remove("placeholder-photo");
  }
});

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const links = document.querySelectorAll(".site-nav a");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll(".year").forEach(el => {
  el.textContent = new Date().getFullYear();
});

// Randomize which photo lands in which rotation slot on every page load,
// so the carousel plays back in a different order each time.
document.querySelectorAll(".gallery-rotator").forEach(rotator => {
  const rotatorImgs = rotator.querySelectorAll("img");
  if (!rotatorImgs.length) return;
  const slotSeconds = Number(rotator.dataset.slotSeconds) || 3;
  const slots = Array.from({ length: rotatorImgs.length }, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  rotatorImgs.forEach((img, i) => {
    img.style.animationDelay = `${slots[i] * slotSeconds}s`;
  });
});

// ---------- Shared full-size image viewer ----------
// Used both by the album lightbox (Live Music, Events) and by direct
// photo galleries (Portraits, Creative).
const viewer = document.getElementById("image-viewer");
const pageShell = document.querySelector(".page-shell");
let currentPhotos = [];
let currentIndex = 0;
let viewerLastFocused = null;

let openViewer = () => {};
let closeViewer = () => {};
let showRelative = () => {};

if (viewer) {
  const viewerImg = viewer.querySelector(".viewer-image");
  const viewerClose = viewer.querySelector(".viewer-close");
  const viewerPrev = viewer.querySelector(".viewer-prev");
  const viewerNext = viewer.querySelector(".viewer-next");

  openViewer = (photos, index, altText) => {
    currentPhotos = photos;
    currentIndex = index;
    viewerImg.src = currentPhotos[currentIndex];
    viewerImg.alt = altText || "";
    const multi = currentPhotos.length > 1;
    viewerPrev.style.display = multi ? "" : "none";
    viewerNext.style.display = multi ? "" : "none";
    viewer.classList.add("open");
    if (pageShell) pageShell.classList.add("blurred");
    document.body.style.overflow = "hidden";
    viewerLastFocused = document.activeElement;
    viewerClose.focus();
  };

  closeViewer = () => {
    viewer.classList.remove("open");
    viewerImg.src = "";
    if (pageShell) pageShell.classList.remove("blurred");
    document.body.style.overflow = "";
    if (viewerLastFocused) viewerLastFocused.focus();
  };

  showRelative = delta => {
    if (currentPhotos.length < 2) return;
    currentIndex = (currentIndex + delta + currentPhotos.length) % currentPhotos.length;
    viewerImg.src = currentPhotos[currentIndex];
  };

  viewerClose.addEventListener("click", closeViewer);
  viewerPrev.addEventListener("click", () => showRelative(-1));
  viewerNext.addEventListener("click", () => showRelative(1));
  viewer.addEventListener("click", e => {
    if (e.target === viewer) closeViewer();
  });

  document.addEventListener("keydown", e => {
    if (viewer.classList.contains("open")) {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") showRelative(1);
      if (e.key === "ArrowLeft") showRelative(-1);
    }
  });
}

// ---------- Album lightbox (Live Music, Events) ----------
// Opens over a blurred backdrop showing an album's photos; clicking a
// thumbnail inside opens it full-size via the shared viewer above.
const lightbox = document.getElementById("lightbox");
let openAlbum = () => {};
let closeAlbum = () => {};

if (lightbox && pageShell) {
  const titleEl = lightbox.querySelector(".lightbox-title");
  const metaEl = lightbox.querySelector(".lightbox-meta");
  const gridEl = lightbox.querySelector(".lightbox-grid");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  let lastFocused = null;

  openAlbum = (title, photos) => {
    titleEl.textContent = title;
    metaEl.textContent = `${photos.length} photo${photos.length !== 1 ? "s" : ""}`;
    gridEl.innerHTML = "";
    photos.forEach((src, i) => {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "lightbox-thumb";
      thumb.setAttribute("aria-label", `View photo ${i + 1} full size`);
      const img = document.createElement("img");
      img.src = src;
      img.alt = title;
      thumb.appendChild(img);
      thumb.addEventListener("click", () => openViewer(photos, i, title));
      gridEl.appendChild(thumb);
    });

    lastFocused = document.activeElement;
    lightbox.classList.add("open");
    pageShell.classList.add("blurred");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };

  closeAlbum = () => {
    closeViewer();
    lightbox.classList.remove("open");
    pageShell.classList.remove("blurred");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  };

  closeBtn.addEventListener("click", closeAlbum);
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeAlbum();
  });

  document.addEventListener("keydown", e => {
    if (!viewer || !viewer.classList.contains("open")) {
      if (e.key === "Escape" && lightbox.classList.contains("open")) closeAlbum();
    }
  });
}

// ---------- Dynamic gallery loading (Live Music, Events, Portraits, Creative) ----------
// Reads whatever is actually in the R2 bucket via the gallery worker, so
// adding photos to the bucket is the only step needed to update the site
// — no code edits, ever.
//
// Once your worker is deployed, paste its URL here (see README.md).
const GALLERY_WORKER_URL = "https://yng-archive-gallery.trent-7f0.workers.dev";

const galleryMount = document.getElementById("gallery-mount");

if (galleryMount) {
  loadGallery(galleryMount);
}

async function loadGallery(mount) {
  const category = mount.dataset.category;
  const showCaptions = mount.dataset.captions === "true";
  const isAlbumStyle = !!lightbox;

  mount.innerHTML = '<p class="gallery-status">Loading photos\u2026</p>';

  let data;
  try {
    const res = await fetch(`${GALLERY_WORKER_URL}?category=${category}`);
    if (!res.ok) throw new Error("Bad response");
    data = await res.json();
  } catch (err) {
    mount.innerHTML = '<p class="gallery-status">Couldn\'t load photos right now \u2014 check back shortly.</p>';
    return;
  }

  const items = data.items || [];
  if (!items.length) {
    mount.innerHTML = '<p class="gallery-status">No photos here yet \u2014 check back soon.</p>';
    return;
  }

  mount.innerHTML = "";

  if (isAlbumStyle) {
    items.forEach((item, i) => {
      const photos = item.photos.map(resolveImage);

      const figure = document.createElement("figure");
      figure.className = "gallery-item";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-trigger";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = item.title;
      img.style.objectPosition = cropHintFor(item.photos[0]);
      markIfUltraWide(img, figure);
      img.src = photos[0];
      button.appendChild(img);
      figure.appendChild(button);

      const caption = document.createElement("figcaption");
      const titleSpan = document.createElement("span");
      titleSpan.textContent = item.title;
      const numSpan = document.createElement("span");
      numSpan.textContent = String(i + 1).padStart(2, "0");
      caption.appendChild(titleSpan);
      caption.appendChild(numSpan);
      figure.appendChild(caption);

      button.addEventListener("click", () => openAlbum(item.title, photos));
      mount.appendChild(figure);
    });
  } else {
    const allPhotos = items.map(item => resolveImage(item.photos[0]));
    items.forEach((item, i) => {
      const figure = document.createElement("figure");
      figure.className = "gallery-item";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "photo-trigger";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = item.title;
      markIfUltraWide(img, figure);
      img.src = allPhotos[i];
      button.appendChild(img);
      figure.appendChild(button);

      if (showCaptions) {
        const caption = document.createElement("figcaption");
        caption.className = "photo-caption";
        caption.textContent = item.title;
        figure.appendChild(caption);
      }

      button.addEventListener("click", () => openViewer(allPhotos, i, item.title));
      mount.appendChild(figure);
    });
  }
}

// Lets you control how a grid cover photo gets cropped by adding a suffix
// to the filename, since the site can't otherwise know what's important
// in any given photo. Works on the last filename segment before the
// extension: photo_top.jpg, photo_bottom.jpg, photo_left.jpg,
// photo_right.jpg. No suffix (or an unrecognized one) crops from the
// center, same as before.
function cropHintFor(key) {
  const filename = key.split("/").pop() || "";
  const stem = filename.replace(/\.[^.]+$/, "");
  const match = stem.match(/_(top|bottom|left|right)$/i);
  const positions = { top: "center top", bottom: "center bottom", left: "left center", right: "right center" };
  return match ? positions[match[1].toLowerCase()] : "center";
}

// Lets a genuinely panoramic/ultra-wide photo break out of the masonry
// grid and span the full row instead of being squeezed into one column.
// Checked once the image actually loads, since that's the only point the
// real aspect ratio is known.
const ULTRA_WIDE_RATIO = 2.2;

function markIfUltraWide(img, figure) {
  img.addEventListener("load", () => {
    if (img.naturalWidth / img.naturalHeight >= ULTRA_WIDE_RATIO) {
      figure.classList.add("featured-wide");
    }
  });
}
