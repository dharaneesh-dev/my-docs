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
  dragHandle,
  makeDraggable,
  readout,
  arrowDefs,
} from "@/lib/diagram-helpers";

/**
 * 2.2.6 diagram — minimize x^2+y^2 subject to x+y=1 (closest point on a line to the
 * origin). Draws concentric circular contours of f and the constraint line, a point
 * constrained to slide along the line, and the two gradient directions (objective's
 * gradient, and the line's normal) as arrows — which visibly align only at the optimum
 * (0.5, 0.5). On mount, animates the point sliding from one end of the line to the
 * optimum, with the arrows visibly rotating into alignment as it arrives.
 */
const renderLagrangeAlignment: DiagramRender = (host) => {
  const CX = 210,
    CY = 210,
    SCALE = 55; // pixels per unit
  const toPx = (x: number, y: number) => ({ px: CX + x * SCALE, py: CY - y * SCALE });

  const s = svg("0 0 420 420");
  s.appendChild(arrowDefs("arrow-obj", "#4f5fe0"));
  s.appendChild(arrowDefs("arrow-con", "#1f8a5f"));

  // Contour circles of f(x,y) = x^2+y^2 (radius = sqrt(level)).
  [0.25, 0.5, 0.75, 1.0].forEach((level) => {
    const r = Math.sqrt(level) * SCALE;
    s.appendChild(
      el("circle", { cx: CX, cy: CY, r, fill: "none", stroke: "#dfe1ec", "stroke-width": 1 }),
    );
  });

  // Constraint line x + y = 1, drawn across the visible plot.
  const lineA = toPx(-0.6, 1.6);
  const lineB = toPx(1.9, -0.9);
  s.appendChild(
    el("line", {
      x1: lineA.px,
      y1: lineA.py,
      x2: lineB.px,
      y2: lineB.py,
      stroke: "#1f8a5f",
      "stroke-width": 2,
    }),
  );

  const optPx = toPx(0.5, 0.5);
  s.appendChild(el("circle", { cx: optPx.px, cy: optPx.py, r: 3.5, fill: "#111827" }));
  const optLabel = el(
    "text",
    { x: optPx.px + 8, y: optPx.py - 8, "font-size": 10, fill: "#6b7280" },
    [],
  );
  optLabel.textContent = "optimum (0.5, 0.5)";
  s.appendChild(optLabel);

  const point = dragHandle(0, 0, "#d1453d");
  const objArrow = el("line", {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: "#4f5fe0",
    "stroke-width": 2.25,
    "marker-end": "url(#arrow-obj)",
  });
  const conArrow = el("line", {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: "#1f8a5f",
    "stroke-width": 2.25,
    "marker-end": "url(#arrow-con)",
  });
  s.appendChild(objArrow);
  s.appendChild(conArrow);
  s.appendChild(point);
  host.appendChild(s);

  const legend = document.createElement("div");
  legend.className =
    "mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground";
  legend.innerHTML =
    '<span style="color:#1f8a5f">■</span> constraint line x+y=1 &nbsp; ' +
    '<span style="color:#4f5fe0">→</span> ∇f (objective gradient) &nbsp; ' +
    '<span style="color:#1f8a5f">→</span> constraint normal';
  host.appendChild(legend);

  const out = readout(host, "");

  function place(t: number) {
    // Parametrize the line as (x, 1-x) with x = t.
    const x = t,
      y = 1 - t;
    const { px, py } = toPx(x, y);
    point.setAttribute("cx", String(px));
    point.setAttribute("cy", String(py));

    // Objective gradient at (x,y) is (2x, 2y); constraint normal is (1,1) always.
    const gx = 2 * x,
      gy = 2 * y;
    const gnorm = Math.hypot(gx, gy) || 1;
    const ux = gx / gnorm,
      uy = gy / gnorm;
    objArrow.setAttribute("x1", String(px));
    objArrow.setAttribute("y1", String(py));
    objArrow.setAttribute("x2", String(px + ux * 40 * SCALE * 0.01 * 40));
    objArrow.setAttribute("y2", String(py - uy * 40 * SCALE * 0.01 * 40));

    const cnorm = Math.SQRT2;
    const cux = 1 / cnorm,
      cuy = 1 / cnorm;
    conArrow.setAttribute("x1", String(px));
    conArrow.setAttribute("y1", String(py));
    conArrow.setAttribute("x2", String(px + cux * 40));
    conArrow.setAttribute("y2", String(py - cuy * 40));

    const cosAngle = (ux * cux + uy * cuy) / (Math.hypot(ux, uy) * Math.hypot(cux, cuy) || 1);
    const aligned = cosAngle > 0.999;
    out.set(
      `point = (${x.toFixed(2)}, ${y.toFixed(2)})   f = ${(x * x + y * y).toFixed(3)}   gradients aligned: ${aligned ? "yes — this is the optimum" : "no"}`,
    );
  }
  place(0.9);

  const invT = (px: number) => {
    // Solve for t along the parametrized line from a pixel x-coordinate.
    const worldX = (px - CX) / SCALE;
    return Math.max(-0.5, Math.min(1.8, worldX));
  };

  let introCancel: (() => void) | null = null;
  function stopIntro() {
    if (introCancel) {
      introCancel();
      introCancel = null;
    }
  }

  const stopDrag = makeDraggable(point, s, (p) => {
    stopIntro();
    place(invT(p.x));
  });

  function playIntro() {
    return animate(
      1800,
      (eased) => place(0.9 + (0.5 - 0.9) * eased),
      () => place(0.5),
      ease.inOutCubic,
    );
  }
  introCancel = playIntro();
  replayButton(host, "▶ Replay slide to optimum", () => {
    stopIntro();
    introCancel = playIntro();
  });

  return () => {
    stopIntro();
    stopDrag();
  };
};

export function ConstrainedOptimizationDuality() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a <strong>constrained optimization</strong> problem asks you to
          minimize something subject to rules you're not allowed to break — "minimize cost, subject
          to using at least this much material." <strong>Lagrange multipliers</strong> are a trick
          for turning such a problem into an easier-to-analyze unconstrained one, by attaching a
          "price" to each constraint.
        </p>
        <p>
          <strong>Intermediate:</strong> the geometric intuition for an equality constraint is
          concrete: at the constrained optimum, the gradient of the objective must be{" "}
          <em>parallel</em> to the gradient of the constraint. If it weren't, you could slide a
          little along the constraint surface and keep improving the objective — so "parallel
          gradients" is the only way to be genuinely stuck.
        </p>
        <p>
          <strong>Advanced:</strong> for inequality constraints, this generalizes into the{" "}
          <strong>KKT (Karush-Kuhn-Tucker) conditions</strong> — primal feasibility, dual
          feasibility, complementary slackness, and the same stationarity/parallel-gradient
          condition — which together characterize an optimum. This sets up the{" "}
          <strong>dual problem</strong>, built from the same Lagrangian, and a crucial practical
          distinction: <strong>weak duality</strong> always holds (the dual always gives a valid
          lower bound on the primal optimum), while <strong>strong duality</strong> (the dual
          exactly equals the primal — zero gap) holds only under extra conditions, typically
          convexity plus a mild feasibility regularity condition (Slater's condition). When strong
          duality holds, solving the dual gives you the exact primal answer — and this is precisely
          the machinery the SVM module later in this chapter is built on.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\mathcal{L}(x,\\lambda,\\nu) = f(x) + \\sum_i \\lambda_i g_i(x) + \\sum_j \\nu_j h_j(x)"
          }
        </Formula>
        <Formula>
          {
            "d(\\lambda,\\nu) = \\min_x \\mathcal{L}(x,\\lambda,\\nu) \\quad\\Longrightarrow\\quad d(\\lambda,\\nu) \\le f(x^*) \\ \\text{ for any } \\lambda \\ge 0"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The Lagrangian for "minimize f(x) subject to gᵢ(x) ≤ 0 and hⱼ(x) = 0," and weak duality —
          the dual function is always a lower bound on the true constrained optimum.
        </p>
      </SectionBlock>
      <Derivation title="Derivation: a fully worked Lagrange multiplier problem, and a proof of weak duality">
        <p>
          <strong>Part 1 — closest point on a line to the origin.</strong> Minimize{" "}
          <code>f(x,y) = x²+y²</code> subject to <code>x+y=1</code>. Form the Lagrangian{" "}
          <code>ℒ(x,y,ν) = x²+y²+ν(x+y−1)</code> and set every partial derivative to zero:
        </p>
        <Formula>
          {
            "\\frac{\\partial \\mathcal{L}}{\\partial x} = 2x+\\nu = 0, \\quad \\frac{\\partial \\mathcal{L}}{\\partial y} = 2y+\\nu = 0, \\quad \\frac{\\partial \\mathcal{L}}{\\partial \\nu} = x+y-1 = 0"
          }
        </Formula>
        <p>
          The first two give <code>x = y = −ν/2</code>. Substituting into the third,{" "}
          <code>−ν/2 − ν/2 − 1 = 0 ⟹ ν = −1</code>, so <code>x = y = 1/2</code>. This matches the
          obvious geometric answer — the closest point on the line to the origin — as a sanity check
          that the machinery works.
        </p>
        <p>
          <strong>Part 2 — weak duality, in general.</strong> For any point <code>x</code> that
          satisfies the constraints (feasible) and any <code>λ ≥ 0</code>:
        </p>
        <Formula>
          {
            "\\mathcal{L}(x,\\lambda,\\nu) = f(x) + \\sum_i \\lambda_i g_i(x) + \\sum_j \\nu_j h_j(x) \\le f(x)"
          }
        </Formula>
        <p>
          This holds because <code>λᵢgᵢ(x) ≤ 0</code> (feasibility gives <code>gᵢ(x)≤0</code>, and{" "}
          <code>λᵢ≥0</code>, so their product is ≤ 0), and <code>νⱼhⱼ(x) = 0</code> exactly (since{" "}
          <code>hⱼ(x)=0</code> for a feasible point). Now take the minimum over ALL <code>x′</code>{" "}
          (not just the feasible one we picked):
        </p>
        <Formula>
          {
            "d(\\lambda,\\nu) = \\min_{x'} \\mathcal{L}(x',\\lambda,\\nu) \\le \\mathcal{L}(x,\\lambda,\\nu) \\le f(x)"
          }
        </Formula>
        <p>
          Since this chain holds for every feasible <code>x</code>, it holds in particular for the
          true optimum <code>x*</code>: <code>d(λ,ν) ≤ f(x*)</code> — the dual function value is
          always a valid lower bound on the true constrained minimum, for any choice of{" "}
          <code>λ≥0</code>. This is weak duality, and the proof used nothing beyond the sign of{" "}
          <code>λᵢgᵢ(x)</code> and the definition of a minimum.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this is exactly the machinery behind SVM training (a later module in
          this chapter). The SVM's margin-maximization problem is convex and satisfies Slater's
          condition, so strong duality holds — which is why SVMs are trained by solving the DUAL
          problem instead of the original primal formulation, and why "support vectors" turn out to
          be exactly the training points with nonzero Lagrange multipliers: complementary slackness
          is precisely why every other point ends up with a multiplier of exactly zero.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Gradients align only at the constrained optimum"
        caption="Drag the red point along the green constraint line and watch the blue (objective gradient) and green (constraint normal) arrows — they point in the same direction only at (0.5, 0.5), exactly where the derivation says they must."
      >
        <DiagramHost render={renderLagrangeAlignment} />
      </DiagramBlock>
      <MultiCodeExample
        title="Practical example — solving the toy Lagrangian system, and checking weak duality numerically"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import numpy as np

# Part 1: solve the 3x3 linear system from the Lagrange-multiplier derivation
# (2x + nu = 0, 2y + nu = 0, x + y - 1 = 0) for [x, y, nu].
A = np.array([
    [2, 0, 1],
    [0, 2, 1],
    [1, 1, 0],
], dtype=float)
b = np.array([0, 0, 1], dtype=float)
x, y, nu = np.linalg.solve(A, b)
print(f"x={x:.3f} y={y:.3f} nu={nu:.3f}  (expect x=y=0.5)")
print("constraint satisfied:", np.isclose(x + y, 1.0))

# Part 2: numerically verify weak duality for minimize x^2 subject to x >= 1,
# i.e. g(x) = 1 - x <= 0. The Lagrangian is L(x, lam) = x^2 + lam*(1-x).
# Minimizing over x for fixed lam: dL/dx = 2x - lam = 0 => x = lam/2.
def dual(lam):
    x_star = lam / 2
    return x_star ** 2 + lam * (1 - x_star)

true_optimum = 1.0  # the true constrained minimum of x^2 s.t. x>=1 is at x=1, f=1
for lam in [0.0, 0.5, 1.0, 1.5, 2.0, 3.0]:
    d = dual(lam)
    print(f"lambda={lam:.1f}  dual={d:.3f}  <= true optimum {true_optimum}? {d <= true_optimum + 1e-9}")`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <array>
#include <cmath>
#include <iostream>

int main() {
    // Solve the 3x3 system by hand (small enough for direct elimination):
    // 2x + nu = 0
    // 2y + nu = 0
    // x + y = 1
    // From the first two: x = y = -nu/2. Substitute into the third:
    // -nu/2 - nu/2 - 1 = 0 => nu = -1, so x = y = 0.5.
    double nu = -1.0;
    double x = -nu / 2.0, y = -nu / 2.0;
    std::cout << "x=" << x << " y=" << y << " nu=" << nu << "\\n";
    std::cout << "constraint x+y=1 satisfied: " << (std::abs(x + y - 1.0) < 1e-9) << "\\n";

    // Weak duality check for minimize x^2 s.t. x >= 1: dual(lambda) = (lambda/2)^2 + lambda*(1 - lambda/2)
    double trueOptimum = 1.0;
    for (double lam : {0.0, 0.5, 1.0, 1.5, 2.0, 3.0}) {
        double xStar = lam / 2.0;
        double d = xStar * xStar + lam * (1 - xStar);
        std::cout << "lambda=" << lam << " dual=" << d
                   << " <= true optimum? " << (d <= trueOptimum + 1e-9) << "\\n";
    }
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from scipy.optimize import minimize

# Same constrained problem, solved by a real general-purpose constrained solver
# instead of hand-derived Lagrangian algebra.
def objective(v):
    x, y = v
    return x ** 2 + y ** 2

constraints = [{"type": "eq", "fun": lambda v: v[0] + v[1] - 1}]
result = minimize(objective, x0=[0.9, 0.1], constraints=constraints, method="SLSQP")
print("x, y =", np.round(result.x, 3))
print("Lagrange multiplier estimate:", result.get("v", result.get("multipliers", "n/a")))
# scipy's SLSQP solves this via essentially the same KKT machinery derived above,
# and often exposes the fitted multipliers directly in its result object.`,
          },
        ]}
      />
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Support Vector Machines</strong> (a later module) train by solving a convex
            constrained QP via its dual — the flagship real use of everything derived in this
            lesson.
          </li>
          <li>
            <strong>Portfolio optimization</strong> in finance: minimize risk subject to a minimum
            expected return and a budget constraint — a classical constrained quadratic program.
          </li>
          <li>
            <strong>Resource allocation</strong> problems throughout operations research are almost
            always posed and solved exactly this way.
          </li>
          <li>
            <strong>Physics-informed optimization</strong> enforces conservation laws (energy, mass,
            momentum) as hard equality constraints using this same Lagrangian machinery.
          </li>
          <li>
            <strong>Regularization as an implicit constraint</strong>: ridge regression's L2 penalty
            (Module 1's MLE/MAP lesson) can be shown, via duality, to be equivalent to a hard
            constraint <code>‖θ‖² ≤ t</code> for a matching <code>t</code> — a satisfying
            full-circle connection back to the very first module of this chapter.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Assuming strong duality holds for every optimization problem — it's specifically a
            convexity-plus-regularity result; non-convex problems can have a real, nonzero duality
            gap where the dual severely underestimates the true optimum.
          </li>
          <li>
            Misreading complementary slackness: a nonzero multiplier means its constraint is{" "}
            <em>active</em> (binding) at the optimum; a zero multiplier means it isn't — getting
            this backwards leads to misreading which constraints actually matter.
          </li>
          <li>
            Treating KKT conditions as <em>sufficient</em> for optimality in a general non-convex
            problem — they're only guaranteed to be <em>necessary</em> there. Sufficiency requires
            convexity (the previous module's Convex Optimization Basics lesson).
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The <strong>duality gap</strong> — the primal optimal value minus the dual optimal value —
          is itself a useful practical quantity even outside pure theory. Many convex solvers use it
          as a natural, certifiable stopping criterion: stop once the gap is provably below some
          tolerance, which gives a guaranteed bound on how far the current solution is from optimal
          — something first-order methods without duality generally can't offer as cleanly.
        </p>
      </ExpertNote>
      <Quiz
        q="In the diagram, why do the objective-gradient and constraint-normal arrows only point in the same direction at exactly one spot on the line?"
        a="Because the stationarity condition of the Lagrangian requires ∇f(x) to be a scalar multiple of the constraint's gradient — the two must be parallel. Anywhere else on the line, moving a little further along the line would still change f(x), meaning you haven't reached a point where the constraint direction is 'orthogonal to further improvement' — so you're not yet at a critical point of the constrained problem. Only at (0.5, 0.5) does sliding along the line in either direction fail to decrease x²+y² any further."
      />
      <Takeaway>
        <p>
          Lagrange multipliers and duality turn "minimize subject to these rules" into a related,
          often more tractable, unconstrained problem, with a provable (weak duality) or exact
          (strong duality, under convexity) relationship between the two. The next and final lesson
          of this module, EM as optimization, tackles a different obstacle entirely — an objective
          that's hard to maximize directly because of a hidden variable, not because of a
          constraint.
        </p>
      </Takeaway>
    </>
  );
}
