const NS = "http://www.w3.org/2000/svg";

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
  children?: SVGElement[],
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag) as SVGElementTagNameMap[K];
  if (attrs) for (const k in attrs) node.setAttribute(k, String(attrs[k]));
  (children || []).forEach((c) => node.appendChild(c));
  return node;
}

export function svg(viewBox: string, attrs?: Record<string, string | number>) {
  return el("svg", {
    viewBox,
    xmlns: NS,
    style: "width:100%;height:auto;display:block",
    ...(attrs || {}),
  });
}

export function arrowDefs(id: string, color: string) {
  const marker = el(
    "marker",
    { id, markerWidth: 8, markerHeight: 8, refX: 4, refY: 4, orient: "auto" },
    [el("path", { d: "M0,0 L8,4 L0,8 Z", fill: color })],
  );
  return el("defs", {}, [marker]);
}

export const ease = {
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  linear: (t: number) => t,
};

/** Runs a callback every frame for `duration` ms with progress 0..1. Returns a cancel function. */
export function animate(
  duration: number,
  onFrame: (eased: number, t: number) => void,
  onDone?: () => void,
  easeFn: (t: number) => number = ease.inOutCubic,
) {
  const start = performance.now();
  let raf: number;
  function frame(now: number) {
    const t = Math.min(1, (now - start) / duration);
    onFrame(easeFn(t), t);
    if (t < 1) raf = requestAnimationFrame(frame);
    else if (onDone) onDone();
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

export function replayButton(host: HTMLElement, label: string, onClick: () => void) {
  const div = document.createElement("div");
  div.className = "flex justify-center mt-2";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "rounded border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-primary hover:border-primary transition-colors";
  btn.textContent = label || "↻ Replay";
  btn.addEventListener("click", onClick);
  div.appendChild(btn);
  host.appendChild(div);
  return btn;
}

/** Converts a pointer/mouse client position into SVG user-space coordinates. */
export function toSvgPoint(svgEl: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/**
 * Makes an SVG element draggable. `onDrag` receives live SVG-space coordinates
 * on pointerdown and every pointermove until release. Returns a cleanup fn.
 */
export function makeDraggable(
  handle: SVGElement,
  svgEl: SVGSVGElement,
  onDrag: (p: { x: number; y: number }) => void,
) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    (
      handle as unknown as SVGElement & { setPointerCapture: (id: number) => void }
    ).setPointerCapture(e.pointerId);
    handle.style.cursor = "grabbing";
    onDrag(toSvgPoint(svgEl, e.clientX, e.clientY));
    const onMove = (ev: PointerEvent) => onDrag(toSvgPoint(svgEl, ev.clientX, ev.clientY));
    const onUp = () => {
      handle.style.cursor = "grab";
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  }
  handle.addEventListener("pointerdown", onPointerDown);
  return () => handle.removeEventListener("pointerdown", onPointerDown);
}

/** A draggable circular handle, styled consistently across diagrams. */
export function dragHandle(cx: number, cy: number, color: string) {
  return el("circle", {
    cx,
    cy,
    r: 8,
    fill: color,
    stroke: "white",
    "stroke-width": 2,
    class: "drop-shadow-sm",
  });
}

/** A small HTML slider control appended below an SVG diagram. */
export function sliderControl(
  host: HTMLElement,
  label: string,
  opts: { min: number; max: number; step: number; value: number },
  onInput: (value: number) => void,
) {
  const wrap = document.createElement("div");
  wrap.className =
    "mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground";
  const span = document.createElement("span");
  span.className = "min-w-[90px] shrink-0 text-left";
  span.textContent = label;
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(opts.min);
  input.max = String(opts.max);
  input.step = String(opts.step);
  input.value = String(opts.value);
  input.className = "flex-1 accent-primary";
  input.addEventListener("input", () => onInput(Number(input.value)));
  wrap.appendChild(span);
  wrap.appendChild(input);
  host.appendChild(wrap);
  return input;
}

/** A live-updating readout line appended below an SVG diagram. */
export function readout(host: HTMLElement, initial: string) {
  const p = document.createElement("p");
  p.className = "mt-2.5 text-center font-mono text-[13px] text-foreground";
  p.textContent = initial;
  host.appendChild(p);
  return {
    set(text: string) {
      p.textContent = text;
    },
  };
}
