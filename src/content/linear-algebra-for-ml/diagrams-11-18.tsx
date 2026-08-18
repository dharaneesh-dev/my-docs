import {
  el,
  svg,
  arrowDefs,
  animate,
  replayButton,
  makeDraggable,
  dragHandle,
  sliderControl,
  readout,
} from "./diagram-helpers";
import { symmetricEigenvalues, randomSymmetricMatrix } from "./numeric";
import type { DiagramRender } from "./diagram-host";

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/* 1.11 — determinant as signed area of a draggable parallelogram */
export const renderDeterminant: DiagramRender = (host) => {
  const s = svg("0 0 320 280");
  const ox = 160,
    oy = 220;
  s.appendChild(arrowDefs("det-a", "#4f5fe0"));
  s.appendChild(arrowDefs("det-b", "#b8720c"));
  let ax = 3,
    ay = -3;
  let bx = 4,
    by = 1;
  const SCALE = 26;

  const parallelogram = el("path", {
    d: "",
    fill: "#4f5fe0",
    "fill-opacity": "0.18",
    stroke: "none",
  });
  const lineA = el("line", {
    x1: ox,
    y1: oy,
    x2: 0,
    y2: 0,
    stroke: "#4f5fe0",
    "stroke-width": 2.5,
    "marker-end": "url(#det-a)",
  });
  const lineB = el("line", {
    x1: ox,
    y1: oy,
    x2: 0,
    y2: 0,
    stroke: "#b8720c",
    "stroke-width": 2.5,
    "marker-end": "url(#det-b)",
  });
  s.appendChild(parallelogram);
  s.appendChild(lineA);
  s.appendChild(lineB);
  const handleA = dragHandle(0, 0, "#4f5fe0");
  const handleB = dragHandle(0, 0, "#b8720c");
  s.appendChild(handleA);
  s.appendChild(handleB);
  host.appendChild(s);

  const out = readout(host, "");
  function sync() {
    const aX = ox + ax * SCALE,
      aY = oy + ay * SCALE;
    const bX = ox + bx * SCALE,
      bY = oy + by * SCALE;
    const cX = ox + (ax + bx) * SCALE,
      cY = oy + (ay + by) * SCALE;
    parallelogram.setAttribute("d", `M${ox},${oy} L${aX},${aY} L${cX},${cY} L${bX},${bY} Z`);
    lineA.setAttribute("x2", String(aX));
    lineA.setAttribute("y2", String(aY));
    lineB.setAttribute("x2", String(bX));
    lineB.setAttribute("y2", String(bY));
    handleA.setAttribute("cx", String(aX));
    handleA.setAttribute("cy", String(aY));
    handleB.setAttribute("cx", String(bX));
    handleB.setAttribute("cy", String(bY));
    const det = ax * by - ay * bx;
    parallelogram.setAttribute("fill", det >= 0 ? "#4f5fe0" : "#c23b3b");
    out.set(
      `det = (${fmt(ax)})(${fmt(by)}) − (${fmt(ay)})(${fmt(bx)}) = ${fmt(det)}   →  area = ${fmt(Math.abs(det))}${det < 0 ? "  (orientation flipped)" : ""}`,
    );
  }
  const stopA = makeDraggable(handleA, s, (p) => {
    ax = (p.x - ox) / SCALE;
    ay = (p.y - oy) / SCALE;
    sync();
  });
  const stopB = makeDraggable(handleB, s, (p) => {
    bx = (p.x - ox) / SCALE;
    by = (p.y - oy) / SCALE;
    sync();
  });
  sync();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Drag either vector — the shaded area is |det|. Cross the vectors over each other to flip the sign.";
  host.appendChild(hint);

  return () => {
    stopA();
    stopB();
  };
};

/* 1.13 — Gram-Schmidt: project b onto a, keep only the leftover perpendicular part */
export const renderGramSchmidt: DiagramRender = (host) => {
  const s = svg("0 0 320 280");
  const ox = 40,
    oy = 240;
  const SCALE = 28;
  const ax = 4,
    ay = -1; // fixed reference direction
  let bx = 2,
    by = -3;

  s.appendChild(arrowDefs("gs-a", "#4f5fe0"));
  s.appendChild(arrowDefs("gs-b", "#b8720c"));
  s.appendChild(arrowDefs("gs-e", "#1f8a5f"));
  const lineA = el("line", {
    x1: ox,
    y1: oy,
    x2: ox + ax * SCALE,
    y2: oy + ay * SCALE,
    stroke: "#4f5fe0",
    "stroke-width": 2.5,
    "marker-end": "url(#gs-a)",
  });
  const lineB = el("line", {
    x1: ox,
    y1: oy,
    x2: 0,
    y2: 0,
    stroke: "#b8720c",
    "stroke-width": 2.5,
    "marker-end": "url(#gs-b)",
  });
  const projLine = el("line", {
    x1: ox,
    y1: oy,
    x2: 0,
    y2: 0,
    stroke: "#7a7f95",
    "stroke-width": 2,
    "stroke-dasharray": "4,3",
  });
  const dropLine = el("line", {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: "#c2c6db",
    "stroke-width": 1.5,
    "stroke-dasharray": "2,3",
  });
  const lineE = el("line", {
    x1: ox,
    y1: oy,
    x2: 0,
    y2: 0,
    stroke: "#1f8a5f",
    "stroke-width": 2.5,
    "marker-end": "url(#gs-e)",
  });
  [lineA, projLine, dropLine, lineB, lineE].forEach((l) => s.appendChild(l));
  const handleB = dragHandle(0, 0, "#b8720c");
  s.appendChild(handleB);
  host.appendChild(s);

  const out = readout(host, "");
  function sync() {
    const aNormSq = ax * ax + ay * ay;
    const dot = ax * bx + ay * by;
    const k = dot / aNormSq;
    const projX = k * ax,
      projY = k * ay;
    const orthoX = bx - projX,
      orthoY = by - projY;

    lineB.setAttribute("x2", String(ox + bx * SCALE));
    lineB.setAttribute("y2", String(oy + by * SCALE));
    handleB.setAttribute("cx", String(ox + bx * SCALE));
    handleB.setAttribute("cy", String(oy + by * SCALE));
    projLine.setAttribute("x2", String(ox + projX * SCALE));
    projLine.setAttribute("y2", String(oy + projY * SCALE));
    dropLine.setAttribute("x1", String(ox + projX * SCALE));
    dropLine.setAttribute("y1", String(oy + projY * SCALE));
    dropLine.setAttribute("x2", String(ox + bx * SCALE));
    dropLine.setAttribute("y2", String(oy + by * SCALE));
    lineE.setAttribute("x2", String(ox + orthoX * SCALE));
    lineE.setAttribute("y2", String(oy + orthoY * SCALE));

    const checkDot = ax * orthoX + ay * orthoY;
    out.set(
      `proj_a(b) = ${fmt(k)}·a   e = b − proj = [${fmt(orthoX)}, ${fmt(orthoY)}]   a·e = ${fmt(checkDot)} (≈0, so e ⟂ a)`,
    );
  }
  const stop = makeDraggable(handleB, s, (p) => {
    bx = (p.x - ox) / SCALE;
    by = (p.y - oy) / SCALE;
    sync();
  });
  sync();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Blue = fixed reference a. Drag orange (b). Grey dashed = the projection removed. Green = the orthogonal leftover — always perpendicular to a.";
  host.appendChild(hint);

  return () => stop();
};

/* Shared: draw the elliptical (or saddle) level-set contours of f(x,y) = a*x^2 + d*y^2 */
export function drawQuadraticContours(
  s: SVGSVGElement,
  cx: number,
  cy: number,
  scale: number,
  a: number,
  d: number,
) {
  const group = el("g", {});
  s.appendChild(group);
  const positiveDefinite = a > 0 && d > 0;
  if (positiveDefinite) {
    [1, 2, 3, 4].forEach((k) => {
      const rx = Math.sqrt(k / a) * scale,
        ry = Math.sqrt(k / d) * scale;
      group.appendChild(
        el("ellipse", {
          cx,
          cy,
          rx,
          ry,
          fill: "none",
          stroke: "#4f5fe0",
          "stroke-width": 1.3,
          opacity: 0.35 + k * 0.08,
        }),
      );
    });
  } else if (a < 0 && d < 0) {
    [1, 2, 3, 4].forEach((k) => {
      const rx = Math.sqrt(-k / a) * scale,
        ry = Math.sqrt(-k / d) * scale;
      group.appendChild(
        el("ellipse", {
          cx,
          cy,
          rx,
          ry,
          fill: "none",
          stroke: "#c23b3b",
          "stroke-width": 1.3,
          opacity: 0.35 + k * 0.08,
        }),
      );
    });
  } else {
    // saddle: draw the two asymptote directions where the form is exactly zero
    const ratio = Math.sqrt(Math.abs(a / (d || 1e-6)));
    const len = 140;
    group.appendChild(
      el("line", {
        x1: cx - len,
        y1: cy - len * ratio,
        x2: cx + len,
        y2: cy + len * ratio,
        stroke: "#e0a842",
        "stroke-width": 1.5,
        "stroke-dasharray": "5,4",
      }),
    );
    group.appendChild(
      el("line", {
        x1: cx - len,
        y1: cy + len * ratio,
        x2: cx + len,
        y2: cy - len * ratio,
        stroke: "#e0a842",
        "stroke-width": 1.5,
        "stroke-dasharray": "5,4",
      }),
    );
  }
  return { group, positiveDefinite: positiveDefinite || (a < 0 && d < 0) };
}

/* 1.15 — quadratic form contours: sliders control A = diag(a, d); watch convex bowl vs. saddle */
export const renderQuadraticForm: DiagramRender = (host) => {
  const s = svg("0 0 320 280");
  const cx = 160,
    cy = 140,
    scale = 34;
  let a = 1.2,
    d = 1.8;
  let contourGroup: SVGGElement | null = null;
  host.appendChild(s);

  const out = readout(host, "");
  function draw() {
    if (contourGroup) contourGroup.remove();
    const res = drawQuadraticContours(s, cx, cy, scale, a, d);
    contourGroup = res.group;
    out.set(
      res.positiveDefinite
        ? a > 0
          ? `f(x,y) = ${fmt(a)}x² + ${fmt(d)}y²  →  positive definite → convex bowl → unique minimum at the origin`
          : `f(x,y) = ${fmt(a)}x² + ${fmt(d)}y²  →  negative definite → concave dome → unique maximum at the origin`
        : `f(x,y) = ${fmt(a)}x² + ${fmt(d)}y²  →  indefinite → SADDLE POINT → not convex, not concave`,
    );
  }
  draw();

  sliderControl(host, "a (x² coeff.)", { min: -2, max: 2, step: 0.1, value: a }, (v) => {
    a = v;
    draw();
  });
  sliderControl(host, "d (y² coeff.)", { min: -2, max: 2, step: 0.1, value: d }, (v) => {
    d = v;
    draw();
  });

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "This is exactly what a loss landscape's Hessian tells you at a critical point — both positive means you're at a genuine minimum.";
  host.appendChild(hint);
};

/* 1.16 — gradient descent rolling downhill on the same quadratic bowl */
export const renderGradientDescent: DiagramRender = (host) => {
  const s = svg("0 0 320 280");
  const cx = 160,
    cy = 140,
    scale = 34;
  const A = { a: 1, d: 5 }; // elongated bowl on purpose: shows why condition number matters
  drawQuadraticContours(s, cx, cy, scale, A.a, A.d);
  let px = -3.2,
    py = 1.6;
  const dot = el("circle", {
    cx: cx + px * scale,
    cy: cy + py * scale,
    r: 6,
    fill: "#1f8a5f",
    stroke: "white",
    "stroke-width": 2,
  });
  const path = el("path", {
    d: "",
    fill: "none",
    stroke: "#1f8a5f",
    "stroke-width": 2,
    "stroke-dasharray": "3,3",
  });
  s.appendChild(path);
  s.appendChild(dot);
  const handle = dragHandle(cx + px * scale, cy + py * scale, "#1f8a5f");
  s.appendChild(handle);
  host.appendChild(s);

  const out = readout(host, "Drag the green dot to a starting point, then press Descend.");
  const stopDrag = makeDraggable(handle, s, (p) => {
    px = (p.x - cx) / scale;
    py = (p.y - cy) / scale;
    dot.setAttribute("cx", String(p.x));
    dot.setAttribute("cy", String(p.y));
    handle.setAttribute("cx", String(p.x));
    handle.setAttribute("cy", String(p.y));
    path.setAttribute("d", "");
  });

  const cancels: Array<() => void> = [];
  function descend() {
    const lr = 0.08;
    let x = px,
      y = py;
    const pts = [`M${cx + x * scale},${cy + y * scale}`];
    let step = 0;
    function tick() {
      const gx = 2 * A.a * x,
        gy = 2 * A.d * y; // gradient of a*x^2 + d*y^2
      x -= lr * gx;
      y -= lr * gy;
      pts.push(`L${cx + x * scale},${cy + y * scale}`);
      path.setAttribute("d", pts.join(" "));
      dot.setAttribute("cx", String(cx + x * scale));
      dot.setAttribute("cy", String(cy + y * scale));
      handle.setAttribute("cx", String(cx + x * scale));
      handle.setAttribute("cy", String(cy + y * scale));
      step++;
      out.set(`step ${step}   x=[${fmt(x)}, ${fmt(y)}]   f(x)=${fmt(A.a * x * x + A.d * y * y)}`);
      if (step < 40 && Math.hypot(x, y) > 0.02) {
        cancels.push(animate(60, () => {}, tick));
      }
    }
    tick();
  }
  replayButton(host, "↻ Descend", descend);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "This bowl is deliberately stretched (a≠d) — notice the path zig-zags instead of heading straight for the minimum. That's what a bad condition number does to gradient descent.";
  host.appendChild(hint);

  return () => {
    stopDrag();
    cancels.forEach((c) => c());
  };
};

/* 1.18 — real eigenvalue spectrum of a random symmetric matrix, vs. the theoretical semicircle */
export const renderEigenSpectrum: DiagramRender = (host) => {
  const s = svg("0 0 340 220");
  host.appendChild(s);
  const out = readout(host, "");
  let seed = 1;

  function draw() {
    s.innerHTML = "";
    const n = 30;
    const A = randomSymmetricMatrix(n, seed);
    const eigs = symmetricEigenvalues(A);
    const R = 2; // Wigner semicircle radius for this normalization
    const bins = 16;
    const lo = -2.4,
      hi = 2.4;
    const width = hi - lo;
    const counts = new Array(bins).fill(0);
    eigs.forEach((v) => {
      const idx = Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / width) * bins)));
      counts[idx]++;
    });
    const maxCount = Math.max(...counts, 1);
    const plotW = 300,
      plotH = 150,
      ox = 20,
      oy = 170;
    const barW = plotW / bins;
    counts.forEach((c, i) => {
      const h = (c / maxCount) * plotH;
      s.appendChild(
        el("rect", {
          x: ox + i * barW + 1,
          y: oy - h,
          width: barW - 2,
          height: h,
          fill: "#4f5fe0",
          "fill-opacity": 0.55,
          rx: 2,
        }),
      );
    });
    // theoretical semicircle overlay, scaled to roughly match bar heights
    const curvePts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const x = lo + (i / 60) * width;
      const density = Math.abs(x) < R ? Math.sqrt(R * R - x * x) : 0;
      const px = ox + ((x - lo) / width) * plotW;
      const py = oy - (density / R) * plotH * 0.92;
      curvePts.push(`${i === 0 ? "M" : "L"}${px},${py}`);
    }
    s.appendChild(
      el("path", { d: curvePts.join(" "), fill: "none", stroke: "#1f8a5f", "stroke-width": 2 }),
    );
    s.appendChild(
      el("line", { x1: ox, y1: oy, x2: ox + plotW, y2: oy, stroke: "#c7cbdc", "stroke-width": 1 }),
    );
    out.set(
      `n=${n} random symmetric matrix, entries ~ N(0,1)/√n — real computed eigenvalues (blue bars) vs. the theoretical Wigner semicircle (green curve).`,
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
    "These eigenvalues are computed live in your browser (Jacobi algorithm) — not faked data. Regenerate to see the shape hold up across different random matrices.";
  host.appendChild(hint);
};
