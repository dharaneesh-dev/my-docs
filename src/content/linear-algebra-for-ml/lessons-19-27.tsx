import {
  SectionBlock,
  ExpertNote,
  Quiz,
  Takeaway,
  DiagramBlock,
  Pitfall,
  CodeExample,
} from "@/components/docs/lesson-blocks";
import { Formula } from "@/components/docs/formula";
import { DiagramHost } from "./diagram-host";
import {
  renderSparseGrid,
  renderTraceHighlight,
  renderPowerIteration,
  renderKernelLift,
  renderWhitening,
  renderPageRankGraph,
} from "./diagrams-19-27";

export function MatrixNorms() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> section 1.7 measured the "size" of a <em>vector</em>. Matrices
          need their own notion of size too — for example, "how big is the error between this matrix
          and its low-rank approximation?" A <strong>matrix norm</strong> answers exactly that.
        </p>
        <p>
          <strong>Intermediate:</strong> the simplest one, the <strong>Frobenius norm</strong>, just
          treats the matrix as one long vector of all its entries and takes the ordinary L2 length
          of that — squares every entry, sums, square-roots. The <strong>spectral norm</strong> is
          different in kind: it's the matrix's largest singular value (section 1.9) — the single
          biggest amount it can stretch <em>any</em> input vector by.
        </p>
        <p>
          <strong>Advanced:</strong> the <strong>nuclear norm</strong> (sum of all singular values)
          is the matrix analogue of the L1 norm from section 1.7 — and just as L1 regularization on
          a vector pushes individual entries to exactly zero (automatic feature selection),
          nuclear-norm regularization on a matrix pushes singular values to exactly zero, which
          means it pushes the <em>rank</em> down. This is the mathematical basis of low-rank matrix
          completion.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\|A\\|_F = \\sqrt{\\sum_{i,j} a_{ij}^2} \\qquad \\|A\\|_2 = \\sigma_{\\max}(A) \\qquad \\|A\\|_* = \\sum_i \\sigma_i"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Frobenius (F), spectral (2, "operator norm"), and nuclear (*) — all three are defined in
          terms of the matrix's singular values, and all three collapse to the ordinary vector L2
          norm when applied to a matrix with only one column.
        </p>
      </SectionBlock>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          For <code>A = [[3, 0], [4, 5]]</code>, the Frobenius norm is the easiest to check by hand:{" "}
          <code>√(3² + 0² + 4² + 5²) = √50 ≈ 7.07</code> — just treat every entry as one long
          vector. The spectral and nuclear norms both require the singular values (section 1.9)
          first. Since <code>AᵀA = [[25, 20], [20, 25]]</code> has eigenvalues 45 and 5, A's
          singular values are <code>√45 ≈ 6.71</code> and <code>√5 ≈ 2.24</code> — so the spectral
          norm is <code>‖A‖₂ ≈ 6.71</code> (the larger one) and the nuclear norm is{" "}
          <code>‖A‖* ≈ 6.71 + 2.24 = 8.95</code> (their sum) — confirming the ordering{" "}
          <code>‖A‖₂ ≤ ‖A‖_F ≤ ‖A‖*</code> from the expert note below (6.71 ≤ 7.07 ≤ 8.95).
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — all three matrix norms in NumPy"
        code={`import numpy as np

A = np.array([[3., 0.], [4., 5.]])

frob = np.linalg.norm(A, 'fro')          # sqrt(9+0+16+25) = sqrt(50)
spectral = np.linalg.norm(A, 2)           # largest singular value
nuclear = np.linalg.norm(A, 'nuc')        # sum of all singular values

print(frob, spectral, nuclear)

# Spectral norm connects directly to the SVD from section 1.9:
_, S, _ = np.linalg.svd(A)
print(np.isclose(spectral, S.max()))   # True`}
      >
        <p>
          <code>np.linalg.norm</code> handles all three with just a different <code>ord</code>{" "}
          argument — worth knowing since the default (no <code>ord</code> at all) silently computes
          Frobenius for a matrix, not spectral.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Spectral normalization</strong> — a well-known GAN training technique divides
            each layer's weight matrix by its spectral norm, which caps how much the layer can
            stretch any input by exactly 1×, directly enforcing a Lipschitz constraint that
            stabilizes training.
          </li>
          <li>
            <strong>Matrix completion</strong> (the "fill in the missing Netflix ratings" problem)
            minimizes nuclear norm as a convex proxy for minimizing rank directly, which is
            otherwise a computationally intractable (NP-hard) objective.
          </li>
          <li>
            <strong>Weight decay</strong> is, technically, Frobenius-norm regularization of a weight
            matrix — the direct matrix generalization of the L2 vector regularization from section
            1.7.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Assuming "matrix norm" always means Frobenius — many papers and libraries default to
            spectral norm instead when discussing Lipschitz constraints; always check which is
            meant.
          </li>
          <li>
            Computing the spectral norm as the maximum absolute entry of the matrix — that's not a
            correct matrix norm at all (fails the sub-multiplicative requirement); it must come from
            the SVD.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The three norms sandwich each other in a precise way: <code>‖A‖₂ ≤ ‖A‖_F ≤ ‖A‖* </code> —
          the spectral norm is always the smallest of the three, the nuclear norm the largest, for
          any matrix.
        </p>
        <p>
          At the master level: the Frobenius norm equals <code>√trace(AᵀA)</code> (section 1.22) —
          connecting matrix norms, the trace, and the SVD into one identity, and explaining why
          "Frobenius norm of the reconstruction error" and "sum of squared residuals" are the exact
          same quantity used throughout PCA and matrix factorization literature.
        </p>
      </ExpertNote>
    </>
  );
}

export function NumericalStability() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> computers store numbers with limited precision (floating
          point). Some mathematically simple expressions — like <code>exp()</code> of a large
          number, or dividing by a very small number — silently overflow to infinity, underflow to
          zero, or lose almost all their precision, even though the "true" math is perfectly
          well-behaved.
        </p>
        <p>
          <strong>Intermediate:</strong> the single most common place this bites ML code is the{" "}
          <strong>softmax</strong> function, <code>exp(x_i) / Σ exp(x_j)</code>. If any{" "}
          <code>x_i</code> is even moderately large (say, 1000), <code>exp(1000)</code> overflows to
          infinity in float32 — even though the final softmax probability would have been a
          perfectly ordinary number between 0 and 1.
        </p>
        <p>
          <strong>Advanced:</strong> the fix, the <strong>log-sum-exp trick</strong>, subtracts the
          maximum value before exponentiating: <code>exp(x_i − max(x)) / Σ exp(x_j − max(x))</code>.
          This is mathematically <em>identical</em> to the original formula (the max cancels out),
          but now the largest exponent computed is always <code>exp(0) = 1</code>, so nothing ever
          overflows.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\text{softmax}(x_i) = \\frac{e^{x_i - m}}{\\sum_j e^{x_j - m}}, \\quad m = \\max_j x_j"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Subtracting the max is algebraically a no-op (it cancels between numerator and
          denominator) but is the difference between code that works and code that silently produces{" "}
          <code>NaN</code>.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — softmax done wrong, then done right"
        code={`import numpy as np

def softmax_naive(x):
    e = np.exp(x)
    return e / e.sum()

def softmax_stable(x):
    e = np.exp(x - x.max())
    return e / e.sum()

x = np.array([1000., 1001., 1002.])
print(softmax_naive(x))    # [nan, nan, nan] -- overflow!
print(softmax_stable(x))    # [0.09, 0.24, 0.67] -- correct

# Same trick for log-likelihoods: log-sum-exp
def logsumexp(x):
    m = x.max()
    return m + np.log(np.sum(np.exp(x - m)))
print(logsumexp(x))   # a normal, finite number`}
      >
        <p>
          Run <code>softmax_naive</code> yourself on large inputs — every deep learning framework's
          built-in softmax and cross-entropy functions use the stable version internally for exactly
          this reason.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Cross-entropy loss</strong> implementations always combine log and softmax into
            one numerically stable operation (<code>log_softmax</code>) rather than computing
            softmax then taking its log separately, which would reintroduce the same overflow risk.
          </li>
          <li>
            <strong>Attention scores</strong> in Transformers go through exactly this stabilized
            softmax — a single unstabilized attention layer could silently produce <code>NaN</code>{" "}
            losses on certain inputs.
          </li>
          <li>
            <strong>Log-determinants</strong> (section 1.11) and Gaussian log-likelihoods use the
            same underlying principle: work in log-space as long as possible, only exponentiate at
            the very end, if at all.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Computing probabilities as raw ratios of exponentials instead of using a library's
            stable softmax/log_softmax function — this is one of the most common sources of
            mysterious <code>NaN</code> losses in from-scratch model implementations.
          </li>
          <li>
            Dividing by a norm or standard deviation without checking it isn't (near) zero — add a
            small <code>eps</code> (e.g. <code>1e-8</code>) to the denominator as standard practice.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The same shift-before-exponentiate idea generalizes to any "log of a sum of exponentials"
          expression, which is common throughout probabilistic modeling (mixture models, hidden
          Markov models, variational inference) — it's universally called the{" "}
          <strong>log-sum-exp trick</strong> for exactly this reason.
        </p>
        <p>
          At the master level: float16/bfloat16 mixed-precision training (section 1.4's Tensor
          Cores) makes numerical stability substantially more fragile than float32 — this is
          precisely why modern training frameworks use <strong>loss scaling</strong> (multiplying
          the loss by a large constant before the backward pass, then dividing gradients by the same
          constant afterward) to keep small gradient values from underflowing to zero in reduced
          precision.
        </p>
      </ExpertNote>
      <Quiz
        q="Why does subtracting the max before exponentiating not change the softmax result?"
        a="Because e^(x-m) = e^x · e^(-m), and the e^(-m) factor appears identically in every term of both the numerator and denominator, so it cancels out completely."
      />
    </>
  );
}

export function SparseMatrices() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a <strong>sparse matrix</strong> is one where almost all the
          entries are zero. Storing every single zero explicitly, the way a normal ("dense") matrix
          does, wastes enormous amounts of memory and compute the moment matrices get large.
        </p>
        <p>
          <strong>Intermediate:</strong> instead, sparse formats store only the non-zero values and
          their positions. The most common, <strong>CSR</strong> (Compressed Sparse Row) and{" "}
          <strong>CSC</strong> (Compressed Sparse Column), are optimized for fast row or column
          access respectively; <strong>COO</strong> (coordinate format — a plain list of (row, col,
          value) triples) is simplest to construct but slowest to compute with.
        </p>
        <p>
          <strong>Advanced:</strong> operations on sparse matrices (multiplication, addition) use
          specialized algorithms that only ever touch the non-zero entries — a sparse matrix with 1%
          of entries non-zero can be multiplied roughly 100× faster and stored roughly 100× smaller
          than the naive dense approach, which is often the difference between an algorithm being
          feasible at all and not.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <div className="mb-1.5 font-medium text-foreground">
          Dense vs. COO sparse storage, n non-zero entries out of m×n total:
        </div>
        <Formula>
          {
            "\\text{dense: } mn \\text{ numbers} \\qquad \\text{COO: } \\approx 3k \\text{ numbers (value, row, col)}"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          When k ≪ mn (which is the normal case for real-world sparse data), the savings are
          dramatic — this is exactly what the diagram below computes live for a random sparsity
          pattern.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Dense vs. sparse storage, computed live"
        caption="Only the highlighted cells are stored at all in a sparse format — everything else costs zero memory."
      >
        <DiagramHost render={renderSparseGrid} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — sparse matrices in SciPy"
        code={`import numpy as np
from scipy import sparse

dense = np.zeros((1000, 1000))
dense[np.random.randint(0, 1000, 500), np.random.randint(0, 1000, 500)] = 1.0

sparse_csr = sparse.csr_matrix(dense)
print(dense.nbytes)                 # 8,000,000 bytes
print(sparse_csr.data.nbytes + sparse_csr.indices.nbytes + sparse_csr.indptr.nbytes)
# a small fraction of that -- only non-zeros (plus lightweight index arrays) are stored

# Matrix-vector multiply works transparently on the sparse version, much faster:
v = np.random.rand(1000)
result = sparse_csr @ v`}
      >
        <p>
          SciPy's sparse matrices support most of the same operations (<code>@</code>, addition,
          slicing) as dense NumPy arrays — the sparsity is handled transparently underneath.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>One-hot encodings</strong> and <strong>TF-IDF matrices</strong> in NLP are
            almost entirely zeros — a vocabulary of 100,000 words means each document vector has at
            most a few hundred non-zero entries.
          </li>
          <li>
            <strong>Graph adjacency matrices</strong> for real-world networks (social graphs, the
            web) are extremely sparse — most pairs of nodes are not directly connected — which is
            exactly why graph neural network libraries are built around sparse matrix operations.
          </li>
          <li>
            <strong>Recommender system</strong> user-item matrices (section 1.9) are sparse by
            construction — most users haven't rated most items.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Converting a large sparse matrix to dense (<code>.toarray()</code>) "just to check
            something" — this can exhaust memory instantly on matrices that were only ever tractable
            in sparse form.
          </li>
          <li>
            Using COO format for repeated arithmetic — it's meant for construction; convert to
            CSR/CSC before doing heavy computation.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Sparse matrix multiplication (SpMM) and sparse matrix-vector multiplication (SpMV) are
          fundamentally harder to parallelize efficiently on GPUs than dense GEMM (section 1.4) —
          the irregular memory access pattern of "only touch the non-zeros" doesn't map cleanly onto
          Tensor Cores, which is an active area of systems research (block-sparse formats,
          structured sparsity) specifically aimed at closing this gap.
        </p>
        <p>
          At the master level: <strong>structured sparsity</strong> (e.g. pruning entire blocks or
          channels of a neural network rather than individual scattered weights) trades a small
          amount of compression ratio for dramatically better real hardware speedups — unstructured
          sparsity often looks great on paper (fewer non-zero parameters) but delivers little
          real-world speedup because hardware isn't built to exploit arbitrary sparsity patterns
          efficiently.
        </p>
      </ExpertNote>
    </>
  );
}

export function TraceOfAMatrix() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> the <strong>trace</strong> of a square matrix is simply the sum
          of its diagonal entries. That's the entire definition — every off-diagonal entry is
          completely ignored.
        </p>
        <p>
          <strong>Intermediate:</strong> despite being so simple to compute, the trace has a
          surprisingly useful property: <code>trace(AB) = trace(BA)</code>, even though{" "}
          <code>AB ≠ BA</code> in general (section 1.4). This "cyclic property" extends to any
          number of matrices multiplied in a chain, as long as you only rotate the order rather than
          reversing it — and it's what makes the trace so convenient inside derivations.
        </p>
        <p>
          <strong>Advanced:</strong> the trace also equals the{" "}
          <strong>sum of a matrix's eigenvalues</strong> (just as the determinant, section 1.11,
          equals their <em>product</em>) — a fact that holds regardless of whether the matrix is
          diagonalizable, and connects this simple sum directly back to the deep structure of the
          matrix.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\text{trace}(A) = \\sum_i a_{ii} = \\sum_i \\lambda_i \\qquad \\text{trace}(AB) = \\text{trace}(BA)"
          }
        </Formula>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Only the diagonal matters"
        caption="Regenerate the matrix — the trace only ever sums the highlighted cells, no matter what the rest contains."
      >
        <DiagramHost render={renderTraceHighlight} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — trace identities in NumPy"
        code={`import numpy as np

A = np.random.rand(3, 3)
B = np.random.rand(3, 3)

print(np.trace(A @ B), np.trace(B @ A))   # equal, even though A@B != B@A

eigvals = np.linalg.eigvals(A)
print(np.isclose(np.trace(A), eigvals.sum().real))   # True

# Frobenius norm (section 1.19) via trace:
frob_via_trace = np.sqrt(np.trace(A.T @ A))
print(np.isclose(frob_via_trace, np.linalg.norm(A, 'fro')))   # True`}
      >
        <p>
          These aren't coincidences to memorize — they're the same underlying algebraic fact showing
          up in three different-looking formulas.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            The <strong>KL divergence between two multivariate Gaussians</strong> — a formula that
            appears constantly in variational autoencoders and Bayesian ML — includes a{" "}
            <code>trace(Σ₂⁻¹Σ₁)</code> term directly.
          </li>
          <li>
            <strong>Weight decay / L2 regularization</strong> of a weight matrix is literally{" "}
            <code>trace(WᵀW)</code>, connecting straight back to the Frobenius norm of section 1.19.
          </li>
          <li>
            The cyclic property is the standard trick used to simplify matrix-calculus derivations
            (section 1.16) that would otherwise involve unwieldy chains of matrix products.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Assuming <code>trace(ABC) = trace(CBA)</code> — the cyclic property only permits{" "}
            <em>rotations</em> of the order (<code>ABC → BCA → CAB</code>), not arbitrary reordering
            or reversal.
          </li>
          <li>Forgetting the trace is only defined for square matrices.</li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The cyclic property of trace is exactly why <code>trace(xᵀAx)</code> can be rewritten as{" "}
          <code>trace(Axxᵀ)</code> — a rearrangement used constantly to convert an awkward scalar
          expression into a matrix-calculus-friendly form during gradient derivations.
        </p>
        <p>
          At the master level: the trace of a matrix is invariant under a change of basis (section
          1.1's expert note) — <code>trace(P⁻¹AP) = trace(A)</code> for any invertible P — exactly
          like the determinant, and for the same underlying reason: both are functions purely of the
          eigenvalues, which don't depend on which coordinate system you chose to describe the
          matrix in.
        </p>
      </ExpertNote>
    </>
  );
}

export function PowerIteration() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> section 1.6 introduced eigenvalues and eigenvectors, but never
          said how to actually <em>find</em> them by computer for a matrix too large to solve by
          hand. <strong>Power iteration</strong> is the simplest possible algorithm: start with any
          vector, repeatedly multiply it by the matrix, and normalize after each step. That's the
          whole algorithm.
        </p>
        <p>
          <strong>Intermediate:</strong> why does this work? Every starting vector is (loosely
          speaking) a mix of all the matrix's eigenvector directions. Each multiplication by A
          scales the component along the <em>dominant</em> eigenvector (the one with the largest
          eigenvalue) more than every other component — so with each repetition, that direction
          comes to dominate the mix more and more, until essentially nothing else is left.
        </p>
        <p>
          <strong>Advanced:</strong> the running estimate of the eigenvalue itself, at any step, is
          given by the <strong>Rayleigh quotient</strong>, <code>vᵀAv / vᵀv</code> — and this is
          precisely what the real QR algorithm (section 1.13's expert note) generalizes into a full,
          robust method for finding <em>every</em> eigenvalue of a matrix, not just the dominant
          one.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {"v_{k+1} = \\frac{Av_k}{\\|Av_k\\|} \\qquad \\lambda \\approx \\frac{v^TAv}{v^Tv}"}
        </Formula>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Watch a vector converge onto the dominant eigenvector"
        caption="Drag the starting arrow anywhere, then iterate — within a handful of steps it locks onto the same direction every time."
      >
        <DiagramHost render={renderPowerIteration} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — power iteration from scratch"
        code={`import numpy as np

A = np.array([[3., 1.], [0., 1.]])   # dominant eigenvalue is 3

v = np.random.rand(2)
v /= np.linalg.norm(v)

for i in range(20):
    v = A @ v
    v /= np.linalg.norm(v)

eigenvalue_estimate = v @ A @ v   # Rayleigh quotient
print(v, eigenvalue_estimate)     # converges to [1, 0]-ish direction, eigenvalue ~ 3

# Sanity check against the exact answer:
eigvals, eigvecs = np.linalg.eig(A)
print(eigvals)`}
      >
        <p>
          Twenty lines, no library eigenvalue solver needed — and this genuinely is (a simplified
          version of) how PageRank was originally computed at web scale.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>PageRank</strong> (section 1.27) is power iteration applied to a web link matrix
            — exactly this algorithm, at a scale of billions of pages.
          </li>
          <li>
            Fast approximate PCA on very large datasets often uses power iteration (or its
            extension, Lanczos iteration) to find just the top few principal components, without
            ever computing a full eigendecomposition.
          </li>
          <li>
            Estimating a neural network's largest weight-matrix singular value (relevant to spectral
            normalization, section 1.19) in practice uses a fast one-step power-iteration
            approximation rather than a full SVD, for speed.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Power iteration only finds the <em>dominant</em> eigenvalue/eigenvector — if you need
            all of them, you need the full QR algorithm or an eigensolver, not repeated power
            iteration alone.
          </li>
          <li>
            Convergence can be very slow if the top two eigenvalues are close in magnitude — the
            convergence rate depends directly on the ratio between the largest and second-largest
            eigenvalue.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Power iteration only finds the single dominant eigenvector.{" "}
          <strong>Inverse iteration</strong> (applying <code>A⁻¹</code> instead of A) converges to
          the <em>smallest</em> eigenvalue instead, and <strong>shifted inverse iteration</strong>{" "}
          can target any eigenvalue near a chosen guess — the same core idea, retargeted.
        </p>
        <p>
          At the master level: real-world eigensolvers for large sparse matrices (e.g.{" "}
          <code>scipy.sparse.linalg.eigsh</code>) use <strong>Lanczos/Arnoldi iteration</strong>,
          which extracts far more information from the same sequence of matrix-vector products that
          power iteration generates, converging to several eigenvalues at once instead of just the
          dominant one — it's power iteration's ideas, engineered to their full potential.
        </p>
      </ExpertNote>
    </>
  );
}

export function KernelMethods() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> some datasets simply aren't separable by a straight line or
          flat plane, no matter how you draw it — like two classes arranged as concentric rings. But
          if you transform the data into a higher-dimensional space first (for instance, adding a
          third coordinate equal to distance-from-center-squared), the same two classes can become
          perfectly separable by a flat plane in that new space.
        </p>
        <p>
          <strong>Intermediate:</strong> the <strong>kernel trick</strong> is a shortcut that gets
          the benefit of this higher-dimensional lift without ever actually computing the lifted
          coordinates. Many algorithms (SVMs, kernel PCA, Gaussian processes) only ever need the{" "}
          <em>dot products</em> between lifted data points, never the lifted points themselves — and
          a <strong>kernel function</strong> <code>k(x, y)</code> computes exactly that dot product
          directly from the original, low-dimensional x and y, no matter how high-dimensional (even
          infinite-dimensional!) the implicit lift is.
        </p>
        <p>
          <strong>Advanced:</strong> which functions are valid as kernels is governed by{" "}
          <strong>Mercer's theorem</strong>: a function is a valid kernel exactly when the matrix it
          produces over any set of points is positive semi-definite (section 1.14) — connecting
          kernel methods directly back to the PD-matrix theory from earlier in this chapter.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"k(x, y) = \\phi(x) \\cdot \\phi(y)"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          φ is the (possibly never explicitly computed) lift into a higher-dimensional feature
          space. A popular example, the RBF/Gaussian kernel{" "}
          <Formula display={false}>{"k(x,y)=e^{-\\|x-y\\|^2/2\\sigma^2}"}</Formula>, corresponds to
          an implicit lift into an <em>infinite</em>-dimensional space — something you could never
          compute coordinates for directly, but can still use freely via the kernel trick.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Not separable → separable, via an implicit lift"
        caption="Two classes arranged as concentric rings (no straight line separates them) become linearly separable once lifted into (angle, radius²) space."
      >
        <DiagramHost render={renderKernelLift} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — the kernel trick with scikit-learn"
        code={`import numpy as np
from sklearn.svm import SVC
from sklearn.datasets import make_circles

X, y = make_circles(n_samples=200, factor=0.4, noise=0.05)

# A linear SVM cannot separate concentric circles at all:
linear_svm = SVC(kernel='linear').fit(X, y)
print("linear accuracy:", linear_svm.score(X, y))     # poor, close to chance

# An RBF kernel implicitly lifts into a much higher-dimensional space:
rbf_svm = SVC(kernel='rbf').fit(X, y)
print("RBF accuracy:", rbf_svm.score(X, y))            # ~1.0

# The kernel matrix itself is exactly the PD matrix from section 1.14:
from sklearn.metrics.pairwise import rbf_kernel
K = rbf_kernel(X)
print(np.all(np.linalg.eigvalsh(K) >= -1e-8))          # True -> PSD, as Mercer's theorem requires`}
      >
        <p>
          Swapping <code>kernel='linear'</code> for <code>kernel='rbf'</code> is the entire
          implementation of the kernel trick from the user's side — all the "lift into higher
          dimensions" machinery is hidden inside that one string argument.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Support Vector Machines</strong> are the classic application — the kernel trick
            is what let SVMs handle non-linear decision boundaries efficiently before deep learning
            existed.
          </li>
          <li>
            <strong>Gaussian processes</strong> (section 1.14) are defined entirely in terms of a
            kernel function specifying covariance between any two input points.
          </li>
          <li>
            <strong>Kernel PCA</strong> performs the PCA of section 1.9 in an implicit, non-linearly
            lifted feature space, capturing non-linear structure that ordinary PCA cannot.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Using a kernel that isn't actually a valid (positive semi-definite) kernel — Mercer's
            theorem is a real mathematical requirement, not a formality, and violating it breaks the
            theoretical guarantees of algorithms like SVMs.
          </li>
          <li>
            Forgetting that kernel methods scale poorly with the number of data points (the kernel
            matrix is n×n) — this is precisely why deep learning, which scales with parameters
            rather than dataset size in the same way, overtook kernel methods for very large
            datasets.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The "kernel trick" name is apt: you get the modeling power of an enormous (even infinite)
          feature space while paying only the computational cost of evaluating a kernel function
          between pairs of original, low-dimensional points — the lift itself is never materialized.
        </p>
        <p>
          At the master level: modern research increasingly views wide neural networks and kernel
          methods as deeply connected — in the infinite-width limit, a neural network's behavior
          converges to that of a specific kernel method (the "Neural Tangent Kernel"), providing one
          of the few available theoretical tools for analyzing deep learning training dynamics
          rigorously.
        </p>
      </ExpertNote>
    </>
  );
}

export function Whitening() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> real data is often <strong>correlated</strong> — some features
          stretch out more than others, and directions can be tangled together (like the elongated,
          tilted point clouds seen throughout this chapter). <strong>Whitening</strong> is a
          transformation that removes both effects at once: afterward, every direction has equal
          spread (unit variance), and no two directions are correlated with each other.
        </p>
        <p>
          <strong>Intermediate:</strong> the recipe uses the tools from earlier sections directly:
          eigendecompose (section 1.6) the data's covariance matrix to find its principal axes, then
          rescale along each axis by <code>1/√λᵢ</code> — dividing out exactly the amount of spread
          that axis originally had.
        </p>
        <p>
          <strong>Advanced:</strong> there isn't one unique whitening transform —{" "}
          <strong>PCA whitening</strong> (rotate to the eigenbasis, then scale) and{" "}
          <strong>ZCA whitening</strong> (do the same, but rotate back to the original coordinate
          system afterward) both produce decorrelated, unit-variance data, but ZCA keeps the result
          visually closer to the original data's orientation, which matters when the whitened output
          needs to still "look like" the input (a common requirement in image preprocessing).
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"x_{white} = \\Sigma^{-1/2}(x - \\mu)"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          <Formula display={false}>{"\\Sigma^{-1/2}"}</Formula> is computed from the covariance
          matrix's eigendecomposition: <code>Σ = VΛVᵀ</code> gives <code>Σ⁻¹ᐟ² = VΛ⁻¹ᐟ²Vᵀ</code> — a
          direct, practical use of the material from section 1.6.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Correlated, stretched data → isotropic unit-variance cloud"
        caption="This is exactly what StandardScaler + PCA (or a dedicated whitening transform) does to a dataset before feeding it to a distance-sensitive algorithm."
      >
        <DiagramHost render={renderWhitening} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — PCA whitening in NumPy"
        code={`import numpy as np

X = np.random.randn(500, 2) @ np.array([[3, 1], [1, 0.5]])   # correlated, stretched data
Xc = X - X.mean(axis=0)

cov = Xc.T @ Xc / len(X)
eigvals, eigvecs = np.linalg.eigh(cov)   # eigh: for symmetric matrices, sorted ascending

# PCA whitening: rotate into eigenbasis, then scale by 1/sqrt(eigenvalue)
X_whitened = Xc @ eigvecs @ np.diag(1.0 / np.sqrt(eigvals + 1e-8))

print(np.cov(X_whitened.T))   # ~identity matrix: unit variance, zero correlation`}
      >
        <p>
          Note the small <code>+ 1e-8</code> — a direct application of the "jitter" trick from
          section 1.14, needed because a real covariance matrix can have a tiny near-zero eigenvalue
          that would otherwise blow up the <code>1/√λ</code> scaling.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Preprocessing for classical ML algorithms</strong> — distance-based methods
            (k-nearest-neighbors, k-means) and gradient-based optimizers both tend to perform
            substantially better on whitened, decorrelated input features.
          </li>
          <li>
            <strong>Batch normalization</strong> in deep learning is a lightweight, per-batch
            approximation of whitening applied to a layer's activations — it only rescales variance
            per-feature rather than fully decorrelating, as a much cheaper compromise.
          </li>
          <li>
            <strong>Independent Component Analysis (ICA)</strong>, used for tasks like separating
            mixed audio signals, uses whitening as its standard first preprocessing step before the
            non-Gaussian independence search begins.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Whitening using the eigenvalues of a covariance matrix computed on your <em>test</em>{" "}
            set — always compute the whitening transform on training data only, then apply it to
            test data, to avoid leaking test-set statistics.
          </li>
          <li>
            Forgetting the small epsilon regularizer when dividing by <code>√λ</code> — near-zero
            eigenvalues (common with correlated or low-rank features) otherwise amplify noise
            enormously.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Whitening is the same eigen-decomposition machinery as PCA (section 1.6, 1.9), just
          followed by an extra rescaling step — which is why it's often described as "PCA, then
          normalize each component."
        </p>
        <p>
          At the master level: over-aggressive whitening on high-dimensional data with limited
          samples can badly amplify estimation noise in the smallest eigenvalue directions (since
          dividing by a poorly estimated small number is numerically unstable) — in practice,
          whitening is often combined with dimensionality reduction (dropping the
          smallest-eigenvalue directions entirely, section 1.9) rather than applied to every
          direction indiscriminately.
        </p>
      </ExpertNote>
    </>
  );
}

export function WoodburyIdentity() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>The one-sentence idea:</strong> if you already know the answer to a hard problem,
          and the problem only changes a little, there's often a shortcut to the new answer that's
          much cheaper than solving the whole thing again from scratch — Woodbury is exactly that
          shortcut, specifically for matrix inverses.
        </p>
        <p>
          <strong>Beginner:</strong> inverting a matrix (section 1.5) is expensive — roughly{" "}
          <code>O(n³)</code>. But what if you already have the inverse of a matrix, and you only
          need to update it slightly (say, adding one new data point to a dataset)? Recomputing the
          whole inverse from scratch every time would be wasteful.
        </p>
        <p>
          <strong>Intermediate:</strong> the <strong>Woodbury matrix identity</strong> (also called
          the matrix inversion lemma) gives a formula for the inverse of a matrix after a{" "}
          <em>low-rank update</em>, expressed entirely in terms of the <em>original</em> inverse —
          turning an expensive full <code>O(n³)</code> re-inversion into a much cheaper update.
        </p>
        <p>
          <strong>Advanced:</strong> this is exactly the trick that makes online/streaming
          algorithms practical: a Kalman filter updates its covariance estimate every time a new
          measurement arrives, and a Gaussian process can incorporate one new observation, both
          without ever recomputing a full matrix inverse from scratch at every single step.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"(A + UCV)^{-1} = A^{-1} - A^{-1}U(C^{-1} + VA^{-1}U)^{-1}VA^{-1}"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Dense as this looks, the key point is simple: if A is n×n but U, C, V represent only a
          small (rank-k) update, the right-hand side only ever needs to invert a small k×k matrix
          instead of a full n×n one.
        </p>
      </SectionBlock>
      <SectionBlock
        id="worked"
        label="Worked example (Sherman-Morrison, the rank-1 case)"
        tone="muted"
      >
        <p>
          Let <code>A = [[2, 0], [0, 2]]</code> (so <code>A⁻¹ = [[0.5, 0], [0, 0.5]]</code>), and
          update it with <code>u = [1, 1]</code> so <code>A_new = A + uuᵀ = [[3, 1], [1, 3]]</code>.
          Direct inversion gives <code>A_new⁻¹ = [[0.375, −0.125], [−0.125, 0.375]]</code>.
          Sherman-Morrison instead computes <code>A⁻¹u = [0.5, 0.5]</code>, then{" "}
          <code>1 + uᵀA⁻¹u = 1 + 0.5 + 0.5 = 2</code>, giving{" "}
          <code>
            A_new⁻¹ = A⁻¹ − (A⁻¹u)(A⁻¹u)ᵀ / 2 = [[0.5,0],[0,0.5]] − [[0.125,0.125],[0.125,0.125]]
          </code>{" "}
          = <code>[[0.375, −0.125], [−0.125, 0.375]]</code> — the exact same answer, using only
          vector operations on the already-known <code>A⁻¹</code>, never re-inverting the full 2×2
          matrix.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — updating an inverse without recomputing it"
        code={`import numpy as np

n = 200
A = np.eye(n) * 2 + np.random.rand(n, n) * 0.01
A_inv = np.linalg.inv(A)   # expensive, done once

# A rank-1 update: A_new = A + u @ u.T
u = np.random.rand(n, 1)
A_new = A + u @ u.T

# Full recomputation (the slow way):
A_new_inv_direct = np.linalg.inv(A_new)

# Sherman-Morrison (Woodbury's rank-1 special case):
Ainv_u = A_inv @ u
A_new_inv_fast = A_inv - (Ainv_u @ Ainv_u.T) / (1 + (u.T @ Ainv_u)[0, 0])

print(np.allclose(A_new_inv_direct, A_new_inv_fast))   # True, much cheaper to compute`}
      >
        <p>
          This special rank-1 case is called the <strong>Sherman-Morrison formula</strong> — the
          same idea as Woodbury, just for the simplest possible update.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Kalman filters</strong> (robotics, GPS, finance) use exactly this identity to
            update state covariance estimates efficiently every time a new sensor reading arrives.
          </li>
          <li>
            <strong>Online/recursive least squares</strong> updates a regression model's solution as
            new data streams in, without recomputing the full normal-equation inverse from section
            1.5 each time.
          </li>
          <li>
            <strong>Gaussian process</strong> libraries use Woodbury-style updates to add new
            training points incrementally, avoiding a full <code>O(n³)</code> Cholesky
            refactorization (section 1.14) every time.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Applying Woodbury when the "update" isn't actually low-rank — the whole benefit
            disappears if k is comparable to n; it's specifically a low-rank-update trick.
          </li>
          <li>
            Forgetting numerical stability still matters — repeated incremental updates can
            accumulate floating-point drift, and long-running online systems often periodically
            recompute a fresh, exact inverse to correct for it.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The Woodbury identity is, algebraically, a generalization of the simple scalar fact that{" "}
          <code>1/(a+bc) </code> can be rewritten in terms of <code>1/a</code> when bc is "small"
          relative to a — matrix inversion has a genuine analogue of this same idea, just dressed up
          in more notation.
        </p>
        <p>
          At the master level: the Woodbury identity is one of the standard tools that makes{" "}
          <strong>Bayesian linear regression</strong> and{" "}
          <strong>Gaussian process regression</strong> tractable at scale — both rely on repeatedly
          manipulating covariance matrices under low-rank updates, and naive full re-inversion at
          every step would make either approach computationally infeasible for any real dataset
          size.
        </p>
      </ExpertNote>
    </>
  );
}

export function PerronFrobenius() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>The one-sentence idea:</strong> this lesson answers a "wait, why does that
          actually work?" question left hanging by section 1.23 — it's the theorem that guarantees
          PageRank (and anything else built on power iteration over non-negative data) has a real,
          unique answer at all, rather than a coin's chance of returning nonsense.
        </p>
        <p>
          <strong>Beginner:</strong> section 1.23's power iteration algorithm quietly assumed
          something important: that a single, dominant, real, positive eigenvalue actually exists to
          converge to. For a general matrix, eigenvalues can be negative or even complex (section
          1.6) — so why does this always work out for something like PageRank?
        </p>
        <p>
          <strong>Intermediate:</strong> the <strong>Perron-Frobenius theorem</strong> answers this
          directly: for a matrix with all non-negative entries (like a web link matrix, or any
          transition matrix of probabilities), there is guaranteed to be a real, positive dominant
          eigenvalue, with a corresponding eigenvector that can also be chosen to have all
          non-negative entries.
        </p>
        <p>
          <strong>Advanced:</strong> this is precisely the mathematical guarantee that makes
          PageRank well-defined at all: the "importance score" eigenvector is guaranteed to exist,
          be real, and (with the standard damping-factor trick, which guarantees the stronger
          uniqueness condition the theorem requires) be unique — without this theorem, there would
          be no guarantee that "the steady-state importance of every web page" is even a coherent,
          well-defined mathematical object.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "A_{ij} \\ge 0 \\ \\forall i,j \\quad\\Longrightarrow\\quad \\exists\\, \\lambda_{max} > 0,\\ \\vec{v} \\ge 0"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          For a matrix that is additionally "irreducible" (every state can eventually reach every
          other state — true of the web graph with damping), this dominant eigenvalue/eigenvector
          pair is also unique.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="PageRank as power iteration on a link graph"
        caption="Click repeatedly — the scores are guaranteed to converge to a unique, all-positive steady state, precisely because of the Perron-Frobenius theorem."
      >
        <DiagramHost render={renderPageRankGraph} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — PageRank, from the transition matrix to convergence"
        code={`import numpy as np

# A tiny 4-page web: rows/cols are pages, entry (i,j) = 1 if page j links to page i
links = np.array([
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 0, 0],
], dtype=float)

out_degree = links.sum(axis=0)
M = links / out_degree           # column-stochastic transition matrix
d = 0.85
n = 4
google_matrix = d * M + (1 - d) / n * np.ones((n, n))   # damping guarantees Perron-Frobenius applies

scores = np.ones(n) / n
for _ in range(50):
    scores = google_matrix @ scores   # power iteration (section 1.23)

print(scores, scores.sum())   # converges to a unique, all-positive distribution`}
      >
        <p>
          This ~10-line script is a genuine, working (if tiny) implementation of the original
          PageRank algorithm — everything else in real search engines is scale and engineering, not
          different mathematics.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>PageRank</strong> itself is the canonical example — Google's original ranking
            algorithm is Perron-Frobenius plus power iteration, applied at the scale of the entire
            web.
          </li>
          <li>
            <strong>Markov chain steady states</strong> (queueing theory, population dynamics,
            board-game analysis) rely on the same theorem to guarantee a well-defined long-run
            distribution exists.
          </li>
          <li>
            <strong>Economic input-output models</strong> (Leontief models) use non-negative
            matrices to represent inter-industry dependencies, and Perron-Frobenius guarantees a
            meaningful equilibrium solution exists.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Applying power iteration to a matrix with negative entries and expecting the same clean
            convergence guarantees — Perron-Frobenius specifically requires non-negativity; without
            it, the dominant eigenvalue can be complex or the eigenvector can have mixed signs.
          </li>
          <li>
            Forgetting the damping factor in a from-scratch PageRank implementation — without it,
            the raw link matrix may not be "irreducible" (some pages might be dead ends with no
            outgoing links), breaking the uniqueness guarantee the theorem otherwise provides.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The damping factor (typically 0.85 in the original PageRank paper) isn't just a heuristic
          tuning knob — it mathematically guarantees the "irreducibility" condition Perron-Frobenius
          needs for a <em>unique</em> steady state, by ensuring every page can reach every other
          page with non-zero probability (via the small uniform "random jump" term).
        </p>
        <p>
          At the master level: the same theorem underlies the analysis of any non-negative dynamical
          system's long-run behavior — ecological population models, epidemiological compartment
          models, and economic equilibrium models all reduce, at some point, to asking whether a
          non-negative matrix has the well-behaved dominant eigenstructure Perron-Frobenius
          guarantees.
        </p>
      </ExpertNote>
      <Takeaway>
        <p>
          Every "steady state," "importance score," or "equilibrium" computed via repeated matrix
          multiplication on non-negative data is quietly leaning on this one theorem to guarantee
          the answer is even well-defined in the first place.
        </p>
      </Takeaway>
    </>
  );
}
