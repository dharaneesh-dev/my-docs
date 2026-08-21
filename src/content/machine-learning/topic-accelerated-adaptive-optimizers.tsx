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
  toggleGroup,
} from "@/lib/diagram-helpers";

/**
 * 2.2.3 diagram — the same elongated ("stretched-bowl") quadratic surface used in the
 * previous lesson, f(x,y) = 0.5*(KX*x^2 + KY*y^2) with KY >> KX. Two or three optimizers
 * race from the same starting point toward the origin: plain gradient descent (many small
 * zig-zagging steps), momentum (builds speed along the shallow axis, damps the steep one),
 * and Adam (per-parameter adaptive scaling on top of momentum). Every trajectory is computed
 * live from the actual update rule, then played back with animate() step by step.
 */
const KX = 1;
const KY = 6;
const START_X = -3.6;
const START_Y = 1.9;
const TOL = 0.25;
const MAX_STEPS = 60;
const BOUND = 12;

type Pt = { x: number; y: number };

function gradF(p: Pt): Pt {
  return { x: KX * p.x, y: KY * p.y };
}

function runGD(lr: number, steps: number): Pt[] {
  const path: Pt[] = [{ x: START_X, y: START_Y }];
  let p = { x: START_X, y: START_Y };
  for (let k = 0; k < steps; k++) {
    const g = gradF(p);
    p = { x: p.x - lr * g.x, y: p.y - lr * g.y };
    path.push(p);
  }
  return path;
}

function runMomentum(lr: number, beta: number, steps: number): Pt[] {
  const path: Pt[] = [{ x: START_X, y: START_Y }];
  let p = { x: START_X, y: START_Y };
  let v = { x: 0, y: 0 };
  for (let k = 0; k < steps; k++) {
    const g = gradF(p);
    v = { x: beta * v.x + g.x, y: beta * v.y + g.y };
    p = { x: p.x - lr * v.x, y: p.y - lr * v.y };
    path.push(p);
  }
  return path;
}

function runAdam(lr: number, steps: number): Pt[] {
  const b1 = 0.9,
    b2 = 0.999,
    eps = 1e-8;
  const path: Pt[] = [{ x: START_X, y: START_Y }];
  let p = { x: START_X, y: START_Y };
  let m = { x: 0, y: 0 };
  let v = { x: 0, y: 0 };
  for (let k = 1; k <= steps; k++) {
    const g = gradF(p);
    m = { x: b1 * m.x + (1 - b1) * g.x, y: b1 * m.y + (1 - b1) * g.y };
    v = { x: b2 * v.x + (1 - b2) * g.x * g.x, y: b2 * v.y + (1 - b2) * g.y * g.y };
    const mHat = { x: m.x / (1 - b1 ** k), y: m.y / (1 - b1 ** k) };
    const vHat = { x: v.x / (1 - b2 ** k), y: v.y / (1 - b2 ** k) };
    p = {
      x: p.x - lr * (mHat.x / (Math.sqrt(vHat.x) + eps)),
      y: p.y - lr * (mHat.y / (Math.sqrt(vHat.y) + eps)),
    };
    path.push(p);
  }
  return path;
}

function firstConvergedIndex(path: Pt[]) {
  for (let i = 0; i < path.length; i++) {
    if (Math.sqrt(path[i].x ** 2 + path[i].y ** 2) < TOL) return i;
    if (!Number.isFinite(path[i].x) || Math.abs(path[i].x) > BOUND) return -1;
  }
  return null;
}

const GD_COLOR = "#4f5fe0";
const MOM_COLOR = "#b8720c";
const ADAM_COLOR = "#7c3aed";

const renderOptimizerRace: DiagramRender = (host) => {
  const PLOT_LEFT = 40,
    PLOT_RIGHT = 400,
    PLOT_TOP = 20,
    PLOT_BOTTOM = 260;
  const X_MIN = -4.4,
    X_MAX = 4.4,
    Y_MIN = -3.0,
    Y_MAX = 3.0;
  const scaleX = (PLOT_RIGHT - PLOT_LEFT) / (X_MAX - X_MIN);
  const scaleY = (PLOT_BOTTOM - PLOT_TOP) / (Y_MAX - Y_MIN);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const mapX = (v: number) => PLOT_LEFT + (clamp(v, X_MIN, X_MAX) - X_MIN) * scaleX;
  const mapY = (v: number) => PLOT_BOTTOM - (clamp(v, Y_MIN, Y_MAX) - Y_MIN) * scaleY;

  const s = svg("0 0 440 285");

  const ECC = Math.sqrt(KY / KX);
  [0.7, 1.4, 2.2, 3.1, 4.0].forEach((rx) => {
    const ry = rx / ECC;
    s.appendChild(
      el("ellipse", {
        cx: mapX(0),
        cy: mapY(0),
        rx: rx * scaleX,
        ry: ry * scaleY,
        fill: "none",
        stroke: "#dfe1ec",
        "stroke-width": 1,
      }),
    );
  });

  s.appendChild(el("circle", { cx: mapX(0), cy: mapY(0), r: 4, fill: "#111827" }));

  function pathD(pts: Pt[]) {
    return pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${mapX(p.x).toFixed(1)},${mapY(p.y).toFixed(1)}`)
      .join(" ");
  }

  const gdTrail = el("path", {
    d: "",
    fill: "none",
    stroke: GD_COLOR,
    "stroke-width": 1.5,
    opacity: 0.55,
  });
  const momTrail = el("path", {
    d: "",
    fill: "none",
    stroke: MOM_COLOR,
    "stroke-width": 1.5,
    opacity: 0.55,
  });
  const adamTrail = el("path", {
    d: "",
    fill: "none",
    stroke: ADAM_COLOR,
    "stroke-width": 1.5,
    opacity: 0.55,
  });
  s.appendChild(gdTrail);
  s.appendChild(momTrail);
  s.appendChild(adamTrail);

  function dot(color: string) {
    return el("circle", {
      cx: mapX(START_X),
      cy: mapY(START_Y),
      r: 5.5,
      fill: color,
      stroke: "white",
      "stroke-width": 1.5,
    });
  }
  const gdDot = dot(GD_COLOR);
  const momDot = dot(MOM_COLOR);
  const adamDot = dot(ADAM_COLOR);
  s.appendChild(gdDot);
  s.appendChild(momDot);
  s.appendChild(adamDot);

  host.appendChild(s);

  const legend = document.createElement("div");
  legend.className = "mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px]";
  function swatch(color: string, label: string) {
    const item = document.createElement("span");
    item.className = "inline-flex items-center gap-1.5 text-muted-foreground";
    const d = document.createElement("span");
    d.style.display = "inline-block";
    d.style.width = "10px";
    d.style.height = "10px";
    d.style.borderRadius = "999px";
    d.style.backgroundColor = color;
    item.appendChild(d);
    const t = document.createElement("span");
    t.textContent = label;
    item.appendChild(t);
    return item;
  }
  legend.appendChild(swatch(GD_COLOR, "Plain gradient descent"));
  legend.appendChild(swatch(MOM_COLOR, "Momentum (β = 0.9)"));
  legend.appendChild(swatch(ADAM_COLOR, "Adam"));
  host.appendChild(legend);

  const out = readout(host, "");

  function labelFor(idx: number | null) {
    if (idx === -1) return "diverged";
    if (idx === null) return `>${MAX_STEPS} steps`;
    return `${idx} steps`;
  }

  let lr = 0.12;
  let active: (() => void) | null = null;

  function runRace(animated: boolean) {
    if (active) {
      active();
      active = null;
    }
    const gdPath = runGD(lr, MAX_STEPS);
    const momPath = runMomentum(lr, 0.9, MAX_STEPS);
    const adamPath = runAdam(Math.max(lr, 0.25), MAX_STEPS);

    if (!animated) {
      gdTrail.setAttribute("d", pathD(gdPath));
      momTrail.setAttribute("d", pathD(momPath));
      adamTrail.setAttribute("d", pathD(adamPath));
      const last = (p: Pt[]) => p[p.length - 1];
      gdDot.setAttribute("cx", String(mapX(last(gdPath).x)));
      gdDot.setAttribute("cy", String(mapY(last(gdPath).y)));
      momDot.setAttribute("cx", String(mapX(last(momPath).x)));
      momDot.setAttribute("cy", String(mapY(last(momPath).y)));
      adamDot.setAttribute("cx", String(mapX(last(adamPath).x)));
      adamDot.setAttribute("cy", String(mapY(last(adamPath).y)));
      out.set(
        `GD: ${labelFor(firstConvergedIndex(gdPath))}   Momentum: ${labelFor(firstConvergedIndex(momPath))}   Adam: ${labelFor(firstConvergedIndex(adamPath))}`,
      );
      return;
    }

    let frame = 0;
    const totalFrames = MAX_STEPS;
    const cancel = animate(
      totalFrames * 45,
      (_eased, t) => {
        frame = Math.round(t * totalFrames);
        const gi = Math.min(frame, gdPath.length - 1);
        const mi = Math.min(frame, momPath.length - 1);
        const ai = Math.min(frame, adamPath.length - 1);
        gdTrail.setAttribute("d", pathD(gdPath.slice(0, gi + 1)));
        momTrail.setAttribute("d", pathD(momPath.slice(0, mi + 1)));
        adamTrail.setAttribute("d", pathD(adamPath.slice(0, ai + 1)));
        gdDot.setAttribute("cx", String(mapX(gdPath[gi].x)));
        gdDot.setAttribute("cy", String(mapY(gdPath[gi].y)));
        momDot.setAttribute("cx", String(mapX(momPath[mi].x)));
        momDot.setAttribute("cy", String(mapY(momPath[mi].y)));
        adamDot.setAttribute("cx", String(mapX(adamPath[ai].x)));
        adamDot.setAttribute("cy", String(mapY(adamPath[ai].y)));
        out.set(
          `step ${frame}/${totalFrames}   GD: ${labelFor(firstConvergedIndex(gdPath.slice(0, gi + 1)))}   Momentum: ${labelFor(firstConvergedIndex(momPath.slice(0, mi + 1)))}   Adam: ${labelFor(firstConvergedIndex(adamPath.slice(0, ai + 1)))}`,
        );
      },
      () => {
        out.set(
          `GD: ${labelFor(firstConvergedIndex(gdPath))}   Momentum: ${labelFor(firstConvergedIndex(momPath))}   Adam: ${labelFor(firstConvergedIndex(adamPath))}`,
        );
      },
      ease.linear,
    );
    active = cancel;
  }

  runRace(true);

  sliderControl(host, "Learning rate", { min: 0.02, max: 0.34, step: 0.01, value: lr }, (v) => {
    lr = v;
    runRace(true);
  });

  toggleGroup(
    host,
    [
      { label: "Race (animated)", value: "race" },
      { label: "Show final only", value: "final" },
    ],
    "race",
    (v) => runRace(v === "race"),
  );

  replayButton(host, "▶ Replay race", () => runRace(true));

  return () => {
    if (active) active();
  };
};

export function AcceleratedAdaptiveOptimizers() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> the previous lesson showed plain gradient descent zig-zagging
          across a narrow, stretched valley — bouncing back and forth across the steep direction
          while crawling painfully slowly along the shallow one. <strong>Momentum</strong> fixes
          this the way a heavy ball rolling downhill would: give the step some inertia, so it
          doesn't reverse direction every time the gradient flips sign, and it keeps building speed
          in whichever direction has stayed consistent. The methods in this lesson are all
          variations on that one idea — remembering something about past gradients instead of only
          ever looking at the current one.
        </p>
        <p>
          <strong>Intermediate:</strong> each method changes the plain update rule in one specific,
          nameable way:
        </p>
        <ul>
          <li>
            <strong>Momentum</strong> keeps a running, exponentially-weighted average of past
            gradients and steps in that averaged direction instead of the raw current gradient.
          </li>
          <li>
            <strong>Nesterov momentum</strong> makes one subtle but real improvement: it computes
            the gradient at where momentum is <em>about to</em> carry the point, not at the current
            point — a small "look-ahead" correction that measurably speeds up convergence on smooth
            problems.
          </li>
          <li>
            <strong>AdaGrad</strong> gives every parameter its own learning rate, shrinking it for
            parameters whose gradients have historically been large — so a frequently-updated, steep
            direction automatically slows down, letting a rarely-updated, shallow direction catch
            up.
          </li>
          <li>
            <strong>RMSProp</strong> fixes AdaGrad's one real flaw: AdaGrad's per-parameter rate is
            built from an ever-growing sum of squared gradients, so it eventually shrinks to
            essentially zero and training stalls. RMSProp replaces that sum with a <em>decaying</em>{" "}
            average, so old gradients eventually stop mattering instead of permanently weighing the
            rate down.
          </li>
          <li>
            <strong>Adam</strong> combines both ideas at once: momentum (a first-moment running
            average of the gradient itself) and RMSProp-style adaptive per-parameter scaling (a
            second-moment running average of the squared gradient), plus a bias-correction term that
            fixes both averages being unreliable in the first few steps, when they've barely started
            accumulating anything.
          </li>
        </ul>
        <p>
          <strong>Advanced:</strong> <strong>AdamW</strong> fixes a specific, subtle bug in how Adam
          is normally combined with weight decay (an L2-style penalty pulling parameters toward
          zero): if you just add the penalty's gradient into the raw gradient before Adam's adaptive
          scaling divides by the accumulated squared-gradient average, the effective decay strength
          ends up different for every parameter — parameters with historically large gradients get{" "}
          <em>less</em> decay than intended, exactly backwards from what a uniform regularization
          strength is supposed to do. AdamW decouples the two: apply Adam's adaptive update to the
          loss gradient alone, then apply the weight decay as a separate, uniform shrinkage step
          afterward. Despite this, no single optimizer in this lesson strictly dominates the others
          — Adam/AdamW are the default for training transformers and most modern deep nets, but
          plain SGD with momentum still wins in some carefully-tuned computer vision training
          recipes, generalizing very slightly better even though it converges a bit more slowly.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "v_k = \\beta v_{k-1} + \\nabla f(\\theta_k), \\qquad \\theta_{k+1} = \\theta_k - \\alpha v_k"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Momentum's update: a running average of gradients, stepped by a fixed learning rate.
        </p>
        <Formula>
          {
            "m_k = \\beta_1 m_{k-1} + (1-\\beta_1)g_k, \\quad v_k = \\beta_2 v_{k-1} + (1-\\beta_2)g_k^2, \\quad \\hat m_k = \\frac{m_k}{1-\\beta_1^k}, \\quad \\hat v_k = \\frac{v_k}{1-\\beta_2^k}"
          }
        </Formula>
        <Formula>
          {"\\theta_{k+1} = \\theta_k - \\alpha \\frac{\\hat m_k}{\\sqrt{\\hat v_k} + \\epsilon}"}
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Adam's full update: a bias-corrected first moment (momentum) divided by a bias-corrected
          second moment's square root (the adaptive, per-parameter scaling), plus a tiny{" "}
          <code>ε</code> to avoid dividing by zero early on.
        </p>
      </SectionBlock>
      <Derivation title="Derivation: why momentum specifically fixes the elongated-valley problem">
        <p>
          Set up the same toy quadratic from the previous lesson,{" "}
          <code>f(x,y) = ½(c₁x² + c₂y²)</code> with <code>c₁ ≫ c₂</code> (a bowl much steeper in{" "}
          <code>x</code> than in <code>y</code>). Plain gradient descent updates each coordinate
          independently: <code>x_{"{k+1}"} = (1-αc₁)x_k</code> and{" "}
          <code>y_{"{k+1}"} = (1-αc₂)y_k</code>. Stability in the steep <code>x</code> direction
          requires <code>|1-αc₁| &lt; 1</code>, i.e. <code>α &lt; 2/c₁</code> — this caps how large{" "}
          <code>α</code> can be. But that same small <code>α</code>, applied to the <code>y</code>{" "}
          update, gives a convergence factor <code>(1-αc₂)</code> that's very close to 1 whenever{" "}
          <code>c₂ ≪ c₁</code> — meaning progress along the shallow direction is agonizingly slow,
          precisely because the step size had to be kept small by the unrelated steep direction.
        </p>
        <p>
          Now trace what momentum's running average <code>v_k = βv_{"{k-1}"} + ∇f(θ_k)</code> does
          to each coordinate separately. Along the steep <code>x</code> direction, gradient descent
          overshoots the minimum every step or two once <code>α</code> is anywhere near its
          stability limit — the per-step gradient <code>c₁x_k</code> keeps <em>flipping sign</em> as{" "}
          <code>x_k</code> oscillates around zero. Averaging a sequence of gradients that keeps
          flipping sign causes substantial <strong>cancellation</strong>: the running average{" "}
          <code>v_k</code>'s <code>x</code>-component ends up smaller in magnitude than the raw
          gradient, damping the oscillation. Along the shallow <code>y</code> direction, by
          contrast, the gradient <code>c₂y_k</code> keeps the <em>same sign</em> step after step
          (the point is still consistently far from the minimum in that direction) — averaging a
          sequence of same-signed numbers causes no cancellation at all; instead the terms{" "}
          <strong>accumulate</strong>, so <code>v_k</code>'s <code>y</code>-component grows larger
          than any single gradient, in effect taking a bigger, more confident step exactly where a
          bigger step was safe all along.
        </p>
        <p>
          This is the precise mechanism, not just an empirical observation: momentum damps
          oscillating (steep-direction) components via cancellation in the running average, and
          amplifies consistent (shallow-direction) components via accumulation in that same average,
          using one and the same update rule.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this exact elongated-valley failure mode is extremely common in real
          loss landscapes whenever input features are correlated or poorly scaled — which is nearly
          always — and it's precisely why momentum (or Adam, which includes it) is a default choice
          in virtually every deep learning training loop, not an optional nicety.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Three optimizers race toward the minimum of the same stretched bowl"
        caption="Blue = plain gradient descent, amber = momentum, violet = Adam — all three compute their real update rule live and are played back step by step. Drag the learning-rate slider and re-run to see GD destabilize far sooner than the other two."
      >
        <DiagramHost render={renderOptimizerRace} />
      </DiagramBlock>
      <MultiCodeExample
        title="Practical example — plain GD, momentum, and Adam on the same elongated bowl"
        tabs={[
          {
            label: "Python (from scratch)",
            lang: "python",
            code: `import numpy as np

KX, KY = 1.0, 6.0  # same elongated bowl as the diagram

def grad(p):
    return np.array([KX * p[0], KY * p[1]])

def run_gd(lr, steps, p0):
    p = np.array(p0, dtype=float)
    for _ in range(steps):
        p = p - lr * grad(p)
    return p

def run_momentum(lr, beta, steps, p0):
    p = np.array(p0, dtype=float)
    v = np.zeros(2)
    for _ in range(steps):
        v = beta * v + grad(p)
        p = p - lr * v
    return p

def run_adam(lr, steps, p0, b1=0.9, b2=0.999, eps=1e-8):
    p = np.array(p0, dtype=float)
    m = np.zeros(2)
    v = np.zeros(2)
    for k in range(1, steps + 1):
        g = grad(p)
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        m_hat = m / (1 - b1 ** k)
        v_hat = v / (1 - b2 ** k)
        p = p - lr * m_hat / (np.sqrt(v_hat) + eps)
    return p

start = [-3.6, 1.9]
print("GD final:      ", run_gd(0.12, 60, start))
print("Momentum final:", run_momentum(0.12, 0.9, 60, start))
print("Adam final:    ", run_adam(0.25, 60, start))
# All converge toward (0, 0); momentum and Adam typically get there in far fewer
# effective steps for a given stable learning rate than plain GD does.`,
          },
          {
            label: "C++ (from scratch)",
            lang: "cpp",
            code: `#include <array>
#include <cmath>
#include <iostream>

constexpr double KX = 1.0, KY = 6.0;

std::array<double, 2> grad(std::array<double, 2> p) {
    return {KX * p[0], KY * p[1]};
}

std::array<double, 2> runGD(double lr, int steps, std::array<double, 2> p) {
    for (int k = 0; k < steps; ++k) {
        auto g = grad(p);
        p[0] -= lr * g[0];
        p[1] -= lr * g[1];
    }
    return p;
}

std::array<double, 2> runMomentum(double lr, double beta, int steps, std::array<double, 2> p) {
    std::array<double, 2> v = {0.0, 0.0};
    for (int k = 0; k < steps; ++k) {
        auto g = grad(p);
        v[0] = beta * v[0] + g[0];
        v[1] = beta * v[1] + g[1];
        p[0] -= lr * v[0];
        p[1] -= lr * v[1];
    }
    return p;
}

std::array<double, 2> runAdam(double lr, int steps, std::array<double, 2> p) {
    const double b1 = 0.9, b2 = 0.999, eps = 1e-8;
    std::array<double, 2> m = {0.0, 0.0}, v = {0.0, 0.0};
    for (int k = 1; k <= steps; ++k) {
        auto g = grad(p);
        for (int i = 0; i < 2; ++i) {
            m[i] = b1 * m[i] + (1 - b1) * g[i];
            v[i] = b2 * v[i] + (1 - b2) * g[i] * g[i];
            double mHat = m[i] / (1 - std::pow(b1, k));
            double vHat = v[i] / (1 - std::pow(b2, k));
            p[i] -= lr * mHat / (std::sqrt(vHat) + eps);
        }
    }
    return p;
}

int main() {
    std::array<double, 2> start = {-3.6, 1.9};
    auto gd = runGD(0.12, 60, start);
    auto mom = runMomentum(0.12, 0.9, 60, start);
    auto adam = runAdam(0.25, 60, start);
    std::cout << "GD:       (" << gd[0] << ", " << gd[1] << ")\\n";
    std::cout << "Momentum: (" << mom[0] << ", " << mom[1] << ")\\n";
    std::cout << "Adam:     (" << adam[0] << ", " << adam[1] << ")\\n";
    return 0;
}`,
          },
          {
            label: "Python (library)",
            lang: "python",
            code: `import torch

# Same idea, but any real framework -- the update math above is hidden behind
# a one-line choice of optimizer, all interchangeable on the same tiny model.

def loss_fn(p):
    return 0.5 * (1.0 * p[0] ** 2 + 6.0 * p[1] ** 2)

def train(opt_name, steps=60, lr=0.12):
    p = torch.tensor([-3.6, 1.9], requires_grad=True)
    if opt_name == "sgd":
        opt = torch.optim.SGD([p], lr=lr)
    elif opt_name == "momentum":
        opt = torch.optim.SGD([p], lr=lr, momentum=0.9)
    elif opt_name == "adam":
        opt = torch.optim.Adam([p], lr=max(lr, 0.25))
    elif opt_name == "adamw":
        opt = torch.optim.AdamW([p], lr=max(lr, 0.25), weight_decay=0.01)
    for _ in range(steps):
        opt.zero_grad()
        loss = loss_fn(p)
        loss.backward()
        opt.step()
    return p.detach()

for name in ["sgd", "momentum", "adam", "adamw"]:
    print(name, "->", train(name))`,
          },
        ]}
      />
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Adam/AdamW</strong> is the default optimizer for training transformers and
            almost every modern large deep learning model — it's forgiving of imperfect learning
            rate tuning and handles wildly different gradient scales across a huge model's layers.
          </li>
          <li>
            <strong>SGD with momentum</strong> is still preferred in some well-tuned computer-vision
            training recipes (certain ResNet-style pipelines), where it has been observed to
            generalize very slightly better than Adam despite converging somewhat more slowly.
          </li>
          <li>
            <strong>RMSProp</strong> originated to fix an instability in training recurrent networks
            and remains a common choice in some reinforcement-learning training setups.
          </li>
          <li>
            <strong>AdaGrad</strong> is a genuinely good fit for sparse-gradient settings — e.g.
            large NLP embedding tables where most rows are updated only rarely — since its
            learning-rate-decays-to-zero flaw matters far less when most parameters barely get
            touched anyway.
          </li>
          <li>
            <strong>Learning-rate warmup</strong> is routinely paired with Adam in large-model
            training specifically because Adam's bias-corrected second-moment estimate is unreliable
            during the first handful of steps, before it has accumulated enough gradient history to
            be trustworthy.
          </li>
          <li>
            Production ML frameworks (PyTorch, TensorFlow, JAX) all expose every optimizer in this
            lesson as a one-line drop-in swap, which is exactly why practitioners can afford to
            treat the optimizer as a hyperparameter to try a few of, rather than committing to one
            up front.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Assuming Adam is tuning-free just because it's more forgiving than plain SGD — the
            learning rate still matters, and a badly chosen one still causes slow convergence or
            instability with Adam, just usually less dramatically than with plain gradient descent.
          </li>
          <li>
            Porting code between frameworks/versions and getting a naive L2 penalty added inside
            Adam's gradient instead of true decoupled AdamW weight decay — a genuinely common,
            subtle bug, since the two look similar in code but behave differently per-parameter.
          </li>
          <li>
            Using a high momentum coefficient together with too large a learning rate and seeing
            oscillation or divergence, then wrongly concluding "momentum doesn't work" instead of
            recognizing an unstable combination of hyperparameters.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Nesterov's look-ahead correction has a clean interpretation as a more accurate
          approximation of the continuous-time trajectory a truly frictionless, accelerating ball
          would follow — evaluating the gradient at the point momentum is about to reach, rather
          than where the point currently sits, corrects for a lag that plain momentum otherwise
          introduces. This isn't just folklore: for convex, smooth (Lipschitz-gradient) functions,
          Nesterov's method provably achieves an <code>O(1/k²)</code> convergence rate, compared to
          plain gradient descent's <code>O(1/k)</code> — a real, provable speedup, not merely an
          empirical tendency.
        </p>
      </ExpertNote>
      <Quiz
        q="On the elongated-bowl toy problem, why does momentum eventually take a LARGER effective step along the shallow axis than plain gradient descent ever safely could, using the exact same per-step learning rate α?"
        a="Because momentum's update isn't the raw current gradient — it's a running average of many past gradients. Along the shallow axis, the gradient keeps the same sign every step (the point is still consistently far from the minimum there), so those same-signed terms accumulate in the average, producing an effective step larger than any single gradient. Along the steep axis, by contrast, the gradient keeps flipping sign as the point oscillates, so those terms cancel in the average instead of accumulating — momentum gets to be aggressive exactly where it's safe and cautious exactly where it needs to be, without α itself ever changing."
      />
      <Takeaway>
        <p>
          Momentum, Nesterov, AdaGrad, RMSProp, and Adam are not five unrelated tricks — they're
          five different, precise answers to "what should I remember about past gradients before
          taking the next step," layered on top of the exact same generic update rule from this
          module's overview. With gradient-based methods (this lesson) and second-order methods (the
          next lesson) both in hand, the toolbox for smooth, unconstrained optimization is
          essentially complete.
        </p>
      </Takeaway>
    </>
  );
}
