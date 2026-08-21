import {
  SectionBlock,
  Derivation,
  ExpertNote,
  Quiz,
  Pitfall,
  MultiCodeExample,
  Takeaway,
  DiagramBlock,
} from "@/components/docs/lesson-blocks";
import { Formula } from "@/components/docs/formula";
import { DiagramHost } from "@/components/docs/diagram-host";
import {
  el,
  svg,
  makeDraggable,
  dragHandle,
  toggleGroup,
  replayButton,
  animate,
  ease,
} from "@/lib/diagram-helpers";
import type { DiagramRender } from "@/components/docs/diagram-host";

type Pt = { x: number; y: number };

/** Signed area helper for the convex-hull sweep below — positive when o->a->b turns left. */
function cross(o: Pt, a: Pt, b: Pt) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** Andrew's monotone-chain convex hull — used only to draw a faint outline so it's visually
 *  obvious which of the current points sits "inside" the others, echoing the convex-hull
 *  argument used in the derivation below. Fine for the handful of points this diagram ever has. */
function convexHull(points: Pt[]): Pt[] {
  const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/** Every one of the 2^n possible +/-1 labelings of n points, as plain sign vectors. */
function allLabelings(n: number): number[][] {
  const out: number[][] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    const row: number[] = [];
    for (let i = 0; i < n; i++) row.push(mask & (1 << i) ? 1 : -1);
    out.push(row);
  }
  return out;
}

/**
 * Honest, from-scratch separability check: two finite point sets are linearly separable
 * exactly when *some* direction's projections of the two classes don't overlap (a line's
 * normal vector is exactly such a direction). This sweeps candidate directions finely and
 * returns the widest margin found, which is enough to both decide separability and draw a
 * real separating line for it — no perceptron training loop needed for a diagram this small
 * (that version is saved for the code example below).
 */
function bestSeparation(pts: Pt[], labels: number[]) {
  const posIdx = labels.map((l, i) => (l === 1 ? i : -1)).filter((i) => i >= 0);
  const negIdx = labels.map((l, i) => (l === -1 ? i : -1)).filter((i) => i >= 0);
  if (posIdx.length === 0 || negIdx.length === 0) {
    return { gap: Infinity, angle: 0, threshold: 0, trivial: true };
  }
  let best = { gap: -Infinity, angle: 0, threshold: 0, trivial: false };
  const STEPS = 1800;
  for (let s = 0; s < STEPS; s++) {
    const angle = (s / STEPS) * Math.PI;
    const dx = Math.cos(angle),
      dy = Math.sin(angle);
    const posProj = posIdx.map((i) => pts[i].x * dx + pts[i].y * dy);
    const negProj = negIdx.map((i) => pts[i].x * dx + pts[i].y * dy);
    const maxPos = Math.max(...posProj),
      minPos = Math.min(...posProj);
    const maxNeg = Math.max(...negProj),
      minNeg = Math.min(...negProj);
    const gapPosBelow = minNeg - maxPos; // every + point projects below every - point
    const gapNegBelow = minPos - maxNeg; // every - point projects below every + point
    if (gapPosBelow > best.gap) {
      best = { gap: gapPosBelow, angle, threshold: (minNeg + maxPos) / 2, trivial: false };
    }
    if (gapNegBelow > best.gap) {
      best = { gap: gapNegBelow, angle, threshold: (minPos + maxNeg) / 2, trivial: false };
    }
  }
  return best;
}

const POS_COLOR = "#4f5fe0";
const NEG_COLOR = "#d1453d";
const LINE_COLOR = "#1f8a5f";
const SEP_EPS = 2; // in SVG units — small tolerance against angle-sweep discretization

/** 2.1.5 diagram — drag 3 or 4 points around the plane, cycle through every possible +/-
 *  labeling of them, and watch whether a straight line can realize that exact labeling.
 *  With 3 points in general position every labeling works; with 4 points, at least one
 *  never does — this is "shattering" and the VC dimension argument, made interactive. */
const renderShatteringExplorer: DiagramRender = (host) => {
  const W = 320,
    H = 300;
  const s = svg(`0 0 ${W} ${H}`);

  const basePoints: Pt[] = [
    { x: 70, y: 230 },
    { x: 250, y: 230 },
    { x: 160, y: 50 },
    { x: 160, y: 175 }, // sits inside the triangle formed by the other three
  ];
  const points: Pt[] = basePoints.map((p) => ({ ...p }));
  let count: 3 | 4 = 3;
  let combos = allLabelings(count);
  let labelIdx = 5; // [+1,-1,+1] — a genuine, non-trivial 2-vs-1 split to open on

  const hull = el("polygon", {
    points: "",
    fill: "#8b90ab",
    "fill-opacity": "0.08",
    stroke: "#b4b8ce",
    "stroke-width": 1.25,
    "stroke-dasharray": "4,3",
  });
  const boundary = el("line", {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: LINE_COLOR,
    "stroke-width": 2.5,
  });
  s.appendChild(hull);
  s.appendChild(boundary);

  const handles: SVGCircleElement[] = points.map((p) => {
    const h = dragHandle(p.x, p.y, POS_COLOR);
    s.appendChild(h);
    return h;
  });
  host.appendChild(s);

  const status = document.createElement("p");
  status.className = "mt-2.5 text-center font-mono text-[13px] font-semibold";
  host.appendChild(status);

  function setStatus(text: string, ok: boolean) {
    status.textContent = text;
    status.className = `mt-2.5 text-center font-mono text-[13px] font-semibold ${
      ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
    }`;
  }

  /** Computes hull/handle/boundary state for the current (count, labelIdx) and applies it.
   *  When `animateLine` is false the boundary snaps straight to its target (used for live
   *  dragging and manual palette/toggle clicks, exactly as before). When true, the boundary's
   *  endpoints and opacity glide from wherever they currently are to the new target over
   *  `duration` ms — used only by the automatic intro below. Returns a cancel function. */
  function drawStep(animateLine: boolean, duration = 700, onDone?: () => void) {
    const activePts = points.slice(0, count);
    const activeLabels = combos[labelIdx];

    const hullPts = convexHull(activePts);
    hull.setAttribute("points", hullPts.map((p) => `${p.x},${p.y}`).join(" "));

    handles.forEach((h, i) => {
      if (i >= count) {
        h.setAttribute("opacity", "0");
        h.style.pointerEvents = "none";
        return;
      }
      h.setAttribute("opacity", "1");
      h.style.pointerEvents = "auto";
      h.setAttribute("cx", String(points[i].x));
      h.setAttribute("cy", String(points[i].y));
      h.setAttribute("fill", activeLabels[i] === 1 ? POS_COLOR : NEG_COLOR);
    });

    const best = bestSeparation(activePts, activeLabels);
    const separable = best.trivial || best.gap > SEP_EPS;

    const currentCoords = {
      x1: Number(boundary.getAttribute("x1")) || 0,
      y1: Number(boundary.getAttribute("y1")) || 0,
      x2: Number(boundary.getAttribute("x2")) || 0,
      y2: Number(boundary.getAttribute("y2")) || 0,
      opacity: Number(boundary.getAttribute("opacity")) || 0,
    };

    let target: { x1: number; y1: number; x2: number; y2: number; opacity: number };
    if (separable && !best.trivial) {
      const dx = Math.cos(best.angle),
        dy = Math.sin(best.angle);
      const px = -dy,
        py = dx;
      const cx = dx * best.threshold,
        cy = dy * best.threshold;
      target = {
        x1: cx + px * 500,
        y1: cy + py * 500,
        x2: cx - px * 500,
        y2: cy - py * 500,
        opacity: 1,
      };
    } else {
      // No line to draw — keep the endpoints put and only fade opacity to 0, so a fade-out
      // never involves the line snapping to some unrelated position first.
      target = { ...currentCoords, opacity: 0 };
    }

    const labelStr = activeLabels.map((l) => (l === 1 ? "+" : "\u2212")).join("  ");
    setStatus(
      separable
        ? `labeling (${labelStr})  \u2192  \u2713 linearly separable`
        : `labeling (${labelStr})  \u2192  \u2717 NOT linearly separable — no line can do this`,
      separable,
    );

    if (!animateLine) {
      boundary.setAttribute("x1", String(target.x1));
      boundary.setAttribute("y1", String(target.y1));
      boundary.setAttribute("x2", String(target.x2));
      boundary.setAttribute("y2", String(target.y2));
      boundary.setAttribute("opacity", String(target.opacity));
      onDone?.();
      return () => {};
    }
    return animate(
      duration,
      (eased) => {
        boundary.setAttribute(
          "x1",
          String(currentCoords.x1 + (target.x1 - currentCoords.x1) * eased),
        );
        boundary.setAttribute(
          "y1",
          String(currentCoords.y1 + (target.y1 - currentCoords.y1) * eased),
        );
        boundary.setAttribute(
          "x2",
          String(currentCoords.x2 + (target.x2 - currentCoords.x2) * eased),
        );
        boundary.setAttribute(
          "y2",
          String(currentCoords.y2 + (target.y2 - currentCoords.y2) * eased),
        );
        boundary.setAttribute(
          "opacity",
          String(currentCoords.opacity + (target.opacity - currentCoords.opacity) * eased),
        );
      },
      onDone,
      ease.inOutCubic,
    );
  }

  /** Instant, non-animated redraw — used by every manual interaction (drag, palette click,
   *  point-count toggle) so the diagram responds immediately. */
  function draw() {
    drawStep(false);
  }

  let introCancel: (() => void) | null = null;
  function stopIntro() {
    if (introCancel) {
      introCancel();
      introCancel = null;
    }
  }

  /** Plays a short automatic demonstration once on mount: a couple of labelings of the
   *  3-point case (all separable), then switches to 4 points and lands on the one labeling
   *  that never is — before handing control back to the reader. */
  function playIntro() {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const steps: Array<() => void> = [
      () => {
        labelIdx = 3; // a different 2-vs-1 split from the resting default
        paintPalette();
      },
      () => {
        labelIdx = 6;
        paintPalette();
      },
      () => {
        count = 4;
        rebuildPalette();
      },
      () => {
        count = 3;
        rebuildPalette();
      },
    ];
    let i = 0;
    function next() {
      if (cancelled || i >= steps.length) return;
      steps[i]();
      i += 1;
      drawStep(true, 750, () => {
        if (cancelled) return;
        timeoutId = setTimeout(next, 550);
      });
    }
    next();
    introCancel = () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }

  draw();

  const stopDrags = points.map((_, i) =>
    makeDraggable(handles[i], s, (p) => {
      stopIntro();
      points[i] = {
        x: Math.max(14, Math.min(W - 14, p.x)),
        y: Math.max(14, Math.min(H - 14, p.y)),
      };
      draw();
    }),
  );

  toggleGroup(
    host,
    [
      { label: "3 points", value: "3" },
      { label: "4 points", value: "4" },
    ],
    "3",
    (v) => {
      stopIntro();
      count = v === "4" ? 4 : 3;
      rebuildPalette();
      draw();
    },
  );

  const paletteWrap = document.createElement("div");
  paletteWrap.className = "mt-3 flex max-w-[280px] flex-wrap justify-center gap-1.5";
  host.appendChild(paletteWrap);

  function paintPalette() {
    Array.from(paletteWrap.children).forEach((child, ci) => {
      (child as HTMLButtonElement).className =
        ci === labelIdx
          ? "rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-[11px] font-mono font-medium text-primary transition-colors"
          : "rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:text-foreground";
    });
  }

  function rebuildPalette() {
    combos = allLabelings(count);
    labelIdx = count === 4 ? 7 : 5; // 4 -> isolate the inside point; 3 -> a real 2-vs-1 split
    paletteWrap.innerHTML = "";
    combos.forEach((combo, ci) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = combo.map((v) => (v === 1 ? "+" : "\u2212")).join(" ");
      btn.addEventListener("click", () => {
        stopIntro();
        labelIdx = ci;
        paintPalette();
        draw();
      });
      paletteWrap.appendChild(btn);
    });
    paintPalette();
  }
  rebuildPalette();
  draw();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Blue = +1, red = \u22121. Drag the points, switch between 3 and 4 of them, and click every " +
    "\u00b1 labeling below — for 3 points in general position every labeling is separable; add a " +
    "4th and at least one labeling (try the default one) never is, no matter how you drag the points.";
  host.appendChild(hint);

  function reset() {
    stopIntro();
    basePoints.forEach((p, i) => (points[i] = { ...p }));
    count = 3;
    rebuildPalette();
    draw();
  }
  const buttonRow = document.createElement("div");
  buttonRow.className = "mt-2 flex justify-center gap-2";
  host.appendChild(buttonRow);
  replayButton(buttonRow, "\u21bb Reset points", reset);
  replayButton(buttonRow, "\u25b6 Replay intro", () => {
    stopIntro();
    reset();
    playIntro();
  });

  playIntro();

  return () => {
    stopIntro();
    stopDrags.forEach((stop) => stop());
  };
};

export function LearningTheory() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> the previous three lessons kept circling the same informal
          worry — a model can look great on the data it trained on and still fail on new data, and
          "capacity" seems to be involved somehow. <strong>PAC learning</strong> ("Probably
          Approximately Correct") is where that worry finally gets a precise, checkable answer. A
          hypothesis class is called <em>PAC-learnable</em> if, once you feed a learning algorithm
          enough training examples, you can guarantee — with high probability (the "probably"), not
          absolute certainty — that the rule it learns will have error close to the best possible
          error achievable within that class (the "approximately correct"). The whole theory is
          really just an honest answer to "how many practice problems do I need before my
          practice-test score becomes trustworthy evidence about the real exam?"
        </p>
        <p>
          <strong>Intermediate:</strong> to make "enough examples" precise, learning theory needs a
          precise notion of how "big" or "expressive" a hypothesis class is — and the classic tool
          for that is <strong>shattering</strong>. A hypothesis class <em>shatters</em> a set of
          points if, for every one of the possible ways you could label those points{" "}
          <span style={{ whiteSpace: "nowrap" }}>{"(+1/-1)"}</span>, some hypothesis in the class
          realizes that exact labeling. The <strong>VC dimension</strong> (Vapnik–Chervonenkis
          dimension) of a class is the size of the largest set it can shatter. Concretely: a
          straight-line (half-plane) classifier in the plane can shatter any 3 points that aren't
          all on one line — for every possible +/- assignment to those 3 points, some line achieves
          it — but it can never shatter 4 points, no matter how they're arranged: at least one of
          the 16 possible labelings of any 4 points is unachievable by any single line. The diagram
          and derivation below make both halves of that claim fully concrete.
        </p>
        <p>
          <strong>Advanced:</strong> the payoff is a <strong>generalization bound</strong> — a
          formula, not just an intuition — of the shape "true error is at most training error plus a
          complexity term that grows with the class's VC dimension (or, more precisely and more
          modernly, its Rademacher complexity) and shrinks as the training set grows." This is the
          rigorous version of the generalization gap the last three lessons discussed only
          informally, and it's exactly why capacity (2.1.4) matters for generalization, not just for
          training accuracy. A separate, equally important result is the{" "}
          <strong>No-Free-Lunch theorem</strong>: averaged over every conceivable learning problem
          and data distribution, no single algorithm outperforms every other algorithm. Any
          algorithm's good performance is only ever relative to some implicit assumption — an{" "}
          <em>inductive bias</em> — about the kind of data it will actually see. That single fact is
          why the rest of this chapter covers a whole zoo of model families instead of converging on
          one universally best algorithm.
        </p>
      </SectionBlock>

      <SectionBlock id="formula" label="Formula" tone="formula">
        <p className="mb-1.5 text-[13.5px] text-muted-foreground">
          With probability at least <code>1 - δ</code> over the random draw of the training set,
          simultaneously for every hypothesis <code>f</code> in a class <code>H</code> of VC
          dimension <code>d</code> (this "simultaneously for every f" property is called{" "}
          <strong>uniform convergence</strong>, and it's the part that makes the bound apply even to
          whichever f your algorithm happens to pick):
        </p>
        <Formula>
          {
            "R(f) \\ \\le\\ \\hat R(f) \\ +\\ O\\!\\left(\\sqrt{\\dfrac{d\\log(n/d) + \\log(1/\\delta)}{n}}\\right)"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          <Formula display={false}>{"R(f)"}</Formula> is the true risk (expected error over the
          whole data distribution — the number you actually care about but can never observe
          directly), <Formula display={false}>{"\\hat R(f)"}</Formula> is the empirical risk (error
          measured on the training set — the number you can observe), <code>n</code> is the number
          of training examples, and <code>δ</code> is the failure probability you're willing to
          tolerate. Bigger <code>d</code> (more capacity) makes the complexity term bigger,
          loosening the bound and demanding more data <code>n</code> to tighten it back up — the
          exact formal trade-off "capacity vs. data" that the last lesson only sketched
          qualitatively. Wanting more confidence (a smaller <code>δ</code>, so <code>1 - δ</code>{" "}
          closer to 1) also loosens the bound, but only through a <code>log(1/δ)</code> term —
          confidence is cheap; capacity is expensive.
        </p>
      </SectionBlock>

      <Derivation
        id="derivation"
        title="Derivation: the VC dimension of linear classifiers in the plane is exactly 3"
      >
        <p>
          The hypothesis class here is every linear threshold function on{" "}
          <Formula display={false}>{"\\mathbb{R}^2"}</Formula>:
        </p>
        <Formula>{"h_{w,b}(x) = \\text{sign}(w \\cdot x + b)"}</Formula>
        <p>
          — every possible straight-line decision boundary, with either side labeled +1 or -1.
          Proving the VC dimension is exactly 3 takes two separate halves: some set of 3 points can
          be shattered, and no set of 4 points ever can.
        </p>
        <p>
          <strong>(a) Some 3 points can be shattered.</strong> Take 3 points in{" "}
          <em>general position</em> — not all on one line — say a triangle <code>A = (0,0)</code>,{" "}
          <code>B = (4,0)</code>, <code>C = (0,4)</code>. There are{" "}
          <Formula display={false}>{"2^3 = 8"}</Formula> possible labelings, and they split into
          exactly two shapes: all three points sharing one label (2 labelings), or one point
          isolated from the other two (the remaining 6 — 3 choices of which point, times 2 sign
          choices). The all-same-label case is trivial — push the boundary line far outside the
          triangle entirely, e.g. <code>x - 100 &gt; 0</code> is false everywhere near the triangle,
          so every point lands on the same side. The "isolate one vertex" case is the one worth
          checking concretely, because it's the case that actually breaks down at 4 points. To
          isolate <code>B</code> from <code>{"{A, C}"}</code>, take <code>w = (1,-1)</code>,{" "}
          <code>b = -2</code>:
        </p>
        <Formula>
          {
            "h(A) = \\text{sign}(0-0-2) = -1,\\quad h(B) = \\text{sign}(4-0-2) = +1,\\quad h(C) = \\text{sign}(0-4-2) = -1"
          }
        </Formula>
        <p>
          — exactly the labeling <code>{"{A:-1, B:+1, C:-1}"}</code>. To isolate <code>A</code>{" "}
          instead, take <code>w = (-1,-1)</code>, <code>b = 2</code>:
        </p>
        <Formula>
          {
            "h(A) = \\text{sign}(0+2) = +1,\\quad h(B) = \\text{sign}(-4+2) = -1,\\quad h(C) = \\text{sign}(-4+2) = -1"
          }
        </Formula>
        <p>
          Geometrically, this always works for any triangle: a line placed close to a chosen vertex,
          cutting through the two edges incident to it, clips that vertex off from the other two —
          and it can always be placed close enough to do so precisely <em>because</em> that vertex
          doesn't lie on the segment joining the other two points, which is exactly what "general
          position" (not collinear) rules out. All 8 labelings are achievable, so this 3-point set
          is shattered.
        </p>
        <p>
          <strong>(b) No 4 points can ever be shattered.</strong> Any 4 points in the plane (with no
          3 collinear) fall into exactly one of two configurations, and each one has a specific
          labeling no line can produce.
        </p>
        <p>
          <em>Case 1 — one point lies inside the triangle of the other three.</em> Say point{" "}
          <code>D</code> lies strictly inside triangle <code>ABC</code>, so{" "}
          <code>D = αA + βB + γC</code> for some weights <code>α, β, γ ≥ 0</code> summing to 1. Try
          to label <code>D</code> as -1 and <code>A, B, C</code> all as +1. For any affine function{" "}
          <code>g(x) = w·x + b</code>, linearity plus <code>α + β + γ = 1</code> gives{" "}
          <code>g(D) = α·g(A) + β·g(B) + γ·g(C)</code> — check it by substituting and using{" "}
          <code>α+β+γ=1</code> to distribute <code>b</code> correctly. If a line achieved{" "}
          <code>A, B, C</code> all positive, then <code>g(D)</code> is a weighted average of three{" "}
          <em>positive</em> numbers with non-negative weights, so <code>g(D) &gt; 0</code> too —{" "}
          <code>D</code> is forced to also read as +1. The desired labeling is impossible.
        </p>
        <p>
          <em>Case 2 — all four points form a convex quadrilateral.</em> Order them around the
          quadrilateral as <code>P1, P2, P3, P4</code> and try the "XOR" labeling: <code>P1</code>{" "}
          and <code>P3</code> (one diagonal pair) as +1, <code>P2</code> and <code>P4</code> (the
          other diagonal) as -1. The two diagonals of a convex quadrilateral always cross, at some
          point <code>X</code> that lies on both segments: <code>X = λP1 + (1-λ)P3</code> for some{" "}
          <code>λ ∈ (0,1)</code>, and also <code>X = μP2 + (1-μ)P4</code> for some{" "}
          <code>μ ∈ (0,1)</code>. If the labeling were achieved, <code>g(P1), g(P3) &gt; 0</code>{" "}
          would force <code>g(X)</code> — a convex combination of two positive numbers — to be
          positive; but <code>g(P2), g(P4) &lt; 0</code> would simultaneously force the very same{" "}
          <code>g(X)</code> — now read as a convex combination of two negative numbers — to be
          negative. <code>g(X)</code> can't be both, so no such line exists.
        </p>
        <p>
          Since every 4-point configuration falls into one of these two cases, and each case has a
          labeling no line achieves, no 4 points can be shattered. Combined with part (a): the VC
          dimension of linear classifiers in the plane is exactly <strong>3</strong>. The same style
          of argument generalizes to <Formula display={false}>{"\\mathbb{R}^d"}</Formula>, giving VC
          dimension exactly <code>d + 1</code> — one more than the number of input dimensions,
          matching the <code>d + 1</code> free numbers (the weight vector plus the bias) that
          specify a hyperplane, though the full higher-dimensional proof (via Radon's theorem) is
          beyond what's worth reproducing here.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is the precise, formal reason "more parameters
          isn't automatically better" from the previous lesson (2.1.4) on overfitting and capacity.
          Notice what the VC dimension of a linear classifier does <em>not</em> depend on: the
          absolute number of features being small. It scales as <code>d + 1</code> in the number of
          input dimensions, full stop — a linear classifier over 500 features has VC dimension 501
          whether or not that's "too much," and whether it generalizes well is entirely about how
          501 compares to how many training examples <code>n</code> you have, exactly the ratio
          sitting inside the Formula bound above. Capacity is never good or bad in isolation — it's
          only ever good or bad relative to <code>n</code>.
        </p>
      </Derivation>

      <DiagramBlock
        id="diagram"
        title="Explore shattering: drag points, try every labeling"
        caption="With 3 points in general position, every +/- labeling has some separating line. Switch to 4 points (the 4th starts inside the triangle) and the default labeling — isolating that inside point — has none, exactly as proved above; drag the points anywhere and cycle through the palette to see it hold for every configuration."
      >
        <DiagramHost render={renderShatteringExplorer} />
      </DiagramBlock>

      <MultiCodeExample
        id="practical"
        title="Practical example — measuring separability by brute force"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import itertools

# A triangle in "general position" (3 points, no two share a line) and the same
# triangle with a 4th point placed strictly inside it -- the two configurations
# from the derivation above, as plain coordinate tuples.
POINTS_3 = [(0.0, 0.0), (4.0, 0.0), (0.0, 4.0)]
POINTS_4 = POINTS_3 + [(1.0, 1.0)]


def perceptron_converges(points, labels, epochs=2000, lr=1.0):
    """Runs the classic perceptron update rule for a fixed number of passes and reports
    whether it drove training error to exactly zero. For small, well-behaved point sets
    like these, this is a reasonable practical proxy for "is this labeling linearly
    separable": the perceptron convergence theorem guarantees zero error is reached in
    finitely many passes whenever a separating line genuinely exists, and the algorithm
    keeps making mistakes forever whenever one does not.
    """
    w1, w2, b = 0.0, 0.0, 0.0
    for _ in range(epochs):
        mistakes = 0
        for (x1, x2), y in zip(points, labels):
            score = w1 * x1 + w2 * x2 + b
            pred = 1 if score > 0 else -1
            if pred != y:
                w1 += lr * y * x1
                w2 += lr * y * x2
                b += lr * y
                mistakes += 1
        if mistakes == 0:
            return True
    return False


def count_separable_labelings(points):
    n = len(points)
    separable = 0
    for labels in itertools.product([-1, 1], repeat=n):
        if perceptron_converges(points, list(labels)):
            separable += 1
    return separable, 2 ** n


for name, pts in [("3 points (triangle)", POINTS_3), ("4 points (+ interior point)", POINTS_4)]:
    ok, total = count_separable_labelings(pts)
    print(f"{name}: {ok}/{total} labelings are linearly separable")

# Running this prints 8/8 for the 3-point set -- fully shattered -- and 14/16 for the
# 4-point set: exactly the two labelings that isolate the interior point alone against
# the other three (the impossible case proved algebraically above) come back "not
# separable"; every other split of the four points is still fine.`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <iostream>
#include <vector>

using namespace std;

struct Point { double x; double y; };

// Same perceptron-convergence proxy for linear separability, re-implemented with
// explicit loops and no libraries beyond <vector>.
bool perceptronConverges(const vector<Point>& points, const vector<int>& labels,
                          int epochs = 2000, double lr = 1.0) {
    double w1 = 0.0, w2 = 0.0, b = 0.0;
    for (int epoch = 0; epoch < epochs; epoch++) {
        int mistakes = 0;
        for (size_t i = 0; i < points.size(); i++) {
            double score = w1 * points[i].x + w2 * points[i].y + b;
            int pred = (score > 0.0) ? 1 : -1;
            if (pred != labels[i]) {
                w1 += lr * labels[i] * points[i].x;
                w2 += lr * labels[i] * points[i].y;
                b += lr * labels[i];
                mistakes++;
            }
        }
        if (mistakes == 0) return true;
    }
    return false;
}

int countSeparableLabelings(const vector<Point>& points) {
    int n = static_cast<int>(points.size());
    int total = 1 << n;
    int separableCount = 0;
    for (int mask = 0; mask < total; mask++) {
        vector<int> labels(n);
        for (int i = 0; i < n; i++) {
            labels[i] = (mask & (1 << i)) ? 1 : -1;
        }
        if (perceptronConverges(points, labels)) separableCount++;
    }
    return separableCount;
}

int main() {
    vector<Point> points3 = {{0.0, 0.0}, {4.0, 0.0}, {0.0, 4.0}};
    vector<Point> points4 = {{0.0, 0.0}, {4.0, 0.0}, {0.0, 4.0}, {1.0, 1.0}};

    int sep3 = countSeparableLabelings(points3);
    int sep4 = countSeparableLabelings(points4);

    cout << "3 points (triangle): " << sep3 << "/8 labelings are linearly separable\\n";
    cout << "4 points (+ interior point): " << sep4 << "/16 labelings are linearly separable\\n";

    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import learning_curve

# No mainstream library computes "VC dimension" directly for anything beyond a few
# textbook model families -- it's either intractable or not tight enough to be useful
# for real pipelines. In practice, engineers use learning curves instead: train the same
# model on growing subsets of the data and watch the train/validation score gap. A gap
# that's already small and keeps shrinking as n grows is the empirical stand-in for
# "this model's capacity is well matched to how much data I have" -- exactly the n-vs-d
# trade-off from the Formula bound above, measured instead of computed by hand.
X, y = make_classification(
    n_samples=2000, n_features=20, n_informative=8, n_redundant=2, random_state=42
)

train_sizes, train_scores, val_scores = learning_curve(
    LogisticRegression(max_iter=1000),
    X, y,
    train_sizes=np.linspace(0.1, 1.0, 8),
    cv=5,
    scoring="accuracy",
)

for size, tr, va in zip(train_sizes, train_scores.mean(axis=1), val_scores.mean(axis=1)):
    print(f"n={size:5.0f}   train acc={tr:.3f}   val acc={va:.3f}   gap={tr - va:.3f}")

# A linear model's VC dimension is n_features + 1 (from the derivation above), so on most
# real datasets the train/val gap should already be modest even at small sample sizes,
# and keep narrowing as n grows -- the qualitative shape the bound predicts, even though
# nobody plugs numbers into the bound's actual formula to get it.`,
          },
        ]}
      >
        <p>
          There's no library function that returns "the VC dimension of this model," so the
          practical translation of the derivation above is an empirical one: for a small, fixed
          point set, try every possible +/- labeling and check, by actually attempting to fit a
          separator, whether each one is achievable. All three implementations below run that same
          brute-force check — first from scratch in Python and C++, using perceptron convergence as
          the separability test, then via the tool practitioners reach for instead of hand-computing
          VC dimension on anything past a textbook example: a <strong>learning curve</strong>.
        </p>
      </MultiCodeExample>

      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Nobody computes exact VC dimension for real models.</strong> For a deep network
            with millions of parameters, it's either intractable to compute or, when bounds do
            exist, so astronomically loose they're useless in practice (see the expert note below).
            What survives from the theory isn't the number itself but the{" "}
            <em>qualitative intuition</em> it justifies — which is exactly why regularization, data
            augmentation, and "rule of thumb" data-size guidelines (e.g. wanting several times as
            many labeled examples as a model has effective degrees of freedom) remain standard
            practice: they're all direct, practical responses to the same <code>d</code> vs.{" "}
            <code>n</code> tension the bound formalizes.
          </li>
          <li>
            <strong>The No-Free-Lunch theorem is the reason model families multiply</strong> instead
            of converging on one winner. Decision trees, kernel methods, and neural networks each
            bake in a different <em>inductive bias</em> — trees assume axis-aligned splits matter,
            kernel methods assume similarity in some feature space matters, deep nets assume
            compositional, hierarchical structure matters. None dominates the others across every
            possible problem; each dominates on the subset of real-world problems whose structure
            happens to match its built-in assumptions. Picking a model family is, implicitly, a bet
            about which assumptions your actual data satisfies.
          </li>
          <li>
            <strong>Learning curves</strong> — training-set-size on the x-axis, train and validation
            score on the y-axis — are the practical, model-agnostic tool engineers reach for instead
            of a theoretical bound. A large, non-shrinking gap between the two curves is the
            observable symptom of exactly the situation the Formula section describes: capacity
            that's currently too large relative to <code>n</code>. It's the same diagnosis the
            theory predicts, arrived at empirically rather than algebraically.
          </li>
          <li>
            <strong>Cross-validation more generally</strong> is the field's answer to "the bound is
            too loose to trust literally": rather than computing a theoretical ceiling on the
            generalization gap for a whole modeling pipeline (feature engineering, regularization
            strength, model family, all at once — far too complex for any clean VC-style analysis),
            just measure the gap directly on held-out data. It's the same question the theory in
            this lesson was trying to answer in advance, answered empirically instead.
          </li>
        </ul>
      </SectionBlock>

      <Pitfall>
        <ul>
          <li>
            Treating a VC-dimension-style bound as a literal, usable formula — "I have VC dimension
            20, therefore I need exactly this many examples." The constants hidden inside that{" "}
            <code>O(...)</code> are frequently enormous, and real bounds computed this way are
            routinely looser than the trivial fact that error is at most 1. They're a correct
            statement about <em>scaling</em> (more capacity needs more data, roughly like this),
            never a usable sample-size spec.
          </li>
          <li>
            Reading the No-Free-Lunch theorem as "all algorithms are equally good in practice, so
            model choice doesn't matter." It says no algorithm dominates across{" "}
            <em>every conceivable</em> problem and distribution, including adversarially
            constructed, structureless ones. On the actual, structured problems anyone works with,
            some algorithms are consistently and often dramatically better than others — the theorem
            explains <em>why</em> that's not a contradiction (their advantage comes from matching
            real structure, not from universal superiority), not that it isn't true.
          </li>
          <li>
            Equating "more parameters" with "more VC dimension" or "more effective capacity."
            They're related but not identical — a model can be massively overparameterized in raw
            parameter count while its architecture, its regularization, or the optimizer's{" "}
            <em>implicit bias</em> (which of the many parameter settings that fit the training data
            equally well it actually converges to) keeps its effective capacity far lower than the
            parameter count suggests. This is directly tied to the double-descent phenomenon from
            the previous lesson (2.1.4): the naive "more parameters, more overfitting" intuition,
            taken from classical VC-style reasoning, is exactly what double descent violates.
          </li>
        </ul>
      </Pitfall>

      <ExpertNote>
        <p>
          <strong>Rademacher complexity</strong> is the more modern alternative to VC dimension, and
          it's often substantially tighter. Instead of asking "what's the largest set this class can
          shatter" (a worst-case, purely combinatorial, distribution-free question), it asks a
          distribution-aware one: take random points from the actual data distribution, assign each
          a uniformly random +1/-1 "noise" label with no real pattern in it at all, and measure how
          well the best hypothesis in the class can fit those pure noise labels. A class that can
          fit random noise well is, definitionally, too flexible for its own good — that same
          flexibility is what lets it also fit real noise in a real training set, which is precisely
          what generalizes poorly. Rademacher complexity turns that intuition into a number, and
          because it can depend on the actual data distribution rather than the worst case over all
          possible inputs, it frequently gives tighter, more realistic bounds than a VC-dimension
          argument for the same class.
        </p>
        <p>
          Even so, classical learning theory — VC dimension, Rademacher complexity, and the
          uniform-convergence bounds built from them — does not fully explain modern deep learning.
          Networks with vastly more parameters than training examples, and VC-style capacity
          estimates large enough that the classical bounds are vacuous (predicting nothing tighter
          than "error is at most 1"), routinely generalize well in practice anyway. This is an
          acknowledged, still-open gap between the theory in this lesson and deep learning as
          actually practiced — current explanations lean on ideas like implicit regularization from
          stochastic gradient descent and "benign overfitting," and connect directly to the
          double-descent phenomenon flagged in the previous lesson, but there is no settled,
          textbook-clean theory yet that plays the same role for deep networks that VC dimension
          plays for linear classifiers.
        </p>
      </ExpertNote>

      <Quiz
        q="A hypothesis class has VC dimension 10. You train on n = 50 examples and reach zero training error. Should the generalization bound above make you confident the true error is also near zero? What changes if n = 100,000 instead?"
        a="At n = 50 with d = 10, the ratio of n to d is small, so the complexity term inside the square root -- roughly d·log(n/d) plus a log(1/δ) term, all divided by n -- stays large: the bound only guarantees that true error is at most training error plus something not-small, which is compatible with a true error that's still substantial even though training error is exactly zero. The zero isn't strong evidence of good generalization yet; the bound is simply too loose at this n to say much. At n = 100,000, the same fixed VC dimension of 10 makes d/n tiny, the complexity term shrinks toward zero, and the bound now genuinely supports trusting that near-zero training error means near-zero true error. Nothing about the model or the labeling changed between the two cases -- only how much data backs up the same fixed capacity, which is exactly the n-vs-d trade-off the Formula section states directly."
      />

      <Takeaway>
        <p>
          PAC learning turns "will this work on new data?" into a formal, checkable question, and VC
          dimension makes "how expressive is this hypothesis class?" a single number — exactly 3 for
          lines in the plane, <code>d + 1</code> for hyperplanes in <code>d</code> dimensions — that
          plugs directly into a generalization bound of the shape true error ≤ training error + a
          complexity term shrinking in <code>n</code> and growing in capacity. That bound is the
          rigorous backbone underneath every informal "generalization gap" and "capacity" discussion
          in the previous three lessons. The No-Free-Lunch theorem is the other half of the
          theoretical foundation: it's the formal reason no single algorithm wins everywhere, which
          is exactly why the rest of this chapter is organized around a whole family of different
          model classes rather than one best answer.
        </p>
      </Takeaway>
    </>
  );
}
