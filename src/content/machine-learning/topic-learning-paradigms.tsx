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
  toggleGroup,
  animate,
  ease,
  replayButton,
} from "@/lib/diagram-helpers";

const TRUE_COLORS = ["#4f5fe0", "#1f8a5f"] as const;
const CLUSTER_COLORS = ["#b8720c", "#8a3fd1"] as const;
const GREY = "#c2c6db";

type Paradigm = "supervised" | "unsupervised" | "semi";
type UnsupervisedView = "raw" | "kmeans";

/** Deterministic Park-Miller LCG so the diagram's point cloud (and its k-means
 *  clustering) is identical on every load and every replay, not re-randomized. */
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Linear interpolation between two hex colors, used to cross-fade a point's dot color smoothly
 *  (rather than snapping instantly) as the autoplay intro moves between paradigm views. */
function mixColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Plain from-scratch k-means, k=2, on (x, y) position alone — used to color the
 *  "K-means clusters" sub-view so the diagram can show what unsupervised structure
 *  actually gets discovered from geometry, and how it compares to the true classes. */
function kmeans2(pts: { x: number; y: number }[]) {
  let c0 = { x: pts[0].x, y: pts[0].y };
  let c1 = { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
  const assign = new Array(pts.length).fill(0) as number[];
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < pts.length; i++) {
      const d0 = (pts[i].x - c0.x) ** 2 + (pts[i].y - c0.y) ** 2;
      const d1 = (pts[i].x - c1.x) ** 2 + (pts[i].y - c1.y) ** 2;
      assign[i] = d0 <= d1 ? 0 : 1;
    }
    const sums = [
      { x: 0, y: 0, n: 0 },
      { x: 0, y: 0, n: 0 },
    ];
    for (let i = 0; i < pts.length; i++) {
      const sum = sums[assign[i]];
      sum.x += pts[i].x;
      sum.y += pts[i].y;
      sum.n += 1;
    }
    if (sums[0].n) c0 = { x: sums[0].x / sums[0].n, y: sums[0].y / sums[0].n };
    if (sums[1].n) c1 = { x: sums[1].x / sums[1].n, y: sums[1].y / sums[1].n };
  }
  return assign;
}

/** 100 fixed points forming two loose blobs — "houses" at (square footage,
 *  distance from downtown). The positions never change; only how much of each
 *  point's true class you're allowed to see changes as the paradigm toggle changes. */
const renderParadigmScatter: DiagramRender = (host) => {
  const rand = seededRandom(42);
  const N_A = 55;
  const N_B = 45;
  const points: { x: number; y: number; cls: 0 | 1 }[] = [];
  const jitter = (spread: number) => (rand() + rand() + rand() - 1.5) * spread;
  for (let i = 0; i < N_A; i++) {
    points.push({
      x: clamp(115 + jitter(70), 26, 344),
      y: clamp(170 + jitter(55), 26, 234),
      cls: 0,
    });
  }
  for (let i = 0; i < N_B; i++) {
    points.push({
      x: clamp(235 + jitter(65), 26, 344),
      y: clamp(90 + jitter(55), 26, 234),
      cls: 1,
    });
  }

  // A fixed shuffled reveal order, so the semi-supervised slider always reveals
  // labels spread across the picture and across both classes, not just the
  // first K points in array order.
  const order = points.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const revealRank: number[] = new Array(points.length);
  order.forEach((idx, rank) => {
    revealRank[idx] = rank;
  });

  const clusterAssign = kmeans2(points);
  const clusterCount0 = clusterAssign.filter((a) => a === 0).length;
  const clusterCount1 = points.length - clusterCount0;

  const s = svg("0 0 360 260");
  s.appendChild(
    el("line", { x1: 26, y1: 234, x2: 350, y2: 234, stroke: "#c7cbdc", "stroke-width": 1.5 }),
  );
  s.appendChild(
    el("line", { x1: 26, y1: 20, x2: 26, y2: 234, stroke: "#c7cbdc", "stroke-width": 1.5 }),
  );
  const circles = points.map((p) =>
    el("circle", { cx: p.x, cy: p.y, r: 4, fill: GREY, stroke: "white", "stroke-width": 0.75 }),
  );
  circles.forEach((c) => s.appendChild(c));
  host.appendChild(s);

  const legend = document.createElement("div");
  legend.className =
    "mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground";
  host.appendChild(legend);

  function legendItem(color: string, text: string) {
    const item = document.createElement("span");
    item.className = "inline-flex items-center gap-1.5";
    const dot = document.createElement("span");
    dot.style.width = "9px";
    dot.style.height = "9px";
    dot.style.borderRadius = "50%";
    dot.style.display = "inline-block";
    dot.style.background = color;
    const label = document.createElement("span");
    label.textContent = text;
    item.appendChild(dot);
    item.appendChild(label);
    legend.appendChild(item);
  }

  let mode: Paradigm = "supervised";
  let unsupervisedView: UnsupervisedView = "raw";
  let labeledPct = 12;
  const introTargetPct = labeledPct;

  /** Pure lookup — the fill color + opacity a point at index `i` would have under an arbitrary
   *  (paradigm, unsupervised sub-view, labeled %) combination. Kept pure, with no read of the
   *  mutable mode/unsupervisedView/labeledPct variables above, so the autoplay intro below can
   *  compute a "from" state and a "to" state and interpolate between them frame by frame without
   *  ever touching real state mid-transition. */
  function styleFor(
    i: number,
    m: Paradigm,
    uView: UnsupervisedView,
    pct: number,
  ): { color: string; opacity: number } {
    const p = points[i];
    if (m === "supervised") return { color: TRUE_COLORS[p.cls], opacity: 0.92 };
    if (m === "unsupervised") {
      return uView === "kmeans"
        ? { color: CLUSTER_COLORS[clusterAssign[i]], opacity: 0.92 }
        : { color: GREY, opacity: 0.55 };
    }
    return revealRank[i] < pct
      ? { color: TRUE_COLORS[p.cls], opacity: 0.92 }
      : { color: GREY, opacity: 0.55 };
  }

  function paintDotsFor(m: Paradigm, uView: UnsupervisedView, pct: number) {
    circles.forEach((c, i) => {
      const st = styleFor(i, m, uView, pct);
      c.setAttribute("fill", st.color);
      c.setAttribute("fill-opacity", String(st.opacity));
    });
  }

  function paintLegendAndReadout() {
    legend.innerHTML = "";
    if (mode === "supervised") {
      legendItem(TRUE_COLORS[0], "Affordable — label known");
      legendItem(TRUE_COLORS[1], "Premium — label known");
    } else if (mode === "unsupervised") {
      if (unsupervisedView === "kmeans") {
        legendItem(CLUSTER_COLORS[0], "Cluster A (found by k-means)");
        legendItem(CLUSTER_COLORS[1], "Cluster B (found by k-means)");
      } else {
        legendItem(GREY, "Position known, label unknown");
      }
    } else {
      legendItem(TRUE_COLORS[0], "Affordable — revealed");
      legendItem(TRUE_COLORS[1], "Premium — revealed");
      legendItem(GREY, "Label withheld");
    }

    kmeansWrap.style.display = mode === "unsupervised" ? "" : "none";
    sliderWrap.style.display = mode === "semi" ? "" : "none";

    if (mode === "supervised") {
      out.set("All 100 points labeled — 55 Affordable (blue), 45 Premium (green).");
    } else if (mode === "unsupervised") {
      if (unsupervisedView === "kmeans") {
        out.set(
          "k-means (k=2) used only (x, y) position: " +
            clusterCount0 +
            " points in cluster A, " +
            clusterCount1 +
            " in cluster B — no price label was ever used to find this split.",
        );
      } else {
        out.set("0 of 100 points labeled — only position is visible, no class information at all.");
      }
    } else {
      out.set(labeledPct + " labeled / " + (100 - labeledPct) + " unlabeled points.");
    }
  }

  function draw() {
    paintDotsFor(mode, unsupervisedView, labeledPct);
    paintLegendAndReadout();
  }

  // Every manual control below lives inside `controlsWrap`, so the autoplay intro can dim it and
  // switch off pointer-events for its duration without touching anything outside it (the legend,
  // the live readout, and the hint text stay fully visible and narrate the intro as it plays).
  const controlsWrap = document.createElement("div");
  controlsWrap.className = "w-full transition-opacity duration-300";
  host.appendChild(controlsWrap);

  const paradigmToggleHost = document.createElement("div");
  controlsWrap.appendChild(paradigmToggleHost);
  toggleGroup(
    paradigmToggleHost,
    [
      { label: "Supervised", value: "supervised" },
      { label: "Unsupervised", value: "unsupervised" },
      { label: "Semi-supervised", value: "semi" },
    ],
    "supervised",
    (v) => {
      mode = v as Paradigm;
      draw();
    },
  );
  // Clicking these (rather than just mutating state directly) is what the autoplay intro uses to
  // snap back to the resting starting point — it keeps the pill highlighting, the mode, and the
  // drawn dots perfectly in sync for free, using the exact same path a real click would take.
  const supervisedBtn = Array.from(paradigmToggleHost.querySelectorAll("button")).find(
    (b) => b.textContent === "Supervised",
  );

  const kmeansWrap = document.createElement("div");
  const kmeansHeading = document.createElement("p");
  kmeansHeading.className = "mt-3 text-[11px] text-muted-foreground";
  kmeansHeading.textContent = "Unsupervised view only — recolor by discovered cluster:";
  kmeansWrap.appendChild(kmeansHeading);
  controlsWrap.appendChild(kmeansWrap);
  toggleGroup(
    kmeansWrap,
    [
      { label: "Positions only", value: "raw" },
      { label: "K-means clusters (k=2)", value: "kmeans" },
    ],
    "raw",
    (v) => {
      unsupervisedView = v as UnsupervisedView;
      draw();
    },
  );
  const positionsOnlyBtn = Array.from(kmeansWrap.querySelectorAll("button")).find(
    (b) => b.textContent === "Positions only",
  );

  const sliderWrap = document.createElement("div");
  controlsWrap.appendChild(sliderWrap);
  const labeledSlider = sliderControl(
    sliderWrap,
    "Labeled %",
    { min: 0, max: 100, step: 1, value: labeledPct },
    (v) => {
      labeledPct = v;
      draw();
    },
  );

  const out = readout(host, "");

  const introStatus = document.createElement("p");
  introStatus.className = "mt-2 min-h-[1.5em] text-center text-[12px] font-medium text-primary";
  host.appendChild(introStatus);

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "The 100 dots never move — only how much you're told about their color changes. That is the entire difference between the paradigms.";
  host.appendChild(hint);

  // --- Autoplay intro -------------------------------------------------------------------------
  // A one-time (or replay-button-triggered) animated tour through all three views, played before
  // the user is expected to touch anything: hold on Supervised, cross-fade to Unsupervised, hold,
  // cross-fade into Semi-supervised while animating the slider itself up from 0% to its resting
  // value, hold, then cross-fade back to Supervised as the ready-to-interact starting state.
  // Every timer and animation frame it starts is pushed into `cancels`, so a replay can cut a
  // previous run short and unmounting mid-animation never leaves a dangling timer/rAF behind.
  const cancels: Array<() => void> = [];

  function afterDelay(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, ms);
    cancels.push(() => window.clearTimeout(id));
  }

  function crossfadeDots(
    duration: number,
    from: { m: Paradigm; u: UnsupervisedView; pct: number },
    to: { m: Paradigm; u: UnsupervisedView; pct: number },
    onDone?: () => void,
  ) {
    cancels.push(
      animate(
        duration,
        (t) => {
          circles.forEach((c, i) => {
            const a = styleFor(i, from.m, from.u, from.pct);
            const b = styleFor(i, to.m, to.u, to.pct);
            c.setAttribute("fill", mixColor(a.color, b.color, t));
            c.setAttribute("fill-opacity", String(a.opacity + (b.opacity - a.opacity) * t));
          });
        },
        onDone,
        ease.inOutCubic,
      ),
    );
  }

  function setControlsInert(inert: boolean) {
    controlsWrap.style.opacity = inert ? "0.35" : "1";
    controlsWrap.style.pointerEvents = inert ? "none" : "";
  }

  function playIntro() {
    let pending: (() => void) | undefined;
    while ((pending = cancels.pop())) pending();

    setControlsInert(true);
    // Snap every control back to its resting default through the same buttons a user would click,
    // so pill highlighting stays in sync even on a replay triggered after manual interaction.
    positionsOnlyBtn?.click();
    supervisedBtn?.click();
    introStatus.textContent = "▶ Autoplay — Supervised: every point's true class is visible.";

    afterDelay(750, () => {
      mode = "unsupervised";
      unsupervisedView = "raw";
      paintLegendAndReadout();
      introStatus.textContent =
        "▶ Autoplay — fading to Unsupervised: labels hidden, only position remains.";
      crossfadeDots(
        650,
        { m: "supervised", u: "raw", pct: 0 },
        { m: "unsupervised", u: "raw", pct: 0 },
        () => {
          afterDelay(800, () => {
            mode = "semi";
            labeledPct = 0;
            labeledSlider.value = "0";
            paintLegendAndReadout();
            introStatus.textContent =
              "▶ Autoplay — Semi-supervised: revealing labels as the slider rises…";
            cancels.push(
              animate(
                800,
                (t) => {
                  labeledPct = Math.round(t * introTargetPct);
                  labeledSlider.value = String(labeledPct);
                  paintDotsFor("semi", "raw", labeledPct);
                  paintLegendAndReadout();
                },
                () => {
                  labeledPct = introTargetPct;
                  labeledSlider.value = String(introTargetPct);
                  paintDotsFor("semi", "raw", introTargetPct);
                  paintLegendAndReadout();
                  afterDelay(800, () => {
                    introStatus.textContent = "▶ Autoplay — settling back on Supervised.";
                    crossfadeDots(
                      600,
                      { m: "semi", u: "raw", pct: introTargetPct },
                      { m: "supervised", u: "raw", pct: 0 },
                      () => {
                        labeledPct = introTargetPct;
                        labeledSlider.value = String(introTargetPct);
                        supervisedBtn?.click();
                        introStatus.textContent = "";
                        setControlsInert(false);
                      },
                    );
                  });
                },
                ease.inOutCubic,
              ),
            );
          });
        },
      );
    });
  }

  replayButton(host, "↻ Replay intro", playIntro);
  playIntro();

  return () => cancels.forEach((c) => c());
};

export function LearningParadigms() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> picture a folder of 10,000 house-listing photos. If every photo
          comes with a price tag stapled to it, you're in <strong>supervised</strong> learning — the
          goal is to learn a rule that predicts the tag from the photo. Take away every price tag
          and you're in <strong>unsupervised</strong> learning — there's no "right answer" to
          predict anymore, but you can still ask what the photos have in common: which ones look
          alike, which form natural groups. <strong>Semi-supervised</strong> learning is the
          realistic middle ground — a listings site might have confirmed sale prices for the 200
          houses that already sold and no price at all for the other 9,800 that are merely listed,
          and you'd like to use all 10,000 photos, not just the 200.{" "}
          <strong>Self-supervised</strong> learning throws away price tags too, but instead of
          giving up on having a "right answer," it manufactures one out of the photo itself — black
          out the roof and ask the model to guess what's missing, or rotate the photo and ask which
          way is up. And <strong>reinforcement learning</strong> isn't a photo folder at all: think
          of a thermostat deciding when to turn the heat on, watching the room temperature and the
          energy bill react to its own past choices over time, with no dataset of "correct" actions
          ever handed to it up front.
        </p>
        <p>
          <strong>Worked example — the same data, five different jobs:</strong> take a bank's 50,000
          most recent transactions. Framed as <strong>supervised</strong> learning, you'd use only
          the roughly 500 of those that were actually escalated and investigated, each one carrying
          a confirmed "fraud" or "legitimate" tag, and train a model to predict that tag from the
          transaction's own features. Framed as <strong>unsupervised</strong> learning, you throw
          the tag away entirely — cluster all 50,000 by spending pattern, merchant category, and
          time of day, or fit a density model, and flag whichever transactions sit in the sparsest,
          most unusual region of that space, with no notion of "fraud" involved at all, only
          "unusual." <strong>Semi-supervised</strong> learning uses both pieces of the same 50,000
          rows at once: the 500 confirmed tags anchor where the boundary should sit, and the other
          49,500 unlabeled transactions get pulled toward whichever side of that boundary they
          cluster nearest to. <strong>Self-supervised</strong> learning ignores the fraud tag too,
          but manufactures its own training signal out of the untagged bulk — mask the transaction
          amount and train the model to predict it from the rest of the record — which builds a
          general sense of what a normal transaction looks like before the model has ever seen a
          single confirmed fraud case; that learned representation is then fine-tuned on the 500
          tagged examples. And <strong>reinforcement learning</strong> abandons the fixed 50,000-row
          dataset altogether: a live fraud-review system decides, transaction by transaction,
          whether to approve, hold, or block it, and adjusts its policy based on the downstream cost
          of each choice — an angry customer from a wrongly blocked purchase, real money lost from
          an approved fraud — a loop that keeps running and adapting as fraud patterns shift, long
          after any fixed dataset would have gone stale. The rows never change; only which columns
          you're allowed to look at, and whether "the data" is even a fixed table at all, does.
        </p>
        <p>
          <strong>Intermediate:</strong> supervised learning assumes you observe i.i.d. pairs{" "}
          <code>(x, y)</code> drawn from some unknown joint distribution, and the goal is to learn a
          function that generalizes the <code>x → y</code> mapping to new, unseen <code>x</code>.
          Unsupervised learning observes only the <code>x</code>'s — there is no <code>y</code> at
          all — so the goal shifts to describing structure in that distribution itself: density,
          clusters, a lower-dimensional manifold the data actually lives on. Semi-supervised
          learning gets a large sample of <code>x</code>'s and a much smaller sample of matched{" "}
          <code>(x, y)</code> pairs, and the unlabeled data only helps if it carries real
          information about where the decision boundary should sit — typically via a{" "}
          <em>cluster assumption</em> (points in the same dense region tend to share a label) or a{" "}
          <em>manifold assumption</em> (nearby points on the underlying data manifold share a
          label). Self-supervised learning is a trick for turning an unsupervised-looking pile of
          raw <code>x</code>'s back into ordinary supervised pairs: a <em>pretext task</em> carves
          an <code>(x, y)</code> pair out of each unlabeled example automatically — mask a token and
          predict it, crop two views of an image and predict that they came from the same photo —
          then trains with a completely standard supervised loss. Reinforcement learning drops the
          fixed-dataset assumption altogether: an agent chooses actions inside an environment,
          receives a reward after each one (often delayed and sparse), and which states and actions
          it even gets to see depends on the very policy it's in the middle of learning — something
          none of the other four paradigms have to deal with.
        </p>
        <p>
          <strong>Advanced:</strong> all five are answers to one underlying question — what
          information is available to estimate the risk in the formula below, and what can the loss
          actually see? Supervised learning evaluates the loss pointwise on a labeled pair.
          Unsupervised learning replaces the loss with something that only needs <code>x</code> —
          reconstruction error, negative log-likelihood under a density model, a clustering
          distortion objective — so "no labels" does not mean "no assumptions"; the assumptions
          simply moved into the choice of loss and hypothesis class instead of coming from human
          labels. Self-supervised learning is not a new kind of loss at all — it is ordinary
          supervised empirical risk minimization, with the one twist that the label-generating
          function was written by the practitioner instead of hired out to human annotators, which
          is exactly why self-supervised objectives look and behave like supervised ones under the
          hood. Reinforcement learning is the odd one out mathematically, not just practically:
          because the reward for an action often arrives many steps later, you cannot even write
          down a per-decision loss the way empirical risk minimization assumes — the object being
          optimized is an expected, discounted sum of rewards over an entire trajectory, and the
          genuinely hard problem — credit assignment, deciding which of the last fifty actions
          actually caused this reward — has no analogue in the other four paradigms at all.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\hat{f} = \\arg\\min_{f \\in \\mathcal{H}} \\; \\frac{1}{n}\\sum_{i=1}^n L(f(x_i), y_i)"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Empirical risk minimization — choose the function <code>f</code>, out of some allowed
          hypothesis class <code>ℋ</code>, that minimizes the average loss over the data you have.
          Every paradigm above is this same minimization, with a different answer to "what data
          estimates the sum, and what does <code>L</code> measure." <strong>Supervised</strong>{" "}
          learning has direct <code>(x, y)</code> pairs, so <code>L</code> compares a prediction to
          a true label directly — squared error, cross-entropy. <strong>Unsupervised</strong>{" "}
          learning has only <code>x</code>'s, so <code>L</code> has to be rewritten to not need{" "}
          <code>y</code> at all — reconstruction error, the negative log-likelihood of{" "}
          <code>x</code> under a fitted density, or a clustering distortion like the k-means
          objective used in the diagram below. <strong>Semi-supervised</strong> learning literally
          sums two losses over two different subsets of the same <code>n</code> — a supervised term
          over the few labeled points, plus an unsupervised term over the many unlabeled ones,
          weighted against each other. <strong>Self-supervised</strong> learning keeps{" "}
          <code>L</code> exactly as it is in the supervised case — it just generates <code>y</code>{" "}
          mechanically from <code>x</code> instead of collecting it from a human.{" "}
          <strong>Reinforcement learning</strong> replaces the whole framing: there is no fixed{" "}
          <code>n</code> and no per-example <code>(x, y)</code> pair at all — the object being
          maximized is an expected return accumulated over an entire sequence of decisions rather
          than compared against a single input-output pair, which is why its own empirical-risk view
          is deferred to a dedicated module later in this chapter instead of being forced into the
          formula above.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Derivation: why the empirical risk of your final model is optimistic"
      >
        <p>
          Define two risks for a candidate function <code>f</code> that is fixed — chosen in
          advance, not yet fit to any particular sample:
        </p>
        <Formula>
          {
            "R(f) = \\mathbb{E}_{(x,y)\\sim P}\\big[L(f(x), y)\\big] \\qquad \\hat{R}(f) = \\frac{1}{n}\\sum_{i=1}^n L(f(x_i), y_i)"
          }
        </Formula>
        <p>
          <code>R(f)</code> is the <strong>true risk</strong> — the average loss <code>f</code>{" "}
          would incur over the entire, unobservable population <code>P</code>. <code>R̂(f)</code> is
          the <strong>empirical risk</strong> — the average loss actually measured on the{" "}
          <code>n</code> training samples you happen to have drawn. Because those samples are i.i.d.
          draws from <code>P</code> and <code>f</code> is fixed, each term{" "}
          <code>L(f(x_i), y_i)</code> is an independent, identically distributed copy of the same
          random variable <code>L(f(x), y)</code>. Linearity of expectation then gives:
        </p>
        <Formula>
          {
            "\\mathbb{E}\\big[\\hat{R}(f)\\big] = \\mathbb{E}\\Big[\\frac{1}{n}\\sum_{i=1}^n L(f(x_i), y_i)\\Big] = \\frac{1}{n}\\sum_{i=1}^n \\mathbb{E}\\big[L(f(x_i), y_i)\\big] = \\frac{1}{n}\\sum_{i=1}^n R(f) = R(f)"
          }
        </Formula>
        <p>
          So for any <code>f</code> fixed before this sample was drawn, the empirical risk is an{" "}
          <strong>unbiased estimator</strong> of the true risk, and by the law of large numbers it
          concentrates around <code>R(f)</code> more tightly as <code>n</code> grows. That sounds
          like it should make empirical risk minimization trustworthy by construction — it doesn't,
          and the reason is worth stating carefully.
        </p>
        <p>
          <strong>
            The proof above requires <code>f</code> to be fixed before the sample is drawn.
          </strong>{" "}
          The <code>f̂</code> that empirical risk minimization actually returns is not fixed in
          advance — it is chosen specifically because it looks good on this exact sample:{" "}
          <code>f̂ = argmin over f in ℋ of R̂(f)</code>. That search preferentially selects whichever
          candidate happens to look best on this training set, which means it selects not only for
          genuinely low true risk, but partly for having drawn a favorable noise realization on this
          particular sample. Once <code>f̂</code> depends on the same data used to compute{" "}
          <code>R̂(f̂)</code>, the independence that made the expectation calculation above valid is
          gone — you can no longer swap "take an expectation" and "evaluate at <code>f̂</code>" the
          way the derivation did for a fixed <code>f</code>. In practice this shows up as:
        </p>
        <Formula>{"\\mathbb{E}\\big[\\hat{R}(\\hat{f})\\big] \\; \\le \\; R(\\hat{f})"}</Formula>
        <p>
          known as the <strong>optimism of the training error</strong>: the empirical risk measured
          at the chosen solution systematically underestimates that same solution's true risk, on
          average. The size of this gap — <code>R(f̂) − R̂(f̂)</code>, the{" "}
          <strong>generalization gap</strong> — grows with how large and flexible <code>ℋ</code> is,
          since a bigger hypothesis class simply gives the argmin more candidates to search through
          for a lucky-looking fit. That growth is exactly the seed of the overfitting and capacity
          discussion later in this module.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is the entire reason held-out validation and
          test sets exist. Evaluate <code>f̂</code>'s loss on a fresh batch of samples that played no
          role in choosing <code>f̂</code>, and independence is restored — that fresh empirical risk
          is once again an unbiased estimate of <code>R(f̂)</code>, exactly as the derivation above
          proves for any fixed <code>f</code>. Reusing training data to both fit a model and report
          its performance measures optimism, not accuracy.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="The same 100 points, three different amounts of information"
        caption="Every dot is a simulated house at a fixed (square footage, distance from downtown) position — the positions never move across views. Only how much of each dot's true price bracket you're allowed to see changes as you switch paradigm; the slider controls exactly how many labels are revealed in the semi-supervised view."
      >
        <DiagramHost render={renderParadigmScatter} />
      </DiagramBlock>
      <MultiCodeExample
        id="code"
        title="The same 10 points, used two different ways — implemented three ways"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import math
import random

# The same 10 points, used two different ways.
# Each point is (feature_1, feature_2, true_label) — the label is only
# ever read by the supervised half below; the unsupervised half never
# looks at the third element at all.
points = [
    (1.0, 2.0, 0), (1.2, 1.8, 0), (1.5, 2.2, 0), (1.1, 2.5, 0), (1.4, 1.9, 0),
    (3.0, 4.0, 1), (3.2, 3.8, 1), (3.5, 4.2, 1), (3.1, 4.5, 1), (3.4, 3.9, 1),
]

# --- (a) SUPERVISED: empirical risk minimization for logistic regression ---
# Hypothesis: f(x) = sigmoid(w1*x1 + w2*x2 + b)
# Loss: binary cross-entropy, averaged over all n=10 labeled points.
def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))

w1, w2, b = 0.0, 0.0, 0.0
lr = 0.1
for epoch in range(500):
    grad_w1 = grad_w2 = grad_b = 0.0
    for x1, x2, y in points:
        pred = sigmoid(w1 * x1 + w2 * x2 + b)
        error = pred - y                # this is dL/d(pre-activation)
        grad_w1 += error * x1
        grad_w2 += error * x2
        grad_b += error
    n = len(points)
    w1 -= lr * grad_w1 / n
    w2 -= lr * grad_w2 / n
    b -= lr * grad_b / n

print("learned weights:", w1, w2, b)
for x1, x2, y in points:
    pred = sigmoid(w1 * x1 + w2 * x2 + b)
    print("true=", y, " predicted_prob=", round(pred, 3))

# --- (b) UNSUPERVISED: the same 10 points, labels never touched below ---
# k-means, k=2: assign each point to its nearest centroid, then move each
# centroid to the mean of the points assigned to it. Repeat.
xy = [(x1, x2) for x1, x2, _ in points]
random.seed(0)
centroids = random.sample(xy, 2)         # two random points as starting centroids

for _ in range(10):
    clusters = [[], []]
    for x1, x2 in xy:
        d0 = (x1 - centroids[0][0]) ** 2 + (x2 - centroids[0][1]) ** 2
        d1 = (x1 - centroids[1][0]) ** 2 + (x2 - centroids[1][1]) ** 2
        clusters[0 if d0 <= d1 else 1].append((x1, x2))
    for k in range(2):
        if clusters[k]:
            mean_x = sum(p[0] for p in clusters[k]) / len(clusters[k])
            mean_y = sum(p[1] for p in clusters[k]) / len(clusters[k])
            centroids[k] = (mean_x, mean_y)

print("cluster centroids found with no labels at all:", centroids)`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <array>
#include <cmath>
#include <cstdio>
#include <vector>

struct Point {
    double x1, x2;
    int label;   // only ever read by the supervised half below
};

double sigmoid(double z) {
    return 1.0 / (1.0 + std::exp(-z));
}

int main() {
    std::vector<Point> points = {
        {1.0, 2.0, 0}, {1.2, 1.8, 0}, {1.5, 2.2, 0}, {1.1, 2.5, 0}, {1.4, 1.9, 0},
        {3.0, 4.0, 1}, {3.2, 3.8, 1}, {3.5, 4.2, 1}, {3.1, 4.5, 1}, {3.4, 3.9, 1},
    };

    // (a) SUPERVISED: empirical risk minimization for logistic regression,
    // plain batch gradient descent, no libraries.
    double w1 = 0.0, w2 = 0.0, b = 0.0;
    const double lr = 0.1;
    const int n = static_cast<int>(points.size());

    for (int epoch = 0; epoch < 500; ++epoch) {
        double grad_w1 = 0.0, grad_w2 = 0.0, grad_b = 0.0;
        for (const auto& p : points) {
            double pred = sigmoid(w1 * p.x1 + w2 * p.x2 + b);
            double error = pred - p.label;
            grad_w1 += error * p.x1;
            grad_w2 += error * p.x2;
            grad_b += error;
        }
        w1 -= lr * grad_w1 / n;
        w2 -= lr * grad_w2 / n;
        b  -= lr * grad_b  / n;
    }

    std::printf("learned weights: w1=%.4f w2=%.4f b=%.4f\\n", w1, w2, b);
    for (const auto& p : points) {
        double pred = sigmoid(w1 * p.x1 + w2 * p.x2 + b);
        std::printf("true=%d predicted_prob=%.3f\\n", p.label, pred);
    }

    // (b) UNSUPERVISED: the same points, labels never read below this line.
    struct Centroid { double x, y; };
    std::array<Centroid, 2> centroids = {
        Centroid{points[0].x1, points[0].x2},
        Centroid{points[5].x1, points[5].x2},
    };

    for (int iter = 0; iter < 10; ++iter) {
        std::vector<std::vector<int>> clusters(2);
        for (int i = 0; i < n; ++i) {
            double d0 = std::pow(points[i].x1 - centroids[0].x, 2) +
                        std::pow(points[i].x2 - centroids[0].y, 2);
            double d1 = std::pow(points[i].x1 - centroids[1].x, 2) +
                        std::pow(points[i].x2 - centroids[1].y, 2);
            clusters[d0 <= d1 ? 0 : 1].push_back(i);
        }
        for (int k = 0; k < 2; ++k) {
            if (clusters[k].empty()) continue;
            double sumX = 0.0, sumY = 0.0;
            for (int idx : clusters[k]) {
                sumX += points[idx].x1;
                sumY += points[idx].x2;
            }
            centroids[k].x = sumX / clusters[k].size();
            centroids[k].y = sumY / clusters[k].size();
        }
    }

    std::printf(
        "cluster centroids found with no labels at all: (%.2f, %.2f) and (%.2f, %.2f)\\n",
        centroids[0].x, centroids[0].y, centroids[1].x, centroids[1].y);
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans

X = np.array([
    [1.0, 2.0], [1.2, 1.8], [1.5, 2.2], [1.1, 2.5], [1.4, 1.9],
    [3.0, 4.0], [3.2, 3.8], [3.5, 4.2], [3.1, 4.5], [3.4, 3.9],
])
y = np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])

# (a) SUPERVISED — the entire 500-epoch gradient descent loop above collapses
# to one call: sklearn picks the solver, the step-size schedule, and the
# stopping rule for you.
clf = LogisticRegression().fit(X, y)
print(clf.predict_proba(X)[:, 1])   # predicted probability of "expensive"

# (b) UNSUPERVISED — same X, but no y is passed in at all.
kmeans = KMeans(n_clusters=2, n_init=10, random_state=0).fit(X)
print(kmeans.cluster_centers_)
print(kmeans.labels_)`,
          },
        ]}
      >
        <p>
          The same ten <code>(x1, x2)</code> points are used for both halves below — the supervised
          half additionally reads their label; the unsupervised k-means half never touches the label
          field at all, and still finds essentially the same two groups just from geometry. The
          from-scratch columns show every gradient and every centroid update explicitly; the library
          column shows the same two computations the way you'd actually write them.
        </p>
      </MultiCodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Supervised</strong> — spam filters, where the label (spam / not spam) comes from
            user reports, and price or demand forecasting, where the label is the actual realized
            sale price or units sold. Credit scoring and loan-default prediction follow the same
            pattern: a lender trains on years of past applications where the true outcome (repaid
            vs. defaulted) is already on record, then scores new applicants whose outcome hasn't
            happened yet — the model is only ever as trustworthy as how faithfully those historical
            outcomes were recorded.
          </li>
          <li>
            <strong>Unsupervised</strong> — customer segmentation, clustering purchase histories
            into groups with no pre-defined "segment" label, then naming and interpreting the
            clusters after the fact. Scientific discovery leans on the same trick in the opposite
            direction: astronomical sky surveys cluster or density-estimate millions of recorded
            light curves and flag whichever ones sit in an unusually sparse region of that space —
            candidates for a genuinely new class of astrophysical object that, by definition, no one
            could have labeled in advance, because no one had ever seen it before.
          </li>
          <li>
            <strong>Semi-supervised</strong> — medical imaging, where a radiologist's confirmed
            diagnosis is expensive and scarce but raw scans are comparatively cheap to collect; a
            small labeled set combined with a large unlabeled set can train a substantially better
            model than the labeled set alone. Bank fraud review works the same way: only the small
            fraction of transactions that were actually escalated and investigated end up with a
            confirmed fraud/legitimate tag, while millions of others sit unlabeled, and the cluster
            assumption — transactions that resemble a confirmed fraud case are more likely fraud
            themselves — is what lets that unlabeled majority still pull its weight.
          </li>
          <li>
            <strong>Self-supervised</strong> — BERT- and GPT-style language model pretraining
            (predict a masked or next token, using the surrounding text as its own label) and
            contrastive image pretraining (predict that two augmented crops came from the same
            photo), both usually followed by supervised fine-tuning on a much smaller labeled set.
            Structural biology runs the identical playbook on a different alphabet: pretraining on
            vast databases of raw, unlabeled protein sequences to learn a general-purpose sense of
            "what a plausible protein looks like," which is then fine-tuned on the comparatively
            tiny number of structures that have actually been solved experimentally.
          </li>
          <li>
            <strong>Reinforcement learning</strong> — game-playing agents (reward: win or lose) and
            ad-serving or recommendation bandits (reward: click or no click), where — unlike a
            supervised click-through model trained once on a fixed historical log — the bandit's own
            past choices determine which items it even gets shown feedback on next, forcing it to
            actively balance exploring uncertain options against exploiting ones it already knows
            work. Robotics is the physical-world version of the same idea: a warehouse arm learning
            to grasp objects through repeated trial and error, often in simulation first, off a
            reward as sparse as "did the object end up in the bin," with no dataset of correct
            grasping motions ever handed to it up front. Reinforcement learning gets its own
            dedicated module later in this chapter; it's included here only as a pointer to where it
            fits relative to the other four.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            <strong>"Unsupervised" doesn't mean "assumption-free."</strong> Removing labels doesn't
            remove the need for assumptions — it just moves them into the loss and hypothesis class
            instead. k-means silently assumes clusters are round and similarly sized; a density
            model assumes a particular family of distributions. No labels is not the same thing as
            no bias.
          </li>
          <li>
            <strong>Semi-supervised isn't "just add more data."</strong> Which <code>x</code>'s
            happen to be labeled is rarely a random sample of the full population — labels tend to
            exist for the cases that were easy, cheap, or already flagged for review. Treating the
            unlabeled bulk as freely informative without checking for that label-selection bias can
            make the combined model worse than the labeled-only baseline, not better.
          </li>
          <li>
            <strong>Self-supervised is not unsupervised.</strong> It's easy to lump the two together
            because neither uses a human-provided label, but self-supervised learning still
            minimizes a completely ordinary <code>L(f(x), y)</code> supervised-style loss — the only
            thing that changed is who wrote the function that generates <code>y</code>. Confusing
            the two obscures exactly why self-supervised pretraining transfers so well: it's solving
            genuinely supervised-style prediction problems, just enormous numbers of cheap,
            auto-generated ones.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The cleanest modern framing collapses the supervised-versus-unsupervised distinction into
          a question about where <code>y</code> comes from, not what kind of learning is happening.
          Large-scale self-supervised pretraining followed by supervised fine-tuning — the recipe
          behind essentially every current foundation model — spends the overwhelming majority of
          its compute on an "unsupervised-looking" pile of raw text or images, but every single
          gradient step inside that pretraining is still ordinary supervised empirical risk
          minimization against a mechanically generated label. The classical supervised/unsupervised
          line was never really about the mechanics of optimization; it was about label cost, and in
          practice that line has mostly dissolved.
        </p>
        <p>
          Section 2.1.2 (Statistical Decision Theory) makes this precise from the other direction —
          it shows that the loss function <code>L</code> is not an arbitrary design choice at all,
          but is forced by the risk you actually want to minimize once you state your problem in
          decision-theoretic terms. Once that's internalized, the right way to read this entire page
          is that the five "paradigms" only ever change what data is available to estimate a risk —
          never the minimization principle in the formula above. Reinforcement learning is the sole
          exception that additionally changes the object being minimized, a trajectory return
          instead of a pointwise loss; the other four are, underneath, small variations on exactly
          the same equation.
        </p>
      </ExpertNote>
      <Quiz
        q="A model is trained to predict the missing word in a sentence, and no human ever supplied a label. Is this supervised, unsupervised, or self-supervised learning — and why does the answer matter?"
        a="Self-supervised. It's tempting to call it unsupervised because no human-provided label was involved, but the training loop is minimizing a completely ordinary cross-entropy loss between a prediction and a true label — the label just happens to be the word that was mechanically blanked out of the input, rather than something a human annotator wrote down. Genuinely unsupervised methods use losses that don't require a y at all, such as reconstruction error, a clustering distortion, or a density's log-likelihood. The distinction matters because it explains why self-supervised objectives behave like supervised ones in practice, including needing enough of the right kind of data, and being just as capable of overfitting to spurious patterns in that manufactured label as any hand-labeled supervised problem."
      />
      <Takeaway>
        <p>
          Every one of these five paradigms is the same empirical-risk-minimization principle from
          the formula above, wearing a different data-availability constraint: supervised gets
          direct <code>(x, y)</code> pairs, unsupervised gets a loss that never needs <code>y</code>
          , semi-supervised mixes both over the same sample, self-supervised manufactures{" "}
          <code>y</code> from <code>x</code> itself, and reinforcement learning replaces the whole
          per-example framing with a reward accumulated over a sequence of decisions. Keep that
          unifying view in mind heading into Section 2.1.2, where the loss function <code>L</code>{" "}
          stops being a design choice and turns out to be forced by decision theory instead.
        </p>
      </Takeaway>
    </>
  );
}
