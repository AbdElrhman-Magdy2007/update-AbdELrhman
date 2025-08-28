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
  className?: string;
  enableGlow?: boolean;
  glowColor?: string;
  glowIntensity?: number;
  enableFastAppearance?: boolean;
  proximityThreshold?: number;
}

const ScrollStack: React.FC<ScrollStackProps> = ({ 
  children, 
  className = "",
  enableGlow = true,
  glowColor = "168, 85, 247",
  glowIntensity = 1,
  enableFastAppearance = true,
  proximityThreshold = 0.8
}) => {
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const activeCardIndex = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const childrenArray = Children.toArray(children);

  /** 🔹 Ultra-fast professional scroll-triggered animation with enhanced proximity detection */
  const applyCardEffects = useCallback(() => {
    const viewportCenter = window.innerHeight / 2;
    const dynamicProximityThreshold = window.innerHeight * proximityThreshold; // Configurable proximity
    let newActiveIndex = -1;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - centerY);
      
      // Enhanced proximity-based animation with faster response
      const proximityProgress = Math.min(1, distance / dynamicProximityThreshold);
      const isInProximity = distance < dynamicProximityThreshold;
      
      // Ultra-fast appearance with enhanced easing
      let scale: number;
      let opacity: number;
      
      if (isInProximity) {
        // 🌟 REVOLUTIONARY MAGNETIC ATTRACTION SYSTEM 🌟
        const magneticProgress = 1 - Math.pow(proximityProgress, enableFastAppearance ? 0.6 : 1.0);
        const attractionForce = magneticProgress * magneticProgress * (3 - 2 * magneticProgress); // Smoothstep
        
        // 🎭 DRAMATIC SCALING WITH MAGNETIC PULL
        scale = 0.7 + (attractionForce * 0.3); // Scale from 0.7 to 1.0 for dramatic appearance
        opacity = Math.max(0.4, attractionForce * 1.2); // Dynamic opacity for mystery effect
        
        // 🌈 DYNAMIC ROTATION BASED ON SCROLL DIRECTION
        const rotationIntensity = attractionForce * 8;
        card.style.setProperty("--rotate-x", `${rotationIntensity * Math.sin(Date.now() * 0.002)}deg`);
        card.style.setProperty("--rotate-y", `${rotationIntensity * Math.cos(Date.now() * 0.002)}deg`);
        
        // ✨ PULSING GLOW EFFECT
        const glowIntensity = attractionForce * 50;
        card.style.setProperty("--glow-intensity", `${glowIntensity}px`);
        
        // 🎨 DYNAMIC COLOR SHIFTING
        const hueShift = attractionForce * 60;
        card.style.setProperty("--hue-shift", `${hueShift}deg`);
        
        card.style.setProperty("--blur", "0px");
      } else {
        // 🌙 DORMANT STATE WITH SUBTLE PRESENCE
        scale = enableFastAppearance ? 0.7 : 0.65; // Lower dormant scale for dramatic contrast
        opacity = enableFastAppearance ? 0.4 : 0.3; // Lower dormant opacity for mystery
        card.style.setProperty("--rotate-x", "0deg");
        card.style.setProperty("--rotate-y", "0deg");
        card.style.setProperty("--glow-intensity", "0px");
        card.style.setProperty("--hue-shift", "0deg");
        card.style.setProperty("--blur", "0px");
      }
      
      // 🎯 REVOLUTIONARY CHANGE DETECTION - Responds to micro-movements
      const currentScale = parseFloat(card.style.getPropertyValue("--scale") || "0.7");
      const currentOpacity = parseFloat(card.style.getPropertyValue("--opacity") || "0.4");
      
      // 🌟 ULTRA-SENSITIVE DETECTION - Every pixel matters
      if (Math.abs(currentScale - scale) > 0.002 || 
          Math.abs(currentOpacity - opacity) > 0.002) {
        card.style.setProperty("--scale", scale.toString());
        card.style.setProperty("--opacity", opacity.toString());
      }

      // 🎯 REVOLUTIONARY ACTIVATION SYSTEM
      const isActive = distance < window.innerHeight * 0.2 && scale > 0.9;
      const isMagnetic = scale > 0.85;
      const wasActive = card.classList.contains("is-active");
      
      // 🌟 DRAMATIC VISIBILITY SYSTEM
      const isVisible = scale > (enableFastAppearance ? 0.75 : 0.7);
      const wasVisible = card.classList.contains("visible");
      const isFirstTime = !card.classList.contains("has-appeared");
      
      if (isVisible && !wasVisible) {
        card.classList.add("visible");
        
        if (isFirstTime) {
          card.classList.add("first-appearance", "has-appeared");
          setTimeout(() => {
            card.classList.remove("first-appearance");
            if (isMagnetic) {
              card.classList.add("magnetic-active");
            }
          }, enableFastAppearance ? 1200 : 1500); // 🎭 DRAMATIC first appearance
        } else {
          card.classList.add("entering");
          setTimeout(() => {
            card.classList.remove("entering");
            if (isMagnetic) {
              card.classList.add("magnetic-active");
            }
          }, enableFastAppearance ? 800 : 1000); // 🌟 ELEGANT re-entrance
        }
      } else if (!isVisible && wasVisible) {
        card.classList.remove("visible", "magnetic-active");
      }
      
      // 🧲 DYNAMIC MAGNETIC STATE MANAGEMENT
      if (isMagnetic && !card.classList.contains("magnetic-active") && card.classList.contains("visible")) {
        card.classList.add("magnetic-active");
      } else if (!isMagnetic && card.classList.contains("magnetic-active")) {
        card.classList.remove("magnetic-active");
      }

      if (isActive !== wasActive) {
        card.classList.toggle("is-active", isActive);
        
        // ⚡ INSTANT CONTENT REVEAL - No delay for maximum speed
        if (isActive) {
          setTimeout(() => {
            card.classList.add("show-content");
          }, enableFastAppearance ? 30 : 80); // INSTANT content reveal
        } else {
          card.classList.remove("show-content");
        }
      }

      if (isActive) newActiveIndex = i;
    });

    // Lightning-fast snap effect with enhanced timing
    if (newActiveIndex !== -1 && newActiveIndex !== activeCardIndex.current) {
      const activeCard = cardRefs.current[newActiveIndex];
      if (activeCard) {
        activeCard.classList.add("is-snapping");
        setTimeout(() => {
          activeCard.classList.remove("is-snapping");
        }, enableFastAppearance ? 150 : 300); // 🚀 INSTANT snap effect
      }
      activeCardIndex.current = newActiveIndex;
    }
  }, [enableGlow, glowColor, glowIntensity, enableFastAppearance, proximityThreshold]);

  /** 🔹 Simple scrollbar visibility system */
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleScrollbarVisibility = useCallback(() => {
    // Show scrollbar during scroll
    document.body.classList.add('scrolling');
    
    // Hide scrollbar after scroll ends
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      document.body.classList.remove('scrolling');
    }, 1000);
  }, []);

  /** 🔹 Enhanced scroll handler with scrollbar management */
  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(applyCardEffects);
    handleScrollbarVisibility();
  }, [applyCardEffects, handleScrollbarVisibility]);



  /** 🔹 Enhanced Mouse Effects (3D tilt + cursor tracking) */
  const attachMouseEffects = useCallback((card: HTMLDivElement) => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // 3D tilt effect
      const tiltX = (y - 0.5) * -25;
      const tiltY = (x - 0.5) * 25;
      
      // Cursor tracking for glow effect
      const mouseX = x * 100;
      const mouseY = y * 100;

      card.style.setProperty("--rotate-x", `${tiltX}deg`);
      card.style.setProperty("--rotate-y", `${tiltY}deg`);
      card.style.setProperty("--mouse-x", `${mouseX}%`);
      card.style.setProperty("--mouse-y", `${mouseY}%`);
      card.style.setProperty("--transition-duration", "0.1s");
      
      // Add hover class for enhanced effects
      card.classList.add("is-hovering");
    };

    const handleMouseEnter = () => {
      card.classList.add("is-hovering");
      card.style.setProperty("--transition-duration", "0.3s");
    };

    const handleMouseLeave = () => {
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
      card.style.setProperty("--transition-duration", "0.6s");
      card.classList.remove("is-hovering");
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  /** 🔹 Attach event listeners */
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, childrenArray.length);

    // Add mouse effects to all cards
    const cleanups = cardRefs.current
      .map((card) => card && attachMouseEffects(card))
      .filter(Boolean) as (() => void)[];

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });
    applyCardEffects();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      document.body.classList.remove('scrolling');
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [childrenArray.length, handleScroll, applyCardEffects, attachMouseEffects]);

  return (
    <div className={`scroll-stack-container mt-20 ${className}`.trim()}>
      {childrenArray.map((child, i) => (
        <div key={i} className="scroll-stack-card-wrapper mt-20">
          <div
            className="scroll-stack-card"
            tabIndex={0}
            role="article"
            aria-label={`Card ${i + 1} of ${childrenArray.length}`}
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
