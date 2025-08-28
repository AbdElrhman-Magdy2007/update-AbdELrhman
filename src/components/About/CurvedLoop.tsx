"use client";

import {
  useRef,
  useLayoutEffect,
  useEffect,
  useState,
  useMemo,
  useId,
  FC,
} from "react";
import "./CurvedLoop.css";

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number; // pixels per frame
  className?: string;
  curveAmount?: number;
  direction?: "left" | "right";
  interactive?: boolean;
  gradient?: [string, string];
  minHeight?: number;
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = "Clean Code ✦ Fast Delivery ✦ Modern UI ✦ Scalable Apps",
  speed = 1.8,
  className = "",
  curveAmount = 300,
  direction = "left",
  interactive = true,
  gradient = ["#818cf8", "#a855f7"],
  minHeight = 360,
}) => {
  const uid = useId();
  const pathId = `curve-${uid}`;
  const gradId = `grad-${uid}`;

  const baseY = 40;
  const viewBoxHeight = Math.max(180, baseY + curveAmount + 140);

  // Make path wide so text can flow off-screen and re-enter smoothly
  const pathD = `M-200,${baseY + curveAmount} Q720,40 1840,${baseY + curveAmount}`;

  const measureRef = useRef<SVGTextElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const textPathRefs = useRef<Array<SVGTextPathElement | null>>([]);

  // runtime offsets stored in ref for smooth animation without rerender
  const offsetsRef = useRef<number[]>([]);

  // drag & interaction refs
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const velRef = useRef(0);
  const dirRef = useRef<"left" | "right">(direction);

  const [spacing, setSpacing] = useState(0); // measured text width + gap
  const [pathLength, setPathLength] = useState(0);
  const [repeats, setRepeats] = useState(0);
  const [ready, setReady] = useState(false);

  const text = useMemo(() => {
    const t = marqueeText.trim();
    return t.length ? `${t}\u00A0` : "\u00A0";
  }, [marqueeText]);

  // Measure text width and path length (reliable: wait for fonts + resize observer)
  useLayoutEffect(() => {
    let cancelled = false;
    const measureAll = async () => {
      try {
        if ((document as any).fonts?.ready) {
          await (document as any).fonts.ready;
        }
      } catch {}
      if (cancelled) return;

      let measured = 0;
      try {
        if (measureRef.current) measured = measureRef.current.getComputedTextLength();
      } catch {
        measured = 0;
      }
      // gap to avoid butt-join; tweak percentage as needed
      const gap = Math.max(12, measured * 0.08);
      const finalSpacing = measured + gap;

      let pLen = 0;
      try {
        if (pathRef.current) pLen = pathRef.current.getTotalLength();
      } catch {
        pLen = 0;
      }

      if (cancelled) return;

      setSpacing(finalSpacing || 0);
      setPathLength(pLen || 0);

      const r = finalSpacing && pLen ? Math.max(4, Math.ceil(pLen / finalSpacing) + 2) : 0;
      setRepeats(r);
      setReady(Boolean(r && finalSpacing));
    };

    measureAll();

    // observe resize of the measure text or window to re-measure
    const ro = typeof ResizeObserver !== "undefined" && measureRef.current
      ? new ResizeObserver(() => measureAll())
      : null;
    if (ro && measureRef.current) ro.observe(measureRef.current);

    window.addEventListener("resize", measureAll);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", measureAll);
      if (ro && measureRef.current) ro.disconnect();
    };
  }, [text, curveAmount]);

  // prepare initial offsets when spacing/repeats change
  useEffect(() => {
    if (!spacing || !repeats) {
      offsetsRef.current = [];
      return;
    }
    offsetsRef.current = Array.from({ length: repeats }).map((_, i) => i * spacing);
    // set DOM startOffset immediately for each textPath if available
    offsetsRef.current.forEach((off, idx) => {
      const el = textPathRefs.current[idx];
      if (el) el.setAttribute("startOffset", `${off}px`);
    });
  }, [spacing, repeats]);

  // animation loop: modify startOffset for each textPath (no rerender)
  useEffect(() => {
    if (!spacing || repeats <= 0) return;
    let raf = 0;

    const totalSpan = repeats * spacing;

    const loop = () => {
      const delta = !draggingRef.current
        ? dirRef.current === "right"
          ? Math.abs(speed)
          : -Math.abs(speed)
        : 0;

      for (let i = 0; i < repeats; i++) {
        // ensure offsetsRef length
        if (typeof offsetsRef.current[i] !== "number") offsetsRef.current[i] = i * spacing;

        offsetsRef.current[i] += delta;

        // wrap within [ -spacing, totalSpan + spacing ]
        if (offsetsRef.current[i] < -spacing) offsetsRef.current[i] += totalSpan;
        if (offsetsRef.current[i] > totalSpan + spacing) offsetsRef.current[i] -= totalSpan;

        const el = textPathRefs.current[i];
        if (el) el.setAttribute("startOffset", `${offsetsRef.current[i]}px`);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [spacing, repeats, speed]);

  // pointer handlers (drag)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || !draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;

    // move offsets immediately for instant feedback while dragging
    const totalSpan = repeats * spacing;
    for (let i = 0; i < repeats; i++) {
      if (typeof offsetsRef.current[i] !== "number") offsetsRef.current[i] = i * spacing;
      offsetsRef.current[i] += dx;
      if (offsetsRef.current[i] < -spacing) offsetsRef.current[i] += totalSpan;
      if (offsetsRef.current[i] > totalSpan + spacing) offsetsRef.current[i] -= totalSpan;
      const el = textPathRefs.current[i];
      if (el) el.setAttribute("startOffset", `${offsetsRef.current[i]}px`);
    }

    dirRef.current = dx > 0 ? "right" : "left";
  };

  const onPointerUp = () => {
    if (!interactive) return;
    draggingRef.current = false;
    // velocity-based direction is already set in onPointerMove
  };

  const cursor = interactive ? (draggingRef.current ? "grabbing" : "grab") : "default";

  return (
    <div
      className="curved-loop-container"
      style={{
        cursor,
        minHeight: Math.max(minHeight, curveAmount + 240),
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      aria-hidden={false}
    >
      <svg
        className="curved-loop-svg"
        viewBox={`0 0 1440 ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <path ref={pathRef} id={pathId} d={pathD} fill="none" stroke="transparent" />

          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradient[0]}>
              <animate
                attributeName="stop-color"
                values={`${gradient[0]};${gradient[1]};${gradient[0]}`}
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={gradient[1]}>
              <animate
                attributeName="stop-color"
                values={`${gradient[1]};${gradient[0]};${gradient[1]}`}
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          {/* Hidden measuring text */}
          <text
            ref={measureRef}
            xmlSpace="preserve"
            fontSize="clamp(28px, 6.8vw, 84px)"
            style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}
          >
            {text}
          </text>
        </defs>

        {/* Fallback single static path while measuring */}
        {!ready && (
          <text
            fontSize="clamp(28px, 6.8vw, 84px)"
            fontWeight={800}
            style={{
              fill: `url(#${gradId})`,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.45))",
            }}
          >
            <textPath href={`#${pathId}`} startOffset="10%">
              {text.repeat(3)}
            </textPath>
          </text>
        )}

        {/* Ready: render repeated <textPath> elements (no <tspan>) */}
        {ready && (
          <g>
            {Array.from({ length: repeats }).map((_, i) => (
              <text
                key={i}
                fontSize="clamp(90px, 6.8vw, 70px)"
                fontWeight={800}
                style={{
                  fill: `url(#${gradId})`,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  filter:
                    "drop-shadow(0 6px 14px rgba(0,0,0,0.45)) drop-shadow(0 0 18px rgba(255,255,255,0.06))",
                }}
              >
                <textPath
                  href={`#${pathId}`}
                  ref={(el) => {
                    textPathRefs.current[i] = el;
                  }}
                  startOffset={`${i * spacing}px`}
                >
                  {text}
                </textPath>
              </text>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};

export default CurvedLoop;
