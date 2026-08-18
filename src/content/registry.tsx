import type { ComponentType } from "react";
import * as Lessons1To10 from "./linear-algebra-for-ml/lessons-1-10";
import * as Lessons11To18 from "./linear-algebra-for-ml/lessons-11-18";
import * as Lessons19To27 from "./linear-algebra-for-ml/lessons-19-27";
import * as Lessons28To34 from "./linear-algebra-for-ml/lessons-28-34";

export type LessonMeta = {
  slug: string;
  number: string;
  title: string;
  description: string;
  Component: ComponentType;
  /** Set to false to hide this lesson everywhere (home page, sidebar, search, sitemap, prev/next).
   *  Defaults to enabled when omitted — only an explicit `false` turns a lesson off. */
  enabled?: boolean;
};

export type ChapterContent = {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Set to false to hide this entire chapter everywhere. Defaults to enabled when omitted. */
  enabled?: boolean;
  lessons: LessonMeta[];
};

const linearAlgebraForMl: ChapterContent = {
  enabled: true,
  id: "linear-algebra-for-ml",
  label: "Linear Algebra for ML",
  icon: "Grid3x3",
  description:
    "Vectors, matrices, and the transformations behind every model — from a single arrow to Singular Value Decomposition.",
  lessons: [
    {
      slug: "introduction",
      number: "1.1",
      title: "Introduction",
      description: "How this chapter is structured, the notation it uses, and where to start.",
      Component: Lessons1To10.Introduction,
    },
    {
      slug: "what-is-a-vector",
      number: "1.2",
      title: "What is a Vector?",
      description: "The building block: a list of numbers with meaning.",
      Component: Lessons1To10.WhatIsAVector,
    },
    {
      slug: "vector-operations",
      number: "1.3",
      title: "Vector Operations",
      description: "Adding, scaling, and comparing vectors.",
      Component: Lessons1To10.VectorOperations,
    },
    {
      slug: "what-is-a-matrix",
      number: "1.4",
      title: "What is a Matrix?",
      description: "A grid of numbers — and a machine for transforming vectors.",
      Component: Lessons1To10.WhatIsAMatrix,
    },
    {
      slug: "matrix-operations",
      number: "1.5",
      title: "Matrix Operations",
      description: "How matrices combine — and how neural networks actually compute.",
      Component: Lessons1To10.MatrixOperations,
    },
    {
      slug: "transpose-identity-inverse",
      number: "1.6",
      title: "Transpose, Identity & Inverse",
      description: 'Flipping, "doing nothing," and "undoing" a matrix.',
      Component: Lessons1To10.TransposeIdentityInverse,
    },
    {
      slug: "eigenvalues-eigenvectors",
      number: "1.7",
      title: "Eigenvalues & Eigenvectors",
      description: "The special directions a transformation doesn't rotate — only stretches.",
      Component: Lessons1To10.EigenvaluesEigenvectors,
    },
    {
      slug: "vector-norms",
      number: "1.8",
      title: "Vector Norms",
      description: 'Measuring the "size" of a vector — and why it controls overfitting.',
      Component: Lessons1To10.VectorNorms,
    },
    {
      slug: "vector-spaces-span-basis-rank",
      number: "1.9",
      title: "Vector Spaces, Span, Basis & Rank",
      description: "What it means for features to be genuinely independent.",
      Component: Lessons1To10.VectorSpacesSpanBasisRank,
    },
    {
      slug: "singular-value-decomposition",
      number: "1.10",
      title: "Singular Value Decomposition (SVD)",
      description: "Any matrix, broken into rotate → stretch → rotate.",
      Component: Lessons1To10.SingularValueDecomposition,
    },
    {
      slug: "why-it-matters",
      number: "1.11",
      title: "Why It Matters in ML/DL",
      description: "Tying the whole chapter together.",
      Component: Lessons1To10.WhyItMatters,
    },
    {
      slug: "determinants",
      number: "1.12",
      title: "Determinants",
      description: "Signed area, invertibility, and why det = product of eigenvalues.",
      Component: Lessons11To18.Determinants,
    },
    {
      slug: "lu-decomposition",
      number: "1.13",
      title: "LU Decomposition & Solving Linear Systems",
      description: "How Ax = b is actually solved in production, without ever inverting A.",
      Component: Lessons11To18.LuDecomposition,
    },
    {
      slug: "qr-gram-schmidt",
      number: "1.14",
      title: "QR Decomposition & Gram-Schmidt",
      description: "Orthogonalizing vectors, and the numerically stable way to do least squares.",
      Component: Lessons11To18.QrGramSchmidt,
    },
    {
      slug: "positive-definite-cholesky",
      number: "1.15",
      title: "Positive Definite Matrices & Cholesky",
      description:
        'The matrix version of "positive," and the fast square-root-like factorization it enables.',
      Component: Lessons11To18.PositiveDefiniteCholesky,
    },
    {
      slug: "quadratic-forms-convexity",
      number: "1.16",
      title: "Quadratic Forms, Convexity & the Hessian",
      description: "Why some loss landscapes are easy (convex) and most deep learning isn't.",
      Component: Lessons11To18.QuadraticFormsConvexity,
    },
    {
      slug: "matrix-calculus",
      number: "1.17",
      title: "Matrix Calculus: Gradients, Jacobians & Backprop",
      description: "The chain rule in matrix form — which is precisely what backpropagation is.",
      Component: Lessons11To18.MatrixCalculus,
    },
    {
      slug: "einsum-tensor-contractions",
      number: "1.18",
      title: "Einsum, Tensor Contractions & Convolution",
      description: "The real notation behind attention, batched ops, and conv-as-matmul.",
      Component: Lessons11To18.EinsumTensorContractions,
    },
    {
      slug: "random-matrix-theory",
      number: "1.19",
      title: "Random Matrices & High-Dimensional Geometry",
      description:
        "Why weight initialization is scaled the way it is, computed live in your browser.",
      Component: Lessons11To18.RandomMatrixTheory,
    },
    {
      slug: "matrix-norms",
      number: "1.20",
      title: "Matrix Norms: Frobenius, Spectral & Nuclear",
      description:
        "The matrix-sized versions of section 1.8 — and the basis of spectral normalization.",
      Component: Lessons19To27.MatrixNorms,
    },
    {
      slug: "numerical-stability",
      number: "1.21",
      title: "Numerical Stability & the Log-Sum-Exp Trick",
      description: "Why softmax silently produces NaN, and the one-line fix every framework uses.",
      Component: Lessons19To27.NumericalStability,
    },
    {
      slug: "sparse-matrices",
      number: "1.22",
      title: "Sparse Matrices & Structured Storage",
      description:
        "Why real-world ML data is almost always mostly zeros, and how that's exploited.",
      Component: Lessons19To27.SparseMatrices,
    },
    {
      slug: "trace-of-a-matrix",
      number: "1.23",
      title: "Trace of a Matrix",
      description:
        "The sum of the diagonal — and why it shows up in every regularization derivation.",
      Component: Lessons19To27.TraceOfAMatrix,
    },
    {
      slug: "power-iteration",
      number: "1.24",
      title: "Power Iteration & Finding Dominant Eigenvectors",
      description: "The simple algorithm behind PageRank and fast approximate PCA.",
      Component: Lessons19To27.PowerIteration,
    },
    {
      slug: "kernel-methods",
      number: "1.25",
      title: "Kernel Methods & the Kernel Trick",
      description: "How SVMs separate data no straight line ever could, without an explicit lift.",
      Component: Lessons19To27.KernelMethods,
    },
    {
      slug: "whitening",
      number: "1.26",
      title: "Whitening & Decorrelation Transforms",
      description: "Turning correlated, stretched data into an isotropic unit-variance cloud.",
      Component: Lessons19To27.Whitening,
    },
    {
      slug: "woodbury-identity",
      number: "1.27",
      title: "The Woodbury Matrix Identity",
      description:
        "Updating an inverse cheaply — the trick behind Kalman filters and online regression.",
      Component: Lessons19To27.WoodburyIdentity,
    },
    {
      slug: "perron-frobenius",
      number: "1.28",
      title: "Perron-Frobenius Theorem & PageRank Convergence",
      description:
        "The theorem guaranteeing PageRank's steady state actually exists and is unique.",
      Component: Lessons19To27.PerronFrobenius,
    },
    {
      slug: "generalized-eigenvalues",
      number: "1.29",
      title: "Generalized Eigenvalue Problems",
      description: "What LDA and CCA actually solve — Av = λBv, not just Av = λv.",
      Component: Lessons28To34.GeneralizedEigenvalues,
    },
    {
      slug: "randomized-linear-algebra",
      number: "1.30",
      title: "Randomized & Approximate Linear Algebra",
      description: "How PCA/SVD actually scale to millions of rows, via random projection.",
      Component: Lessons28To34.RandomizedLinearAlgebra,
    },
    {
      slug: "non-negative-matrix-factorization",
      number: "1.31",
      title: "Non-negative Matrix Factorization",
      description:
        "SVD's interpretable cousin — the technique behind topic models and eigenfaces' rival.",
      Component: Lessons28To34.NonNegativeMatrixFactorization,
    },
    {
      slug: "hessian-vector-products",
      number: "1.32",
      title: "Hessian-Vector Products & the Pearlmutter Trick",
      description: "Getting Hv without ever forming the (enormous) Hessian H.",
      Component: Lessons28To34.HessianVectorProducts,
    },
    {
      slug: "orthogonal-procrustes",
      number: "1.33",
      title: "The Orthogonal Procrustes Problem",
      description: "The exact, closed-form way to align two shapes or embedding spaces via SVD.",
      Component: Lessons28To34.OrthogonalProcrustes,
    },
    {
      slug: "conjugate-gradient",
      number: "1.34",
      title: "The Conjugate Gradient Method",
      description: "Solving Ax = b at massive scale, beating gradient descent's zig-zag.",
      Component: Lessons28To34.ConjugateGradientMethod,
    },
    {
      slug: "triangular-jacobians-flows",
      number: "1.35",
      title: "Triangular Jacobians & Normalizing Flows",
      description: "Why flow-based generative models are designed the exact way they are.",
      Component: Lessons28To34.TriangularJacobiansFlows,
    },
  ],
};

export const CONTENT_REGISTRY: Record<string, ChapterContent> = {
  [linearAlgebraForMl.id]: linearAlgebraForMl,
};

export function getChapter(id: string): ChapterContent | undefined {
  return CONTENT_REGISTRY[id];
}

export function getLesson(chapterId: string, slug: string): LessonMeta | undefined {
  return getChapter(chapterId)?.lessons.find((l) => l.slug === slug);
}

export function allChapters(): ChapterContent[] {
  return Object.values(CONTENT_REGISTRY);
}

export function isChapterEnabled(chapter: ChapterContent): boolean {
  return chapter.enabled !== false;
}

export function isLessonEnabled(lesson: LessonMeta): boolean {
  return lesson.enabled !== false;
}

/** Chapters to actually show — everywhere content is listed (home page, sidebar, search, sitemap). */
export function enabledChapters(): ChapterContent[] {
  return allChapters().filter(isChapterEnabled);
}

/** Lessons to actually show within a chapter — same rule, plus used for prev/next ordering. */
export function enabledLessons(chapter: ChapterContent): LessonMeta[] {
  return chapter.lessons.filter(isLessonEnabled);
}
