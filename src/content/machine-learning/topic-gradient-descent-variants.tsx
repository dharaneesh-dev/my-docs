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
import { DiagramHost, type DiagramRender } from "@/components/docs/diagram-host";
import {
  el,
  svg,
  sliderControl,
  readout,
  replayButton,
  animate,
  ease,
} from "@/lib/diagram-helpers";

/** Deterministic seeded PRNG (mulberry32) so the noisy SGD / mini-batch paths below are
 *  reproducible on first load instead of reshuffling every render. */
function mulberry32(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard Box-Muller transform: turns two uniform draws from `rng` into one standard-normal draw. */
function gaussian(rng: () => number) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/* 2.2.2 diagram — a deliberately elongated ("stretched-bowl") quadratic loss surface,
 * f(x,y) = 0.5*(KX*x^2 + KY*y^2) with KY >> KX, drawn as concentric contour ellipses.
 * Three dots start at the same point and take repeated GD steps toward the minimum at
 * the origin: a noise-free "batch" path, a heavily-noised "SGD" path (one-example-per-
 * step gradient noise), and a lightly-noised "mini-batch" path (noise reduced the way
 * averaging over ~32 examples reduces it). The steep axis (curvature KY) sets this toy
 * surface's Lipschitz constant L = KY, so the learning-rate slider's stability
 * thresholds (1/L, 2/L) land exactly where the Derivation section says they should. */
const KX = 1;
const KY = 5; // L = max(KX, KY) = 5, matching the Derivation's alpha <= 1/L = 0.2 threshold
const START_X = -3.4;
const START_Y = 2.0;
const TOL = 0.3;
const MAX_STEPS = 42;
const BOUND = 12;
const SIGMA_SGD = 1.0;
const SIGMA_MINI = 1.0 / Math.sqrt(32); // ~32-example mini-batch averages away most of the noise
const DEFAULT_ALPHA = 0.15;

const BATCH_COLOR = "#4f5fe0";
const SGD_COLOR = "#b8720c";
const MINI_COLOR = "#1f8a5f";

type PathPoint = { x: number; y: number };
type PathResult = { pts: PathPoint[]; convergedAt: number | null; diverged: boolean };

function simulatePath(alpha: number, sigma: number, rng: () => number): PathResult {
  let x = START_X;
  let y = START_Y;
  const pts: PathPoint[] = [{ x, y }];
  let diverged = false;
  let convergedAt: number | null = null;
  for (let k = 1; k <= MAX_STEPS; k++) {
    if (!diverged) {
      const nx = sigma > 0 ? sigma * gaussian(rng) : 0;
      const ny = sigma > 0 ? sigma * gaussian(rng) : 0;
      const gx = KX * x + nx;
      const gy = KY * y + ny;
      x = x - alpha * gx;
      y = y - alpha * gy;
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        Math.abs(x) > BOUND ||
        Math.abs(y) > BOUND
      ) {
        diverged = true;
        x = Math.max(-BOUND, Math.min(BOUND, Number.isFinite(x) ? x : BOUND));
        y = Math.max(-BOUND, Math.min(BOUND, Number.isFinite(y) ? y : BOUND));
      }
    }
    pts.push({ x, y });
    if (convergedAt === null && !diverged && Math.sqrt(x * x + y * y) < TOL) convergedAt = k;
  }
  return { pts, convergedAt, diverged };
}

const renderGdPaths: DiagramRender = (host) => {
  const PLOT_LEFT = 40,
    PLOT_RIGHT = 400,
    PLOT_TOP = 20,
    PLOT_BOTTOM = 270;
  const X_MIN = -4.6,
    X_MAX = 4.6,
    Y_MIN = -3.2,
    Y_MAX = 3.2;
  const scaleX = (PLOT_RIGHT - PLOT_LEFT) / (X_MAX - X_MIN);
  const scaleY = (PLOT_BOTTOM - PLOT_TOP) / (Y_MAX - Y_MIN);
  const clampX = (v: number) => Math.max(X_MIN, Math.min(X_MAX, v));
  const clampY = (v: number) => Math.max(Y_MIN, Math.min(Y_MAX, v));
  const mapX = (v: number) => PLOT_LEFT + (clampX(v) - X_MIN) * scaleX;
  const mapY = (v: number) => PLOT_BOTTOM - (clampY(v) - Y_MIN) * scaleY;

  const s = svg("0 0 440 300");

  // Concentric contour ellipses of f(x,y) = 0.5*(KX x^2 + KY y^2). Every level set of a
  // quadratic bowl is a similar ellipse, so a single eccentricity ratio (sqrt(KY/KX))
  // reused at five sizes draws the whole family.
  const ECC = Math.sqrt(KY / KX);
  [0.8, 1.6, 2.5, 3.5, 4.4].forEach((rx) => {
    const ry = rx / ECC;
    s.appendChild(
      el("ellipse", {
        cx: mapX(0),
        cy: mapY(0),
        rx: rx * scaleX,
        ry: ry * scaleY,
        fill: "none",
        stroke: "#dfe1ec",
        "stroke-width": 1,
      }),
    );
  });

  s.appendChild(
    el(
      "text",
      { x: PLOT_RIGHT - 4, y: PLOT_TOP + 12, "text-anchor": "end", class: "fill-muted-foreground" },
      [],
    ),
  ).textContent = "steep direction · L = 5";
  s.appendChild(
    el(
      "text",
      {
        x: PLOT_LEFT + 4,
        y: PLOT_BOTTOM - 6,
        "text-anchor": "start",
        class: "fill-muted-foreground",
      },
      [],
    ),
  ).textContent = "shallow direction · curvature = 1";

  // Minimum marker and shared starting point.
  s.appendChild(el("circle", { cx: mapX(0), cy: mapY(0), r: 4, fill: "#111827" }));
  s.appendChild(
    el("circle", {
      cx: mapX(START_X),
      cy: mapY(START_Y),
      r: 4,
      fill: "none",
      stroke: "#111827",
      "stroke-width": 1.5,
    }),
  );

  function pathD(pts: PathPoint[]) {
    return pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${mapX(p.x).toFixed(1)},${mapY(p.y).toFixed(1)}`)
      .join(" ");
  }

  const batchGuide = el("path", {
    d: "",
    fill: "none",
    stroke: BATCH_COLOR,
    "stroke-width": 1.5,
    opacity: 0.5,
  });
  const sgdGuide = el("path", {
    d: "",
    fill: "none",
    stroke: SGD_COLOR,
    "stroke-width": 1.5,
    opacity: 0.5,
  });
  const miniGuide = el("path", {
    d: "",
    fill: "none",
    stroke: MINI_COLOR,
    "stroke-width": 1.5,
    opacity: 0.5,
  });
  s.appendChild(batchGuide);
  s.appendChild(sgdGuide);
  s.appendChild(miniGuide);

  const batchDot = el("circle", {
    cx: mapX(START_X),
    cy: mapY(START_Y),
    r: 5.5,
    fill: BATCH_COLOR,
    stroke: "white",
    "stroke-width": 1.5,
  });
  const sgdDot = el("circle", {
    cx: mapX(START_X),
    cy: mapY(START_Y),
    r: 5.5,
    fill: SGD_COLOR,
    stroke: "white",
    "stroke-width": 1.5,
  });
  const miniDot = el("circle", {
    cx: mapX(START_X),
    cy: mapY(START_Y),
    r: 5.5,
    fill: MINI_COLOR,
    stroke: "white",
    "stroke-width": 1.5,
  });
  s.appendChild(batchDot);
  s.appendChild(sgdDot);
  s.appendChild(miniDot);

  host.appendChild(s);

  const legend = document.createElement("div");
  legend.className = "mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px]";
  function swatch(color: string, label: string) {
    const item = document.createElement("span");
    item.className = "inline-flex items-center gap-1.5 text-muted-foreground";
    const dot = document.createElement("span");
    dot.style.display = "inline-block";
    dot.style.width = "10px";
    dot.style.height = "10px";
    dot.style.borderRadius = "999px";
    dot.style.backgroundColor = color;
    item.appendChild(dot);
    const text = document.createElement("span");
    text.textContent = label;
    item.appendChild(text);
    return item;
  }
  legend.appendChild(swatch(BATCH_COLOR, "Batch GD (all examples/step)"));
  legend.appendChild(swatch(SGD_COLOR, "SGD (1 example/step)"));
  legend.appendChild(swatch(MINI_COLOR, "Mini-batch GD (~32 examples/step)"));
  host.appendChild(legend);

  const out = readout(host, "");

  function labelFor(res: PathResult) {
    if (res.diverged) return "diverged";
    if (res.convergedAt !== null) return `${res.convergedAt} steps`;
    return `>${MAX_STEPS} steps (still crawling)`;
  }

  function drawGuides(data: { batch: PathResult; sgd: PathResult; mini: PathResult }) {
    batchGuide.setAttribute("d", pathD(data.batch.pts));
    sgdGuide.setAttribute("d", pathD(data.sgd.pts));
    miniGuide.setAttribute("d", pathD(data.mini.pts));
  }

  function updateReadout(data: { batch: PathResult; sgd: PathResult; mini: PathResult }) {
    out.set(
      `Batch: ${labelFor(data.batch)}   ·   SGD: ${labelFor(data.sgd)}   ·   Mini-batch: ${labelFor(data.mini)}`,
    );
  }

  function placeAtFrac(data: { batch: PathResult; sgd: PathResult; mini: PathResult }, t: number) {
    const idx = t * MAX_STEPS;
    const i0 = Math.floor(idx);
    const frac = idx - i0;
    const i1 = Math.min(i0 + 1, MAX_STEPS);
    function lerp(pts: PathPoint[]) {
      const a = pts[i0],
        b = pts[i1];
      return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
    }
    const pb = lerp(data.batch.pts);
    const ps = lerp(data.sgd.pts);
    const pm = lerp(data.mini.pts);
    batchDot.setAttribute("cx", String(mapX(pb.x)));
    batchDot.setAttribute("cy", String(mapY(pb.y)));
    sgdDot.setAttribute("cx", String(mapX(ps.x)));
    sgdDot.setAttribute("cy", String(mapY(ps.y)));
    miniDot.setAttribute("cx", String(mapX(pm.x)));
    miniDot.setAttribute("cy", String(mapY(pm.y)));
  }

  let seedCounter = 7;
  function computeAll(alpha: number) {
    seedCounter += 1;
    const rngSgd = mulberry32(seedCounter * 97 + 13);
    const rngMini = mulberry32(seedCounter * 131 + 29);
    return {
      batch: simulatePath(alpha, 0, rngSgd),
      sgd: simulatePath(alpha, SIGMA_SGD, rngSgd),
      mini: simulatePath(alpha, SIGMA_MINI, rngMini),
    };
  }

  let currentAlpha = DEFAULT_ALPHA;
  let cancelAnim: (() => void) | null = null;

  function runStatic(alpha: number) {
    currentAlpha = alpha;
    const data = computeAll(alpha);
    drawGuides(data);
    updateReadout(data);
    placeAtFrac(data, 1);
  }

  function runAnimated(alpha: number) {
    currentAlpha = alpha;
    if (cancelAnim) cancelAnim();
    const data = computeAll(alpha);
    drawGuides(data);
    updateReadout(data);
    cancelAnim = animate(
      3200,
      (t) => placeAtFrac(data, t),
      () => {
        cancelAnim = null;
      },
      ease.linear,
    );
  }

  runAnimated(DEFAULT_ALPHA);

  const slider = sliderControl(
    host,
    "Learning rate α",
    { min: 0.02, max: 0.42, step: 0.01, value: DEFAULT_ALPHA },
    (v) => runStatic(v),
  );
  void slider;

  replayButton(host, "↻ Replay animation", () => runAnimated(currentAlpha));

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "All three dots start at the same point on this stretched-bowl loss. Batch GD (blue) takes the exact gradient every step; SGD (amber) takes one noisy example's gradient every step and visibly wanders even while trending inward; mini-batch GD (green) averages ~32 examples and tracks close to the batch path with only light jitter. Drag the learning-rate slider for an instant preview, then hit Replay to watch the animated race at that rate — around alpha=0.20 (=1/L) batch GD's steep-direction step is right at the Derivation's guaranteed-descent threshold; push past alpha=0.40 (=2/L) and even the exact batch gradient overshoots and diverges.";
  host.appendChild(hint);

  return () => {
    if (cancelAnim) cancelAnim();
  };
};

export function GradientDescentVariants() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> gradient descent is "repeatedly take a small step downhill."
          The gradient of a function at a point is the direction of <em>steepest increase</em> — so
          if you want to go downhill as fast as possible right now, you step in exactly the opposite
          direction: the negative gradient. Take a small step that way, recompute the direction from
          your new spot (the downhill direction usually changes a little as you move), take another
          small step, and repeat. Stop once the steps stop helping — you've reached a point where
          every direction looks flat or uphill, which is (at least locally) the bottom.
        </p>
        <p>
          <strong>Intermediate:</strong> the interesting question is{" "}
          <em>what you compute the gradient from</em> at each step, and the three classical variants
          answer it differently. Imagine training on one million labeled examples.{" "}
          <strong>Batch gradient descent</strong> computes the gradient using every one of those
          million examples before taking a single step — the direction it moves in is as accurate as
          the data allows, but each step is extremely expensive, since it requires a full pass over
          the entire dataset just to move once. <strong>Stochastic gradient descent (SGD)</strong>{" "}
          goes to the opposite extreme: pick one random example, compute the gradient from that
          example alone, and step immediately. Any single step's direction is a noisy, often quite
          wrong, estimate of the true downhill direction — but steps are nearly free, so you can
          take a million of them in the time batch GD takes to take one.{" "}
          <strong>Mini-batch gradient descent</strong> is the practical middle ground: compute the
          gradient from a small random subset — commonly somewhere between 32 and 512 examples — and
          step. This is what essentially every real training pipeline actually runs; "batch" and
          "pure SGD" are the two theoretical extremes that mini-batch sits between.
        </p>
        <p>
          <strong>Advanced:</strong> the size of the step, the <strong>learning rate</strong>{" "}
          (written α), has to be tuned regardless of which variant you use, and it's a genuine
          trade-off in both directions. Too large a learning rate and each step overshoots the
          bottom — the iterate can oscillate back and forth across the minimum, or in the worst case
          diverge outright, with the loss growing instead of shrinking. Too small a learning rate
          and every individual step is safe, but convergence crawls: you're leaving performance on
          the table by taking tiny, needlessly cautious steps when larger ones would still have been
          safe. The classical fix is a <strong>learning-rate schedule</strong> — start with a larger
          α for fast early progress, then decay it over time (step decay, exponential decay, cosine
          decay) so later steps get more cautious as you approach the optimum. There's also a
          subtler point worth sitting with: SGD's noise, which is a pure cost in the convex setting
          this lesson is built around — noisier steps just mean slower, less reliable convergence to
          the one global minimum — can actually become a genuine <em>benefit</em> once the loss
          surface is non-convex, as it is for essentially all deep neural networks. A noisy step can
          kick the iterate out of a shallow local minimum or off a saddle point that a noise-free
          batch step would have gotten stuck at or slowed to a crawl near. The previous lesson's
          whole point about convexity — that it's what makes "reached a flat point" mean "reached
          the global optimum" — is exactly why this trade-off flips: in the convex world noise has
          nothing useful to escape from, so it's only ever a tax on convergence speed.
        </p>
      </SectionBlock>

      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"\\theta_{k+1} = \\theta_k - \\alpha \\, \\nabla \\hat R(\\theta_k)"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Every variant uses this exact same update rule — what changes is what <code>R̂</code>, the
          empirical risk being minimized at step <code>k</code>, is computed over:
        </p>
        <Formula>
          {
            "\\hat R_{\\text{batch}}(\\theta) = \\frac{1}{n}\\sum_{i=1}^{n} L(\\theta; x_i, y_i) \\qquad \\nabla \\hat R_{\\text{batch}}(\\theta_k) = \\frac{1}{n}\\sum_{i=1}^{n} \\nabla L(\\theta_k; x_i, y_i)"
          }
        </Formula>
        <Formula>
          {
            "\\hat R_{\\text{sgd}}(\\theta) = L(\\theta; x_i, y_i),\\ \\ i \\sim \\text{Uniform}\\{1,\\dots,n\\} \\qquad \\nabla \\hat R_{\\text{sgd}}(\\theta_k) = \\nabla L(\\theta_k; x_i, y_i)"
          }
        </Formula>
        <Formula>
          {
            "\\hat R_{\\text{mb}}(\\theta) = \\frac{1}{|B|}\\sum_{i \\in B} L(\\theta; x_i, y_i),\\ \\ B \\subset \\{1,\\dots,n\\} \\qquad \\nabla \\hat R_{\\text{mb}}(\\theta_k) = \\frac{1}{|B|}\\sum_{i \\in B} \\nabla L(\\theta_k; x_i, y_i)"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Batch sums over all <code>n</code> examples every step; SGD sums over exactly{" "}
          <code>1</code>, freshly and uniformly sampled each step; mini-batch sums over a freshly
          sampled subset <code>B</code> with <code>|B|</code> typically in the dozens to low
          hundreds — strictly between the other two. As <code>|B|</code> grows from 1 toward{" "}
          <code>n</code>, mini-batch GD interpolates continuously between pure SGD and full batch
          GD; it is not a fourth, separate algorithm.
        </p>
      </SectionBlock>

      <Derivation
        id="derivation"
        title="Derivation: the classical convergence rates for gradient descent on smooth (and strongly) convex functions"
      >
        <p>
          Take gradient descent on a single deterministic, convex function <code>f</code> (this is
          the batch-GD case with no sampling noise; the previous lesson on convex optimization is
          the reason a "global minimum" is even a meaningful, reachable target here). Assume{" "}
          <code>f</code> is <strong>L-smooth</strong>: its gradient doesn't change arbitrarily fast,
          formally
        </p>
        <Formula>
          {"\\|\\nabla f(x) - \\nabla f(y)\\| \\le L\\|x-y\\| \\qquad \\text{for all } x, y"}
        </Formula>
        <p>
          A standard consequence of L-smoothness (stated here rather than re-derived, since proving
          it is a short calculus exercise orthogonal to the point of this derivation) is a quadratic
          upper bound on <code>f</code> around any point:
        </p>
        <Formula>
          {
            "f(y) \\le f(x) + \\nabla f(x)^\\top (y - x) + \\frac{L}{2}\\|y-x\\|^2 \\qquad \\text{for all } x, y"
          }
        </Formula>
        <p>
          Now substitute in the actual gradient descent update,{" "}
          <code>y = x_{"{k+1}"} = x_k - α ∇f(x_k)</code> and <code>x = x_k</code>, so{" "}
          <code>y - x = -α∇f(x_k)</code>:
        </p>
        <Formula>
          {
            "f(x_{k+1}) \\le f(x_k) + \\nabla f(x_k)^\\top\\big(-\\alpha \\nabla f(x_k)\\big) + \\frac{L}{2}\\big\\|{-\\alpha \\nabla f(x_k)}\\big\\|^2"
          }
        </Formula>
        <p>
          The first extra term is <code>−α‖∇f(x_k)‖²</code> exactly (a dot product of a vector with
          itself, times −α), and the last term is <code>(Lα²/2)‖∇f(x_k)‖²</code> (the squared norm
          pulls α² out and leaves the same <code>‖∇f(x_k)‖²</code> factor). Both terms share that
          factor, so they combine directly:
        </p>
        <Formula>
          {
            "f(x_{k+1}) \\le f(x_k) - \\alpha\\|\\nabla f(x_k)\\|^2 + \\frac{L\\alpha^2}{2}\\|\\nabla f(x_k)\\|^2 = f(x_k) - \\alpha\\Big(1 - \\frac{L\\alpha}{2}\\Big)\\|\\nabla f(x_k)\\|^2"
          }
        </Formula>
        <p>
          That last line is the classical <strong>descent lemma</strong>. Look at the coefficient{" "}
          <code>(1 − Lα/2)</code>: as long as the step size satisfies <code>α ≤ 1/L</code>, that
          coefficient is at least <code>1/2</code>, which is positive — and since <code>α</code> and{" "}
          <code>‖∇f(x_k)‖²</code> are both non-negative, the entire subtracted term is non-negative.
          That means:
        </p>
        <Formula>
          {
            "f(x_{k+1}) \\le f(x_k) - \\frac{\\alpha}{2}\\|\\nabla f(x_k)\\|^2 \\le f(x_k) \\qquad \\text{whenever } \\alpha \\le 1/L"
          }
        </Formula>
        <p>
          — the function value is guaranteed <strong>non-increasing every single step</strong>. This
          is exactly the mechanism behind the diagram below: its toy surface has <code>L = 5</code>{" "}
          (the curvature of its steep direction), and monotonic descent along that direction is
          guaranteed only up to <code>α ≤ 1/5 = 0.2</code>; push past <code>α = 2/L = 0.4</code> and
          the coefficient <code>(1 − Lα/2)</code> turns negative, the bound stops guaranteeing
          descent, and the diagram visibly diverges.
        </p>
        <p>
          Chaining this per-step inequality over many iterations (cited here rather than re-derived
          term by term, since it's a standard telescoping-sum argument once the descent lemma is
          established) is what produces the two classical headline rates. For <code>f</code> merely{" "}
          <strong>convex</strong> and L-smooth, running GD with <code>α = 1/L</code> gives
        </p>
        <Formula>{"f(x_k) - f^\\star \\le \\frac{L\\|x_0 - x^\\star\\|^2}{2k}"}</Formula>
        <p>
          — error shrinks like <code>O(1/k)</code>: sublinear, and to halve the remaining error you
          roughly have to double the number of iterations. That's the entire guarantee plain
          convexity buys you: eventual convergence to the global minimum, at this specific, fairly
          slow rate. Under the <strong>strictly stronger</strong> assumption of <code>μ</code>
          -strong convexity — precisely the extra condition the previous lesson flagged as the thing
          that upgrades "eventually converges" into an actual provable rate — the same algorithm
          instead gets
        </p>
        <Formula>
          {
            "f(x_k) - f^\\star \\le \\Big(1 - \\frac{\\mu}{L}\\Big)^{k}\\big(f(x_0) - f^\\star\\big)"
          }
        </Formula>
        <p>
          which shrinks <strong>geometrically</strong> in <code>k</code>. Solving for how many
          iterations are needed to reach a target error <code>ε</code> gives{" "}
          <code>O(log(1/ε))</code> iterations — a linear (in the optimization sense) rate,
          exponentially faster than the merely-convex <code>O(1/k)</code> case. The ratio{" "}
          <code>κ = L/μ</code>, the <strong>condition number</strong>, controls exactly how fast: a
          well-conditioned bowl (κ close to 1) converges quickly, while an ill-conditioned,
          elongated bowl like the one in the diagram below (large κ) converges slowly even though
          the rate is still technically geometric.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> the <code>α ≤ 1/L</code> bound derived above is
          precisely why learning-rate tuning is not a minor implementation detail — get α wrong
          relative to the (usually unknown) smoothness constant <code>L</code> of your actual loss
          landscape, and you lose either the descent guarantee (too large) or most of your
          convergence speed (too small), exactly as the diagram below demonstrates directly. It's
          also exactly why <strong>adaptive optimizers</strong> — the subject of the next lesson,
          2.2.3 — exist at all: methods like AdaGrad, RMSProp, and Adam adjust per-parameter step
          sizes on the fly using observed gradient statistics, so that in practice you never have to
          hand-estimate a global <code>L</code> and pick one fixed <code>α ≤ 1/L</code> for an
          entire, possibly highly ill-conditioned, high-dimensional loss surface.
        </p>
      </Derivation>

      <DiagramBlock
        id="diagram"
        title="Batch vs. SGD vs. mini-batch, racing toward the minimum"
        caption="Drag the learning-rate slider for an instant preview of where each path ends up, then hit Replay to watch the animated race — batch (blue) takes the exact gradient, SGD (amber) visibly wanders on a single noisy example per step, and mini-batch (green) tracks close to batch with only light jitter."
      >
        <DiagramHost render={renderGdPaths} />
      </DiagramBlock>

      <MultiCodeExample
        id="practical"
        title="Practical example — batch, stochastic, and mini-batch GD on a toy linear regression"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import random

random.seed(0)

# ---- synthetic linear regression data: y = 3x + 5 + noise ----
n = 200
xs = [random.uniform(-5, 5) for _ in range(n)]
true_w, true_b = 3.0, 5.0
ys = [true_w * x + true_b + random.gauss(0, 0.6) for x in xs]

def mse(w, b, xs, ys):
    total = 0.0
    for x, y in zip(xs, ys):
        e = w * x + b - y
        total += e * e
    return total / len(xs)

def grad_on_indices(w, b, xs, ys, idxs):
    # Gradient of mean squared error, averaged over exactly the given indices --
    # pass all indices for batch GD, one index for SGD, a handful for mini-batch.
    dw = 0.0
    db = 0.0
    for i in idxs:
        err = w * xs[i] + b - ys[i]
        dw += 2 * err * xs[i]
        db += 2 * err
    m = len(idxs)
    return dw / m, db / m

TOL = 0.40          # stop once full-dataset MSE drops below this
MAX_EPOCHS = 400

def batch_gd(alpha):
    w, b = 0.0, 0.0
    all_idx = list(range(n))
    for epoch in range(1, MAX_EPOCHS + 1):
        dw, db = grad_on_indices(w, b, xs, ys, all_idx)   # every example, one update
        w -= alpha * dw
        b -= alpha * db
        loss = mse(w, b, xs, ys)
        if loss < TOL:
            return epoch, loss
    return MAX_EPOCHS, mse(w, b, xs, ys)

def stochastic_gd(alpha):
    w, b = 0.0, 0.0
    order = list(range(n))
    for epoch in range(1, MAX_EPOCHS + 1):
        random.shuffle(order)          # reshuffle every epoch -- see the Pitfalls section
        for i in order:
            dw, db = grad_on_indices(w, b, xs, ys, [i])   # one example, one update
            w -= alpha * dw
            b -= alpha * db
        loss = mse(w, b, xs, ys)
        if loss < TOL:
            return epoch, loss
    return MAX_EPOCHS, mse(w, b, xs, ys)

def minibatch_gd(alpha, batch_size):
    w, b = 0.0, 0.0
    order = list(range(n))
    for epoch in range(1, MAX_EPOCHS + 1):
        random.shuffle(order)
        for start in range(0, n, batch_size):
            idxs = order[start:start + batch_size]        # ~32 examples, one update
            dw, db = grad_on_indices(w, b, xs, ys, idxs)
            w -= alpha * dw
            b -= alpha * db
        loss = mse(w, b, xs, ys)
        if loss < TOL:
            return epoch, loss
    return MAX_EPOCHS, mse(w, b, xs, ys)

b_epochs, b_loss = batch_gd(alpha=0.05)
s_epochs, s_loss = stochastic_gd(alpha=0.01)
m_epochs, m_loss = minibatch_gd(alpha=0.02, batch_size=32)

print(f"Batch GD:      {b_epochs:4d} epochs (1 update/epoch),   final MSE = {b_loss:.4f}")
print(f"SGD:           {s_epochs:4d} epochs ({n} updates/epoch), final MSE = {s_loss:.4f}")
print(f"Mini-batch GD: {m_epochs:4d} epochs ({-(-n // 32)} updates/epoch),  final MSE = {m_loss:.4f}")

# Same tolerance, three very different numbers of parameter updates to get there --
# that gap is exactly the batch-size / update-count trade-off this lesson is about.`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <algorithm>
#include <cmath>
#include <iostream>
#include <random>
#include <utility>
#include <vector>

using namespace std;

struct Dataset {
    vector<double> x, y;
};

double mse(double w, double b, const Dataset& d) {
    double total = 0.0;
    for (size_t i = 0; i < d.x.size(); i++) {
        double e = w * d.x[i] + b - d.y[i];
        total += e * e;
    }
    return total / d.x.size();
}

// Gradient of mean squared error averaged over exactly the given indices.
pair<double, double> gradOnIndices(double w, double b, const Dataset& d, const vector<int>& idxs) {
    double dw = 0.0, db = 0.0;
    for (int i : idxs) {
        double err = w * d.x[i] + b - d.y[i];
        dw += 2 * err * d.x[i];
        db += 2 * err;
    }
    double m = static_cast<double>(idxs.size());
    return {dw / m, db / m};
}

constexpr double TOL = 0.40;
constexpr int MAX_EPOCHS = 400;

pair<int, double> batchGD(const Dataset& d, double alpha) {
    double w = 0.0, b = 0.0;
    vector<int> allIdx(d.x.size());
    for (size_t i = 0; i < allIdx.size(); i++) allIdx[i] = static_cast<int>(i);
    for (int epoch = 1; epoch <= MAX_EPOCHS; epoch++) {
        auto [dw, db] = gradOnIndices(w, b, d, allIdx);
        w -= alpha * dw;
        b -= alpha * db;
        double loss = mse(w, b, d);
        if (loss < TOL) return {epoch, loss};
    }
    return {MAX_EPOCHS, mse(w, b, d)};
}

pair<int, double> stochasticGD(const Dataset& d, double alpha, mt19937& rng) {
    double w = 0.0, b = 0.0;
    vector<int> order(d.x.size());
    for (size_t i = 0; i < order.size(); i++) order[i] = static_cast<int>(i);
    for (int epoch = 1; epoch <= MAX_EPOCHS; epoch++) {
        shuffle(order.begin(), order.end(), rng);   // reshuffle every epoch
        for (int i : order) {
            auto [dw, db] = gradOnIndices(w, b, d, vector<int>{i});
            w -= alpha * dw;
            b -= alpha * db;
        }
        double loss = mse(w, b, d);
        if (loss < TOL) return {epoch, loss};
    }
    return {MAX_EPOCHS, mse(w, b, d)};
}

pair<int, double> minibatchGD(const Dataset& d, double alpha, int batchSize, mt19937& rng) {
    double w = 0.0, b = 0.0;
    vector<int> order(d.x.size());
    for (size_t i = 0; i < order.size(); i++) order[i] = static_cast<int>(i);
    for (int epoch = 1; epoch <= MAX_EPOCHS; epoch++) {
        shuffle(order.begin(), order.end(), rng);
        for (size_t start = 0; start < order.size(); start += batchSize) {
            size_t end = min(order.size(), start + static_cast<size_t>(batchSize));
            vector<int> idxs(order.begin() + start, order.begin() + end);
            auto [dw, db] = gradOnIndices(w, b, d, idxs);
            w -= alpha * dw;
            b -= alpha * db;
        }
        double loss = mse(w, b, d);
        if (loss < TOL) return {epoch, loss};
    }
    return {MAX_EPOCHS, mse(w, b, d)};
}

int main() {
    mt19937 rng(0);
    uniform_real_distribution<double> xDist(-5.0, 5.0);
    normal_distribution<double> noiseDist(0.0, 0.6);

    const int n = 200;
    const double trueW = 3.0, trueB = 5.0;
    Dataset d;
    d.x.resize(n);
    d.y.resize(n);
    for (int i = 0; i < n; i++) {
        d.x[i] = xDist(rng);
        d.y[i] = trueW * d.x[i] + trueB + noiseDist(rng);
    }

    auto [bEpochs, bLoss] = batchGD(d, 0.05);
    auto [sEpochs, sLoss] = stochasticGD(d, 0.01, rng);
    auto [mEpochs, mLoss] = minibatchGD(d, 0.02, 32, rng);

    cout << "Batch GD:      " << bEpochs << " epochs, final MSE = " << bLoss << "\\n";
    cout << "SGD:           " << sEpochs << " epochs, final MSE = " << sLoss << " (one example/step)\\n";
    cout << "Mini-batch GD: " << mEpochs << " epochs, final MSE = " << mLoss << " (batch size 32)\\n";
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset

torch.manual_seed(0)

# Same synthetic linear regression problem: y = 3x + 5 + noise.
n = 200
x = torch.empty(n, 1).uniform_(-5, 5)
y = 3.0 * x + 5.0 + 0.6 * torch.randn(n, 1)

def train(batch_size, lr, max_epochs=200, tol=0.40):
    model = torch.nn.Linear(1, 1)
    optimizer = torch.optim.SGD(model.parameters(), lr=lr)
    loader = DataLoader(TensorDataset(x, y), batch_size=batch_size, shuffle=True)

    full_loss = float("inf")
    for epoch in range(1, max_epochs + 1):
        for xb, yb in loader:
            optimizer.zero_grad()
            loss = torch.mean((model(xb) - yb) ** 2)
            loss.backward()
            optimizer.step()
        with torch.no_grad():
            full_loss = torch.mean((model(x) - y) ** 2).item()
        if full_loss < tol:
            return epoch, full_loss
    return max_epochs, full_loss

# batch_size == n reproduces batch GD: the whole DataLoader is one "batch," one update/epoch.
b_epochs, b_loss = train(batch_size=n, lr=0.05)
# batch_size == 1 reproduces pure SGD: n noisy updates/epoch.
s_epochs, s_loss = train(batch_size=1, lr=0.01)
# a realistic mini-batch size sits in between.
m_epochs, m_loss = train(batch_size=32, lr=0.02)

print(f"Batch GD      (batch_size={n:3d}): {b_epochs:4d} epochs, final MSE = {b_loss:.4f}")
print(f"SGD           (batch_size=  1): {s_epochs:4d} epochs, final MSE = {s_loss:.4f}")
print(f"Mini-batch GD (batch_size= 32): {m_epochs:4d} epochs, final MSE = {m_loss:.4f}")

# A production-realistic alternative: sklearn's SGDRegressor, fed one mini-batch at a
# time via partial_fit, with a built-in decaying learning-rate schedule (the classical
# fix for the too-large/too-small learning-rate trade-off discussed above) applied
# automatically instead of hand-rolled.
from sklearn.linear_model import SGDRegressor

xn, yn = x.numpy().ravel(), y.numpy().ravel()
reg = SGDRegressor(learning_rate="invscaling", eta0=0.02, max_iter=1, warm_start=True)
for epoch in range(50):
    order = np.random.permutation(len(xn))
    for start in range(0, len(xn), 32):
        idx = order[start:start + 32]
        reg.partial_fit(xn[idx].reshape(-1, 1), yn[idx])
print(f"SGDRegressor learned w={reg.coef_[0]:.3f}, b={reg.intercept_[0]:.3f}  (true: w=3.0, b=5.0)")`,
          },
        ]}
      >
        <p>
          All three implementations run the identical experiment — the same synthetic data, the same
          hand-derived squared-error gradient — differing only in how many examples each gradient
          estimate is averaged over per update. The printed epoch counts and final losses make the
          speed/noise trade-off concrete rather than just asserted: batch GD needs the fewest{" "}
          <em>epochs</em> but only ever performs one parameter update per epoch, SGD performs{" "}
          <code>n</code> noisy updates per epoch, and mini-batch sits in between on both counts.
        </p>
      </MultiCodeExample>

      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Virtually all deep learning training uses mini-batch SGD</strong>, not either
            pure extreme. Modern GPUs are throughput machines — computing a gradient over 128
            examples costs barely more wall-clock time than computing it over 1, because the
            examples are processed in parallel — so mini-batches land in a genuine sweet spot: cheap
            enough per step to take many steps, averaged enough to keep the gradient noise from
            dominating, and large enough to actually saturate the hardware's parallelism.
          </li>
          <li>
            <strong>Learning-rate warmup and decay schedules</strong> are standard in large language
            model training: start with a small learning rate and ramp it up over the first few
            thousand steps (warmup, to avoid destabilizing randomly-initialized weights with large
            early updates), hold or slowly decay it through the bulk of training, then decay it
            further (often following a cosine curve) toward the end — the exact "classical fix" the
            plain-English section above describes, at a scale where getting the schedule wrong can
            waste weeks of compute.
          </li>
          <li>
            <strong>Online learning systems</strong> — ad click-through-rate prediction being the
            canonical example — are a natural fit for pure SGD rather than mini-batch. There is no
            fixed dataset to batch over: each new impression-and-click (or non-click) arrives as a
            single fresh example, the model takes one SGD step on it, and moves on. Waiting to
            accumulate a "batch" would mean either delaying model updates or artificially buffering
            a stream that's naturally one-example-at-a-time.
          </li>
          <li>
            <strong>
              Batch gradient descent is still fine, even preferred, for small datasets
            </strong>{" "}
            that fit comfortably in memory — a few thousand rows of a classical regression or
            classification problem, say. When computing the exact gradient over the whole dataset
            costs almost nothing, there's no speed advantage to sampling, and batch GD's smooth,
            noise-free convergence is simply the better-behaved choice.
          </li>
          <li>
            <strong>
              An "epoch" is one full pass of mini-batch (or pure SGD) updates over the training set
            </strong>{" "}
            — split the data into mini-batches, run through all of them once, and that's epoch 1;
            reshuffle and repeat for epoch 2, and so on. Training for "50 epochs" is shorthand for
            "50 full passes," each made up of many individual mini-batch steps — exactly the loop
            structure the code examples above implement directly.
          </li>
          <li>
            <strong>Large-scale distributed training</strong> pushes batch size up into the
            thousands or tens of thousands (spreading one giant batch across many GPUs
            simultaneously), and empirically also needs the learning rate scaled up to match — the
            "linear scaling rule" used at large tech companies training on big GPU clusters is a
            direct, practical acknowledgment that batch size and learning rate are coupled knobs,
            not independent ones.
          </li>
        </ul>
      </SectionBlock>

      <Pitfall>
        <ul>
          <li>
            Picking a learning rate by intuition or leaving a framework default untouched, then
            being surprised when training diverges (rate too large) or crawls for hours with barely
            moving loss (rate too small). The Derivation above isn't decorative — the stable range
            for α genuinely depends on the specific loss surface's smoothness, and "the default
            worked on a different problem" is not evidence it will work here.
          </li>
          <li>
            Assuming a bigger batch size is unconditionally better because it means a less noisy
            gradient estimate. It's a real trade-off, not a free lunch: a larger batch does reduce
            per-step noise, but each step also costs more compute, and past a certain size the
            reduction in noise stops meaningfully improving either convergence speed or the final
            model's quality — you're just paying more per step for a gradient estimate that was
            already accurate enough.
          </li>
          <li>
            Forgetting to reshuffle the data between epochs in SGD or mini-batch training. If the
            data has any ordering structure — sorted by label, grouped by time, grouped by source —
            training in the same fixed order every epoch means every early step of every epoch sees
            a skewed slice of the data, quietly biasing the whole training trajectory in a way
            that's easy to miss and annoying to diagnose after the fact.
          </li>
        </ul>
      </Pitfall>

      <ExpertNote>
        <p>
          SGD's gradient noise, which the plain-English section already flagged as sometimes helpful
          in non-convex landscapes, has a more specific informal story behind it: it appears to act
          as an <strong>implicit regularizer</strong>. Rather than just randomly kicking the iterate
          around, the noise seems to bias SGD's trajectory away from sharp, narrow minima (where a
          small perturbation in the parameters causes a large jump in loss) and toward flatter,
          wider ones — and flat minima have been empirically linked to better generalization than
          sharp ones reaching the same training loss. This connects directly back to the
          double-descent and generalization discussion from Module 1: there, the surprising finding
          was that heavily over-parameterized models often generalize far better than the classical
          bias-variance picture predicts, and part of the informal explanation offered there was
          that gradient-based optimizers tend to land on comparatively simple, well-behaved
          solutions among the many that fit the training data — SGD's noise is one of the candidate
          mechanisms proposed for exactly why that happens, not a separate phenomenon.
        </p>
        <p>
          Treat this as an active, evolving research area rather than settled fact. The
          flat-minima-generalize-better story has real empirical support and some theoretical
          backing in simplified settings, but there are also known counterexamples and open debates
          about how universally it holds across architectures and tasks. What is settled is the more
          basic point this lesson leans on throughout: a property that looks purely like a weakness
          through a convex-optimization lens (noisier steps, worse per-step guarantees) is not
          automatically a weakness once the assumptions — convexity, in this case — no longer hold.
        </p>
      </ExpertNote>

      <Quiz
        q="You're training on 5 million examples. Switching from batch GD to mini-batch GD with a batch size of 256 changes the number of parameter updates per epoch from 1 to roughly 19,500. Given that each individual mini-batch step is noisier than the one exact batch step, why does training with mini-batches typically still reach a good model faster in wall-clock time?"
        a="Because 'noisier per step' and 'slower overall' are not the same thing. Batch GD's single update per epoch is exact but you only get to move once per full pass over 5 million examples — an enormous amount of computation spent on one step. Mini-batch GD spends roughly the same total amount of computation per epoch, but spreads it across ~19,500 much cheaper steps, each computed from a batch small enough for a GPU to process in parallel almost as fast as a single example. Even though every individual mini-batch step is a noisier estimate of the true gradient than the one batch step, taking thousands of noisy-but-cheap steps per epoch converges faster in wall-clock time than taking one expensive-but-exact step, because the model gets to update its parameters far more often for roughly the same total compute."
      />

      <Takeaway>
        <p>
          Batch, stochastic, and mini-batch gradient descent are the same update rule — step
          opposite the gradient of the empirical risk — differing only in how many examples that
          risk is averaged over per step, trading exactness for speed as you move from batch toward
          SGD. Mini-batch, sitting between the extremes, is what nearly all practical training
          actually runs. The learning rate governs a separate but equally important trade-off,
          provably bounded by a step-size threshold set by the loss surface's smoothness (α ≤ 1/L)
          for guaranteed descent, with strong convexity the extra ingredient that upgrades a
          merely-eventual convergence guarantee into a genuinely fast one — and it's precisely the
          difficulty of knowing that threshold in practice that motivates the adaptive optimizers
          coming up next.
        </p>
      </Takeaway>
    </>
  );
}
