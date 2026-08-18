import {
  SectionBlock,
  ExpertNote,
  Quiz,
  Takeaway,
  DiagramBlock,
  Pitfall,
  CodeExample,
  Derivation,
} from "@/components/docs/lesson-blocks";
import { Formula } from "@/components/docs/formula";
import { DiagramHost } from "./diagram-host";
import {
  renderLda,
  renderRandomProjection,
  renderProcrustes,
  renderConjugateGradient,
} from "./diagrams-28-34";

export function GeneralizedEigenvalues() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> section 1.7's eigenvalue problem, <code>Av = λv</code>, asks
          "which directions does A only stretch, never rotate?" The{" "}
          <strong>generalized eigenvalue problem</strong>, <code>Av = λBv</code>, asks a related but
          different question: "which directions does A stretch by exactly λ times as much as B
          stretches them?" — comparing two matrices' behavior against each other, instead of
          describing just one matrix alone.
        </p>
        <p>
          <strong>Intermediate:</strong> this shows up constantly whenever a method wants to
          maximize one notion of "spread" relative to another.{" "}
          <strong>Linear Discriminant Analysis (LDA)</strong> wants to find the projection direction
          that maximizes <em>between-class</em> separation relative to <em>within-class</em> spread
          — exactly a generalized eigenvalue problem, with A the between-class scatter matrix and B
          the within-class scatter matrix.
        </p>
        <p>
          <strong>Advanced:</strong> <strong>Canonical Correlation Analysis (CCA)</strong>, which
          finds the most correlated linear combinations of two different sets of variables (used to
          relate two different views or modalities of the same data), is also a generalized
          eigenvalue problem underneath. Both LDA and CCA can technically be reduced to an ordinary
          eigenvalue problem by multiplying through by <code>B⁻¹</code>, but doing that explicitly
          is numerically worse than using a solver built specifically for the generalized case.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"Av = \\lambda Bv"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          When B is the identity matrix, this is exactly the ordinary eigenvalue problem from
          section 1.7 — the generalized version is a strict superset, not a different topic.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Derivation: reducing Av = λBv to an ordinary eigenvalue problem"
      >
        <p>
          When B is symmetric positive definite (the usual ML case), Cholesky-factor it (section
          1.15) as <code>B = LLᵀ</code>. Substitute into the generalized problem and insert{" "}
          <code>L⁻ᵀLᵀ = I</code> in a useful spot:
        </p>
        <Formula>
          {"Av = \\lambda LL^Tv \\quad\\Longrightarrow\\quad L^{-1}Av = \\lambda L^Tv"}
        </Formula>
        <p>
          Now define the change of variables <code>y = Lᵀv</code>, so <code>v = L⁻ᵀy</code>, and
          substitute on the left:
        </p>
        <Formula>{"L^{-1}A L^{-T} y = \\lambda y"}</Formula>
        <p>
          This is now an <em>ordinary</em> eigenvalue problem (section 1.7) for the matrix{" "}
          <code>C = L⁻¹AL⁻ᵀ</code>, with the exact same eigenvalues <code>λ</code> as the original
          generalized problem — and if A is symmetric, C is symmetric too, so a standard symmetric
          eigensolver applies directly. The original eigenvectors are recovered via{" "}
          <code>v = L⁻ᵀy</code>. This is precisely the reduction production solvers use internally,
          which is why calling a dedicated generalized eigensolver is both correct and no more
          expensive than doing this transformation by hand.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this exact Cholesky-based reduction is what LDA and CCA solvers do
          internally, and it's also the standard way vibration analysis software solves{" "}
          <code>Kv = λMv</code> for a structure's natural frequencies and mode shapes.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="LDA: find the projection that best separates two classes"
        caption="Rotate the projection line — the Fisher score (between-class spread over within-class spread) is exactly what the generalized eigenvalue problem solves for directly."
      >
        <DiagramHost render={renderLda} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — solving a generalized eigenvalue problem for LDA"
        code={`import numpy as np
from scipy.linalg import eigh

classA = np.random.randn(50, 2) @ [[3, 1], [1, 1]] + [-3, 0]
classB = np.random.randn(50, 2) @ [[3, 1], [1, 1]] + [3, 0]

mean_diff = (classA.mean(axis=0) - classB.mean(axis=0)).reshape(-1, 1)
between_scatter = mean_diff @ mean_diff.T                       # "A" in Av = lambda Bv
within_scatter = np.cov(classA.T) + np.cov(classB.T)              # "B" in Av = lambda Bv

eigvals, eigvecs = eigh(between_scatter, within_scatter)          # generalized eigensolver
best_direction = eigvecs[:, -1]                                    # largest eigenvalue -> best separation
print(best_direction)`}
      >
        <p>
          <code>scipy.linalg.eigh(A, B)</code> solves the generalized problem directly — this is the
          real, standard way LDA is implemented, not by explicitly forming <code>B⁻¹A</code>.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>LDA</strong> is used both as a classifier and as a supervised dimensionality
            reduction technique — unlike PCA (section 1.7/1.10), it uses class labels to choose
            directions that separate categories, not just directions of maximum variance.
          </li>
          <li>
            <strong>CCA</strong> underlies multi-view learning — relating text and image embeddings
            of the same concept, or brain-imaging signals to stimulus features, by finding maximally
            correlated projections of each.
          </li>
          <li>
            Vibration/structural analysis (the mechanical engineering example from section 1.7) is
            actually a generalized eigenvalue problem in its full form, <code>Kv = λMv</code>,
            relating stiffness (K) and mass (M) matrices.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Explicitly computing <code>B⁻¹A</code> and then solving an ordinary eigenvalue problem —
            this works in theory but is markedly less numerically stable than a dedicated
            generalized eigensolver, especially when B is close to singular.
          </li>
          <li>
            Forgetting that a generalized eigenvalue problem needs B to be invertible (or at least
            positive definite, section 1.15, for the well-behaved real-eigenvalue case) — an
            ill-conditioned within-class scatter matrix is a common practical failure mode of LDA on
            small or collinear datasets.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          When B is symmetric positive definite (the common case in ML — scatter and covariance
          matrices are always PSD, section 1.15), the generalized eigenvalue problem has an elegant
          reduction: Cholesky-factor <code>B = LLᵀ</code>, then solve the <em>ordinary</em>{" "}
          eigenvalue problem for <code>L⁻¹A(L⁻¹)ᵀ</code> — which is exactly what production-grade
          generalized eigensolvers do internally, tying this lesson directly back to section 1.15.
        </p>
        <p>
          At the master level: LDA assumes each class's within-class scatter is well-estimated,
          which fails badly in high dimensions with few samples per class — regularized/shrinkage
          LDA adds a small multiple of the identity to the within-class scatter matrix before
          solving, the exact same "ridge" trick from section 1.9 applied here to keep B safely
          invertible.
        </p>
      </ExpertNote>
    </>
  );
}

export function RandomizedLinearAlgebra() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> exact SVD (section 1.10) of a huge matrix — millions of rows or
          columns — can simply be too slow to compute, even though you usually only care about the
          top few singular values and vectors anyway.{" "}
          <strong>Randomized numerical linear algebra</strong> trades a small, controllable amount
          of accuracy for an enormous speedup, by first compressing the problem using random
          projections.
        </p>
        <p>
          <strong>Intermediate:</strong> the core enabling fact is the{" "}
          <strong>Johnson-Lindenstrauss lemma</strong>: projecting high-dimensional points onto a
          random, much lower-dimensional subspace approximately preserves the distances between them
          — the number of dimensions you need to keep depends only on how many points you have and
          how much distortion you'll tolerate, not on the original dimensionality at all.
        </p>
        <p>
          <strong>Advanced:</strong> <strong>randomized SVD</strong> exploits this directly:
          multiply the original matrix by a small random matrix to project it into a much
          lower-dimensional sketch, compute an exact (cheap) SVD of that small sketch, then project
          the result back — producing an excellent approximation to the top singular values/vectors
          of the original huge matrix, at a tiny fraction of the cost of an exact full SVD.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "Y = A\\Omega, \\quad \\Omega \\in \\mathbb{R}^{n \\times k} \\text{ random}, \\quad k \\ll n"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          A is projected through a random matrix Ω into a much smaller matrix Y — an orthonormal
          basis (via QR, section 1.14) for Y's columns then captures most of A's dominant structure,
          at a fraction of the cost of factoring A directly.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Derivation: why a random sketch captures A's range (the exact-rank case)"
      >
        <p>
          Suppose A truly has rank <code>k</code> (only k independent directions in its column
          space) and you sketch it with a random <code>Ω</code> of exactly <code>k</code> columns:{" "}
          <code>Y = AΩ</code>. Write A's compact SVD as <code>A = UΣVᵀ</code> with{" "}
          <code>U, Σ, V</code> all of rank <code>k</code>. Then:
        </p>
        <Formula>{"Y = A\\Omega = U\\Sigma V^T\\Omega = U(\\Sigma V^T\\Omega)"}</Formula>
        <p>
          The parenthesized term <code>ΣVᵀΩ</code> is a <code>k×k</code> matrix. Since{" "}
          <code>Ω</code> is random (its columns aren't specially aligned to anything), this{" "}
          <code>k×k</code> matrix is invertible with probability 1 — random matrices are singular
          only on a measure-zero set of unlucky draws. So <code>Y</code> equals <code>U</code> times
          an invertible <code>k×k</code> matrix, which means <code>Y</code>'s columns span exactly
          the same <code>k</code>-dimensional space as <code>U</code>'s — i.e., exactly A's column
          space, recovered from a matrix <code>k</code> columns wide instead of A's original width.
          When A is only
          <em> approximately</em> low-rank (the realistic case — singular values decay but never hit
          exactly zero), this argument degrades gracefully rather than breaking outright: the sketch
          captures the dominant directions well and the small residual is proportional to the
          singular values being discarded, which is why fast-decaying spectra sketch so well in
          practice.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this is the exact justification behind{" "}
          <code>sklearn.decomposition.TruncatedSVD</code> and randomized PCA — the random sketch
          isn't a heuristic approximation of a vague notion, it's provably recovering A's dominant
          subspace with a concrete, computable failure probability.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Random projections roughly preserve pairwise distance"
        caption="This 2D-to-1D toy version is the same idea randomized SVD relies on at massive scale — regenerate to see it hold up across different random directions."
      >
        <DiagramHost render={renderRandomProjection} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — randomized SVD vs. exact SVD"
        code={`import numpy as np
import time

A = np.random.rand(3000, 500)

t0 = time.time()
U, S, Vt = np.linalg.svd(A, full_matrices=False)
exact_time = time.time() - t0

def randomized_svd(A, k, oversample=10):
    n = A.shape[1]
    omega = np.random.randn(n, k + oversample)
    Y = A @ omega
    Q, _ = np.linalg.qr(Y)              # section 1.14
    B = Q.T @ A
    Ub, Sb, Vtb = np.linalg.svd(B, full_matrices=False)
    return Q @ Ub[:, :k], Sb[:k], Vtb[:k, :]

t0 = time.time()
Uk, Sk, Vtk = randomized_svd(A, k=10)
rand_time = time.time() - t0

print(f"exact: {exact_time:.3f}s, randomized (top 10): {rand_time:.3f}s")
print("top singular values close?", np.allclose(S[:10], Sk, atol=1e-1))`}
      >
        <p>
          On a matrix this size the speedup is already noticeable; on real production-scale data
          (millions of rows) it's the difference between feasible and not.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>
              scikit-learn's <code>TruncatedSVD</code>
            </strong>{" "}
            and{" "}
            <strong>
              <code>PCA(svd_solver='randomized')</code>
            </strong>{" "}
            use exactly this technique by default once a dataset gets large.
          </li>
          <li>
            <strong>Large-scale recommender systems</strong> factor enormous, sparse user-item
            matrices (section 1.22) using randomized or streaming SVD variants — an exact SVD would
            be computationally infeasible at that scale.
          </li>
          <li>
            <strong>Random projection</strong> is also used directly as a fast, simple
            dimensionality reduction technique in its own right, without any SVD step at all, when
            approximate distance preservation is all that's needed.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Using too few random projection dimensions relative to how many top singular values you
            actually need — the "oversampling" parameter in the code above exists specifically to
            improve accuracy, and skipping it is a common source of poor approximations.
          </li>
          <li>
            Assuming randomized SVD approximates the <em>smallest</em> singular values well — it's
            specifically designed to accurately capture the <em>largest</em> ones; the tail is
            intentionally sacrificed for speed.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The accuracy of randomized SVD depends on how quickly a matrix's singular values decay — a
          matrix whose singular values drop off fast (most real-world data matrices) is approximated
          extremely well; a matrix with a long flat tail of similarly-sized singular values is a
          much harder case for randomized methods.
        </p>
        <p>
          At the master level: this entire family of techniques belongs to the broader field of{" "}
          <strong>matrix sketching</strong>, which also includes methods like CUR decomposition
          (selecting actual rows and columns of the original matrix rather than random linear
          combinations) — an active, ongoing area of numerical linear algebra research directly
          driven by the scale of modern ML data.
        </p>
      </ExpertNote>
    </>
  );
}

export function NonNegativeMatrixFactorization() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> SVD (section 1.10) factors a matrix into pieces that can
          contain negative numbers, which often makes the individual factors hard to interpret — a
          "negative amount of a topic" doesn't mean anything intuitive.{" "}
          <strong>Non-negative Matrix Factorization (NMF)</strong> factors a non-negative matrix
          into two smaller non-negative matrices instead, so every piece stays interpretable as "an
          amount of something."
        </p>
        <p>
          <strong>Intermediate:</strong> because everything stays non-negative, NMF factors tend to
          be naturally <em>sparse</em> and additive rather than involving cancellation between
          positive and negative terms — this is why NMF on a document-term matrix tends to produce
          factors that read like genuine, human-interpretable "topics," each defined by a handful of
          strongly-weighted words, rather than an abstract rotated coordinate system.
        </p>
        <p>
          <strong>Advanced:</strong> unlike SVD, NMF has no closed-form solution — it's solved
          iteratively (typically via multiplicative update rules or alternating least squares), the
          factorization isn't unique, and the optimization problem is non-convex (section 1.16), so
          different runs (or different random initializations) can converge to different, equally
          valid answers.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"A \\approx WH, \\quad A, W, H \\ge 0"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          For an m×n matrix A and a chosen rank k, W is m×k and H is k×n — same shape pattern as a
          truncated SVD, but with the added non-negativity constraint that changes everything about
          how it must be solved.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Derivation: why the multiplicative update rule preserves non-negativity"
      >
        <p>
          Minimizing <code>‖A − WH‖²_F</code> by ordinary gradient descent (section 1.17) on W would
          use <code>W ← W − η·∇_W</code>, where the gradient is <code>∇_W = 2(WH − A)Hᵀ</code>.
          Nothing in that update prevents entries of W from going negative — a generic step size can
          easily overshoot past zero.
        </p>
        <p>
          Lee and Seung's trick is to choose the step size <code>η</code> itself, separately for
          every entry, so it exactly cancels the negative part of the gradient. Split the gradient
          into its two non-negative pieces, <code>∇_W = 2(WHHᵀ) − 2(AHᵀ)</code>, and set the
          per-entry step size to{" "}
          <code>
            η_{"{ij}"} = W_{"{ij}"} / (2(WHH^T)_{"{ij}"})
          </code>{" "}
          — half the reciprocal of the positive piece of the gradient, so that piece exactly
          cancels:
        </p>
        <Formula>
          {
            "W_{ij} \\leftarrow W_{ij} - \\frac{W_{ij}}{2(WHH^T)_{ij}}\\Big(2(WHH^T)_{ij} - 2(AH^T)_{ij}\\Big) = W_{ij}\\frac{(AH^T)_{ij}}{(WHH^T)_{ij}}"
          }
        </Formula>
        <p>
          Every quantity on the right — <code>W</code>, <code>A</code>, <code>H</code> — is
          non-negative by assumption, and a ratio of non-negative numbers is non-negative. So{" "}
          <code>W</code> can shrink toward zero but can never cross it, and the same construction
          applied to <code>H</code> gives an equally safe multiplicative update. This is exactly why
          NMF solvers use this specific, seemingly ad-hoc update rule instead of plain gradient
          descent — it's the one choice of step size that makes non-negativity automatic rather than
          something that needs a separate projection or constraint step.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this is literally the default solver inside{" "}
          <code>sklearn.decomposition.NMF</code> (<code>solver='mu'</code>), and the same "adaptive
          step size cancels the negative part of the gradient" trick reappears in other
          constrained-optimization corners of ML wherever a variable must be kept non-negative
          throughout training.
        </p>
      </Derivation>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          A tiny document-term matrix (rows = documents, columns = words, entries = word counts)
          with two clear underlying topics — "sports" and "cooking" — factors via NMF into a W
          matrix whose columns represent "how much of each topic is in this document" and an H
          matrix whose rows represent "how strongly each word belongs to that topic." Every entry
          stays non-negative and directly interpretable: document 1 might be <code>[0.9, 0.1]</code>{" "}
          (mostly sports), and the "sports" row of H might have its largest weights on words like{" "}
          <code>ball</code>, <code>score</code>, and <code>team</code>. SVD on the exact same data
          would produce mathematically valid but far less interpretable factors, mixing positive and
          negative weights across unrelated words.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — topic extraction with NMF"
        code={`import numpy as np
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import TfidfVectorizer

docs = [
    "the team scored a goal in the match",
    "the recipe needs flour sugar and eggs",
    "the striker scored twice in the football match",
    "bake the cake with sugar and flour",
]

X = TfidfVectorizer().fit_transform(docs)
model = NMF(n_components=2, init='nndsvd', random_state=0)
W = model.fit_transform(X)   # document-topic weights, all >= 0
H = model.components_          # topic-word weights, all >= 0

print(W.round(2))   # each row sums up "how much of each topic" per document`}
      >
        <p>
          <code>init='nndsvd'</code> uses a non-negative-adapted SVD to pick a good starting point —
          a direct, practical bridge between sections 1.10 and this one.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Topic modeling</strong> — NMF on a term-document matrix is a fast, simple
            alternative to Latent Dirichlet Allocation for extracting human-readable topics.
          </li>
          <li>
            <strong>Image feature extraction</strong> — NMF on a matrix of face images famously
            extracts interpretable "parts" (eyes, noses, mouths) rather than the global,
            harder-to-interpret "eigenfaces" that PCA/SVD produce on the same data.
          </li>
          <li>
            <strong>Audio source separation</strong> — spectrograms are naturally non-negative
            (they're magnitudes), making NMF a natural fit for separating overlapping sound sources.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Expecting NMF to reproduce the same factors every run — because the problem is
            non-convex and solved iteratively, different initializations genuinely converge to
            different (still valid) answers; always fix a random seed for reproducibility.
          </li>
          <li>
            Applying NMF to data containing negative values — it fundamentally requires a
            non-negative input matrix; this rules it out for raw embeddings or centered data without
            a preprocessing step.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          NMF's lack of a unique solution is actually a meaningful mathematical fact, not just a
          numerical inconvenience — the factorization is only unique up to certain additional
          constraints (like sparsity or specific normalization schemes), an active research question
          for exactly which extra assumptions guarantee a unique, "correct" answer.
        </p>
        <p>
          At the master level: NMF is a special case of the broader family of{" "}
          <strong>constrained matrix factorizations</strong>, which includes techniques enforcing
          sparsity, smoothness, or other structural priors on W and H — the same core "factor into
          two smaller matrices" idea from SVD and NMF, generalized further by swapping in whatever
          constraint best matches the structure you know your data actually has.
        </p>
      </ExpertNote>
    </>
  );
}

export function HessianVectorProducts() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>The one-sentence idea:</strong> you almost never actually need the full Hessian
          matrix (section 1.16) itself — you usually only need to know what it <em>does</em> to a
          specific vector, and there's a way to get that answer directly, without ever building the
          (potentially enormous) matrix in between.
        </p>
        <p>
          <strong>Beginner:</strong> for a neural network with a million parameters, the Hessian
          would be a million-by-million matrix — roughly a trillion numbers, far too large to store,
          let alone compute directly. But many algorithms only ever need the result of multiplying
          the Hessian by one particular vector, <code>Hv</code>, not the Hessian itself.
        </p>
        <p>
          <strong>Intermediate:</strong> the <strong>Pearlmutter trick</strong> (also called the
          "R-op") computes exactly this Hessian-vector product using two ordinary backward passes
          (or a forward and backward pass), reusing the same automatic differentiation machinery
          from section 1.17 — at a cost comparable to just a couple of regular gradient
          computations, regardless of how many parameters the model has.
        </p>
        <p>
          <strong>Advanced:</strong> the key algebraic observation is that <code>Hv</code> equals
          the gradient of the scalar quantity <code>(∇f · v)</code> — since that's a dot product of
          the gradient with a fixed vector, differentiating it again is just one more ordinary
          backpropagation pass, not a fundamentally different (and far more expensive) second-order
          operation.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"Hv = \\nabla_x \\big( \\nabla f(x) \\cdot v \\big)"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The inner gradient is one ordinary backward pass; taking the gradient of the resulting
          scalar (the dot product) with respect to x is a second ordinary backward pass — two passes
          total, no matrix ever explicitly formed.
        </p>
      </SectionBlock>
      <Derivation id="derivation" title="Derivation: why Hv = ∇(∇f · v)">
        <p>
          Write the gradient as a vector-valued function <code>g(x) = ∇f(x)</code>, with components{" "}
          <code>g_i(x) = ∂f/∂x_i</code>. The Hessian is by definition the Jacobian of g:{" "}
          <code>H_{"{ij}"} = ∂g_i/∂x_j</code>. Now consider the scalar function{" "}
          <code>φ(x) = g(x)·v = Σᵢ g_i(x)vᵢ</code> for a fixed constant vector v, and differentiate
          it with respect to <code>xⱼ</code>, using that v doesn't depend on x:
        </p>
        <Formula>
          {
            "\\frac{\\partial \\phi}{\\partial x_j} = \\sum_i \\frac{\\partial g_i}{\\partial x_j}v_i = \\sum_i H_{ji}v_i = (Hv)_j"
          }
        </Formula>
        <p>
          (using that H is symmetric for a twice-differentiable f, so{" "}
          <code>
            H_{"{ji}"} = H_{"{ij}"}
          </code>
          ). So the j-th component of <code>∇φ</code> is exactly the j-th component of{" "}
          <code>Hv</code> — meaning <code>∇φ = Hv</code> for every component simultaneously, which
          is the identity used above. Nothing here required ever writing down H itself; the
          derivation only ever manipulated the scalar function <code>φ = ∇f · v</code>, which is
          exactly why two ordinary backward passes suffice.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: any second-order optimizer, curvature diagnostic, or
          influence-function computation that needs "Hessian times a vector" rather than the full
          Hessian relies on exactly this identity — it's the mathematical fact, not just an
          implementation trick, that makes second-order information tractable for million-parameter
          models.
        </p>
      </Derivation>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          For <code>f(x, y) = x²y + y³</code>, the true Hessian is{" "}
          <code>H = [[2y, 2x], [2x, 6y]]</code>. Pick <code>v = [1, 0]</code> and evaluate at{" "}
          <code>(x,y) = (2,1)</code>: directly, <code>Hv = [2(1), 2(2)] = [2, 4]</code>. Via the
          trick: the gradient is <code>∇f = [2xy, x²+3y²] = [4, 7]</code> at that point; the dot
          product with v is <code>4·1 + 7·0 = 4</code>, a function of (x, y); differentiating{" "}
          <em>that</em> scalar expression, <code>2xy</code>, with respect to x and y gives{" "}
          <code>[2y, 2x] = [2, 4]</code> — the same answer, reached without ever writing down the
          full 2×2 Hessian matrix.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — Hessian-vector products with PyTorch autograd"
        code={`import torch

x = torch.tensor([2.0, 1.0], requires_grad=True)

def f(x):
    return x[0]**2 * x[1] + x[1]**3

v = torch.tensor([1.0, 0.0])

grad = torch.autograd.grad(f(x), x, create_graph=True)[0]   # first backward pass
hvp = torch.autograd.grad(grad @ v, x)[0]                     # second backward pass -> H @ v
print(hvp)   # tensor([2., 4.]) -- matches the hand-derivation above`}
      >
        <p>
          <code>create_graph=True</code> on the first call is the crucial detail — it keeps the
          computation graph alive so the second <code>grad</code> call can differentiate through the
          first gradient itself.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>K-FAC and other second-order optimizers</strong> use Hessian-vector products (or
            close approximations) to take smarter, curvature-aware update steps than plain gradient
            descent, without the prohibitive cost of forming a full Hessian.
          </li>
          <li>
            <strong>Influence functions</strong> (estimating how much a single training example
            affected a trained model's predictions) rely on efficiently solving linear systems
            involving the Hessian, which is only tractable via Hessian-vector products plus an
            iterative solver like conjugate gradient (section 1.34).
          </li>
          <li>
            <strong>Sharpness-aware training methods</strong> use the largest eigenvalue of the
            Hessian (estimated via power iteration, section 1.24, using nothing but repeated
            Hessian-vector products) as a proxy for how "flat" or "sharp" a solution is.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Forgetting <code>create_graph=True</code> on the first gradient call — without it, the
            graph needed for the second differentiation pass is discarded and the Hessian-vector
            product silently cannot be computed.
          </li>
          <li>
            Attempting to form the full Hessian explicitly "just to be safe" on a large model — this
            defeats the entire point and can exhaust memory instantly; always reach for
            Hessian-vector products when only directional curvature information is actually needed.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The same trick generalizes to Jacobian-vector products for any vector-valued function, not
          just gradients of scalar losses — this is exactly what "forward-mode automatic
          differentiation" (mentioned in section 1.17's expert note) computes directly and
          efficiently.
        </p>
        <p>
          At the master level: combining Hessian-vector products with the power iteration algorithm
          of section 1.24 (using Hv repeatedly instead of a fixed matrix multiply) is precisely how
          practitioners estimate a neural network loss landscape's sharpest curvature directions
          without ever materializing a Hessian that would otherwise be far too large to store.
        </p>
      </ExpertNote>
    </>
  );
}

export function OrthogonalProcrustes() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> imagine you have two versions of the same shape — one rotated
          relative to the other — and you want to find the exact rotation that lines them up as
          closely as possible. The <strong>orthogonal Procrustes problem</strong> is precisely this:
          find the best rotation (or reflection) matrix that aligns one set of points to another,
          minimizing the total squared distance between corresponding points.
        </p>
        <p>
          <strong>Intermediate:</strong> remarkably, this has an exact, closed-form answer, and it
          comes directly from the SVD (section 1.10): compute the cross-covariance matrix between
          the two point sets, take its SVD <code>UΣVᵀ</code>, and the optimal rotation is simply{" "}
          <code>R = UVᵀ</code> — no iterative optimization needed at all.
        </p>
        <p>
          <strong>Advanced:</strong> this is the standard tool for{" "}
          <strong>embedding alignment</strong> — for instance, aligning word-embedding spaces
          trained independently on two different languages, so that a word and its translation end
          up at (approximately) the same point after applying the optimal rotation.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "R^* = \\arg\\min_{R^TR=I} \\|A R - B\\|_F \\quad\\Longrightarrow\\quad R^* = UV^T \\text{ where } A^TB = U\\Sigma V^T"
          }
        </Formula>
      </SectionBlock>
      <Derivation id="derivation" title="Derivation: why R* = UVᵀ solves the Procrustes problem">
        <p>
          Minimizing <code>‖AR − B‖²_F</code> over rotations R is equivalent to maximizing a simpler
          quantity. Expand the squared Frobenius norm using <code>‖X‖²_F = trace(XᵀX)</code>{" "}
          (section 1.20):
        </p>
        <Formula>
          {
            "\\|AR-B\\|_F^2 = \\text{trace}(R^TA^TAR) - 2\\,\\text{trace}(R^TA^TB) + \\text{trace}(B^TB)"
          }
        </Formula>
        <p>
          The first term equals <code>trace(AᵀA)</code> by the cyclic property (section 1.23) since{" "}
          <code>RᵀR = I</code>, and the last term doesn't involve R at all — so minimizing the whole
          expression over R is exactly equivalent to <em>maximizing</em>{" "}
          <code>trace(RᵀAᵀB) = trace(RᵀM)</code> where <code>M = AᵀB = UΣVᵀ</code>. Substitute the
          SVD and use cyclic invariance again:
        </p>
        <Formula>
          {
            "\\text{trace}(R^TU\\Sigma V^T) = \\text{trace}(V^TR^TU\\Sigma) = \\text{trace}(Z\\Sigma), \\quad Z = V^TR^TU"
          }
        </Formula>
        <p>
          Z is a product of orthogonal matrices, so it's orthogonal too, meaning every entry of Z
          satisfies <code>|Z_{"{ii}"}| ≤ 1</code>. Since Σ has non-negative diagonal entries,{" "}
          <code>trace(ZΣ) = Σᵢ Z_{"{ii}"}σᵢ</code> is maximized exactly when every{" "}
          <code>Z_{"{ii}"} = 1</code>, i.e. when <code>Z = I</code>. Solve <code>VᵀRᵀU = I</code>{" "}
          for R: left-multiply by V to get <code>RᵀU = V</code> (using <code>VVᵀ = I</code>), then
          right-multiply by <code>Uᵀ</code> to get <code>Rᵀ = VUᵀ</code> (using <code>UUᵀ = I</code>
          ). Transposing both sides gives <code>R = UVᵀ</code> — the closed form, derived entirely
          from properties of trace and orthogonal matrices already covered in this chapter, with no
          iterative search required.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: every cross-lingual embedding alignment pipeline and
          shape-registration tool that calls this a "one-line SVD solution" is relying on exactly
          this proof — it's also why the reflection-vs-rotation subtlety noted below is unavoidable:
          the proof only ever concluded Z = I, not that <code>det(R) = +1</code>.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Aligning a rotated shape back onto its target"
        caption="Drag to rotate the orange shape by hand, or let the closed-form SVD solution snap it into perfect alignment instantly."
      >
        <DiagramHost render={renderProcrustes} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — solving Procrustes with SVD"
        code={`import numpy as np

target = np.random.randn(20, 2)
true_theta = 0.7
rot = np.array([[np.cos(true_theta), -np.sin(true_theta)],
                [np.sin(true_theta), np.cos(true_theta)]])
source = target @ rot.T   # a rotated copy of the same shape

# Solve for the rotation that undoes this, via SVD:
M = source.T @ target
U, S, Vt = np.linalg.svd(M)
R = U @ Vt   # the optimal alignment rotation

aligned = source @ R
print(np.allclose(aligned, target, atol=1e-6))   # True -- perfect recovery`}
      >
        <p>
          Three lines after the SVD call, and the alignment is exact — this is the entire algorithm
          used in real embedding-alignment pipelines.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Cross-lingual word embeddings</strong> — aligning independently trained
            embedding spaces from two languages using a small bilingual dictionary as anchor points,
            then applying Procrustes to the rest of the vocabulary.
          </li>
          <li>
            <strong>Shape analysis and computer vision</strong> — comparing 3D scanned objects or
            anatomical landmarks that were captured at arbitrary orientations.
          </li>
          <li>
            <strong>Comparing neural network representations</strong> across different training runs
            or random seeds — Procrustes alignment is a standard tool for checking whether two
            networks learned "the same" internal representation, just rotated.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Forgetting the two point sets must already be correctly <em>matched</em> (point i in set
            A corresponds to point i in set B) — Procrustes solves for the best rotation given a
            known correspondence, it does not discover the correspondence itself.
          </li>
          <li>
            Swapping the order to <code>R = VUᵀ</code> — the correct formula depends on which matrix
            the cross-covariance is built from; with <code>M = AᵀB = UΣVᵀ</code> as defined above
            the answer is <code>R = UVᵀ</code>, not <code>VUᵀ</code> (defining the cross-covariance
            the other way round, <code>BᵀA</code>, would swap U and V and flip which order is
            correct) — always double-check against a known test case.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          A subtlety: the raw SVD solution can produce a <em>reflection</em> rather than a pure
          rotation if the determinant of <code>UVᵀ</code> comes out negative — the standard fix
          flips the sign of the last column of V (or the corresponding singular value) to force a
          proper rotation when one is specifically required.
        </p>
        <p>
          At the master level: <strong>Procrustes analysis</strong> more generally also allows
          solving for an optimal scale factor and translation alongside the rotation (full
          "similarity transformation" Procrustes) — the rotation piece is unchanged, computed
          exactly as above, with scale and translation solved for separately in closed form once the
          optimal rotation is known.
        </p>
      </ExpertNote>
    </>
  );
}

export function ConjugateGradientMethod() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> section 1.17's gradient descent diagram showed a real weakness:
          on a stretched, poorly-conditioned bowl, it zig-zags back and forth instead of heading
          straight for the minimum, needing many small steps. The{" "}
          <strong>conjugate gradient (CG) method</strong> is a smarter iterative algorithm for
          exactly this kind of problem — solving <code>Ax = b</code> (equivalently, minimizing a
          quadratic form, section 1.16) — that avoids this zig-zagging almost entirely.
        </p>
        <p>
          <strong>Intermediate:</strong> the key idea is choosing each step direction to be{" "}
          <strong>conjugate</strong> (a specific kind of "A-orthogonal") to every previous
          direction, rather than just following the current negative gradient like plain gradient
          descent does. This guarantees CG never "undoes" progress it already made along an earlier
          direction.
        </p>
        <p>
          <strong>Advanced:</strong> for a quadratic problem in n dimensions, this guarantee is
          exact and remarkable: conjugate gradient reaches the true minimum in at most n steps, in
          exact arithmetic — regardless of how poorly conditioned the problem is. In practice, on
          large, sparse, symmetric positive-definite systems (section 1.15), CG is run for far fewer
          than n iterations and still gets an excellent approximate answer, which is exactly why
          it's the standard method for enormous linear systems where forming or inverting the full
          matrix is completely infeasible.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {"x_{k+1} = x_k + \\alpha_k d_k, \\quad d_k^TAd_j = 0 \\ \\text{for } j < k"}
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Each new search direction <code>d_k</code> is built to be A-conjugate to every direction
          used so far — the algorithm only ever needs one matrix-vector product with A per
          iteration, never a full matrix inversion or decomposition.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Derivation: the optimal step size along a conjugate direction"
      >
        <p>
          Solving <code>Ax = b</code> for symmetric positive-definite A is equivalent to minimizing
          the quadratic form <code>φ(x) = ½xᵀAx − bᵀx</code> (section 1.16), since its gradient{" "}
          <code>∇φ(x) = Ax − b</code> is exactly the residual, zero precisely at the solution. Given
          a current point <code>xₖ</code> and search direction <code>dₖ</code>, an exact line search
          picks the step size <code>αₖ</code> that minimizes <code>φ(xₖ + αdₖ)</code> along that one
          direction. Expand and differentiate with respect to α, then set to zero:
        </p>
        <Formula>
          {
            "\\frac{d}{d\\alpha}\\phi(x_k+\\alpha d_k) = d_k^T(A(x_k+\\alpha d_k) - b) = d_k^Tr_k + \\alpha d_k^TAd_k = 0"
          }
        </Formula>
        <p>
          where <code>rₖ = Axₖ − b</code> is the current residual. Solving for α:
        </p>
        <Formula>
          {"\\alpha_k = -\\frac{d_k^Tr_k}{d_k^TAd_k} = \\frac{r_k^Tr_k}{d_k^TAd_k}"}
        </Formula>
        <p>
          (the last simplification uses that <code>dₖ</code> is built to equal <code>−rₖ</code> plus
          a component along previous, A-conjugate directions, which vanishes against <code>rₖ</code>{" "}
          by the conjugacy property itself). This is exactly the <code>alpha</code> line in the code
          below — not a heuristic, but the exact 1D minimizer along the current search direction,
          which is precisely why each CG step never needs to backtrack or retry: it's already
          optimal for that direction by construction.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this exact-line-search argument is what distinguishes CG from generic
          gradient descent with a guessed learning rate — every step size in CG is derived, not
          tuned, which is a large part of why it needs no hyperparameter search to work well.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Conjugate gradient vs. plain gradient descent, on the same stretched bowl"
        caption="Red dashed = gradient descent, needing dozens of small zig-zagging steps. Green solid = conjugate gradient, reaching the exact minimum in at most 2 steps for this 2D problem."
      >
        <DiagramHost render={renderConjugateGradient} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — conjugate gradient from scratch"
        code={`import numpy as np

def conjugate_gradient(A, b, x0, tol=1e-8, max_iter=None):
    x = x0.copy()
    r = b - A @ x
    d = r.copy()
    max_iter = max_iter or len(b)
    for _ in range(max_iter):
        if np.linalg.norm(r) < tol:
            break
        Ad = A @ d
        alpha = (r @ r) / (d @ Ad)
        x = x + alpha * d
        r_new = r - alpha * Ad
        beta = (r_new @ r_new) / (r @ r)
        d = r_new + beta * d
        r = r_new
    return x

n = 200
Q = np.random.randn(n, n)
A = Q.T @ Q + n * np.eye(n)   # a large, well-behaved symmetric PD system (section 1.15)
b = np.random.randn(n)

x = conjugate_gradient(A, b, np.zeros(n))
print(np.allclose(A @ x, b, atol=1e-4))   # True, without ever forming A^-1`}
      >
        <p>
          This is a genuine, working large-scale linear solver in about a dozen lines — the same
          algorithm scales to systems with millions of variables when A is sparse (section 1.22).
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Natural gradient descent</strong> and other second-order optimization methods
            use CG to approximately solve the linear system involving the Fisher information matrix
            or Hessian (section 1.16), combined with Hessian-vector products (section 1.32) to avoid
            ever forming that matrix explicitly.
          </li>
          <li>
            <strong>Approximate Gaussian process inference</strong> uses CG to solve the large
            linear systems involving the kernel matrix (section 1.25) that exact Cholesky-based
            inference (section 1.15) would find too expensive at scale.
          </li>
          <li>
            <strong>Physics simulation and finite-element analysis</strong> rely on CG (and its
            preconditioned variants) as the standard workhorse for solving enormous sparse linear
            systems.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Applying plain conjugate gradient to a non-symmetric or non-positive-definite matrix —
            the method (in its basic form) specifically requires A to be symmetric positive
            definite; related variants (e.g. GMRES, BiCGSTAB) exist for more general matrices.
          </li>
          <li>
            Running CG on a poorly conditioned system without <strong>preconditioning</strong> —
            while CG handles ill-conditioning far better than plain gradient descent, extremely
            large condition numbers still slow convergence in practice, and a good preconditioner is
            standard practice for genuinely large problems.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The "at most n steps" guarantee is a statement about exact arithmetic — in real
          floating-point computation, rounding error can slowly degrade the conjugacy property over
          many iterations, which is one reason CG is usually run as an iterative approximate method
          (stopping early once the residual is small enough) rather than insisting on running
          exactly n full steps.
        </p>
        <p>
          At the master level: <strong>preconditioned conjugate gradient (PCG)</strong> transforms
          the system into an equivalent one with a much better condition number before running CG,
          typically using an approximate, cheap-to-invert version of A (like its diagonal, or an
          incomplete Cholesky factorization, section 1.15) — this is what makes CG practical on the
          genuinely huge, ill-conditioned systems that appear in real scientific computing and
          large-scale ML.
        </p>
      </ExpertNote>
      <Quiz
        q="Why can conjugate gradient solve an n-dimensional quadratic problem exactly in at most n steps, while gradient descent generally cannot?"
        a="Each CG step direction is constructed to be A-conjugate to every previous direction, so progress made along one direction is never undone by a later step — after n conjugate directions, every dimension has been fully accounted for exactly. Gradient descent instead always follows the current gradient, which can repeatedly re-cross the same directions on ill-conditioned problems."
      />
    </>
  );
}

export function TriangularJacobiansFlows() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> section 1.12 mentioned that transforming a probability
          distribution into new coordinates requires dividing by the absolute value of a Jacobian
          determinant, to keep total probability equal to 1. <strong>Normalizing flows</strong>, a
          family of generative models, are built entirely around this one fact — they model a
          complex distribution as a sequence of simple, invertible transformations applied to simple
          noise, tracking exactly how probability density changes at every step.
        </p>
        <p>
          <strong>Intermediate:</strong> the catch is that computing a determinant (section 1.12) is
          normally expensive — <code>O(n³)</code> in general. Normalizing flows sidestep this
          entirely by deliberately designing every transformation so its Jacobian matrix is exactly{" "}
          <strong>triangular</strong> — and the determinant of a triangular matrix (section 1.13) is
          just the product of its diagonal, computable in <code>O(n)</code> time instead.
        </p>
        <p>
          <strong>Advanced:</strong> this is a genuine architectural constraint, not an incidental
          detail — layers like RealNVP and MAF are specifically engineered so that each output
          dimension only ever depends on a strict subset of the input dimensions, which is precisely
          what forces the Jacobian into triangular form and makes the whole log-likelihood
          computation for training tractable at all.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\log p_X(x) = \\log p_Z(f(x)) + \\log|\\det J_f(x)|, \\quad \\det J_f(x) = \\prod_i \\frac{\\partial f_i}{\\partial x_i}"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The change-of-variables formula from probability, combined with the triangular-Jacobian
          trick — the product on the right is over just the diagonal entries, exactly as in section
          1.13's observation about triangular matrices.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Derivation: the change-of-variables formula for probability densities"
      >
        <p>
          Let <code>z = f(x)</code> be an invertible, differentiable transformation, with{" "}
          <code>z</code> distributed according to a known simple density <code>p_Z</code>. For any
          small region <code>dx</code> around a point x, the transformed region has volume{" "}
          <code>|det J_f(x)|·dx</code> (section 1.12's geometric meaning of the determinant — it's
          exactly the local volume-scaling factor of the map). Conservation of total probability
          requires the probability mass in the two corresponding regions to match exactly:
        </p>
        <Formula>{"p_X(x)\\,dx = p_Z(f(x))\\,\\big|\\det J_f(x)\\big|\\,dx"}</Formula>
        <p>
          Cancel the shared infinitesimal volume element <code>dx</code> from both sides and take
          logs:
        </p>
        <Formula>
          {
            "p_X(x) = p_Z(f(x))\\,|\\det J_f(x)| \\;\\Longrightarrow\\; \\log p_X(x) = \\log p_Z(f(x)) + \\log|\\det J_f(x)|"
          }
        </Formula>
        <p>
          This is exactly the formula stated above, and it makes clear why the determinant term
          isn't optional or a correction factor — it's the exact bookkeeping needed to keep{" "}
          <code>p_X</code> a valid density (integrating to 1) after a change of coordinates that
          locally stretches or shrinks volume by a different amount at every point.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Where this is used: this is the training objective itself for every normalizing flow model
          — maximizing <code>log p_X(x)</code> on real data requires evaluating exactly this formula
          for every training example, which is precisely why the triangular-Jacobian architectural
          trick (making the determinant cheap) is not an optimization but a hard requirement for the
          model to be trainable at all.
        </p>
      </Derivation>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          A simple "coupling layer" (the building block of RealNVP) splits the input into two
          halves, <code>x = (x₁, x₂)</code>, and outputs <code>y₁ = x₁</code> (unchanged) and{" "}
          <code>y₂ = x₂ · exp(s(x₁)) + t(x₁)</code>, where s and t are arbitrary neural networks.
          The Jacobian of this map is exactly lower-triangular by construction — <code>y₁</code>{" "}
          doesn't depend on <code>x₂</code> at all — with diagonal entries <code>1</code> (from y₁)
          and <code>exp(s(x₁))</code> (from y₂). The log-determinant is therefore simply{" "}
          <code>sum(s(x₁))</code> — a trivial sum, computed directly from the network's own output,
          with no matrix operations of any kind required.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — a minimal coupling-layer flow step"
        code={`import numpy as np

def coupling_forward(x, s_fn, t_fn):
    x1, x2 = x[:, 0], x[:, 1]
    s = s_fn(x1)              # any function/network of x1
    y1 = x1
    y2 = x2 * np.exp(s) + t_fn(x1)
    log_det = s               # log|det J| = sum of log-diagonal = s, here
    return np.stack([y1, y2], axis=1), log_det

x = np.random.randn(5, 2)
y, log_det = coupling_forward(x, s_fn=lambda x1: 0.1 * x1, t_fn=lambda x1: 0.5 * x1)
print(y)
print(log_det)   # the ENTIRE Jacobian determinant computation, no matrix needed`}
      >
        <p>
          Notice there's no <code>np.linalg.det</code> call anywhere — that's the whole point of
          designing the transformation this way.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>RealNVP and Glow</strong> use stacks of coupling layers exactly like the one
            above to build expressive, exactly-invertible generative models for images.
          </li>
          <li>
            <strong>Masked Autoregressive Flow (MAF)</strong> achieves the same triangular-Jacobian
            property by making each output dimension depend only on <em>previous</em> dimensions in
            a fixed order — a different architectural route to the identical mathematical guarantee.
          </li>
          <li>
            <strong>Variational inference</strong> uses normalizing flows to build flexible
            approximate posterior distributions that remain exactly tractable to evaluate and sample
            from.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Designing a flow layer without checking that its Jacobian is actually triangular (or
            otherwise cheap to compute) — this is the single design constraint that makes
            normalizing flows tractable at all; violating it reintroduces the full{" "}
            <code>O(n³)</code> determinant cost this whole architecture exists to avoid.
          </li>
          <li>
            Forgetting the absolute value in <code>log|det J|</code> — a negative Jacobian
            determinant is perfectly valid (it just means the transformation includes a reflection),
            but the log-likelihood formula specifically needs the magnitude.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Coupling layers alone would only ever transform half the input, since y₁ = x₁ exactly —
          real architectures alternate which half is held fixed across layers, so that after enough
          layers, every dimension has eventually been transformed by every other.
        </p>
        <p>
          At the master level: continuous normalizing flows (built on Neural ODEs) replace this
          discrete stack of triangular-Jacobian layers with a continuous-time transformation whose
          log-determinant is instead computed via the <strong>trace</strong> (section 1.23) of the
          instantaneous Jacobian, integrated over time — the "instantaneous change of variables"
          formula — connecting this entire lesson back to trace, matrix calculus (section 1.17), and
          differential equations in one further generalization.
        </p>
      </ExpertNote>
      <Takeaway>
        <p>
          An entire modern generative modeling paradigm exists because someone asked "how do we
          design a neural network layer whose Jacobian is cheap to determinant?" — and the answer,
          triangularity, was sitting in this chapter the whole time.
        </p>
      </Takeaway>
    </>
  );
}
