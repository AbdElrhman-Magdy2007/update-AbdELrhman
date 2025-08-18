"use client";

import React, {
  ReactNode,
  useRef,
  useCallback,
  useEffect,
  Children,
} from "react";
import "./ScrollStack.css";

interface ScrollStackProps {
  children: ReactNode;
}

const ScrollStack: React.FC<ScrollStackProps> = ({ children }) => {
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const activeCardIndex = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const childrenArray = Children.toArray(children);

  /** 🔹 حساب التأثيرات عند السكول */
  const applyCardEffects = useCallback(() => {
    const viewportCenter = window.innerHeight / 2;
    let newActiveIndex = -1;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - centerY);
      const progress = Math.min(1, distance / (viewportCenter * 1.2));

      // استخدام CSS variables
      card.style.setProperty("--scale", `${1 - progress * 0.1}`);
      card.style.setProperty("--opacity", `${1 - Math.pow(progress, 2)}`);

      const isActive =
        Number(card.style.getPropertyValue("--scale")) > 0.98 &&
        Number(card.style.getPropertyValue("--opacity")) > 0.98;

      card.classList.toggle("is-active", isActive);
      card.classList.toggle("show-content", progress < 0.2);

      if (isActive) newActiveIndex = i;
    });

    // سناب على الكارت النشط
    if (newActiveIndex !== -1 && newActiveIndex !== activeCardIndex.current) {
      const activeCard = cardRefs.current[newActiveIndex];
      if (activeCard) {
        activeCard.classList.add("is-snapping");
        activeCard.addEventListener(
          "animationend",
          () => activeCard.classList.remove("is-snapping"),
          { once: true }
        );
      }
      activeCardIndex.current = newActiveIndex;
    }
  }, []);

  /** 🔹 هاندل للسكرول */
  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(applyCardEffects);
  }, [applyCardEffects]);

  /** 🔹 تأثيرات الماوس (3D tilt) */
  const attachMouseEffects = useCallback((card: HTMLDivElement) => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--rotate-x", `${-y * 20}deg`);
      card.style.setProperty("--rotate-y", `${x * 20}deg`);
      card.style.setProperty("--transition-duration", "0.1s");
    };

    const handleMouseLeave = () => {
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
      card.style.setProperty("--transition-duration", "0.4s");
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  /** 🔹 إرفاق الأحداث */
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, childrenArray.length);

    // إضافة مؤثرات الماوس لكل الكروت
    const cleanups = cardRefs.current
      .map((card) => card && attachMouseEffects(card))
      .filter(Boolean) as (() => void)[];

    // إضافة السكول
    window.addEventListener("scroll", handleScroll, { passive: true });
    applyCardEffects();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [childrenArray.length, handleScroll, applyCardEffects, attachMouseEffects]);

  return (
    <div className="scroll-stack-container mt-20">
      {childrenArray.map((child, i) => (
        <div key={i} className="scroll-stack-card-wrapper mt-20">
          <div
            className="scroll-stack-card"
            ref={(el) => {
              if (el) cardRefs.current[i] = el;
            }}
          >
            <div className="card-content">{child}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScrollStack;
