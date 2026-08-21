import {
  SectionBlock,
  ExpertNote,
  Quiz,
  Takeaway,
  DiagramBlock,
  Pitfall,
  MultiCodeExample,
  Derivation,
} from "@/components/docs/lesson-blocks";
import { Formula } from "@/components/docs/formula";
import { DiagramHost, type DiagramRender } from "@/components/docs/diagram-host";
import {
  el,
  svg,
  makeDraggable,
  dragHandle,
  sliderControl,
  readout,
  replayButton,
  animate,
  ease,
} from "@/lib/diagram-helpers";

/* ---------- shared math helpers for the diagram below ---------- */

const MU0 = 110; // mean feature value for class 0
const MU1 = 210; // mean feature value for class 1
const SIGMA = 35; // shared standard deviation (equal-variance case)
const DOMAIN_MAX = 320;

function normalPdf(x: number, mean: number, sigma: number) {
  return Math.exp(-0.5 * ((x - mean) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

// Abramowitz & Stegun 7.1.26 approximation of the error function — good to ~1e-7,
// which is more than enough precision for an interactive readout.
function erf(x: number) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const tt = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * tt + a4) * tt + a3) * tt + a2) * tt + a1) * tt * Math.exp(-ax * ax);
  return sign * y;
}

function normalCdf(x: number, mean: number, sigma: number) {
  return 0.5 * (1 + erf((x - mean) / (sigma * Math.SQRT2)));
}

// Closed-form cost-weighted optimal threshold for two equal-variance, equal-prior
// Gaussians, derived from setting prior1 * costFN * p1(x) = prior0 * costFP * p0(x)
// with costFP fixed at 1 and priors fixed at 0.5 each (see the derivation block).
function optimalThreshold(costFN: number) {
  const num = 2 * SIGMA * SIGMA * -Math.log(costFN) - (MU0 * MU0 - MU1 * MU1);
  const den = 2 * (MU1 - MU0);
  return num / den;
}

function clampDomain(x: number) {
  return Math.max(0, Math.min(DOMAIN_MAX, x));
}

const xToSvg = (x: number) => 20 + x;
const BASELINE_Y = 205;
const PEAK_HEIGHT = 160;
const SCALE_Y = PEAK_HEIGHT / normalPdf(MU0, MU0, SIGMA);
const yToSvg = (density: number) => BASELINE_Y - density * SCALE_Y;

function curvePathD(mean: number, sigma: number) {
  let d = "";
  for (let x = 0; x <= DOMAIN_MAX; x += 4) {
    d += (x === 0 ? "M " : "L ") + xToSvg(x) + " " + yToSvg(normalPdf(x, mean, sigma)) + " ";
  }
  return d;
}

function areaPathD(mean: number, sigma: number, xStart: number, xEnd: number) {
  const steps = 40;
  let d = "M " + xToSvg(xStart) + " " + BASELINE_Y + " ";
  for (let i = 0; i <= steps; i++) {
    const x = xStart + ((xEnd - xStart) * i) / steps;
    d += "L " + xToSvg(x) + " " + yToSvg(normalPdf(x, mean, sigma)) + " ";
  }
  d += "L " + xToSvg(xEnd) + " " + BASELINE_Y + " Z";
  return d;
}

/* 2.1.2 — draggable decision threshold between two class-conditional densities;
   a cost slider moves the true cost-weighted optimum away from the 50/50 crossing. */
const renderBayesThreshold: DiagramRender = (host) => {
  const s = svg("0 0 360 235");

  s.appendChild(
    el("line", {
      x1: 20,
      y1: BASELINE_Y,
      x2: 340,
      y2: BASELINE_Y,
      stroke: "#c7cbdc",
      "stroke-width": 1.5,
    }),
  );

  const fpRegion = el("path", { d: "", fill: "#dc2626", opacity: 0.28 });
  const fnRegion = el("path", { d: "", fill: "#f59e0b", opacity: 0.32 });
  s.appendChild(fpRegion);
  s.appendChild(fnRegion);

  const curve0 = el("path", {
    d: curvePathD(MU0, SIGMA),
    fill: "none",
    stroke: "#4f5fe0",
    "stroke-width": 2.5,
  });
  const curve1 = el("path", {
    d: curvePathD(MU1, SIGMA),
    fill: "none",
    stroke: "#1f8a5f",
    "stroke-width": 2.5,
  });
  s.appendChild(curve0);
  s.appendChild(curve1);

  const optLine = el("line", {
    x1: 0,
    y1: 20,
    x2: 0,
    y2: BASELINE_Y,
    stroke: "#7c3aed",
    "stroke-width": 2,
    "stroke-dasharray": "5,4",
  });
  s.appendChild(optLine);

  const userLine = el("line", {
    x1: 0,
    y1: 20,
    x2: 0,
    y2: BASELINE_Y,
    stroke: "#2a2f45",
    "stroke-width": 2.5,
  });
  s.appendChild(userLine);
  const handle = dragHandle(0, 20, "#2a2f45");
  s.appendChild(handle);

  const peakY = yToSvg(normalPdf(MU0, MU0, SIGMA));
  const label0 = el("text", {
    x: xToSvg(MU0),
    y: peakY - 10,
    "text-anchor": "middle",
    "font-size": 11,
    fill: "#4f5fe0",
  });
  label0.textContent = "P(x | y=0)";
  const label1 = el("text", {
    x: xToSvg(MU1),
    y: peakY - 10,
    "text-anchor": "middle",
    "font-size": 11,
    fill: "#1f8a5f",
  });
  label1.textContent = "P(x | y=1)";
  s.appendChild(label0);
  s.appendChild(label1);

  host.appendChild(s);
  const out = readout(host, "");

  let t = 160;
  let costFN = 1;

  function redraw() {
    const tx = xToSvg(t);
    userLine.setAttribute("x1", String(tx));
    userLine.setAttribute("x2", String(tx));
    handle.setAttribute("cx", String(tx));

    fpRegion.setAttribute("d", areaPathD(MU0, SIGMA, t, DOMAIN_MAX));
    fnRegion.setAttribute("d", areaPathD(MU1, SIGMA, 0, t));

    const tStarRaw = optimalThreshold(costFN);
    const ox = xToSvg(clampDomain(tStarRaw));
    optLine.setAttribute("x1", String(ox));
    optLine.setAttribute("x2", String(ox));

    const fpRate = 1 - normalCdf(t, MU0, SIGMA);
    const fnRate = normalCdf(t, MU1, SIGMA);
    const loss = 0.5 * fpRate + 0.5 * fnRate * costFN;

    out.set(
      "t = " +
        t.toFixed(0) +
        "   false positives = " +
        (fpRate * 100).toFixed(1) +
        "%   false negatives = " +
        (fnRate * 100).toFixed(1) +
        "%   expected loss = " +
        loss.toFixed(3) +
        "   cost-optimal t* ≈ " +
        tStarRaw.toFixed(0),
    );
  }
  redraw();

  // ---- autoplay intro: cancellable chain of animate() calls, tracked so a
  // manual drag/slider touch or a component unmount can stop it mid-flight. ----
  const introCancels: Array<() => void> = [];
  function stopIntro() {
    introCancels.forEach((cancel) => cancel());
    introCancels.length = 0;
  }

  // Sweeps the threshold handle across the whole domain and back, settling
  // exactly on the equal-cost optimum, then rocks the cost slider up and down
  // so the purple cost-optimal marker visibly slides — all before the reader
  // has touched anything. The shaded regions and readout update every frame
  // because they're driven by the same `redraw()` the manual controls use.
  function playIntro() {
    stopIntro();
    t = 0;
    costFN = 1;
    costInput.value = "1";
    redraw();

    introCancels.push(
      animate(
        900,
        (eased) => {
          t = eased * DOMAIN_MAX;
          redraw();
        },
        () => {
          introCancels.push(
            animate(
              700,
              (eased) => {
                t = DOMAIN_MAX + (160 - DOMAIN_MAX) * eased;
                redraw();
              },
              () => {
                t = 160;
                redraw();
                introCancels.push(
                  animate(
                    650,
                    (eased) => {
                      costFN = 1 + eased * 3;
                      costInput.value = costFN.toFixed(2);
                      redraw();
                    },
                    () => {
                      introCancels.push(
                        animate(
                          650,
                          (eased) => {
                            costFN = 4 - eased * 3;
                            costInput.value = costFN.toFixed(2);
                            redraw();
                          },
                          () => {
                            costFN = 1;
                            costInput.value = "1";
                            redraw();
                          },
                          ease.inOutCubic,
                        ),
                      );
                    },
                    ease.inOutCubic,
                  ),
                );
              },
              ease.inOutCubic,
            ),
          );
        },
        ease.inOutCubic,
      ),
    );
  }

  const stopDrag = makeDraggable(handle, s, (p) => {
    stopIntro();
    t = clampDomain(p.x - 20);
    redraw();
  });

  const costInput = sliderControl(
    host,
    "False-negative cost multiplier",
    { min: 1, max: 6, step: 0.5, value: 1 },
    (v) => {
      stopIntro();
      costFN = v;
      redraw();
    },
  );

  replayButton(host, "↻ Reset to equal-cost optimum", () => {
    stopIntro();
    t = 160;
    costFN = 1;
    costInput.value = "1";
    redraw();
  });

  replayButton(host, "▶ Replay intro animation", playIntro);

  playIntro();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    'This diagram plays a short intro automatically when it loads, sweeping the threshold and rocking the cost slider so both controls\' effects are visible before you touch anything — click "Replay intro animation" to watch it again. Drag the dark handle to move your decision threshold t. Red shading is the false-positive region (predicting class 1 when the truth is class 0); orange is false negatives. The purple dashed line is the mathematically cost-optimal threshold for whatever false-negative cost you set on the slider — raise it and watch the optimum slide left, away from the equal-cost crossing point at t=160.';
  host.appendChild(hint);

  return () => {
    stopDrag();
    stopIntro();
  };
};

export function StatisticalDecisionTheory() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> the previous topic (2.1.1) said models are trained by
          minimizing average loss on the training set. But the number you actually care about is how
          the model does on <em>new</em> data it hasn&apos;t seen — that quantity is called{" "}
          <strong>risk</strong>. And if you could somehow know the entire true, infinite
          distribution the data comes from, there would be a single best possible prediction rule
          for it — not a perfect one, just the best one achievable. That rule is called the{" "}
          <strong>Bayes-optimal predictor</strong>. No real model ever reaches it exactly (you never
          have infinite data or the true distribution), but every model is, in a precise sense,
          trying to approximate it.
        </p>
        <p>
          <strong>Intermediate:</strong> training loss is an average over your finite sample;{" "}
          <strong>expected risk</strong> is the same average taken over the entire true data
          distribution — training loss is just a noisy, finite-sample estimate of it. The Bayes-
          optimal predictor <code>f*</code> is whichever function minimizes that true risk, and the
          risk it achieves, <code>R*</code>, is called the <strong>Bayes risk</strong> — a hard
          floor on how well <em>any</em> function could ever do on this problem, no matter how much
          data or compute you throw at it. It exists because of genuine, irreducible randomness in
          how <code>y</code> relates to <code>x</code> (two patients with identical measurable
          symptoms can have different outcomes).
        </p>
        <p>
          <strong>Advanced:</strong> here is the idea that ties this whole topic together — what
          counts as &quot;best&quot; is not fixed; it&apos;s entirely determined by which loss
          function you pick. Under <strong>squared loss</strong>, the best possible prediction for a
          given input is the <em>conditional mean</em> of the target. Under{" "}
          <strong>absolute loss</strong>, it&apos;s the <em>conditional median</em>. Under{" "}
          <strong>0-1 loss</strong> (classification), it&apos;s the <em>most probable class</em>{" "}
          (the mode of the label distribution). These aren&apos;t three different approximations of
          the same target — they are three different targets. Changing your loss function silently
          changes the statistical quantity your model is even trying to learn, which is exactly why
          the choice of loss deserves this much scrutiny before you ever pick a model class.
        </p>
        <p>
          <strong>Worked example — one number, by hand:</strong> abstractions like &quot;the
          Bayes-optimal predictor picks the more probable class&quot; are easy to nod along to and
          hard to actually trust until you&apos;ve pushed a real number through the machinery once.
          So take the exact setup the diagram below uses: two classes with equal priors{" "}
          <code>P(y=0) = P(y=1) = 0.5</code>, and class-conditional densities that are both Gaussian
          with the same spread, <code>σ = 35</code>, but centered at different means —{" "}
          <code>μ₀ = 110</code> for class 0 and <code>μ₁ = 210</code> for class 1. Pick a single
          input value, say <code>x = 140</code>, and ask what the Bayes-optimal predictor does
          there. First get each class-conditional density at that point (plugging into the normal
          density formula from the Formula block below): <code>p(x=140 | y=0) ≈ 0.0079</code>,
          noticeably higher than <code>p(x=140 | y=1) ≈ 0.0015</code>, because 140 sits only 30
          units from <code>μ₀</code> but a full 70 units from <code>μ₁</code>. Weight each by its
          prior (both 0.5 here, so this step just halves them): joint terms <code>0.00394</code> and{" "}
          <code>0.00077</code>. Bayes&apos; rule says the posterior is each joint term divided by
          their sum (the &quot;evidence&quot;, <code>≈ 0.00471</code>), which gives{" "}
          <code>{"P(y=1 | x=140) ≈ 0.163"}</code> — about a 16% chance of class 1, hence an 84%
          chance of class 0. Since 0.163 is nowhere close to crossing one half, the 0-1-loss
          Bayes-optimal rule derived later in this page confidently predicts class 0 at{" "}
          <code>x = 140</code>. Notice this is the very same <code>x = 140</code> printed in the
          Python and C++ code samples further down — run either one and you&apos;ll see it print
          almost exactly <code>0.163</code>, because that code is doing, in a loop, the identical
          three-step arithmetic (density → joint → normalize) just performed here by hand. Slide
          that same arithmetic along the x-axis and the posterior crosses exactly one half at{" "}
          <code>x = 160</code> — the midpoint of the two means whenever the variances and priors
          match — which is exactly where the diagram&apos;s equal-cost optimum sits, and exactly the
          boundary the derivation below proves in general.
        </p>
      </SectionBlock>

      <SectionBlock id="formula" label="Formula" tone="formula">
        <p className="mb-1">
          Expected risk of a predictor <code>f</code>, and the Bayes risk it&apos;s measured
          against:
        </p>
        <Formula>
          {"R(f) = \\mathbb{E}_{(x,y)\\sim P}\\big[L(f(x), y)\\big] \\qquad R^{*} = \\min_{f} R(f)"}
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          <code>P</code> is the true (unknown) joint distribution over inputs and labels;{" "}
          <code>L</code> is a loss function measuring how bad a prediction is. The three losses
          named in the syllabus for this topic:
        </p>
        <Formula>{"\\text{0-1 loss:}\\quad L(f(x), y) = \\mathbb{1}[f(x) \\neq y]"}</Formula>
        <Formula>{"\\text{Squared loss:}\\quad L(f(x), y) = (f(x) - y)^2"}</Formula>
        <Formula>{"\\text{Absolute loss:}\\quad L(f(x), y) = |f(x) - y|"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          0-1 loss is for classification (it just counts mistakes); squared and absolute loss are
          for regression, and they disagree about which errors hurt more — squared loss punishes a
          miss of 10 units a hundred times harder than a miss of 1 unit, while absolute loss scales
          the punishment linearly.
        </p>
      </SectionBlock>

      <Derivation
        id="derivation"
        title="Derivation: what the Bayes-optimal predictor actually is, under squared loss and under 0-1 loss"
      >
        <p>
          <strong>Case 1 — regression, squared loss.</strong> Fix an input <code>x</code> and ask:
          what single number <code>f(x)</code> minimizes expected squared error, given everything
          that&apos;s knowable about <code>y</code> at that <code>x</code>? Write{" "}
          <code>m(x) = E[Y | X=x]</code> for the true conditional mean, and add and subtract it
          inside the square — a completely legal, zero-net-effect algebraic trick:
        </p>
        <Formula>
          {
            "\\mathbb{E}\\big[(f(x)-Y)^2 \\mid X=x\\big] = \\mathbb{E}\\Big[\\big((f(x)-m(x)) - (Y-m(x))\\big)^2 \\mid X=x\\Big]"
          }
        </Formula>
        <p>Expand the square on the right — three terms, no approximation yet:</p>
        <Formula>
          {
            "= (f(x)-m(x))^2 \\;-\\; 2(f(x)-m(x))\\,\\mathbb{E}[Y-m(x) \\mid X=x] \\;+\\; \\mathbb{E}\\big[(Y-m(x))^2 \\mid X=x\\big]"
          }
        </Formula>
        <p>
          The middle term is where everything collapses. <code>f(x) - m(x)</code> is just a constant
          once <code>x</code> is fixed — it doesn&apos;t depend on the random variable{" "}
          <code>Y</code>, so it pulls straight out of the expectation. What&apos;s left inside,{" "}
          <code>E[Y - m(x) | X=x]</code>, is exactly zero by the very definition of{" "}
          <code>m(x)</code> as the conditional mean — a mean is, by construction, the point that
          deviations average out around. So the whole middle term vanishes, leaving:
        </p>
        <Formula>
          {
            "\\mathbb{E}\\big[(f(x)-Y)^2 \\mid X=x\\big] = (f(x)-m(x))^2 + \\operatorname{Var}(Y \\mid X=x)"
          }
        </Formula>
        <p>
          The second term doesn&apos;t involve <code>f</code> at all — it&apos;s pure, irreducible
          noise in the relationship between <code>x</code> and <code>y</code>. The first term is the
          only piece you control, and it&apos;s a square, so it can never go negative — its minimum
          possible value, zero, is achieved at exactly one point:
        </p>
        <Formula>{"f^{*}(x) = m(x) = \\mathbb{E}[Y \\mid X=x]"}</Formula>
        <p>
          The Bayes-optimal regressor under squared loss is the conditional mean, full stop — and
          the leftover <code>Var(Y|X=x)</code> at that optimum is precisely the Bayes risk: the
          error you cannot train away no matter how good your model gets, because it&apos;s
          randomness in the data-generating process itself, not a deficiency of any function{" "}
          <code>f</code>.
        </p>
        <p>
          <strong>Case 2 — binary classification, 0-1 loss.</strong> Fix <code>x</code> again, and
          consider a deterministic guess <code>c ∈ {"{0, 1}"}</code>. Its expected 0-1 loss at this{" "}
          <code>x</code> is just the probability the guess is wrong:
        </p>
        <Formula>
          {
            "\\mathbb{E}\\big[\\mathbb{1}[c \\neq Y] \\mid X=x\\big] = P(Y \\neq c \\mid X=x) = 1 - P(Y=c \\mid X=x)"
          }
        </Formula>
        <p>
          Minimizing <code>1 − P(Y=c|X=x)</code> over the two choices of <code>c</code> is the same
          as maximizing <code>P(Y=c|X=x)</code> — pick whichever label the data thinks is more
          probable at this <code>x</code>. Since there are only two classes,{" "}
          <code>P(Y=1|X=x) + P(Y=0|X=x) = 1</code>, so <code>P(Y=1|X=x)</code> is the larger of the
          two exactly when it exceeds one half:
        </p>
        <Formula>{"f^{*}(x) = \\mathbb{1}\\big[\\,P(Y=1 \\mid X=x) > 0.5\\,\\big]"}</Formula>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is not a coincidence of notation — it is the
          reason squared-error regressors (linear regression, most neural-net regression heads) are
          trained the way they are: minimizing squared loss forces the network toward outputting{" "}
          <code>E[Y|X]</code>, whether anyone designing it thought about it in those terms or not.
          It&apos;s also exactly why probabilistic classifiers (logistic regression, a softmax head
          followed by argmax) compare their output probability to 0.5. But look closely at the
          derivation for case 2 — the 0.5 threshold only fell out because we assumed a false
          positive and a false negative cost <em>exactly the same amount</em>. Change that
          assumption — a missed cancer diagnosis is far worse than an unnecessary follow-up test —
          and the optimal threshold is provably no longer 0.5. That reweighting is called
          cost-sensitive learning, covered in a later module; the diagram below lets you feel it
          directly.
        </p>
      </Derivation>

      <DiagramBlock
        id="diagram"
        title="Drag the decision threshold between two overlapping classes"
        caption="Two class-conditional distributions with equal priors and equal variance. The purple dashed line is the true cost-optimal threshold for the cost ratio on the slider; drag your own threshold and watch the expected loss change relative to it."
      >
        <DiagramHost render={renderBayesThreshold} />
      </DiagramBlock>

      <MultiCodeExample
        id="implementations"
        title="Implemented three ways — a Bayes-optimal Gaussian classifier"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import math

def gaussian_pdf(x, mean, var):
    """N(x; mean, var) -- the class-conditional density p(x | y)."""
    coeff = 1.0 / math.sqrt(2.0 * math.pi * var)
    return coeff * math.exp(-((x - mean) ** 2) / (2.0 * var))

def posterior(x, params):
    """
    params: dict of class label -> (mean, var, prior).
    Returns dict of class label -> P(y=class | x), computed explicitly via
    Bayes' rule -- no library does this lookup for us:

        P(y=c | x) = P(x | y=c) * P(y=c) / sum_c'( P(x | y=c') * P(y=c') )
    """
    joint = {c: gaussian_pdf(x, mean, var) * prior for c, (mean, var, prior) in params.items()}
    evidence = sum(joint.values())
    return {c: j / evidence for c, j in joint.items()}

def bayes_classify(x, params):
    """The Bayes-optimal predictor under 0-1 loss: pick whichever class has the
    higher posterior probability (see the derivation in the lesson)."""
    post = posterior(x, params)
    return max(post, key=post.get)

# Two classes, both Gaussian, with the SAME variance -> the boundary collapses
# to a single point instead of a curve (the "equal-variance" special case).
mean0, mean1 = 110.0, 210.0
var0 = var1 = 35.0 ** 2
prior0 = prior1 = 0.5

params = {
    0: (mean0, var0, prior0),
    1: (mean1, var1, prior1),
}

for x in (60.0, 110.0, 140.0, 160.0, 172.0, 210.0, 260.0):
    post = posterior(x, params)
    pred = bayes_classify(x, params)
    print("x=%6.1f  P(y=1|x)=%.3f  predict=%d" % (x, post[1], pred))

# Closed form for the equal-variance, equal-prior case: the two posteriors are
# exactly equal at the midpoint of the two means (derived by setting the two
# weighted densities equal and taking logs -- the quadratic terms cancel
# because the variances are identical, leaving a linear equation in x).
boundary = (mean0 + mean1) / 2.0
print("Analytic Bayes-optimal decision boundary: x* = %.2f" % boundary)`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <array>
#include <cmath>
#include <cstdio>

struct GaussianClass {
    double mean;
    double variance;
    double prior;
};

double gaussianPdf(double x, double mean, double variance) {
    const double coeff = 1.0 / std::sqrt(2.0 * M_PI * variance);
    const double z = (x - mean) * (x - mean) / (2.0 * variance);
    return coeff * std::exp(-z);
}

// Posterior P(y=1 | x) via Bayes' rule, computed explicitly for two classes.
double posteriorClass1(double x, const GaussianClass& c0, const GaussianClass& c1) {
    const double joint0 = gaussianPdf(x, c0.mean, c0.variance) * c0.prior;
    const double joint1 = gaussianPdf(x, c1.mean, c1.variance) * c1.prior;
    return joint1 / (joint0 + joint1);
}

// The Bayes-optimal predictor under 0-1 loss: predict class 1 iff its
// posterior exceeds 0.5 (see the derivation in the lesson).
int bayesClassify(double x, const GaussianClass& c0, const GaussianClass& c1) {
    return posteriorClass1(x, c0, c1) > 0.5 ? 1 : 0;
}

int main() {
    GaussianClass class0{110.0, 35.0 * 35.0, 0.5};
    GaussianClass class1{210.0, 35.0 * 35.0, 0.5}; // equal variance case

    const std::array<double, 7> samples = {60.0, 110.0, 140.0, 160.0, 172.0, 210.0, 260.0};
    for (double x : samples) {
        const double p1 = posteriorClass1(x, class0, class1);
        const int pred = bayesClassify(x, class0, class1);
        std::printf("x=%6.1f  P(y=1|x)=%.3f  predict=%d\\n", x, p1, pred);
    }

    // Equal-variance closed form: boundary sits at the midpoint of the means.
    const double boundary = (class0.mean + class1.mean) / 2.0;
    std::printf("Analytic Bayes-optimal decision boundary: x* = %.2f\\n", boundary);
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

rng = np.random.default_rng(42)
mean0, mean1, sigma = 110.0, 210.0, 35.0
n_per_class = 2000

x0 = rng.normal(mean0, sigma, n_per_class)
x1 = rng.normal(mean1, sigma, n_per_class)

X = np.concatenate([x0, x1]).reshape(-1, 1)
y = np.concatenate([np.zeros(n_per_class), np.ones(n_per_class)])

# LDA assumes shared covariance across classes -- exactly the assumption
# that makes the Bayes-optimal boundary collapse to a single linear
# threshold instead of a curve, which is what we derived by hand above.
clf = LinearDiscriminantAnalysis()
clf.fit(X, y)

boundary = -clf.intercept_[0] / clf.coef_[0][0]
print("LDA-recovered decision boundary: x* = %.2f" % boundary)
print("Hand-derived Bayes-optimal boundary was: x* = 160.00")

# GaussianNB makes the same equal-shape assumption per class and recovers a
# near-identical boundary, just estimated slightly differently under the hood.
from sklearn.naive_bayes import GaussianNB

nb = GaussianNB()
nb.fit(X, y)
probe = np.linspace(60, 260, 5).reshape(-1, 1)
for x_val, p in zip(probe.ravel(), nb.predict_proba(probe)[:, 1]):
    print("x=%6.1f  GaussianNB P(y=1|x)=%.3f" % (x_val, p))`,
          },
        ]}
      >
        <p>
          The from-scratch versions compute the posterior by hand, exactly the way the derivation
          above says to — no library call hides the Bayes&apos;-rule step. The library version fits
          on <em>sampled</em> data (not the true parameters) and still recovers essentially the same
          boundary, which is the whole point: with enough data, a well-matched model finds its way
          back to the theoretical optimum.
        </p>
      </MultiCodeExample>

      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Medical screening.</strong> A test that outputs{" "}
            <code>P(disease | test result)</code> should almost never threshold at 0.5. Suppose a
            missed cancer case is judged, in expected downstream harm, 9× worse than an unnecessary
            follow-up biopsy — exactly the cost ratio used in the quiz below. Setting the two
            cost-weighted expected losses equal (the same algebra behind{" "}
            <code>optimalThreshold</code> in the diagram) pushes the decision boundary down from 0.5
            to roughly a 10% predicted-probability cutoff before the test flags &quot;positive, go
            biopsy&quot; — deliberately accepting far more false alarms in exchange for catching
            nearly every real case.
          </li>
          <li>
            <strong>Fraud detection.</strong> A card issuer scoring &quot;is this transaction
            fraudulent&quot; faces two very differently priced mistakes: a missed fraud (false
            negative) is a direct dollar loss plus a chargeback, while a false positive means
            declining a legitimate purchase and annoying a real customer. Because fraud is also rare
            (a heavily skewed prior, not just an asymmetric cost), issuers score every transaction
            and set the alert threshold low enough to catch most fraud while keeping the
            false-positive rate tolerable — then route the ambiguous middle band to a human reviewer
            rather than trusting either raw class of decision alone.
          </li>
          <li>
            <strong>Spam filtering.</strong> The asymmetry runs the other way from medical
            screening: sending a real client email to spam (a false positive on the &quot;is
            spam&quot; label) is usually judged worse than letting one extra spam message through (a
            false negative), so production filters often push the spam threshold <em>above</em> 0.5
            rather than below it — the same math as the biopsy example, just with the cost ratio
            flipped to favor the opposite error.
          </li>
          <li>
            <strong>Insurance underwriting.</strong> An insurer estimating{" "}
            <code>P(claim | applicant features)</code> doesn&apos;t threshold that probability into
            a binary accept/reject at all in most lines of business — it feeds an explicit actuarial
            cost matrix (expected claim payout vs. lost premium revenue from declining a profitable
            policy) to set both the accept/decline boundary <em>and</em> the premium charged in the
            gray zone, which is the cost-sensitive framework from this lesson applied continuously
            rather than at one fixed cutoff.
          </li>
          <li>
            <strong>Hiring and credit decisions — and their fairness cost.</strong> A resume
            screener or a loan-approval model that thresholds a predicted score at whatever value
            minimizes aggregate expected cost can still produce very different false-negative rates
            across subgroups if the underlying class-conditional distributions (or the base rates)
            differ by group — the same asymmetric-cost machinery that correctly favors sensitivity
            in medical screening can just as easily encode and launder discrimination if the
            &quot;cost&quot; being minimized was never audited for whose errors it&apos;s willing to
            tolerate. This is precisely why fairness-aware ML treats the decision threshold, not
            just the model&apos;s scores, as something requiring its own scrutiny.
          </li>
          <li>
            <strong>Industrial quality control.</strong> A vision model deciding whether a
            manufactured part passes inspection faces a stark cost asymmetry: shipping one defective
            brake component (a false negative) can mean a recall and lawsuits, while scrapping one
            good part (a false positive) costs only that part&apos;s material and labor. With a cost
            ratio that can run into the hundreds, the optimal threshold sits far below 0.5 — the
            line will happily flag 30% of good parts for human re-inspection if that is what it
            takes to drive the false-negative rate near zero.
          </li>
          <li>
            <strong>Weather forecasting.</strong> &quot;70% chance of rain&quot; is not trying to be
            a single best point guess minimizing some loss — it is a probability meant to be{" "}
            <em>calibrated</em> (it should rain on roughly 70% of days that get that forecast).
            Point predictions born from a loss function and calibrated probabilities are related but
            distinct goals, and conflating them is a common source of confusion when reading model
            output.
          </li>
        </ul>
      </SectionBlock>

      <Pitfall>
        <ul>
          <li>
            Treating 0.5 as a universal, loss-function-blessed decision threshold. It is only
            optimal under 0-1 loss with equal costs for both error types — as soon as false
            positives and false negatives cost different amounts, the derivation above shows the
            optimal threshold provably moves.
          </li>
          <li>
            Conflating the <strong>Bayes-optimal predictor</strong> (a theoretical ideal defined
            using the true, unknowable data distribution) with &quot;the best model I can actually
            fit.&quot; Any real model is also constrained by its hypothesis class and by having only
            a finite training sample — the gap between what you can achieve and the Bayes risk is
            exactly what the next topic, 2.1.3 Bias-Variance Trade-off, breaks apart into named,
            separately-addressable pieces.
          </li>
          <li>
            Reaching for squared loss by default without asking what you actually want estimated. If
            your target variable has a long tail or outliers, the conditional mean (what squared
            loss targets) can be dragged far from where most of the data actually sits, while the
            conditional median (what absolute loss targets) stays put — this is precisely the
            motivation for quantile regression, covered in a later module.
          </li>
        </ul>
      </Pitfall>

      <ExpertNote>
        <p>
          Every loss function silently names a target statistic of <code>Y | X=x</code>: squared
          loss names the mean, absolute loss names the median, 0-1 loss names the mode. This is not
          a coincidence restricted to these three — it generalizes completely. The{" "}
          <strong>pinball loss</strong> (also called quantile loss), parameterized by a quantile
          level <code>τ ∈ (0, 1)</code>, is asymmetric: it penalizes over-prediction and
          under-prediction by different amounts depending on <code>τ</code>, and its Bayes- optimal
          predictor is exactly the <code>τ</code>-th conditional quantile of <code>Y | X=x</code>.
          Absolute loss is the special case <code>τ = 0.5</code> (the median). This is how models
          that output prediction intervals — &quot;80% of the time, the true value falls between
          these two numbers&quot; — are trained: fit two quantile regressors at <code>τ = 0.1</code>{" "}
          and <code>τ = 0.9</code>, and the gap between them is your interval.
        </p>
      </ExpertNote>

      <Quiz
        q="A hospital's screening classifier outputs a calibrated P(disease | test result). Missing a true case is judged 9× worse than a false alarm. Should the hospital still flag a patient as positive only when this probability exceeds 0.5?"
        a="No. Thresholding at 0.5 is only Bayes-optimal under 0-1 loss with equal costs for both error types. With a 9:1 cost ratio favoring catching true cases, the same derivation used in this lesson (setting the two cost-weighted expected losses equal) pushes the optimal threshold below 0.5 — the hospital should flag positive at a lower probability cutoff so it stops missing as many real cases, accepting more false alarms as the deliberate trade-off. The interactive diagram's cost slider shows exactly this shift."
      />

      <Takeaway>
        <p>
          Risk is loss averaged over the true data distribution, not the training set; the Bayes-
          optimal predictor is the best any function could ever do against that risk, and it is a
          different mathematical object — mean, median, or mode of <code>Y|X</code> — depending
          entirely on which loss you chose. Every later model in this chapter is, underneath its
          specific machinery, an attempt to approximate one of these three targets from finite,
          noisy data.
        </p>
      </Takeaway>
    </>
  );
}
