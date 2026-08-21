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

/** Deterministic seeded PRNG (mulberry32) so the synthetic dataset below is reproducible
 *  on every load instead of reshuffling every time the component mounts. */
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

/* 2.1.4 — live polynomial regression: drag the degree slider and watch the fitted curve
 * go from too-straight (underfit) through a good fit to wiggling through every training
 * point (overfit), with real train/test MSE numbers updating alongside it. */
const renderPolyFit: DiagramRender = (host) => {
  const rng = mulberry32(1);
  const uniformIn = (lo: number, hi: number) => lo + rng() * (hi - lo);
  const gauss = () => {
    const u1 = Math.max(rng(), 1e-9);
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const trueFn = (x: number) => Math.sin(2.2 * x) + 0.3 * x;
  const SIGMA = 0.16;
  const N_TRAIN = 22;
  const N_TEST = 20;

  const xTrain = Array.from({ length: N_TRAIN }, () => uniformIn(-1, 1)).sort((a, b) => a - b);
  const yTrain = xTrain.map((x) => trueFn(x) + SIGMA * gauss());
  const xTest = Array.from({ length: N_TEST }, () => uniformIn(-0.9, 0.9)).sort((a, b) => a - b);
  const yTest = xTest.map((x) => trueFn(x) + SIGMA * gauss());

  // Build the Vandermonde-style design matrix by hand — column k is x^k.
  function designMatrix(xs: number[], degree: number) {
    return xs.map((x) => {
      const row: number[] = [];
      let p = 1;
      for (let k = 0; k <= degree; k++) {
        row.push(p);
        p *= x;
      }
      return row;
    });
  }

  // Solve the normal equations (XᵗX) beta = Xᵗy via Gaussian elimination with partial
  // pivoting — the same closed-form least-squares solve used in the code examples below.
  function solveNormalEquations(X: number[][], y: number[]) {
    const p = X[0].length;
    const XtX = Array.from({ length: p }, () => new Array(p).fill(0));
    const Xty = new Array(p).fill(0);
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        let sum = 0;
        for (let r = 0; r < X.length; r++) sum += X[r][i] * X[r][j];
        XtX[i][j] = sum;
      }
      XtX[i][i] += 1e-6; // tiny ridge for numerical stability only — not a regularizer
      let sum = 0;
      for (let r = 0; r < X.length; r++) sum += X[r][i] * y[r];
      Xty[i] = sum;
    }
    const A = XtX.map((row) => row.slice());
    const b = Xty.slice();
    for (let col = 0; col < p; col++) {
      let piv = col;
      for (let r = col + 1; r < p; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      [A[col], A[piv]] = [A[piv], A[col]];
      [b[col], b[piv]] = [b[piv], b[col]];
      const d = A[col][col] || 1e-12;
      for (let r = col + 1; r < p; r++) {
        const f = A[r][col] / d;
        for (let c = col; c < p; c++) A[r][c] -= f * A[col][c];
        b[r] -= f * b[col];
      }
    }
    const beta = new Array(p).fill(0);
    for (let r = p - 1; r >= 0; r--) {
      let sum = b[r];
      for (let c = r + 1; c < p; c++) sum -= A[r][c] * beta[c];
      beta[r] = sum / (A[r][r] || 1e-12);
    }
    return beta;
  }

  function evalPoly(beta: number[], x: number) {
    let sum = 0;
    let p = 1;
    for (let k = 0; k < beta.length; k++) {
      sum += beta[k] * p;
      p *= x;
    }
    return sum;
  }
  function meanSquaredError(beta: number[], xs: number[], ys: number[]) {
    let sum = 0;
    for (let i = 0; i < xs.length; i++) {
      const e = evalPoly(beta, xs[i]) - ys[i];
      sum += e * e;
    }
    return sum / xs.length;
  }

  const X_MIN = -1.05,
    X_MAX = 1.05,
    Y_MIN = -2.3,
    Y_MAX = 2.3;
  const PX0 = 46,
    PX1 = 404,
    PY0 = 244,
    PY1 = 24;
  const mapX = (x: number) => PX0 + ((x - X_MIN) / (X_MAX - X_MIN)) * (PX1 - PX0);
  const mapY = (y: number) => PY0 + ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (PY1 - PY0);

  const s = svg("0 0 450 270");
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

  let truePath = "";
  for (let i = 0; i <= 100; i++) {
    const x = X_MIN + (i / 100) * (X_MAX - X_MIN);
    truePath += `${i === 0 ? "M" : "L"}${mapX(x).toFixed(1)},${mapY(trueFn(x)).toFixed(1)} `;
  }
  s.appendChild(
    el("path", {
      d: truePath,
      fill: "none",
      stroke: "#9aa0b8",
      "stroke-width": 1.5,
      "stroke-dasharray": "4,3",
      opacity: 0.85,
    }),
  );

  const fitted = el("path", { d: "", fill: "none", stroke: "#8b2fc9", "stroke-width": 2.75 });
  s.appendChild(fitted);

  xTrain.forEach((x, i) => {
    s.appendChild(el("circle", { cx: mapX(x), cy: mapY(yTrain[i]), r: 3.4, fill: "#4f5fe0" }));
  });
  xTest.forEach((x, i) => {
    s.appendChild(
      el("circle", {
        cx: mapX(x),
        cy: mapY(yTest[i]),
        r: 3.4,
        fill: "none",
        stroke: "#b8720c",
        "stroke-width": 1.8,
      }),
    );
  });

  host.appendChild(s);
  const out = readout(host, "");

  function regimeLabel(degree: number) {
    if (degree <= 2) return "underfitting";
    if (degree <= 5) return "good fit";
    return "overfitting";
  }

  function draw(degree: number) {
    const X = designMatrix(xTrain, degree);
    const beta = solveNormalEquations(X, yTrain);
    const trainMse = meanSquaredError(beta, xTrain, yTrain);
    const testMse = meanSquaredError(beta, xTest, yTest);

    let d = "";
    for (let i = 0; i <= 140; i++) {
      const x = X_MIN + (i / 140) * (X_MAX - X_MIN);
      const y = evalPoly(beta, x);
      d += `${i === 0 ? "M" : "L"}${mapX(x).toFixed(1)},${mapY(y).toFixed(1)} `;
    }
    fitted.setAttribute("d", d);

    out.set(
      `Degree ${degree} (${regimeLabel(degree)})  ·  train MSE = ${trainMse.toFixed(3)}   test MSE = ${testMse.toFixed(3)}`,
    );
  }

  draw(1);
  const slider = sliderControl(
    host,
    "Polynomial degree",
    { min: 1, max: 15, step: 1, value: 1 },
    (v) => draw(v),
  );

  // --- Autoplay intro: sweep the degree from 1 up to 15 (underfit -> good fit -> overfit)
  // and then settle back down to a sensible resting degree, refitting and redrawing at
  // every intermediate integer step so the train/test MSE readout updates continuously
  // rather than jumping straight from the start value to the end value.
  let lastDrawnDegree = -1;
  let cancelAnim: (() => void) | null = null;
  const REST_DEGREE = 5;

  function drawIfChanged(rawDegree: number) {
    const degree = Math.round(rawDegree);
    if (degree === lastDrawnDegree) return;
    lastDrawnDegree = degree;
    draw(degree);
    slider.value = String(degree);
  }

  function playIntro() {
    if (cancelAnim) cancelAnim();
    slider.disabled = true;
    lastDrawnDegree = -1;
    // Leg 1: 1 -> 15 at a steady pace (~130ms per integer step) so every degree along
    // the way is visibly fit and drawn, evenly spaced — a linear ease keeps the step
    // timing uniform rather than bunching steps at either end.
    cancelAnim = animate(
      14 * 130,
      (t) => drawIfChanged(1 + t * 14),
      () => {
        // Leg 2: 15 -> REST_DEGREE, decelerating into its resting value.
        cancelAnim = animate(
          850,
          (eased) => drawIfChanged(15 - eased * (15 - REST_DEGREE)),
          () => {
            cancelAnim = null;
            slider.disabled = false;
          },
          ease.inOutCubic,
        );
      },
      ease.linear,
    );
  }

  playIntro();
  replayButton(host, "↻ Replay intro animation", playIntro);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    'Dashed grey = the true underlying curve (unknown to the learner) · filled blue dots = training points · open amber rings = held-out test points · solid purple = the fitted polynomial. The intro plays automatically once — sweeping the purple curve from too-straight, through a good fit, to wiggling through every training dot, then settling at a sensible starting degree — after which the slider is yours to drag freely; use "Replay intro animation" to watch the sweep again any time.';
  host.appendChild(hint);

  return () => {
    if (cancelAnim) cancelAnim();
  };
};

export function OverfittingUnderfittingCapacity() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> an <strong>underfit</strong> model is too simple to capture the
          real pattern in the data — it does badly on the training data <em>and</em> on new data,
          because it never learned the pattern in the first place (think: fitting a straight line to
          something that's obviously curved). An <strong>overfit</strong> model is the opposite
          problem — it's flexible enough to memorize the training data almost perfectly, including
          its noise and one-off quirks, so it looks fantastic on the data it was trained on and then
          falls apart on anything new. Both are failures to generalize; they just fail in opposite
          directions.
        </p>
        <p>
          <strong>Intermediate:</strong> the underlying dial being turned here is{" "}
          <strong>capacity</strong> — an informal but useful notion of how flexible or expressive a
          hypothesis class is. A straight line has low capacity: it can only ever represent one
          shape (a line). A 20th-degree polynomial has enormous capacity: with 21 free coefficients
          it can bend and twist through almost any scatter of points you hand it. Plot test error
          against capacity and, classically, you get a <strong>U-shape</strong>: too little capacity
          and the model can't represent the true pattern (underfitting, high <em>bias</em>); too
          much capacity and the model represents the training noise as if it were signal
          (overfitting, high <em>variance</em>). The bottom of the U is the capacity that actually
          matches the complexity of the true underlying relationship.
        </p>
        <p>
          <strong>A concrete walk-through:</strong> pick one specific training point — say the one
          sitting at <code>x = 0.4</code> in the diagram below, with its noisy observed value{" "}
          <code>y = trueFn(0.4) + noise</code>. At degree 1, the fitted line has nowhere near enough
          freedom to pass through that point exactly; it settles somewhere in the middle of the
          whole scatter, so this point contributes a real, nonzero residual to the training error —
          but the line's value near <code>x = 0.4</code> is also close to the *true* curve's value
          there, because a low-degree fit is forced to average out this one point's noise together
          with all the others. Now push the degree up. Somewhere around degree 14–15 — enough free
          coefficients to satisfy every one of the 22 training points as an individual constraint —
          the curve bends specifically so it passes through <code>(0.4, y)</code> almost exactly,
          driving that point's training residual to (near) zero. That looks like a win in the
          training-error column. But look at what the curve had to do to get there: forcing it
          through this point's specific noisy value, and through every neighboring point's specific
          noisy value too, means the curve has to oscillate sharply between them (a Runge's
          phenomenon–style wiggle) rather than following the smooth true trend. So evaluate that
          same high-degree curve at a nearby <em>unseen</em> test input, say <code>x = 0.41</code>,
          and it is often far from <code>trueFn(0.41)</code> — sometimes worse than the low-degree
          line was. The model didn't get better at predicting near <code>x = 0.4</code>; it got
          better at reproducing one sample's specific noise, at the direct expense of everywhere
          nearby. That trade — training residual at a point down to zero, error at neighboring
          unseen points up — is overfitting happening at the resolution of a single data point, and
          it's exactly what the diagram's slider lets you watch happen in aggregate across all 22
          training points at once.
        </p>
        <p>
          <strong>Advanced:</strong> that clean U-shape was, for decades, treated as the whole story
          — until modern heavily over-parameterized models (deep neural networks with far more
          weights than training examples) started breaking it. Push capacity <em>past</em> the point
          where the model can perfectly fit every training point, and test error does first rise,
          exactly as the classical picture predicts — but then, past a certain point, it can start{" "}
          <em>falling again</em>, producing a second dip at extremely high capacity. This is{" "}
          <strong>double descent</strong>, and it is genuinely still an active area of research, not
          a settled textbook fact. The leading intuition (not a proof) is that once a model has more
          than enough capacity to interpolate the training data exactly, the specific solution the
          optimizer actually lands on — out of the infinitely many that fit the training data
          perfectly — matters. Gradient descent on very wide networks tends to land on comparatively
          smooth, low-norm interpolating solutions rather than wild ones, which behaves like an
          implicit form of regularization the classical bias-variance story never accounted for.
        </p>
        <p>
          <strong>Why the second descent doesn't actually contradict the classical picture</strong>{" "}
          for the models this module is about: the classical U-shape derivation (worked through in
          full in the Derivation section below) leans on <code>H = X(XᵗX)⁻¹Xᵗ</code> being a genuine
          rank-<code>p</code> projection, which requires <code>XᵗX</code> to be invertible — and
          that in turn requires <code>p ≤ n</code>, more data rows than fitted parameters. Every
          classical model this course treats — bounded-degree polynomial regression, decision trees
          at any depth that still leaves multiple training rows per leaf, k-nearest-neighbors,
          standard kernel machines at ordinary capacity — lives comfortably inside{" "}
          <code>p ≤ n</code>, and inside that regime the U-shape isn't just a rule of thumb, it's
          the direct consequence of a theorem with those exact assumptions. Double descent's second
          dip only shows up once <code>p</code> is pushed <em>past</em> <code>n</code> — at which
          point <code>XᵗX</code> is singular by construction (more unknowns than equations), so "the
          OLS estimator" as this derivation defines it no longer exists; what a modern
          over-parameterized network's training procedure actually produces is a{" "}
          <em>different mathematical object</em> — informally, a minimum-norm solution selected out
          of an entire subspace of parameter settings that all fit the training data exactly, chosen
          implicitly by how gradient descent moves through that subspace. So the second descent
          isn't the classical theorem being violated; it's a statement about a regime (
          <code>p {">"} n</code>, with a different estimator entirely) that the theorem's own
          assumptions simply don't cover in the first place — the two pictures describe two
          different objects, not one theory correcting another.
        </p>
      </SectionBlock>

      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"\\text{Gap}(f) \\;=\\; R(f) - \\hat{R}(f)"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          <code>R(f)</code> is the true (generalization) risk — the expected loss over the entire
          data-generating distribution, most of which you will never actually see. <code>R̂(f)</code>{" "}
          is the empirical risk — the average loss measured on some finite sample. When that sample
          is the training set itself, this gap is exactly what the Derivation below shows is
          optimistically biased toward zero. A <strong>learning curve</strong> plots training and
          test error side by side, as a function of either training-set size or capacity:
        </p>
        <Formula>
          {
            "\\hat{R}_{\\text{train}}(n), \\ \\hat{R}_{\\text{test}}(n) \\qquad \\text{or} \\qquad \\hat{R}_{\\text{train}}(c), \\ \\hat{R}_{\\text{test}}(c)"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          where <code>n</code> is the number of training examples and <code>c</code> is model
          capacity (e.g. polynomial degree, tree depth, number of parameters). Reading these two
          curves against each other — not either one alone — is the entire diagnostic toolkit behind
          "is my model underfitting or overfitting."
        </p>
      </SectionBlock>

      <Derivation
        id="derivation"
        title="Derivation: why training error is an optimistically biased estimate of true risk"
      >
        <p>
          Take the cleanest case where this can be worked out exactly: a linear model fit by
          ordinary least squares. Assume the true relationship is linear in <code>p</code>{" "}
          parameters plus independent noise of variance <code>σ²</code>:
        </p>
        <Formula>
          {
            "y = X\\beta + \\varepsilon, \\qquad \\mathbb{E}[\\varepsilon] = 0,\\ \\ \\text{Var}(\\varepsilon) = \\sigma^2 I"
          }
        </Formula>
        <p>
          where <code>X</code> is an <code>n×p</code> design matrix (<code>n</code> training rows,{" "}
          <code>p</code> fitted parameters). The OLS fit is a <strong>projection</strong>: writing{" "}
          <code>H = X(XᵗX)⁻¹Xᵗ</code> (briefly: this is the matrix that projects any vector onto the{" "}
          <code>p</code>-dimensional column space of <code>X</code> — the same kind of projection
          operator the Linear Algebra chapter builds up when it discusses orthogonal projections and
          the SVD), the fitted values and residuals are:
        </p>
        <Formula>{"\\hat{y} = X\\hat\\beta = Hy, \\qquad e = y - \\hat{y} = (I-H)y"}</Formula>
        <p>
          Because <code>H</code> projects onto the column space of <code>X</code>, and{" "}
          <code>Xβ</code> already lives entirely inside that column space, applying <code>H</code>{" "}
          to it changes nothing — so <code>(I−H)Xβ = 0</code>. Substituting <code>y = Xβ + ε</code>{" "}
          into the residual expression, the entire <code>Xβ</code> term cancels and only the noise
          survives:
        </p>
        <Formula>{"e = (I-H)(X\\beta + \\varepsilon) = (I-H)\\varepsilon"}</Formula>
        <p>
          The residuals are <em>exactly</em> the true noise, projected onto the <code>(n−p)</code>
          -dimensional space left over once the <code>p</code>-dimensional column space of{" "}
          <code>X</code> is removed — the orthogonal complement of what the model was allowed to
          fit. The residual sum of squares is then a quadratic form in that noise:
        </p>
        <Formula>
          {
            "\\text{RSS} = e^\\top e = \\varepsilon^\\top (I-H)^\\top(I-H)\\,\\varepsilon = \\varepsilon^\\top (I-H)\\,\\varepsilon"
          }
        </Formula>
        <p>
          (using that <code>I−H</code> is idempotent and symmetric, i.e. a genuine projection
          matrix, so <code>(I−H)ᵗ(I−H) = (I−H)</code>). Taking the expectation of a quadratic form
          in zero-mean noise with covariance <code>σ²I</code> gives <code>σ²·tr(I−H)</code>. A
          projection matrix's eigenvalues are only ever <code>0</code> or <code>1</code>, so its
          trace equals its rank — and <code>H</code> has rank exactly <code>p</code>, the dimension
          of the space it projects onto. So <code>tr(I−H) = n−p</code>, and:
        </p>
        <Formula>
          {
            "\\mathbb{E}[\\text{RSS}] = \\sigma^2(n-p) \\qquad\\Longrightarrow\\qquad \\mathbb{E}\\!\\left[\\frac{\\text{RSS}}{n}\\right] = \\sigma^2\\!\\left(1-\\frac{p}{n}\\right)"
          }
        </Formula>
        <p>
          That's the phenomenon in its purest form: the average squared training residual{" "}
          <em>underestimates</em> the true noise variance <code>σ²</code> by a factor of exactly{" "}
          <code>(1 − p/n)</code>. Push <code>p</code> toward <code>n</code> — as many parameters as
          data points — and the training error can be driven to (almost) zero even though the model
          has learned nothing beyond memorizing the specific noise realized in this one sample; a
          fresh sample would show the same σ² all over again, unimproved.
        </p>
        <p>
          This same degrees-of-freedom logic extends (cited here rather than re-derived in full,
          since it holds for any estimator that is linear in <code>y</code>, not only OLS) to the
          classical <strong>"optimism of the training error"</strong> theorem: the expected gap
          between true risk and training risk for such an estimator is
        </p>
        <Formula>
          {
            "\\mathbb{E}[\\hat{R}_{\\text{train}}] = \\mathbb{E}[\\hat{R}_{\\text{true}}] - \\frac{2\\sigma^2 p}{n}"
          }
        </Formula>
        <p>
          — training error is optimistic by an amount that grows linearly in <code>p/n</code>, the
          same ratio driving the RSS result above (the constant differs, <code>2</code> versus{" "}
          <code>1</code>, because this version measures a covariance between the fit and the data
          used to produce it, rather than a plain residual variance — but the mechanism, "each extra
          parameter is one more degree of freedom to bend toward this sample's specific noise," is
          identical). This exact quantity, <code>2σ²p/n</code>, is what Mallow's <code>Cₚ</code> and
          Akaike's Information Criterion add back on top of the training score to correct for it — a
          connection developed fully in the later Model Evaluation module, without needing to
          re-derive it here.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is precisely why held-out validation sets and
          cross-validation exist at all — for anything beyond a simple linear-in-<code>y</code>{" "}
          estimator, <code>p</code> (the "effective" number of parameters) isn't even well-defined,
          so there is no formula left to correct the training score with; the only universally valid
          fix is to measure risk on data the fitting procedure never touched. And it's why
          information criteria are built the way they are: take the (optimistic) training likelihood
          or RSS, then explicitly subtract a penalty proportional to model complexity — exactly
          undoing the bias this derivation quantifies.
        </p>
      </Derivation>

      <DiagramBlock
        id="diagram"
        title="Watch underfitting turn into overfitting as capacity grows"
        caption="Watch the intro play automatically once — degree sweeping from 1 up to 15 and settling back to 5 — then drag the polynomial-degree slider yourself: the purple fitted curve straightens out at low degree (underfitting) and starts wiggling through every training dot at high degree (overfitting), while the train/test MSE readout above tracks exactly what's happening numerically."
      >
        <DiagramHost render={renderPolyFit} />
      </DiagramBlock>

      <MultiCodeExample
        id="practical"
        title="Practical example — the same train/test-vs-degree experiment, three ways"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import numpy as np

rng = np.random.default_rng(0)

# True underlying function: a smooth curve plus independent Gaussian noise.
def true_fn(x):
    return np.sin(2.2 * x) + 0.3 * x

n = 60
x = rng.uniform(-1, 1, size=n)
y = true_fn(x) + 0.16 * rng.standard_normal(n)

# Manual train/test split -- no sklearn involved.
idx = rng.permutation(n)
split = int(0.7 * n)
train_idx, test_idx = idx[:split], idx[split:]
x_train, y_train = x[train_idx], y[train_idx]
x_test, y_test = x[test_idx], y[test_idx]

def design_matrix(x_vals, degree):
    # Vandermonde-style design matrix: columns are x^0, x^1, ..., x^degree.
    return np.column_stack([x_vals ** k for k in range(degree + 1)])

def fit_and_score(degree):
    X_train = design_matrix(x_train, degree)
    X_test = design_matrix(x_test, degree)
    # Normal equations: (X^T X) beta = X^T y. A tiny ridge keeps this solvable
    # even once X^T X becomes nearly singular at high degree.
    XtX = X_train.T @ X_train + 1e-8 * np.eye(degree + 1)
    Xty = X_train.T @ y_train
    beta = np.linalg.solve(XtX, Xty)

    train_pred = X_train @ beta
    test_pred = X_test @ beta
    train_mse = np.mean((train_pred - y_train) ** 2)
    test_mse = np.mean((test_pred - y_test) ** 2)
    return train_mse, test_mse

print(f"{'degree':>6} {'train MSE':>12} {'test MSE':>12}")
for degree in range(1, 16):
    train_mse, test_mse = fit_and_score(degree)
    print(f"{degree:>6} {train_mse:>12.4f} {test_mse:>12.4f}")

# Train MSE falls almost monotonically -- more parameters can only fit the
# training points better. Test MSE falls, bottoms out near the true curve's
# real complexity, then climbs back up: underfit -> good fit -> overfit,
# read directly off the printed table.`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <bits/stdc++.h>
using namespace std;

// Simple deterministic PRNG so the experiment is reproducible run to run.
struct Rng {
    uint64_t state;
    explicit Rng(uint64_t seed) : state(seed) {}
    double next() {
        state = state * 6364136223846793005ULL + 1442695040888963407ULL;
        uint32_t xorshifted = (uint32_t)(((state >> 18u) ^ state) >> 27u);
        uint32_t rot = (uint32_t)(state >> 59u);
        uint32_t out = (xorshifted >> rot) | (xorshifted << ((32 - rot) & 31));
        return (double)out / 4294967295.0;
    }
    double uniform(double lo, double hi) { return lo + next() * (hi - lo); }
    double gaussian() {
        double u1 = max(next(), 1e-12), u2 = next();
        return sqrt(-2.0 * log(u1)) * cos(2.0 * M_PI * u2);
    }
};

double trueFn(double x) { return sin(2.2 * x) + 0.3 * x; }

// Build the Vandermonde-style design matrix by hand -- column k is x^k.
vector<vector<double>> designMatrix(const vector<double>& xs, int degree) {
    vector<vector<double>> X(xs.size(), vector<double>(degree + 1));
    for (size_t i = 0; i < xs.size(); i++) {
        double p = 1.0;
        for (int k = 0; k <= degree; k++) { X[i][k] = p; p *= xs[i]; }
    }
    return X;
}

// Solve A * beta = b via Gaussian elimination with partial pivoting --
// no external linear-algebra library.
vector<double> solveLinear(vector<vector<double>> A, vector<double> b) {
    int n = (int)b.size();
    for (int col = 0; col < n; col++) {
        int pivot = col;
        for (int r = col + 1; r < n; r++)
            if (fabs(A[r][col]) > fabs(A[pivot][col])) pivot = r;
        swap(A[col], A[pivot]);
        swap(b[col], b[pivot]);
        double d = fabs(A[col][col]) < 1e-12 ? 1e-12 : A[col][col];
        for (int r = col + 1; r < n; r++) {
            double f = A[r][col] / d;
            for (int c = col; c < n; c++) A[r][c] -= f * A[col][c];
            b[r] -= f * b[col];
        }
    }
    vector<double> x(n);
    for (int r = n - 1; r >= 0; r--) {
        double sum = b[r];
        for (int c = r + 1; c < n; c++) sum -= A[r][c] * x[c];
        x[r] = sum / A[r][r];
    }
    return x;
}

double mse(const vector<double>& beta, const vector<double>& xs, const vector<double>& ys) {
    double total = 0.0;
    for (size_t i = 0; i < xs.size(); i++) {
        double pred = 0.0, p = 1.0;
        for (double c : beta) { pred += c * p; p *= xs[i]; }
        double err = pred - ys[i];
        total += err * err;
    }
    return total / xs.size();
}

int main() {
    Rng rng(12345);
    int n = 60;
    vector<double> x(n), y(n);
    for (int i = 0; i < n; i++) {
        x[i] = rng.uniform(-1.0, 1.0);
        y[i] = trueFn(x[i]) + 0.16 * rng.gaussian();
    }

    int split = (int)(0.7 * n);
    vector<double> xTrain(x.begin(), x.begin() + split), yTrain(y.begin(), y.begin() + split);
    vector<double> xTest(x.begin() + split, x.end()), yTest(y.begin() + split, y.end());

    cout << setw(8) << "degree" << setw(14) << "train MSE" << setw(14) << "test MSE" << "\\n";
    for (int degree = 1; degree <= 15; degree++) {
        auto X = designMatrix(xTrain, degree);
        int p = degree + 1;

        // Normal equations: (X^T X) beta = X^T y, with a tiny ridge for numerical safety.
        vector<vector<double>> XtX(p, vector<double>(p, 0.0));
        vector<double> Xty(p, 0.0);
        for (int i = 0; i < p; i++) {
            for (int j = 0; j < p; j++)
                for (size_t r = 0; r < xTrain.size(); r++) XtX[i][j] += X[r][i] * X[r][j];
            XtX[i][i] += 1e-8;
            for (size_t r = 0; r < xTrain.size(); r++) Xty[i] += X[r][i] * yTrain[r];
        }

        vector<double> beta = solveLinear(XtX, Xty);
        double trainMse = mse(beta, xTrain, yTrain);
        double testMse = mse(beta, xTest, yTest);
        cout << setw(8) << degree << setw(14) << trainMse << setw(14) << testMse << "\\n";
    }
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

rng = np.random.default_rng(0)

def true_fn(x):
    return np.sin(2.2 * x) + 0.3 * x

n = 60
x = rng.uniform(-1, 1, size=n)
y = true_fn(x) + 0.16 * rng.standard_normal(n)

x_train, x_test, y_train, y_test = train_test_split(
    x.reshape(-1, 1), y, test_size=0.3, random_state=0
)

print(f"{'degree':>6} {'train MSE':>12} {'test MSE':>12}")
for degree in range(1, 16):
    poly = PolynomialFeatures(degree=degree, include_bias=True)
    X_train = poly.fit_transform(x_train)
    X_test = poly.transform(x_test)

    model = LinearRegression(fit_intercept=False)  # bias column already added above
    model.fit(X_train, y_train)

    train_mse = mean_squared_error(y_train, model.predict(X_train))
    test_mse = mean_squared_error(y_test, model.predict(X_test))
    print(f"{degree:>6} {train_mse:>12.4f} {test_mse:>12.4f}")

# Same underfit -> sweet spot -> overfit table, in a dozen lines. PolynomialFeatures
# builds the Vandermonde-style design matrix; LinearRegression solves the same normal
# equations via a numerically stable least-squares routine instead of literal matrix
# inversion -- the idea is identical, only the plumbing is production-hardened.`,
          },
        ]}
      />

      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>A deep, unpruned decision tree on a small tabular dataset</strong> is the
            textbook overfitting machine — grown deep enough, it creates a leaf for nearly every
            training row, achieving near-zero training error by essentially memorizing the training
            set row by row. On a dataset with a few hundred rows and a dozen features this happens
            fast, which is exactly why gradient-boosted-tree libraries default to shallow trees
            (depth 3–8) and why random forests average many such overfit trees together rather than
            trusting any single deep one.
          </li>
          <li>
            <strong>A linear model fit to non-linear physics</strong> — trying to predict, say,
            projectile trajectories (genuinely quadratic in time) with a straight-line model — is
            the textbook underfitting case: no amount of more training data fixes it, because the
            hypothesis class itself cannot represent the true relationship. More rows just make the
            "best possible straight line" a more precisely wrong line.
          </li>
          <li>
            <strong>High-degree polynomial fits to noisy sensor or calibration data</strong> — a
            classic trap in instrumentation and metrology. Given a scatter of noisy thermocouple or
            pressure-sensor readings, fitting a degree-10+ polynomial "because it hugs the data
            points more closely" produces a curve that oscillates wildly between calibration points
            (the same Runge's-phenomenon wiggle the diagram above shows directly) — a sensor
            calibrated this way can read badly wrong at input values just slightly off from the
            calibration points, which is why calibration curves in practice use low-degree
            polynomials or piecewise splines instead.
          </li>
          <li>
            <strong>
              <code>k</code>-nearest-neighbors with <code>k = 1</code>
            </strong>{" "}
            is the cleanest possible illustration of maximal variance: the "model" is just "predict
            whatever the single closest training point says," so the decision boundary bends around
            every individual training point, including mislabeled or noisy ones, with zero
            smoothing. Training error is essentially zero (every training point is its own nearest
            neighbor), while test error is typically much higher — increasing <code>k</code> is,
            concretely, turning the same capacity dial this whole lesson is about.
          </li>
          <li>
            <strong>Watching the validation-loss curve during training</strong> is the day-to-day
            practical ritual built directly on this lesson's learning-curve idea, and it isn't
            unique to neural networks — gradient-boosted trees, matrix factorization models, and
            iterative solvers of all kinds get monitored the same way. Training loss keeps falling
            essentially by construction; the moment the validation curve stops falling and turns
            upward while training loss keeps dropping, that inflection point <em>is</em> the
            U-shape's minimum being crossed in real time, made visible on a plot instead of derived
            on paper. Early stopping is simply the automated version of this: freeze the model's
            weights at that inflection point rather than continuing to optimize toward zero training
            loss.
          </li>
          <li>
            <strong>Double descent in modern, heavily over-parameterized deep networks</strong> is
            the one place the classical U-shape story genuinely needs revision, not just careful
            interpretation. These networks routinely have far more weights than training examples
            and still generalize well in practice — the real-world observation that motivated double
            descent research in the first place, since the classical story alone predicts they
            should overfit catastrophically once capacity crosses the interpolation threshold, and
            mostly they don't. As the Advanced note above and the Expert note below both stress,
            this isn't the classical theorem being wrong — it's a different, much higher-capacity
            regime that the classical derivation's own assumptions never covered.
          </li>
        </ul>
      </SectionBlock>

      <Pitfall>
        <ul>
          <li>
            Judging a model by its training error alone. Training error can only ever go down (or
            stay flat) as capacity increases — it tells you nothing about generalization by itself,
            which is exactly what the Derivation above quantifies.
          </li>
          <li>
            Assuming "more capacity always means more overfitting." Regularization, early stopping,
            and the implicit bias of the optimizer itself can all keep a high-capacity model
            well-behaved — capacity is a ceiling on what a model <em>could</em> do, not a prediction
            of what it <em>will</em> do.
          </li>
          <li>
            Treating double descent as replacing the classical U-shaped curve everywhere. For most
            classical, non-deep-learning models (linear/polynomial regression, decision trees,
            standard kernel methods at moderate capacity) the classical U-shape is still the right
            mental model in practice — the double-descent wrinkle mainly matters in the heavily
            over-parameterized regime that deep learning operates in.
          </li>
        </ul>
      </Pitfall>

      <ExpertNote>
        <p>
          The point where test error peaks in a double-descent curve tends to sit right at the{" "}
          <strong>interpolation threshold</strong> — the exact capacity at which the model has just
          enough parameters to fit every training point perfectly (zero training error) for the
          first time. Just below that threshold, small changes in the training data can swing the
          fit wildly (classic high variance). Just above it, there are suddenly many different
          parameter settings that all achieve zero training error, and gradient-based optimizers
          empirically tend to land on a comparatively simple one among them — informally, something
          close to the <em>minimum-norm</em> interpolating solution — which behaves like an implicit
          regularizer nobody explicitly asked for.
        </p>
        <p>
          Be honest with yourself about how settled this is: there is real theory for specific,
          simplified cases (linear regression in certain over-parameterized regimes, some kernel
          methods), and there is a large body of empirical observation in deep networks, but a
          complete, general theory of why and exactly when the second descent occurs is still being
          actively worked out. Treat the mechanism described here as the current best intuition, not
          a settled theorem.
        </p>
      </ExpertNote>

      <Quiz
        q="Model A has 10 parameters and 0.20 training error. Model B has 10,000 parameters and 0.01 training error, trained on the same dataset. Which model is guaranteed to have lower test error?"
        a="Neither — training error alone never determines test error, which is exactly what this lesson's derivation formalizes: more parameters relative to sample size makes the training error more optimistically biased, not more trustworthy. Model B's lower training error could mean it genuinely captured more real structure, or it could mean it's simply overfitting harder (p/n is far larger for B). The only way to actually compare them is to measure both on a held-out set neither model was fit on — and even then, if B is heavily over-parameterized, its held-out error should be interpreted with the double-descent picture in mind rather than the classical U-shape alone."
      />

      <Takeaway>
        <p>
          Training error is not a measurement of how good your model is — it's a biased, optimistic
          proxy that gets more optimistic the more capacity you add relative to your sample size,
          which is precisely why held-out data is non-negotiable. The classical underfit-to-overfit
          U-shape is still the right default mental model for nearly everything you'll build; keep
          double descent in your back pocket as the honest caveat for the heavily over-parameterized
          regime, not as a reason to distrust the U-shape everywhere else.
        </p>
      </Takeaway>
    </>
  );
}
