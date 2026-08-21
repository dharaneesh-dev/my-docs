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
  sliderControl,
  readout,
  dragHandle,
  makeDraggable,
} from "@/lib/diagram-helpers";

function softThreshold(theta: number, lambda: number) {
  const mag = Math.abs(theta) - lambda;
  return mag > 0 ? Math.sign(theta) * mag : 0;
}

/**
 * 2.2.5 diagram — the soft-thresholding curve y = soft(theta, lambda). A slider controls
 * lambda; on mount it animates lambda sweeping from 0 up to a wide "dead zone" and back
 * down to a resting value, so the flat zero-region visibly grows and shrinks. A handful of
 * draggable markers sit on the theta-axis and snap to wherever soft-thresholding sends
 * them, so the "many coefficients land at exactly zero" idea is directly visible.
 */
const renderSoftThreshold: DiagramRender = (host) => {
  const PLOT_LEFT = 40,
    PLOT_RIGHT = 400,
    PLOT_TOP = 20,
    PLOT_BOTTOM = 220;
  const T_MIN = -6,
    T_MAX = 6;
  const mapX = (t: number) =>
    PLOT_LEFT + ((t - T_MIN) / (T_MAX - T_MIN)) * (PLOT_RIGHT - PLOT_LEFT);
  const mapY = (v: number) => (PLOT_TOP + PLOT_BOTTOM) / 2 - v * 14;
  const invX = (px: number) =>
    T_MIN + ((px - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT)) * (T_MAX - T_MIN);

  const s = svg("0 0 440 260");

  s.appendChild(
    el("line", {
      x1: PLOT_LEFT,
      y1: mapY(0),
      x2: PLOT_RIGHT,
      y2: mapY(0),
      stroke: "#c7cbdc",
      "stroke-width": 1.25,
    }),
  );
  s.appendChild(
    el("line", {
      x1: mapX(0),
      y1: PLOT_TOP,
      x2: mapX(0),
      y2: PLOT_BOTTOM,
      stroke: "#c7cbdc",
      "stroke-width": 1.25,
    }),
  );

  const deadZone = el("rect", {
    x: 0,
    y: PLOT_TOP,
    width: 0,
    height: PLOT_BOTTOM - PLOT_TOP,
    fill: "#7c3aed",
    "fill-opacity": 0.08,
  });
  s.appendChild(deadZone);

  const curve = el("path", { d: "", fill: "none", stroke: "#4f5fe0", "stroke-width": 2.75 });
  s.appendChild(curve);

  s.appendChild(
    el("line", {
      x1: mapX(T_MIN),
      y1: mapY(T_MIN),
      x2: mapX(T_MAX),
      y2: mapY(T_MAX),
      stroke: "#d1d5e5",
      "stroke-width": 1,
      "stroke-dasharray": "3,3",
    }),
  );

  host.appendChild(s);

  const legend = document.createElement("p");
  legend.className = "mt-1 text-center text-[11.5px] text-muted-foreground";
  legend.textContent =
    'Dashed grey = identity (no shrinkage) · shaded band = the "dead zone" where output is exactly 0 · blue = soft(θ, λ)';
  host.appendChild(legend);

  const MARKER_THETAS = [-4.5, -2, -0.6, 1.5, 3.2, 5];
  const MARKER_COLORS = ["#4f5fe0", "#1f8a5f", "#b8720c", "#d1453d", "#7c3aed", "#0891b2"];
  const markerGroup = el("g", {});
  s.appendChild(markerGroup);

  const inputDots = MARKER_THETAS.map((t, i) => {
    const c = el("circle", {
      cx: mapX(t),
      cy: mapY(0) - 34,
      r: 5,
      fill: MARKER_COLORS[i],
      opacity: 0.55,
    });
    markerGroup.appendChild(c);
    return c;
  });
  const outputDots = MARKER_THETAS.map((_, i) => {
    const h = dragHandle(0, 0, MARKER_COLORS[i]);
    markerGroup.appendChild(h);
    return h;
  });
  const connectors = MARKER_THETAS.map((_, i) => {
    const l = el("line", {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      stroke: MARKER_COLORS[i],
      "stroke-width": 1,
      opacity: 0.35,
    });
    markerGroup.insertBefore(l, inputDots[i]);
    return l;
  });

  const markerThetas = MARKER_THETAS.slice();

  const out = readout(host, "");

  let lambda = 1;

  function redraw() {
    let d = "";
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const t = T_MIN + (i / N) * (T_MAX - T_MIN);
      const y = softThreshold(t, lambda);
      const p = `${mapX(t).toFixed(1)},${mapY(y).toFixed(1)}`;
      d += i === 0 ? `M${p}` : ` L${p}`;
    }
    curve.setAttribute("d", d);

    const zoneLeft = mapX(-lambda);
    const zoneRight = mapX(lambda);
    deadZone.setAttribute("x", String(zoneLeft));
    deadZone.setAttribute("width", String(Math.max(0, zoneRight - zoneLeft)));

    let zeroCount = 0;
    markerThetas.forEach((t, i) => {
      const y = softThreshold(t, lambda);
      if (y === 0) zeroCount++;
      inputDots[i].setAttribute("cx", String(mapX(t)));
      outputDots[i].setAttribute("cx", String(mapX(t)));
      outputDots[i].setAttribute("cy", String(mapY(y)));
      connectors[i].setAttribute("x1", String(mapX(t)));
      connectors[i].setAttribute("y1", String(mapY(0) - 34));
      connectors[i].setAttribute("x2", String(mapX(t)));
      connectors[i].setAttribute("y2", String(mapY(y)));
    });

    out.set(
      `λ = ${lambda.toFixed(2)}   —   ${zeroCount} of ${markerThetas.length} markers pushed to exactly 0`,
    );
  }
  redraw();

  const stopDrags = outputDots.map((h, i) =>
    makeDraggable(h, s, (p) => {
      const t = Math.max(T_MIN, Math.min(T_MAX, invX(p.x)));
      markerThetas[i] = t;
      redraw();
    }),
  );

  const slider = sliderControl(
    host,
    "λ (threshold)",
    { min: 0, max: 3, step: 0.05, value: lambda },
    (v) => {
      lambda = v;
      redraw();
    },
  );

  function playIntro() {
    return animate(
      1400,
      (eased) => {
        lambda = eased <= 0.5 ? eased * 2 * 3 : (1 - eased) * 2 * 3;
        slider.value = String(lambda);
        redraw();
      },
      () => {
        lambda = 1;
        slider.value = "1";
        redraw();
      },
      ease.inOutCubic,
    );
  }
  let introCancel = playIntro();
  replayButton(host, "▶ Replay λ sweep", () => {
    introCancel();
    introCancel = playIntro();
  });

  return () => {
    introCancel();
    stopDrags.forEach((stop) => stop());
  };
};

export function CoordinateProximalMethods() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> <strong>coordinate descent</strong> optimizes one variable at a
          time, holding every other variable fixed, cycling through all of them repeatedly — like
          solving a jigsaw puzzle by adjusting one piece at a time to its best position while
          leaving the rest untouched, then moving to the next piece.
        </p>
        <p>
          <strong>Intermediate:</strong> why would you want this instead of gradient descent?
          Because sometimes optimizing just ONE coordinate, with everything else fixed, has an easy
          closed-form solution even when the full joint problem has no such formula. That's exactly
          the situation for L1-regularized ("Lasso-style") objectives, which is why this lesson
          exists.
        </p>
        <p>
          <strong>Advanced:</strong> an L1 penalty term <code>|θⱼ|</code> is not differentiable at{" "}
          <code>θⱼ = 0</code> — it has a sharp corner there, not a smooth curve — so plain gradient
          descent's "follow the gradient downhill" recipe breaks down exactly at the most important
          point, since the whole reason to use an L1 penalty is to push many coefficients to{" "}
          <em>exactly</em> zero. The <strong>subgradient</strong> generalizes "gradient" to make
          sense at such a corner (a whole range of valid slopes instead of one specific slope), and
          the <strong>proximal operator</strong> is a clean, general way to handle a
          non-differentiable penalty by inserting a periodic shrinkage step into an otherwise
          ordinary optimization loop.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\partial|\\theta_j| = \\begin{cases}\\text{sign}(\\theta_j) & \\theta_j \\ne 0 \\\\ [-1,1] & \\theta_j = 0\\end{cases}"
          }
        </Formula>
        <Formula>
          {"\\text{soft}(\\theta, \\lambda) = \\text{sign}(\\theta)\\max(|\\theta|-\\lambda, 0)"}
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The subgradient set of the L1 penalty, and the soft-thresholding operator — the proximal
          operator of the L1 penalty — that this lesson derives below.
        </p>
      </SectionBlock>
      <Derivation title="Derivation: the Lasso coordinate update, case by case">
        <p>
          Fix every coefficient except <code>θⱼ</code> and minimize <code>½‖y − Xθ‖² + λ‖θ‖₁</code>{" "}
          with respect to <code>θⱼ</code> alone. Expanding the squared term and collecting
          everything that depends on <code>θⱼ</code>, the 1D sub-problem reduces to minimizing{" "}
          <code>½aθⱼ² − bθⱼ + λ|θⱼ|</code>, where <code>a = Σᵢ Xᵢⱼ²</code> (column j's squared norm)
          and <code>b = Σᵢ Xᵢⱼ(yᵢ − Σₖ≠ⱼ Xᵢₖθₖ)</code> (column j's correlation with the current
          partial residual — everything that depends on the OTHER, currently-fixed coefficients).
        </p>
        <p>Solve this 1D problem by cases:</p>
        <ul>
          <li>
            <strong>Case θⱼ &gt; 0:</strong> the penalty term is smooth here (<code>+λθⱼ</code>), so
            differentiate the whole thing, <code>aθⱼ − b + λ</code>, set it to zero, giving{" "}
            <code>θⱼ = (b − λ)/a</code> — valid only when this comes out positive, i.e. when{" "}
            <code>b &gt; λ</code>.
          </li>
          <li>
            <strong>Case θⱼ &lt; 0:</strong> symmetric, the penalty is <code>−λθⱼ</code> here,
            giving <code>θⱼ = (b + λ)/a</code> — valid only when <code>b &lt; −λ</code>.
          </li>
          <li>
            <strong>Case θⱼ = 0:</strong> check whether zero is already a valid subgradient solution
            — it is exactly when some value in the subgradient set <code>[−λ,λ]</code> can make the
            total (sub)gradient <code>−b + [−λ,λ]</code> contain zero, i.e. whenever{" "}
            <code>|b| ≤ λ</code>.
          </li>
        </ul>
        <p>
          These three cases combine into exactly one closed form: <code>θⱼ* = soft(b, λ)/a</code> —
          the soft-thresholding operator applied to <code>b</code>, then rescaled by{" "}
          <code>1/a</code>. Every case above is a direct instance of this single formula: it returns
          0 precisely when <code>|b| ≤ λ</code>, and the two smooth-region solutions otherwise.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this exact coordinate-wise soft-thresholding update, applied
          repeatedly across all coefficients until convergence, is literally the algorithm{" "}
          <code>sklearn.linear_model.Lasso</code> and the classical glmnet package use in production
          — coordinate descent isn't a theoretical curiosity here, it's the actual solver.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Soft-thresholding: the shrinkage operator behind Lasso"
        caption="Drag any colored marker's input position and watch where it lands after soft-thresholding. Widen λ with the slider and watch the flat 'dead zone' around zero swallow more and more markers, snapping them to exactly 0."
      >
        <DiagramHost render={renderSoftThreshold} />
      </DiagramBlock>
      <MultiCodeExample
        title="Practical example — Lasso via coordinate descent"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import numpy as np

def soft_threshold(theta, lam):
    return np.sign(theta) * np.maximum(np.abs(theta) - lam, 0)

def lasso_coordinate_descent(X, y, lam, iters=200):
    n, p = X.shape
    theta = np.zeros(p)
    col_sq = (X ** 2).sum(axis=0)
    for _ in range(iters):
        for j in range(p):
            residual = y - X @ theta + X[:, j] * theta[j]
            b = X[:, j] @ residual
            theta[j] = soft_threshold(b, lam) / col_sq[j]
    return theta

rng = np.random.default_rng(0)
n, p = 200, 12
X = rng.normal(size=(n, p))
true_theta = np.array([3.0, -2.0, 0, 0, 1.5, 0, 0, 0, 0, -1.0, 0, 0])
y = X @ true_theta + 0.3 * rng.normal(size=n)

fitted = lasso_coordinate_descent(X, y, lam=8.0)
print(np.round(fitted, 3))
# Several entries should land at exactly 0.0, matching the true zero coefficients.`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <cmath>
#include <iostream>
#include <vector>

double softThreshold(double theta, double lam) {
    double mag = std::abs(theta) - lam;
    return mag > 0 ? (theta > 0 ? 1.0 : -1.0) * mag : 0.0;
}

std::vector<double> lassoCoordinateDescent(
    const std::vector<std::vector<double>>& X,
    const std::vector<double>& y,
    double lam,
    int iters = 200
) {
    int n = X.size(), p = X[0].size();
    std::vector<double> theta(p, 0.0);
    std::vector<double> colSq(p, 0.0);
    for (int j = 0; j < p; ++j)
        for (int i = 0; i < n; ++i) colSq[j] += X[i][j] * X[i][j];

    for (int it = 0; it < iters; ++it) {
        for (int j = 0; j < p; ++j) {
            double b = 0.0;
            for (int i = 0; i < n; ++i) {
                double pred = 0.0;
                for (int k = 0; k < p; ++k) if (k != j) pred += X[i][k] * theta[k];
                b += X[i][j] * (y[i] - pred);
            }
            theta[j] = softThreshold(b, lam) / colSq[j];
        }
    }
    return theta;
}

int main() {
    // Small synthetic example with a few genuinely zero true coefficients.
    std::vector<std::vector<double>> X = {{1, 0}, {0, 1}, {1, 1}, {2, -1}};
    std::vector<double> y = {3, -2, 1, 8};
    auto theta = lassoCoordinateDescent(X, y, 1.5);
    std::cout << "theta = (" << theta[0] << ", " << theta[1] << ")\\n";
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from sklearn.linear_model import Lasso

rng = np.random.default_rng(0)
n, p = 200, 12
X = rng.normal(size=(n, p))
true_theta = np.array([3.0, -2.0, 0, 0, 1.5, 0, 0, 0, 0, -1.0, 0, 0])
y = X @ true_theta + 0.3 * rng.normal(size=n)

model = Lasso(alpha=8.0 / n)  # sklearn scales the penalty by 1/n internally
model.fit(X, y)
print(np.round(model.coef_, 3))
# sklearn solves this with the exact same coordinate-descent + soft-thresholding
# loop derived above, just implemented far more efficiently.`,
          },
        ]}
      />
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Genomics and bioinformatics</strong> — Lasso regression is a standard tool for
            automatic feature selection when there are thousands of candidate genes/markers and only
            a handful actually matter.
          </li>
          <li>
            <strong>Finance and econometrics</strong> — sparse regression is often preferred over a
            dense model specifically because knowing <em>which</em> few factors matter is as
            important as the prediction itself.
          </li>
          <li>
            <strong>Large-scale recommender system factorization</strong> — some matrix
            factorization solvers cycle through user and item factor updates in a pattern very
            similar to coordinate descent, for the same "each sub-step is cheap and exact" reason.
          </li>
          <li>
            <strong>Group Lasso and Elastic Net</strong> extend this exact soft-thresholding idea to
            structured sparsity (whole groups of coefficients pushed to zero together) and to a
            blend of L1 and L2 penalties — covered fully in a later Regression module, but built on
            precisely the machinery derived here.
          </li>
          <li>
            Coordinate descent is often <em>faster in wall-clock time</em> than gradient-based
            methods specifically for L1 problems, even though each individual step only touches one
            variable — because each step is cheap and exact rather than an approximate gradient step
            that still needs a learning rate.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Applying plain gradient descent directly to an L1-penalized objective with no special
            handling — it won't reliably produce exact zeros, which defeats the entire point of
            choosing an L1 penalty in the first place.
          </li>
          <li>
            Assuming coordinate descent's nice convergence guarantees carry over to non-convex
            problems — they're specific to convex objectives like Lasso's; the previous module's
            convexity lesson is exactly what makes this safe here.
          </li>
          <li>
            Assuming the specific soft-thresholding formula generalizes automatically to every
            non-smooth penalty — it's tailored to the L1 penalty's particular corner shape; other
            penalties (group lasso, nuclear norm) have their own, different proximal operators.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The general <strong>proximal gradient</strong> framework, of which this coordinate-wise
          soft-thresholding update is a simple special case, extends to a much broader class of
          objectives: any smooth loss plus any non-smooth-but-"simple" penalty. Many other common
          penalties have their own closed-form proximal operators — group lasso, the nuclear norm
          for low-rank matrix problems, and indicator functions of constraint sets for projected
          gradient methods — all sharing the identical pattern: take an ordinary smooth gradient
          step, then apply a shrinkage or projection operator specific to the penalty in play.
        </p>
      </ExpertNote>
      <Quiz
        q="Why does soft-thresholding produce coefficients that are exactly zero, rather than just very small, the way an L2 (ridge) penalty would?"
        a="Because the L1 penalty's subgradient at zero is an entire interval, [-λ, λ], not a single slope. Whenever the data term's pull, b, has magnitude at or below λ, zero itself is already a valid subgradient solution — the optimization has no incentive to move away from it. An L2 penalty's gradient at zero is exactly 0 with no such interval, so it always pulls coefficients toward zero proportionally but essentially never lands exactly on it for generic data."
      />
      <Takeaway>
        <p>
          Coordinate descent plus the soft-thresholding proximal operator turns an objective that
          plain gradient descent can't handle cleanly — a non-differentiable corner exactly where
          the interesting behavior (sparsity) happens — into a sequence of trivial, closed-form 1D
          updates. The next lesson extends this same "handle the hard part separately" instinct to
          constrained problems via duality.
        </p>
      </Takeaway>
    </>
  );
}
