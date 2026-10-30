// Renders the Books page from js/books.js and wires it to the idea map.
(function () {
  const shelf = document.getElementById("shelf");
  const filterBar = document.getElementById("filter");
  const SECTIONS = [
    ["reading", "Reading now"],
    ["read", "Read"],
    ["next", "Up next"],
  ];

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function notesHTML(b) {
    const raw = (b.notes || "").trim();
    if (!raw) return b.status === "read" ? `<p class="notes empty">No notes yet.</p>` : "";
    if (/<[a-z]/i.test(raw)) return `<div class="notes">${raw}</div>`;
    return `<div class="notes">${raw.split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join("")}</div>`;
  }

  function coverHTML(b) {
    if (b.cover) return `<img class="cover" src="${b.cover}" alt="" width="64" height="96" loading="lazy">`;
    return `<div class="cover blank" aria-hidden="true"><span>${esc(b.title)}</span></div>`;
  }

  function bookHTML(b) {
    const stars = b.rating ? ` · <span class="stars" aria-label="${b.rating} out of 5">${"★".repeat(b.rating)}${"☆".repeat(5 - b.rating)}</span>` : "";
    const tags = (b.themes || []).map((t) => THEMES[t]).filter(Boolean).join(" · ");
    return `
      <article class="book" id="${b.id}" data-themes="${(b.themes || []).join(" ")}">
        ${coverHTML(b)}
        <div class="book-body">
          <h3>${esc(b.title)}</h3>
          <div class="meta">${esc(b.author)}${stars}</div>
          ${notesHTML(b)}
          <div class="tags">${tags}</div>
        </div>
      </article>`;
  }

  shelf.innerHTML = SECTIONS.map(([status, label]) => {
    const list = BOOKS.filter((b) => b.status === status);
    if (!list.length) return "";
    return `<section data-status="${status}">
      <h2>${label} <span class="count">${list.length}</span></h2>
      ${list.map(bookHTML).join("")}
    </section>`;
  }).join("");

  // ---------- filtering ----------
  let active = null;

  function setTheme(key, push) {
    active = key && THEMES[key] ? key : null;
    shelf.querySelectorAll(".book").forEach((el) => {
      el.hidden = !!active && !el.dataset.themes.split(" ").includes(active);
    });
    shelf.querySelectorAll("section").forEach((s) => {
      const visible = s.querySelectorAll(".book:not([hidden])").length;
      s.hidden = visible === 0;
      s.querySelector(".count").textContent = visible;
    });
    filterBar.hidden = !active;
    if (active) filterBar.querySelector("strong").textContent = THEMES[active];
    map.setActive(active);
    if (push) history.replaceState(null, "", active ? "#theme=" + active : location.pathname);
  }

  function goToBook(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.hidden) setTheme(null, true);
    el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    history.replaceState(null, "", "#" + id);
  }

  const map = IdeaMap(document.getElementById("map"), {
    themes: THEMES,
    books: BOOKS,
    caption: document.getElementById("map-caption"),
    hint: "Hover or tap a dot to see the book. Click an idea to filter the shelf. You can drag things around.",
    onTheme: (k) => setTheme(active === k ? null : k, true),
    onBook: goToBook,
  });

  filterBar.querySelector("button").addEventListener("click", () => setTheme(null, true));

  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h.startsWith("theme=")) setTheme(h.slice(6), false);
    else if (h) goToBook(h);
  }
  fromHash();
  addEventListener("hashchange", fromHash);
})();
