import {
  el,
  svg,
  arrowDefs,
  animate,
  replayButton,
  makeDraggable,
  dragHandle,
  readout,
} from "./diagram-helpers";
import { mulberry32 } from "./numeric";
import type { DiagramRender } from "./diagram-host";

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/* 1.21 — sparse vs dense storage, visualized as a mostly-empty grid */
export const renderSparseGrid: DiagramRender = (host) => {
  const s = svg("0 0 340 260");
  host.appendChild(s);
  const out = readout(host, "");
  let seed = 7;

  function draw() {
    s.innerHTML = "";
    const rows = 8,
      cols = 8;
    const cw = 36,
      ch = 28,
      ox = 20,
      oy = 10;
    const rng = mulberry32(seed);
    let nonZero = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isNZ = rng() < 0.12;
        if (isNZ) nonZero++;
        const rect = el("rect", {
          x: ox + c * cw,
          y: oy + r * ch,
          width: cw - 3,
          height: ch - 3,
          rx: 4,
          fill: isNZ ? "#4f5fe0" : "#eef0f7",
          stroke: isNZ ? "#3542b8" : "#e2e4ee",
        });
        s.appendChild(rect);
        if (isNZ) {
          const t = el(
            "text",
            {
              x: ox + c * cw + (cw - 3) / 2,
              y: oy + r * ch + (ch - 3) / 2 + 4,
              "font-size": 9,
              fill: "white",
              "text-anchor": "middle",
            },
            [],
          );
          t.textContent = fmt(rng() * 5);
          s.appendChild(t);
        }
      }
    }
    const total = rows * cols;
    const denseBytes = total * 8;
    const sparseBytes = nonZero * (8 + 4 + 4); // value + row index + col index, COO-style
    out.set(
      `${nonZero}/${total} entries are non-zero (${fmt((nonZero / total) * 100)}% dense).  Dense storage: ${denseBytes}B.  Sparse (COO) storage: ${sparseBytes}B — ${fmt(denseBytes / sparseBytes)}× smaller.`,
    );
  }
  draw();
  replayButton(host, "↻ New random sparsity pattern", () => {
    seed++;
    draw();
  });

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Real one-hot encodings, TF-IDF matrices, and adjacency matrices routinely look like this — often over 99% zeros.";
  host.appendChild(hint);
};

/* 1.22 — trace: only the diagonal matters */
export const renderTraceHighlight: DiagramRender = (host) => {
  const s = svg("0 0 260 260");
  host.appendChild(s);
  const out = readout(host, "");
  let seed = 3;

  function draw() {
    s.innerHTML = "";
    const n = 4;
    const cw = 56,
      ch = 56,
      ox = 20,
      oy = 10;
    const rng = mulberry32(seed);
    let trace = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const onDiag = r === c;
        const v = Math.round((rng() * 10 - 3) * 10) / 10;
        if (onDiag) trace += v;
        const rect = el("rect", {
          x: ox + c * cw,
          y: oy + r * ch,
          width: cw - 4,
          height: ch - 4,
          rx: 6,
          fill: onDiag ? "#8b93f5" : "#eef0f7",
          stroke: onDiag ? "#3542b8" : "#e2e4ee",
        });
        const t = el(
          "text",
          {
            x: ox + c * cw + (cw - 4) / 2,
            y: oy + r * ch + (ch - 4) / 2 + 5,
            "font-size": 13,
            fill: onDiag ? "white" : "#4a4f63",
            "text-anchor": "middle",
            "font-weight": onDiag ? 700 : 400,
          },
          [],
        );
        t.textContent = fmt(v);
        s.appendChild(rect);
        s.appendChild(t);
      }
    }
    out.set(
      `trace(A) = sum of the highlighted diagonal = ${fmt(trace)}  (every off-diagonal entry is ignored entirely)`,
    );
  }
  draw();
  replayButton(host, "↻ New random matrix", () => {
    seed++;
    draw();
  });

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "The trace only ever looks at the diagonal — regardless of what the rest of the matrix contains.";
  host.appendChild(hint);
};

/* 1.23 — power iteration converging to the dominant eigenvector */
export const renderPowerIteration: DiagramRender = (host) => {
  const s = svg("0 0 320 280");
  const cx = 160,
    cy = 140,
    R = 90;
  const A = { a: 3, d: 1 }; // dominant eigenvalue 3 along x-axis
  s.appendChild(
    el("line", {
      x1: cx - R - 10,
      y1: cy,
      x2: cx + R + 10,
      y2: cy,
      stroke: "#e2e4ee",
      "stroke-width": 1,
    }),
  );
  s.appendChild(
    el("line", {
      x1: cx,
      y1: cy - R - 10,
      x2: cx,
      y2: cy + R + 10,
      stroke: "#e2e4ee",
      "stroke-width": 1,
    }),
  );
  s.appendChild(arrowDefs("pow-v", "#4f5fe0"));
  let vx = 0.4,
    vy = 0.9;
  const line = el("line", {
    x1: cx,
    y1: cy,
    x2: cx + vx * R,
    y2: cy - vy * R,
    stroke: "#4f5fe0",
    "stroke-width": 2.5,
    "marker-end": "url(#pow-v)",
  });
  s.appendChild(line);
  const handle = dragHandle(cx + vx * R, cy - vy * R, "#4f5fe0");
  s.appendChild(handle);
  host.appendChild(s);

  const out = readout(host, "Drag the starting vector, then press Iterate.");
  function place() {
    line.setAttribute("x2", String(cx + vx * R));
    line.setAttribute("y2", String(cy - vy * R));
    handle.setAttribute("cx", String(cx + vx * R));
    handle.setAttribute("cy", String(cy - vy * R));
  }
  const stopDrag = makeDraggable(handle, s, (p) => {
    const nx = (p.x - cx) / R,
      ny = -(p.y - cy) / R;
    const norm = Math.hypot(nx, ny) || 1;
    vx = nx / norm;
    vy = ny / norm;
    place();
  });

  const cancels: Array<() => void> = [];
  function iterate() {
    let step = 0;
    function once() {
      const nx = A.a * vx,
        ny = A.d * vy;
      const norm = Math.hypot(nx, ny) || 1;
      const targetX = nx / norm,
        targetY = ny / norm;
      const startX = vx,
        startY = vy;
      cancels.push(
        animate(
          400,
          (t) => {
            vx = startX + (targetX - startX) * t;
            vy = startY + (targetY - startY) * t;
            place();
          },
          () => {
            step++;
            const rayleigh = A.a * vx * vx + A.d * vy * vy;
            out.set(
              `step ${step}: v ≈ [${fmt(vx)}, ${fmt(vy)}]   Rayleigh quotient ≈ ${fmt(rayleigh)} (true dominant eigenvalue = ${A.a})`,
            );
            if (step < 8) once();
          },
        ),
      );
    }
    once();
  }
  replayButton(host, "↻ Iterate", iterate);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Every iteration: multiply by A, then re-normalize. Within a handful of steps it snaps onto the x-axis — the dominant eigenvector.";
  host.appendChild(hint);

  return () => {
    stopDrag();
    cancels.forEach((c) => c());
  };
};

/* 1.24 — kernel trick: radial classes become linearly separable in (r, r^2) space */
export const renderKernelLift: DiagramRender = (host) => {
  const s = svg("0 0 320 260");
  host.appendChild(s);
  const N = 40;
  const rng = mulberry32(11);
  const pts: Array<{ angle: number; r: number; cls: 0 | 1 }> = [];
  for (let i = 0; i < N; i++) {
    const inner = i < N / 2;
    pts.push({
      angle: rng() * Math.PI * 2,
      r: inner ? 0.3 + rng() * 0.5 : 2.2 + rng() * 0.6,
      cls: inner ? 0 : 1,
    });
  }
  const dots = pts.map((p) =>
    el("circle", { r: 4, fill: p.cls === 0 ? "#c23b3b" : "#4f5fe0", "fill-opacity": 0.85 }),
  );
  dots.forEach((d) => s.appendChild(d));
  const sep = el("line", {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: "#1f8a5f",
    "stroke-width": 2,
    "stroke-dasharray": "5,4",
    opacity: 0,
  });
  s.appendChild(sep);
  host.appendChild(s);

  const cx = 160,
    cy = 150,
    scale = 30;
  function original(p: { angle: number; r: number }) {
    return { x: cx + Math.cos(p.angle) * p.r * scale, y: cy + Math.sin(p.angle) * p.r * scale };
  }
  function lifted(p: { angle: number; r: number }) {
    // (r, r^2) view: horizontal = r (spread out by angle for visibility), vertical = r^2
    const spreadX = 40 + (p.angle / (Math.PI * 2)) * 240;
    const z = p.r * p.r;
    return { x: spreadX, y: 230 - z * 22 };
  }
  function set(t: number) {
    pts.forEach((p, i) => {
      const o = original(p),
        l = lifted(p);
      dots[i].setAttribute("cx", String(o.x + (l.x - o.x) * t));
      dots[i].setAttribute("cy", String(o.y + (l.y - o.y) * t));
    });
    sep.setAttribute("opacity", String(t));
    const sepY = 230 - 1.4 * 1.4 * 22; // a horizontal boundary between the two radius bands
    sep.setAttribute("x1", "20");
    sep.setAttribute("y1", String(sepY));
    sep.setAttribute("x2", "300");
    sep.setAttribute("y2", String(sepY));
  }
  set(0);

  const out = readout(
    host,
    "Two classes arranged as concentric rings — no straight line separates them.",
  );
  const cancels: Array<() => void> = [];
  function lift() {
    out.set(
      "Lifted to (angle, r²): the SAME two classes are now perfectly separated by a straight line.",
    );
    cancels.push(animate(900, set));
  }
  function reset() {
    out.set("Two classes arranged as concentric rings — no straight line separates them.");
    cancels.push(animate(900, (t) => set(1 - t)));
  }
  const row = document.createElement("div");
  row.className = "mt-2 flex justify-center gap-2";
  const b1 = document.createElement("button");
  b1.type = "button";
  b1.textContent = "↻ Apply kernel lift";
  b1.className =
    "rounded border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-primary hover:border-primary";
  b1.addEventListener("click", lift);
  const b2 = document.createElement("button");
  b2.type = "button";
  b2.textContent = "↻ Reset";
  b2.className =
    "rounded border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-primary hover:border-primary";
  b2.addEventListener("click", reset);
  row.appendChild(b1);
  row.appendChild(b2);
  host.appendChild(row);

  return () => cancels.forEach((c) => c());
};

/* 1.25 — whitening: correlated, stretched data becomes an isotropic unit-variance cloud */
export const renderWhitening: DiagramRender = (host) => {
  const s = svg("0 0 300 240");
  host.appendChild(s);
  const cx = 150,
    cy = 120;
  const stdX = 45,
    stdY = 15; // deliberately anisotropic
  const rng = mulberry32(21);
  const N = 60;
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < N; i++) {
    const u1 = Math.max(rng(), 1e-6),
      u2 = rng();
    const g1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const u3 = Math.max(rng(), 1e-6),
      u4 = rng();
    const g2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);
    pts.push({ x: g1 * stdX, y: g2 * stdY });
  }
  const dots = pts.map((p) =>
    el("circle", { cx: cx + p.x, cy: cy + p.y, r: 3.5, fill: "#4f5fe0", "fill-opacity": 0.75 }),
  );
  dots.forEach((d) => s.appendChild(d));
  host.appendChild(s);

  const out = readout(
    host,
    `Raw data: std along x ≈ ${fmt(stdX / 30)}, std along y ≈ ${fmt(stdY / 30)} — stretched and anisotropic.`,
  );
  const cancels: Array<() => void> = [];
  function whiten() {
    const targetStd = 25;
    cancels.push(
      animate(
        900,
        (t) => {
          const sx = 1 + (targetStd / stdX - 1) * t;
          const sy = 1 + (targetStd / stdY - 1) * t;
          pts.forEach((p, i) => {
            dots[i].setAttribute("cx", String(cx + p.x * sx));
            dots[i].setAttribute("cy", String(cy + p.y * sy));
          });
        },
        () =>
          out.set(
            "Whitened: every direction now has equal (unit) variance — a perfect circular cloud.",
          ),
      ),
    );
  }
  replayButton(host, "↻ Whiten it", whiten);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Whitening scales each principal axis (from the covariance eigen-decomposition) so every direction has equal spread.";
  host.appendChild(hint);

  return () => cancels.forEach((c) => c());
};

/* 1.27 — PageRank as power iteration on a small link graph */
export const renderPageRankGraph: DiagramRender = (host) => {
  const s = svg("0 0 320 260");
  host.appendChild(s);
  const nodes = [
    { x: 160, y: 40 },
    { x: 260, y: 110 },
    { x: 220, y: 220 },
    { x: 100, y: 220 },
    { x: 60, y: 110 },
  ];
  const edges: Array<[number, number]> = [
    [0, 1],
    [0, 4],
    [1, 2],
    [4, 0],
    [3, 0],
    [2, 3],
    [3, 4],
    [4, 2],
  ];
  const n = nodes.length;
  const outDegree = new Array(n).fill(0);
  edges.forEach(([from]) => outDegree[from]++);

  edges.forEach(([from, to]) => {
    const a = nodes[from],
      b = nodes[to];
    const dx = b.x - a.x,
      dy = b.y - a.y,
      len = Math.hypot(dx, dy);
    const ux = dx / len,
      uy = dy / len;
    const startX = a.x + ux * 18,
      startY = a.y + uy * 18;
    const endX = b.x - ux * 18,
      endY = b.y - uy * 18;
    s.appendChild(arrowDefs(`pr-${from}-${to}`, "#c2c6db"));
    s.appendChild(
      el("line", {
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        stroke: "#c2c6db",
        "stroke-width": 1.5,
        "marker-end": `url(#pr-${from}-${to})`,
      }),
    );
  });

  let scores = new Array(n).fill(1 / n);
  const circles = nodes.map((p) =>
    el("circle", {
      cx: p.x,
      cy: p.y,
      r: 16,
      fill: "#4f5fe0",
      "fill-opacity": 0.75,
      stroke: "#3542b8",
      "stroke-width": 1.5,
    }),
  );
  const labels = nodes.map((_p, i) => {
    const t = el(
      "text",
      {
        x: nodes[i].x,
        y: nodes[i].y + 4,
        "font-size": 10,
        fill: "white",
        "text-anchor": "middle",
        "font-weight": 700,
      },
      [],
    );
    t.textContent = String(i + 1);
    return t;
  });
  circles.forEach((c) => s.appendChild(c));
  labels.forEach((l) => s.appendChild(l));
  host.appendChild(s);

  const out = readout(host, "");
  function render() {
    circles.forEach((c, i) => {
      const r = 10 + scores[i] * 60;
      c.setAttribute("r", String(r));
    });
    out.set("scores: " + scores.map((v, i) => `${i + 1}=${fmt(v)}`).join("  "));
  }
  render();

  const cancels: Array<() => void> = [];
  function step() {
    const next = new Array(n).fill(0.15 / n); // damping factor spread
    edges.forEach(([from, to]) => {
      next[to] += 0.85 * (scores[from] / outDegree[from]);
    });
    const startScores = scores.slice();
    cancels.push(
      animate(500, (t) => {
        scores = startScores.map((v, i) => v + (next[i] - v) * t);
        render();
      }),
    );
  }
  replayButton(host, "↻ Run one power-iteration step", step);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Circle size = current score. Keep clicking — scores converge to the dominant eigenvector of the link matrix, exactly like section 1.23.";
  host.appendChild(hint);

  return () => cancels.forEach((c) => c());
};
