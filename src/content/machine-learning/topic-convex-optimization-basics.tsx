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
  animate,
  ease,
  replayButton,
  makeDraggable,
  dragHandle,
  readout,
  toggleGroup,
} from "@/lib/diagram-helpers";
import type { DiagramRender } from "@/components/docs/diagram-host";

/** Plot geometry, shared by both curve shapes. */
const PLOT = { left: 44, right: 396, top: 20, bottom: 196 };
const X_MIN = 0;
const X_MAX = 10;

type CurveMode = "convex" | "nonconvex";

/** A simple convex bowl: one basin, minimum at x = 5. */
function convexF(x: number) {
  return 0.15 * (x - 5) ** 2 + 1;
}
function convexFPrime(x: number) {
  return 0.3 * (x - 5);
}

/** An asymmetric double-well: two basins of different depth, separated by a hump
 *  just to the right of the midpoint, so nearby starting points on either side of
 *  the hump roll into two genuinely different resting points. */
function nonConvexF(x: number) {
  const u = (x - 5) / 2.5;
  return 1.4 * (u * u - 1) ** 2 + 0.35 * u + 2;
}
function nonConvexFPrime(x: number) {
  const u = (x - 5) / 2.5;
  const dfdu = 5.6 * u * (u * u - 1) + 0.35;
  return 0.4 * dfdu;
}

function curveFor(mode: CurveMode) {
  return mode === "convex"
    ? { f: convexF, fp: convexFPrime }
    : { f: nonConvexF, fp: nonConvexFPrime };
}

/** Locates every local minimum of f over the plotted domain by a dense grid scan —
 *  robust to the exact shape of f, no hand-solved critical points required. */
function findLocalMinima(f: (x: number) => number, n = 500) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = X_MIN + (i / n) * (X_MAX - X_MIN);
    xs.push(x);
    ys.push(f(x));
  }
  const pts: { x: number; y: number }[] = [];
  for (let i = 1; i < n; i++) {
    if (ys[i] < ys[i - 1] && ys[i] < ys[i + 1]) pts.push({ x: xs[i], y: ys[i] });
  }
  return pts;
}

/** Plain gradient descent on the 1D function, clamped to stay on the plotted domain. */
function gradientDescentPath(x0: number, fp: (x: number) => number, lr: number, steps: number) {
  const path = [x0];
  let x = x0;
  for (let i = 0; i < steps; i++) {
    x = x - lr * fp(x);
    x = Math.max(X_MIN, Math.min(X_MAX, x));
    path.push(x);
  }
  return path;
}

const renderConvexityBall: DiagramRender = (host) => {
  const s = svg("0 0 420 216");

  const xScaleRef = { yMin: 0, yMax: 1 };
  const xScale = (x: number) =>
    PLOT.left + ((x - X_MIN) / (X_MAX - X_MIN)) * (PLOT.right - PLOT.left);
  const yScale = (v: number) =>
    PLOT.bottom -
    ((v - xScaleRef.yMin) / (xScaleRef.yMax - xScaleRef.yMin)) * (PLOT.bottom - PLOT.top);

  // Baseline
  s.appendChild(
    el("line", {
      x1: PLOT.left,
      y1: PLOT.bottom,
      x2: PLOT.right,
      y2: PLOT.bottom,
      stroke: "#9ca3af",
      "stroke-width": 1.5,
    }),
  );

  const curvePath = el("path", { fill: "none", stroke: "#4f5fe0", "stroke-width": 3 });
  s.appendChild(curvePath);
  const minimaGroup = el("g");
  s.appendChild(minimaGroup);
  const ball = dragHandle(0, 0, "#d9534f");
  s.appendChild(ball);
  host.appendChild(s);

  let mode: CurveMode = "convex";
  let fn = convexF;
  let fp = convexFPrime;
  let minima = findLocalMinima(fn);
  let currentBallX = 5;

  function rebuild() {
    const chosen = curveFor(mode);
    fn = chosen.f;
    fp = chosen.fp;
    let lo = Infinity;
    let hi = -Infinity;
    const n = 200;
    for (let i = 0; i <= n; i++) {
      const x = X_MIN + (i / n) * (X_MAX - X_MIN);
      const v = fn(x);
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const pad = (hi - lo) * 0.08 || 0.5;
    xScaleRef.yMin = lo - pad;
    xScaleRef.yMax = hi + pad;

    let d = "";
    for (let i = 0; i <= n; i++) {
      const x = X_MIN + (i / n) * (X_MAX - X_MIN);
      const p = `${xScale(x)},${yScale(fn(x))}`;
      d += i === 0 ? `M${p}` : ` L${p}`;
    }
    curvePath.setAttribute("d", d);

    minimaGroup.innerHTML = "";
    minima = findLocalMinima(fn);
    const globalY = Math.min(...minima.map((m) => m.y));
    for (const m of minima) {
      const isGlobal = Math.abs(m.y - globalY) < 1e-6;
      minimaGroup.appendChild(
        el("circle", {
          cx: xScale(m.x),
          cy: yScale(m.y),
          r: isGlobal ? 5 : 4,
          fill: isGlobal ? "#1f8a5f" : "#9ca3af",
          stroke: "white",
          "stroke-width": 1.5,
        }),
      );
    }
  }

  function placeBallAt(x: number) {
    ball.setAttribute("cx", String(xScale(x)));
    ball.setAttribute("cy", String(yScale(fn(x))));
  }

  const out = readout(host, "");

  function describe(x: number) {
    const y = fn(x);
    const globalY = Math.min(...minima.map((m) => m.y));
    const isGlobal = Math.abs(y - globalY) < 0.01;
    if (minima.length <= 1) {
      return `x = ${x.toFixed(2)}   f(x) = ${y.toFixed(3)}   -- the global minimum (there is only one)`;
    }
    return `x = ${x.toFixed(2)}   f(x) = ${y.toFixed(3)}   -- ${
      isGlobal ? "the GLOBAL minimum" : "only a LOCAL minimum (the global one sits elsewhere)"
    }`;
  }

  let stopCurrent: (() => void) | null = null;
  let token = 0;

  function abortActive() {
    token++;
    if (stopCurrent) {
      stopCurrent();
      stopCurrent = null;
    }
  }

  function moveBallTo(targetX: number, duration: number, done: () => void) {
    const startX = currentBallX;
    const myToken = token;
    stopCurrent = animate(
      duration,
      (eased) => {
        const x = startX + eased * (targetX - startX);
        currentBallX = x;
        placeBallAt(x);
      },
      () => {
        if (myToken !== token) return;
        currentBallX = targetX;
        placeBallAt(targetX);
        done();
      },
      ease.inOutCubic,
    );
  }

  function runDescentFrom(x0: number, duration: number, done: (finalX: number) => void) {
    const path = gradientDescentPath(x0, fp, mode === "convex" ? 0.5 : 0.02, 70);
    const myToken = token;
    out.set(`x = ${x0.toFixed(2)}   rolling downhill...`);
    stopCurrent = animate(
      duration,
      (_eased, t) => {
        const idx = Math.round(t * (path.length - 1));
        const x = path[idx];
        currentBallX = x;
        placeBallAt(x);
      },
      () => {
        if (myToken !== token) return;
        const finalX = path[path.length - 1];
        currentBallX = finalX;
        placeBallAt(finalX);
        out.set(describe(finalX));
        done(finalX);
      },
      ease.linear,
    );
  }

  function playSequence(starts: number[], idx: number) {
    if (idx >= starts.length) {
      out.set(
        mode === "convex"
          ? "Every starting point rolled to the exact same resting point -- that is exactly what convexity guarantees."
          : "Notice the two starts near the hump: they rolled to two different resting points, from nearly the same place. Same rule, different outcome.",
      );
      return;
    }
    const myToken = token;
    moveBallTo(starts[idx], 500, () => {
      if (myToken !== token) return;
      runDescentFrom(starts[idx], 1500, () => {
        if (myToken !== token) return;
        stopCurrent = animate(
          450,
          () => {},
          () => {
            if (myToken !== token) return;
            playSequence(starts, idx + 1);
          },
          ease.linear,
        );
      });
    });
  }

  function playForMode() {
    abortActive();
    const starts = mode === "convex" ? [1, 9, 5.8] : [1.5, 4.8, 5.6];
    playSequence(starts, 0);
  }

  rebuild();
  placeBallAt(currentBallX);

  toggleGroup(
    host,
    [
      { label: "Convex bowl", value: "convex" },
      { label: "Non-convex (two dips)", value: "nonconvex" },
    ],
    "convex",
    (value) => {
      mode = value as CurveMode;
      abortActive();
      rebuild();
      currentBallX = 5;
      placeBallAt(currentBallX);
      hint.textContent =
        mode === "convex"
          ? "Watch three different starting points -- far left, far right, and just off-center -- all roll into the same single minimum. Then drag the ball yourself to any x and let go."
          : "Watch two starting points that are almost neighbors, on either side of the small hump, roll into two different wells at different depths. Then drag the ball yourself to any x and let go.";
      playForMode();
    },
  );

  makeDraggable(ball, s, (p) => {
    abortActive();
    const dataX = X_MIN + ((p.x - PLOT.left) / (PLOT.right - PLOT.left)) * (X_MAX - X_MIN);
    const clamped = Math.max(X_MIN, Math.min(X_MAX, dataX));
    currentBallX = clamped;
    placeBallAt(clamped);
    out.set(`x = ${clamped.toFixed(2)}   f(x) = ${fn(clamped).toFixed(3)}   (drag, then release)`);
  });

  ball.addEventListener("pointerup", () => {
    runDescentFrom(currentBallX, 1500, () => {});
  });

  playForMode();
  replayButton(host, "↻ Replay animation", () => {
    abortActive();
    playForMode();
  });

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Watch three different starting points -- far left, far right, and just off-center -- all roll into the same single minimum. Then drag the ball yourself to any x and let go.";
  host.appendChild(hint);

  return () => {
    abortActive();
  };
};

export function ConvexOptimizationBasics() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a <strong>convex function</strong> is "bowl-shaped" — pick any
          two points on its graph and draw a straight line segment connecting them; that segment
          always stays above (or exactly on) the graph, never dips below it. A{" "}
          <strong>convex set</strong> is the matching idea for regions instead of functions: a set
          is convex if, for any two points inside it, the entire straight line between them also
          lies inside the set. A disk or a filled rectangle is convex; a crescent moon or a star
          shape is not, because you can find two points inside them where the connecting line exits
          the shape.
        </p>
        <p>
          <strong>Intermediate:</strong> here is why this matters far more than a piece of geometric
          trivia. For a convex function, any point where the gradient is exactly zero — or, for
          constrained problems, any point satisfying the KKT conditions covered in a later lesson —
          is automatically the <strong>global</strong> minimum, not merely a local one. That single
          fact quietly removes an entire category of worry: "did gradient descent get stuck in a
          local minimum" is a question that <em>cannot even arise</em> for a genuinely convex loss.
          There is no "stuck" to get stuck in — every valley is the same valley.
        </p>
        <p>
          <strong>Advanced:</strong> this is not an accident of nature — most classical machine
          learning losses were <em>deliberately chosen</em> to be convex specifically so this
          guarantee holds. Squared error (ordinary least squares, ridge regression), logistic /
          cross-entropy loss, and hinge loss (SVMs, a later module) are all convex in their model
          parameters. Deep learning breaks this on purpose: the loss landscape of a multi-layer
          network is emphatically <em>not</em> convex — it is riddled with saddle points, plateaus,
          and many distinct local minima of different quality. That is exactly why later modules in
          this course need much more careful optimizer engineering — momentum, adaptive learning
          rates, learning-rate schedules — even though the basic "follow the negative gradient" idea
          is unchanged. Convexity is what classical ML gets almost for free; deep learning trades it
          away for expressive power and has to work much harder at optimization to compensate.
        </p>
      </SectionBlock>

      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "f(\\lambda x + (1-\\lambda) y) \\le \\lambda f(x) + (1-\\lambda) f(y), \\quad \\forall\\, \\lambda \\in [0,1]"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          This is the defining inequality of a convex function: the function's value at any blend of
          two points x and y is never more than the same blend of the function's values at x and y —
          precisely "the chord lies above the curve." A set S is convex by the matching condition:{" "}
          <code>λx + (1-λ)y</code> stays in S for every x, y in S and every λ in [0,1].
        </p>
        <Formula>{"f(y) \\ge f(x) + \\nabla f(x)^{T}(y - x)"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          For a differentiable f, this <strong>first-order condition</strong> is an equivalent
          characterization: the tangent line (plane, in higher dimensions) drawn at any point x
          always lies entirely below the function's graph everywhere else. A non-convex function
          always has some point and some direction where the tangent pokes up through the curve.
        </p>
        <Formula>{"\\nabla^{2} f(x) \\succeq 0 \\quad \\text{for all } x"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          For a twice-differentiable f, this <strong>second-order condition</strong> is a third,
          equivalent characterization: the Hessian matrix of second derivatives must be positive
          semi-definite everywhere — in one dimension, that is just the familiar{" "}
          <code>f''(x) ≥ 0</code>, "curving upward or flat, never downward," at every single point.
        </p>
      </SectionBlock>

      <Derivation
        id="derivation"
        title="Derivation: why a zero gradient means the global minimum, and where the Hessian condition comes from"
      >
        <p>
          Take f to be convex and differentiable, and suppose <code>x*</code> is a point where{" "}
          <code>∇f(x*) = 0</code>. We want to show x* is not just a local minimum but the global
          minimum — smaller than or equal to f at absolutely every other point in the domain. Start
          from the first-order convexity condition, which holds for x* and any other point y:
        </p>
        <Formula>{"f(y) \\ge f(x^{*}) + \\nabla f(x^{*})^{T}(y - x^{*})"}</Formula>
        <p>
          Now substitute in what we know: <code>∇f(x*) = 0</code>, so the entire second term on the
          right — the dot product of the zero vector with anything — is exactly zero:
        </p>
        <Formula>{"f(y) \\ge f(x^{*}) + 0^{T}(y-x^{*}) = f(x^{*}) + 0 = f(x^{*})"}</Formula>
        <p>
          That leaves <code>f(y) ≥ f(x*)</code>. Crucially, y here was an <em>arbitrary</em> point —
          we never assumed y was close to x*, or restricted it to some neighborhood. The inequality
          holds for every y in the domain simultaneously, which is precisely the definition of a
          global minimizer. No other proof strategy for gradient-based optimization gets this for
          free: outside convexity, "gradient is zero" only tells you that you're at a stationary
          point — it could be a local min, a local max, or a saddle. Convexity is what upgrades
          "zero gradient" all the way to "global minimum," in three short lines of algebra.
        </p>
        <p>
          Now, the second-order condition. The (truncated) second-order Taylor expansion of f around
          a point x, in the direction of another point y, is:
        </p>
        <Formula>
          {
            "f(y) \\approx f(x) + \\nabla f(x)^{T}(y-x) + \\tfrac{1}{2}(y-x)^{T} \\nabla^{2} f(x) (y-x)"
          }
        </Formula>
        <p>
          Compare this to the first-order convexity condition, which says{" "}
          <code>f(y) ≥ f(x) + ∇f(x)ᵀ(y − x)</code> for every x and y. Subtracting the shared linear
          terms <code>f(x) + ∇f(x)ᵀ(y − x)</code> from both the Taylor expansion and the convexity
          inequality forces the leftover quadratic piece to be non-negative for every choice of
          direction <code>(y − x)</code>:
        </p>
        <Formula>
          {"\\tfrac{1}{2}(y-x)^{T} \\nabla^{2} f(x) (y-x) \\ge 0 \\quad \\text{for all } y"}
        </Formula>
        <p>
          A matrix that produces a non-negative number when sandwiched this way against{" "}
          <em>every</em> possible vector is exactly what "positive semi-definite" means — so the
          first-order condition holding everywhere forces the Hessian to be PSD everywhere too. The
          converse — that a PSD Hessian everywhere implies the first-order (and hence the
          definition- level) condition — follows by integrating the Hessian condition twice along
          the line segment from x to y; we won't carry out that integral here, but it is a standard,
          fully rigorous result, and it is why all three characterizations (the chord inequality,
          the tangent-line inequality, and the PSD Hessian) are treated as interchangeable in
          practice.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is exactly why textbooks are allowed to say "set
          the gradient to zero and solve" for ordinary least squares, ridge regression, and logistic
          regression, and then call the result <em>the</em> solution rather than <em>a</em>{" "}
          solution. The loss surfaces in all three cases are convex in the parameters, so the
          derivation above applies directly — any critical point found by solving{" "}
          <code>∇L(θ) = 0</code> is automatically the unique global minimum (or, when the Hessian is
          only PSD rather than strictly positive definite, one of a connected set of equally good
          global minima). That uniqueness is a load-bearing consequence of convexity, not a lucky
          coincidence of these particular problems.
        </p>
      </Derivation>

      <DiagramBlock
        id="diagram"
        title="Same rule, different worlds: rolling downhill on a convex bowl vs. a non-convex double-dip"
        caption="Toggle between the convex bowl and the non-convex two-well curve. Watch the automatic demo roll a ball from several starting points, or drag the ball yourself and release it to watch it roll to wherever local gradient-following takes it."
      >
        <DiagramHost render={renderConvexityBall} />
      </DiagramBlock>

      <MultiCodeExample
        id="practical"
        title="Practical example — checking convexity by testing the definition directly"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import random

def is_convex_numerically(f, domain=(-5.0, 5.0), n_pairs=2000, n_lambdas=9, seed=0):
    """Samples many random (x, y, lambda) triples and checks the convexity
    inequality f(lambda*x + (1-lambda)*y) <= lambda*f(x) + (1-lambda)*f(y)
    directly, with no calculus and no assumptions about f's shape."""
    rng = random.Random(seed)
    lo, hi = domain
    violations = 0
    checks = 0
    for _ in range(n_pairs):
        x = rng.uniform(lo, hi)
        y = rng.uniform(lo, hi)
        fx, fy = f(x), f(y)
        for i in range(1, n_lambdas + 1):
            lam = i / (n_lambdas + 1)  # keep lambda strictly inside (0, 1)
            lhs = f(lam * x + (1 - lam) * y)
            rhs = lam * fx + (1 - lam) * fy
            checks += 1
            if lhs > rhs + 1e-9:  # small tolerance for floating point noise
                violations += 1
    return violations, checks

def convex_bowl(x):
    return x ** 2

def double_dip(x):
    return x ** 4 - 3 * x ** 2

for name, fn in [
    ("f(x) = x^2  (convex)", convex_bowl),
    ("f(x) = x^4 - 3x^2  (not convex)", double_dip),
]:
    violations, checks = is_convex_numerically(fn)
    print(f"{name}: {violations} violations out of {checks} sampled (x, y, lambda) triples")`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <cmath>
#include <iostream>
#include <random>

using namespace std;

struct CheckResult {
    long violations;
    long checks;
};

// Samples many random (x, y, lambda) triples and checks the convexity
// inequality f(lambda*x + (1-lambda)*y) <= lambda*f(x) + (1-lambda)*f(y)
// directly -- no calculus, no assumptions about f's shape.
template <typename F>
CheckResult isConvexNumerically(
    F f, double lo, double hi, int nPairs = 2000, int nLambdas = 9, unsigned seed = 0) {
    mt19937 rng(seed);
    uniform_real_distribution<double> dist(lo, hi);
    long violations = 0;
    long checks = 0;
    const double tol = 1e-9;

    for (int i = 0; i < nPairs; i++) {
        double x = dist(rng);
        double y = dist(rng);
        double fx = f(x);
        double fy = f(y);
        for (int k = 1; k <= nLambdas; k++) {
            double lambda = static_cast<double>(k) / (nLambdas + 1);
            double lhs = f(lambda * x + (1 - lambda) * y);
            double rhs = lambda * fx + (1 - lambda) * fy;
            checks++;
            if (lhs > rhs + tol) violations++;
        }
    }
    return CheckResult{violations, checks};
}

int main() {
    auto convexBowl = [](double x) { return x * x; };
    auto doubleDip = [](double x) { return x * x * x * x - 3.0 * x * x; };

    auto r1 = isConvexNumerically(convexBowl, -5.0, 5.0);
    cout << "f(x) = x^2 (convex): " << r1.violations
         << " violations out of " << r1.checks << " sampled triples\\n";

    auto r2 = isConvexNumerically(doubleDip, -5.0, 5.0);
    cout << "f(x) = x^4 - 3x^2 (not convex): " << r2.violations
         << " violations out of " << r2.checks << " sampled triples\\n";

    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from scipy.optimize import minimize

def convex_bowl(x):
    return float(x[0] ** 2)

def double_dip(x):
    return float(x[0] ** 4 - 3 * x[0] ** 2)

starts = [-4.0, -1.5, 0.3, 2.0, 4.5]

print("Convex function f(x) = x^2:")
for x0 in starts:
    result = minimize(convex_bowl, x0=[x0], method="BFGS")
    print(f"  start x0={x0:>5.1f}  ->  found minimum at x={result.x[0]: .4f}")

print()
print("Non-convex function f(x) = x^4 - 3x^2:")
for x0 in starts:
    result = minimize(double_dip, x0=[x0], method="BFGS")
    print(f"  start x0={x0:>5.1f}  ->  found minimum at x={result.x[0]: .4f}")

# Expect: every start on the convex function converges to essentially the same
# x (the unique global minimum). The non-convex function instead splits into
# two groups depending on which side of the middle hump each start began on --
# the found minimum genuinely depends on where the search started.`,
          },
        ]}
      >
        <p>
          All three snippets implement the same idea from two different angles. The first two build
          a convexity checker completely from scratch — no libraries beyond basic math — by directly
          sampling the definition's inequality across many random point pairs and blend ratios, and
          running it once on a genuinely convex function and once on a non-convex one. The third
          switches to a production-realistic angle: rather than testing the definition, it runs a
          real optimizer, <code>scipy.optimize.minimize</code>, from several different random
          starting points and prints what it finds — the same empirical point the diagram makes
          visually, now demonstrated with a real library-grade solver instead of a hand-rolled ball.
        </p>
      </MultiCodeExample>

      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>OLS, ridge, and logistic regression</strong> all have unique, reliably-found
            solutions precisely because their loss functions are convex in the parameters — "run the
            solver, get the answer" only works as a promise because there is exactly one basin (or
            one connected set of equally-good points) to find.
          </li>
          <li>
            <strong>Support vector machine training</strong> (a later module) is deliberately set up
            as a convex quadratic program specifically so that off-the-shelf solvers can{" "}
            <em>certify</em> global optimality — not just report a number, but guarantee no better
            answer exists anywhere in the feasible region.
          </li>
          <li>
            <strong>Deep neural network training</strong> is explicitly not this nice: the loss
            landscape of a multi-layer network is highly non-convex, full of saddle points and many
            local minima of varying quality. That is an accepted trade-off — the expressive power
            gained from stacking nonlinear layers is worth the loss of a global-optimality
            guarantee, but it is exactly why deep learning optimization is its own deep sub-field
            rather than "just gradient descent."
          </li>
          <li>
            <strong>K-means clustering</strong> (a later module) is famously <em>not</em> jointly
            convex in its cluster assignments and centroids together, and can converge to noticeably
            different final clusterings depending on how the centroids were initialized — the exact
            same "different starting point, different resting place" behavior the non-convex side of
            this lesson's diagram demonstrates, just in many dimensions instead of one.
          </li>
          <li>
            <strong>Lasso regression's L1 penalty</strong> is convex but not differentiable at zero
            — a reminder that convexity and smoothness are separate properties. The global-optimum
            guarantee from this lesson still applies to lasso, but the "set the gradient to zero"
            derivation above needs the coordinate and proximal methods covered later in this module,
            because there is no ordinary gradient at the kink.
          </li>
          <li>
            <strong>Convex relaxation</strong> is an entire sub-field built on this lesson's core
            idea: when the real problem you want to solve is non-convex and hard (e.g., variants of
            certain combinatorial or low-rank problems), replace it with a "nearby" convex problem
            that approximates it and genuinely can be solved exactly — trading a little bit of
            fidelity to the original problem for the entire toolbox of convex guarantees.
          </li>
        </ul>
      </SectionBlock>

      <Pitfall>
        <ul>
          <li>
            Assuming a function is convex just because it looks smooth or bowl-shaped in the region
            you happened to plot. Convexity is a precise algebraic condition (the chord inequality,
            or an everywhere-PSD Hessian) — "looks fine where I checked" is not a proof, and plenty
            of functions look locally bowl-shaped while curving the wrong way somewhere else.
          </li>
          <li>
            Confusing "the loss function is convex in the parameters" with "this problem is easy."
            Convexity guarantees you will <em>eventually</em> reach the global optimum — it says
            nothing about how expensive each iteration is. A convex loss over a billion parameters
            is still enormously expensive per step; convexity buys you a destination guarantee, not
            a speed guarantee.
          </li>
          <li>
            Forgetting that convexity is a <strong>global</strong> property of the entire function
            over its whole domain, not something you can verify by inspecting one region. A function
            that is convex on the interval you tested can easily be non-convex somewhere else in its
            domain — the definition explicitly quantifies over every pair of points, not just the
            ones you looked at.
          </li>
        </ul>
      </Pitfall>

      <ExpertNote>
        <p>
          Convexity is preserved under several genuinely useful operations, and one in particular
          matters a great deal for later lessons: a{" "}
          <strong>non-negative weighted sum of convex functions is itself convex</strong>. This is
          exactly why "loss plus a regularization penalty" — the ridge and lasso objectives from
          later modules — stays convex whenever the base loss and the penalty term are each convex
          on their own: you don't have to re-derive convexity for every new regularized objective,
          you just check that each piece is convex and non-negatively weighted, and the sum inherits
          the property automatically.
        </p>
        <p>
          There is also a stronger, quantified version of convexity worth knowing the name of now:{" "}
          <strong>strong convexity</strong>, which roughly requires the function to curve upward by
          at least some fixed minimum amount everywhere, not just "upward or flat." Plain convexity
          only promises that gradient descent will eventually converge to the global minimum — it
          says nothing about how fast. Strong convexity is what actually gives you a specific,
          provable convergence <em>rate</em> (typically geometric — the error shrinks by a fixed
          factor every iteration). The next lesson, 2.2.2 on gradient descent and its variants, uses
          exactly this property to state the convergence rates it proves.
        </p>
      </ExpertNote>

      <Quiz
        q="You're told a loss function L(θ) is convex, and gradient descent converges to a point θ* where the gradient is (numerically) zero. A colleague worries this might just be one of several local minima. Are they right to worry, and why or why not?"
        a="No -- for a genuinely convex, differentiable loss, a zero-gradient point is not merely a local minimum, it is provably the global minimum, full stop. The derivation in this lesson shows why directly: the first-order convexity condition f(y) >= f(x*) + grad f(x*)^T (y - x*) holds for every y in the domain, and substituting grad f(x*) = 0 collapses it to f(y) >= f(x*) for every y -- there is no other point anywhere that beats x*. The colleague's worry would be justified for a non-convex loss (like a deep network's), where a zero gradient could indeed be one local minimum among several of differing quality -- but that concern simply does not transfer to a confirmed-convex objective."
      />

      <Takeaway>
        <p>
          Convexity is the single property that upgrades "gradient descent stopped moving" into
          "gradient descent found the best possible answer" — a zero gradient on a convex function
          is provably the global minimum, not one of several local ones, which is exactly why OLS,
          ridge, logistic regression, and SVM training can all promise a unique, reliably-found
          solution. Deep learning gives up this guarantee for expressive power, which is precisely
          why its optimizers need to be so much more carefully engineered — and it's exactly why
          every convergence-rate argument in the rest of this module starts by asking how convex, or
          how strongly convex, the objective in front of it actually is.
        </p>
      </Takeaway>
    </>
  );
}
