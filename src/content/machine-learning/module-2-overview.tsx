import { SectionBlock, ExpertNote, Takeaway, Pitfall } from "@/components/docs/lesson-blocks";
import { Formula } from "@/components/docs/formula";

export function OptimizationOverview() {
  return (
    <>
      <SectionBlock id="welcome" label="Why optimization gets its own module">
        <p>
          Module 1 ended on empirical risk minimization: pick the function <code>f</code> that
          minimizes average loss on the training data. That's a clean mathematical statement — but
          it says nothing about <em>how</em> to actually find that minimizer. For a simple enough
          model (ordinary least squares, section 2.1.6) there's a closed-form answer. For almost
          everything else — logistic regression, SVMs, gradient boosted trees, every neural network
          ever trained — there is no formula you can write down and evaluate. You have to{" "}
          <em>search</em> for the minimum, iteratively, and the entire practice of machine learning
          runs on a fairly small number of search strategies, each with a real mathematical reason
          for existing.
        </p>
        <p>
          This module is that toolbox, built from scratch: why gradient descent works at all, why
          it's slow in some situations and fast in others, what momentum and Adam are actually doing
          differently from plain gradient descent (not just "it's better," but the precise
          mechanism), how second-order methods use curvature to converge in far fewer steps, how
          L1-regularized problems are solved despite not being differentiable everywhere, how
          constrained problems (like the SVM's margin maximization, a later module) get turned into
          unconstrained ones via duality, and how EM turns an intractable maximum-likelihood problem
          into a sequence of tractable ones.
        </p>
      </SectionBlock>
      <SectionBlock
        id="module-scope"
        label="The one picture that ties this module together"
        tone="formula"
      >
        <p>
          Every method in this module is an answer to the same question, asked under different
          assumptions about the function being minimized:
        </p>
        <Formula>{"\\theta_{k+1} = \\theta_k + \\alpha_k \\, d_k"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Take a step from the current parameters <code>θₖ</code>, in some direction{" "}
          <code>d_k</code>, of some size <code>α_k</code>. Plain gradient descent picks{" "}
          <code>d_k = -∇f(θ_k)</code> and a fixed or decaying <code>α_k</code>. Every other method
          in this module changes one or both of those two choices — a smarter direction (momentum,
          Newton's method), a smarter step size (AdaGrad, Adam), or a fundamentally different notion
          of "step" entirely (proximal operators for non-differentiable terms, coordinate descent
          for high dimensions, EM for latent-variable likelihoods). Seeing every method as a
          variation on this one update rule is the single most useful mental model for this entire
          module.
        </p>
      </SectionBlock>
      <SectionBlock id="roadmap" label="What's in this module" tone="good">
        <ul>
          <li>
            <strong>2.2.1 Convex Optimization Basics</strong> — the property (convexity) that makes
            "found a minimum" mean "found <em>the</em> minimum," and why most of classical ML is
            deliberately built to have this property even when it costs some flexibility.
          </li>
          <li>
            <strong>2.2.2 Gradient Descent &amp; Variants</strong> — the workhorse algorithm itself:
            batch vs. stochastic vs. mini-batch, and exactly how fast each one provably converges.
          </li>
          <li>
            <strong>2.2.3 Accelerated &amp; Adaptive Optimizers</strong> — momentum, Nesterov,
            AdaGrad, RMSProp, and Adam: what each one changes about the plain update rule above, and
            the specific failure mode of vanilla GD each one was invented to fix.
          </li>
          <li>
            <strong>2.2.4 Second-Order &amp; Quasi-Newton Methods</strong> — using curvature (the
            Hessian) to take a far better step than the gradient alone can suggest, and the
            quasi-Newton trick (BFGS/L-BFGS) that gets most of the benefit without ever forming the
            full Hessian.
          </li>
          <li>
            <strong>2.2.5 Coordinate &amp; Proximal Methods</strong> — what to do when the objective
            has a non-differentiable piece (like an L1 penalty) that plain gradient descent can't
            handle at all.
          </li>
          <li>
            <strong>2.2.6 Constrained Optimization &amp; Duality</strong> — Lagrange multipliers and
            KKT conditions, which turn "minimize this subject to these constraints" into a related,
            often easier, unconstrained problem — directly setting up the SVM module later in this
            chapter.
          </li>
          <li>
            <strong>2.2.7 Expectation–Maximization as Optimization</strong> — a specialized
            optimizer for exactly one recurring situation (a likelihood that would be easy to
            maximize if you could see some hidden variable), used by Gaussian mixture models and
            several other later modules.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Treating "optimizer" as an interchangeable hyperparameter to grid-search over without
            understanding why one might suit a given loss landscape better than another — each
            method in this module exists because a specific, nameable failure mode of a simpler
            method needed fixing.
          </li>
          <li>
            Assuming the fanciest available optimizer (Adam, L-BFGS) is always the right choice —
            plain gradient descent or SGD is still the correct tool in plenty of large-scale,
            well-conditioned settings, and second-order methods are often too expensive per step to
            be worth it outside smaller, well-behaved problems.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Almost everything here is written for smooth or piecewise-smooth objectives. Modern deep
          learning optimization theory (loss landscape geometry of massively over-parameterized
          networks, implicit regularization of SGD, why Adam specifically dominates for
          transformers) is a genuinely different and still-active research area built on top of
          these classical foundations — this module is the prerequisite for that conversation, not a
          substitute for it.
        </p>
      </ExpertNote>
      <Takeaway>
        <p>
          Start with <em>2.2.1, Convex Optimization Basics</em> — every convergence guarantee in the
          rest of this module is stated in terms of convexity, so it's worth having that vocabulary
          solid before comparing what gradient descent, Newton's method, and everything in between
          can actually promise you.
        </p>
      </Takeaway>
    </>
  );
}
