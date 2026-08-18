/** Pure numeric helpers — no DOM. Used by the more advanced (1.11-1.18) diagrams. */

/** Jacobi eigenvalue algorithm: computes all eigenvalues of a real symmetric n×n matrix. */
export function symmetricEigenvalues(Ain: number[][], sweeps = 60): number[] {
  const n = Ain.length;
  const A = Ain.map((row) => row.slice());

  function offDiagNorm() {
    let sum = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) sum += A[i][j] * A[i][j];
    return sum;
  }

  for (let sweep = 0; sweep < sweeps && offDiagNorm() > 1e-10; sweep++) {
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-12) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        const app = A[p][p],
          aqq = A[q][q],
          apq = A[p][q];
        A[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
        A[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
        A[p][q] = 0;
        A[q][p] = 0;
        for (let i = 0; i < n; i++) {
          if (i === p || i === q) continue;
          const aip = A[i][p],
            aiq = A[i][q];
          A[i][p] = c * aip - s * aiq;
          A[p][i] = A[i][p];
          A[i][q] = s * aip + c * aiq;
          A[q][i] = A[i][q];
        }
      }
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(A[i][i]);
  return out.sort((a, b) => a - b);
}

/** A pseudo-random generator seeded per call — good enough for illustrative diagrams. */
export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller standard-normal sample using a supplied uniform RNG. */
export function randn(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Builds a random symmetric n×n matrix with iid N(0,1)/sqrt(n) entries (a GOE-style ensemble). */
export function randomSymmetricMatrix(n: number, seed: number): number[][] {
  const rng = mulberry32(seed);
  const A: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const v = randn(rng) / Math.sqrt(n);
      A[i][j] = v;
      A[j][i] = v;
    }
  }
  return A;
}
