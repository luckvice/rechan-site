// ReChan · landing page: menu, capturas do PSP, lightbox e gráficos SVG.
(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // ---------- menu móvel ----------
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));
    links.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  // ---------- capturas do PSP ----------
  const pspShot = document.getElementById("psp-shot");
  document.querySelectorAll(".psp-switch button").forEach((btn, _, all) => {
    btn.addEventListener("click", () => {
      all.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      pspShot.src = btn.dataset.shot;
      pspShot.alt = btn.dataset.alt;
    });
  });

  // ---------- lightbox ----------
  const box = document.getElementById("lightbox");
  if (box && typeof box.showModal === "function") {
    const img = box.querySelector("img");
    const cap = box.querySelector(".lightbox-caption");
    document.querySelectorAll(".shot").forEach((shot) => {
      shot.addEventListener("click", () => {
        img.src = shot.dataset.full;
        img.alt = shot.querySelector("img").alt;
        cap.textContent = shot.dataset.caption;
        box.showModal();
      });
    });
    box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  }

  // ---------- gráficos ----------
  const el = (name, attrs = {}, text) => {
    const node = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    return node;
  };

  // Barra vertical: ponta arredondada de 4px, base reta.
  const colPath = (x, y, w, y0, r = 4) => {
    const rr = Math.min(r, w / 2, Math.max(0, y0 - y));
    return `M${x},${y0}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y0}Z`;
  };
  // Barra horizontal: ponta direita arredondada, base reta.
  const barPath = (x0, x1, y, h, r = 4) => {
    const rr = Math.min(r, h / 2, Math.max(0, x1 - x0));
    return `M${x0},${y}H${x1 - rr}Q${x1},${y} ${x1},${y + rr}V${y + h - rr}Q${x1},${y + h} ${x1 - rr},${y + h}H${x0}Z`;
  };

  const css = getComputedStyle(document.documentElement);
  const token = (name) => css.getPropertyValue(name).trim();

  function makeTooltip(host) {
    const tip = document.createElement("div");
    tip.className = "tooltip";
    tip.setAttribute("role", "status");
    host.appendChild(tip);
    return {
      show(html, x, y) { tip.innerHTML = html; tip.style.left = `${x}px`; tip.style.top = `${y}px`; tip.classList.add("show"); },
      hide() { tip.classList.remove("show"); },
    };
  }

  function bindHit(hit, tip, html, x, y) {
    const show = () => tip.show(html, x, y);
    hit.addEventListener("pointerenter", show);
    hit.addEventListener("pointerleave", () => tip.hide());
  }

  // FPS médio por rodada (série única).
  function drawRounds(host) {
    const data = [
      { label: "Base", sub: "2c9d3a7", fps: 29.1, p95: 48.6 },
      { label: "VBlank", sub: "adiado", fps: 34.4, p95: 40.2 },
      { label: "Perfil 1", sub: "", fps: 35.5, p95: 34.9 },
      { label: "Perfil 2", sub: "", fps: 38.3, p95: 33.4 },
      { label: "Perfil 3", sub: "atual", fps: 38.9, p95: 32.8 },
    ];
    const W = Math.max(280, host.clientWidth);
    const H = 270;
    const m = { l: 30, r: 8, t: 30, b: 46 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    const max = 60;
    const y = (v) => m.t + ih - (v / max) * ih;
    const y0 = y(0);

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, height: H, "aria-hidden": "true" });
    for (const t of [0, 15, 30, 45]) {
      svg.append(el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), stroke: token("--chart-grid"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
      svg.append(el("text", { class: "tick", x: m.l - 8, y: y(t) + 4, "text-anchor": "end" }, String(t)));
    }
    // Meta de 60 FPS, ainda não atingida.
    svg.append(el("line", { x1: m.l, x2: W - m.r, y1: y(60), y2: y(60), stroke: token("--wip"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
    svg.append(el("text", { class: "tick", x: m.l - 8, y: y(60) + 4, "text-anchor": "end" }, "60"));
    svg.append(el("text", { class: "goal", x: W - m.r, y: y(60) - 8, "text-anchor": "end" }, "Meta: 60 FPS"));

    const tip = makeTooltip(host);
    const band = iw / data.length;
    const bw = Math.min(24, band * 0.5);
    data.forEach((d, i) => {
      const cx = m.l + band * i + band / 2;
      const top = y(d.fps);
      const hit = el("rect", { class: "hit", x: cx - band / 2, y: m.t, width: band, height: ih });
      const mark = el("path", { class: "mark", d: colPath(cx - bw / 2, top, bw, y0), fill: token("--chart-b") });
      svg.append(hit, mark);
      svg.append(el("text", { class: "val", x: cx, y: top - 8, "text-anchor": "middle" }, fmt(d.fps)));
      svg.append(el("text", { class: "cat", x: cx, y: y0 + 19, "text-anchor": "middle" }, d.label));
      if (d.sub) svg.append(el("text", { class: "cat-sub", x: cx, y: y0 + 35, "text-anchor": "middle" }, d.sub));
      bindHit(hit, tip, `<b>${d.label}${d.sub ? " · " + d.sub : ""}</b><br>${fmt(d.fps)} FPS de média<br>p95 ${fmt(d.p95)} ms`, cx, top);
    });
    hostReplace(host, svg);
  }

  // Antes e depois por cenário (duas séries).
  function drawPairs(host, data, names) {
    const series = [
      { key: "before", name: names[0], color: token("--chart-a"), ink: "#ffffff" },
      { key: "after", name: names[1], color: token("--chart-b"), ink: "#140800" },
    ];
    const W = Math.max(280, host.clientWidth);
    const bh = 18, gap = 2, groupGap = 34;
    const m = { l: 40, r: 14, t: 26, b: 30 };
    const groupH = bh * 2 + gap;
    const ih = data.length * groupH + (data.length - 1) * groupGap;
    const H = m.t + ih + m.b;
    const iw = W - m.l - m.r;
    const max = 60;
    const x = (v) => m.l + (v / max) * iw;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, height: H, "aria-hidden": "true" });
    for (const t of [0, 20, 40]) {
      svg.append(el("line", { x1: x(t), x2: x(t), y1: m.t - 6, y2: m.t + ih, stroke: token("--chart-grid"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
      svg.append(el("text", { class: "tick", x: x(t), y: m.t + ih + 20, "text-anchor": "middle" }, String(t)));
    }
    svg.append(el("line", { x1: x(60), x2: x(60), y1: m.t - 6, y2: m.t + ih, stroke: token("--wip"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
    svg.append(el("text", { class: "tick", x: x(60), y: m.t + ih + 20, "text-anchor": "middle" }, "60"));
    svg.append(el("text", { class: "goal", x: x(60), y: m.t - 12, "text-anchor": "end" }, "Meta: 60 FPS"));

    const tip = makeTooltip(host);
    data.forEach((d, gi) => {
      const gy = m.t + gi * (groupH + groupGap);
      svg.append(el("text", { class: "cat", x: m.l - 10, y: gy + groupH / 2 + 4, "text-anchor": "end" }, d.label));
      series.forEach((s, si) => {
        const v = d[s.key];
        const by = gy + si * (bh + gap);
        const hit = el("rect", { class: "hit", x: m.l, y: by - 1, width: iw, height: bh + 2 });
        const mark = el("path", { class: "mark", d: barPath(x(0), x(v), by, bh), fill: s.color });
        svg.append(hit, mark);
        // Rótulo dentro da ponta da barra (todas são largas o bastante), com tinta pelo contraste do preenchimento.
        svg.append(el("text", { class: "val-in", x: x(v) - 8, y: by + bh / 2 + 4.5, "text-anchor": "end", fill: s.ink }, fmt(v)));
        bindHit(hit, tip, `<b>Cenário ${d.label}</b><br>${names[0]}: ${fmt(d.before)} FPS<br>${names[1]}: ${fmt(d.after)} FPS`, x(v), by);
      });
    });

    const legend = document.createElement("div");
    legend.className = "legend";
    legend.innerHTML = series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join("");
    hostReplace(host, svg, legend);
  }

  // CPU por frame em cada cenário (série única), contra a meta de 70% do frame.
  function drawCpu(host) {
    const data = [
      { label: "S01", cpu: 12.84, tel: 12.88 },
      { label: "S02", cpu: 13.64, tel: 14.15 },
      { label: "S03", cpu: 12.06, tel: 12.33 },
      { label: "S04", cpu: 10.46, tel: 10.59 },
      { label: "S05", cpu: 10.90, tel: 11.22 },
      { label: "S06", cpu: 13.45, tel: 13.53 },
      { label: "S07", cpu: 9.98, tel: 10.33 },
    ];
    const fmt2 = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const W = Math.max(280, host.clientWidth);
    const bh = 18, gap = 10;
    const m = { l: 40, r: 14, t: 26, b: 30 };
    const ih = data.length * bh + (data.length - 1) * gap;
    const H = m.t + ih + m.b;
    const iw = W - m.l - m.r;
    const frame = 16.7, goal = 11.7;
    const x = (v) => m.l + (v / frame) * iw;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, height: H, "aria-hidden": "true" });
    for (const t of [0, 4, 8]) {
      svg.append(el("line", { x1: x(t), x2: x(t), y1: m.t - 6, y2: m.t + ih, stroke: token("--chart-grid"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
      svg.append(el("text", { class: "tick", x: x(t), y: m.t + ih + 20, "text-anchor": "middle" }, String(t)));
    }
    // Frame inteiro a 60 FPS fecha o eixo; a meta é 70% dele.
    svg.append(el("line", { x1: x(frame), x2: x(frame), y1: m.t - 6, y2: m.t + ih, stroke: token("--chart-grid"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
    svg.append(el("text", { class: "tick", x: x(frame), y: m.t + ih + 20, "text-anchor": "end" }, "16,7 ms"));
    svg.append(el("line", { x1: x(goal), x2: x(goal), y1: m.t - 6, y2: m.t + ih, stroke: token("--wip"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
    svg.append(el("text", { class: "goal", x: x(goal), y: m.t - 12, "text-anchor": "middle" }, "Meta: 11,7 ms"));

    const tip = makeTooltip(host);
    data.forEach((d, i) => {
      const by = m.t + i * (bh + gap);
      svg.append(el("text", { class: "cat", x: m.l - 10, y: by + bh / 2 + 4, "text-anchor": "end" }, d.label));
      const hit = el("rect", { class: "hit", x: m.l, y: by - gap / 2, width: iw, height: bh + gap });
      const mark = el("path", { class: "mark", d: barPath(x(0), x(d.cpu), by, bh), fill: token("--chart-b") });
      svg.append(hit, mark);
      svg.append(el("text", { class: "val-in", x: x(d.cpu) - 8, y: by + bh / 2 + 4.5, "text-anchor": "end", fill: "#140800" }, fmt2(d.cpu)));
      bindHit(hit, tip, `<b>Cenário ${d.label}</b><br>${fmt2(d.cpu)} ms de CPU por frame<br>com telemetria: ${fmt2(d.tel)} ms`, x(d.cpu), by);
    });
    hostReplace(host, svg);
  }

  // FPS médio por cenário no benchmark final (série única), contra os 60 FPS.
  function drawFinal(host) {
    const data = [
      { label: "S01", fps: 59.66 },
      { label: "S02", fps: 58.91 },
      { label: "S03", fps: 59.19 },
      { label: "S04", fps: 60.05 },
      { label: "S05", fps: 60.05 },
      { label: "S06", fps: 59.05 },
      { label: "S07", fps: 60.05, note: "hub" },
    ];
    const fmt2 = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const W = Math.max(280, host.clientWidth);
    const bh = 18, gap = 10;
    const m = { l: 40, r: 14, t: 26, b: 30 };
    const ih = data.length * bh + (data.length - 1) * gap;
    const H = m.t + ih + m.b;
    const iw = W - m.l - m.r;
    const max = 62;
    const x = (v) => m.l + (v / max) * iw;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, height: H, "aria-hidden": "true" });
    for (const t of [0, 20, 40]) {
      svg.append(el("line", { x1: x(t), x2: x(t), y1: m.t - 6, y2: m.t + ih, stroke: token("--chart-grid"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
      svg.append(el("text", { class: "tick", x: x(t), y: m.t + ih + 20, "text-anchor": "middle" }, String(t)));
    }
    svg.append(el("line", { x1: x(60), x2: x(60), y1: m.t - 6, y2: m.t + ih, stroke: token("--wip"), "stroke-width": 1, "shape-rendering": "crispEdges" }));
    svg.append(el("text", { class: "tick", x: x(60), y: m.t + ih + 20, "text-anchor": "middle" }, "60"));
    svg.append(el("text", { class: "goal", x: x(60), y: m.t - 12, "text-anchor": "end" }, "Meta: 60 FPS"));

    const tip = makeTooltip(host);
    data.forEach((d, i) => {
      const by = m.t + i * (bh + gap);
      svg.append(el("text", { class: "cat", x: m.l - 10, y: by + bh / 2 + 4, "text-anchor": "end" }, d.label));
      const hit = el("rect", { class: "hit", x: m.l, y: by - gap / 2, width: iw, height: bh + gap });
      const mark = el("path", { class: "mark", d: barPath(x(0), x(d.fps), by, bh), fill: token("--chart-b") });
      svg.append(hit, mark);
      svg.append(el("text", { class: "val-in", x: x(d.fps) - 8, y: by + bh / 2 + 4.5, "text-anchor": "end", fill: "#140800" }, fmt2(d.fps)));
      bindHit(hit, tip, `<b>Cenário ${d.label}${d.note ? ` (${d.note})` : ""}</b><br>${fmt2(d.fps)} FPS médios`, x(d.fps), by);
    });
    hostReplace(host, svg);
  }

  function hostReplace(host, svg, before) {
    const tip = host.querySelector(".tooltip");
    host.replaceChildren(...[before, svg, tip].filter(Boolean));
  }

  const charts = [
    [document.getElementById("chart-rounds"), drawRounds],
    [document.getElementById("chart-scenes"), (h) => drawPairs(h, [
      { label: "S04", before: 33.4, after: 56.2 },
      { label: "S07", before: 28.1, after: 57.0 },
    ], ["Antes", "Depois"])],
    [document.getElementById("chart-tb"), (h) => drawPairs(h, [
      { label: "S01", before: 21.1, after: 25.2 },
      { label: "S02", before: 19.6, after: 26.2 },
      { label: "S03", before: 42.4, after: 56.0 },
      { label: "S06", before: 41.6, after: 54.3 },
    ], ["Buffer duplo", "Triple buffering"])],
    [document.getElementById("chart-cpu"), drawCpu],
    [document.getElementById("chart-final"), drawFinal],
  ].filter(([host]) => host);

  const render = () => charts.forEach(([host, draw]) => {
    host.querySelector(".tooltip")?.remove();
    draw(host);
  });

  let lastWidths = [];
  const ro = new ResizeObserver(() => {
    const widths = charts.map(([host]) => Math.round(host.clientWidth));
    if (widths.join() === lastWidths.join()) return;
    lastWidths = widths;
    render();
  });
  charts.forEach(([host]) => ro.observe(host));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
})();
