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
  sliderControl,
  readout,
  animate,
  ease,
  replayButton,
} from "@/lib/diagram-helpers";
import type { DiagramRender } from "@/components/docs/diagram-host";

const fmt = (n: number) => (Math.round(n * 1000) / 1000).toString();

/** Toy closed-form curves: bias^2 falls, variance rises, and their sum (plus a fixed
 *  noise floor) traces a U-shape with an interior minimum — exactly the classical
 *  bias-variance picture, without needing a full simulation to draw it. */
const BIAS_SCALE = 9; // bias^2(c) = BIAS_SCALE / c^2
const VAR_SCALE = 0.05; // variance(c) = VAR_SCALE * c^2
const NOISE_FLOOR = 0.3; // sigma^2, a flat floor independent of c

function bias2(c: number) {
  return BIAS_SCALE / (c * c);
}
function variance(c: number) {
  return VAR_SCALE * c * c;
}
function total(c: number) {
  return bias2(c) + variance(c) + NOISE_FLOOR;
}

/** Exact interior minimizer of total(c) for the toy curves above — shared between the
 *  diagram (where it's the animated settling point) and the prose (where it's quoted). */
const CSTAR = Math.pow(BIAS_SCALE / VAR_SCALE, 0.25);

const BIAS_COLOR = "#4f5fe0";
const VAR_COLOR = "#b8720c";
const TOTAL_COLOR = "#1f8a5f";

const renderBiasVarianceCurve: DiagramRender = (host) => {
  const plotLeft = 46,
    plotRight = 400,
    plotTop = 18,
    plotBottom = 202;
  const cMin = 1,
    cMax = 10,
    yMax = 10;

  const cStar = CSTAR; // exact interior minimizer, shared with the plain-English section above

  const x = (c: number) => plotLeft + ((c - cMin) / (cMax - cMin)) * (plotRight - plotLeft);
  const y = (v: number) => plotBottom - (Math.min(v, yMax) / yMax) * (plotBottom - plotTop);

  const s = svg("0 0 420 232");

  // Light horizontal gridlines at error = 0, 2.5, 5, 7.5, 10
  for (let v = 0; v <= yMax; v += 2.5) {
    s.appendChild(
      el("line", {
        x1: plotLeft,
        y1: y(v),
        x2: plotRight,
        y2: y(v),
        stroke: "#e5e7eb",
        "stroke-width": 1,
        "stroke-dasharray": v === 0 ? "0" : "3,3",
      }),
    );
  }
  // Axes
  s.appendChild(
    el("line", {
      x1: plotLeft,
      y1: plotBottom,
      x2: plotRight,
      y2: plotBottom,
      stroke: "#9ca3af",
      "stroke-width": 1.5,
    }),
  );
  s.appendChild(
    el("line", {
      x1: plotLeft,
      y1: plotTop,
      x2: plotLeft,
      y2: plotBottom,
      stroke: "#9ca3af",
      "stroke-width": 1.5,
    }),
  );

  // Dotted guide down to the true optimum on the total curve, plus a hollow ring marker
  s.appendChild(
    el("line", {
      x1: x(cStar),
      y1: plotTop,
      x2: x(cStar),
      y2: plotBottom,
      stroke: "#9ca3af",
      "stroke-width": 1,
      "stroke-dasharray": "2,3",
    }),
  );

  // The three curves, sampled densely across the complexity axis
  function pathFor(fn: (c: number) => number) {
    const steps = 80;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const c = cMin + (i / steps) * (cMax - cMin);
      const p = `${x(c)},${y(fn(c))}`;
      d += i === 0 ? `M${p}` : ` L${p}`;
    }
    return d;
  }
  s.appendChild(
    el("path", { d: pathFor(bias2), fill: "none", stroke: BIAS_COLOR, "stroke-width": 2.5 }),
  );
  s.appendChild(
    el("path", { d: pathFor(variance), fill: "none", stroke: VAR_COLOR, "stroke-width": 2.5 }),
  );
  s.appendChild(
    el("path", { d: pathFor(total), fill: "none", stroke: TOTAL_COLOR, "stroke-width": 3.5 }),
  );

  const optRing = el("circle", {
    cx: x(cStar),
    cy: y(total(cStar)),
    r: 6,
    fill: "white",
    stroke: "#111827",
    "stroke-width": 2,
  });
  s.appendChild(optRing);

  // Movable vertical marker at the current slider position, on top of everything
  const marker = el("line", {
    x1: x(2),
    y1: plotTop,
    x2: x(2),
    y2: plotBottom,
    stroke: "#111827",
    "stroke-width": 1.25,
    "stroke-dasharray": "5,3",
  });
  s.appendChild(marker);
  const biasDot = el("circle", { cx: x(cMin), cy: y(bias2(cMin)), r: 4.5, fill: BIAS_COLOR });
  const varDot = el("circle", { cx: x(cMin), cy: y(variance(cMin)), r: 4.5, fill: VAR_COLOR });
  const totalDot = el("circle", { cx: x(cMin), cy: y(total(cMin)), r: 4.5, fill: TOTAL_COLOR });
  s.appendChild(biasDot);
  s.appendChild(varDot);
  s.appendChild(totalDot);

  host.appendChild(s);

  // Legend
  const legend = document.createElement("div");
  legend.className = "mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px]";
  function swatch(color: string, label: string) {
    const item = document.createElement("span");
    item.className = "inline-flex items-center gap-1.5 text-muted-foreground";
    const dot = document.createElement("span");
    dot.style.display = "inline-block";
    dot.style.width = "10px";
    dot.style.height = "10px";
    dot.style.borderRadius = "2px";
    dot.style.backgroundColor = color;
    item.appendChild(dot);
    const text = document.createElement("span");
    text.textContent = label;
    item.appendChild(text);
    return item;
  }
  legend.appendChild(swatch(BIAS_COLOR, "Bias²(c)"));
  legend.appendChild(swatch(VAR_COLOR, "Variance(c)"));
  legend.appendChild(swatch(TOTAL_COLOR, "Total = Bias² + Variance + σ²"));
  host.appendChild(legend);

  const out = readout(host, "");

  function draw(c: number) {
    marker.setAttribute("x2", String(x(c)));
    marker.setAttribute("x1", String(x(c)));
    biasDot.setAttribute("cx", String(x(c)));
    biasDot.setAttribute("cy", String(y(bias2(c))));
    varDot.setAttribute("cx", String(x(c)));
    varDot.setAttribute("cy", String(y(variance(c))));
    totalDot.setAttribute("cx", String(x(c)));
    totalDot.setAttribute("cy", String(y(total(c))));
    out.set(
      `c = ${c.toFixed(1)}   Bias² = ${fmt(bias2(c))}   Variance = ${fmt(variance(c))}   Total = ${fmt(total(c))}`,
    );
  }
  draw(cMin);

  const slider = sliderControl(
    host,
    "Model complexity",
    { min: cMin, max: cMax, step: 0.1, value: cMin },
    (v) => draw(v),
  );

  // Autoplay intro: sweep complexity from c=1 up to c=10 and back down, settling exactly
  // at the true interior minimum cStar, so the U-shape is traced out visually before the
  // reader ever touches the slider. Continuous, not a jump-cut — driven by animate().
  let stopAnim: (() => void) | null = null;

  function playIntro() {
    if (stopAnim) stopAnim();
    slider.disabled = true;
    const rampUp = (eased: number) => cMin + eased * (cMax - cMin);
    const rampDown = (eased: number) => cMax - eased * (cMax - cStar);
    const setAndDraw = (c: number) => {
      draw(c);
      slider.value = String(c);
    };
    setAndDraw(cMin);
    stopAnim = animate(
      2000,
      (eased) => setAndDraw(rampUp(eased)),
      () => {
        stopAnim = animate(
          2000,
          (eased) => setAndDraw(rampDown(eased)),
          () => {
            setAndDraw(cStar);
            slider.disabled = false;
            stopAnim = null;
          },
          ease.inOutCubic,
        );
      },
      ease.inOutCubic,
    );
  }

  playIntro();
  replayButton(host, "↻ Replay animation", playIntro);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    `Watch the marker sweep from a simple model (c=1) to a highly complex one (c=10) and ` +
    `back, settling at the true minimum of the green total-error curve, at c≈${cStar.toFixed(2)}. ` +
    `Once it settles, drag the slider yourself — neither the simplest nor the most complex ` +
    `model wins.`;
  host.appendChild(hint);

  return () => {
    if (stopAnim) stopAnim();
  };
};

export function BiasVarianceTradeoff() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> imagine three people shooting arrows at a dartboard, trying to
          hit the true bullseye. One person's scope is misaligned — their arrows land in a tight
          little cluster, but that cluster sits consistently off to one side. That's{" "}
          <strong>bias</strong>: consistently missing in the same direction. A second person's scope
          is fine, but their hands shake — arrows scatter widely all around the bullseye, sometimes
          close, sometimes far, with no consistent direction to the miss. That's{" "}
          <strong>variance</strong>: inconsistency from one shot to the next. Even a perfect archer
          with a perfect scope and a perfectly steady hand still has to contend with{" "}
          <strong>irreducible error</strong> — a gust of wind on any given shot that nobody could
          have predicted or corrected for in advance.
        </p>
        <p>
          <strong>Intermediate:</strong> translate the analogy into modeling. "Bias" here does{" "}
          <em>not</em> mean any one fitted model looks wrong on the data it was trained on — it
          means: if you imagine drawing many different training sets from the same underlying
          distribution and fitting your model class fresh on each one, the{" "}
          <em>average prediction across all of those fits</em>, at a given point x, is
          systematically off from the true function's value at x. "Variance" means: that same
          prediction at x swings around a lot depending on which particular training set you
          happened to draw — retrain on a slightly different sample and you get a noticeably
          different answer. Both quantities are properties of the <strong>estimator</strong> — the
          model class and fitting procedure — not properties of any single dataset or any single
          fitted model.
        </p>
        <p>
          <strong>Advanced:</strong> this is exactly why model complexity matters. High-capacity
          models — deep, unpruned decision trees; high-degree polynomials; heavily overparameterized
          networks — can bend to fit almost any training set closely, so their average fit across
          many training sets tends to land close to the truth (<strong>low bias</strong>), but
          exactly <em>how</em> they bend is highly sensitive to the specific noise in whichever
          training set they saw (<strong>high variance</strong>). Simple models — a straight line, a
          shallow tree — can't bend much no matter what data they see, so they're stable across
          training sets (<strong>low variance</strong>) but systematically miss curvature in the
          true function they're too rigid to represent (<strong>high bias</strong>). The next lesson
          on overfitting, underfitting, and capacity is the empirical, train/test-curve view of this
          exact same phenomenon — this lesson is its theoretical backbone.
        </p>
        <p>
          <strong>Working the two extremes concretely:</strong> the toy curves driving the diagram
          below make this arithmetic, not just intuition. They're built from{" "}
          <code>{"Bias²(c) = 9/c²"}</code> and <code>{"Variance(c) = 0.05·c²"}</code> for a
          complexity dial c running from 1 (rigid) to 10 (extremely flexible), plus a fixed noise
          floor of 0.3. At <strong>c = 1</strong>, the simplest setting, bias² alone is{" "}
          <code>9/1² = 9</code> while variance is a negligible <code>0.05·1² = 0.05</code> — total
          error of roughly 9.35 is almost entirely bias: the model is so rigid that its systematic
          miss from the true function swamps everything else, and refitting it on a different sample
          barely changes the answer at all. At <strong>c = 10</strong>, the most flexible setting,
          the roles flip completely: bias² has collapsed to <code>9/100 = 0.09</code> (the model is
          now expressive enough that its average fit is essentially correct) but variance has
          ballooned to <code>0.05·100 = 5</code> — total error of about 5.39 is almost entirely
          variance: the fit swings wildly depending on which particular training sample it happened
          to see. Neither extreme's total error is anywhere close to the interior minimum, which is
          exactly the point — the U-shape isn't a metaphor here, it's what you get from adding a
          strictly decreasing curve to a strictly increasing one and finding where their sum bottoms
          out (here, at c≈{CSTAR.toFixed(2)} exactly).
        </p>
        <p>
          <strong>Two named algorithms at opposite ends:</strong> a <strong>decision stump</strong>{" "}
          (a tree with a single split, i.e. depth 1) can only ever ask one yes/no question of the
          data before predicting, so no matter how the training sample is drawn, the stump's shape
          is tightly constrained — it sits near the c=1 end of this spectrum: low variance, because
          there just isn't enough flexibility in "one split" for sampling noise to meaningfully
          change the outcome, and high bias, because a single split almost never captures a
          genuinely complex decision boundary. An{" "}
          <strong>unpruned decision tree grown to full depth</strong>, by contrast, keeps splitting
          until every leaf is pure, which means it will happily carve out a leaf around a single
          mislabeled or noisy point if that's what's needed to drive training error to zero — it
          sits near the c=10 end: low bias, because with enough splits it can represent almost any
          decision boundary on average, and high variance, because exactly <em>where</em> those
          fine-grained splits land depends heavily on which specific noisy points happened to be in
          that particular training draw. Neither sits at the sweet spot on its own — which is
          precisely why bagging a forest of full-depth trees (attacking the stump's opposite failure
          mode from the variance side) is such a common fix, covered later.
        </p>
      </SectionBlock>

      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\mathbb{E}\\big[(y - \\hat f(x))^2\\big] = \\big(\\text{Bias}[\\hat f(x)]\\big)^2 + \\text{Var}[\\hat f(x)] + \\sigma^2"
          }
        </Formula>
        <Formula>{"\\text{Bias}[\\hat f(x)] = \\mathbb{E}[\\hat f(x)] - f(x)"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Fix a single input point x. <code>f(x) = E[Y|X=x]</code> is the true regression function
          from the previous lesson — the Bayes-optimal target under squared loss.{" "}
          <code>{"\\hat f"}</code> is the model actually fit on one particular, finite, randomly
          drawn training set. The expectations <code>E[...]</code> on the right-hand side are taken
          over the randomness of <em>which training set got drawn</em> — imagine refitting on
          thousands of fresh samples from the same distribution and averaging. <code>σ²</code> is
          the variance of the noise in Y around f(x) — it doesn't depend on the model at all.
        </p>
      </SectionBlock>

      <Derivation
        id="derivation"
        title="Derivation: splitting squared error into bias, variance, and noise"
      >
        <p>
          Fix x and start from the quantity we actually care about — the expected squared error of
          the fitted model against a fresh, noisy observation Y at that point:
        </p>
        <Formula>{"\\mathbb{E}\\big[(Y - \\hat f(x))^2\\big]"}</Formula>
        <p>
          Write the noisy observation as the true function plus zero-mean noise,{" "}
          <code>Y = f(x) + ε</code>, with <code>E[ε] = 0</code>, <code>Var[ε] = σ²</code>, and ε
          independent of the training set (and hence independent of <code>{"\\hat f"}</code>).
          Substituting and regrouping:
        </p>
        <Formula>{"Y - \\hat f(x) = \\big(f(x) - \\hat f(x)\\big) + \\varepsilon"}</Formula>
        <p>Squaring and taking the expectation term by term:</p>
        <Formula>
          {
            "\\mathbb{E}\\big[(Y-\\hat f(x))^2\\big] = \\mathbb{E}\\big[(f(x)-\\hat f(x))^2\\big] + 2\\,\\mathbb{E}\\big[(f(x)-\\hat f(x))\\,\\varepsilon\\big] + \\mathbb{E}[\\varepsilon^2]"
          }
        </Formula>
        <p>
          The cross term vanishes: since ε is independent of <code>{"\\hat f"}</code> (and{" "}
          <code>f(x)</code> is just a fixed constant), the expectation of the product factors into a
          product of expectations, and <code>E[ε] = 0</code> kills it:
        </p>
        <Formula>
          {
            "\\mathbb{E}\\big[(f(x)-\\hat f(x))\\,\\varepsilon\\big] = \\mathbb{E}\\big[f(x)-\\hat f(x)\\big]\\cdot \\mathbb{E}[\\varepsilon] = \\mathbb{E}\\big[f(x)-\\hat f(x)\\big] \\cdot 0 = 0"
          }
        </Formula>
        <p>
          and the last term is exactly the noise variance, since <code>E[ε] = 0</code> means{" "}
          <code>E[ε²] = Var[ε] = σ²</code>. So we already have:
        </p>
        <Formula>
          {
            "\\mathbb{E}\\big[(Y-\\hat f(x))^2\\big] = \\mathbb{E}\\big[(\\hat f(x)-f(x))^2\\big] + \\sigma^2"
          }
        </Formula>
        <p>
          Now expand the remaining term. Let <code>m = E[ˆf(x)]</code> denote the average prediction
          over training sets, and add and subtract it:
        </p>
        <Formula>{"\\hat f(x) - f(x) = \\big(\\hat f(x) - m\\big) + \\big(m - f(x)\\big)"}</Formula>
        <p>
          The second piece, <code>m − f(x)</code>, is just a fixed number once you know the model
          class and the true function — it does not vary as the training set varies, because m is
          itself already an average over all training sets. Squaring and taking the expectation
          (over training-set draws) term by term again:
        </p>
        <Formula>
          {
            "\\mathbb{E}\\big[(\\hat f(x)-f(x))^2\\big] = \\mathbb{E}\\big[(\\hat f(x)-m)^2\\big] + 2(m-f(x))\\,\\mathbb{E}\\big[\\hat f(x)-m\\big] + (m-f(x))^2"
          }
        </Formula>
        <p>
          The middle term vanishes too: <code>E[f̂(x) − m] = E[f̂(x)] − m = m − m = 0</code> by the
          very definition of m. What's left is exactly the two named quantities:
        </p>
        <Formula>
          {
            "\\mathbb{E}\\big[(\\hat f(x)-m)^2\\big] = \\text{Var}[\\hat f(x)] \\qquad (m-f(x))^2 = \\big(\\text{Bias}[\\hat f(x)]\\big)^2"
          }
        </Formula>
        <p>Putting every piece back together gives the full decomposition:</p>
        <Formula>
          {
            "\\mathbb{E}\\big[(Y-\\hat f(x))^2\\big] = \\big(\\text{Bias}[\\hat f(x)]\\big)^2 + \\text{Var}[\\hat f(x)] + \\sigma^2"
          }
        </Formula>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this decomposition is the theoretical justification
          for two entire families of techniques covered in later modules. Regularization (ridge and
          lasso regression) deliberately shrinks a model toward simpler answers, which introduces
          some bias — but if it removes proportionally more variance, the net sum can go{" "}
          <em>down</em>, even though the fit is technically "more wrong" on average. Ensembling
          (bagging, random forests) works from the opposite end: averaging many independently fit,
          low-bias, high-variance models cancels out their disagreements without touching each
          individual model's bias, driving the variance term toward zero while leaving bias alone.
          Neither trick would make sense without first knowing that error genuinely splits into
          these three independent, additive pieces.
        </p>
      </Derivation>

      <DiagramBlock
        id="diagram"
        title="The U-shaped total-error curve"
        caption="Watch the automatic sweep trace the U-shape once, then drag the slider yourself — bias² falls, variance rises, and their sum traces the classic U-shape with an interior minimum, not at either extreme."
      >
        <DiagramHost render={renderBiasVarianceCurve} />
      </DiagramBlock>

      <MultiCodeExample
        id="practical"
        title="Practical example — measuring the decomposition with bootstrap resampling"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import numpy as np

rng = np.random.default_rng(42)

# ---- 1. A known "true" function and a noisy data generator around it ----
def true_function(x):
    return np.sin(1.5 * x) + 0.3 * x

SIGMA = 0.3          # true irreducible noise std-dev
N_TRAIN = 25          # points per training set
DEGREE = 3            # polynomial degree = "model complexity" for this experiment
X_TEST = 1.2          # fixed point at which we measure bias/variance
N_BOOTSTRAP = 200

def make_training_set(n):
    x = rng.uniform(-3, 3, size=n)
    y = true_function(x) + rng.normal(0, SIGMA, size=n)
    return x, y

def fit_polynomial(x, y, degree):
    # Build the design matrix by hand and solve the normal equations
    # (X^T X) beta = X^T y directly -- no sklearn involved.
    X = np.vstack([x ** p for p in range(degree + 1)]).T
    beta = np.linalg.solve(X.T @ X, X.T @ y)
    return beta

def predict(beta, xs):
    degree = len(beta) - 1
    X = np.vstack([np.asarray(xs) ** p for p in range(degree + 1)]).T
    return X @ beta

# ---- 2. Bootstrap: fit on many resampled training sets, evaluate all at X_TEST ----
predictions = []
observed_targets = []
for _ in range(N_BOOTSTRAP):
    x, y = make_training_set(N_TRAIN)
    beta = fit_polynomial(x, y, DEGREE)
    predictions.append(predict(beta, [X_TEST])[0])
    observed_targets.append(true_function(X_TEST) + rng.normal(0, SIGMA))

predictions = np.array(predictions)
observed_targets = np.array(observed_targets)

# ---- 3. Decompose ----
f_true = true_function(X_TEST)
mean_prediction = predictions.mean()

bias_sq = (mean_prediction - f_true) ** 2
variance = predictions.var()
noise_floor = SIGMA ** 2
empirical_mse = np.mean((observed_targets - predictions) ** 2)

print(f"Bias^2              = {bias_sq:.4f}")
print(f"Variance            = {variance:.4f}")
print(f"Irreducible noise   = {noise_floor:.4f}")
print(f"Sum of the three    = {bias_sq + variance + noise_floor:.4f}")
print(f"Observed MSE        = {empirical_mse:.4f}")`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <array>
#include <cmath>
#include <iostream>
#include <random>
#include <vector>

using namespace std;

constexpr int DEGREE = 3;         // polynomial degree = model complexity
constexpr int N_TRAIN = 25;        // points per training set
constexpr int N_BOOTSTRAP = 200;
constexpr double SIGMA = 0.3;      // true irreducible noise std-dev
constexpr double X_TEST = 1.2;

double trueFunction(double x) {
    return sin(1.5 * x) + 0.3 * x;
}

// Solves an (n x n) system A * beta = b in place via Gaussian elimination with
// partial pivoting -- no external linear algebra library.
vector<double> solveLinearSystem(vector<vector<double>> A, vector<double> b) {
    int n = static_cast<int>(b.size());
    for (int col = 0; col < n; col++) {
        int pivotRow = col;
        for (int row = col + 1; row < n; row++) {
            if (fabs(A[row][col]) > fabs(A[pivotRow][col])) pivotRow = row;
        }
        swap(A[col], A[pivotRow]);
        swap(b[col], b[pivotRow]);
        for (int row = col + 1; row < n; row++) {
            double factor = A[row][col] / A[col][col];
            for (int k = col; k < n; k++) A[row][k] -= factor * A[col][k];
            b[row] -= factor * b[col];
        }
    }
    vector<double> beta(n, 0.0);
    for (int row = n - 1; row >= 0; row--) {
        double total = b[row];
        for (int k = row + 1; k < n; k++) total -= A[row][k] * beta[k];
        beta[row] = total / A[row][row];
    }
    return beta;
}

// Fits a degree-DEGREE polynomial by forming X^T X and X^T y by hand, then solving.
vector<double> fitPolynomial(const vector<double>& x, const vector<double>& y) {
    int p = DEGREE + 1;
    vector<vector<double>> XtX(p, vector<double>(p, 0.0));
    vector<double> Xty(p, 0.0);
    for (size_t i = 0; i < x.size(); i++) {
        array<double, DEGREE + 1> powers{};
        double v = 1.0;
        for (int k = 0; k <= DEGREE; k++) {
            powers[k] = v;
            v *= x[i];
        }
        for (int a = 0; a < p; a++) {
            Xty[a] += powers[a] * y[i];
            for (int b = 0; b < p; b++) XtX[a][b] += powers[a] * powers[b];
        }
    }
    return solveLinearSystem(XtX, Xty);
}

double predictAt(const vector<double>& beta, double x) {
    double result = 0.0, v = 1.0;
    for (double coef : beta) {
        result += coef * v;
        v *= x;
    }
    return result;
}

int main() {
    mt19937 rng(42);
    uniform_real_distribution<double> xDist(-3.0, 3.0);
    normal_distribution<double> noiseDist(0.0, SIGMA);

    vector<double> predictions;
    vector<double> observedTargets;
    predictions.reserve(N_BOOTSTRAP);
    observedTargets.reserve(N_BOOTSTRAP);

    for (int i = 0; i < N_BOOTSTRAP; i++) {
        vector<double> x(N_TRAIN), y(N_TRAIN);
        for (int j = 0; j < N_TRAIN; j++) {
            x[j] = xDist(rng);
            y[j] = trueFunction(x[j]) + noiseDist(rng);
        }
        vector<double> beta = fitPolynomial(x, y);
        predictions.push_back(predictAt(beta, X_TEST));
        observedTargets.push_back(trueFunction(X_TEST) + noiseDist(rng));
    }

    double meanPrediction = 0.0;
    for (double p : predictions) meanPrediction += p;
    meanPrediction /= predictions.size();

    double fTrue = trueFunction(X_TEST);
    double biasSq = (meanPrediction - fTrue) * (meanPrediction - fTrue);

    double variance = 0.0;
    for (double p : predictions) variance += (p - meanPrediction) * (p - meanPrediction);
    variance /= predictions.size();

    double noiseFloor = SIGMA * SIGMA;

    double empiricalMse = 0.0;
    for (size_t i = 0; i < predictions.size(); i++) {
        double diff = observedTargets[i] - predictions[i];
        empiricalMse += diff * diff;
    }
    empiricalMse /= predictions.size();

    cout << "Bias^2              = " << biasSq << "\\n";
    cout << "Variance            = " << variance << "\\n";
    cout << "Irreducible noise   = " << noiseFloor << "\\n";
    cout << "Sum of the three    = " << biasSq + variance + noiseFloor << "\\n";
    cout << "Observed MSE        = " << empiricalMse << "\\n";

    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

rng = np.random.default_rng(42)

def true_function(x):
    return np.sin(1.5 * x) + 0.3 * x

SIGMA = 0.3
N_TRAIN = 25
DEGREE = 3
X_TEST = 1.2
N_BOOTSTRAP = 200

poly = PolynomialFeatures(degree=DEGREE, include_bias=False)

predictions = []
observed_targets = []
for _ in range(N_BOOTSTRAP):
    x = rng.uniform(-3, 3, size=N_TRAIN)
    y = true_function(x) + rng.normal(0, SIGMA, size=N_TRAIN)

    model = LinearRegression()
    model.fit(poly.fit_transform(x.reshape(-1, 1)), y)

    pred = model.predict(poly.transform([[X_TEST]]))[0]
    predictions.append(pred)
    observed_targets.append(true_function(X_TEST) + rng.normal(0, SIGMA))

predictions = np.array(predictions)
observed_targets = np.array(observed_targets)

f_true = true_function(X_TEST)
bias_sq = (predictions.mean() - f_true) ** 2
variance = predictions.var()
noise_floor = SIGMA ** 2
empirical_mse = np.mean((observed_targets - predictions) ** 2)

print(f"Bias^2              = {bias_sq:.4f}")
print(f"Variance            = {variance:.4f}")
print(f"Irreducible noise   = {noise_floor:.4f}")
print(f"Sum of the three    = {bias_sq + variance + noise_floor:.4f}")
print(f"Observed MSE        = {empirical_mse:.4f}")`,
          },
        ]}
      >
        <p>
          Bias and variance are defined over an imaginary population of retrainings, but you can
          estimate them from real data with <strong>bootstrap resampling</strong>: draw many
          resampled training sets, fit the same model on each, and look at how the predictions at
          one fixed test point behave. All three implementations below run the identical experiment
          — 200 bootstrap-resampled training sets, a degree-3 polynomial fit, predictions collected
          at a single fixed x — and print the same three numbers so you can see the decomposition
          verified numerically, not just asserted algebraically.
        </p>
      </MultiCodeExample>

      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>A linear model on housing prices</strong> underfits whenever price genuinely
            depends on curved interactions (location premium that itself scales with square footage,
            diminishing returns on extra bedrooms) — no matter how much training data you throw at
            it, a straight line can't bend to capture that curvature. That's high bias: the average
            prediction is off, and more data doesn't fix it.
          </li>
          <li>
            <strong>A linear model fit to non-linear physics or chemistry data</strong> fails the
            same way for a more fundamental reason: reaction rates that follow an Arrhenius
            (exponential) temperature dependence, or drag forces that scale with velocity squared,
            are not approximately linear over any practically useful range. Fitting a straight line
            to such data doesn't just miss noise — it misses the actual shape of the physical law,
            so residuals show a clear systematic curve no matter how many more measurements you
            collect. This is textbook high bias: the mismatch is between the model's functional form
            and the truth, not between the model and any one dataset's sampling luck.
          </li>
          <li>
            <strong>An un-pruned decision tree</strong> grown to full depth on a small tabular
            dataset (a few hundred rows, say, in a churn or fraud model) partitions the training set
            until every leaf is pure — including leaves built around single noisy outliers. Retrain
            on a slightly different sample and the tree's splits, especially near the leaves, can
            look completely different, and its test accuracy can swing by several points between
            otherwise-equivalent train/test splits. That's high variance: the average fit may be
            fine, but any one fit is unreliable, and small datasets make it worse because there's
            less signal to drown out each split's sensitivity to individual points.
          </li>
          <li>
            <strong>Random forests and bagging</strong> (a later module) exist specifically to
            attack the variance term, not the bias term: average the predictions of many
            independently grown, high-variance, low-bias trees, and the disagreements between them
            cancel out while each tree's individual bias is untouched — variance drops sharply, bias
            barely moves. This is why bagging works so well on exactly the un-pruned-tree scenario
            above but does little for a model that's underfitting (a single decision stump, or the
            linear model on curved data) — you can't average away a systematic error that every copy
            in the ensemble shares.
          </li>
          <li>
            <strong>Ridge and lasso regression</strong> (a later module) attack the same problem
            from the other side: shrinking coefficients introduces a small, deliberate amount of
            bias, but if it removes a larger amount of variance, the net expected error goes down —
            the whole point of regularization is trading a little bias for a lot less variance.
          </li>
          <li>
            <strong>Early stopping when training a neural network</strong> is a direct bias-variance
            lever, even though it never touches the architecture. Training longer lets the weights
            drift further from their (high-bias, low-variance) random initialization toward a
            low-bias fit that has memorized sample-specific noise — high variance across different
            random seeds or slightly different training sets. Stopping training early, based on a
            held-out validation curve turning upward, is a way of dialing back effective model
            complexity without deleting a single parameter.
          </li>
          <li>
            <strong>Choosing k in k-nearest-neighbors</strong> is one of the most literal
            bias-variance dials in all of machine learning, because k directly controls how many
            training points get averaged into each prediction. k=1 predicts using the single closest
            training point — essentially zero bias (it can represent arbitrarily jagged decision
            boundaries) but very high variance (change one nearby training point and the prediction
            at that location can flip entirely). A large k averages over many neighbors, smoothing
            the boundary and stabilizing predictions across resamples (lower variance) at the cost
            of blurring over genuine local structure (higher bias) — k is quite literally the c-axis
            of this lesson's diagram, relabeled.
          </li>
          <li>
            <strong>Boosting a sequence of weak learners</strong> (covered in a later module) shows
            the opposite pairing works too: a single shallow decision stump is a deliberately
            high-bias, low-variance model that, on its own, underfits badly. Combining hundreds of
            such stumps — each one fit to correct the previous ensemble's remaining errors — can
            drive bias down close to zero while keeping variance under control, often beating a
            single large, low-bias, high-variance model outright. It's a reminder that "reduce
            variance by ensembling" (bagging) and "reduce bias by ensembling" (boosting) are two
            genuinely different mechanisms, aimed at opposite ends of this same decomposition.
          </li>
        </ul>
      </SectionBlock>

      <Pitfall>
        <ul>
          <li>
            Treating "more complex model" as unconditionally worse or unconditionally better,
            instead of recognizing that where the sweet spot sits is entirely data- and
            problem-dependent — a model that's too simple for one dataset may be exactly right, or
            even still too simple, for another.
          </li>
          <li>
            Forgetting that the <code>σ²</code> term is a hard floor: no model, however well chosen
            or well tuned, can push expected error below the irreducible noise in the data itself.
            If a "better model" claims near-zero error on genuinely noisy data, be suspicious of the
            evaluation, not impressed by the model.
          </li>
          <li>
            Assuming the clean U-shape here is the whole story for every model class. Modern,
            heavily overparameterized models (very large neural networks in particular) can show a{" "}
            <strong>double descent</strong> pattern — error rises then falls a second time past the
            point where the model can perfectly fit the training data — which the simple picture in
            this lesson does not predict. The next lesson covers that phenomenon directly; for now,
            just flag it as a known exception to the classical U-shape, not a contradiction to
            resolve here.
          </li>
        </ul>
      </Pitfall>

      <ExpertNote>
        <p>
          This exact decomposition — clean, additive, three named terms — is a special property of{" "}
          <strong>squared-error loss</strong>. It comes directly from expanding a square, which is
          why the algebra above works out so neatly. Swap in a different loss (0-1 loss for a
          classifier, say) and there is no equally clean closed-form split into "bias" and
          "variance" terms that sum to the loss — classification error can still be usefully
          analyzed through bias-like and variance-like effects, but the tidy additive identity
          proved above genuinely does not carry over.
        </p>
        <p>
          It's also worth not conflating this lesson's technical vocabulary with everyday usage.
          "Bias" here is a precise statistical property of an <em>estimator</em> — how its average
          prediction across hypothetical resampled training sets compares to the truth. That is a
          different concept from "bias" in the sense of a training set that systematically
          under-represents some group or scenario (a biased <em>dataset</em>, sometimes called
          sampling or selection bias). The two uses of the word are related in spirit — both mean
          "systematically off in some direction" — but they are not interchangeable, and papers that
          use one term while meaning the other cause real confusion.
        </p>
      </ExpertNote>

      <Quiz
        q="You train a degree-1 (linear) model and a degree-15 (very wiggly) polynomial model on the same small dataset. The degree-15 model gets almost perfect training error but wildly different-looking fits every time you resample the training data slightly. Which term dominates its expected test error, and what does that predict about the linear model by contrast?"
        a="The degree-15 model is dominated by variance: it has enough capacity to bend to whatever specific noise is in the training sample, so its fit is close to unbiased on average but highly unstable from one training set to the next — exactly what 'wildly different-looking fits on resampling' describes. By contrast, the degree-1 model, being far too rigid to track sample-specific noise, will look nearly identical across resamples (low variance) but will systematically miss any real curvature in the true function (high bias). Neither model is 'better' in general — the decomposition just tells you which lever to pull: reduce the wiggly model's variance (regularize, get more data, or ensemble it), or reduce the linear model's bias (add capacity)."
      />

      <Takeaway>
        <p>
          Every model's expected squared error at a point splits exactly into three additive pieces:
          bias² (systematic miss, from a model too rigid to represent the truth), variance
          (instability, from a model sensitive to which particular training sample it saw), and an
          irreducible noise floor no model can shrink. Model-complexity choices, regularization, and
          ensembling are three different practical answers to the same underlying question this
          decomposition poses: which of the two controllable terms, bias or variance, is worth
          trading against the other for your specific data.
        </p>
      </Takeaway>
    </>
  );
}
