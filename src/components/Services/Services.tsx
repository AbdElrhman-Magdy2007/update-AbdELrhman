"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ContainerScroll } from "@/components/Services/container-scroll-animation";
import GlitchText from "./GlitchText";
import CodeShowcase from "./CodeShowcase";
import { buttonVariants } from "@/components/ui/button";
import clsx from "clsx";

// ✅ Particle Background Optimized
const ParticleBackground = () => {
  const COLORS = ["#5D5FEF", "#EFA6BE", "#F96A6A", "#7EE7D2", "#FFD700"];
  const shouldReduceMotion = useReducedMotion();

  // ⚡ عدد Particles حسب حجم الشاشة
  const particleCount =
    typeof window !== "undefined"
      ? window.innerWidth < 640
        ? 14 // موبايل
        : window.innerWidth < 1024
        ? 24 // تابلت
        : 36 // ديسكتوب
      : 20;

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 4,
        duration: Math.random() * 10 + 6,
        delay: Math.random() * 3,
        opacity: Math.random() * 0.4 + 0.2,
        color: COLORS[i % COLORS.length],
      })),
    [particleCount]
  );

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Small Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full will-change-transform"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            filter: "blur(2px)",
          }}
          animate={{
            x: [p.x, p.x + (Math.random() * 50 - 25), p.x],
            y: [p.y, p.y + (Math.random() * 50 - 25), p.y],
            opacity: [0, p.opacity, 0],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Background Circles */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`pulse-circle-${i}`}
          className="absolute rounded-full border-[2px] shadow-xl"
          style={{
            width: 180 + i * 140,
            height: 180 + i * 140,
            top: `${28 + i * 8}%`,
            left: `${35 + i * 12}%`,
            transform: "translate(-50%, -50%)",
            borderColor: COLORS[i % COLORS.length],
            boxShadow: `0 0 30px ${COLORS[i % COLORS.length]}55`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.25, 0.1, 0.25],
            rotate: [0, 180],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Gradient Overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${COLORS[0]}1A, transparent 60%), radial-gradient(circle at 80% 80%, ${COLORS[2]}1A, transparent 60%)`,
        }}
        animate={{
          opacity: [0.15, 0.3, 0.15],
          x: [-40, 40, -40],
          y: [-20, 20, -20],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

// ✅ Main Section
const Services = () => {
  const [showCode, setShowCode] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [sparkles, setSparkles] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  // Sparkle effect
  const createSparkle = (x: number, y: number) => {
    const id = Date.now();
    setSparkles((prev) => [
      ...prev,
      { id, x: x + Math.random() * 8 - 4, y: y + Math.random() * 8 - 4 },
    ]);
    setTimeout(
      () => setSparkles((prev) => prev.filter((s) => s.id !== id)),
      500
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
        type: "spring",
        stiffness: 90,
        staggerChildren: 0.25,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <section
      id="Code"
      className="relative min-h-screen bg-black py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <ParticleBackground />

      <motion.div
        className="relative z-10 max-w-7xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <ContainerScroll
          titleComponent={
            <motion.div variants={childVariants}>
              <GlitchText
                speed={0.6}
                enableShadows
                className="text-center text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-xl"
              >
                Elite Code Showcase
              </GlitchText>
            </motion.div>
          }
        >
          <motion.img
            src="/images/carbon.png"
            alt="Code Snippet"
            variants={childVariants}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{
              scale: 1.04,
              boxShadow: "0 0 30px rgba(255,255,255,0.2)",
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-full max-w-5xl mx-auto mt-20 object-contain rounded-3xl shadow-2xl border border-white/10"
            draggable={false}
          />
        </ContainerScroll>

        {/* CTA Button */}
        <motion.div
          className="flex justify-center mt-20"
          variants={childVariants}
        >
          <button
            onClick={() => setShowCode((prev) => !prev)}
            onMouseEnter={(e) => {
              setHovered(true);
              createSparkle(e.clientX, e.clientY);
            }}
            onMouseLeave={() => setHovered(false)}
            className={clsx(
              buttonVariants({ variant: "default", size: "lg" }),
              "px-12 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-2xl shadow-2xl transform transition-all duration-300",
              hovered && "scale-105 shadow-[0_0_25px_rgba(94,95,239,0.45)]"
            )}
          >
            {showCode ? "Hide Code Preview" : "Explore Live Code"}
            <motion.span
              className="inline-block ml-3"
              animate={{ x: hovered ? 6 : 0, rotate: hovered ? 360 : 0 }}
              transition={{ duration: 0.4 }}
            >
              →
            </motion.span>
          </button>
        </motion.div>

        {/* Toggle Code Showcase */}
        <AnimatePresence>
          {showCode && (
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="mt-20 max-w-6xl mx-auto"
            >
              <CodeShowcase />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle Effects */}
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute rounded-full"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: 8,
              height: 8,
              background: "linear-gradient(135deg, #5D5FEF, #EFA6BE)",
              filter: "blur(1px)",
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </motion.div>
    </section>
  );
};

export default Services;
