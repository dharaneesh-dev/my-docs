import { SectionBlock, ExpertNote, Takeaway, Pitfall } from "@/components/docs/lesson-blocks";
import { Formula } from "@/components/docs/formula";

export function FoundationsOverview() {
  return (
    <>
      <SectionBlock id="welcome" label="Welcome to Machine Learning">
        <p>
          This chapter covers classical machine learning end to end — every model family a working
          ML engineer or researcher is expected to know, derived from first principles rather than
          presented as a black box. It's cross-checked against Stanford's CS229,{" "}
          <em>The Elements of Statistical Learning</em>, and scikit-learn's full algorithm catalog,
          organized into 18 modules from foundations through interpretability.
        </p>
        <p>
          It builds directly on the <em>Linear Algebra for ML</em> chapter — eigendecompositions,
          gradients, and matrix calculus from that chapter are used here without re-derivation, so
          it's worth having worked through that chapter first (or at least keeping it open for
          reference).
        </p>
      </SectionBlock>
      <SectionBlock
        id="how-to-read"
        label="How every topic in this chapter is structured"
        tone="muted"
      >
        <p>
          Every numbered topic below a module (like <em>2.1.1</em>, <em>2.1.2</em>, …) follows the
          same shape, going noticeably deeper than a typical course precisely because the goal here
          is to leave nothing as an unexplained black box:
        </p>
        <ul>
          <li>
            <strong>In plain English</strong> — the idea explained at beginner, intermediate, and
            advanced depth, with no formulas required to follow along.
          </li>
          <li>
            <strong>Formula &amp; Derivation</strong> — the precise mathematical statement, proved
            or derived from scratch, with a "where this is used" note tying it to a real system.
          </li>
          <li>
            <strong>Diagram</strong> — a live, interactive diagram built to be readable at a glance
            for a beginner, but with enough real numbers and controls exposed that an expert can use
            it to actually check their intuition.
          </li>
          <li>
            <strong>Implemented three ways</strong> — the core algorithm coded by hand in{" "}
            <strong>Python</strong> (readable, minimal), then again from scratch in{" "}
            <strong>C++</strong> (so you see it without any language hiding the mechanics), and
            finally how it's actually called in production via <strong>scikit-learn</strong> (or the
            standard library for that topic) — so you see the same idea at three levels of
            abstraction back to back.
          </li>
          <li>
            <strong>Real-world examples, pitfalls, and going deeper</strong> — where the idea shows
            up in production ML systems, what trips people up in practice, and an optional deeper
            dive.
          </li>
        </ul>
      </SectionBlock>
      <SectionBlock id="module-scope" label="This module: Foundations of Learning" tone="formula">
        <p>
          Before any specific model — linear regression, decision trees, neural networks — there's a
          small set of ideas that every one of them is a special case of. This module builds exactly
          those ideas, so that every later module can say "this is just ERM with a particular
          hypothesis class and loss" instead of re-deriving why models are trained the way they're
          trained each time.
        </p>
        <Formula>
          {
            "\\hat{f} = \\arg\\min_{f \\in \\mathcal{H}} \\; \\frac{1}{n}\\sum_{i=1}^n L(f(x_i), y_i)"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Empirical risk minimization — choose the function <code>f</code>, out of some allowed
          hypothesis class <code>ℋ</code>, that minimizes the average loss on the training data.
          Every model in this chapter fills in <code>ℋ</code> and <code>L</code> differently; the
          minimization principle itself never changes.
        </p>
      </SectionBlock>
      <SectionBlock id="roadmap" label="What's in this module" tone="good">
        <ul>
          <li>
            <strong>2.1.1 Learning Paradigms</strong> — supervised, unsupervised, semi-supervised,
            self-supervised, and reinforcement learning: what data each one assumes, and what
            "learning" even means when there are no labels.
          </li>
          <li>
            <strong>2.1.2 Statistical Decision Theory</strong> — where loss functions actually come
            from, and the Bayes-optimal predictor that every model is trying to approximate.
          </li>
          <li>
            <strong>2.1.3 Bias–Variance Trade-off</strong> — decomposing a model's expected error
            into three independent, additive pieces, and why you can't drive all three to zero at
            once.
          </li>
          <li>
            <strong>2.1.4 Overfitting, Underfitting &amp; Capacity</strong> — the practical,
            measurable symptoms of the bias-variance trade-off, including the modern "double
            descent" wrinkle in the classical story.
          </li>
          <li>
            <strong>2.1.5 Learning Theory</strong> — the theoretical guarantees (PAC learning, VC
            dimension) behind "if it works on training data, will it work on new data?", and why no
            algorithm can be best at everything (No-Free-Lunch).
          </li>
          <li>
            <strong>2.1.6 Maximum Likelihood &amp; MAP</strong> — the single inference principle
            that, it turns out, almost every loss function in this entire chapter is secretly a
            special case of.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Treating this module as throat-clearing to skip past to "the real models" — nearly every
            design decision in later modules (why squared loss for regression, why cross-entropy for
            classification, why regularization helps, why a bigger model isn't always better) is a
            direct consequence of an idea introduced here.
          </li>
          <li>
            Reading the math once and moving on — these six ideas are the ones you'll want to
            revisit after a few later modules, once you've seen them in action inside a specific
            model. It's normal for it to click more the second time.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          If you already know these six topics cold, this module is still worth skimming for
          notation — later modules refer back to it constantly (e.g. "this is ERM with hinge loss,"
          "this is the MAP estimate under a Laplace prior") rather than re-explaining the underlying
          principle each time.
        </p>
      </ExpertNote>
      <Takeaway>
        <p>
          Start with <em>2.1.1, Learning Paradigms</em>, and move through the module in order — each
          topic sets up vocabulary the next one uses directly, ending with MLE/MAP, which is the
          thread that ties almost every model in every later module together.
        </p>
      </Takeaway>
    </>
  );
}
