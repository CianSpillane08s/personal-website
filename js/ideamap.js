/*
  Idea map: a small hand-written force-directed graph (no libraries).
  Books are dots, themes are words; each book is pulled towards the
  themes it belongs to, and everything pushes everything else apart.

  IdeaMap(element, { themes, books, onTheme(key), onBook(id), caption, hint })
  returns { setActive(themeKey | null) }
*/
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STATUS = { read: "read", reading: "reading now", next: "up next" };

  // small deterministic PRNG so the layout looks the same on every visit
  function seeded(seed) {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  }

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  window.IdeaMap = function (root, opts) {
    const themes = opts.themes, books = opts.books;
    const caption = opts.caption;
    const hint = opts.hint || "";
    const rand = seeded(7);

    let W = Math.max(root.clientWidth, 280);
    let H = heightFor(W);
    function heightFor(w) { return w < 520 ? 380 : 330; }

    const svg = el("svg", { class: "ideamap", viewBox: `0 0 ${W} ${H}`, role: "group",
      "aria-label": "Map of books and the ideas they connect to" });
    svg.style.height = H + "px";
    root.appendChild(svg);
    const gLinks = el("g", { class: "links" }, svg);
    const gNodes = el("g", { class: "nodes" }, svg);
    const tip = el("text", { class: "tip", "text-anchor": "middle" }, svg);

    // ---------- build graph ----------
    const nodes = [], links = [], byId = {};
    const keys = Object.keys(themes);

    // themes sit on an ellipse ("anchors") and stay put unless dragged;
    // only the books float between them
    function ring(i) {
      const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / keys.length;
      return { x: W / 2 + Math.cos(a) * Math.min(W * 0.33, W / 2 - 62), y: H / 2 + Math.sin(a) * H * 0.4 };
    }
    keys.forEach((k, i) => {
      const p = ring(i);
      const n = { id: "t:" + k, key: k, kind: "theme", label: themes[k],
        x: p.x, y: p.y, ax: p.x, ay: p.y,
        vx: 0, vy: 0, mass: Infinity, rx: 30, ry: 9, nb: new Set() };
      nodes.push(n); byId[n.id] = n;
    });

    books.forEach((b) => {
      const ts = (b.themes || []).map((t) => byId["t:" + t]).filter(Boolean);
      const cx = ts.length ? ts.reduce((s, t) => s + t.x, 0) / ts.length : W / 2;
      const cy = ts.length ? ts.reduce((s, t) => s + t.y, 0) / ts.length : H / 2;
      const n = { id: "b:" + b.id, key: b.id, kind: "book", book: b, label: b.title,
        x: cx + (rand() - 0.5) * 60, y: cy + (rand() - 0.5) * 60,
        vx: 0, vy: 0, mass: 1, rx: 7, ry: 7, nb: new Set() };
      nodes.push(n); byId[n.id] = n;
      ts.forEach((t) => {
        links.push({ s: n, t, line: el("line", {}, gLinks) });
        n.nb.add(t); t.nb.add(n);
      });
    });

    // ---------- draw nodes ----------
    nodes.forEach((n) => {
      const g = el("g", { class: `node ${n.kind}${n.book ? " " + n.book.status : ""}`,
        tabindex: 0, role: "button" }, gNodes);
      n.g = g;
      if (n.kind === "theme") {
        const t = el("text", { "text-anchor": "middle", dy: "0.35em" }, g);
        t.textContent = n.label;
        g.setAttribute("aria-label", `${n.label}: show books about this`);
      } else {
        el("circle", { class: "hit", r: 14 }, g);
        if (n.book.status === "reading") el("circle", { class: "pulse", r: 5 }, g);
        el("circle", { class: "dot", r: 5 }, g);
        g.setAttribute("aria-label", `${n.book.title} by ${n.book.author}, ${STATUS[n.book.status]}`);
      }
    });

    // measure theme labels once they are in the DOM, for collisions
    function measure() {
      nodes.forEach((n) => {
        if (n.kind !== "theme") return;
        let w = 0;
        try { w = n.g.getBBox().width; } catch (e) {}
        n.rx = (w || n.label.length * 7) / 2 + 6;
      });
    }
    measure();

    // ---------- physics ----------
    let alpha = 1, alphaTarget = 0, running = false, dragged = null;

    const isFixed = (n) => n === dragged || n.kind === "theme";

    function tick() {
      const linkLen = W < 520 ? 34 : 44;
      const charge = W < 520 ? 260 : 420;

      // themes ease back towards their anchor (an anchor moves when you drop a theme)
      for (const n of nodes) {
        if (n.kind !== "theme" || n === dragged) continue;
        n.x += (n.ax - n.x) * 0.2; n.y += (n.ay - n.y) * 0.2;
      }

      // books push each other apart, and are nudged off theme labels
      // (n is tiny, so checking every pair is fine)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          if (isFixed(a) && isFixed(b)) continue;
          let dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy + 0.01;
          if (d2 > 160 * 160) continue;
          const k = ((a.kind === b.kind ? charge : charge * 0.5) * alpha) / d2;
          const d = Math.sqrt(d2);
          dx /= d; dy /= d;
          if (!isFixed(a)) { a.vx -= dx * k; a.vy -= dy * k; }
          if (!isFixed(b)) { b.vx += dx * k; b.vy += dy * k; }
        }
      }

      // springs pull each book towards the themes it belongs to
      for (const l of links) {
        if (l.s === dragged) continue;
        const dx = l.t.x - l.s.x, dy = l.t.y - l.s.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (Math.max(0, d - linkLen) / d) * 0.06 * alpha;
        l.s.vx += dx * f; l.s.vy += dy * f;
      }

      // a slight pull to the middle so the shelf reads as one cluster
      for (const n of nodes) {
        if (isFixed(n)) continue;
        n.vx += (W / 2 - n.x) * 0.035 * alpha;
        n.vy += (H / 2 - n.y) * 0.035 * alpha;
      }

      // integrate
      for (const n of nodes) {
        if (isFixed(n)) { n.vx = n.vy = 0; continue; }
        n.vx *= 0.6; n.vy *= 0.6;
        n.x += n.vx; n.y += n.vy;
      }

      // box collisions (labels are wide, dots are round-ish), then keep in bounds
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const ox = a.rx + b.rx + 3 - Math.abs(dx);
            const oy = a.ry + b.ry + 3 - Math.abs(dy);
            if (ox <= 0 || oy <= 0) continue;
            if (isFixed(a) && isFixed(b)) continue;
            const wa = isFixed(a) ? 0 : isFixed(b) ? 1 : 0.5;
            const wb = 1 - wa;
            if (ox < oy) {
              const s = dx < 0 ? -1 : 1;
              a.x -= s * ox * wa; b.x += s * ox * wb;
            } else {
              const s = dy < 0 ? -1 : 1;
              a.y -= s * oy * wa; b.y += s * oy * wb;
            }
          }
        }
      }
      for (const n of nodes) {
        n.x = Math.max(n.rx + 2, Math.min(W - n.rx - 2, n.x));
        n.y = Math.max(n.ry + 4, Math.min(H - n.ry - 4, n.y));
      }

      alpha += (alphaTarget - alpha) * 0.025;
    }

    function render() {
      for (const l of links) {
        l.line.setAttribute("x1", l.s.x.toFixed(1)); l.line.setAttribute("y1", l.s.y.toFixed(1));
        l.line.setAttribute("x2", l.t.x.toFixed(1)); l.line.setAttribute("y2", l.t.y.toFixed(1));
      }
      for (const n of nodes) n.g.setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
      if (tipNode) placeTip(tipNode);
    }

    function loop() {
      tick(); render();
      if (alpha > 0.004 || dragged) requestAnimationFrame(loop);
      else running = false;
    }

    function heat(a) {
      alpha = Math.max(alpha, a);
      if (reduceMotion && !dragged) { settle(); return; }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }

    function settle() {
      for (let i = 0; i < 400 && alpha > 0.002; i++) tick();
      render();
    }

    // ---------- highlighting ----------
    let focused = null, sticky = null, tipNode = null;

    function highlight(n) {
      focused = n;
      svg.classList.toggle("has-focus", !!n);
      for (const m of nodes) m.g.classList.toggle("on", !!n && (m === n || n.nb.has(m)));
      for (const l of links) l.line.classList.toggle("on", !!n && (l.s === n || l.t === n));
      showTip(n && n.kind === "book" ? n : null);
      if (caption) caption.innerHTML = n ? describe(n) : hint;
    }

    function describe(n) {
      if (n.kind === "theme") {
        const c = [...n.nb].length;
        return `<strong>${n.label}</strong> · ${c} book${c === 1 ? "" : "s"}`;
      }
      const b = n.book;
      const ts = [...n.nb].map((t) => t.label).join(", ");
      return `<strong><em>${b.title}</em></strong> · ${b.author} · ${STATUS[b.status]}<br><span>${ts}</span>`;
    }

    function showTip(n) {
      tipNode = n;
      tip.style.display = n ? "" : "none";
      if (n) { tip.textContent = n.label; placeTip(n); }
    }

    function placeTip(n) {
      let x = n.x, y = n.y - 13;
      if (y < 14) y = n.y + 24;
      tip.setAttribute("x", x); tip.setAttribute("y", y);
      let w = 0;
      try { w = tip.getBBox().width; } catch (e) {}
      x = Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, x));
      tip.setAttribute("x", x.toFixed(1));
    }

    function activate(n) {
      if (n.kind === "theme" && opts.onTheme) opts.onTheme(n.key);
      if (n.kind === "book" && opts.onBook) opts.onBook(n.key);
    }

    // ---------- pointer + keyboard ----------
    function toLocal(e) {
      const r = svg.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }

    let press = null;
    nodes.forEach((n) => {
      const g = n.g;
      g.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !press) highlight(n); });
      g.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !press) highlight(sticky); });
      g.addEventListener("focus", () => highlight(n));
      g.addEventListener("blur", () => highlight(sticky));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(n); }
      });
      g.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        g.setPointerCapture(e.pointerId);
        const p = toLocal(e);
        press = { n, id: e.pointerId, sx: p.x, sy: p.y, ox: n.x - p.x, oy: n.y - p.y, moved: false, type: e.pointerType };
      });
      g.addEventListener("pointermove", (e) => {
        if (!press || press.id !== e.pointerId) return;
        const p = toLocal(e);
        if (!press.moved && Math.hypot(p.x - press.sx, p.y - press.sy) > 4) {
          press.moved = true; dragged = n; svg.classList.add("dragging");
          highlight(n); alphaTarget = 0.25; heat(0.25);
        }
        if (press.moved) { n.x = p.x + press.ox; n.y = p.y + press.oy; if (reduceMotion) { tick(); render(); } }
      });
      const end = (e) => {
        if (!press || press.id !== e.pointerId) return;
        const wasDrag = press.moved, type = press.type;
        if (wasDrag && n.kind === "theme") { n.ax = n.x; n.ay = n.y; }
        press = null; dragged = null; alphaTarget = 0;
        svg.classList.remove("dragging");
        if (wasDrag) { heat(0.15); highlight(type === "mouse" ? n : sticky); return; }
        if (e.type === "pointercancel") return;
        // touch: first tap previews, second tap opens
        if (type !== "mouse" && focused !== n) highlight(n);
        else activate(n);
      };
      g.addEventListener("pointerup", end);
      g.addEventListener("pointercancel", end);
    });

    svg.addEventListener("pointerdown", (e) => { if (e.target === svg) highlight(sticky); });

    // ---------- resize ----------
    new ResizeObserver(() => {
      const w = Math.max(root.clientWidth, 280);
      if (Math.abs(w - W) < 2) return;
      const h = heightFor(w);
      nodes.forEach((n) => {
        n.x *= w / W; n.y *= h / H;
        if (n.kind === "theme") { n.ax *= w / W; n.ay *= h / H; }
      });
      W = w; H = h;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.style.height = H + "px";
      measure(); heat(0.3);
    }).observe(root);

    // ---------- start: bloom out from the centre once it scrolls into view ----------
    highlight(null);
    if (reduceMotion) {
      settle();
    } else {
      nodes.forEach((n) => { n.x = W / 2 + (n.x - W / 2) * 0.15; n.y = H / 2 + (n.y - H / 2) * 0.15; });
      render();
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); heat(1); }
      }, { threshold: 0.25 });
      io.observe(svg);
    }

    return {
      setActive(key) {
        sticky = key ? byId["t:" + key] : null;
        highlight(sticky);
      },
    };
  };
})();
