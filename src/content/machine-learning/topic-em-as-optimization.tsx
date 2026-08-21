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
} from "@/lib/diagram-helpers";

/** The "true" log-likelihood curve this diagram uses — an honest, if simplified,
 *  bumpy function with one clearly dominant maximum, so EM's hops climbing it are
 *  visually unambiguous. */
function trueLogLik(theta: number) {
  return (
    2.6 * Math.exp(-((theta - 6) ** 2) / 6) +
    1.1 * Math.exp(-((theta - 1.5) ** 2) / 2.2) -
    0.02 * theta * theta
  );
}
function trueLogLikPrime(theta: number) {
  const eps = 1e-4;
  return (trueLogLik(theta + eps) - trueLogLik(theta - eps)) / (2 * eps);
}
function trueLogLikSecond(theta: number) {
  const eps = 1e-3;
  return (trueLogLik(theta + eps) - 2 * trueLogLik(theta) + trueLogLik(theta - eps)) / (eps * eps);
}

/** A concave quadratic ELBO curve tangent to the true curve at theta0 — built directly
 *  and honestly from the true curve's own value/slope/curvature there, exactly the
 *  "touches at theta_old, lies below everywhere else" property the derivation proves. */
function elboAt(theta0: number) {
  const f0 = trueLogLik(theta0);
  const fp0 = trueLogLikPrime(theta0);
  const fpp0 = Math.min(trueLogLikSecond(theta0), -0.15); // force concave, even where the true curve briefly isn't
  return (theta: number) => f0 + fp0 * (theta - theta0) + 0.5 * fpp0 * (theta - theta0) ** 2;
}
function elboArgmax(theta0: number) {
  const fp0 = trueLogLikPrime(theta0);
  const fpp0 = Math.min(trueLogLikSecond(theta0), -0.15);
  return theta0 - fp0 / fpp0;
}

/**
 * 2.2.7 diagram — the true log-likelihood as a curve, and a sequence of ELBO curves
 * that each touch it at the current theta and lie below it everywhere else. On mount,
 * animates a few EM "hops": jump to the current ELBO's own maximum, draw a new ELBO
 * touching the true curve there, repeat — with the true-curve value at each successive
 * touching point visibly non-decreasing.
 */
const renderEmHops: DiagramRender = (host) => {
  const T_MIN = -1,
    T_MAX = 11;
  const PLOT_LEFT = 34,
    PLOT_RIGHT = 400,
    PLOT_TOP = 20,
    PLOT_BOTTOM = 210;
  const yMin = -1.2,
    yMax = 3.0;
  const mapX = (t: number) =>
    PLOT_LEFT + ((t - T_MIN) / (T_MAX - T_MIN)) * (PLOT_RIGHT - PLOT_LEFT);
  const mapY = (v: number) => PLOT_BOTTOM - ((v - yMin) / (yMax - yMin)) * (PLOT_BOTTOM - PLOT_TOP);
  const invX = (px: number) =>
    T_MIN + ((px - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT)) * (T_MAX - T_MIN);

  const s = svg("0 0 440 240");

  let truePath = "";
  for (let i = 0; i <= 200; i++) {
    const t = T_MIN + (i / 200) * (T_MAX - T_MIN);
    truePath += `${i === 0 ? "M" : "L"}${mapX(t).toFixed(1)},${mapY(trueLogLik(t)).toFixed(1)} `;
  }
  s.appendChild(el("path", { d: truePath, fill: "none", stroke: "#111827", "stroke-width": 2.25 }));

  const elboPath = el("path", {
    d: "",
    fill: "none",
    stroke: "#7c3aed",
    "stroke-width": 2,
    "stroke-dasharray": "5,3",
  });
  s.appendChild(elboPath);
  const touchDot = dragHandle(0, 0, "#d1453d");
  s.appendChild(touchDot);
  const trail = el("g", {});
  s.appendChild(trail);

  host.appendChild(s);

  const legend = document.createElement("p");
  legend.className = "mt-1 text-center text-[11.5px] text-muted-foreground";
  legend.textContent =
    "Solid black = true log-likelihood · dashed violet = current ELBO (touches the black curve at θ_old) · red dot = current θ · faint dots = the trail of visited θ values";
  host.appendChild(legend);

  const out = readout(host, "");

  let theta = 0.5;
  let hopCount = 0;

  function drawElbo(theta0: number) {
    const fn = elboAt(theta0);
    let d = "";
    for (let i = 0; i <= 100; i++) {
      const t = T_MIN + (i / 100) * (T_MAX - T_MIN);
      const v = fn(t);
      if (v < yMin - 1 || v > yMax + 1) continue;
      const p = `${mapX(t).toFixed(1)},${mapY(v).toFixed(1)}`;
      d += d === "" ? `M${p}` : ` L${p}`;
    }
    elboPath.setAttribute("d", d);
  }

  function placeDot(t: number) {
    touchDot.setAttribute("cx", String(mapX(t)));
    touchDot.setAttribute("cy", String(mapY(trueLogLik(t))));
  }

  function addTrailDot(t: number) {
    trail.appendChild(
      el("circle", { cx: mapX(t), cy: mapY(trueLogLik(t)), r: 3, fill: "#7c3aed", opacity: 0.4 }),
    );
  }

  function paint() {
    drawElbo(theta);
    placeDot(theta);
    out.set(
      `hop ${hopCount}   θ = ${theta.toFixed(2)}   log-likelihood = ${trueLogLik(theta).toFixed(3)}   (non-decreasing across hops)`,
    );
  }
  paint();

  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let activeCancel: (() => void) | null = null;

  function eStep() {
    // The E-step: the ELBO drawn at the current theta already "touches" the true
    // curve there (by construction) -- this is the diagram's stand-in for choosing
    // q(z) = P(z|x, theta_old), which is exactly what makes that touching happen.
    drawElbo(theta);
  }

  function mStep(onDone: () => void) {
    // The M-step: maximize the current ELBO over theta -- since the ELBO is concave
    // by construction its maximizer has a closed form.
    const target = Math.max(T_MIN, Math.min(T_MAX, elboArgmax(theta)));
    const start = theta;
    activeCancel = animate(
      650,
      (eased) => {
        theta = start + (target - start) * eased;
        placeDot(theta);
      },
      () => {
        theta = target;
        addTrailDot(theta);
        hopCount += 1;
        paint();
        onDone();
      },
      ease.inOutCubic,
    );
  }

  function runHops(remaining: number) {
    if (cancelled || remaining <= 0) return;
    eStep();
    mStep(() => {
      if (cancelled) return;
      timeoutId = setTimeout(() => runHops(remaining - 1), 500);
    });
  }

  function playIntro() {
    cancelled = false;
    hopCount = 0;
    trail.innerHTML = "";
    theta = 0.5;
    paint();
    timeoutId = setTimeout(() => runHops(5), 400);
  }
  playIntro();

  function stopIntro() {
    cancelled = true;
    if (timeoutId !== null) clearTimeout(timeoutId);
    if (activeCancel) activeCancel();
  }

  const stopDrag = makeDraggable(touchDot, s, (p) => {
    stopIntro();
    theta = Math.max(T_MIN, Math.min(T_MAX, invX(p.x)));
    hopCount = 0;
    trail.innerHTML = "";
    addTrailDot(theta);
    paint();
  });

  replayButton(host, "▶ Replay EM hops from θ = 0.5", () => {
    stopIntro();
    playIntro();
  });

  return () => {
    stopIntro();
    stopDrag();
  };
};

export function ExpectationMaximizationOptimization() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> imagine data that comes from one of several unknown groups, but
          you don't know which group each point actually came from — the group membership is a{" "}
          <strong>hidden (latent) variable</strong>. If you already knew every point's group,
          fitting each group's parameters would be easy, ordinary maximum likelihood (Module 1,
          section 2.1.6). If you already knew each group's parameters, guessing which group each
          point probably came from would also be easy. <strong>EM</strong> just alternates between
          these two easy steps until they agree with each other.
        </p>
        <p>
          <strong>Intermediate:</strong> name the two steps precisely. The <strong>E-step</strong>{" "}
          computes, for the current parameter guess, the probability each point belongs to each
          group — a soft assignment, not a hard decision — by literally applying Bayes' rule (Module
          1's Statistical Decision Theory lesson) with the current parameters. The{" "}
          <strong>M-step</strong> then re-estimates the parameters by ordinary maximum likelihood,
          but weighting every point's contribution by those soft-assignment probabilities from the
          E-step.
        </p>
        <p>
          <strong>Advanced:</strong> direct MLE is intractable here because the likelihood you
          actually want to maximize has a SUM (over all possible hidden-variable values) sitting{" "}
          <em>inside</em> a logarithm, <code>log Σ_z P(x,z|θ)</code> — contrast this with the
          sum-of-logs, <code>Σ log P(xᵢ|θ)</code>, from an ordinary MLE problem, which was easy
          precisely because differentiating a sum of logs is trivial while differentiating a log of
          a sum has no clean closed form in general. EM is a way to make guaranteed, monotonic
          progress on this hard objective without ever having to differentiate it directly.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\log P(x|\\theta) = \\text{ELBO}(q,\\theta) + D_{KL}\\big(q(z)\\,\\|\\,P(z|x,\\theta)\\big)"
          }
        </Formula>
        <Formula>
          {
            "\\text{ELBO}(q,\\theta) = \\mathbb{E}_{q(z)}[\\log P(x,z|\\theta)] - \\mathbb{E}_{q(z)}[\\log q(z)]"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The KL term is always ≥ 0, so the ELBO is always a valid lower bound on the true
          log-likelihood — hence "Evidence Lower BOund."
        </p>
      </SectionBlock>
      <Derivation title="Derivation: the ELBO decomposition, and why EM never makes the likelihood worse">
        <p>
          Start from the true log-likelihood and multiply/divide inside by an arbitrary distribution{" "}
          <code>q(z)</code> over the hidden variable:
        </p>
        <Formula>{"\\log P(x|\\theta) = \\log \\sum_z q(z)\\frac{P(x,z|\\theta)}{q(z)}"}</Formula>
        <p>
          Apply Jensen's inequality — for a concave function like log,{" "}
          <code>log E[Y] ≥ E[log Y]</code> — to pull the log inside the expectation over{" "}
          <code>q</code>:
        </p>
        <Formula>
          {
            "\\log P(x|\\theta) \\ge \\sum_z q(z)\\log\\frac{P(x,z|\\theta)}{q(z)} = \\text{ELBO}(q,\\theta)"
          }
        </Formula>
        <p>
          That's the lower-bound half. Now derive the EXACT gap. Substitute the definitions of ELBO
          and KL divergence and simplify directly:
        </p>
        <Formula>
          {
            "\\log P(x|\\theta) - \\text{ELBO}(q,\\theta) = \\sum_z q(z)\\log\\frac{q(z)}{P(z|x,\\theta)} = D_{KL}\\big(q(z)\\,\\|\\,P(z|x,\\theta)\\big)"
          }
        </Formula>
        <p>
          The true log-likelihood minus the ELBO is EXACTLY the KL divergence between whatever{" "}
          <code>q</code> you chose and the TRUE posterior <code>P(z|x,θ)</code>. Since KL divergence
          is minimized — equal to exactly zero — precisely when <code>q</code> equals that true
          posterior, choosing <code>q(z) = P(z|x,θ_old)</code> in the E-step makes the ELBO exactly
          EQUAL to the true log-likelihood at the current <code>θ_old</code>: the bound "touches"
          the true curve exactly at the current point.
        </p>
        <p>
          Now the M-step: with <code>q</code> fixed from the E-step, maximize the ELBO over{" "}
          <code>θ</code> alone. Chain the inequalities:
        </p>
        <ol>
          <li>
            The ELBO touches the true log-likelihood at <code>θ_old</code>:{" "}
            <code>ELBO(q,θ_old) = log P(x|θ_old)</code>.
          </li>
          <li>
            The M-step picks <code>θ_new</code> to maximize the ELBO, so{" "}
            <code>ELBO(q,θ_new) ≥ ELBO(q,θ_old)</code>.
          </li>
          <li>
            The ELBO is a lower bound EVERYWHERE, including at <code>θ_new</code>:{" "}
            <code>log P(x|θ_new) ≥ ELBO(q,θ_new)</code>.
          </li>
        </ol>
        <p>
          Chaining all three:{" "}
          <code>log P(x|θ_new) ≥ ELBO(q,θ_new) ≥ ELBO(q,θ_old) = log P(x|θ_old)</code>. The true
          log-likelihood at the new parameters is at least as large as at the old ones — EM can
          never make the likelihood worse, on every single iteration, guaranteed.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this exact E-step/M-step alternation, applied to a
          mixture-of-Gaussians likelihood, is Gaussian Mixture Model fitting — covered directly in a
          later Clustering module of this chapter, using precisely the machinery derived here.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="EM climbing the true log-likelihood, one touching lower bound at a time"
        caption="Each dashed violet curve touches the true (solid black) curve at the current θ and lies below it everywhere else. Jumping to that curve's own maximum and drawing a new one there can only move the true log-likelihood up or hold it flat — never down. Drag the red dot to restart from a different θ."
      >
        <DiagramHost render={renderEmHops} />
      </DiagramBlock>
      <MultiCodeExample
        title="Practical example — EM for a 1D two-component Gaussian mixture"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import numpy as np

def gaussian_pdf(x, mu, var):
    return np.exp(-((x - mu) ** 2) / (2 * var)) / np.sqrt(2 * np.pi * var)

def em_gmm_1d(x, iters=50):
    n = len(x)
    mu = np.array([x.min(), x.max()])
    var = np.array([x.var(), x.var()])
    weight = np.array([0.5, 0.5])
    loglik_history = []

    for _ in range(iters):
        # E-step: responsibilities via Bayes' rule with the current parameters.
        p0 = weight[0] * gaussian_pdf(x, mu[0], var[0])
        p1 = weight[1] * gaussian_pdf(x, mu[1], var[1])
        total = p0 + p1
        r0, r1 = p0 / total, p1 / total

        # M-step: responsibility-weighted re-estimation.
        n0, n1 = r0.sum(), r1.sum()
        mu[0], mu[1] = (r0 * x).sum() / n0, (r1 * x).sum() / n1
        var[0] = (r0 * (x - mu[0]) ** 2).sum() / n0
        var[1] = (r1 * (x - mu[1]) ** 2).sum() / n1
        weight[0], weight[1] = n0 / n, n1 / n

        loglik = np.log(total).sum()
        loglik_history.append(loglik)

    return mu, var, weight, loglik_history

rng = np.random.default_rng(0)
x = np.concatenate([rng.normal(2, 1, 150), rng.normal(8, 1.5, 150)])
mu, var, weight, history = em_gmm_1d(x)
print("fitted means:", np.round(mu, 2), " (true: ~2, ~8)")
print("log-likelihood is non-decreasing:", all(b >= a - 1e-9 for a, b in zip(history, history[1:])))`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <cmath>
#include <iostream>
#include <vector>

double gaussianPdf(double x, double mu, double var) {
    return std::exp(-((x - mu) * (x - mu)) / (2 * var)) / std::sqrt(2 * M_PI * var);
}

int main() {
    std::vector<double> x; // pretend this is filled with two-cluster synthetic data
    for (int i = 0; i < 150; ++i) x.push_back(2.0 + 0.1 * (i % 10 - 5));
    for (int i = 0; i < 150; ++i) x.push_back(8.0 + 0.15 * (i % 10 - 5));
    int n = x.size();

    double mu0 = *std::min_element(x.begin(), x.end());
    double mu1 = *std::max_element(x.begin(), x.end());
    double var0 = 1.0, var1 = 1.0, w0 = 0.5, w1 = 0.5;
    double prevLL = -1e18;

    for (int iter = 0; iter < 50; ++iter) {
        std::vector<double> r0(n), r1(n);
        double loglik = 0.0;
        for (int i = 0; i < n; ++i) {
            double p0 = w0 * gaussianPdf(x[i], mu0, var0);
            double p1 = w1 * gaussianPdf(x[i], mu1, var1);
            double total = p0 + p1;
            r0[i] = p0 / total;
            r1[i] = p1 / total;
            loglik += std::log(total);
        }
        double n0 = 0, n1 = 0, sum0 = 0, sum1 = 0;
        for (int i = 0; i < n; ++i) {
            n0 += r0[i]; n1 += r1[i];
            sum0 += r0[i] * x[i]; sum1 += r1[i] * x[i];
        }
        mu0 = sum0 / n0; mu1 = sum1 / n1;
        double v0 = 0, v1 = 0;
        for (int i = 0; i < n; ++i) {
            v0 += r0[i] * (x[i] - mu0) * (x[i] - mu0);
            v1 += r1[i] * (x[i] - mu1) * (x[i] - mu1);
        }
        var0 = v0 / n0; var1 = v1 / n1;
        w0 = n0 / n; w1 = n1 / n;

        if (loglik < prevLL - 1e-6) std::cout << "WARNING: log-likelihood decreased!\\n";
        prevLL = loglik;
    }
    std::cout << "fitted means: " << mu0 << ", " << mu1 << "\\n";
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from sklearn.mixture import GaussianMixture

rng = np.random.default_rng(0)
x = np.concatenate([rng.normal(2, 1, 150), rng.normal(8, 1.5, 150)]).reshape(-1, 1)

model = GaussianMixture(n_components=2, random_state=0)
model.fit(x)
print("fitted means:", np.round(model.means_.ravel(), 2))
print("fitted weights:", np.round(model.weights_, 2))
print("final lower bound (ELBO-equivalent) per sample:", round(model.lower_bound_, 4))
# scikit-learn's GaussianMixture runs exactly this E-step/M-step loop internally,
# and even names its convergence criterion "lower_bound_" -- the same ELBO
# terminology derived above.`,
          },
        ]}
      />
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Gaussian Mixture Models</strong> for soft clustering — the direct next use of
            this exact machinery, in a later Clustering module of this chapter.
          </li>
          <li>
            <strong>Hidden Markov Model parameter estimation via Baum-Welch</strong> is itself an
            application of EM, covered in a later Graphical Models module.
          </li>
          <li>
            <strong>Missing-data imputation</strong> problems are often framed as exactly a
            latent-variable MLE problem and solved via EM.
          </li>
          <li>
            <strong>Topic models</strong> (Latent Dirichlet Allocation, a later module) use EM-like
            alternating inference between topic assignments and topic-word distributions.
          </li>
          <li>
            <strong>Item-response theory / psychometric models</strong> in educational testing use
            EM to jointly estimate latent student ability and item difficulty — a case where the
            "hidden variable" is a genuinely unobservable real-world quantity, not just a clustering
            convenience.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Assuming EM's monotonic increase in likelihood means it finds the GLOBAL maximum — it
            only guarantees non-decreasing progress toward SOME local maximum. Different
            initializations can converge to different, sometimes much worse, local optima, because
            the marginal likelihood with a latent variable is generically not convex in θ even when
            the complete-data likelihood would have been easy (Module 2's Convex Optimization Basics
            lesson).
          </li>
          <li>
            Stopping EM based on parameter change alone rather than log-likelihood (or ELBO) change,
            which can be a less reliable convergence signal.
          </li>
          <li>
            Expecting fast convergence near a plateau — EM can crawl very slowly there even while
            technically still monotonically improving, which in practice sometimes calls for
            accelerated or hybrid variants.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          <strong>Variational inference</strong> (a later Probabilistic &amp; Bayesian Methods
          module) is a direct generalization of this exact ELBO idea: instead of restricting{" "}
          <code>q</code> to be the exact posterior (which may be intractable for more complex
          models), it optimizes the ELBO over some restricted, tractable FAMILY of <code>q</code>{" "}
          distributions (mean-field, etc.). EM is the special case where that family is rich enough
          to contain the true posterior exactly, so the E-step can always close the gap completely;
          when it can't, the result is "variational EM" — a strictly more general algorithm built on
          the identical machinery derived in this lesson.
        </p>
      </ExpertNote>
      <Quiz
        q="Why does EM's guaranteed monotonic increase in the true log-likelihood NOT imply it reaches the global maximum?"
        a="The proof only chains three inequalities that establish log P(x|θ_new) >= log P(x|θ_old) — it never claims θ_new is anywhere near the best possible θ overall, only that it's no worse than where you started. Since the marginal likelihood with a latent variable is generally non-convex, there can be multiple local maxima, and which one EM climbs to depends entirely on where it started. This is why GMM fitting in practice is typically run from several random initializations and the best resulting likelihood is kept."
      />
      <Takeaway>
        <p>
          With convexity (2.2.1), gradient-based methods (2.2.2-2.2.3), second-order methods
          (2.2.4), proximal methods (2.2.5), duality (2.2.6), and now EM (2.2.7) in hand, this
          module's toolbox is complete: every specific model in the rest of this Machine Learning
          chapter is simply a choice of hypothesis class and loss function (Module 1) paired with
          whichever of these optimization tools fits that objective's particular shape.
        </p>
      </Takeaway>
    </>
  );
}
