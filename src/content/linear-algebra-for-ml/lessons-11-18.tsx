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
  renderDeterminant,
  renderGramSchmidt,
  renderQuadraticForm,
  renderGradientDescent,
  renderEigenSpectrum,
} from "./diagrams-11-18";

export function Determinants() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> the <strong>determinant</strong> is a single number computed
          from a square matrix that tells you how much the matrix's transformation scales area (in
          2D) or volume (in 3D and beyond). A determinant of 2 means "everything doubles in area." A
          determinant of 0 means "everything gets squashed flat" — the transformation destroys a
          dimension.
        </p>
        <p>
          <strong>Intermediate:</strong> the sign matters too, not just the size. A negative
          determinant means the transformation flips orientation — like a reflection in a mirror.
          This is why the determinant is "signed area/volume," not just plain area/volume.
        </p>
        <p>
          <strong>Advanced:</strong> a matrix has an inverse if and only if its determinant is
          non-zero — this is the precise, computable version of the "singular vs. non-singular"
          language from section 1.5, and it's mathematically identical to saying the matrix has full
          rank (section 1.8). All three ideas — nonzero determinant, full rank, invertibility — are
          exactly the same fact viewed three different ways.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <div className="mb-1.5 font-medium text-foreground">2×2 case:</div>
        <Formula>{"\\det\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix} = ad - bc"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          For larger matrices the formula generalizes recursively (cofactor expansion), but in
          practice no one computes determinants this way by hand past 3×3 — libraries use LU
          decomposition (section 1.12) instead, since the determinant of a triangular matrix is just
          the product of its diagonal.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Determinant as signed area"
        caption="Drag either vector — the shaded parallelogram's area is exactly |det|."
      >
        <DiagramHost render={renderDeterminant} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — determinants in NumPy"
        code={`import numpy as np

A = np.array([[3, 1], [2, 4]])
print(np.linalg.det(A))          # 10.0

singular = np.array([[1, 2], [2, 4]])
print(np.linalg.det(singular))   # 0.0 (rank 1 -> no inverse, section 1.8)

# Product rule
B = np.array([[0, -1], [1, 0]])   # a 90-degree rotation, det = 1
print(np.linalg.det(A @ B), np.linalg.det(A) * np.linalg.det(B))  # equal`}
      >
        <p>
          <code>det(AB) = det(A)·det(B)</code> always holds — composing two transformations
          multiplies their scaling factors, exactly as you'd expect.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Change of variables</strong> in probability and statistics — transforming a
            probability distribution to a new coordinate system requires dividing by the absolute
            value of the transformation's Jacobian determinant (section 1.16), to keep total
            probability equal to 1.
          </li>
          <li>
            <strong>Fast invertibility checks</strong> — before attempting to invert a matrix or
            solve a system, checking <code>det ≈ 0</code> flags a numerically dangerous problem
            early.
          </li>
          <li>
            <strong>Computer graphics</strong> — the determinant of a 3×3 transformation matrix
            tells a renderer whether a triangle's winding order (and therefore which face is
            "front-facing") has flipped.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Determinants are only defined for <em>square</em> matrices — there's no such thing as
            "the determinant" of a rectangular data matrix.
          </li>
          <li>
            Trusting <code>det(A) == 0</code> exactly in floating point — real computations produce
            tiny non-zero values like <code>1e-16</code> for genuinely singular matrices. Compare
            against a small tolerance, or better, check the condition number (section 1.9) instead.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The determinant equals the <strong>product of a matrix's eigenvalues</strong> — this is
          why <code>det(A − λI) = 0</code> (the characteristic equation from section 1.6) works at
          all: it's asking "for what λ does A − λI become singular (determinant zero)?"
        </p>
        <p>
          At the master level: for large matrices, computing the raw determinant is numerically
          dangerous — it can overflow or underflow to zero even when the matrix is perfectly
          healthy, because it's a product of many numbers. Production code almost always works with
          the <strong>log-determinant</strong> instead (summing log|eigenvalues| or log of the
          diagonal of a Cholesky/LU factor), which is exactly how multivariate Gaussian
          log-likelihoods are computed in every serious statistics and ML library.
        </p>
      </ExpertNote>
      <Quiz
        q="If det(A) = 0, what does that tell you about solving Ax = b?"
        a="A has no inverse, so the system either has no solution or infinitely many — you cannot solve it uniquely with A⁻¹."
      />
    </>
  );
}

export function LuDecomposition() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> when you need to solve <code>Ax = b</code> for x, computing a
          full inverse (section 1.5) is overkill — like buying a whole toolbox to turn one screw.{" "}
          <strong>LU decomposition</strong> splits A into a Lower-triangular matrix L and an
          Upper-triangular matrix U, so that <code>A = LU</code>. Triangular systems are cheap to
          solve directly, without ever forming an inverse.
        </p>
        <p>
          <strong>Intermediate:</strong> this is literally the "Gaussian elimination" method taught
          in introductory algebra, just organized and named so the steps can be reused. Once you
          have <code>A = LU</code>, solving <code>Ax = b</code> becomes two easy steps: solve{" "}
          <code>Ly = b</code> for y (forward substitution, top to bottom), then solve{" "}
          <code>Ux = y</code> for x (back substitution, bottom to top).
        </p>
        <p>
          <strong>Advanced:</strong> plain LU decomposition can fail or become numerically unstable
          if a "pivot" (a diagonal entry used during elimination) is zero or very small. The fix,{" "}
          <strong>partial pivoting</strong>, reorders rows during the process, giving{" "}
          <code>PA = LU</code> for some permutation matrix P — this is what every real library
          actually computes, silently, whenever you call a "solve" function.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"PA = LU"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          L has 1s on its diagonal and zeros above; U has arbitrary values on and above its diagonal
          and zeros below; P records any row swaps needed for numerical stability.
        </p>
      </SectionBlock>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          Solving <code>2x + y = 5, x + 3y = 10</code> by elimination: subtract ½ of row 1 from row
          2 to zero out the x-coefficient, giving the "U" row <code>2.5y = 7.5 → y = 3</code>, then
          back-substitute into row 1: <code>2x + 3 = 5 → x = 1</code>. The multiplier you used (½)
          is exactly the entry that goes into L. This tiny manual example <em>is</em> LU
          decomposition — the algorithm just formalizes and records every step.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — solving systems the right way"
        code={`import numpy as np
from scipy.linalg import lu, lu_factor, lu_solve

A = np.array([[2., 1.], [1., 3.]])
b = np.array([5., 10.])

# The WRONG way (slow, numerically worse at scale):
x_slow = np.linalg.inv(A) @ b

# The RIGHT way — let LAPACK pick the best method (LU under the hood):
x_fast = np.linalg.solve(A, b)

# Explicit LU, if you need to solve against many different b's efficiently:
lu_piv = lu_factor(A)
x_reused = lu_solve(lu_piv, b)
print(x_slow, x_fast, x_reused)   # all equal: [1. 3.]`}
      >
        <p>
          Factor once with <code>lu_factor</code>, then reuse it with <code>lu_solve</code> for as
          many right-hand sides as you need — this is exactly the performance trick used in
          iterative simulations that repeatedly solve against the same system matrix.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            Structural and circuit simulation software solves enormous sparse linear systems via
            specialized sparse LU decompositions, over and over, as a simulation steps through time.
          </li>
          <li>
            Any time a codebase calls <code>np.linalg.solve</code>,{" "}
            <code>scipy.sparse.linalg.spsolve</code>, or similar, LU decomposition (with pivoting)
            is almost certainly running underneath.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Computing <code>np.linalg.inv(A) @ b</code> instead of{" "}
            <code>np.linalg.solve(A, b)</code> — it's slower, less accurate, and considered bad
            practice in every numerical computing community for exactly the same reason section 1.5
            flagged it.
          </li>
          <li>
            Assuming LU decomposition always exists without pivoting — it can fail on a perfectly
            invertible matrix if you're unlucky with row order; always use the pivoted version.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          LU decomposition costs roughly <code>O(n³/3)</code> operations — about half the cost of
          computing a full matrix inverse, which is one of the concrete reasons "solve, don't
          invert" is not just stylistic advice but a real performance and stability rule.
        </p>
        <p>
          At the master level: for the special case of a symmetric positive-definite matrix (section
          1.14), <strong>Cholesky decomposition</strong> is an even cheaper, more stable variant of
          LU that exploits the symmetry to do roughly half the work again — this is why
          covariance-matrix heavy code (Gaussian processes, Kalman filters, Bayesian inference)
          almost always reaches for Cholesky specifically rather than generic LU.
        </p>
      </ExpertNote>
    </>
  );
}

export function QrGramSchmidt() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> <strong>orthogonalization</strong> means turning a set of
          vectors into a set that all point perpendicular to each other, without changing what they
          span (section 1.8). The classic recipe for doing this is the{" "}
          <strong>Gram-Schmidt process</strong>: take each new vector, subtract off whatever part of
          it points along the directions you already have, and keep only what's left over — which is
          automatically perpendicular to everything before it.
        </p>
        <p>
          <strong>Intermediate:</strong> <strong>QR decomposition</strong> packages this idea into a
          matrix factorization: any matrix A can be written as <code>A = QR</code>, where Q has
          orthonormal columns (the Gram-Schmidt-ed, unit-length version of A's columns) and R is
          upper-triangular (recording exactly how much of each original column was "redundant" with
          the earlier ones).
        </p>
        <p>
          <strong>Advanced:</strong> QR gives a numerically superior way to solve least-squares
          regression compared to the normal equation from section 1.5 (<code>w = (XᵀX)⁻¹Xᵀy</code>).
          Forming <code>XᵀX</code> squares the condition number of X, amplifying numerical error;
          solving via QR avoids that squaring entirely, which is why serious statistical software
          defaults to a QR-based solver rather than the textbook formula.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"A = QR \\qquad Q^TQ = I"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Gram-Schmidt, step by step, for vectors a₁, a₂: <code>e₁ = a₁/‖a₁‖</code>, then{" "}
          <code>e₂ = (a₂ − (a₂·e₁)e₁)</code>, normalized. Each new vector only ever has the previous
          directions subtracted out.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Watch Gram-Schmidt strip out the redundant part"
        caption="Blue is the fixed reference direction. Drag orange — grey dashed is the projection being removed, green is what's left: always exactly perpendicular to blue."
      >
        <DiagramHost render={renderGramSchmidt} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — QR decomposition and stable least squares"
        code={`import numpy as np

X = np.array([[1., 1.], [1., 2.], [1., 3.], [1., 4.]])   # design matrix
y = np.array([2., 4., 5., 8.])

Q, R = np.linalg.qr(X)
print(np.allclose(Q.T @ Q, np.eye(2)))   # True -> Q's columns are orthonormal

# Solve the least-squares fit via QR instead of the fragile normal equation:
w = np.linalg.solve(R, Q.T @ y)
print(w)   # intercept, slope

# NumPy's own least-squares solver uses this same idea internally:
w2, *_ = np.linalg.lstsq(X, y, rcond=None)
print(np.allclose(w, w2))   # True`}
      >
        <p>
          <code>np.linalg.lstsq</code> is what you should reach for in practice — but knowing it's
          doing QR (not the textbook normal equation) explains why it's the more numerically
          trustworthy choice.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            Robotics and computer graphics use QR (or the related Householder reflections) to keep a
            sequence of rotation matrices numerically "clean" — repeated multiplication of rotation
            matrices slowly accumulates floating-point drift away from true orthogonality, and
            re-orthogonalizing via QR fixes it.
          </li>
          <li>
            Every serious linear regression / least-squares solver (R's <code>lm()</code>,
            scikit-learn's <code>LinearRegression</code>, NumPy's <code>lstsq</code>) uses QR or SVD
            internally instead of the raw normal equation.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Implementing "classical" Gram-Schmidt naively for many vectors — it's numerically
            unstable in practice; real libraries use <strong>modified Gram-Schmidt</strong> or
            Householder reflections, which are mathematically equivalent but far more stable in
            floating point.
          </li>
          <li>
            Solving least squares via <code>(XᵀX)⁻¹Xᵀy</code> directly in code that matters — prefer{" "}
            <code>np.linalg.lstsq</code> or an explicit QR/SVD-based solve.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          QR decomposition isn't just for least squares — the <strong>QR algorithm</strong>{" "}
          (repeatedly factoring a matrix as QR, then multiplying the factors back together in
          reverse order, and iterating) is the actual method general-purpose numerical libraries use
          to compute eigenvalues (section 1.6) for matrices larger than 2×2 or 3×3. The "solve the
          characteristic polynomial" method taught in school is essentially never used in real
          software — it's numerically unreliable for anything but the smallest matrices.
        </p>
        <p>
          At the master level: the columns of Q form an <strong>orthonormal basis</strong> for the
          same column space as A — meaning QR is simultaneously an orthogonalization procedure, a
          rank-revealing factorization, and (via the QR algorithm) an eigenvalue solver, which is a
          lot of mileage from one relatively simple idea.
        </p>
      </ExpertNote>
    </>
  );
}

export function PositiveDefiniteCholesky() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a square symmetric matrix A is{" "}
          <strong>positive definite</strong> if, for every nonzero vector x, the number{" "}
          <code>xᵀAx</code> comes out positive. Think of it as a generalization of "this number is
          positive" to matrices — it's the condition that makes the quadratic bowl from section 1.15
          always curve <em>upward</em>, everywhere, with a single clear minimum.
        </p>
        <p>
          <strong>Intermediate:</strong> a positive <em>semi</em>-definite matrix relaxes this
          slightly — <code>xᵀAx ≥ 0</code>, allowing flat directions. Every covariance matrix in
          existence is positive semi-definite by mathematical construction (a variance can never be
          negative), which is why "is this a valid covariance matrix?" and "is this matrix PSD?" are
          the exact same question.
        </p>
        <p>
          <strong>Advanced:</strong> for a positive-definite matrix, a special, cheaper, more
          numerically stable decomposition exists: <strong>Cholesky decomposition</strong>,{" "}
          <code>A = LLᵀ</code>, where L is lower-triangular. It's the matrix equivalent of taking a
          square root — and just like you can't take the square root of a negative number, Cholesky
          only exists for positive-definite matrices, which makes attempting it a fast, reliable PD
          test in itself.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"A = LL^T \\qquad x^TAx > 0 \\ \\forall x \\neq 0"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Equivalent tests: all eigenvalues of A are positive, or every "leading principal minor"
          (determinant of the top-left k×k block, for every k) is positive.
        </p>
      </SectionBlock>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          Test <code>A = [[4, 2], [2, 3]]</code> three different ways, and confirm they agree.
          Eigenvalues: solving <code>det(A − λI) = 0</code> gives <code>λ ≈ 5.56</code> and{" "}
          <code>λ ≈ 1.44</code> — both positive, so A is positive definite. Leading minors: the
          top-left 1×1 block is <code>4 &gt; 0</code>, and the full 2×2 determinant is{" "}
          <code>(4)(3) − (2)(2) = 8 &gt; 0</code> — both positive, agreeing with the eigenvalue
          test. Cholesky: <code>L = [[2, 0], [1, √2]]</code>, and multiplying <code>LLᵀ</code> back
          out reproduces A exactly — confirming the factorization exists, which it could only do
          because A is positive definite.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — sampling a multivariate Gaussian via Cholesky"
        code={`import numpy as np

cov = np.array([[4.0, 2.0], [2.0, 3.0]])   # a covariance matrix
mean = np.array([1.0, -2.0])

L = np.linalg.cholesky(cov)   # fails with LinAlgError if not PD

# Turn standard-normal noise into correlated samples from N(mean, cov):
z = np.random.randn(2, 1000)          # standard normal, uncorrelated
samples = mean.reshape(-1, 1) + L @ z  # now has the target mean & covariance
print(np.cov(samples))                 # should be close to cov

# A quick PD check anywhere in your code:
def is_pd(A):
    try:
        np.linalg.cholesky(A)
        return True
    except np.linalg.LinAlgError:
        return False`}
      >
        <p>
          This exact pattern — Cholesky, then multiply standard normal noise by L — is how every
          Gaussian process library and every "sample a correlated random variable" function is
          implemented under the hood.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Gaussian processes</strong> require their kernel (covariance) matrix to be PD by
            definition — Cholesky is used both to sample from the process and to compute its
            log-likelihood efficiently.
          </li>
          <li>
            <strong>Kalman filters</strong> (used in GPS, robotics, and finance) rely on Cholesky
            decomposition of covariance matrices at every update step.
          </li>
          <li>
            <strong>Physical simulation</strong> — mass and stiffness matrices in structural
            engineering are positive definite by physical necessity (energy can't be negative), and
            Cholesky is the standard solver.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Assuming a computed covariance-like matrix is exactly PD — floating-point rounding can
            leave it just barely non-PD (a tiny negative eigenvalue). The standard fix is adding a
            small <em>jitter</em> term (e.g. <code>+ 1e-6 * I</code>) to the diagonal before
            factoring.
          </li>
          <li>
            Confusing positive <em>semi</em>-definite (allows zero eigenvalues, no Cholesky) with
            positive definite (strictly positive eigenvalues, Cholesky guaranteed) — they are not
            interchangeable for this purpose.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Cholesky is roughly twice as fast as generic LU decomposition for the same matrix, purely
          by exploiting symmetry — it only ever needs to compute (and store) half the matrix.
        </p>
        <p>
          At the master level: Cholesky decomposition is the standard, numerically preferred way to
          compute the log-determinant needed for a multivariate Gaussian log-likelihood:{" "}
          <code>log|Σ| = 2·Σᵢ log(Lᵢᵢ)</code> — summing the log of L's diagonal — which is both
          faster and dramatically more numerically stable than computing the determinant directly
          (section 1.11), and is exactly what every serious probabilistic modeling library does.
        </p>
      </ExpertNote>
    </>
  );
}

export function QuadraticFormsConvexity() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a <strong>quadratic form</strong> is an expression built
          entirely from squared and cross terms, like <code>f(x,y) = ax² + dy²</code> (or, more
          generally, <code>xᵀAx</code>). Its graph is a curved bowl-, dome-, or saddle-shaped
          surface — exactly the shapes that loss functions and optimization landscapes are made of.
        </p>
        <p>
          <strong>Intermediate:</strong> whether that surface is a bowl (has one clear minimum), a
          dome (one clear maximum), or a saddle (curves up in one direction and down in another,
          with no true min or max) is determined entirely by the sign pattern of A's eigenvalues
          (section 1.6): all positive → bowl (A is positive definite, section 1.14); all negative →
          dome; mixed signs → saddle.
        </p>
        <p>
          <strong>Advanced:</strong> a function is <strong>convex</strong> if its curvature
          (captured by its <strong>Hessian</strong> matrix of second derivatives — a matrix, exactly
          like the A in a quadratic form) is positive semi-definite everywhere. Convexity is the
          single property that guarantees gradient descent finds the <em>global</em> minimum, not
          just a nearby local one — which is precisely why linear regression and logistic regression
          always train reliably, while deep neural networks (whose loss landscapes are emphatically
          not convex) can get stuck.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "f(\\vec{x}) = \\vec{x}^T A \\vec{x} \\qquad H_{ij} = \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          At a critical point (gradient = 0), the Hessian's sign pattern classifies it: positive
          definite → local minimum, negative definite → local maximum, indefinite (mixed signs) →
          saddle point.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Convex bowl vs. saddle, live"
        caption="Drag the sliders through zero — watch the contours flip from ellipses (convex) to hyperbola-like asymptotes (saddle) exactly when a sign changes."
      >
        <DiagramHost render={renderQuadraticForm} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — classifying a critical point from its Hessian"
        code={`import numpy as np

def classify(H):
    eigvals = np.linalg.eigvalsh(H)   # eigvalsh: for symmetric matrices
    if np.all(eigvals > 0):
        return "local minimum (convex bowl)"
    if np.all(eigvals < 0):
        return "local maximum (concave dome)"
    return "saddle point"

print(classify(np.array([[2, 0], [0, 3]])))    # local minimum
print(classify(np.array([[2, 0], [0, -3]])))   # saddle point
print(classify(np.array([[-2, 0], [0, -3]])))  # local maximum`}
      >
        <p>
          This six-line function is exactly the "second derivative test" from calculus, generalized
          to many dimensions using nothing but eigenvalues.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Linear and logistic regression</strong> have provably convex loss functions —
            this is why they always converge to the same, globally optimal answer regardless of
            initialization.
          </li>
          <li>
            <strong>Support Vector Machines</strong> are formulated specifically as convex
            optimization problems, which is a large part of why they were so reliable before deep
            learning became dominant.
          </li>
          <li>
            <strong>Newton's method</strong> in optimization uses the Hessian directly (
            <code>x ← x − H⁻¹∇f</code>) to take smarter steps than plain gradient descent,
            converging much faster near a minimum — at the cost of needing to compute and invert the
            Hessian. In practice, that inversion is done approximately via conjugate gradient
            (section 1.33), using Hessian-vector products (section 1.31) so the full Hessian is
            never actually formed.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Assuming a deep learning loss surface is convex — it almost never is; training relies on
            good initialization, architecture choices, and optimizers robust to non-convexity, not
            on convexity guarantees.
          </li>
          <li>
            Confusing "gradient is zero" with "this is a minimum" — a zero gradient only means a
            critical point; the Hessian's sign pattern is what actually classifies it.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          For genuinely convex problems, any local minimum is automatically the global minimum —
          this single fact is why convex optimization is considered a "solved" field with strong
          theoretical guarantees, while general non-convex optimization (most of deep learning) is
          not.
        </p>
        <p>
          At the master level: a striking, counter-intuitive result from high-dimensional random
          matrix theory (section 1.18) is that in very high-dimensional non-convex landscapes,
          critical points with a mix of positive and negative Hessian eigenvalues (saddle points)
          vastly outnumber true local minima — and most of the "getting stuck" behavior once blamed
          on bad local minima in deep learning is now understood to be about escaping saddle points
          instead.
        </p>
      </ExpertNote>
    </>
  );
}

export function MatrixCalculus() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>New to derivatives?</strong> A derivative just measures "if I nudge this input a
          tiny bit, how much does the output change, and in which direction?" A{" "}
          <strong>partial derivative</strong> is the same question asked about one input at a time,
          while every other input is frozen in place — "if I only nudge x (not y), how does the
          output move?" That's the entire prerequisite for this lesson; nothing more advanced is
          assumed.
        </p>
        <p>
          <strong>Beginner:</strong> the <strong>gradient</strong> of a function with respect to a
          vector is just a vector holding every one of those partial derivatives — one number per
          input, all collected together. The gradient always points in the direction of steepest
          increase, which is exactly why gradient <em>descent</em> moves in the opposite direction.
        </p>
        <p>
          <strong>Intermediate:</strong> the <strong>Jacobian</strong> generalizes this to functions
          that output a whole vector, not just a single number: it's a matrix where row i is the
          gradient of output i with respect to every input. The <strong>Hessian</strong> (section
          1.15) is the Jacobian of the gradient itself — the matrix of all second derivatives.
        </p>
        <p>
          <strong>Advanced:</strong> the chain rule, written in matrix form, says the Jacobian of a
          composition of functions is the <em>product</em> of their individual Jacobians. This one
          sentence is, precisely and without exaggeration, what backpropagation is: applying the
          chain rule layer by layer through a neural network, where "layer by layer" means "Jacobian
          by Jacobian."
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <div className="mb-1.5 font-medium text-foreground">
          A common, load-bearing identity in ML:
        </div>
        <Formula>
          {"\\nabla_x (x^TAx) = (A + A^T)x \\ \\xrightarrow{A \\text{ symmetric}} \\ 2Ax"}
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          This is exactly the gradient used in the descent animation above and in every derivation
          of linear/ridge regression's closed-form solution.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Gradient descent, literally rolling downhill"
        caption="Drag the starting point, then press Descend — each step moves opposite the gradient 2Ax. Notice the zig-zag: that's the cost of a poorly conditioned Hessian."
      >
        <DiagramHost render={renderGradientDescent} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — verifying a gradient with finite differences"
        code={`import numpy as np

A = np.array([[2., 0.], [0., 5.]])

def f(x):
    return x @ A @ x

def analytic_grad(x):
    return 2 * A @ x   # the identity above, since A is symmetric

def numeric_grad(x, eps=1e-6):
    g = np.zeros_like(x)
    for i in range(len(x)):
        dx = np.zeros_like(x); dx[i] = eps
        g[i] = (f(x + dx) - f(x - dx)) / (2 * eps)
    return g

x = np.array([1.5, -0.7])
print(analytic_grad(x))
print(numeric_grad(x))   # should match closely -> "gradient checking"`}
      >
        <p>
          "Gradient checking" — comparing an analytic gradient formula against a numeric
          finite-difference approximation — is a standard debugging technique whenever you implement
          backpropagation by hand.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            Every deep learning framework's <strong>autograd</strong> engine (PyTorch's{" "}
            <code>autograd</code>, TensorFlow's <code>GradientTape</code>) is a system for
            automatically applying the chain rule of Jacobians through an arbitrary computation
            graph.
          </li>
          <li>
            <strong>Normalizing flows</strong> in generative modeling need the Jacobian determinant
            (section 1.11) of each transformation to correctly track how probability density changes
            — they're specifically engineered so that Jacobian is triangular and cheap to compute
            (section 1.34).
          </li>
          <li>
            <strong>Second-order optimizers</strong> (Newton's method, L-BFGS) use the Hessian or an
            approximation of it to converge faster than plain gradient descent near a solution — in
            practice via Hessian-vector products (section 1.31) rather than the full matrix.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Using <code>∇(xᵀAx) = 2Ax</code> when A isn't symmetric — the correct general form is{" "}
            <code>(A + Aᵀ)x</code>, which only simplifies to <code>2Ax</code> when A = Aᵀ.
          </li>
          <li>
            Forming a full Jacobian matrix explicitly when only a Jacobian-vector product is needed
            — for a network with millions of parameters, the full Jacobian would be far too large to
            fit in memory; real autograd never materializes it.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          <strong>Reverse-mode automatic differentiation</strong> (what backpropagation actually is)
          computes gradients by propagating Jacobian-vector products backward through the
          computation graph, without ever forming any full Jacobian matrix — this is precisely why
          it's efficient enough to train networks with billions of parameters.
        </p>
        <p>
          At the master level: forward-mode automatic differentiation computes the same chain rule
          in the opposite order (Jacobian-vector products propagated forward) — it's more efficient
          when a function has few inputs and many outputs, the mirror image of the typical
          neural-network case (many inputs/parameters, one scalar loss output), which is exactly why
          reverse-mode dominates deep learning specifically.
        </p>
      </ExpertNote>
    </>
  );
}

export function EinsumTensorContractions() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> <strong>einsum</strong> ("Einstein summation") is a compact
          notation for describing sums, transposes, and multiplications across the axes of one or
          more tensors, all in a single short expression — instead of writing nested loops or
          memorizing which function name does which specific operation.
        </p>
        <p>
          <strong>Intermediate:</strong> the pattern is always the same: label each tensor's axes
          with letters, then say which output axes survive. Repeated letters across inputs get
          multiplied and summed over ("contracted"); letters that appear in the output are kept.
          Matrix multiplication is <code>'ij,jk-{">"}ik'</code>; a dot product is{" "}
          <code>'i,i-{">"}'</code>; a batch of matrix multiplications is{" "}
          <code>'bij,bjk-{">"}bik'</code>.
        </p>
        <p>
          <strong>Advanced:</strong> once you're comfortable with einsum, the core computation of
          attention — <code>scores = queries · keysᵀ</code>, batched across many heads and sequence
          positions at once — is a single readable line instead of a tangle of reshapes and
          transposes, which is exactly why real Transformer implementations lean on it heavily.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "C_{ik} = \\sum_j A_{ij}B_{jk} \\quad\\longleftrightarrow\\quad \\texttt{einsum('ij,jk->ik', A, B)}"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The einsum string is a direct, literal transcription of the summation formula — which is
          the entire point of the notation.
        </p>
      </SectionBlock>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          Walk through <code>einsum('ij,jk-{">"}ik', A, B)</code> by hand for{" "}
          <code>A = [[1, 2], [3, 4]]</code> and <code>B = [[5, 6], [7, 8]]</code>. Output entry
          (0,0): j is repeated (contracted), so sum over j of <code>A[0,j]·B[j,0]</code> ={" "}
          <code>(1)(5) + (2)(7) = 19</code>. Output entry (0,1): sum over j of{" "}
          <code>A[0,j]·B[j,1]</code> = <code>(1)(6) + (2)(8) = 22</code>. Repeating for every (i,k)
          pair reproduces exactly the ordinary matrix product <code>A @ B</code> — because that's
          precisely what this einsum string was written to mean.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — einsum for matmul, batches, and attention"
        code={`import numpy as np

A = np.random.rand(3, 4)
B = np.random.rand(4, 5)
C1 = A @ B
C2 = np.einsum('ij,jk->ik', A, B)
print(np.allclose(C1, C2))   # True

# Batched matmul, e.g. one small matrix multiply per item in a batch:
batch_A = np.random.rand(8, 3, 4)
batch_B = np.random.rand(8, 4, 5)
batch_C = np.einsum('bij,bjk->bik', batch_A, batch_B)
print(batch_C.shape)   # (8, 3, 5)

# Simplified scaled dot-product attention scores:
queries = np.random.rand(2, 6, 16)   # (batch, seq_len, dim)
keys    = np.random.rand(2, 6, 16)
scores  = np.einsum('bqd,bkd->bqk', queries, keys) / np.sqrt(16)
print(scores.shape)   # (2, 6, 6) -> one score per query/key pair, per batch item`}
      >
        <p>
          That last line is, almost verbatim, the first step of every attention layer in every
          Transformer — this is what "attention is just dot products" looks like in real code.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Convolutional layers</strong> can be implemented as a structured matrix
            multiplication using the "im2col" technique — unfolding overlapping image patches into
            rows of a matrix, then computing the whole convolution as a single matmul. This is
            exactly why hardware optimized for matmul (Tensor Cores, section 1.4) is also fast at
            convolution.
          </li>
          <li>
            Toeplitz matrices (constant along each diagonal) are the precise linear-algebra object
            behind 1D convolution — multiplying by a Toeplitz matrix <em>is</em> convolving with a
            fixed kernel.
          </li>
          <li>
            Modern ML compilers (XLA, TVM, Triton) can fuse and optimize einsum-style expressions
            automatically, often outperforming manually written loops or even hand-tuned library
            calls.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Getting an einsum string subtly wrong (e.g. mismatched or misplaced repeated letters) —
            it usually still runs, just produces a silently wrong shape or wrong numbers. Always
            check <code>.shape</code> of the result against what you expected.
          </li>
          <li>
            Forgetting that any letter missing from the output string is summed over — a common
            mistake is accidentally contracting over an axis you actually wanted to keep.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The name comes from Einstein's own notational shortcut in general relativity and tensor
          calculus: when the same index appears twice in a term, summation over it is implied
          without writing a Σ — modern ML libraries adopted the same convention because tensor
          contractions are exactly as central to deep learning as they are to physics.
        </p>
        <p>
          At the master level: einsum expressions have a well-defined but non-trivial optimal
          contraction
          <em>order</em> for more than two tensors — a naive left-to-right evaluation can be
          asymptotically far slower than an optimally ordered one, which is why libraries like{" "}
          <code>opt_einsum</code> exist specifically to search for the cheapest contraction path
          before executing anything.
        </p>
      </ExpertNote>
    </>
  );
}

export function RandomMatrixTheory() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> if you fill a matrix with random numbers and compute its
          eigenvalues, you might expect total chaos — but you don't get it. As the matrix grows
          large, its eigenvalues settle into a strikingly predictable statistical shape. Randomness
          at the level of individual entries produces <em>structure</em> at the level of the whole
          spectrum.
        </p>
        <p>
          <strong>Intermediate:</strong> for a large random symmetric matrix with independent,
          appropriately-scaled entries, the eigenvalues follow the{" "}
          <strong>Wigner semicircle law</strong> — literally a semicircular density curve, not a
          bell curve, not a uniform spread. This is one of the most famous results in random matrix
          theory, and it holds true across a very wide range of random distributions used to fill
          the matrix.
        </p>
        <p>
          <strong>Advanced:</strong> this isn't just a mathematical curiosity — it directly explains
          practical choices you'd otherwise have to accept on faith.{" "}
          <strong>Weight initialization</strong> schemes like Xavier/Glorot and He initialization
          scale a neural network layer's random initial weights by exactly <code>1/√n</code> (n =
          layer width) specifically to keep the spread of the resulting weight matrix's eigenvalues
          (and, closely related, singular values) controlled as networks get wider and deeper —
          preventing signals from exploding or vanishing purely due to the accumulated effect of
          many large random matrix multiplications in sequence.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {"\\rho(\\lambda) = \\frac{1}{2\\pi}\\sqrt{4-\\lambda^2}, \\quad |\\lambda| \\le 2"}
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The Wigner semicircle density, for an n×n symmetric matrix with iid entries scaled by{" "}
          <Formula display={false}>{"1/\\sqrt{n}"}</Formula>. It's exactly a semicircle of radius 2
          — no heavier tails, no extra bumps, regardless of the exact distribution the entries were
          drawn from (a "universality" result).
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="The semicircle law, computed live"
        caption="Every bar is a real eigenvalue of an actual random matrix generated in your browser (Jacobi algorithm) — not illustrative fake data."
      >
        <DiagramHost render={renderEigenSpectrum} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — why initialization scale matters"
        code={`import numpy as np

def forward_through_layers(x, n_layers, width, scale):
    for _ in range(n_layers):
        W = np.random.randn(width, width) * scale
        x = np.tanh(W @ x)
    return x

x0 = np.random.randn(256)

# Unscaled: signal magnitude explodes or vanishes across depth
out_bad = forward_through_layers(x0, n_layers=30, width=256, scale=1.0)
print("no scaling:", np.linalg.norm(out_bad))

# Xavier-style scaling: keeps signal magnitude roughly stable
out_good = forward_through_layers(x0, n_layers=30, width=256, scale=1/np.sqrt(256))
print("1/sqrt(n) scaling:", np.linalg.norm(out_good))`}
      >
        <p>
          Run this yourself — the unscaled version's output norm behaves erratically across depth,
          while the <code>1/√n</code>-scaled version stays controlled. This is random matrix theory
          showing up directly in whether a network is even trainable.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Xavier/Glorot initialization</strong> (for tanh/sigmoid networks) and{" "}
            <strong>He initialization</strong> (derived for ReLU networks) are both direct,
            practical applications of controlling a random weight matrix's spectral properties at
            initialization.
          </li>
          <li>
            <strong>Batch normalization</strong> and <strong>residual connections</strong> are later
            architectural tools that address the same underlying signal-propagation problem
            throughout training, not just at initialization.
          </li>
          <li>
            <strong>High-dimensional geometry</strong> — in very high dimensions, two random vectors
            are "almost always" nearly orthogonal purely by chance (their expected cosine similarity
            shrinks toward zero as dimension grows), a fact directly relevant to why
            high-dimensional embedding spaces behave so differently from the 2D/3D intuition built
            in earlier lessons.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Using Xavier initialization (derived assuming symmetric activations like tanh) on a ReLU
            network, or vice versa — the "wrong" scaling constant for your activation function can
            cause silent, hard-to-diagnose training instability, particularly in deep networks.
          </li>
          <li>
            Assuming random matrix theory results only matter for exotic theoretical work — they
            directly justify default settings you rely on in every deep learning framework's layer
            initializers.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          The semicircle law is a special case of a broader family: for large <em>non</em>-symmetric
          random matrices, the eigenvalues instead fill a disk in the complex plane (the "circular
          law"); for the singular values of random rectangular matrices, the analogous result is the{" "}
          <strong>Marchenko-Pastur distribution</strong> — directly relevant to understanding the
          behavior of SVD (section 1.9) on high-dimensional, mostly-noise data matrices.
        </p>
        <p>
          At the master level: recent theoretical work on deep learning loss landscapes leans
          directly on random matrix theory to argue that in very high-dimensional non-convex
          problems, saddle points (section 1.15) vastly outnumber genuine local minima among a
          network's critical points — this random-matrix argument is a major reason the field's
          understanding shifted away from "fear of bad local minima" toward "escaping saddle points"
          as the primary obstacle in deep learning optimization.
        </p>
      </ExpertNote>
      <Takeaway>
        <p>
          Randomness at scale is never truly random-looking — from initialization schemes to the
          shape of loss landscapes, the statistical structure of large random matrices quietly
          governs whether deep learning works at all.
        </p>
      </Takeaway>
    </>
  );
}
