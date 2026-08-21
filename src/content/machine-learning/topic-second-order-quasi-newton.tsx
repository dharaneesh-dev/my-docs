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
  animate,
  ease,
  replayButton,
  makeDraggable,
  dragHandle,
  readout,
} from "@/lib/diagram-helpers";

/**
 * 2.2.4 diagram — a single well-behaved (convex, but non-quadratic) 1D loss,
 * f(x) = 0.5 x^2 + 0.05 x^4, with a unique minimum at x = 0. Two dots race toward
 * that minimum from the same draggable starting point: a violet dot following
 * Newton's method (curvature-aware, very few, large jumps) and a blue dot
 * following plain gradient descent with a fixed step size (many small steps).
 * Both trajectories are computed from the actual function/gradient/Hessian
 * defined below, then played back with animate() so the viewer watches the
 * race unfold rather than seeing only the end state.
 */
const renderNewtonRace: DiagramRender = (host) => {
  // --- The toy loss and its exact derivatives (this is the "actual math" the
  // race is computed from -- no numerical differentiation, just calculus by hand).
  const f = (x: number) => 0.5 * x * x + 0.05 * x * x * x * x;
  const grad = (x: number) => x + 0.2 * x * x * x;
  const hess = (x: number) => 1 + 0.6 * x * x;

  function newtonTrajectory(x0: number, maxSteps: number, tol: number) {
    const traj = [x0];
    let x = x0;
    for (let i = 0; i < maxSteps; i++) {
      const g = grad(x);
      if (Math.abs(g) < tol) break;
      x = x - g / hess(x);
      traj.push(x);
      if (Math.abs(x) < tol) break;
    }
    return traj;
  }

  function gdTrajectory(x0: number, lr: number, maxSteps: number, tol: number) {
    const traj = [x0];
    let x = x0;
    for (let i = 0; i < maxSteps; i++) {
      const g = grad(x);
      if (Math.abs(g) < tol) break;
      x = x - lr * g;
      traj.push(x);
    }
    return traj;
  }

  // --- Layout / coordinate mapping.
  const X_MIN = -3.4,
    X_MAX = 3.4,
    Y_MIN = -1.0,
    Y_MAX = 12.6;
  const PX0 = 42,
    PX1 = 430,
    PY0 = 226,
    PY1 = 18;
  const mapX = (x: number) => PX0 + ((x - X_MIN) / (X_MAX - X_MIN)) * (PX1 - PX0);
  const mapY = (y: number) => PY0 + ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (PY1 - PY0);

  const s = svg(`0 0 460 250`);

  s.appendChild(
    el("line", {
      x1: PX0,
      y1: mapY(0),
      x2: PX1,
      y2: mapY(0),
      stroke: "#dfe1ec",
      "stroke-width": 1,
    }),
  );
  s.appendChild(
    el("line", {
      x1: mapX(0),
      y1: PY0,
      x2: mapX(0),
      y2: PY1,
      stroke: "#b8bdd6",
      "stroke-width": 1,
      "stroke-dasharray": "3,3",
    }),
  );
  const minLabel = el("text", {
    x: mapX(0),
    y: PY1 - 6,
    "text-anchor": "middle",
    "font-size": 9,
    fill: "#8b90ab",
  });
  minLabel.textContent = "minimum (θ* = 0)";
  s.appendChild(minLabel);

  let curvePath = "";
  for (let i = 0; i <= 160; i++) {
    const x = X_MIN + (i / 160) * (X_MAX - X_MIN);
    curvePath += `${i === 0 ? "M" : "L"}${mapX(x).toFixed(1)},${mapY(f(x)).toFixed(1)} `;
  }
  s.appendChild(
    el("path", { d: curvePath, fill: "none", stroke: "#9aa0b8", "stroke-width": 1.75 }),
  );

  const NEWTON_COLOR = "#7c3aed";
  const GD_COLOR = "#4f5fe0";
  const START_COLOR = "#64748b";

  const newtonTrail = el("g", {});
  const gdTrail = el("g", {});
  s.appendChild(newtonTrail);
  s.appendChild(gdTrail);

  const gdDot = el("circle", {
    cx: 0,
    cy: 0,
    r: 6.5,
    fill: GD_COLOR,
    stroke: "white",
    "stroke-width": 2,
  });
  const newtonDot = el("circle", {
    cx: 0,
    cy: 0,
    r: 6.5,
    fill: NEWTON_COLOR,
    stroke: "white",
    "stroke-width": 2,
  });
  s.appendChild(gdDot);
  s.appendChild(newtonDot);

  let startX = 2.8;
  const startHandle = dragHandle(mapX(startX), mapY(f(startX)), START_COLOR);
  s.appendChild(startHandle);

  function placeDots(x: number) {
    gdDot.setAttribute("cx", String(mapX(x)));
    gdDot.setAttribute("cy", String(mapY(f(x))));
    newtonDot.setAttribute("cx", String(mapX(x)));
    newtonDot.setAttribute("cy", String(mapY(f(x))));
  }
  placeDots(startX);

  host.appendChild(s);
  const out = readout(
    host,
    "Drag the grey marker onto the curve, or watch the automatic race below.",
  );

  let nStep = 0,
    nTotal = 0,
    nX = startX,
    nDone = false;
  let gStep = 0,
    gTotal = 0,
    gX = startX,
    gDone = false;

  function paint() {
    out.set(
      `Newton: step ${nStep}/${nTotal} \u00b7 distance to minimum ${Math.abs(nX).toFixed(4)}${
        nDone ? " (converged)" : ""
      }     |     Gradient descent: step ${gStep}/${gTotal} \u00b7 distance to minimum ${Math.abs(
        gX,
      ).toFixed(4)}${gDone ? " (stopped)" : ""}`,
    );
  }

  function animateSeries(
    traj: number[],
    dot: SVGCircleElement,
    trailGroup: SVGGElement,
    color: string,
    stepMs: number,
    easeFn: (t: number) => number,
    onProgress: (step: number, x: number, done: boolean) => void,
  ): () => void {
    let idx = 0;
    let cancelFn: (() => void) | null = null;
    function step() {
      if (idx >= traj.length - 1) {
        onProgress(idx, traj[idx], true);
        return;
      }
      const from = traj[idx];
      const to = traj[idx + 1];
      cancelFn = animate(
        stepMs,
        (eased) => {
          const x = from + (to - from) * eased;
          dot.setAttribute("cx", String(mapX(x)));
          dot.setAttribute("cy", String(mapY(f(x))));
          onProgress(idx, x, false);
        },
        () => {
          idx += 1;
          trailGroup.appendChild(
            el("circle", {
              cx: mapX(traj[idx]),
              cy: mapY(f(traj[idx])),
              r: 3,
              fill: color,
              opacity: 0.55,
            }),
          );
          const done = idx >= traj.length - 1;
          onProgress(idx, traj[idx], done);
          if (!done) step();
        },
        easeFn,
      );
    }
    step();
    return () => {
      if (cancelFn) cancelFn();
    };
  }

  let activeCancels: (() => void)[] = [];
  function cancelAll() {
    activeCancels.forEach((c) => c());
    activeCancels = [];
  }

  function runRace(x0: number) {
    cancelAll();
    newtonTrail.innerHTML = "";
    gdTrail.innerHTML = "";
    placeDots(x0);

    const newtonTraj = newtonTrajectory(x0, 8, 1e-4);
    const gdTraj = gdTrajectory(x0, 0.15, 55, 1e-4);

    nStep = 0;
    nTotal = newtonTraj.length - 1;
    nX = x0;
    nDone = nTotal === 0;
    gStep = 0;
    gTotal = gdTraj.length - 1;
    gX = x0;
    gDone = gTotal === 0;
    paint();

    const cancelNewton = animateSeries(
      newtonTraj,
      newtonDot,
      newtonTrail,
      NEWTON_COLOR,
      600,
      ease.inOutCubic,
      (step, x, done) => {
        nStep = step;
        nX = x;
        nDone = done;
        paint();
      },
    );
    const cancelGd = animateSeries(
      gdTraj,
      gdDot,
      gdTrail,
      GD_COLOR,
      75,
      ease.linear,
      (step, x, done) => {
        gStep = step;
        gX = x;
        gDone = done;
        paint();
      },
    );
    activeCancels = [cancelNewton, cancelGd];
  }

  const invX = (px: number) => X_MIN + ((px - PX0) / (PX1 - PX0)) * (X_MAX - X_MIN);
  let dragX = startX;
  const stopDrag = makeDraggable(startHandle, s, (p) => {
    let x = invX(Math.max(PX0, Math.min(PX1, p.x)));
    x = Math.max(X_MIN + 0.1, Math.min(X_MAX - 0.1, x));
    if (Math.abs(x) < 0.3) x = x < 0 ? -0.3 : 0.3;
    dragX = x;
    startHandle.setAttribute("cx", String(mapX(x)));
    startHandle.setAttribute("cy", String(mapY(f(x))));
    placeDots(x);
  });
  startHandle.addEventListener("pointerup", () => {
    startX = dragX;
    runRace(startX);
  });

  runRace(startX);
  replayButton(host, "\u21bb Replay the race", () => runRace(startX));

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Grey curve = the loss f(x) = 0.5x\u00b2 + 0.05x\u2074. Violet dot = Newton's method (curvature-aware " +
    "jumps); blue dot = gradient descent with a fixed step size (many small steps). Drag the grey " +
    "marker to a new starting point and release it to re-run the race from there, or use the replay " +
    "button to rerun it from the last starting point.";
  host.appendChild(hint);

  return () => {
    cancelAll();
    stopDrag();
  };
};

export function SecondOrderQuasiNewton() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> plain gradient descent only ever looks at the{" "}
          <strong>slope</strong> under its feet — the first derivative — and takes a step downhill
          proportional to that slope, scaled by a learning rate you have to pick. It has no idea
          whether the ground ahead is about to flatten out or steepen up; it finds out only after it
          gets there. <strong>Newton's method</strong> additionally looks at the{" "}
          <strong>curvature</strong> — the second derivative, or the Hessian matrix in more than one
          dimension — which tells it how the slope itself is changing. With both slope and curvature
          in hand, Newton's method can fit a parabola (a quadratic bowl) that locally matches the
          real function at the current point, and then jump straight to the bottom of{" "}
          <em>that parabola</em> in a single step, instead of nibbling downhill one small step at a
          time. Near the true minimum, where most smooth functions really do look almost exactly
          like a bowl, this is often dramatically faster than gradient descent.
        </p>
        <p>
          <strong>Intermediate:</strong> the reason this works so well close to the optimum is a
          direct consequence of calculus, not a lucky coincidence — a smooth function's second-order
          Taylor expansion around its minimum <em>is</em> a quadratic bowl, up to an error term that
          shrinks faster than the quadratic term itself as you get closer. So "solve the quadratic
          approximation exactly" and "solve the real problem exactly" converge to being almost the
          same task once you're near the answer. The price is steep, though. Forming the Hessian for{" "}
          <code>n</code> parameters means computing an <code>n×n</code> matrix of second
          derivatives, and inverting (or solving a linear system with) that matrix costs roughly{" "}
          <code>O(n\u00b3)</code> — trivial for <code>n</code> in the tens, ruinous for a model with
          millions of parameters. Far from the optimum it's also risky in a specific, structural
          way: the local quadratic approximation can simply be a bad model of the real function out
          there, and Newton's raw update has no built-in notion of "downhill" — it only solves for
          where the <em>local quadratic model</em> is flat. Near a <strong>saddle point</strong>{" "}
          (common in non-convex deep-learning losses, where the Hessian has both positive and
          negative curvature directions), that stationary point of the local model can be a maximum
          or a saddle rather than a minimum, and the raw update can march the parameters straight
          toward it.
        </p>
        <p>
          <strong>Advanced:</strong> <strong>quasi-Newton methods</strong> — most importantly{" "}
          <strong>BFGS</strong> and its limited-memory cousin <strong>L-BFGS</strong> — are the
          practical compromise the field actually uses. Instead of computing the true Hessian at
          all, they build up an <em>approximation</em> to the (inverse) Hessian purely from the
          gradients already computed at recent steps — the same information gradient descent already
          has lying around, just used more cleverly. Each step's change in position and change in
          gradient gives one more piece of curvature information "for free," and BFGS folds that
          piece into a running approximation that gets more curvature-aware over time, recovering
          much of Newton's fast convergence at a small fraction of the cost. L-BFGS pushes this
          further: rather than storing a full dense <code>n×n</code> approximate-Hessian matrix
          (which is itself <code>O(n\u00b2)</code> in memory — still too much for very large
          models), it keeps only a small, fixed-size window of the last handful of position and
          gradient differences, and reconstructs the effect of the approximate inverse Hessian from
          just those on the fly. That is exactly what "limited-memory" refers to, and it's what
          makes L-BFGS usable on problems full BFGS, let alone full Newton, never could touch.
        </p>
      </SectionBlock>

      <SectionBlock id="formula" label="Formula" tone="formula">
        <p className="mb-1.5 text-[13.5px] text-muted-foreground">
          Gradient descent's update rule:
        </p>
        <Formula>
          {"\\theta_{k+1} \\;=\\; \\theta_k \\;-\\; \\alpha \\, \\nabla f(\\theta_k)"}
        </Formula>
        <p className="mb-1.5 mt-3 text-[13.5px] text-muted-foreground">
          Newton's method's update rule:
        </p>
        <Formula>
          {
            "\\theta_{k+1} \\;=\\; \\theta_k \\;-\\; \\big[\\nabla^2 f(\\theta_k)\\big]^{-1} \\, \\nabla f(\\theta_k)"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Line these up and the relationship is exact: Newton's method is gradient descent with the
          scalar learning rate <Formula display={false}>{"\\alpha"}</Formula> replaced by an entire
          matrix, <Formula display={false}>{"[\\nabla^2 f(\\theta_k)]^{-1}"}</Formula>, the inverse
          Hessian. A scalar <code>α</code> can only ever stretch or shrink the gradient step by the
          same amount in every direction at once. The inverse Hessian instead{" "}
          <em>rescales and rotates</em> the step — taking large steps along directions the function
          is nearly flat in, small steps along directions it's steeply curved in, and correcting for
          how those directions interact — using real curvature information instead of one number
          picked in advance. That single substitution, one matrix in place of one scalar, is the
          entire formal difference between a first-order and a second-order optimizer.
        </p>
      </SectionBlock>

      <Derivation
        id="derivation"
        title="Derivation: Newton's method from a second-order Taylor expansion"
      >
        <p>
          Start from the second-order Taylor expansion of <code>f</code> around the current point{" "}
          <Formula display={false}>{"\\theta_k"}</Formula>, for a small step{" "}
          <Formula display={false}>{"\\delta"}</Formula>:
        </p>
        <Formula>
          {
            "f(\\theta_k + \\delta) \\;\\approx\\; f(\\theta_k) \\;+\\; \\nabla f(\\theta_k)^\\top \\delta \\;+\\; \\tfrac12\\, \\delta^\\top \\nabla^2 f(\\theta_k)\\, \\delta"
          }
        </Formula>
        <p>
          This right-hand side is a plain quadratic function of <code>δ</code> — a constant, plus a
          linear term, plus a quadratic term — so it can be minimized over <code>δ</code> exactly,
          the same way any quadratic can. Differentiate it with respect to <code>δ</code>. The
          linear term's gradient is just <code>∇f(θ_k)</code>; the quadratic term's gradient uses
          the standard identity for a symmetric matrix <code>H</code>,{" "}
          <Formula display={false}>
            {"\\nabla_\\delta\\big(\\tfrac12 \\delta^\\top H \\delta\\big) = H\\delta"}
          </Formula>{" "}
          (the Hessian <code>∇²f(θ_k)</code> is symmetric because mixed partial derivatives commute
          for any reasonably smooth <code>f</code>). So:
        </p>
        <Formula>
          {
            "\\nabla_\\delta \\big[f(\\theta_k+\\delta)\\big] \\;\\approx\\; \\nabla f(\\theta_k) \\;+\\; \\nabla^2 f(\\theta_k)\\, \\delta"
          }
        </Formula>
        <p>
          Setting this to zero — the first-order condition for a minimum of the quadratic
          approximation — gives a linear equation in <code>δ</code>:
        </p>
        <Formula>
          {"\\nabla f(\\theta_k) \\;+\\; \\nabla^2 f(\\theta_k)\\, \\delta \\;=\\; 0"}
        </Formula>
        <p>
          Solving for <code>δ</code> (left-multiplying by the inverse Hessian, assuming it exists):
        </p>
        <Formula>
          {"\\delta \\;=\\; -\\big[\\nabla^2 f(\\theta_k)\\big]^{-1} \\nabla f(\\theta_k)"}
        </Formula>
        <p>
          and taking that step, <code>θ_{"{k+1}"} = θ_k + δ</code>, is exactly Newton's update from
          the Formula section above. Every step of Newton's method is, precisely, "minimize the
          local quadratic model exactly," repeated.
        </p>
        <p>
          <strong>Why this converges quadratically near a well-behaved minimum.</strong> The Taylor
          expansion used above is only an approximation — it drops a remainder term that is{" "}
          <code>O(\u2016\u03b4\u2016\u00b3)</code> for the function itself, which means the{" "}
          <em>gradient's</em> own linear approximation, <code>∇f(θ_k) + ∇²f(θ_k)δ</code>, differs
          from the true gradient <code>∇f(θ_k + δ)</code> by only <code>O(‖δ‖²)</code> (one
          derivative lower than the function's own remainder). Newton's step <code>δ</code> is
          chosen precisely to make that linear approximation of the gradient exactly zero — so the
          true gradient at the new point, <code>∇f(θ_{"{k+1}"})</code>, is whatever is left over
          after that approximation error: <code>O(‖δ‖²)</code>, i.e. of order the <em>square</em> of
          the distance just moved. Near a well-behaved minimum, where the Hessian stays roughly
          constant and positive definite, being <code>O(‖δ‖²)</code> away in gradient translates
          into being <code>O(‖δ‖²)</code> away in position too. In plain terms: each Newton step's
          error is roughly the <em>square</em> of the previous step's error, so the number of
          correct digits roughly doubles every iteration — a handful of steps can go from one
          correct digit to effectively machine precision. Gradient descent, by contrast, only ever
          multiplies its error by some fixed factor less than one each step (linear convergence) — a
          fixed fraction of progress per step, not a squaring of the remaining error, which is
          exactly why it typically needs far more iterations to reach the same precision.
        </p>
        <p>
          <strong>Connection to IRLS.</strong> Apply this exact derivation to logistic regression's
          log-likelihood, and the resulting Newton update — worked out fully in the later Regression
          module once generalized linear models (GLMs) are introduced — turns out to be exactly the
          classical <strong>Iteratively Reweighted Least Squares (IRLS)</strong> algorithm: at each
          iteration, solve a weighted least-squares problem where the weights come from the current
          model's predicted probabilities. IRLS isn't a different algorithm from Newton's method
          wearing a different name by coincidence — it <em>is</em> Newton's method, specialized to
          this one log-likelihood, with its particular Hessian recognized as reducible to a weighted
          normal-equations solve.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is precisely why logistic regression is so often
          fit with a Newton-type method (IRLS, or Newton-Raphson directly on the log-likelihood)
          rather than plain gradient descent — the underlying optimization problem is convex (lesson
          2.2.1), so there's no saddle-point or non-convexity risk to worry about, and Newton's
          quadratic convergence typically gets a tight fit in a handful of iterations rather than
          the hundreds or thousands gradient descent might need. It's also exactly why
          <strong> L-BFGS is a common default solver</strong> for the maximum-likelihood fitting
          step underneath many classical statistical and machine learning models — it gets most of
          that same fast convergence without ever forming a Hessian.
        </p>
      </Derivation>

      <DiagramBlock
        id="diagram"
        title="Race to the minimum: Newton's method vs. gradient descent"
        caption="The race replays automatically once on load. Drag the grey marker to a new point on the curve and release it to re-run the race from there — Newton's method (violet) reaches the bottom in a handful of large, curvature-aware jumps, while gradient descent (blue) crawls there in many small, fixed-size steps."
      >
        <DiagramHost render={renderNewtonRace} />
      </DiagramBlock>

      <MultiCodeExample
        id="practical"
        title="Practical example — Newton's method vs. gradient descent, from scratch and via a library"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `# Minimizing f(x) = 0.5*x^2 + 0.05*x^4, a well-behaved (convex, non-quadratic)
# 1D loss, comparing Newton's method against plain gradient descent -- both
# implemented with an exact, hand-derived gradient and Hessian, no autodiff.

def f(x):
    return 0.5 * x**2 + 0.05 * x**4

def grad(x):
    return x + 0.2 * x**3

def hess(x):
    return 1 + 0.6 * x**2

x_true_min = 0.0


def newtons_method(x0, steps=6):
    x = x0
    print("Newton's method")
    print(f"  step 0: x={x:.6f}  error={abs(x - x_true_min):.6f}")
    for k in range(1, steps + 1):
        x = x - grad(x) / hess(x)
        print(f"  step {k}: x={x:.6f}  error={abs(x - x_true_min):.6f}")
    return x


def gradient_descent(x0, lr=0.15, steps=40, print_every=5):
    x = x0
    print("Gradient descent")
    print(f"  step 0: x={x:.6f}  error={abs(x - x_true_min):.6f}")
    for k in range(1, steps + 1):
        x = x - lr * grad(x)
        if k % print_every == 0 or k == steps:
            print(f"  step {k}: x={x:.6f}  error={abs(x - x_true_min):.6f}")
    return x


newtons_method(3.0)
print()
gradient_descent(3.0)

# Typical output shows Newton's error shrinking roughly like it is being squared
# each step once it gets close (e.g. an error of ~0.11 becomes an error under
# 0.001 on the very next step), reaching machine-precision-level accuracy in
# about 4-5 steps -- while gradient descent's error shrinks by only a roughly
# constant fraction each step, and is still not fully converged after 40 steps.`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <iostream>
#include <cmath>

using namespace std;

// Same toy loss as the Python version: f(x) = 0.5*x^2 + 0.05*x^4.
double f(double x) { return 0.5 * x * x + 0.05 * x * x * x * x; }
double grad(double x) { return x + 0.2 * x * x * x; }
double hess(double x) { return 1.0 + 0.6 * x * x; }

const double X_TRUE_MIN = 0.0;

void newtonsMethod(double x0, int steps = 6) {
    double x = x0;
    cout << "Newton's method\\n";
    cout << "  step 0: x=" << x << "  error=" << fabs(x - X_TRUE_MIN) << "\\n";
    for (int k = 1; k <= steps; k++) {
        x = x - grad(x) / hess(x);
        cout << "  step " << k << ": x=" << x << "  error=" << fabs(x - X_TRUE_MIN) << "\\n";
    }
}

void gradientDescent(double x0, double lr = 0.15, int steps = 40, int printEvery = 5) {
    double x = x0;
    cout << "Gradient descent\\n";
    cout << "  step 0: x=" << x << "  error=" << fabs(x - X_TRUE_MIN) << "\\n";
    for (int k = 1; k <= steps; k++) {
        x = x - lr * grad(x);
        if (k % printEvery == 0 || k == steps) {
            cout << "  step " << k << ": x=" << x << "  error=" << fabs(x - X_TRUE_MIN) << "\\n";
        }
    }
}

int main() {
    newtonsMethod(3.0);
    cout << "\\n";
    gradientDescent(3.0);
    return 0;
}

// As in the Python version: Newton's error shrinks at a roughly quadratic rate
// (each step's error is on the order of the square of the previous one) and is
// effectively converged within about half a dozen steps, while fixed-step
// gradient descent needs many more iterations for comparable accuracy.`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from scipy.optimize import minimize

# Same toy loss, now solved with a trusted library implementation of a
# genuine second-order method (Newton-CG, which needs a gradient and a
# Hessian) versus a genuine quasi-Newton method (L-BFGS-B, which needs
# only a gradient) -- to see how few iterations each needs in practice.

def f(x):
    x = x[0]
    return 0.5 * x**2 + 0.05 * x**4

def grad(x):
    x = x[0]
    return np.array([x + 0.2 * x**3])

def hess(x):
    x = x[0]
    return np.array([[1.0 + 0.6 * x**2]])

x0 = np.array([3.0])

res_newton_cg = minimize(f, x0, jac=grad, hess=hess, method="Newton-CG", options={"xtol": 1e-10})
res_lbfgs = minimize(f, x0, jac=grad, method="L-BFGS-B", options={"ftol": 1e-14, "gtol": 1e-12})

print(f"Newton-CG : x* = {res_newton_cg.x[0]:.8f}   iterations = {res_newton_cg.nit}")
print(f"L-BFGS-B  : x* = {res_lbfgs.x[0]:.8f}   iterations = {res_lbfgs.nit}")

# Newton-CG (a true second-order method, given the exact Hessian) typically
# reaches the minimum in only a handful of iterations. L-BFGS-B, using only
# gradients and an approximate curvature model built up on the fly, needs
# somewhat more iterations than Newton-CG but still dramatically fewer than a
# plain fixed-step gradient-descent loop would on the same problem -- exactly
# the "most of the benefit, a fraction of the cost" trade-off this lesson is
# built around.`,
          },
        ]}
      >
        <p>
          All three implementations below minimize the same one-dimensional loss{" "}
          <code>f(x) = 0.5x\u00b2 + 0.05x\u2074</code> used in the diagram above, starting from{" "}
          <code>x = 3</code>. The first two hand-roll both Newton's method and gradient descent from
          an exact, manually-derived gradient and Hessian, printing the error after each step so the
          quadratic-vs-linear convergence-rate contrast is visible directly in the numbers. The
          third swaps in a real, production-grade optimizer library and compares a genuine
          second-order method against a genuine quasi-Newton one.
        </p>
      </MultiCodeExample>

      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Logistic regression fit via Newton's method / IRLS.</strong> Classical
            statistics packages (R's <code>glm()</code>, Python's <code>statsmodels</code>) default
            to Newton-Raphson or IRLS for fitting logistic regression and other GLMs, because the
            log-likelihood is convex (2.2.1) and smooth enough that a handful of Newton iterations
            reaches a tight fit — exactly the scenario the Derivation section above builds toward.
          </li>
          <li>
            <strong>
              L-BFGS as scikit-learn's default <code>LogisticRegression</code> solver.
            </strong>{" "}
            <code>solver='lbfgs'</code> is the library's default precisely because it needs only
            gradients (cheap, and easy to get right for a convex loss), yet still converges in far
            fewer iterations than plain gradient descent would — the practical sweet spot this whole
            lesson is about, and it shows up as the literal default argument in one of the most-used
            ML libraries in existence.
          </li>
          <li>
            <strong>
              Newton's method is essentially never used to train deep neural networks directly.
            </strong>{" "}
            A network with tens of millions or billions of parameters has a Hessian with that many
            squared entries — computing it, let alone inverting it, is completely infeasible at that
            scale (<code>O(n\u00b3)</code> for the solve, on top of <code>O(n\u00b2)</code> just to
            store it). This is exactly why the adaptive, per-parameter first-order optimizers from
            the previous lesson (2.2.3) — Adam, RMSProp, and their relatives — dominate deep
            learning instead: they approximate a little bit of curvature information (a
            per-parameter scale) far more cheaply than any true second-order method could.
          </li>
          <li>
            <strong>Gauss-Newton and Levenberg-Marquardt</strong> are second-order-flavored methods
            purpose-built for nonlinear least-squares curve fitting — fitting a nonlinear model to
            data by minimizing squared residuals. They approximate the Hessian using only
            first-derivative (Jacobian) information specific to a sum-of-squares objective, which is
            cheaper than a true Hessian and numerically well-behaved for this one common problem
            shape. This is what runs, for example, behind <code>scipy.optimize.curve_fit</code> and
            countless calibration and system-identification routines in engineering.
          </li>
          <li>
            <strong>Natural gradient and K-FAC-style optimizers</strong> are attempts to bring
            curvature information back into large-scale training cheaply, by approximating the
            Hessian's structure (e.g. per-layer, or via the Fisher information matrix) rather than
            forming it exactly. They're mentioned here only as a forward pointer — genuinely
            promising, but still squarely in the research-and-specialized-tooling category rather
            than default practice (see the Expert note below).
          </li>
          <li>
            <strong>L-BFGS shows up throughout the scientific Python stack</strong> well beyond
            logistic regression — as the default or a standard option for maximum-likelihood fits of
            Gaussian process kernel hyperparameters, conditional random fields, and many other{" "}
            <code>scipy.optimize.minimize</code> call sites where gradients are cheap to compute but
            an exact Hessian is not.
          </li>
        </ul>
      </SectionBlock>

      <Pitfall>
        <ul>
          <li>
            Running plain Newton's method far from the minimum on a non-convex loss and being
            surprised when it diverges or marches toward a saddle point or a maximum. The raw update
            has no concept of "downhill" — it solves for wherever the{" "}
            <em>local quadratic approximation</em> is stationary, which is a genuine minimum only if
            the Hessian there is positive definite. Near a saddle point (common in non-convex
            deep-learning losses, per the Beginner/Intermediate discussion above), the Hessian has
            negative eigenvalues, and Newton's step can happily move <em>toward</em> that saddle
            rather than away from it.
          </li>
          <li>
            Assuming "more curvature information is always better" while ignoring the very real{" "}
            <code>O(n\u00b3)</code>-per-step cost of forming and solving with an exact{" "}
            <code>n×n</code> Hessian. For a model with a few dozen parameters that's free; for a
            model with millions, it's a categorically bad trade — the previous lesson's adaptive
            first-order methods exist precisely because paying for exact curvature at that scale
            isn't worth it.
          </li>
          <li>
            Confusing a quasi-Newton method's <em>approximate</em> curvature — built up purely from
            recent gradient differences — with the true Hessian. BFGS and L-BFGS's approximation is
            often excellent in practice, but its theoretical guarantees are weaker and more
            empirical than full Newton's method's guarantees near a true minimum; treating an L-BFGS
            run as "basically exact second-order information" overstates what it's actually doing.
          </li>
        </ul>
      </Pitfall>

      <ExpertNote>
        <p>
          <strong>Trust region methods</strong> are a more robust refinement of the basic Newton
          idea, aimed directly at the far-from-the-minimum failure mode in the Pitfall above.
          Instead of always taking the full Newton step wherever it points, a trust-region method
          only trusts its local quadratic model within some radius, solves a constrained version of
          the Newton problem inside that radius, and then checks how well the model's predicted
          decrease in the objective matched the <em>actual</em> decrease once the step was taken. A
          good match grows the trust radius for next time; a bad match shrinks it and the step is
          retried more cautiously. This single feedback loop — grow trust when the local model is
          being honest, shrink it when it isn't — is what turns "solve the local quadratic exactly,
          always" into something that degrades gracefully far from the optimum instead of diverging
          outright.
        </p>
        <p>
          In modern deep learning, bringing curvature information back into large-scale training
          cheaply is an active area of ongoing research, not settled practice —{" "}
          <strong>K-FAC</strong> (Kronecker-Factored Approximate Curvature) approximates each
          layer's Fisher information matrix with a much cheaper Kronecker-factored structure, and{" "}
          <strong>Shampoo</strong> uses a related factored-preconditioner idea, both trying to
          recover some of second-order convergence's benefits without ever forming a true Hessian.
          Both have shown real gains in specific large-scale training setups, but neither has
          displaced Adam-family optimizers as the default choice the way L-BFGS has for classical
          convex fitting — treat this as a promising research direction to watch, not a settled
          recommendation.
        </p>
      </ExpertNote>

      <Quiz
        q="On a non-convex loss, why can plain Newton's method actually move toward a saddle point instead of away from it, when gradient descent with a small step size tends not to?"
        a="Gradient descent always moves in the direction of steepest local decrease -- it only ever asks 'which way is downhill right now,' so on any direction where the loss is currently decreasing it keeps decreasing along that direction until the slope there flattens out. Newton's method asks a different question: 'where is the local quadratic model of the loss stationary' -- that is, where does the linear approximation of the gradient hit zero. That stationary point is a true minimum of the real function only when the Hessian at the current point is positive definite in every direction. Near a saddle point the Hessian has at least one negative eigenvalue, so the quadratic model itself curves downward in that direction and its stationary point sits on the far side of the saddle rather than at a minimum -- and Newton's update, having no separate notion of 'downhill' beyond solving for that stationary point, will step toward it anyway. Newton's method is only safe to run unmodified when convexity (a positive-definite Hessian, as guaranteed in the convex problems from 2.2.1) rules this failure mode out."
      />

      <Takeaway>
        <p>
          Newton's method replaces gradient descent's one-size-fits-all scalar step with a full
          curvature-aware matrix step, derived by exactly minimizing a local quadratic model of the
          loss — which is why it converges quadratically near a well-behaved minimum, but is
          <code> O(n\u00b3)</code>-per-step expensive and can misbehave badly (moving toward a
          saddle or maximum) far from one or on non-convex problems. Quasi-Newton methods,
          especially L-BFGS, are the practical compromise the field actually reaches for:
          approximate curvature built cheaply from recent gradients, getting most of Newton's speed
          without ever forming a Hessian — which is exactly why Newton-type methods and IRLS
          dominate convex fits like logistic regression, L-BFGS is scikit-learn's default
          logistic-regression solver, and true second-order methods are essentially absent from
          deep-learning training, where the previous lesson's adaptive first-order optimizers take
          over instead.
        </p>
      </Takeaway>
    </>
  );
}
