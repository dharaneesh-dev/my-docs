import {
  el,
  svg,
  arrowDefs,
  animate,
  replayButton,
  makeDraggable,
  dragHandle,
  sliderControl,
  readout,
} from "./diagram-helpers";
import type { DiagramRender } from "./diagram-host";

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/* 1.1 — draggable vector: drag the tip, coordinates & length update live */
export const renderVector: DiagramRender = (host) => {
  const s = svg("0 0 420 260");
  s.appendChild(arrowDefs("arrow-vec1", "#4f5fe0"));
  s.appendChild(
    el("line", { x1: 40, y1: 220, x2: 400, y2: 220, stroke: "#c7cbdc", "stroke-width": 1.5 }),
  );
  s.appendChild(
    el("line", { x1: 60, y1: 20, x2: 60, y2: 240, stroke: "#c7cbdc", "stroke-width": 1.5 }),
  );
  const ox = 60,
    oy = 220;
  const SCALE = 30;
  let vx = 4,
    vy = 3;

  const line = el("line", {
    x1: ox,
    y1: oy,
    x2: ox + vx * SCALE,
    y2: oy - vy * SCALE,
    stroke: "#4f5fe0",
    "stroke-width": 2.5,
    "marker-end": "url(#arrow-vec1)",
  });
  const handle = dragHandle(ox + vx * SCALE, oy - vy * SCALE, "#4f5fe0");
  handle.setAttribute("opacity", "0");
  s.appendChild(line);
  s.appendChild(handle);
  host.appendChild(s);

  const out = readout(host, "");
  function sync() {
    line.setAttribute("x2", String(ox + vx * SCALE));
    line.setAttribute("y2", String(oy - vy * SCALE));
    handle.setAttribute("cx", String(ox + vx * SCALE));
    handle.setAttribute("cy", String(oy - vy * SCALE));
    out.set(`v = [${fmt(vx)}, ${fmt(vy)}]  ·  |v| = ${fmt(Math.hypot(vx, vy))}`);
  }
  const stopDrag = makeDraggable(handle, s, (p) => {
    vx = Math.max(-1, Math.min(11, (p.x - ox) / SCALE));
    vy = Math.max(-1, Math.min(7, (oy - p.y) / SCALE));
    sync();
  });

  const cancels: Array<() => void> = [];
  function playEntrance() {
    vx = 4;
    vy = 3;
    const tipX = ox + vx * SCALE,
      tipY = oy - vy * SCALE;
    const len = Math.hypot(tipX - ox, tipY - oy);
    handle.setAttribute("opacity", "0");
    line.setAttribute("x2", String(ox));
    line.setAttribute("y2", String(oy));
    line.setAttribute("stroke-dasharray", String(len));
    line.setAttribute("stroke-dashoffset", "0");
    cancels.push(
      animate(
        650,
        (t) => {
          line.setAttribute("x2", String(ox + (tipX - ox) * t));
          line.setAttribute("y2", String(oy + (tipY - oy) * t));
        },
        () => {
          line.removeAttribute("stroke-dasharray");
          handle.setAttribute("opacity", "1");
          sync();
        },
      ),
    );
  }
  playEntrance();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent = "Drag the blue dot — the vector and its numbers update live.";
  host.appendChild(hint);
  replayButton(host, "↻ Replay", playEntrance);

  return () => {
    stopDrag();
    cancels.forEach((c) => c());
  };
};

/* 1.2 — tip-to-tail vector addition, both vectors draggable */
export const renderVectorAddition: DiagramRender = (host) => {
  const s = svg("0 0 420 280");
  s.appendChild(arrowDefs("arrow-a", "#4f5fe0"));
  s.appendChild(arrowDefs("arrow-b", "#b8720c"));
  s.appendChild(arrowDefs("arrow-c", "#1f8a5f"));
  const ox = 60,
    oy = 240;
  const SCALE = 26;
  let ax = 3,
    ay = 3;
  let bx = 3,
    by = -2;

  const lineA = el("line", {
    x1: ox,
    y1: oy,
    x2: 0,
    y2: 0,
    stroke: "#4f5fe0",
    "stroke-width": 2.5,
    "marker-end": "url(#arrow-a)",
  });
  const lineB = el("line", {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: "#b8720c",
    "stroke-width": 2.5,
    "marker-end": "url(#arrow-b)",
  });
  const lineC = el("line", {
    x1: ox,
    y1: oy,
    x2: 0,
    y2: 0,
    stroke: "#1f8a5f",
    "stroke-width": 2.5,
    "stroke-dasharray": "5,4",
    "marker-end": "url(#arrow-c)",
  });
  [lineC, lineA, lineB].forEach((l) => s.appendChild(l));
  const handleA = dragHandle(0, 0, "#4f5fe0");
  const handleB = dragHandle(0, 0, "#b8720c");
  handleA.setAttribute("opacity", "0");
  handleB.setAttribute("opacity", "0");
  s.appendChild(handleA);
  s.appendChild(handleB);
  host.appendChild(s);

  const out = readout(host, "");
  function sync() {
    const aTipX = ox + ax * SCALE,
      aTipY = oy - ay * SCALE;
    const bTipX = aTipX + bx * SCALE,
      bTipY = aTipY - by * SCALE;
    lineA.setAttribute("x2", String(aTipX));
    lineA.setAttribute("y2", String(aTipY));
    lineB.setAttribute("x1", String(aTipX));
    lineB.setAttribute("y1", String(aTipY));
    lineB.setAttribute("x2", String(bTipX));
    lineB.setAttribute("y2", String(bTipY));
    lineC.setAttribute("x2", String(bTipX));
    lineC.setAttribute("y2", String(bTipY));
    handleA.setAttribute("cx", String(aTipX));
    handleA.setAttribute("cy", String(aTipY));
    handleB.setAttribute("cx", String(bTipX));
    handleB.setAttribute("cy", String(bTipY));
    out.set(
      `a = [${fmt(ax)}, ${fmt(ay)}]   b = [${fmt(bx)}, ${fmt(by)}]   a+b = [${fmt(ax + bx)}, ${fmt(ay + by)}]`,
    );
  }

  const stopA = makeDraggable(handleA, s, (p) => {
    ax = Math.max(-6, Math.min(6, (p.x - ox) / SCALE));
    ay = Math.max(-6, Math.min(6, (oy - p.y) / SCALE));
    sync();
  });
  const stopB = makeDraggable(handleB, s, (p) => {
    const aTipX = ox + ax * SCALE,
      aTipY = oy - ay * SCALE;
    bx = Math.max(-6, Math.min(6, (p.x - aTipX) / SCALE));
    by = Math.max(-6, Math.min(6, (aTipY - p.y) / SCALE));
    sync();
  });

  const cancels: Array<() => void> = [];
  function playEntrance() {
    ax = 3;
    ay = 3;
    bx = 3;
    by = -2;
    const aTipX = ox + ax * SCALE,
      aTipY = oy - ay * SCALE;
    const bTipX = aTipX + bx * SCALE,
      bTipY = aTipY - by * SCALE;
    handleA.setAttribute("opacity", "0");
    handleB.setAttribute("opacity", "0");
    lineA.setAttribute("x2", String(ox));
    lineA.setAttribute("y2", String(oy));
    lineB.setAttribute("x1", String(ox));
    lineB.setAttribute("y1", String(oy));
    lineB.setAttribute("x2", String(ox));
    lineB.setAttribute("y2", String(oy));
    lineC.setAttribute("x2", String(ox));
    lineC.setAttribute("y2", String(oy));

    cancels.push(
      animate(
        500,
        (t) => {
          lineA.setAttribute("x2", String(ox + (aTipX - ox) * t));
          lineA.setAttribute("y2", String(oy + (aTipY - oy) * t));
        },
        () => {
          handleA.setAttribute("opacity", "1");
          cancels.push(
            animate(
              500,
              (t) => {
                lineB.setAttribute("x1", String(aTipX));
                lineB.setAttribute("y1", String(aTipY));
                lineB.setAttribute("x2", String(aTipX + (bTipX - aTipX) * t));
                lineB.setAttribute("y2", String(aTipY + (bTipY - aTipY) * t));
              },
              () => {
                handleB.setAttribute("opacity", "1");
                cancels.push(
                  animate(
                    500,
                    (t) => {
                      lineC.setAttribute("x2", String(ox + (bTipX - ox) * t));
                      lineC.setAttribute("y2", String(oy + (bTipY - oy) * t));
                    },
                    sync,
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
  playEntrance();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Drag either dot — a (blue), b (orange), and a+b (dashed green) all update live.";
  host.appendChild(hint);
  replayButton(host, "↻ Replay", playEntrance);

  return () => {
    stopA();
    stopB();
    cancels.forEach((c) => c());
  };
};

/* 1.3 — click a cell to see its row AND column highlighted at once */
export const renderMatrixGrid: DiagramRender = (host) => {
  const rows = 4,
    cols = 3;
  const cw = 70,
    ch = 44,
    ox = 40,
    oy = 20;
  const s = svg(`0 0 ${ox * 2 + cols * cw} ${oy * 2 + rows * ch}`);
  const sample = [
    [72, 3, 1],
    [65, 2, 0],
    [88, 4, 1],
    [54, 1, 0],
  ];
  const subjects = ["Maths", "Science", "Passed?"];
  const cells: Array<{ rect: SVGRectElement; r: number; c: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rect = el("rect", {
        x: ox + c * cw,
        y: oy + r * ch,
        width: cw - 4,
        height: ch - 4,
        rx: 6,
        fill: "#eef0f7",
        stroke: "#e2e4ee",
        cursor: "pointer",
      });
      const text = el(
        "text",
        {
          x: ox + c * cw + (cw - 4) / 2,
          y: oy + r * ch + (ch - 4) / 2 + 5,
          "font-size": 13,
          fill: "#4a4f63",
          "text-anchor": "middle",
        },
        [],
      );
      text.textContent = String(sample[r][c]);
      text.style.pointerEvents = "none";
      s.appendChild(rect);
      s.appendChild(text);
      cells.push({ rect, r, c });
    }
  }
  host.appendChild(s);

  const out = readout(
    host,
    "Click any cell to see its row (a student) and column (a subject) highlighted.",
  );
  function select(r: number, c: number) {
    cells.forEach((cell) => {
      const inRow = cell.r === r,
        inCol = cell.c === c;
      const on = inRow || inCol;
      cell.rect.setAttribute(
        "fill",
        cell.r === r && cell.c === c ? "#8b93f5" : on ? "#c9d0fb" : "#eef0f7",
      );
      cell.rect.setAttribute("stroke", on ? "#4f5fe0" : "#e2e4ee");
    });
    out.set(
      `Student ${r + 1}, "${subjects[c]}" = ${sample[r][c]}  →  row ${r + 1} is that student's full record, column "${subjects[c]}" is everyone's score for it.`,
    );
  }
  const handlers: Array<() => void> = [];
  cells.forEach((cell) => {
    const fn = () => select(cell.r, cell.c);
    cell.rect.addEventListener("click", fn);
    handlers.push(() => cell.rect.removeEventListener("click", fn));
  });
  select(0, 0);
  return () => handlers.forEach((h) => h());
};

/* 1.4 — editable matrix × vector, recomputes live */
export const renderMatrixMultiply: DiagramRender = (host) => {
  const A = [
    [2, 0],
    [1, 3],
  ];
  const v = [5, 4];

  const row = document.createElement("div");
  row.className = "flex flex-wrap items-center justify-center gap-3";
  host.appendChild(row);

  function numberGrid(
    rows: number,
    cols: number,
    values: number[][],
    onChange: (r: number, c: number, val: number) => void,
  ) {
    const grid = document.createElement("div");
    grid.className = "grid gap-1 rounded-lg border border-border bg-card p-2";
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0,1fr))`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const input = document.createElement("input");
        input.type = "number";
        input.value = String(values[r][c]);
        input.className =
          "h-9 w-12 rounded border border-border bg-background text-center text-[13px] text-foreground";
        input.addEventListener("input", () => onChange(r, c, Number(input.value) || 0));
        grid.appendChild(input);
      }
    }
    return grid;
  }

  const aGrid = numberGrid(2, 2, A, (r, c, val) => {
    A[r][c] = val;
    recompute();
  });
  const times = document.createElement("span");
  times.className = "text-[20px] text-muted-foreground";
  times.textContent = "×";
  const vGrid = numberGrid(2, 1, [[v[0]], [v[1]]], (r, _c, val) => {
    v[r] = val;
    recompute();
  });
  const eq = document.createElement("span");
  eq.className = "text-[20px] text-muted-foreground";
  eq.textContent = "=";
  const resultGrid = document.createElement("div");
  resultGrid.className = "grid gap-1 rounded-lg border border-primary/40 bg-primary/5 p-2";

  row.appendChild(aGrid);
  row.appendChild(times);
  row.appendChild(vGrid);
  row.appendChild(eq);
  row.appendChild(resultGrid);

  function recompute() {
    const result = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
    resultGrid.innerHTML = "";
    result.forEach((n) => {
      const cell = document.createElement("div");
      cell.className =
        "flex h-9 w-12 items-center justify-center rounded border border-primary/30 bg-background text-[13px] font-medium text-primary";
      cell.textContent = fmt(n);
      resultGrid.appendChild(cell);
    });
  }
  recompute();

  const hint = document.createElement("p");
  hint.className = "mt-2.5 text-center text-[12px] text-muted-foreground";
  hint.textContent = "Edit any number in A or v — the result recomputes instantly.";
  host.appendChild(hint);
};

/* 1.5 — editable matrix, animated transpose on demand */
export const renderTranspose: DiagramRender = (host) => {
  let M = [
    [1, 2, 3],
    [4, 5, 6],
  ];
  const cw = 56,
    ch = 44,
    ox = 30,
    oy = 20;
  const s = svg("0 0 300 220");
  host.appendChild(s);

  const editRow = document.createElement("div");
  editRow.className = "mb-3 grid grid-cols-3 gap-1.5";
  const inputs: HTMLInputElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const input = document.createElement("input");
      input.type = "number";
      input.value = String(M[r][c]);
      input.className =
        "h-8 w-12 rounded border border-border bg-background text-center text-[12.5px] text-foreground";
      input.addEventListener("input", () => {
        M[r][c] = Number(input.value) || 0;
        draw();
      });
      inputs.push(input);
    }
  }
  inputs.forEach((i) => editRow.appendChild(i));
  host.insertBefore(editRow, s);

  let cells: Array<{
    rect: SVGRectElement;
    text: SVGTextElement;
    from: { x: number; y: number };
    to: { x: number; y: number };
  }> = [];
  const cancels: Array<() => void> = [];

  function draw() {
    s.innerHTML = "";
    cells = [];
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        const x0 = ox + c * cw,
          y0 = oy + r * ch;
        const rect = el("rect", {
          x: x0,
          y: y0,
          width: cw - 6,
          height: ch - 6,
          rx: 6,
          fill: "#eef0f7",
          stroke: "#e2e4ee",
        });
        const text = el(
          "text",
          {
            x: x0 + (cw - 6) / 2,
            y: y0 + (ch - 6) / 2 + 5,
            "font-size": 13,
            "text-anchor": "middle",
            fill: "#4a4f63",
          },
          [],
        );
        text.textContent = String(M[r][c]);
        s.appendChild(rect);
        s.appendChild(text);
        cells.push({
          rect,
          text,
          from: { x: x0, y: y0 },
          to: { x: ox + r * cw, y: oy + 70 + c * ch },
        });
      }
  }
  draw();

  function play() {
    draw();
    cancels.push(
      animate(900, (t) => {
        cells.forEach((cell) => {
          const x = cell.from.x + (cell.to.x - cell.from.x) * t;
          const y = cell.from.y + (cell.to.y - cell.from.y) * t;
          cell.rect.setAttribute("x", String(x));
          cell.rect.setAttribute("y", String(y));
          cell.text.setAttribute("x", String(x + (cw - 6) / 2));
          cell.text.setAttribute("y", String(y + (ch - 6) / 2 + 5));
        });
      }),
    );
  }
  play();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent = "Edit the matrix above, then replay to watch your own matrix transpose.";
  host.appendChild(hint);
  replayButton(host, "↻ Transpose it", play);

  return () => {
    cancels.forEach((c) => c());
    M = [];
  };
};

/* 1.6 — sliders control a real (triangular) matrix; eigenvector direction computed live */
export const renderEigenField: DiagramRender = (host) => {
  const s = svg("0 0 320 320");
  const cx = 160,
    cy = 160,
    R = 90;
  const N = 16;
  let b = 0.5,
    d = 0.6;
  const a = 1.7; // fixed; matrix is [[a,b],[0,d]] so eigenvalues are always exactly a and d

  const arrows: Array<{ line: SVGLineElement; angle: number }> = [];
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2;
    const markerId = "arr-eig-" + i;
    s.appendChild(arrowDefs(markerId, "#c2c6db"));
    const line = el("line", {
      x1: cx,
      y1: cy,
      x2: cx,
      y2: cy,
      stroke: "#c2c6db",
      "stroke-width": 1.75,
      "marker-end": `url(#${markerId})`,
    });
    s.appendChild(line);
    arrows.push({ line, angle });
  }
  s.appendChild(arrowDefs("arr-eig1", "#4f5fe0"));
  s.appendChild(arrowDefs("arr-eig2", "#1f8a5f"));
  const eig1 = el("line", {
    x1: cx,
    y1: cy,
    x2: cx,
    y2: cy,
    stroke: "#4f5fe0",
    "stroke-width": 3,
    "marker-end": "url(#arr-eig1)",
  });
  const eig2 = el("line", {
    x1: cx,
    y1: cy,
    x2: cx,
    y2: cy,
    stroke: "#1f8a5f",
    "stroke-width": 3,
    "marker-end": "url(#arr-eig2)",
  });
  s.appendChild(eig1);
  s.appendChild(eig2);
  host.appendChild(s);

  const out = readout(host, "");

  function apply(x0: number, y0: number) {
    const x1 = a * x0 + b * y0,
      y1 = 0 * x0 + d * y0;
    return { x: x1, y: y1 };
  }
  function draw() {
    arrows.forEach((ar) => {
      const x0 = Math.cos(ar.angle) * R,
        y0 = Math.sin(ar.angle) * R;
      const p = apply(x0, y0);
      const norm = Math.hypot(p.x, p.y) || 1;
      const len = Math.min(R * 1.1, norm);
      ar.line.setAttribute("x2", String(cx + (p.x / norm) * len));
      ar.line.setAttribute("y2", String(cy + (p.y / norm) * len));
    });
    // eigenvector 1: [1,0], eigenvalue = a (always exact for this triangular form)
    eig1.setAttribute("x2", String(cx + R * (a >= 0 ? 1 : -1) * 0.75));
    eig1.setAttribute("y2", String(cy));
    // eigenvector 2: direction [b, d-a] (or [1,0] if b≈0), eigenvalue = d
    let ex = b,
      ey = d - a;
    if (Math.abs(ex) < 1e-6 && Math.abs(ey) < 1e-6) {
      ex = 1;
      ey = 0;
    }
    const eNorm = Math.hypot(ex, ey) || 1;
    eig2.setAttribute("x2", String(cx + (ex / eNorm) * R * 0.75));
    eig2.setAttribute("y2", String(cy - (ey / eNorm) * R * 0.75));
    out.set(
      `Blue eigenvector: eigenvalue λ₁ = ${fmt(a)}   Green eigenvector: eigenvalue λ₂ = ${fmt(d)}`,
    );
  }
  draw();

  sliderControl(host, "Shear (b)", { min: -1.5, max: 1.5, step: 0.05, value: b }, (v) => {
    b = v;
    draw();
  });
  sliderControl(host, "Stretch y (d)", { min: -1.5, max: 1.8, step: 0.05, value: d }, (v) => {
    d = v;
    draw();
  });

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Drag the sliders — every grey arrow rotates and stretches, but the blue and green eigenvectors never change direction, only length.";
  host.appendChild(hint);
};

/* 1.7 — draggable endpoint; L1 (staircase) vs L2 (straight line) recompute live */
export const renderNormsRace: DiagramRender = (host) => {
  const s = svg("0 0 300 220");
  const x1 = 40,
    y1 = 180;
  let x2 = 240,
    y2 = 40;
  s.appendChild(arrowDefs("arr-l2", "#1f8a5f"));
  const l2 = el("line", {
    x1,
    y1,
    x2,
    y2,
    stroke: "#1f8a5f",
    "stroke-width": 2.5,
    "marker-end": "url(#arr-l2)",
  });
  const path = el("path", { d: "", fill: "none", stroke: "#b8720c", "stroke-width": 2.5 });
  s.appendChild(path);
  s.appendChild(l2);
  s.appendChild(el("circle", { cx: x1, cy: y1, r: 4, fill: "#4a4f63" }));
  const handle = dragHandle(x2, y2, "#4a4f63");
  s.appendChild(handle);
  host.appendChild(s);

  const out = readout(host, "");
  function sync() {
    path.setAttribute("d", `M${x1},${y1} L${x2},${y1} L${x2},${y2}`);
    l2.setAttribute("x2", String(x2));
    l2.setAttribute("y2", String(y2));
    handle.setAttribute("cx", String(x2));
    handle.setAttribute("cy", String(y2));
    const dx = (x2 - x1) / 20,
      dy = (y1 - y2) / 20;
    const l1 = Math.abs(dx) + Math.abs(dy);
    const l2n = Math.hypot(dx, dy);
    out.set(`v = [${fmt(dx)}, ${fmt(dy)}]   L1 = ${fmt(l1)}   L2 = ${fmt(l2n)}`);
  }
  const stop = makeDraggable(handle, s, (p) => {
    x2 = Math.max(x1 + 10, Math.min(290, p.x));
    y2 = Math.max(10, Math.min(y1 - 10, p.y));
    sync();
  });
  sync();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Drag the endpoint — orange is the L1 (city-block) path, green is the L2 (straight-line) distance.";
  host.appendChild(hint);

  return () => stop();
};

/* 1.8 — two draggable vectors; rank/span computed live from the real determinant */
export const renderSpanComparison: DiagramRender = (host) => {
  const s = svg("0 0 320 260");
  const cx = 160,
    cy = 130,
    R = 80;
  s.appendChild(
    el("line", {
      x1: cx - 130,
      y1: cy,
      x2: cx + 130,
      y2: cy,
      stroke: "#e2e4ee",
      "stroke-width": 1,
    }),
  );
  s.appendChild(
    el("line", {
      x1: cx,
      y1: cy - 110,
      x2: cx,
      y2: cy + 110,
      stroke: "#e2e4ee",
      "stroke-width": 1,
    }),
  );
  s.appendChild(arrowDefs("sp-1", "#4f5fe0"));
  s.appendChild(arrowDefs("sp-2", "#b8720c"));
  let a1 = 0.3,
    a2 = 0.5;
  const line1 = el("line", {
    x1: cx,
    y1: cy,
    x2: cx,
    y2: cy,
    stroke: "#4f5fe0",
    "stroke-width": 2.5,
    "marker-end": "url(#sp-1)",
  });
  const line2 = el("line", {
    x1: cx,
    y1: cy,
    x2: cx,
    y2: cy,
    stroke: "#b8720c",
    "stroke-width": 2.5,
    "marker-end": "url(#sp-2)",
  });
  const spanLine = el("line", {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: "#8b93f5",
    "stroke-width": 6,
    opacity: 0.25,
  });
  s.appendChild(spanLine);
  s.appendChild(line1);
  s.appendChild(line2);
  const h1 = dragHandle(cx, cy, "#4f5fe0");
  const h2 = dragHandle(cx, cy, "#b8720c");
  s.appendChild(h1);
  s.appendChild(h2);
  host.appendChild(s);

  const out = readout(host, "");
  function sync() {
    const p1 = { x: cx + Math.cos(a1) * R, y: cy - Math.sin(a1) * R };
    const p2 = { x: cx + Math.cos(a2) * R, y: cy - Math.sin(a2) * R };
    line1.setAttribute("x2", String(p1.x));
    line1.setAttribute("y2", String(p1.y));
    line2.setAttribute("x2", String(p2.x));
    line2.setAttribute("y2", String(p2.y));
    h1.setAttribute("cx", String(p1.x));
    h1.setAttribute("cy", String(p1.y));
    h2.setAttribute("cx", String(p2.x));
    h2.setAttribute("cy", String(p2.y));

    const det = Math.cos(a1) * Math.sin(a2) - Math.cos(a2) * Math.sin(a1);
    const parallel = Math.abs(det) < 0.06;
    if (parallel) {
      spanLine.setAttribute("x1", String(cx - Math.cos(a1) * 140));
      spanLine.setAttribute("y1", String(cy + Math.sin(a1) * 140));
      spanLine.setAttribute("x2", String(cx + Math.cos(a1) * 140));
      spanLine.setAttribute("y2", String(cy - Math.sin(a1) * 140));
      spanLine.setAttribute("opacity", "0.25");
    } else {
      spanLine.setAttribute("opacity", "0");
    }
    out.set(
      parallel
        ? `determinant ≈ ${fmt(det)} → nearly parallel → spans only a LINE (rank 1, redundant)`
        : `determinant ≈ ${fmt(det)} → independent → spans the whole PLANE (rank 2)`,
    );
  }
  const stop1 = makeDraggable(h1, s, (p) => {
    a1 = Math.atan2(cy - p.y, p.x - cx);
    sync();
  });
  const stop2 = makeDraggable(h2, s, (p) => {
    a2 = Math.atan2(cy - p.y, p.x - cx);
    sync();
  });
  sync();

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Drag either vector around the circle — watch the span (and its rank) change live.";
  host.appendChild(hint);

  return () => {
    stop1();
    stop2();
  };
};

/* 1.9 — SVD: scrub a slider through rotate → stretch → rotate */
export const renderSvdMorph: DiagramRender = (host) => {
  const s = svg("0 0 320 260");
  const cx = 160,
    cy = 130,
    R = 70;
  const N = 24;
  const pts: Array<{ c: SVGCircleElement; a: number }> = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c = el("circle", {
      cx: cx + Math.cos(a) * R,
      cy: cy + Math.sin(a) * R,
      r: 3,
      fill: "#4f5fe0",
    });
    s.appendChild(c);
    pts.push({ c, a });
  }
  const stepLabel = el(
    "text",
    { x: 20, y: 240, "font-size": 13, fill: "#3542b8", "font-weight": 700 },
    [],
  );
  s.appendChild(stepLabel);
  host.appendChild(s);

  function setPoints(fn: (a: number) => { x: number; y: number }) {
    pts.forEach((p) => {
      const { x, y } = fn(p.a);
      p.c.setAttribute("cx", String(cx + x));
      p.c.setAttribute("cy", String(cy + y));
    });
  }
  function rotate(a: number, theta: number) {
    return { x: Math.cos(a + theta) * R, y: Math.sin(a + theta) * R };
  }

  function frame(t: number) {
    // t in [0,3]: 0-1 rotate Vᵀ, 1-2 stretch Σ, 2-3 rotate U
    if (t <= 1) {
      stepLabel.textContent = "Step 1: rotate (Vᵀ)";
      setPoints((a) => rotate(a, t * 0.6));
    } else if (t <= 2) {
      stepLabel.textContent = "Step 2: stretch (Σ)";
      const p = t - 1;
      const sx = 1 + p * 0.7,
        sy = 1 - p * 0.5;
      setPoints((a) => {
        const r0 = rotate(a, 0.6);
        return { x: (r0.x / R) * R * sx, y: (r0.y / R) * R * sy };
      });
    } else {
      stepLabel.textContent = t >= 3 ? "Done — that's A = UΣVᵀ" : "Step 3: rotate (U)";
      const p = t - 2;
      const theta2 = p * -0.9;
      setPoints((a) => {
        const r0 = rotate(a, 0.6);
        const ex = (r0.x / R) * R * 1.7,
          ey = (r0.y / R) * R * 0.5;
        const ct = Math.cos(theta2),
          st = Math.sin(theta2);
        return { x: ex * ct - ey * st, y: ex * st + ey * ct };
      });
    }
  }
  frame(0);

  const slider = sliderControl(
    host,
    "Scrub A = UΣVᵀ",
    { min: 0, max: 3, step: 0.02, value: 0 },
    frame,
  );

  const hint = document.createElement("p");
  hint.className = "mt-2 text-center text-[12px] text-muted-foreground";
  hint.textContent =
    "Drag the slider yourself to move through each stage of the decomposition at your own pace.";
  host.appendChild(hint);

  const cancels: Array<() => void> = [];
  function playAuto() {
    cancels.push(
      animate(2400, (t) => {
        frame(t * 3);
        slider.value = String(t * 3);
      }),
    );
  }
  playAuto();
  replayButton(host, "↻ Replay", playAuto);

  return () => cancels.forEach((c) => c());
};
