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
  animate,
  ease,
  replayButton,
} from "@/lib/diagram-helpers";

const fmt = (n: number) => (Math.round(n * 1000) / 1000).toString();

/** Mode of Beta(a, b), falling back to 0.5 at the degenerate a=b=1, no-data boundary
 *  where numerator and denominator both vanish (the uniform-prior, zero-flips case). */
function betaModeOrFallback(a: number, b: number): number {
  const denom = a + b - 2;
  if (Math.abs(denom) < 1e-9) return 0.5;
  const mode = (a - 1) / denom;
  return Math.max(0, Math.min(1, mode));
}

/* Coin-flip MLE vs. MAP: prior density and posterior density over p, plus live
 * MLE/MAP markers. Both densities are computed from the raw Beta-density formula and
 * normalized numerically over a grid — no Gamma function, no stats library. */
const renderMleMapPosterior: DiagramRender = (host) => {
  const width = 360;
  const height = 232;
  const padL = 34;
  const padR = 14;
  const padT = 28;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const baseY = height - padB;

  const s = svg(`0 0 ${width} ${height}`);

  s.appendChild(
    el("line", {
      x1: padL,
      y1: baseY,
      x2: width - padR,
      y2: baseY,
      stroke: "#c7cbdc",
      "stroke-width": 1.5,
    }),
  );
  [0, 0.5, 1].forEach((p) => {
    const x = padL + p * plotW;
    s.appendChild(
      el("line", { x1: x, y1: baseY, x2: x, y2: baseY + 4, stroke: "#c7cbdc", "stroke-width": 1 }),
    );
    const label = el(
      "text",
      { x, y: baseY + 16, "font-size": 10, "text-anchor": "middle", fill: "#8b8fa3" },
      [],
    );
    label.textContent = String(p);
    s.appendChild(label);
  });
  const axisCaption = el(
    "text",
    {
      x: padL + plotW / 2,
      y: height - 3,
      "font-size": 10,
      "text-anchor": "middle",
      fill: "#8b8fa3",
    },
    [],
  );
  axisCaption.textContent = "coin bias p";
  s.appendChild(axisCaption);

  const postFill = el("path", { d: "", fill: "#4f5fe0", "fill-opacity": "0.12", stroke: "none" });
  const priorPath = el("path", {
    d: "",
    fill: "none",
    stroke: "#b8720c",
    "stroke-width": 2,
    "stroke-dasharray": "5,4",
  });
  const postPath = el("path", { d: "", fill: "none", stroke: "#4f5fe0", "stroke-width": 2.5 });
  s.appendChild(postFill);
  s.appendChild(priorPath);
  s.appendChild(postPath);

  const mleLine = el("line", {
    x1: padL,
    y1: padT,
    x2: padL,
    y2: baseY,
    stroke: "#1f8a5f",
    "stroke-width": 2,
    "stroke-dasharray": "3,3",
  });
  const mapLine = el("line", {
    x1: padL,
    y1: padT,
    x2: padL,
    y2: baseY,
    stroke: "#7c3aed",
    "stroke-width": 2.5,
  });
  s.appendChild(mleLine);
  s.appendChild(mapLine);

  const mleLabel = el(
    "text",
    {
      x: padL,
      y: padT - 16,
      "font-size": 10,
      "text-anchor": "middle",
      fill: "#1f8a5f",
      "font-weight": 600,
    },
    [],
  );
  mleLabel.textContent = "MLE";
  const mapLabel = el(
    "text",
    {
      x: padL,
      y: padT - 4,
      "font-size": 10,
      "text-anchor": "middle",
      fill: "#7c3aed",
      "font-weight": 600,
    },
    [],
  );
  mapLabel.textContent = "MAP";
  s.appendChild(mleLabel);
  s.appendChild(mapLabel);

  host.appendChild(s);

  const legend = document.createElement("div");
  legend.className =
    "mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground";
  function legendItem(color: string, label: string, dashed: boolean) {
    const item = document.createElement("span");
    item.className = "inline-flex items-center gap-1.5";
    const swatch = document.createElement("span");
    swatch.style.display = "inline-block";
    swatch.style.width = "14px";
    if (dashed) {
      swatch.style.borderTop = `2px dashed ${color}`;
    } else {
      swatch.style.height = "3px";
      swatch.style.background = color;
      swatch.style.borderRadius = "2px";
    }
    const text = document.createElement("span");
    text.textContent = label;
    item.appendChild(swatch);
    item.appendChild(text);
    return item;
  }
  legend.appendChild(legendItem("#b8720c", "Prior density", true));
  legend.appendChild(legendItem("#4f5fe0", "Posterior density", false));
  legend.appendChild(legendItem("#1f8a5f", "MLE (peak of likelihood)", true));
  legend.appendChild(legendItem("#7c3aed", "MAP (peak of posterior)", false));
  host.appendChild(legend);

  const out = readout(host, "");

  let heads = 0;
  let tails = 0;
  let strength = 4; // symmetric prior Beta(strength, strength), mode fixed at p=0.5

  const GRID = 121;

  function draw() {
    const alpha = strength;
    const beta = strength;
    const priorVals: number[] = [];
    const postVals: number[] = [];
    for (let i = 0; i < GRID; i++) {
      const p = i / (GRID - 1);
      priorVals.push(Math.pow(p, alpha - 1) * Math.pow(1 - p, beta - 1));
      postVals.push(Math.pow(p, alpha + heads - 1) * Math.pow(1 - p, beta + tails - 1));
    }
    const step = 1 / (GRID - 1);
    const priorMass = priorVals.reduce((sum, v) => sum + v, 0) * step;
    const postMass = postVals.reduce((sum, v) => sum + v, 0) * step;
    const priorDensity = priorVals.map((v) => v / priorMass);
    const postDensity = postVals.map((v) => v / postMass);
    const maxDensity = Math.max(...priorDensity, ...postDensity);

    const xAt = (i: number) => padL + (i / (GRID - 1)) * plotW;
    const yAt = (v: number) => baseY - (v / maxDensity) * plotH;

    let priorD = "";
    let postD = "";
    const postPts: string[] = [];
    for (let i = 0; i < GRID; i++) {
      const x = xAt(i);
      const yPr = yAt(priorDensity[i]);
      const yPo = yAt(postDensity[i]);
      priorD += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + yPr.toFixed(2) + " ";
      postD += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + yPo.toFixed(2) + " ";
      postPts.push(x.toFixed(2) + "," + yPo.toFixed(2));
    }
    priorPath.setAttribute("d", priorD.trim());
    postPath.setAttribute("d", postD.trim());
    postFill.setAttribute(
      "d",
      `M${xAt(0).toFixed(2)},${baseY} L${postPts.join(" L")} L${xAt(GRID - 1).toFixed(2)},${baseY} Z`,
    );

    const n = heads + tails;
    const noFlips = n === 0;
    const mleP = noFlips ? 0.5 : heads / n;
    const mapP = betaModeOrFallback(alpha + heads, beta + tails);

    const mleX = padL + mleP * plotW;
    const mapX = padL + mapP * plotW;
    mleLine.setAttribute("x1", String(mleX));
    mleLine.setAttribute("x2", String(mleX));
    mapLine.setAttribute("x1", String(mapX));
    mapLine.setAttribute("x2", String(mapX));
    mleLine.setAttribute("opacity", noFlips ? "0.3" : "1");
    mleLabel.setAttribute("x", String(mleX));
    mapLabel.setAttribute("x", String(mapX));

    out.set(
      `heads=${heads}  tails=${tails}  prior α=β=${strength}   →   MLE p̂ = ${
        noFlips ? "undefined (no flips yet)" : fmt(mleP)
      }   MAP p̂ = ${fmt(mapP)}`,
    );
  }
  draw();

  // --- Autoplay intro: grow the sample from zero flips up to a large one, prior held
  // fixed, so the MAP marker visibly slides off the prior's mode (p=0.5) and onto the
  // MLE marker as simulated data accumulates -- the convergence claim from the
  // derivation, shown happening rather than just stated.
  let cancelIntro: (() => void) | null = null;
  const INTRO_FINAL_HEADS = 21;
  const INTRO_FINAL_TAILS = 9;

  function cancelIntroIfRunning() {
    if (cancelIntro) {
      cancelIntro();
      cancelIntro = null;
    }
  }

  function playIntro() {
    cancelIntroIfRunning();
    heads = 0;
    tails = 0;
    draw();
    cancelIntro = animate(
      2500,
      (eased) => {
        heads = Math.round(INTRO_FINAL_HEADS * eased);
        tails = Math.round(INTRO_FINAL_TAILS * eased);
        draw();
      },
      () => {
        heads = INTRO_FINAL_HEADS;
        tails = INTRO_FINAL_TAILS;
        draw();
        headsSlider.value = String(heads);
        tailsSlider.value = String(tails);
        cancelIntro = null;
      },
      ease.inOutCubic,
    );
  }

  const headsSlider = sliderControl(
    host,
    "Heads observed",
    { min: 0, max: 30, step: 1, value: heads },
    (v) => {
      cancelIntroIfRunning();
      heads = v;
      draw();
    },
  );
  const tailsSlider = sliderControl(
    host,
    "Tails observed",
    { min: 0, max: 30, step: 1, value: tails },
    (v) => {
      cancelIntroIfRunning();
      tails = v;
      draw();
    },
  );
  sliderControl(
    host,
    "Prior strength (α=β)",
    { min: 1, max: 30, step: 1, value: strength },
    (v) => {
      cancelIntroIfRunning();
      strength = v;
      draw();
    },
  );

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Watch the intro: MAP starts at the prior's mode (p=0.5) and slides toward MLE as flips accumulate. Afterward, drag the sliders yourself, or hit replay below.";
  host.appendChild(hint);

  replayButton(host, "↻ Replay intro", playIntro);

  playIntro();
};

export function MaximumLikelihoodAndMap() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> imagine you find a coin that might be biased and flip it a
          handful of times. <strong>Likelihood</strong> just asks: "if the coin's true bias were{" "}
          <code>p</code>, how probable would it be to see exactly the heads/tails sequence I
          actually observed?" <strong>Maximum likelihood estimation (MLE)</strong> tries every
          candidate value of <code>p</code> and picks the one that makes your actual data the most
          probable outcome. If you flip 10 times and get 7 heads, the value of <code>p</code> that
          makes "7 heads out of 10" the single most likely result is exactly <code>p = 0.7</code> —
          which probably matches your intuition already, and that's not a coincidence.
        </p>
        <p>
          <strong>Intermediate:</strong> in practice you never work with the raw probability of the
          data directly — you work with its logarithm, the <strong>log-likelihood</strong>. Three
          reasons, all practical: turning a product of many small probabilities into a sum is easier
          to differentiate term by term; a product of, say, 10,000 probabilities each around 0.1
          underflows to numerically indistinguishable-from-zero on any computer, while the sum of
          10,000 log-probabilities stays a perfectly ordinary-sized number (the same underflow
          concern behind "logsumexp"-style numerical stability tricks elsewhere in ML); and because{" "}
          <code>log</code> is a strictly increasing function, whatever value of <code>p</code>{" "}
          maximizes the log-likelihood also maximizes the likelihood itself — nothing about{" "}
          <em>where</em> the maximum sits is lost by taking the log.
        </p>
        <p>
          <strong>Advanced:</strong> MLE treats the parameter as a completely blank slate — it uses
          only the data in front of it and nothing else. <strong>MAP (maximum a posteriori)</strong>{" "}
          estimation adds one ingredient: a <strong>prior</strong>, a probability distribution
          encoding what you believed about the parameter <em>before</em> seeing any data, and then
          picks the parameter value that maximizes log-likelihood plus log-prior together. The prior
          acts like a gentle thumb on the scale, and the size of its effect is not fixed — as you
          collect more and more data, the log-likelihood term grows in magnitude (more data points
          being multiplied in) while the log-prior term stays exactly the same size, so its relative
          influence shrinks toward nothing and MAP converges to whatever MLE would have given
          anyway. With very little data, though, the prior dominates and quietly does the job of{" "}
          <strong>regularizing</strong> the estimate away from the wild, noise-driven extremes a
          tiny sample can produce.
        </p>
        <p>
          <strong>Worked example — an A/B test click-through rate.</strong> A new checkout-button
          design is shown to 8 visitors, and 6 of them click through. That is the coin-flip problem
          again with new labels — a click is "heads," a non-click is "tails" — so <code>k = 6</code>
          , <code>n = 8</code>, and MLE reports <code>{"p̂ = 6/8 = 0.75"}</code>: a flat 75%
          click-through rate, full stop, based on eight visitors. Now suppose company-wide history
          says checkout buttons on pages like this one click through around 50% of the time — encode
          that as a mild <code>Beta(3, 3)</code> prior, whose mode is exactly 0.5. Plugging into the
          MAP formula derived below,{" "}
          <code>{"p̂ = (k+α-1)/(n+α+β-2) = (6+3-1)/(8+3+3-2) = 8/12 ≈ 0.667"}</code>. MAP has pulled
          the raw 75% estimate back toward the historical 50% baseline — not all the way, but
          noticeably — because eight visitors isn't much evidence to override what history suggests.
          There's a useful way to read that <code>α − 1</code> and <code>β − 1</code> in the
          formula: they act as <strong>pseudo-observations</strong> the prior silently contributes
          before any real data arrives. A <code>Beta(3, 3)</code> prior is worth exactly 2
          pseudo-clicks and 2 pseudo-non-clicks, no more — which is why it takes only a moderate
          amount of genuine traffic (a few dozen more visitors, say) to swamp it and pull the
          estimate back toward the raw 75% the data alone is pointing at.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\hat{\\theta}_{MLE} = \\arg\\max_{\\theta} \\prod_i P(x_i \\mid \\theta) = \\arg\\max_{\\theta} \\sum_i \\log P(x_i \\mid \\theta)"
          }
        </Formula>
        <Formula>
          {
            "\\hat{\\theta}_{MAP} = \\arg\\max_{\\theta} \\left[ \\sum_i \\log P(x_i \\mid \\theta) \\; + \\; \\log P(\\theta) \\right]"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          MLE maximizes log-likelihood alone; MAP maximizes log-likelihood plus the log of a prior
          belief <code>P(θ)</code> over the parameter itself. Drop the prior term entirely and MAP{" "}
          <em>is</em> MLE — MLE is just MAP under a flat (uniform, "no opinion") prior.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Derivation: from coin flips to ridge regression — the loss ⟺ likelihood correspondence"
      >
        <p>
          <strong>Part 1 — the Bernoulli MLE.</strong> Flip a coin <code>n</code> times
          independently and observe <code>k</code> heads. The probability of that exact sequence, as
          a function of the candidate bias <code>p</code>, is the likelihood:
        </p>
        <Formula>{"L(p) = p^{k}(1-p)^{n-k}"}</Formula>
        <p>Take the log to turn the product implicit in that exponentiation into a sum:</p>
        <Formula>{"\\ell(p) = \\log L(p) = k\\log p + (n-k)\\log(1-p)"}</Formula>
        <p>Differentiate with respect to p and set the derivative to zero:</p>
        <Formula>{"\\frac{d\\ell}{dp} = \\frac{k}{p} - \\frac{n-k}{1-p} = 0"}</Formula>
        <p>Cross-multiply and solve directly:</p>
        <Formula>
          {
            "\\frac{k}{p} = \\frac{n-k}{1-p} \\;\\Longrightarrow\\; k(1-p) = (n-k)p \\;\\Longrightarrow\\; k - kp = np - kp \\;\\Longrightarrow\\; k = np"
          }
        </Formula>
        <Formula>{"\\hat p_{MLE} = \\frac{k}{n}"}</Formula>
        <p>
          — exactly the observed heads fraction, confirming the beginner intuition above with real
          calculus.
        </p>
        <p>
          <strong>Part 2 — the Beta-prior MAP.</strong> Now add a belief about <code>p</code> before
          seeing data: a <strong>Beta(α, β)</strong> prior, whose density has the proportional form:
        </p>
        <Formula>{"P(p) \\propto p^{\\alpha-1}(1-p)^{\\beta-1}"}</Formula>
        <p>
          Multiplying this prior by the likelihood above gives the posterior, and because a Beta
          prior combined with a Bernoulli/Binomial likelihood always produces another Beta
          distribution — the two are <strong>conjugate</strong> — the algebra collapses cleanly
          without needing the general theory of why that conjugacy holds:
        </p>
        <Formula>
          {
            "P(p \\mid k, n) \\propto \\underbrace{p^{k}(1-p)^{n-k}}_{\\text{likelihood}} \\cdot \\underbrace{p^{\\alpha-1}(1-p)^{\\beta-1}}_{\\text{prior}} = p^{\\,k+\\alpha-1}(1-p)^{\\,n-k+\\beta-1}"
          }
        </Formula>
        <p>
          Take the log, differentiate, and set to zero exactly as before (the missing normalizing
          constant drops out under differentiation, since it has no <code>p</code> in it):
        </p>
        <Formula>
          {
            "\\frac{d}{dp}\\Big[(k+\\alpha-1)\\log p + (n-k+\\beta-1)\\log(1-p)\\Big] = \\frac{k+\\alpha-1}{p} - \\frac{n-k+\\beta-1}{1-p} = 0"
          }
        </Formula>
        <Formula>
          {
            "(k+\\alpha-1)(1-p) = (n-k+\\beta-1)\\,p \\;\\Longrightarrow\\; \\hat p_{MAP} = \\frac{k+\\alpha-1}{n+\\alpha+\\beta-2}"
          }
        </Formula>
        <p>
          Two sanity checks confirm this matches the plain-English story exactly. As{" "}
          <code>n → ∞</code> with <code>α, β</code> fixed, divide numerator and denominator by{" "}
          <code>n</code>:
        </p>
        <Formula>
          {
            "\\hat p_{MAP} = \\frac{k/n + (\\alpha-1)/n}{1 + (\\alpha+\\beta-2)/n} \\;\\xrightarrow{\\,n\\to\\infty\\,}\\; \\frac{k}{n} = \\hat p_{MLE}"
          }
        </Formula>
        <p>
          — the prior's influence washes out and MAP collapses onto MLE, exactly as claimed above.
          At the opposite extreme, with zero data (<code>n = 0</code>, <code>k = 0</code>):
        </p>
        <Formula>{"\\hat p_{MAP}\\Big|_{n=0} = \\frac{\\alpha-1}{\\alpha+\\beta-2}"}</Formula>
        <p>
          which is precisely the mode of the Beta(α, β) prior itself — with no data at all, MAP
          simply returns your prior belief unchanged, since there's nothing yet to update it with.
        </p>
        <p>
          <strong>Part 3 — squared loss is secretly Gaussian MLE.</strong> This is the identity that
          justifies calling MLE/MAP the unifying idea of the whole module. Assume a linear-Gaussian
          model, exactly the setup behind ordinary linear regression:
        </p>
        <Formula>
          {"y_i = w^\\top x_i + \\epsilon_i, \\qquad \\epsilon_i \\sim \\mathcal{N}(0, \\sigma^2)"}
        </Formula>
        <p>
          Equivalently, <code>y_i</code> given <code>x_i</code> and <code>w</code> is Gaussian with
          mean <code>w^Tx_i</code>, so its density is:
        </p>
        <Formula>
          {
            "P(y_i \\mid x_i, w) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}}\\exp\\!\\left(-\\frac{(y_i - w^\\top x_i)^2}{2\\sigma^2}\\right)"
          }
        </Formula>
        <p>
          Assuming the observations are conditionally independent given <code>w</code>, sum the log
          of this density over all <code>n</code> data points:
        </p>
        <Formula>
          {
            "\\ell(w) = \\sum_i \\log P(y_i\\mid x_i,w) = -\\frac{n}{2}\\log(2\\pi\\sigma^2) \\; - \\; \\frac{1}{2\\sigma^2}\\sum_i (y_i - w^\\top x_i)^2"
          }
        </Formula>
        <p>
          The first term doesn't contain <code>w</code> at all — it's a constant as far as the
          maximization is concerned. Only the second term depends on <code>w</code>, so:
        </p>
        <Formula>
          {
            "\\arg\\max_w\\, \\ell(w) = \\arg\\max_w\\left[-\\frac{1}{2\\sigma^2}\\sum_i (y_i-w^\\top x_i)^2\\right] = \\arg\\min_w \\sum_i (y_i - w^\\top x_i)^2"
          }
        </Formula>
        <p>
          Maximizing the Gaussian log-likelihood is <em>algebraically identical</em> to minimizing
          sum-of-squared-error — precisely the ordinary least squares (OLS) objective, and precisely
          the squared-loss result that Statistical Decision Theory (2.1.2) derives from a completely
          different starting point (choosing the Bayes-optimal predictor under squared loss). These
          are not two coincidentally similar ideas; they are the same optimization problem, arrived
          at from two directions.
        </p>
        <p>
          The same trick extends to MAP. Give the weights a Gaussian prior,{" "}
          <code>w ~ N(0, τ²I)</code>, whose log-density is <code>−‖w‖²/(2τ²)</code> plus a constant.
          Adding that to the log-likelihood above and flipping the sign to turn "maximize" into
          "minimize":
        </p>
        <Formula>
          {
            "\\arg\\max_w\\big[\\ell(w)+\\log P(w)\\big] = \\arg\\min_w \\left[\\sum_i (y_i-w^\\top x_i)^2 \\; + \\; \\frac{\\sigma^2}{\\tau^2}\\|w\\|^2\\right]"
          }
        </Formula>
        <p>
          — squared error plus an L2 penalty proportional to <code>‖w‖²</code>, which is exactly
          ridge regression's objective, with the regularization strength pinned to the concrete
          ratio <code>σ²/τ²</code>. Ridge regression <em>is</em> MAP estimation under a Gaussian
          prior on the weights — not "analogous to," literally the same optimization problem. Swap
          in a Laplace prior instead of a Gaussian one and the same style of derivation produces an
          L1 penalty instead of L2 — exactly the Lasso objective. Both regressions, and the full
          bias/variance mechanics of why they help, are developed in detail in a later Regression
          module; the point here is just that they're falling out of this one principle, not a new
          one.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is the single biggest unifying idea in the whole
          Foundations module. Essentially every "loss function" this chapter introduces later is the
          negative log-likelihood of some assumed noise or data-generating distribution in disguise
          — squared error is negative-log-Gaussian noise, cross-entropy/log-loss for classification
          is the negative log-likelihood of a Bernoulli/categorical label, and even hinge loss's
          margin-maximizing behavior traces back to related generative assumptions. Symmetrically,
          every regularization penalty is the negative log of some prior over the parameters — L2 is
          a Gaussian prior, L1 is a Laplace prior. "Choose a loss function" and "choose a
          likelihood," "add a regularizer" and "choose a prior," are the same design decision
          wearing two different names.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Watch MLE and MAP diverge — and converge — as the data changes"
        caption="Dashed orange is the prior density, solid blue the posterior. The green dashed line marks the MLE (pure data, k/n); the violet line marks the MAP (peak of the posterior). Push heads+tails up with the prior fixed and watch MAP slide onto MLE."
      >
        <DiagramHost render={renderMleMapPosterior} />
      </DiagramBlock>
      <MultiCodeExample
        id="practical"
        title="Implemented three ways — Bernoulli MLE/MAP, and the OLS ⟺ Gaussian-MLE identity"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import random
import math

def bernoulli_mle(heads: int, tails: int) -> float:
    n = heads + tails
    if n == 0:
        return 0.5  # undefined with no data at all; fall back to "no opinion"
    return heads / n

def bernoulli_map(heads: int, tails: int, alpha: float, beta: float) -> float:
    n = heads + tails
    denom = n + alpha + beta - 2
    if abs(denom) < 1e-12:
        return 0.5
    return (heads + alpha - 1) / denom

heads, tails = 2, 8
alpha, beta = 3.0, 3.0
print("MLE  p_hat =", bernoulli_mle(heads, tails))
print("MAP  p_hat =", bernoulli_map(heads, tails, alpha, beta))

# ---- Part 2: OLS via the normal equations reproduces the Gaussian-MLE optimum ----

def transpose(A):
    return [list(row) for row in zip(*A)]

def matmul(A, B):
    Bt = transpose(B)
    return [[sum(a * b for a, b in zip(row, col)) for col in Bt] for row in A]

def mat_vec(A, v):
    return [sum(a * x for a, x in zip(row, v)) for row in A]

def solve_linear_system(A, b):
    # Plain Gaussian elimination with partial pivoting -- no numpy involved.
    n = len(A)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(M[r][col]))
        M[col], M[pivot] = M[pivot], M[col]
        for r in range(col + 1, n):
            factor = M[r][col] / M[col][col]
            for c in range(col, n + 1):
                M[r][c] -= factor * M[col][c]
    x = [0.0] * n
    for row in range(n - 1, -1, -1):
        s = M[row][n] - sum(M[row][c] * x[c] for c in range(row + 1, n))
        x[row] = s / M[row][row]
    return x

random.seed(0)
true_w = [2.0, -1.5]
xs = [[1.0, random.uniform(-3, 3)] for _ in range(40)]  # column 0 is the intercept term
ys = [true_w[0] * x[0] + true_w[1] * x[1] + random.gauss(0, 0.5) for x in xs]

Xt = transpose(xs)
XtX = matmul(Xt, xs)
Xty = mat_vec(Xt, ys)
w_ols = solve_linear_system(XtX, Xty)
print("OLS via normal equations:", w_ols)

def neg_log_likelihood(w, sigma2=0.25):
    sse = sum((y - (w[0] * x[0] + w[1] * x[1])) ** 2 for x, y in zip(xs, ys))
    return sse / (2 * sigma2)  # dropping the additive constant -- it never affects the argmin

def grid_search_mle(step=0.02, span=25):
    best_w, best_nll = None, math.inf
    for i in range(-span, span + 1):
        for j in range(-span, span + 1):
            w = [w_ols[0] + i * step, w_ols[1] + j * step]
            nll = neg_log_likelihood(w)
            if nll < best_nll:
                best_nll, best_w = nll, w
    return best_w

w_mle_search = grid_search_mle()
print("Grid-search maximizer of the Gaussian log-likelihood:", w_mle_search)
print("Same answer either way -- minimizing squared error IS maximizing Gaussian likelihood.")`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <cmath>
#include <cstdio>
#include <vector>
#include <random>
#include <algorithm>

double bernoulliMle(int heads, int tails) {
    int n = heads + tails;
    if (n == 0) return 0.5;
    return static_cast<double>(heads) / n;
}

double bernoulliMap(int heads, int tails, double alpha, double beta) {
    double n = heads + tails;
    double denom = n + alpha + beta - 2.0;
    if (std::fabs(denom) < 1e-12) return 0.5;
    return (heads + alpha - 1.0) / denom;
}

// Solve A x = b with plain Gaussian elimination and partial pivoting --
// no linear-algebra library involved.
std::vector<double> solveLinearSystem(std::vector<std::vector<double>> A, std::vector<double> b) {
    int n = static_cast<int>(b.size());
    for (int col = 0; col < n; ++col) {
        int pivot = col;
        for (int r = col + 1; r < n; ++r)
            if (std::fabs(A[r][col]) > std::fabs(A[pivot][col])) pivot = r;
        std::swap(A[col], A[pivot]);
        std::swap(b[col], b[pivot]);
        for (int r = col + 1; r < n; ++r) {
            double factor = A[r][col] / A[col][col];
            for (int c = col; c < n; ++c) A[r][c] -= factor * A[col][c];
            b[r] -= factor * b[col];
        }
    }
    std::vector<double> x(n, 0.0);
    for (int row = n - 1; row >= 0; --row) {
        double sum = b[row];
        for (int c = row + 1; c < n; ++c) sum -= A[row][c] * x[c];
        x[row] = sum / A[row][row];
    }
    return x;
}

double negLogLikelihood(const std::vector<std::vector<double>>& xs,
                         const std::vector<double>& ys,
                         double w0, double w1, double sigma2) {
    double sse = 0.0;
    for (size_t i = 0; i < ys.size(); ++i) {
        double pred = w0 * xs[i][0] + w1 * xs[i][1];
        double diff = ys[i] - pred;
        sse += diff * diff;
    }
    return sse / (2.0 * sigma2);
}

int main() {
    int heads = 2, tails = 8;
    double alpha = 3.0, beta = 3.0;
    std::printf("MLE  p_hat = %.4f\\n", bernoulliMle(heads, tails));
    std::printf("MAP  p_hat = %.4f\\n", bernoulliMap(heads, tails, alpha, beta));

    std::mt19937 rng(0);
    std::uniform_real_distribution<double> unif(-3.0, 3.0);
    std::normal_distribution<double> noise(0.0, 0.5);

    const int n = 40;
    std::vector<std::vector<double>> xs(n, std::vector<double>(2));
    std::vector<double> ys(n);
    double trueW0 = 2.0, trueW1 = -1.5;
    for (int i = 0; i < n; ++i) {
        xs[i][0] = 1.0;
        xs[i][1] = unif(rng);
        ys[i] = trueW0 * xs[i][0] + trueW1 * xs[i][1] + noise(rng);
    }

    // Normal equations: (X^T X) w = X^T y
    std::vector<std::vector<double>> XtX(2, std::vector<double>(2, 0.0));
    std::vector<double> Xty(2, 0.0);
    for (int i = 0; i < n; ++i) {
        for (int a = 0; a < 2; ++a) {
            Xty[a] += xs[i][a] * ys[i];
            for (int c = 0; c < 2; ++c) XtX[a][c] += xs[i][a] * xs[i][c];
        }
    }
    std::vector<double> wOls = solveLinearSystem(XtX, Xty);
    std::printf("OLS via normal equations: w0=%.4f w1=%.4f\\n", wOls[0], wOls[1]);

    // Tiny grid search directly maximizing the Gaussian log-likelihood
    double bestNll = 1e300, bestW0 = 0.0, bestW1 = 0.0;
    for (int i = -25; i <= 25; ++i) {
        for (int j = -25; j <= 25; ++j) {
            double w0 = wOls[0] + i * 0.02;
            double w1 = wOls[1] + j * 0.02;
            double nll = negLogLikelihood(xs, ys, w0, w1, 0.25);
            if (nll < bestNll) { bestNll = nll; bestW0 = w0; bestW1 = w1; }
        }
    }
    std::printf("Grid-search MLE:          w0=%.4f w1=%.4f\\n", bestW0, bestW1);
    std::printf("Same answer either way -- minimizing squared error IS maximizing Gaussian likelihood.\\n");
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from scipy.stats import beta as beta_dist
from scipy.optimize import minimize_scalar
from sklearn.linear_model import LinearRegression, Ridge

heads, tails = 2, 8
alpha, beta_param = 3.0, 3.0

# Closed form: the MAP estimate is exactly the mode of the Beta posterior.
posterior = beta_dist(alpha + heads, beta_param + tails)
map_closed_form = (alpha + heads - 1) / (alpha + beta_param + heads + tails - 2)
print("MAP (closed form):        ", map_closed_form)
print("Posterior mean (compare): ", posterior.mean())

# General-purpose alternative: numerically maximize the log-posterior directly.
# This scales to priors/likelihoods with no closed-form mode at all.
def neg_log_posterior(p):
    if p <= 0.0 or p >= 1.0:
        return np.inf
    log_lik = heads * np.log(p) + tails * np.log(1 - p)
    log_prior = (alpha - 1) * np.log(p) + (beta_param - 1) * np.log(1 - p)
    return -(log_lik + log_prior)

result = minimize_scalar(neg_log_posterior, bounds=(1e-6, 1 - 1e-6), method="bounded")
print("MAP (numeric optimization):", result.x)

# ---- Part 2: OLS-as-Gaussian-MLE and ridge-as-Gaussian-MAP, in two lines each ----
rng = np.random.default_rng(0)
X = rng.uniform(-3, 3, size=(200, 1))
true_w, true_b = -1.5, 2.0
y = true_b + true_w * X[:, 0] + rng.normal(0, 0.5, size=200)

ols = LinearRegression().fit(X, y)
print("LinearRegression (= Gaussian MLE):", ols.intercept_, ols.coef_)

# scikit-learn's "alpha" here plays the role of sigma^2 / tau^2 derived above.
ridge = Ridge(alpha=5.0).fit(X, y)
print("Ridge (= Gaussian MAP, w ~ N(0, tau^2 I)):", ridge.intercept_, ridge.coef_)`,
          },
        ]}
      >
        <p>
          Part 1 of each tab reproduces the closed-form Bernoulli MLE/MAP derived above; part 2
          proves the loss ⟺ likelihood correspondence in code, not just algebra — the OLS normal-
          equations solution and a direct numerical maximizer of the Gaussian log-likelihood land on
          the same answer, and swapping <code>LinearRegression</code> for <code>Ridge</code> is
          exactly swapping a flat prior on <code>w</code> for a Gaussian one.
        </p>
      </MultiCodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>A/B testing and click-through-rate estimation</strong> — with only a handful of
            impressions on a new ad variant, plain MLE can report a wildly overconfident rate (a
            single click out of three impressions gives an MLE CTR of 33%). MAP/Bayesian smoothing
            with a sensible prior tempers exactly this kind of small-sample overconfidence, the same
            Beta-Bernoulli mechanics derived above, just relabeled as clicks and impressions.
          </li>
          <li>
            <strong>Ridge regression in practice</strong> is, as derived above, nothing more than
            MAP estimation of linear weights under a Gaussian prior — the "regularization strength"
            hyperparameter is literally a noise-to-prior variance ratio. The full treatment of why
            and when this helps, alongside Lasso, is developed in a later Regression module.
          </li>
          <li>
            <strong>Naive Bayes classifiers</strong>, covered in full in a later module, are a
            direct, explicit application of MLE — they estimate the parameters of an assumed
            generative distribution for each class (e.g. word frequencies) purely by maximum
            likelihood on labeled training data, then classify new points by whichever class
            distribution makes the observed features most likely.
          </li>
          <li>
            <strong>Language models</strong> estimating the probability of the next word/token given
            context are, at their statistical core, (heavily regularized) maximum likelihood
            estimates over enormous text corpora — every "next-token probability" a language model
            outputs is shaped by the same likelihood-maximization principle as the two-flip coin
            example above, just at a vastly larger scale and with the prior/regularization baked
            into the model architecture and training procedure rather than a hand-written Beta
            prior.
          </li>
          <li>
            <strong>Spam filters built on naive Bayes</strong> hit a sharp failure mode without a
            fix: if the word "viagra" never once appeared in the training set's ham folder, its MLE
            estimate of <code>{"P(word | ham) = 0"}</code> exactly, and Bayes' rule then multiplies
            that zero straight through the whole calculation — any email containing the word gets
            classified as spam with total certainty, regardless of every other word in it, forever.
            The standard fix, Laplace (additive) smoothing — adding a small pseudo-count to every
            word before dividing — is exactly a MAP estimate under a uniform Dirichlet prior over
            the vocabulary, the multi-outcome generalization of the "pseudo-observations" reading of
            the Beta prior in the worked example above.
          </li>
          <li>
            <strong>Recommender systems</strong> that factor a user-item ratings matrix into latent
            user and item vectors almost always add an L2 penalty on those vectors before fitting —
            unregularized factorization overfits badly to users and items with only a handful of
            ratings, memorizing noise instead of latent taste. By exactly the same ridge-regression
            identity derived above, that penalty is a Gaussian MAP prior over the latent factors;
            the algorithm is quietly doing Bayesian regularization even though most descriptions of
            it never use the word "prior."
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Trusting plain MLE with tiny samples: flip a coin twice, get two heads, and MLE reports{" "}
            <code>p̂ = 1</code> — "this coin always lands heads," from two flips. Nothing in plain
            MLE stops it from being this confidently wrong; some form of prior or regularization is
            what tempers it (with a Beta(3,3) prior, the same two flips give MAP{" "}
            <code>p̂ = 4/6 ≈ 0.667</code> instead — still leaning toward heads, but not absurdly so).
          </li>
          <li>
            Treating the choice of a prior as "cheating" or purely subjective bias sneaking into an
            otherwise objective calculation. Under the loss-correspondence view derived above, a
            prior is just a regularization penalty by another name, with well-studied statistical
            behavior (bias added, variance reduced) — no more "subjective" than choosing to add an
            L2 penalty, which almost nobody objects to on principle.
          </li>
          <li>
            Assuming MAP is unconditionally "better" than MLE. With reasonable amounts of data and a
            sensibly chosen prior, MAP rarely hurts and often helps. But a badly mismatched or
            overly strong prior, combined with little data to outweigh it, can bias an estimate just
            as badly as having no regularization at all lets an estimate overfit — regularization is
            a trade-off to be tuned, not a free win.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          MAP is a genuinely useful, cheap approximation to full Bayesian inference — but it is not
          the same thing as it. Full Bayesian inference, covered in a later Probabilistic &amp;
          Bayesian Methods module, never collapses the posterior down to a single point; it keeps
          the entire posterior distribution over the parameter, which lets you quantify{" "}
          <em>uncertainty</em> in downstream predictions (e.g. "here's a range of plausible click-
          through rates, and how confident we are in each") rather than reporting one number as if
          it were exact. MAP is the mode of exactly that same posterior — useful, computationally
          cheap, but strictly less informative than the whole distribution.
        </p>
        <p>
          A subtlety worth flagging: MLE is <strong>invariant under reparameterization</strong> — if
          you estimate a transformed parameter (say, <code>log p</code> instead of <code>p</code>)
          by maximum likelihood, you get exactly the transform of the original MLE. Naive MAP does{" "}
          <strong>not</strong> share this property in general — the mode of a transformed density is
          not, in general, the transform of the original mode, because probability densities pick up
          a Jacobian (change-of-variables) factor under reparameterization that shifts where the
          peak sits. This is a genuine wrinkle for anyone reporting MAP estimates across different
          parameterizations of the same problem, and it's part of why some practitioners prefer
          reporting a posterior mean or the full posterior instead of a bare MAP point.
        </p>
      </ExpertNote>
      <Quiz
        q="You flip a coin twice and observe 2 heads. Under a Beta(3, 3) prior, what are the MLE and MAP estimates of the bias p, and why do they differ so much?"
        a="MLE = k/n = 2/2 = 1 — with only two data points, MLE reports total certainty the coin always lands heads. MAP = (k+α-1)/(n+α+β-2) = (2+3-1)/(2+3+3-2) = 4/6 ≈ 0.667 — the Beta(3,3) prior, whose mode is 0.5, pulls the estimate back from that extreme. The gap between them is exactly the effect of having almost no data: with n this small, the prior term in the MAP objective is comparable in size to the likelihood term, so it has real influence. Flip the coin 200 times and get 140 heads instead, and MLE (0.7) and MAP under the same prior ((140+2)/(200+4) ≈ 0.696) become nearly indistinguishable — the prior's influence has washed out."
      />
      <Takeaway>
        <p>
          This closes out <em>Foundations of Learning</em>. The module opened with empirical risk
          minimization — pick the function, from an allowed hypothesis class, that minimizes average
          loss on the training data — and every topic since has been filling in a piece of what that
          means and why it works: which paradigm supplies the data (2.1.1), where the loss function
          itself comes from (2.1.2), why no single model can drive bias, variance, and irreducible
          error to zero simultaneously (2.1.3), how that trade-off shows up as measurable
          over/under- fitting as capacity changes (2.1.4), and what theoretical guarantees say about
          whether training performance transfers to new data at all (2.1.5). This lesson closes the
          loop: maximum likelihood and MAP estimation show that choosing a loss function is choosing
          a noise/data-generating distribution, and choosing a regularizer is choosing a prior — the
          "loss" and "regularization" vocabulary used everywhere else in this chapter and the
          "likelihood" and "prior" vocabulary used here are two names for the same underlying
          choice. Every later module in this chapter, whenever it introduces a new model or loss
          function, will point back to whichever of these six foundational ideas explains why that
          model is built the way it is — it's worth remembering which of the six is doing the
          explaining each time.
        </p>
      </Takeaway>
    </>
  );
}
