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
  renderVector,
  renderVectorAddition,
  renderMatrixGrid,
  renderMatrixMultiply,
  renderTranspose,
  renderEigenField,
  renderNormsRace,
  renderSpanComparison,
  renderSvdMorph,
} from "./diagrams-1-10";

export function Introduction() {
  return (
    <>
      <SectionBlock id="welcome" label="Welcome">
        <p>
          This chapter builds the linear algebra behind machine learning from the ground up —
          starting with a single arrow on a page and ending, 34 lessons later, with the tools behind
          PageRank, kernel SVMs, conjugate gradient solvers, and normalizing-flow generative models.
          Every idea is built on the ones before it: nothing here is presented as a rule to memorize
          without first showing why it has to be true.
        </p>
        <p>
          It's written for three overlapping audiences at once — a beginner meeting vectors and
          matrices for the first time, an intermediate reader who's used these tools but wants the
          "why" behind them, and an advanced reader who wants the actual theorems, proofs, and
          numerical caveats that production ML code quietly depends on. Every lesson is written in
          all three registers, so you can read at whichever level matches a given topic for you and
          go deeper exactly where you need to.
        </p>
      </SectionBlock>
      <SectionBlock id="how-to-read" label="How every lesson is structured" tone="muted">
        <p>
          Each of the 34 lessons that follow uses the same consistent shape, so you always know
          where to look for what you need:
        </p>
        <ul>
          <li>
            <strong>In plain English</strong> — the idea explained three times, at increasing depth
            (beginner → intermediate → advanced), with no formulas required to follow along.
          </li>
          <li>
            <strong>Formula</strong> — the precise mathematical statement, in standard notation.
          </li>
          <li>
            <strong>Derivation</strong> — a full proof or worked derivation of the formula, plus a
            "where this is used" note connecting it to a real ML system.
          </li>
          <li>
            <strong>Diagram</strong> — most lessons include a live, draggable diagram you can
            manipulate directly, rather than a static picture.
          </li>
          <li>
            <strong>Practical example</strong> — runnable NumPy/PyTorch/scikit-learn code showing
            the idea used the way you'd actually use it.
          </li>
          <li>
            <strong>Real-world examples, common mistakes, and going deeper</strong> — where the idea
            shows up in production systems, what trips people up in practice, and an optional deeper
            dive for readers who want more.
          </li>
        </ul>
      </SectionBlock>
      <SectionBlock id="notation" label="Notation used throughout this chapter" tone="formula">
        <p>A small, consistent set of conventions is used in every lesson:</p>
        <ul>
          <li>
            Lowercase letters (<code>x</code>, <code>v</code>) are <strong>vectors</strong>;
            uppercase letters (<code>A</code>, <code>B</code>) are <strong>matrices</strong>; plain
            lowercase italics (<code>a</code>, <code>λ</code>) are <strong>scalars</strong>.
          </li>
          <li>
            <Formula display={false}>{"A^T"}</Formula> is the <strong>transpose</strong> (section
            1.6), <Formula display={false}>{"A^{-1}"}</Formula> is the <strong>inverse</strong>{" "}
            (also section 1.6), and <code>Aᵢⱼ</code> means the entry in row i, column j.
          </li>
          <li>
            <Formula display={false}>{"\\|v\\|"}</Formula> is a <strong>norm</strong> (section 1.8,
            length/size of a vector or matrix), and <code>v·w</code> is the{" "}
            <strong>dot product</strong> (section 1.3).
          </li>
          <li>
            <Formula display={false}>{"\\nabla f"}</Formula> is the <strong>gradient</strong> of a
            scalar function (section 1.17), and <Formula display={false}>{"\\Sigma"}</Formula>{" "}
            outside a matrix name means summation; as a matrix name (as in <code>Σ = VΛVᵀ</code>) it
            means something specific to that lesson and is always defined on the spot.
          </li>
        </ul>
      </SectionBlock>
      <SectionBlock id="prerequisites" label="Prerequisites" tone="good">
        <p>
          Comfort with basic algebra (solving for x, working with exponents) and functions is all
          that's assumed going in. A little single-variable calculus (what a derivative means) helps
          for the "Advanced" paragraphs and the "Going deeper" boxes in the later lessons, but is
          never required to follow a lesson's main thread — every calculus-dependent idea is
          explained again from scratch the first time it's needed.
        </p>
      </SectionBlock>
      <Takeaway>
        <p>
          Start with section 1.2, <em>What is a Vector?</em>, and move through the chapter in order
          — each lesson builds directly on the ones before it, all the way to the final lesson on
          normalizing flows, which uses ideas from nearly every earlier section at once.
        </p>
      </Takeaway>
    </>
  );
}

export function WhatIsAVector() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a <strong>vector</strong> is just an ordered list of numbers.
          That's it. The "ordered" part matters — <code>[3, 5]</code> is not the same as{" "}
          <code>[5, 3]</code>, because each position stands for something specific (like "age" in
          position 1 and "income" in position 2). You can also picture a vector as an arrow starting
          at the origin and pointing somewhere in space — the numbers are the instructions for how
          far to walk along each axis.
        </p>
        <p>
          <strong>Intermediate:</strong> there are two equally valid ways to think about a vector,
          and switching between them is a skill you'll use constantly: as a <strong>point</strong>{" "}
          (a location in space, useful when thinking about data) and as an <strong>arrow</strong> (a
          displacement with a direction and a magnitude, useful when thinking about motion, force,
          or change). A GPS coordinate is a point. "3km northeast" is an arrow. Both are described
          by the same two numbers.
        </p>
        <p>
          <strong>Advanced:</strong> the number of entries in the list is called its{" "}
          <strong>dimensionality</strong>. A 2D vector lives on a page; a 3D vector lives in
          physical space; but nothing stops a vector from having 768 dimensions (a typical sentence
          embedding) or 4096 dimensions (a typical image embedding from a vision model) — you just
          can't draw it anymore, only compute with it. The math doesn't care how many dimensions
          there are; only your intuition needs the 2D/3D training wheels. Formally, the set of all
          n-dimensional real vectors forms a <strong>vector space</strong>, ℝⁿ — a structure closed
          under addition and scalar multiplication, which is the entire subject of section 1.9.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <div className="mb-1.5 font-medium text-foreground">A vector in n-dimensional space:</div>
        <Formula>{"\\vec{v} = [v_1, v_2, \\dots, v_n] \\in \\mathbb{R}^n"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Read as: "v is a list of n numbers, living in n-dimensional real-number space." Some texts
          write vectors as columns instead of rows —{" "}
          <Formula display={false}>{"\\begin{bmatrix} v_1 \\\\ v_2 \\end{bmatrix}"}</Formula> — it's
          the exact same object, just laid out vertically; ML code (NumPy, PyTorch) treats both
          shapes as meaningfully different for matrix multiplication, so watch for it later.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Theorem: every vector is a unique combination of basis vectors"
      >
        <p>
          Define the standard basis vectors <code>e₁ = [1,0,…,0]</code>, <code>e₂ = [0,1,…,0]</code>
          , …, <code>eₙ = [0,0,…,1]</code> — each a 1 in one position, zeros elsewhere.
        </p>
        <p>
          <strong>Claim:</strong> any vector <code>v = [v₁, v₂, …, vₙ]</code> can be written as{" "}
          <code>v = v₁e₁ + v₂e₂ + ⋯ + vₙeₙ</code>, and this representation is unique.
        </p>
        <p>
          <strong>Existence:</strong> compute the right-hand side component by component. The i-th
          component of <code>v₁e₁ + ⋯ + vₙeₙ</code> is <code>vᵢ · 1 = vᵢ</code> (every other term
          contributes 0 in that position, since eⱼ is zero everywhere except position j). This
          matches <code>v</code> exactly in every position, so the sum equals v.
        </p>
        <p>
          <strong>Uniqueness:</strong> suppose also <code>v = c₁e₁ + ⋯ + cₙeₙ</code> for some other
          coefficients. Looking at component i of both sides gives <code>vᵢ = cᵢ</code> for every i
          — so the coefficients must be exactly v's own components. No other combination works.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is the formal justification for treating "the
          vector" and "its list of coordinates" as interchangeable — every basis (not just the
          standard one) gives a similarly unique representation, which is exactly the property
          section 1.14 (Gram-Schmidt) and PCA (section 1.10) both rely on when changing to a more
          useful basis.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Watch a vector get drawn"
        caption="The vector [4, 3]: 4 steps right, 3 steps up from the origin. Drag the dot yourself once it settles."
      >
        <DiagramHost render={renderVector} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — vectors in NumPy"
        code={`import numpy as np

# A vector IS a 1-D NumPy array
house = np.array([1500, 3, 10])   # [sq ft, bedrooms, age]
velocity = np.array([60, 0])       # 60 km/h North

print(house.shape)   # (3,)  <- dimensionality
print(house[1])       # 3   <- number of bedrooms
print(house * 2)      # scale every entry: [3000, 6, 20]`}
      >
        <p>
          Every ML framework (NumPy, PyTorch, TensorFlow) represents a vector as a 1-D array.
          Indexing, slicing, and elementwise math all "just work" the way you'd hope — this is
          precisely why learning the math pays off immediately in code.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Tabular data</strong> — a house-price dataset describes each house as a vector:{" "}
            <code>[1500, 3, 10]</code> could mean <em>1500 sq ft, 3 bedrooms, 10 years old</em>.
            Every row of a spreadsheet is a vector.
          </li>
          <li>
            <strong>Recommendation systems</strong> — a movie can be described as{" "}
            <code>[0.9, 0.1, 0.0]</code> for how much Action/Comedy/Romance it contains; a user's
            taste can be described the same way, so "similar taste" becomes "nearby vectors."
          </li>
          <li>
            <strong>Physics &amp; robotics</strong> — velocity ("60 km/h North") is a vector because
            it has size <em>and</em> direction, unlike speed alone. A robot arm's joint angles at
            any instant are a vector describing its full pose.
          </li>
          <li>
            <strong>NLP embeddings</strong> — the word "king" might become a 300-dimensional vector
            such that <code>king − man + woman ≈ queen</code>, purely from vector arithmetic. This
            is the basis of every modern language model's input layer.
          </li>
          <li>
            <strong>Computer vision</strong> — a flattened 28×28 grayscale image is just a
            784-dimensional vector before any neural network ever touches it.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Confusing a vector's <em>length</em> (number of entries) with its <em>norm</em>{" "}
            (geometric size, see 1.8) — "length" in ML almost always means dimensionality, not
            magnitude.
          </li>
          <li>
            Assuming a 1-D NumPy array is automatically a row or column vector — it's neither, and
            this causes silent shape-mismatch bugs the moment you multiply it against a matrix.
            Reshape explicitly with <code>.reshape(-1, 1)</code> when it matters.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          In deep learning, vectors are usually called <strong>embeddings</strong> — dense lists of
          numbers (often 100–4000 dimensions) learned so that similar things end up as nearby
          vectors. A vector generalizes to a <strong>matrix</strong> (2D grid) and then a{" "}
          <strong>tensor</strong> (n-D grid) — the core data structure in PyTorch/TensorFlow.
        </p>
        <p>
          One subtlety worth internalizing early: a vector by itself has no fixed "orientation" in
          memory — whether you treat it as a row or a column is a choice you make based on what
          operation comes next. Frameworks like NumPy default to 1-D arrays that are neither, and
          will silently broadcast in ways that surprise beginners. When in doubt, print{" "}
          <code>.shape</code> before trusting the math.
        </p>
        <p>
          At the master level: the choice of <em>basis</em> (section 1.9) used to represent a vector
          as coordinates is arbitrary — the vector itself is a basis-independent geometric object.
          Changing basis (a "change-of-basis matrix") re-expresses the exact same vector with
          different numbers, which is precisely what happens internally during PCA and whitening
          transformations.
        </p>
      </ExpertNote>
      <Takeaway>
        <p>
          A vector = an ordered list of numbers = a point or arrow in space. Every row of your
          dataset is a vector.
        </p>
      </Takeaway>
    </>
  );
}

export function VectorOperations() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> there are three operations you'll see constantly.{" "}
          <strong>Addition</strong> combines two vectors by adding matching positions (like merging
          two shopping lists item-by-item). <strong>Scalar multiplication</strong> stretches or
          shrinks a vector without changing its direction (multiply by a negative number and it
          flips to point the opposite way). The <strong>dot product</strong> is the most important
          for ML — multiply matching positions and add the results, giving one number that tells you
          how "aligned" two vectors are.
        </p>
        <p>
          <strong>Intermediate:</strong> it helps to have a physical picture for each: addition is
          "walk along a, then keep walking along b" — where you end up is a+b. Scalar multiplication
          is "take the same walk, just longer or shorter, or backwards." The dot product is
          different in kind — it doesn't produce a new vector at all, it collapses two vectors down
          into a single number that measures similarity, which is exactly why it's the workhorse of
          machine learning: models are, at their core, endless dot products.
        </p>
        <p>
          <strong>Advanced:</strong> the dot product secretly encodes both magnitude and angle at
          once — <code>a·b = |a||b|cos(θ)</code> — which means you can recover the angle between any
          two vectors purely from their coordinates, with no trigonometry drawn on paper required.
          This is the mathematical foundation of every "similarity score" in machine learning, from
          search engines to face recognition.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <div className="mb-1.5 font-medium text-foreground">
          Addition &amp; scalar multiplication:
        </div>
        <Formula>
          {"\\vec{a} + \\vec{b} = [a_1{+}b_1,\\ a_2{+}b_2] \\qquad c\\vec{v} = [cv_1, cv_2]"}
        </Formula>
        <div className="mb-1.5 mt-3.5 font-medium text-foreground">Dot product:</div>
        <Formula>
          {"\\vec{a} \\cdot \\vec{b} = \\sum_i a_i b_i = |\\vec{a}||\\vec{b}|\\cos(\\theta)"}
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Largest when vectors point the same way (θ=0°), zero when perpendicular (θ=90°), negative
          when opposite. Dividing the dot product by both lengths gives{" "}
          <strong>cosine similarity</strong>, the single most common similarity metric in ML — it
          ranges from −1 to 1 regardless of how long the vectors are, which is why it's preferred
          over the raw dot product for comparing embeddings of very different magnitudes.
        </p>
      </SectionBlock>
      <Derivation id="derivation" title="Derivation: a·b = |a||b|cos(θ)">
        <p>
          Start from the <strong>Law of Cosines</strong> applied to the triangle formed by a, b, and
          the vector a−b, with θ the angle between a and b:
        </p>
        <Formula>
          {
            "\\|\\vec{a}-\\vec{b}\\|^2 = \\|\\vec{a}\\|^2 + \\|\\vec{b}\\|^2 - 2\\|\\vec{a}\\|\\|\\vec{b}\\|\\cos\\theta"
          }
        </Formula>
        <p>
          Now expand the same left-hand side purely algebraically, using the dot product's own
          definition:
        </p>
        <Formula>
          {
            "\\|\\vec{a}-\\vec{b}\\|^2 = (\\vec{a}-\\vec{b})\\cdot(\\vec{a}-\\vec{b}) = \\|\\vec{a}\\|^2 - 2\\,\\vec{a}\\cdot\\vec{b} + \\|\\vec{b}\\|^2"
          }
        </Formula>
        <p>Both expressions equal the same quantity, so their right-hand sides are equal:</p>
        <Formula>
          {
            "\\|\\vec{a}\\|^2 + \\|\\vec{b}\\|^2 - 2\\|\\vec{a}\\|\\|\\vec{b}\\|\\cos\\theta = \\|\\vec{a}\\|^2 - 2\\,\\vec{a}\\cdot\\vec{b} + \\|\\vec{b}\\|^2"
          }
        </Formula>
        <p>
          The <code>‖a‖²</code> and <code>‖b‖²</code> terms cancel from both sides, leaving{" "}
          <code>−2‖a‖‖b‖cosθ = −2 a·b</code>, and dividing by −2 gives exactly{" "}
          <code>a·b = ‖a‖‖b‖cosθ</code>.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this identity is the entire justification for cosine
          similarity (used above) and for every "attention score" computation in Transformers
          (section 1.3's expert note) — it's what lets a pure dot product stand in for "how aligned
          are these two directions" without ever computing an angle directly.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Watch vector addition, tip to tail"
        caption="a (blue) is drawn first, then b (orange) starts where a ends. The result a+b (green) is the straight line back to the new tip. Drag either dot afterward."
      >
        <DiagramHost render={renderVectorAddition} />
      </DiagramBlock>
      <SectionBlock id="worked" label="Worked examples" tone="muted">
        <p>
          Let <code>a = [2, 3]</code> and <code>b = [4, 1]</code>.
        </p>
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Calculation</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>a + b</td>
              <td>[2+4, 3+1]</td>
              <td>[6, 4]</td>
            </tr>
            <tr>
              <td>a − b</td>
              <td>[2−4, 3−1]</td>
              <td>[−2, 2]</td>
            </tr>
            <tr>
              <td>3a</td>
              <td>[3×2, 3×3]</td>
              <td>[6, 9]</td>
            </tr>
            <tr>
              <td>a · b</td>
              <td>(2×4)+(3×1)</td>
              <td>8+3 = 11</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2">
          Now try <code>c = [1, -2]</code>: <code>a · c = (2×1)+(3×-2) = 2−6 = −4</code>. A negative
          dot product tells you immediately, without drawing anything, that a and c point in broadly
          opposite general directions (the angle between them is greater than 90°).
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — cosine similarity in NumPy"
        code={`import numpy as np

a = np.array([2, 3])
b = np.array([4, 1])

dot = np.dot(a, b)                       # 11
cosine_sim = dot / (np.linalg.norm(a) * np.linalg.norm(b))
print(round(cosine_sim, 3))               # 0.789 -> fairly similar direction

# This exact pattern is how search engines rank documents
# against a query embedding, and how recommenders compare users.`}
      >
        <p>
          Cosine similarity is one line of NumPy, and it's what powers semantic search,
          recommendation engines, and duplicate-detection systems in production.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Recommendation systems</strong> use the dot product (as cosine similarity) to
            measure how similar two users' taste vectors are, or how well a user vector matches a
            product vector.
          </li>
          <li>
            <strong>Neural networks</strong> — every neuron computes a dot product between its input
            and weight vector before applying an activation function; this single operation,
            repeated billions of times, is most of what a forward pass "is."
          </li>
          <li>
            <strong>Search engines</strong> — semantic search embeds your query and every document
            into the same vector space, then ranks documents by dot product / cosine similarity to
            the query.
          </li>
          <li>
            <strong>Physics</strong> — work done by a force is the dot product of the force vector
            and the displacement vector: <code>W = F · d</code>, which is exactly why pushing
            sideways on a wall (perpendicular to any real displacement) does zero work.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Using raw dot product as "similarity" without normalizing — a long vector pointing in a
            slightly wrong direction can out-score a short vector pointing exactly right. Cosine
            similarity fixes this by dividing out the magnitudes.
          </li>
          <li>
            Forgetting that <code>a·b = 0</code> means <em>perpendicular</em>, not "unrelated" or
            "small" — orthogonality is an exact geometric statement, not a vague one.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Two vectors are <strong>orthogonal</strong> when their dot product is exactly 0. This
          underlies the <strong>attention mechanism</strong> in Transformers: attention scores are
          the dot product between "query" and "key" vectors — a high score means "pay attention to
          this token."
        </p>
        <p>
          In practice, attention scores are usually scaled by <code>1/√d</code> (where d is the
          dimensionality) before the softmax — this is "scaled dot-product attention," and the
          scaling exists purely to stop dot products from exploding in high dimensions, which would
          otherwise push the softmax into regions with vanishing gradients.
        </p>
        <p>
          At the master level: a set of mutually orthogonal <em>unit</em> vectors is called{" "}
          <strong>orthonormal</strong> — the columns of every rotation matrix and every U/V matrix
          in an SVD (section 1.10) are orthonormal by construction, which is exactly what guarantees
          those matrices preserve lengths and angles (they never distort space, only reorient it).
        </p>
      </ExpertNote>
      <Quiz
        q="If a · b = 0, what does that tell you about the two vectors?"
        a="They're orthogonal (perpendicular) — no directional overlap."
      />
    </>
  );
}

export function WhatIsAMatrix() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a <strong>matrix</strong> is a rectangular grid of numbers,
          arranged in rows and columns — think spreadsheet. But it's also a <em>transformation</em>:
          a rule that takes any vector in and produces a new vector out (rotated, stretched,
          squashed, or flipped). Multiplying a vector by a matrix means "apply this transformation."
        </p>
        <p>
          <strong>Intermediate:</strong> these two views — "a matrix is a table of data" and "a
          matrix is a function that moves vectors around" — feel unrelated at first, but they're the
          same object seen from two angles. When a matrix stores a dataset, its rows are individual
          data points. When that same matrix multiplies a vector, its <em>columns</em> tell you
          where each input axis ends up after the transformation.
        </p>
        <p>
          <strong>Advanced:</strong> this is exactly why neural network weight matrices are matrices
          — they're literally the transformation each layer applies to its input. Stack several such
          transformations (with a non-linear function between each) and you get a deep network: a
          chain of linear-algebra operations punctuated by small non-linear "kinks" that let the
          whole chain approximate functions no single matrix could represent alone.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <div className="mb-1.5 font-medium text-foreground">
          A matrix with m rows and n columns:
        </div>
        <Formula>
          {
            "A \\in \\mathbb{R}^{m\\times n} = \\begin{bmatrix} a_{11} & a_{12} & \\dots \\\\ a_{21} & a_{22} & \\dots \\\\ \\vdots & \\vdots & \\ddots \\end{bmatrix}"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The subscript <code>a_ij</code> means "the entry in row i, column j" — always row first,
          then column. A matrix with the same number of rows and columns is <strong>square</strong>;
          otherwise it's <strong>rectangular</strong>. Both are common in ML: square matrices show
          up in transformations and covariance; rectangular matrices show up almost everywhere else
          (a dataset is rarely square).
        </p>
      </SectionBlock>
      <Derivation id="derivation" title="Theorem: matrix-vector multiplication is linear">
        <p>
          <strong>Claim:</strong> for any matrix A and vectors x, y and scalar c,{" "}
          <code>A(x+y) = Ax + Ay</code> and <code>A(cx) = c(Ax)</code> — the two properties that
          define a <em>linear</em> map, which is exactly why "matrix" and "linear transformation"
          are treated as the same idea throughout this chapter.
        </p>
        <p>
          <strong>Proof:</strong> row i of <code>A(x+y)</code> is the dot product of A's i-th row
          with <code>x+y</code>:
        </p>
        <Formula>{"\\sum_j a_{ij}(x_j+y_j) = \\sum_j a_{ij}x_j + \\sum_j a_{ij}y_j"}</Formula>
        <p>
          — using ordinary distributivity of multiplication over addition, term by term. The first
          sum is exactly row i of <code>Ax</code>, and the second is row i of <code>Ay</code>. Since
          this holds for every row i, <code>A(x+y) = Ax + Ay</code>. The scalar case is even
          shorter: row i of <code>A(cx)</code> is <code>Σⱼ aᵢⱼ(cxⱼ) = c Σⱼ aᵢⱼxⱼ</code>, which is
          exactly c times row i of <code>Ax</code>.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> linearity is precisely what makes a neural network
          layer (section 1.5) predictable and differentiable in closed form — every "linear layer"
          in every framework is called that specifically because it satisfies this theorem.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="A matrix is rows AND columns at once"
        caption="Click any cell to see its row (a student's full record) and column (everyone's score in one subject) highlighted together."
      >
        <DiagramHost render={renderMatrixGrid} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — matrices in NumPy"
        code={`import numpy as np

scores = np.array([
    [72, 3, 1],
    [65, 2, 0],
    [88, 4, 1],
])

print(scores.shape)      # (3, 3) -> 3 students, 3 subjects
print(scores[1, :])       # row 1: student 2's full record -> [65, 2, 0]
print(scores[:, 0])       # column 0: everyone's first score -> [72, 65, 88]
print(scores.T.shape)     # transpose flips rows/columns -> still (3, 3) here`}
      >
        <p>
          <code>arr[row, :]</code> pulls a full row, <code>arr[:, col]</code> pulls a full column —
          the exact row/column duality shown in the diagram above.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            A spreadsheet of 5 students' scores across 3 subjects is a 5×3 matrix — each{" "}
            <strong>row</strong> is a student (a vector!), each <strong>column</strong> a subject.
          </li>
          <li>
            A grayscale photo is literally a matrix — each cell is a pixel's brightness (0=black,
            255=white). A 1080p photo is a 1080×1920 matrix of numbers, nothing more exotic than
            that.
          </li>
          <li>
            A user-movie ratings table (Netflix, Spotify) is a matrix where rows are users, columns
            are items, and most cells are empty — this is exactly the matrix that recommender
            systems try to "fill in."
          </li>
          <li>
            An adjacency matrix represents a graph or social network: entry (i, j) is 1 if node i
            connects to node j, and 0 otherwise — this is how graph neural networks represent
            structure numerically.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Mixing up row-major vs. column-major mental models when reading <code>a_ij</code>{" "}
            notation — it is always row, then column, in every standard ML text and library.
          </li>
          <li>
            Assuming "matrix" always means "square" — most real datasets are rectangular, and many
            matrix operations (like the inverse) simply don't apply to non-square matrices at all.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          A color image adds a channel dimension (R/G/B), making it a <strong>tensor</strong> of
          shape (height × width × 3). A batch of images in a CNN is a 4D tensor: (batch × height ×
          width × channels).
        </p>
        <p>
          Framework conventions differ here and cause real bugs: PyTorch defaults to{" "}
          <code>(batch, channels, height, width)</code> ("channels-first"), while TensorFlow/Keras
          and most image files default to <code>(batch, height, width, channels)</code>{" "}
          ("channels-last"). Mixing them up silently produces garbage results rather than an error,
          since both are just 4D tensors of numbers — always check a library's expected shape
          convention before feeding it data.
        </p>
        <p>
          At the master level: any matrix can be viewed as a <em>linear map</em> between two vector
          spaces, ℝⁿ → ℝᵐ. This abstraction is what lets the exact same theory (rank, span,
          eigenvalues, SVD) apply identically whether the matrix represents a dataset, a neural
          network layer, a rotation in 3D graphics, or a quantum operator — it's the same
          mathematical object underneath every one of those applications.
        </p>
      </ExpertNote>
    </>
  );
}

export function MatrixOperations() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> <strong>matrix addition</strong> is straightforward — add
          matching cells, and it only works when both matrices are exactly the same shape.{" "}
          <strong>Matrix multiplication</strong> is the one to understand deeply: to get one output
          number, take a full row of the first matrix, a full column of the second, and compute
          their dot product.
        </p>
        <p>
          <strong>Intermediate:</strong> the shape rule is worth memorizing precisely, because it's
          the single most common source of bugs when building neural networks by hand: multiplying
          an (m×n) matrix by an (n×p) matrix requires the <em>inner</em> dimensions to match (both
          n), and the result is an (m×p) matrix — the outer dimensions "survive." If the inner
          dimensions don't match, the multiplication is simply undefined, not approximately correct.
        </p>
        <p>
          <strong>Advanced:</strong> matrix multiplication composes transformations. If matrix B
          rotates space and matrix A then stretches it, the single matrix <code>AB</code> does both
          at once, in that order, to any vector you feed it. This is exactly how a multi-layer
          neural network's effective transformation could in principle be written as one giant
          matrix — if there were no non-linear activation functions breaking up the chain (which is
          precisely why those non-linearities are essential: without them, an arbitrarily deep
          network would collapse to a single linear transformation).
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <div className="mb-1.5 font-medium text-foreground">
          Matrix multiplication (A is m×n, B is n×p):
        </div>
        <Formula>{"(AB)_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          In plain words: entry (i, j) of the result is "row i of A, dotted with column j of B." Do
          this for every combination of row and column and you have the full product.
        </p>
      </SectionBlock>
      <Derivation
        id="derivation"
        title="Theorem: matrix multiplication is associative — (AB)C = A(BC)"
      >
        <p>
          Write both sides in index notation and expand using the definition above. Entry (i, l) of{" "}
          <code>(AB)C</code>:
        </p>
        <Formula>
          {
            "[(AB)C]_{il} = \\sum_k (AB)_{ik}C_{kl} = \\sum_k \\left(\\sum_j A_{ij}B_{jk}\\right) C_{kl}"
          }
        </Formula>
        <p>
          Multiply through and swap the (finite) order of summation — always valid for finite sums:
        </p>
        <Formula>
          {
            "= \\sum_j \\sum_k A_{ij}B_{jk}C_{kl} = \\sum_j A_{ij} \\left(\\sum_k B_{jk}C_{kl}\\right) = \\sum_j A_{ij}(BC)_{jl} = [A(BC)]_{il}"
          }
        </Formula>
        <p>
          Since this holds for every entry (i, l), the two matrices are identical: (AB)C = A(BC).
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> associativity is why a deep network's layers can be
          grouped and composed in any order without changing the result, and why libraries can
          freely choose the cheapest evaluation order for a long chain of matrix products (exactly
          the contraction-ordering question raised in section 1.18's expert note).
        </p>
      </Derivation>
      <SectionBlock id="worked" label="Worked examples" tone="muted">
        <p>Edit the numbers below and watch the result recompute instantly:</p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Interactive matrix × vector"
        caption="Edit A or v directly — the highlighted-row/column intuition from 1.4 is exactly what's happening under the hood."
      >
        <DiagramHost render={renderMatrixMultiply} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — a neural network layer, by hand"
        code={`import numpy as np

W = np.array([[0.2, -0.5], [0.8, 0.1]])   # weights, shape (2, 2)
x = np.array([1.0, 2.0])                    # input, shape (2,)
b = np.array([0.1, -0.2])                   # bias, shape (2,)

z = W @ x + b            # matrix multiply then add bias -> shape (2,)
output = np.maximum(0, z)  # ReLU activation
print(output)`}
      >
        <p>
          This four-line snippet <em>is</em> a full forward pass through one neural network layer —{" "}
          <code>W @ x + b</code> is matrix multiplication plus a bias vector, exactly as described
          above, and <code>np.maximum(0, z)</code> is the ReLU non-linearity that keeps stacked
          layers from collapsing into a single linear transformation.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            Every neural network layer computes <code>output = W·x + b</code> — stack enough of
            these (with a non-linearity between) and you get a deep network.
          </li>
          <li>
            GPUs matter specifically because of this operation — they're built with thousands of
            cores designed to run matrix multiplications in parallel, which is why "more GPU" almost
            always means "train bigger models faster."
          </li>
          <li>
            3D graphics and game engines multiply every vertex of a 3D model by a 4×4 transformation
            matrix (combining rotation, scaling, and translation) on every single frame.
          </li>
          <li>
            Markov chains use matrix multiplication to advance probability distributions one step in
            time — multiplying a state vector by a transition matrix repeatedly is literally how
            PageRank (early Google search ranking) was computed.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Trying to multiply two matrices whose inner dimensions don't match — always sanity-check
            shapes first: (m×n)·(n×p) → (m×p).
          </li>
          <li>
            Assuming <code>AB = BA</code> — matrix multiplication is not commutative in general;
            order matters and changes the result (or breaks the shapes entirely).
          </li>
          <li>
            Confusing elementwise multiplication (<code>A * B</code> in NumPy) with true matrix
            multiplication (<code>A @ B</code>) — they require different shapes and mean entirely
            different things.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Matrix multiplication is <strong>not commutative</strong> — generally AB ≠ BA. Frameworks
          use <strong>batched matrix multiplication</strong> (<code>torch.bmm</code>) to apply the
          same operation across many samples at once.
        </p>
        <p>
          Naive matrix multiplication is <code>O(n³)</code> for two n×n matrices, but this is a
          genuinely open area of research — Strassen's algorithm (1969) does better than the naive
          approach, and in 2022 DeepMind's AlphaTensor discovered even faster multiplication
          algorithms for specific matrix sizes using reinforcement learning, which is a nice example
          of ML being used to improve the very linear algebra that powers ML.
        </p>
        <p>
          At the master/production level: modern NVIDIA GPUs (Volta architecture onward) include{" "}
          <strong>Tensor Cores</strong> — hardware units that do nothing but general matrix multiply
          (GEMM), computing an entire small matrix-multiply-accumulate per clock cycle instead of
          one scalar per core. Mixed-precision training (FP16 or BF16 inputs accumulated in FP32)
          exists specifically to feed these units efficiently — this hardware detail, one level
          below any framework code, is a large part of why modern deep learning training is fast
          enough to be practical at all.
        </p>
      </ExpertNote>
    </>
  );
}

export function TransposeIdentityInverse() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> the <strong>transpose</strong> flips a matrix over its diagonal
          — rows become columns. The <strong>identity matrix</strong> is the matrix version of the
          number 1: multiplying anything by it changes nothing. The <strong>inverse</strong> undoes
          whatever the original matrix did, the way multiplying by ⅕ undoes multiplying by 5.
        </p>
        <p>
          <strong>Intermediate:</strong> these three ideas travel together constantly in practice.
          You'll see <code>Aᵀ</code> used to reshape data for a multiplication to be valid (fixing a
          shape mismatch), <code>I</code> used as a "do nothing" placeholder or as a starting point
          for building other matrices (like a rotation matrix at angle 0), and <code>A⁻¹</code> used
          whenever you need to "solve for x" rather than just "compute the output" — the difference
          between prediction and inference.
        </p>
        <p>
          <strong>Advanced:</strong> not every matrix has an inverse — only square matrices can, and
          even among those, only ones whose rows/columns are all independent (section 1.9). When an
          inverse doesn't exist, you can't uniquely "undo" the transformation because information
          was destroyed along the way (multiple different inputs got mapped to the same output).
          This is precisely the geometric meaning of a matrix being "singular."
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"AA^{-1} = A^{-1}A = I"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Only square matrices can have an inverse — and even then, not all of them do (a "singular"
          matrix has none, typically because its rows or columns are redundant — see section 1.9 on
          rank). A matrix's transpose always exists, for any shape: transposing an m×n matrix gives
          an n×m matrix.
        </p>
      </SectionBlock>
      <Derivation id="derivation" title="Theorem: (AB)⁻¹ = B⁻¹A⁻¹ (the 'socks and shoes' rule)">
        <p>
          <strong>Claim:</strong> if A and B are both invertible, then AB is invertible and its
          inverse is B⁻¹A⁻¹ — note the order flips, exactly like undoing "put on socks, then shoes"
          by first removing shoes, then socks.
        </p>
        <p>
          <strong>Proof:</strong> to show B⁻¹A⁻¹ really is the inverse of AB, it's enough to check
          it satisfies the defining property directly — multiply them together and confirm the
          result is the identity:
        </p>
        <Formula>{"(AB)(B^{-1}A^{-1}) = A(BB^{-1})A^{-1} = A I A^{-1} = AA^{-1} = I"}</Formula>
        <p>
          using associativity (proved in section 1.5) to regroup the middle product first. The same
          check in the other order, <code>(B⁻¹A⁻¹)(AB) = B⁻¹(A⁻¹A)B = B⁻¹IB = B⁻¹B = I</code>,
          confirms it from both sides, which is exactly what "is the inverse" requires.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this rule is why, when undoing a sequence of
          transformations (a rotation followed by a scale, several neural network layers, a chain of
          coordinate changes), you must invert each step and also reverse their order — never just
          invert each piece independently and multiply in the original order.
        </p>
      </Derivation>
      <DiagramBlock
        id="diagram"
        title="Watch a matrix transpose"
        caption="Rows become columns — cell (r, c) moves to position (c, r). Edit the matrix, then replay."
      >
        <DiagramHost render={renderTranspose} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — transpose and inverse in NumPy"
        code={`import numpy as np

A = np.array([[4.0, 7.0], [2.0, 6.0]])

print(A.T)                 # transpose: rows <-> columns
print(np.linalg.inv(A))    # inverse: A @ inv(A) == I
print(A @ np.linalg.inv(A))  # -> [[1, 0], [0, 1]] (up to float rounding)

try:
    singular = np.array([[1, 2], [2, 4]])  # rank 1 -> no inverse exists
    np.linalg.inv(singular)
except np.linalg.LinAlgError as e:
    print("Singular matrix:", e)`}
      >
        <p>
          NumPy raises <code>LinAlgError</code> for singular matrices rather than silently returning
          a wrong answer — a good habit is to wrap real production code in exactly this kind of
          try/except.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <p>Linear regression's normal equation uses exactly these ideas:</p>
        <Formula>{"w = (X^TX)^{-1}X^Ty"}</Formula>
        <p>
          This directly solves for the best-fit weights <code>w</code> from your data matrix{" "}
          <code>X</code> and targets <code>y</code> — no trial and error needed for small datasets.
          Every piece has a role: <code>Xᵀ</code> reshapes the problem so the multiplication is
          valid, <code>(XᵀX)⁻¹</code> "undoes" the data's own structure, and the whole expression is
          really just algebraically solving <code>Xw = y</code> for w.
        </p>
        <ul>
          <li>
            Covariance matrices are always computed via a transpose: <code>Cov = (1/n) XᵀX</code> on
            centered data.
          </li>
          <li>
            Graphics engines use the transpose of a rotation matrix as a cheap way to compute its
            inverse (rotation matrices are "orthogonal," so transpose = inverse for them — no
            expensive inversion needed).
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Calling <code>np.linalg.inv()</code> on a large matrix in production code — it's slow
            and numerically unstable at scale; use <code>np.linalg.solve(A, b)</code> to solve{" "}
            <code>Ax = b</code> directly instead of computing a full inverse.
          </li>
          <li>
            Assuming every square matrix is invertible — always check for singularity (or rank
            deficiency, section 1.9) before relying on an inverse existing.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Real ML libraries rarely compute a literal inverse for large problems — it's numerically
          unstable and slow. They use decompositions like <strong>LU</strong> (section 1.13),{" "}
          <strong>QR</strong> (section 1.14), or <strong>SVD</strong> (section 1.10) instead, or
          just solve iteratively with gradient descent.
        </p>
        <p>
          A useful mental shortcut: for an orthogonal matrix (one whose rows/columns are unit
          vectors, all perpendicular to each other — like a pure rotation), the inverse is{" "}
          <em>always</em> just the transpose: <code>A⁻¹ = Aᵀ</code>. This is one of the main reasons
          orthogonal matrices are so beloved in numerical computing — inversion, normally expensive,
          becomes free.
        </p>
        <p>
          At the master level: when a true inverse doesn't exist (non-square or singular matrices),
          the <strong>Moore-Penrose pseudo-inverse</strong> (<code>np.linalg.pinv</code>)
          generalizes the concept, built from the SVD (section 1.10) — it's what "least squares"
          solutions actually rely on under the hood in every serious numerical library.
        </p>
      </ExpertNote>
    </>
  );
}

export function EigenvaluesEigenvectors() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> when a matrix transforms space, most vectors get both rotated{" "}
          <em>and</em> stretched. A few special vectors only get{" "}
          <strong>stretched or shrunk</strong> — their direction never changes. These are{" "}
          <strong>eigenvectors</strong>; the amount they scale by is the <strong>eigenvalue</strong>
          .
        </p>
        <p>
          <strong>Intermediate:</strong> "eigen" is German for "own" or "characteristic" — an
          eigenvector is a direction that belongs to the matrix itself, independent of any
          particular input data. Once you know a matrix's eigenvectors and eigenvalues, you know
          almost everything important about how it behaves under repeated application.
        </p>
        <p>
          <strong>Advanced:</strong> applying the matrix 100 times in a row is the same as scaling
          along each eigenvector by its eigenvalue raised to the 100th power — which is exactly how
          you'd analyze whether a dynamical system is stable, growing, or decaying over time
          (eigenvalues with magnitude &gt; 1 mean growth along that direction; &lt; 1 means decay).
          This single idea underlies stability analysis across control theory, ecology, economics,
          and recurrent neural networks.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"A\\vec{v} = \\lambda \\vec{v}"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Applying A to v gives back the same vector v, just scaled by λ. An n×n matrix has at most
          n distinct eigenvalues, found by solving <code>det(A − λI) = 0</code> — a polynomial
          equation in λ called the characteristic equation.
        </p>
      </SectionBlock>
      <Derivation id="derivation" title="Derivation: where the characteristic equation comes from">
        <p>Start directly from the definition and move everything to one side:</p>
        <Formula>
          {
            "A\\vec{v} = \\lambda\\vec{v} \\ \\Longrightarrow\\ A\\vec{v} - \\lambda\\vec{v} = 0 \\ \\Longrightarrow\\ (A-\\lambda I)\\vec{v} = 0"
          }
        </Formula>
        <p>
          (inserting the identity matrix, section 1.6, so both terms are genuine matrix-vector
          products that can be factored together). This says v is in the null space of{" "}
          <code>A − λI</code> — but eigenvectors are required to be <em>nonzero</em> by definition.
          A matrix has a nonzero vector in its null space exactly when it's singular (section 1.9,
          1.12), i.e. exactly when its determinant is zero:
        </p>
        <Formula>{"\\det(A - \\lambda I) = 0"}</Formula>
        <p>
          For a 2×2 matrix <code>A = [[a,b],[c,d]]</code>, expanding this determinant gives a
          concrete quadratic in λ:
        </p>
        <Formula>
          {"(a-\\lambda)(d-\\lambda) - bc = \\lambda^2 - (a+d)\\lambda + (ad-bc) = 0"}
        </Formula>
        <p>
          solvable directly by the quadratic formula — for the worked example below (a=2, b=c=0,
          d=3), this becomes <code>λ² − 5λ + 6 = 0 = (λ−2)(λ−3)</code>, giving exactly λ=2 and λ=3.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> in practice, no library solves this polynomial
          equation for matrices larger than 2×2 or 3×3 — it's numerically unreliable at scale. Real
          eigensolvers use the QR algorithm (section 1.14) or power iteration (section 1.24)
          instead; this derivation is the "why it's true," not the "how it's computed."
        </p>
      </Derivation>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          For <code>A = [[2,0],[0,3]]</code>, try <code>v=[1,0]</code>:
        </p>
        <Formula>
          {
            "Av = \\begin{bmatrix}2&0\\\\0&3\\end{bmatrix}\\begin{bmatrix}1\\\\0\\end{bmatrix} = \\begin{bmatrix}2\\\\0\\end{bmatrix} = 2\\begin{bmatrix}1\\\\0\\end{bmatrix}"
          }
        </Formula>
        <p className="mt-1.5">
          v=[1,0] is an eigenvector with eigenvalue λ=2. Similarly [0,1] has eigenvalue 3. For a
          diagonal matrix like this one, the eigenvalues are always just the diagonal entries
          themselves, and the eigenvectors are always the standard basis directions — no
          equation-solving required.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Watch a whole field of vectors transform"
        caption="Drag the sliders — every grey arrow rotates and stretches under the matrix, but the two colored eigenvectors only ever change length, never direction."
      >
        <DiagramHost render={renderEigenField} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — eigendecomposition in NumPy"
        code={`import numpy as np

A = np.array([[2, 1], [1, 2]])
eigenvalues, eigenvectors = np.linalg.eig(A)

print(eigenvalues)          # [3. 1.]
print(eigenvectors)          # columns are the eigenvectors

# Verify: A @ v should equal lambda * v for each eigenpair
for i in range(len(eigenvalues)):
    v = eigenvectors[:, i]
    lam = eigenvalues[i]
    print(np.allclose(A @ v, lam * v))   # True, True`}
      >
        <p>
          <code>np.linalg.eig</code> returns eigenvalues and eigenvectors together — the columns of
          the second array, not the rows, are the eigenvectors, which trips up nearly everyone the
          first time.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>PCA</strong> works by finding the eigenvectors of your data's covariance matrix
            — the directions of maximum variance. This is how you compress 100 correlated features
            (or a 10,000-pixel face image, "Eigenfaces") down to a handful of numbers. When you also
            have class labels and want directions that separate categories rather than just spread
            out variance, that's the generalized eigenvalue problem of section 1.29 (LDA).
          </li>
          <li>
            <strong>PageRank</strong> is, at its heart, finding the eigenvector of the web's link
            matrix with eigenvalue 1 — that eigenvector's entries become each page's importance
            score.
          </li>
          <li>
            <strong>Vibration analysis</strong> in mechanical engineering: the eigenvalues of a
            structure's stiffness matrix are literally its natural resonant frequencies.
          </li>
          <li>
            <strong>Markov chains</strong> — the long-run "steady state" of a random process is the
            eigenvector of the transition matrix with eigenvalue 1.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Reading eigenvectors out of the rows of NumPy's output instead of the columns — a
            classic, silent bug.
          </li>
          <li>
            Assuming every real matrix has real eigenvalues — pure rotation matrices, for example,
            have no real eigenvectors at all (see the expert note below).
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          <strong>SVD</strong> (section 1.10) generalizes eigen-decomposition to non-square matrices
          and underlies matrix-factorization recommenders and NLP topic models.
        </p>
        <p>
          Eigenvalues can be complex numbers even when the matrix is entirely real — this happens
          whenever the transformation includes genuine rotation with no fixed axis (a pure 2D
          rotation matrix, for instance, has no real eigenvectors at all, since every vector's
          direction changes). When people say "this matrix has no eigenvectors," they usually mean
          "no real ones" — complex eigenvectors always exist for any square matrix, over the complex
          numbers.
        </p>
        <p>
          At the master level: not every square matrix can be fully diagonalized (written as{" "}
          <code>A = PDP⁻¹</code> with D diagonal) — matrices with "repeated" eigenvalues but too few
          independent eigenvectors require the more general <strong>Jordan normal form</strong>. In
          practice, this is rarely an issue for the symmetric matrices (like covariance matrices)
          that dominate ML — the spectral theorem guarantees every real symmetric matrix
          diagonalizes cleanly with orthogonal eigenvectors, which is precisely why PCA always works
          without exception. Symmetric matrices whose eigenvalues are all strictly positive are
          exactly the <strong>positive definite matrices</strong> of section 1.15 — the two topics
          are two views of the same object.
        </p>
      </ExpertNote>
    </>
  );
}

export function VectorNorms() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a <strong>norm</strong> measures how "big" a vector is. The{" "}
          <strong>L1 norm</strong> adds up absolute values — like walking city blocks, only
          horizontal/vertical moves. The <strong>L2 norm</strong> is straight-line distance — a bird
          flying directly there.
        </p>
        <p>
          <strong>Intermediate:</strong> there's a whole family beyond just L1 and L2: the general{" "}
          <strong>Lp norm</strong> raises each component to the power p, sums them, then takes the
          p-th root. As p grows toward infinity, the norm cares less and less about the small
          entries and more and more about the single largest one — the limiting case, the{" "}
          <strong>L∞ norm</strong>, is simply "the biggest absolute value in the vector."
        </p>
        <p>
          <strong>Advanced:</strong> different norms encode genuinely different notions of "size,"
          and choosing the right one is a real modeling decision, not a formality. L2 penalizes
          large values disproportionately (squaring amplifies them), which spreads a penalty evenly
          across all weights; L1's flat linear penalty can push individual weights all the way to
          exactly zero, which is what makes it useful for automatic feature selection rather than
          just "shrinkage."
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {"\\|\\vec{v}\\|_1 = \\sum_i |v_i| \\qquad \\|\\vec{v}\\|_2 = \\sqrt{\\sum_i v_i^2}"}
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          The general form is{" "}
          <Formula display={false}>
            {"\\|\\vec{v}\\|_p = \\left(\\sum_i |v_i|^p\\right)^{1/p}"}
          </Formula>{" "}
          — setting p=1 or p=2 recovers the two formulas above.
        </p>
      </SectionBlock>
      <Derivation id="derivation" title="Derivation: the triangle inequality, ‖a+b‖ ≤ ‖a‖+‖b‖">
        <p>Expand the squared L2 norm of a sum using the dot product directly:</p>
        <Formula>
          {
            "\\|\\vec{a}+\\vec{b}\\|^2 = (\\vec{a}+\\vec{b})\\cdot(\\vec{a}+\\vec{b}) = \\|\\vec{a}\\|^2 + 2\\,\\vec{a}\\cdot\\vec{b} + \\|\\vec{b}\\|^2"
          }
        </Formula>
        <p>
          The <strong>Cauchy-Schwarz inequality</strong> states <code>a·b ≤ ‖a‖‖b‖</code> for any
          two vectors (a direct consequence of section 1.3's identity, since <code>cos θ ≤ 1</code>{" "}
          always). Substituting this bound in:
        </p>
        <Formula>
          {
            "\\|\\vec{a}+\\vec{b}\\|^2 \\le \\|\\vec{a}\\|^2 + 2\\|\\vec{a}\\|\\|\\vec{b}\\| + \\|\\vec{b}\\|^2 = (\\|\\vec{a}\\|+\\|\\vec{b}\\|)^2"
          }
        </Formula>
        <p>
          and since norms are non-negative, taking the square root of both sides preserves the
          inequality: <code>‖a+b‖ ≤ ‖a‖+‖b‖</code>.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> the triangle inequality is one of the three defining
          axioms a function must satisfy to legally be called a "norm" or "distance metric" at all —
          it's what guarantees "going directly somewhere is never longer than a detour," the
          property every distance-based ML algorithm (k-NN, clustering) silently depends on.
        </p>
      </Derivation>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          For <code>v = [3, -4]</code>:
        </p>
        <table>
          <thead>
            <tr>
              <th>Norm</th>
              <th>Calculation</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>L1</td>
              <td>|3|+|-4|</td>
              <td>7</td>
            </tr>
            <tr>
              <td>L2</td>
              <td>√(9+16)</td>
              <td>5</td>
            </tr>
            <tr>
              <td>L∞</td>
              <td>max(|3|,|-4|)</td>
              <td>4</td>
            </tr>
          </tbody>
        </table>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="L1 vs. L2: two ways to measure the same trip"
        caption="Drag the endpoint — orange is the L1 (city-block, staircase) path, green is the L2 (straight-line) distance. Notice L2 is always ≤ L1."
      >
        <DiagramHost render={renderNormsRace} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — regularization in NumPy"
        code={`import numpy as np

weights = np.array([2.0, -0.1, 3.5, 0.0, -1.2])

l1 = np.linalg.norm(weights, ord=1)   # 6.8 -> sum of |weights|
l2 = np.linalg.norm(weights, ord=2)   # 4.32 -> straight-line magnitude

# Ridge-style penalty added to a loss function:
lambda_ = 0.01
ridge_penalty = lambda_ * l2**2
lasso_penalty = lambda_ * l1
print(ridge_penalty, lasso_penalty)`}
      >
        <p>
          This is literally what Ridge and Lasso regression add to their loss functions — a norm of
          the weight vector, scaled by a tunable strength <code>λ</code>.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Regularization</strong> — Ridge regression penalizes the L2 norm of weights
            (shrinks everything a little); Lasso penalizes the L1 norm (pushes some weights to
            exactly zero, giving automatic feature selection).
          </li>
          <li>
            <strong>Gradient clipping</strong> in deep learning caps the L2 norm of the gradient
            vector before each update step, preventing exploding gradients from destroying training.
          </li>
          <li>
            <strong>K-nearest-neighbors</strong> and clustering algorithms need a norm to define
            "distance" between points — the choice of norm changes which points count as neighbors.
          </li>
          <li>
            <strong>City-block routing</strong> (literal Manhattan taxicabs, warehouse robots on a
            grid) is exactly the L1 norm in action — you can't cut diagonally through a building.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Forgetting to specify <code>ord=</code> in <code>np.linalg.norm()</code> — it defaults
            to L2, which silently gives the wrong number if you actually wanted L1.
          </li>
          <li>
            Applying L2 regularization to bias terms — conventionally, only weights are regularized,
            not biases, since biases don't contribute to overfitting the same way.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Every valid norm must satisfy three properties: it's zero only for the zero vector,
          scaling the vector scales the norm proportionally, and it obeys the triangle inequality
          (going directly somewhere is never longer than going via a detour). These aren't arbitrary
          rules — they're what make "distance" behave the way our intuition expects.
        </p>
        <p>
          At the master level: the <strong>L0 "norm"</strong> (not a true norm, since it fails the
          scaling property) simply counts the number of non-zero entries — directly optimizing it
          gives the sparsest possible solution, but the resulting problem is NP-hard. L1
          regularization is popular specifically because it's the tightest <em>convex</em>{" "}
          relaxation of L0 — close enough to sparse, but solvable efficiently with standard convex
          optimization.
        </p>
      </ExpertNote>
    </>
  );
}

export function VectorSpacesSpanBasisRank() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> a <strong>vector space</strong> is basically "everywhere you
          could possibly reach" by adding and scaling a set of vectors. The <strong>span</strong> of
          a set of vectors is every combination you can build from them. A <strong>basis</strong> is
          the smallest, most efficient set of vectors needed to reach everywhere in that space — no
          redundancy. The <strong>rank</strong> of a matrix tells you how many truly independent
          directions it actually covers, even if it has far more rows or columns than that.
        </p>
        <p>
          <strong>Intermediate:</strong> a useful analogy: imagine trying to describe every point on
          a table using only "steps north" and "steps east." Those two directions form a basis for
          the table's 2D surface — you can reach anywhere with just those two. Adding a third
          instruction, "steps northeast," doesn't let you reach anywhere new — it's redundant, since
          northeast is just some combination of north and east.
        </p>
        <p>
          <strong>Advanced:</strong> a set of vectors is only a valid basis if none of them are
          redundant like that (formally, "linearly independent") <em>and</em> together they span the
          whole space. Every basis of a given space has exactly the same number of vectors — that
          number is the space's <strong>dimension</strong>, and it's a genuine invariant,
          independent of which specific basis you choose to describe it with.
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>
          {
            "\\text{span}\\{\\vec{v}_1,\\dots,\\vec{v}_k\\} = \\{ c_1\\vec{v}_1 + \\dots + c_k\\vec{v}_k : c_i \\in \\mathbb{R} \\}"
          }
        </Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Rank = the number of linearly independent rows/columns = the true dimensionality of the
          information a matrix holds. For an m×n matrix, rank is always at most min(m, n) — you can
          never have more independent directions than you have rows or columns to define them.
        </p>
      </SectionBlock>
      <Derivation id="derivation" title="Theorem: the Rank-Nullity theorem">
        <p>
          For an m×n matrix A, define the <strong>null space</strong> as every input vector A sends
          to zero (<code>{"{x : Ax = 0}"}</code>), and the <strong>nullity</strong> as that space's
          dimension. The theorem states:
        </p>
        <Formula>{"\\text{rank}(A) + \\text{nullity}(A) = n"}</Formula>
        <p>
          <strong>Why:</strong> pick a basis for the null space (nullity vectors), then extend it to
          a full basis of the entire n-dimensional input space by adding more vectors (always
          possible — any independent set can be extended to a basis). Applying A to this extended
          basis: the null-space vectors all map to 0, contributing nothing new, while the remaining
          vectors map to a set that turns out to be exactly a basis for A's output (column) space —
          a short argument shows they must be independent, since any dependency among their images
          would pull a nonzero combination of them back into the null space, contradicting how they
          were chosen. So the number of "leftover" basis vectors equals rank(A), and{" "}
          <code>nullity + rank = n</code> follows immediately by counting.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is the precise reason a rank-deficient matrix
          (section 1.12's determinant-zero case) has a nontrivial null space — it directly explains
          why <code>Ax = b</code> has infinitely many solutions (not zero, not exactly one) whenever
          A is singular: the null space's dimension tells you exactly how many free directions of
          ambiguity exist.
        </p>
      </Derivation>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          Vectors <code>[1,2]</code> and <code>[2,4]</code> look like two different directions, but{" "}
          <code>[2,4] = 2×[1,2]</code> — they point the exact same way. Their span is just a single
          line, not a plane, and the matrix <code>[[1,2],[2,4]]</code> has <strong>rank 1</strong>,
          not 2.
        </p>
        <p>
          Contrast with <code>[1,2]</code> and <code>[3,1]</code>: no scalar multiple of one gives
          the other, so together they can reach every point in the 2D plane — this matrix has{" "}
          <strong>rank 2</strong> (full rank for a 2×2 matrix).
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Independent vectors span more space"
        caption="Drag either vector around the circle — the rank is computed live from the actual determinant, not just eyeballed."
      >
        <DiagramHost render={renderSpanComparison} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — checking rank in NumPy"
        code={`import numpy as np

redundant = np.array([[1, 2], [2, 4]])
independent = np.array([[1, 2], [3, 1]])

print(np.linalg.matrix_rank(redundant))    # 1
print(np.linalg.matrix_rank(independent))  # 2

# A quick real-world check: are two features collinear?
celsius = np.array([0, 10, 20, 30])
fahrenheit = celsius * 9/5 + 32
X = np.column_stack([celsius, fahrenheit])
print(np.linalg.matrix_rank(X))            # 1 -> pure duplicate information`}
      >
        <p>
          This exact check — <code>matrix_rank</code> on a feature matrix — is a fast way to catch
          multicollinearity before it silently breaks a linear regression.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            If two features are "temperature in °C" and "temperature in °F," they carry identical
            information (one is a linear function of the other) — together they only span a 1-D
            line, not a 2-D plane. This is <strong>multicollinearity</strong>, and it's exactly why{" "}
            <code>Xᵀ X</code> can become singular (impossible to invert) in the normal equation from
            section 1.6, which is what motivates ridge regression's small diagonal correction.
          </li>
          <li>
            Feature engineering pipelines routinely drop one-hot-encoded columns (e.g. keeping only
            n−1 of n categories) specifically to avoid rank-deficiency in the resulting design
            matrix.
          </li>
          <li>
            Dimensionality reduction (PCA, autoencoders) is fundamentally about finding a lower-rank
            approximation of your data that still captures most of its span.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Assuming "more features" always means "more information" — redundant features add zero
            rank and zero new information, only noise and computational cost.
          </li>
          <li>
            Not checking for near-collinearity (rank technically full, but barely) — this still
            causes numerical instability even when <code>matrix_rank</code> doesn't flag it
            outright.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          Rank directly determines whether <code>Xᵀ X</code> is invertible. Rank-deficient
          (collinear) features make it singular — regularization adds a small value to the diagonal
          specifically to make it invertible again, a trick sometimes called a "ridge."
        </p>
        <p>
          In deep learning, "low-rank adaptation" (LoRA) exploits exactly this idea for efficient
          fine-tuning: instead of updating a full, huge weight matrix, you learn two small low-rank
          matrices whose product approximates the needed update — dramatically cutting the number of
          trainable parameters while barely affecting quality.
        </p>
        <p>
          At the master level: rank is only well-defined exactly in infinite-precision arithmetic —
          in floating point, "numerical rank" is determined by counting singular values (section
          1.10) above some small tolerance, since real-world data almost never produces an
          exactly-zero singular value, only a very small one. This is the practical bridge between
          the clean textbook definition of rank and how it's actually computed in every numerical
          library.
        </p>
      </ExpertNote>
    </>
  );
}

export function SingularValueDecomposition() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English — beginner to advanced">
        <p>
          <strong>Beginner:</strong> every matrix — square or not, even if it's rank-deficient — can
          be broken into three simple pieces: a rotation, a stretch along perpendicular axes, and
          another rotation. <strong>Singular Value Decomposition (SVD)</strong> finds exactly those
          three pieces. It's like eigenvectors (section 1.7) but works for <em>any</em> matrix, not
          just square ones.
        </p>
        <p>
          <strong>Intermediate:</strong> why does this matter so much? Because it means literally
          any linear transformation — no matter how complicated it looks — is secretly just three
          simple, well-understood steps in disguise. Once you have a matrix's SVD, questions that
          seem hard ("what's the best rank-5 approximation of this?", "how sensitive is this system
          to small input errors?") all become nearly trivial to answer by reading off numbers from
          U, Σ, and V.
        </p>
        <p>
          <strong>Advanced:</strong> the <strong>Eckart-Young theorem</strong> proves something
          remarkable — truncating an SVD to its top k singular values gives, provably, the{" "}
          <em>best possible</em> rank-k approximation of the original matrix, in a precise
          mathematical sense (minimizing reconstruction error). This isn't a heuristic; it's an
          exact optimality guarantee, which is why SVD-based compression is a genuine gold standard
          rather than just "one reasonable option."
        </p>
      </SectionBlock>
      <SectionBlock id="formula" label="Formula" tone="formula">
        <Formula>{"A = U \\Sigma V^T"}</Formula>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          U and V are rotation (orthogonal) matrices; Σ is a diagonal matrix of "singular values" —
          the stretch amount along each axis, largest to smallest. Unlike eigen-decomposition, SVD
          always exists for every matrix of every shape, with no exceptions and no need for the
          matrix to be square or diagonalizable.
        </p>
      </SectionBlock>
      <Derivation id="derivation" title="Derivation: why SVD always exists">
        <p>
          Start from <code>AᵀA</code> — always defined, for any shape of A. It's symmetric (
          <code>(AᵀA)ᵀ = AᵀA</code>) and positive semi-definite (section 1.15), since for any x,{" "}
          <code>xᵀ(AᵀA)x = (Ax)ᵀ(Ax) = ‖Ax‖² ≥ 0</code>. By the spectral theorem (section 1.7's
          expert note), a symmetric matrix always has a full set of orthonormal eigenvectors{" "}
          <code>v₁,…,vₙ</code> with real, non-negative eigenvalues <code>λ₁,…,λₙ</code>.
        </p>
        <p>
          Define <strong>singular values</strong> <code>σᵢ = √λᵢ</code>, and for each{" "}
          <code>σᵢ &gt; 0</code>, define <code>uᵢ = Avᵢ/σᵢ</code>. Check these uᵢ are themselves
          orthonormal:
        </p>
        <Formula>
          {
            "u_i \\cdot u_j = \\frac{(Av_i)^T(Av_j)}{\\sigma_i\\sigma_j} = \\frac{v_i^T(A^TA)v_j}{\\sigma_i\\sigma_j} = \\frac{\\lambda_j\\,(v_i\\cdot v_j)}{\\sigma_i\\sigma_j}"
          }
        </Formula>
        <p>
          which is 0 for i≠j (eigenvectors of a symmetric matrix are orthogonal) and exactly 1 when
          i=j (since <code>λᵢ = σᵢ²</code>). With U's columns as these uᵢ, V's columns as the vᵢ,
          and Σ holding the σᵢ, the construction directly gives <code>A = UΣVᵀ</code> — and since{" "}
          <code>AᵀA</code> exists and is always diagonalizable for <em>any</em> matrix A of any
          shape, this construction never fails.
        </p>
        <p className="text-muted-foreground">
          <strong>Where this is used:</strong> this is exactly the computation running inside{" "}
          <code>np.linalg.svd</code> conceptually (real implementations use more numerically stable
          algorithms, but this is the mathematical guarantee behind them) — and it's why SVD, unlike
          plain eigen-decomposition (section 1.7), never needs to worry about non-square or
          non-diagonalizable inputs.
        </p>
      </Derivation>
      <SectionBlock id="worked" label="Worked example" tone="muted">
        <p>
          Keeping only the <em>largest</em> singular value of a matrix (and dropping the rest) gives
          the best possible rank-1 approximation of that matrix — the closest simpler version of it
          you can build. Keep the top few singular values instead of all of them, and you get a
          compressed approximation that still captures most of the original structure.
        </p>
        <p>
          Concretely, if an image's singular values are <code>[420, 85, 12, 3, 0.4, ...]</code>, the
          first one or two already dominate — reconstructing the image from just the top 20 out of,
          say, 500 singular values often looks nearly identical to the original, because the rest
          contribute almost no visual information.
        </p>
      </SectionBlock>
      <DiagramBlock
        id="diagram"
        title="Watch A = U Σ Vᵀ happen to a circle"
        caption="Drag the slider yourself — a circle of points gets rotated (Vᵀ), stretched into an ellipse (Σ), then rotated again (U). That sequence IS the SVD."
      >
        <DiagramHost render={renderSvdMorph} />
      </DiagramBlock>
      <CodeExample
        id="practical"
        title="Practical example — image compression via SVD"
        code={`import numpy as np

# Any matrix, e.g. a 100x100 "image"
A = np.random.rand(100, 100)
U, S, Vt = np.linalg.svd(A)

k = 10  # keep only the top 10 singular values
A_approx = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]

original_size = A.size                       # 10,000 numbers
compressed_size = U[:, :k].size + k + Vt[:k, :].size
print(f"{compressed_size} numbers instead of {original_size}")
print("Reconstruction error:", np.linalg.norm(A - A_approx))`}
      >
        <p>
          This is a real, working image/data compressor in six lines — the same idea scales up to
          production recommender systems and topic models, just with far larger matrices.
        </p>
      </CodeExample>
      <SectionBlock id="example" label="Real-world examples" tone="good">
        <ul>
          <li>
            <strong>Recommender systems</strong> (Netflix-style) factor a giant, sparse user-movie
            matrix via SVD to discover hidden "taste dimensions" (e.g. "prefers action movies")
            without anyone labeling them — at real-world scale, this is done via randomized SVD
            (section 1.30), not the exact version shown here.
          </li>
          <li>
            <strong>Image compression</strong> keeps only the top singular values of a pixel matrix
            to reconstruct a close approximation using a fraction of the data. If you want the
            factors themselves to stay non-negative and interpretable rather than allowing negative
            entries, that's non-negative matrix factorization instead (section 1.31).
          </li>
          <li>
            <strong>Latent Semantic Analysis</strong> in NLP factors word-document matrices the same
            way to find topics, entirely unsupervised.
          </li>
          <li>
            <strong>Noise reduction</strong> — since noise tends to spread evenly across all
            singular values while signal concentrates in the largest ones, truncating small singular
            values is a simple, effective denoising technique.
          </li>
          <li>
            <strong>Embedding alignment</strong> — the SVD of a cross-covariance matrix also gives
            the exact, closed-form solution to the orthogonal Procrustes problem (section 1.33) of
            rotating one point set onto another.
          </li>
        </ul>
      </SectionBlock>
      <Pitfall>
        <ul>
          <li>
            Forgetting that <code>np.linalg.svd</code> returns <code>Vᵀ</code> already transposed,
            not <code>V</code> — a very common source of off-by-transpose bugs.
          </li>
          <li>
            Choosing k (how many singular values to keep) arbitrarily instead of by inspecting how
            quickly the singular values decay — plot them; the "elbow" tells you where information
            genuinely runs out.
          </li>
        </ul>
      </Pitfall>
      <ExpertNote>
        <p>
          <strong>PCA is literally SVD</strong> applied to the mean-centered data matrix — the right
          singular vectors V are the principal components. Libraries typically compute PCA via SVD
          rather than eigen-decomposing the covariance matrix directly, for better numerical
          stability.
        </p>
        <p>
          The <strong>Moore-Penrose pseudo-inverse</strong> — the closest thing to "dividing" by a
          non-square or singular matrix — is built directly from the SVD: invert the non-zero
          singular values, transpose the shape, and reassemble. This is what lets you solve
          least-squares problems even when a matrix has no true inverse at all.
        </p>
        <p>
          At the master level: the ratio of the largest to smallest singular value is the matrix's{" "}
          <strong>condition number</strong> — a huge condition number means the matrix is nearly
          singular and small input errors get massively amplified in any solution computed from it.
          This single number is the standard, rigorous way numerical analysts quantify "how
          trustworthy" a computed result really is, and it's computed via SVD in essentially every
          serious linear algebra library. For large random matrices, the statistical distribution of
          singular values follows the Marchenko-Pastur law — the rectangular-matrix cousin of the
          eigenvalue semicircle law covered in section 1.19.
        </p>
      </ExpertNote>
    </>
  );
}

export function WhyItMatters() {
  return (
    <>
      <SectionBlock id="plain-english" label="In plain English">
        <p>
          Every dataset is a matrix. Every data point is a vector. Every neural network layer is a
          matrix multiplication plus a bias vector (1.5). Similarity between two things is a dot
          product (1.3). Compressing data or finding its most important patterns is
          eigen-decomposition (1.7) or SVD (1.10). Knowing whether your features carry real,
          independent information — or just redundant copies of each other — is rank (1.9). Keeping
          a model from overfitting is norm-based regularization (1.8). If you genuinely understand
          vectors, matrices, dot products, eigenvectors, rank, and SVD, you can read almost any ML
          paper's math section without getting lost.
        </p>
        <p>
          It's also worth naming the two big ideas one level up, because they'll keep reappearing:
          linear algebra is the language of <strong>transformation</strong> (matrices moving vectors
          around, which is what every neural network layer does) and of <strong>structure</strong>{" "}
          (rank, span, and eigenvectors describing what information is actually present, independent
          of how it's stored). Almost every advanced ML concept — attention, convolution,
          embeddings, factorization, gradient descent itself — is one of these two ideas wearing a
          different name.
        </p>
      </SectionBlock>
      <CodeExample
        id="practical"
        title="Practical example — one dataset, every concept from this chapter"
        code={`import numpy as np

X = np.random.rand(200, 5)              # 200 samples, 5 features (a matrix)
x0 = X[0]                                 # one data point (a vector, 1.2)

sim = np.dot(x0, X[1]) / (np.linalg.norm(x0) * np.linalg.norm(X[1]))  # 1.3

W = np.random.rand(5, 3)                  # a "layer" (1.4, 1.5)
layer_out = X @ W

Xc = X - X.mean(axis=0)                   # center the data
cov = Xc.T @ Xc / len(X)                   # covariance matrix (1.6)
eigvals, eigvecs = np.linalg.eig(cov)      # PCA directions (1.7)

reg_penalty = np.linalg.norm(W, ord=2)      # weight regularization (1.8)
rank = np.linalg.matrix_rank(X)             # true information content (1.9)
U, S, Vt = np.linalg.svd(Xc)                 # PCA, done the stable way (1.10)`}
      >
        <p>
          Every single line of this snippet is a concept from this chapter, applied to the same
          200×5 dataset — this is genuinely what a real ML pipeline's early stages look like under
          the hood.
        </p>
      </CodeExample>
      <SectionBlock id="deeper" label="Go deeper in this chapter (1.12–1.35)" tone="accent">
        <p>
          Lessons 1.2–1.11 are the foundation almost every intro course stops at. The rest of this
          chapter covers what's genuinely needed to go from "comfortable" to "expert" — the parts of
          linear algebra that show up in research papers, production ML systems, and technical
          interviews, but rarely in beginner material:
        </p>
        <ul>
          <li>
            <strong>1.12 Determinants</strong> — the precise, computable meaning of "singular."
          </li>
          <li>
            <strong>1.13 LU Decomposition</strong> — how <code>Ax = b</code> is actually solved,
            without ever inverting A.
          </li>
          <li>
            <strong>1.14 QR &amp; Gram-Schmidt</strong> — orthogonalization, and the numerically
            stable way to do regression.
          </li>
          <li>
            <strong>1.15 Positive Definite Matrices &amp; Cholesky</strong> — the matrix version of
            "positive," and how Gaussians are sampled.
          </li>
          <li>
            <strong>1.16 Quadratic Forms &amp; Convexity</strong> — why some loss landscapes are
            easy and most deep learning isn't.
          </li>
          <li>
            <strong>1.17 Matrix Calculus</strong> — the chain rule in matrix form, which is exactly
            what backpropagation is.
          </li>
          <li>
            <strong>1.18 Einsum &amp; Tensor Contractions</strong> — the real notation behind
            attention and convolution.
          </li>
          <li>
            <strong>1.19 Random Matrix Theory</strong> — why weight initialization is scaled the way
            it is.
          </li>
          <li>
            <strong>1.20 Matrix Norms</strong> — Frobenius, spectral, and nuclear norms, and
            spectral normalization.
          </li>
          <li>
            <strong>1.21 Numerical Stability</strong> — the log-sum-exp trick behind every stable
            softmax.
          </li>
          <li>
            <strong>1.22 Sparse Matrices</strong> — why real-world ML data is almost always mostly
            zeros.
          </li>
          <li>
            <strong>1.23 Trace of a Matrix</strong> — the sum of the diagonal, and its surprising
            reach.
          </li>
          <li>
            <strong>1.24 Power Iteration</strong> — the simple algorithm behind PageRank and fast
            approximate PCA.
          </li>
          <li>
            <strong>1.25 Kernel Methods</strong> — separating data no straight line ever could,
            without an explicit lift.
          </li>
          <li>
            <strong>1.26 Whitening</strong> — turning correlated, stretched data into an isotropic
            cloud.
          </li>
          <li>
            <strong>1.27 The Woodbury Identity</strong> — updating an inverse cheaply, the trick
            behind Kalman filters.
          </li>
          <li>
            <strong>1.28 Perron-Frobenius Theorem</strong> — the guarantee that makes PageRank's
            steady state well-defined.
          </li>
          <li>
            <strong>1.29 Generalized Eigenvalue Problems</strong> — what LDA and CCA actually solve.
          </li>
          <li>
            <strong>1.30 Randomized Linear Algebra</strong> — how PCA/SVD scale to millions of rows.
          </li>
          <li>
            <strong>1.31 Non-negative Matrix Factorization</strong> — SVD's interpretable cousin.
          </li>
          <li>
            <strong>1.32 Hessian-Vector Products</strong> — getting Hv without ever forming H.
          </li>
          <li>
            <strong>1.33 Orthogonal Procrustes</strong> — the exact way to align two shapes or
            embedding spaces.
          </li>
          <li>
            <strong>1.34 Conjugate Gradient</strong> — solving Ax = b at massive scale, beating
            gradient descent's zig-zag.
          </li>
          <li>
            <strong>1.35 Triangular Jacobians &amp; Normalizing Flows</strong> — why flow-based
            generative models are built the exact way they are.
          </li>
        </ul>
      </SectionBlock>
      <SectionBlock id="example" label="Beyond linear algebra entirely" tone="good">
        <ul>
          <li>
            <strong>Calculus</strong> — gradients are vectors of partial derivatives;
            backpropagation is the chain rule applied through a graph of matrix multiplications
            (1.17 is the bridge into this).
          </li>
          <li>
            <strong>Probability &amp; statistics</strong> — covariance matrices, the multivariate
            normal distribution, and maximum likelihood estimation all lean directly on this chapter
            (1.15 is the bridge into this).
          </li>
          <li>
            <strong>Optimization</strong> — gradient descent, Newton's method, and convexity all
            reason about functions using the vectors and matrices introduced here (1.16 and 1.17 are
            the bridge into this).
          </li>
        </ul>
      </SectionBlock>
      <Takeaway>
        <p>
          Linear algebra isn't a hurdle before ML — it <em>is</em> the notation ML is written in.
          Every section in this chapter reappears, unmodified, the moment you open a deep learning
          paper.
        </p>
      </Takeaway>
    </>
  );
}
