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
import { mulberry32, randn } from "./numeric";
import { drawQuadraticContours } from "./diagrams-11-18";
import type { DiagramRender } from "./diagram-host";

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/* 1.28 — LDA: rotate a projection line, watch the class-separation score change live */
export const renderLda: DiagramRender = (host) => {
  const s = svg("0 0 320 280");
  const cx = 160,
    cy = 140;
  const rng = mulberry32(5);
  const classA: Array<{ x: number; y: number }> = [];
  const classB: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 20; i++) {
    classA.push({ x: -50 + randn(rng) * 22, y: -20 + randn(rng) * 45 });
    classB.push({ x: 50 + randn(rng) * 22, y: 20 + randn(rng) * 45 });
  }
  [...classA.map((p) => ({ ...p, cls: 0 })), ...classB.map((p) => ({ ...p, cls: 1 }))].forEach(
    (p) => {
      s.appendChild(
        el("circle", {
          cx: cx + p.x,
          cy: cy + p.y,
          r: 4,
          fill: p.cls === 0 ? "#c23b3b" : "#4f5fe0",
          "fill-opacity": 0.8,
        }),
      );
    },
  );
  const axisLine = el("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: "#1f8a5f", "stroke-width": 2 });
  s.appendChild(axisLine);
  const ticksGroup = el("g", {});
  s.appendChild(ticksGroup);
  host.appendChild(s);

  const out = readout(host, "");
  let angle = 0.3;
  function draw() {
    const ux = Math.cos(angle),
      uy = Math.sin(angle);
    axisLine.setAttribute("x1", String(cx - ux * 140));
    axisLine.setAttribute("y1", String(cy - uy * 140));
    axisLine.setAttribute("x2", String(cx + ux * 140));
    axisLine.setAttribute("y2", String(cy + uy * 140));

    const projA = classA.map((p) => p.x * ux + p.y * uy);
    const projB = classB.map((p) => p.x * ux + p.y * uy);
    const meanA = projA.reduce((a, b) => a + b, 0) / projA.length;
    const meanB = projB.reduce((a, b) => a + b, 0) / projB.length;
    const varA = projA.reduce((a, v) => a + (v - meanA) ** 2, 0) / projA.length;
    const varB = projB.reduce((a, v) => a + (v - meanB) ** 2, 0) / projB.length;
    const fisher = (meanA - meanB) ** 2 / (varA + varB + 1e-6);

    ticksGroup.innerHTML = "";
    [...projA.map((v) => ({ v, cls: 0 })), ...projB.map((v) => ({ v, cls: 1 }))].forEach((p) => {
      const tx = cx + ux * p.v,
        ty = cy + uy * p.v;
      ticksGroup.appendChild(
        el("circle", { cx: tx, cy: ty, r: 2.5, fill: p.cls === 0 ? "#c23b3b" : "#4f5fe0" }),
      );
    });
    out.set(
      `Fisher separation score along this line ≈ ${fmt(fisher)}  (higher = classes separate better when projected here)`,
    );
  }
  draw();

  sliderControl(
    host,
    "Projection angle",
    { min: 0, max: Math.PI, step: 0.01, value: angle },
    (v) => {
      angle = v;
      draw();
    },
  );

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Drag the slider to rotate the green projection line — LDA finds the exact angle that maximizes this separation score.";
  host.appendChild(hint);
};

/* 1.29 — random projection roughly preserves pairwise distances (Johnson-Lindenstrauss intuition) */
export const renderRandomProjection: DiagramRender = (host) => {
  const s = svg("0 0 320 260");
  const cx = 160,
    cy = 110,
    R = 95;
  let seed = 2;
  const pointsGroup = el("g", {});
  const lineEl = el("line", {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: "#e0a842",
    "stroke-width": 1.5,
    "stroke-dasharray": "4,3",
  });
  s.appendChild(lineEl);
  s.appendChild(pointsGroup);
  host.appendChild(s);
  const out = readout(host, "");

  function run() {
    pointsGroup.innerHTML = "";
    const rng = mulberry32(seed);
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 14; i++) {
      pts.push({ x: (rng() - 0.5) * 2 * R, y: (rng() - 0.5) * 2 * R });
    }
    const theta = rng() * Math.PI;
    const ux = Math.cos(theta),
      uy = Math.sin(theta);
    lineEl.setAttribute("x1", String(cx - ux * 150));
    lineEl.setAttribute("y1", String(cy - uy * 150));
    lineEl.setAttribute("x2", String(cx + ux * 150));
    lineEl.setAttribute("y2", String(cy + uy * 150));

    pts.forEach((p) =>
      pointsGroup.appendChild(
        el("circle", { cx: cx + p.x, cy: cy + p.y, r: 4, fill: "#4f5fe0", "fill-opacity": 0.8 }),
      ),
    );
    const projected = pts.map((p) => p.x * ux + p.y * uy);
    projected.forEach((v, i) =>
      pointsGroup.appendChild(
        el("circle", {
          cx: cx + ux * v,
          cy: cy + uy * v,
          r: 3,
          fill: "#1f8a5f",
          "fill-opacity": 0.9,
          "data-i": i,
        }),
      ),
    );

    let sumOrig = 0,
      sumProj = 0,
      sumProd = 0,
      sumOrig2 = 0,
      sumProj2 = 0,
      n = 0;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dOrig = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        const dProj = Math.abs(projected[i] - projected[j]);
        sumOrig += dOrig;
        sumProj += dProj;
        sumProd += dOrig * dProj;
        sumOrig2 += dOrig * dOrig;
        sumProj2 += dProj * dProj;
        n++;
      }
    }
    const num = n * sumProd - sumOrig * sumProj;
    const den = Math.sqrt((n * sumOrig2 - sumOrig ** 2) * (n * sumProj2 - sumProj ** 2));
    const corr = den > 1e-6 ? num / den : 0;
    out.set(
      `Correlation between original 2D distances and projected 1D distances: ${fmt(corr)}  (1.0 = perfectly preserved)`,
    );
  }
  run();
  replayButton(host, "↻ New random projection", () => {
    seed++;
    run();
  });

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Blue = original points. Green = the same points collapsed onto a random line. Relative distances survive surprisingly well — the whole idea behind the Johnson-Lindenstrauss lemma.";
  host.appendChild(hint);
};

/* 1.32 — orthogonal Procrustes: rotate a shape to align with a target, or let SVD solve it exactly */
export const renderProcrustes: DiagramRender = (host) => {
  const s = svg("0 0 300 260");
  const cx = 150,
    cy = 130;
  const target = [
    { x: -50, y: -60 },
    { x: 50, y: -40 },
    { x: 40, y: 50 },
    { x: -30, y: 60 },
    { x: -60, y: 0 },
  ];
  const trueTheta = 0.9;
  const sourceRaw = target.map((p) => ({
    x: p.x * Math.cos(trueTheta) - p.y * Math.sin(trueTheta),
    y: p.x * Math.sin(trueTheta) + p.y * Math.cos(trueTheta),
  }));

  const targetDots = target.map((p) =>
    el("circle", { cx: cx + p.x, cy: cy + p.y, r: 6, fill: "#1f8a5f", "fill-opacity": 0.75 }),
  );
  const sourceDots = sourceRaw.map(() =>
    el("circle", { cx: 0, cy: 0, r: 6, fill: "#b8720c", "fill-opacity": 0.75 }),
  );
  const links = target.map(() =>
    el("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: "#e2e4ee", "stroke-width": 1 }),
  );
  links.forEach((l) => s.appendChild(l));
  targetDots.forEach((d) => s.appendChild(d));
  sourceDots.forEach((d) => s.appendChild(d));
  host.appendChild(s);

  const out = readout(host, "");
  let angle = 0;
  function draw() {
    let err = 0;
    sourceRaw.forEach((p, i) => {
      const rx = p.x * Math.cos(angle) - p.y * Math.sin(angle);
      const ry = p.x * Math.sin(angle) + p.y * Math.cos(angle);
      sourceDots[i].setAttribute("cx", String(cx + rx));
      sourceDots[i].setAttribute("cy", String(cy + ry));
      links[i].setAttribute("x1", String(cx + target[i].x));
      links[i].setAttribute("y1", String(cy + target[i].y));
      links[i].setAttribute("x2", String(cx + rx));
      links[i].setAttribute("y2", String(cy + ry));
      err += (target[i].x - rx) ** 2 + (target[i].y - ry) ** 2;
    });
    out.set(
      `Alignment error (sum of squared distances) = ${fmt(err)} at rotation angle ${fmt((angle * 180) / Math.PI)}°`,
    );
  }
  draw();

  sliderControl(
    host,
    "Rotate orange shape",
    { min: 0, max: Math.PI * 2, step: 0.01, value: angle },
    (v) => {
      angle = v;
      draw();
    },
  );

  function solveExactly() {
    // Closed-form optimal 2D rotation (the SVD-based Procrustes solution, specialized to 2x2)
    let num = 0,
      den = 0;
    sourceRaw.forEach((p, i) => {
      num += target[i].x * p.y - target[i].y * p.x;
      den += target[i].x * p.x + target[i].y * p.y;
    });
    const best = Math.atan2(num, den);
    const start = angle;
    animate(700, (t) => {
      angle = start + (best - start) * t;
      draw();
    });
  }
  replayButton(host, "↻ Solve exactly via SVD", solveExactly);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Green = target shape. Orange = the same shape, rotated. Drag the slider yourself, or let the closed-form Procrustes solution snap it into perfect alignment.";
  host.appendChild(hint);
};

/* 1.33 — conjugate gradient reaches the minimum in far fewer steps than plain gradient descent */
export const renderConjugateGradient: DiagramRender = (host) => {
  const s = svg("0 0 320 280");
  const cx = 160,
    cy = 140,
    scale = 30;
  const A = { a: 1, d: 6 }; // deliberately ill-conditioned, like section 1.16's diagram
  drawQuadraticContours(s, cx, cy, scale, A.a, A.d);
  const start = { x: -3.2, y: 1.3 };

  const gdPath = el("path", {
    d: "",
    fill: "none",
    stroke: "#c23b3b",
    "stroke-width": 2,
    "stroke-dasharray": "3,3",
  });
  const cgPath = el("path", { d: "", fill: "none", stroke: "#1f8a5f", "stroke-width": 2.5 });
  s.appendChild(gdPath);
  s.appendChild(cgPath);
  const gdDot = el("circle", {
    cx: cx + start.x * scale,
    cy: cy + start.y * scale,
    r: 5,
    fill: "#c23b3b",
  });
  const cgDot = el("circle", {
    cx: cx + start.x * scale,
    cy: cy + start.y * scale,
    r: 5,
    fill: "#1f8a5f",
  });
  s.appendChild(gdDot);
  s.appendChild(cgDot);
  host.appendChild(s);

  const out = readout(
    host,
    "Press Run to race gradient descent (red, dashed) against conjugate gradient (green, solid).",
  );
  const cancels: Array<() => void> = [];

  function run() {
    // Plain gradient descent
    const lr = 0.06;
    let gx = start.x,
      gy = start.y;
    const gdPts = [`M${cx + gx * scale},${cy + gy * scale}`];
    for (let i = 0; i < 45; i++) {
      gx -= lr * 2 * A.a * gx;
      gy -= lr * 2 * A.d * gy;
      gdPts.push(`L${cx + gx * scale},${cy + gy * scale}`);
    }

    // Conjugate gradient on f(x) = a*x^2 + d*y^2 (exact for a 2D quadratic in at most 2 steps)
    let x = start.x,
      y = start.y;
    let rx = -2 * A.a * x,
      ry = -2 * A.d * y; // residual = -gradient
    let dx = rx,
      dy = ry;
    const cgPts = [`M${cx + x * scale},${cy + y * scale}`];
    for (let i = 0; i < 2; i++) {
      const Adx = 2 * A.a * dx,
        Ady = 2 * A.d * dy;
      const rDotR = rx * rx + ry * ry;
      const dDotAd = dx * Adx + dy * Ady;
      const alpha = dDotAd !== 0 ? rDotR / dDotAd : 0;
      x += alpha * dx;
      y += alpha * dy;
      cgPts.push(`L${cx + x * scale},${cy + y * scale}`);
      const rxNew = rx - alpha * Adx,
        ryNew = ry - alpha * Ady;
      const beta = rDotR !== 0 ? (rxNew * rxNew + ryNew * ryNew) / rDotR : 0;
      dx = rxNew + beta * dx;
      dy = ryNew + beta * dy;
      rx = rxNew;
      ry = ryNew;
    }

    let step = 0;
    const maxSteps = Math.max(gdPts.length, cgPts.length);
    cancels.push(
      animate(
        1800,
        (t) => {
          const gdIdx = Math.min(gdPts.length - 1, Math.floor(t * (gdPts.length - 1)));
          const cgIdx = Math.min(cgPts.length - 1, Math.floor(t * (cgPts.length - 1)));
          gdPath.setAttribute("d", gdPts.slice(0, gdIdx + 1).join(" "));
          cgPath.setAttribute("d", cgPts.slice(0, cgIdx + 1).join(" "));
        },
        () => {
          gdPath.setAttribute("d", gdPts.join(" "));
          cgPath.setAttribute("d", cgPts.join(" "));
          out.set(
            `Gradient descent needed ${gdPts.length - 1} steps to look converged. Conjugate gradient reached the exact minimum in ${cgPts.length - 1} steps — the theoretical maximum for any 2D quadratic.`,
          );
        },
      ),
    );
    step = maxSteps;
    void step;
  }
  replayButton(host, "↻ Run", run);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "This bowl is deliberately stretched — exactly the case where plain gradient descent zig-zags badly, and CG's advantage is largest.";
  host.appendChild(hint);

  return () => cancels.forEach((c) => c());
};
