
// ---------- Image hosting (Cloudflare R2) ----------
// Once your R2 bucket is set up with public access (or a custom domain),
// paste its public base URL here, ending in a trailing slash.
// e.g. "https://pub-xxxxxxxx.r2.dev/" or "https://photos.yngarchive.com/"
const CDN_BASE_URL = "https://REPLACE-WITH-YOUR-R2-PUBLIC-URL/";

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
const rotatorImgs = document.querySelectorAll(".gallery-rotator img");
if (rotatorImgs.length) {
  const slotSeconds = 3;
  const slots = Array.from({ length: rotatorImgs.length }, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  rotatorImgs.forEach((img, i) => {
    img.style.animationDelay = `${slots[i] * slotSeconds}s`;
  });
}

// Album lightbox — opens over a blurred backdrop when a gallery photo is clicked
const galleryTriggers = document.querySelectorAll(".gallery-trigger");
const lightbox = document.getElementById("lightbox");
const pageShell = document.querySelector(".page-shell");

if (galleryTriggers.length && lightbox && pageShell) {
  const titleEl = lightbox.querySelector(".lightbox-title");
  const metaEl = lightbox.querySelector(".lightbox-meta");
  const gridEl = lightbox.querySelector(".lightbox-grid");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  let lastFocused = null;
  let currentPhotos = [];

  const viewer = document.getElementById("image-viewer");
  const viewerImg = viewer ? viewer.querySelector(".viewer-image") : null;
  const viewerClose = viewer ? viewer.querySelector(".viewer-close") : null;
  const viewerPrev = viewer ? viewer.querySelector(".viewer-prev") : null;
  const viewerNext = viewer ? viewer.querySelector(".viewer-next") : null;
  let currentIndex = 0;

  function openViewer(index) {
    if (!viewer || !currentPhotos.length) return;
    currentIndex = index;
    viewerImg.src = currentPhotos[currentIndex];
    viewerImg.alt = titleEl.textContent;
    viewer.classList.add("open");
    viewerClose.focus();
  }

  function closeViewer() {
    if (!viewer) return;
    viewer.classList.remove("open");
    viewerImg.src = "";
  }

  function showRelative(delta) {
    if (!currentPhotos.length) return;
    currentIndex = (currentIndex + delta + currentPhotos.length) % currentPhotos.length;
    viewerImg.src = currentPhotos[currentIndex];
  }

  function openAlbum(trigger) {
    const band = trigger.dataset.band || "";
    const venue = trigger.dataset.venue || "";
    const date = trigger.dataset.date || "";
    try { currentPhotos = JSON.parse(trigger.dataset.photos || "[]").map(resolveImage); } catch (e) { currentPhotos = []; }

    titleEl.textContent = band;
    metaEl.textContent = [venue, date].filter(Boolean).join(" — ");
    gridEl.innerHTML = "";
    currentPhotos.forEach((src, i) => {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "lightbox-thumb";
      thumb.setAttribute("aria-label", `View photo ${i + 1} full size`);
      const img = document.createElement("img");
      img.src = src;
      img.alt = band;
      thumb.appendChild(img);
      thumb.addEventListener("click", () => openViewer(i));
      gridEl.appendChild(thumb);
    });

    lastFocused = document.activeElement;
    lightbox.classList.add("open");
    pageShell.classList.add("blurred");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeAlbum() {
    closeViewer();
    lightbox.classList.remove("open");
    pageShell.classList.remove("blurred");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  galleryTriggers.forEach(trigger => {
    trigger.addEventListener("click", () => openAlbum(trigger));
  });

  closeBtn.addEventListener("click", closeAlbum);
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeAlbum();
  });

  if (viewer) {
    viewerClose.addEventListener("click", closeViewer);
    viewerPrev.addEventListener("click", () => showRelative(-1));
    viewerNext.addEventListener("click", () => showRelative(1));
    viewer.addEventListener("click", e => {
      if (e.target === viewer) closeViewer();
    });
  }

  document.addEventListener("keydown", e => {
    if (viewer && viewer.classList.contains("open")) {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") showRelative(1);
      if (e.key === "ArrowLeft") showRelative(-1);
      return;
    }
    if (e.key === "Escape" && lightbox.classList.contains("open")) closeAlbum();
  });
}
