'use client';

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import CurvedLoop from "./CurvedLoop";
import ScrollStack from "./ScrollStack";
import type { Variants } from "framer-motion";

const ParticleBackground = () => {
  const COLORS = ["#5D5FEF", "#EFA6BE", "#F96A6A"];

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 10 + 8,
        duration: Math.random() * 8 + 8,
        delay: Math.random() * 6,
        opacity: Math.random() * 0.4 + 0.4,
        color: COLORS[i % COLORS.length],
      })),
    []
  );




  const particleVariants: Variants & { [key: string]: any } = {
    animate: (i: number) => ({
      x: [
        particles[i].x,
        particles[i].x + (Math.random() * 80 - 40),
        particles[i].x,
      ],
      y: [
        particles[i].y,
        particles[i].y + (Math.random() * 80 - 40),
        particles[i].y,
      ],
      opacity: [0, particles[i].opacity, 0],
      scale: [0, 1.5, 0],
      rotate: [0, 360, 720],
      transition: {
        duration: particles[i].duration,
        delay: particles[i].delay,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.5, 1],
      },
    }),
    pulse: {
      scale: [1, 1.4, 1],
      opacity: [0.4, 0.7, 0.4],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-sm"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
          }}
          variants={particleVariants}
          animate={["animate", "pulse"]}
          custom={p.id}
        />
      ))}
    </div>
  );
};

interface CardProps {
  title: string;
  description: string;
  index: number;
  icon?: string;
  gradient?: string;
}

const Card = ({ title, description, index, icon, gradient }: CardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      rotateY: -25,
      z: -100,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      z: 0,
      transition: {
        duration: 0.8,
        delay: index * 0.2,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.05,
        rotateX: 5,
        rotateY: 5,
        z: 50,
      }}
      onMouseMove={handleMouseMove}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {/* Card Container with Modern Design */}
      <div className="relative w-full h-[500px] rounded-[2rem] overflow-hidden">

        {/* Dynamic Background with Mouse Tracking */}
        <div
          className="absolute inset-0 opacity-70 transition-all duration-300"
          style={{
            background: `
              radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                rgba(255,255,255,0.1) 0%, 
                transparent 50%
              ),
              linear-gradient(135deg, 
                rgba(15, 15, 15, 0.95) 0%,
                rgba(25, 25, 35, 0.9) 50%,
                rgba(15, 15, 25, 0.95) 100%
              )
            `,
          }}
        />

        {/* Animated Mesh Gradient */}
        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${gradient} mix-blend-overlay`} />

        {/* Glassmorphism Layer */}
        <div className="absolute inset-0 backdrop-blur-xl bg-white/5 border border-white/10" />

        {/* Content Layout - Split Design */}
        <div className="relative h-full flex flex-col">

          {/* Top Section - Icon Area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">

            {/* Floating Geometric Shapes */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 bg-gradient-to-r ${gradient} rounded-full opacity-30`}
                  style={{
                    top: `${10 + (i * 12)}%`,
                    left: `${15 + (i % 3) * 30}%`,
                  }}
                  animate={{
                    y: isHovered ? [-10, 10, -10] : [0, 5, 0],
                    opacity: isHovered ? [0.3, 0.8, 0.3] : [0.1, 0.3, 0.1],
                    scale: isHovered ? [1, 1.5, 1] : [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>

            {/* Main Icon with 3D Effect */}
            <motion.div
              className="relative z-10"
              animate={{
                rotateY: isHovered ? [0, 15, -15, 0] : 0,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
            >
              <div className="text-8xl sm:text-9xl filter drop-shadow-2xl">
                {icon}
              </div>

              {/* Icon Shadow/Reflection */}
              <div
                className="absolute top-full left-1/2 transform -translate-x-1/2 text-8xl sm:text-9xl opacity-20 blur-sm scale-y-[-1]"
                style={{
                  background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {icon}
              </div>
            </motion.div>
          </div>

          {/* Bottom Section - Content Area */}
          <div className="h-48 p-6 relative">

            {/* Content Background */}
            <div className={`absolute inset-0 bg-gradient-to-t ${gradient} opacity-15 rounded-b-[2rem]`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-[2rem]" />

            {/* Text Content */}
            <div className="relative z-10 h-full flex flex-col justify-center text-center">

              {/* Title */}
              <motion.h3
                className="text-2xl sm:text-3xl font-bold mb-4 text-white opacity-100"
                animate={{
                  y: isHovered ? -5 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                  {title}
                </span>
              </motion.h3>

              {/* Description */}
              <motion.p
                className="text-gray-200 text-base leading-relaxed max-w-sm mx-auto opacity-100 font-medium"
                animate={{
                  y: isHovered ? -3 : 0,
                }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {description}
              </motion.p>

              {/* Progress Bar */}
              <motion.div
                className="mt-4 h-0.5 bg-white/20 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
              >
                <motion.div
                  className={`h-full bg-gradient-to-r ${gradient}`}
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 0.8, delay: index * 0.2 + 0.7 }}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Hover Effects */}
        <motion.div
          className="absolute inset-0 rounded-[2rem]"
          animate={{
            boxShadow: isHovered
              ? `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(168, 85, 247, 0.3)`
              : `0 10px 25px -5px rgba(0, 0, 0, 0.3)`,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Border Glow */}
        <div
          className={`absolute inset-0 rounded-[2rem] border-2 transition-all duration-300 ${isHovered ? `border-white/30` : `border-white/10`
            }`}
        />

        {/* Corner Accents */}
        <div className={`absolute top-4 right-4 w-8 h-8 bg-gradient-to-br ${gradient} rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
        <div className={`absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-tr ${gradient} rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-300`} />
      </div>

      {/* External Glow Effect */}
      <motion.div
        className={`absolute inset-0 rounded-[2rem] bg-gradient-to-r ${gradient} blur-xl -z-10`}
        animate={{
          opacity: isHovered ? 0.2 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

const About = () => {


  const cards = [
    {
      title: "Stunning UI That Speaks Design",
      description:
        "I craft pixel-perfect, responsive interfaces that captivate users and drive engagement. Using cutting-edge technologies like Tailwind CSS and Framer Motion, every interaction feels smooth, intuitive, and professionally polished.",
      icon: "🎨",
      gradient: "from-purple-500 via-pink-500 to-red-500"
    },
    {
      title: "Fast, Clean & Scalable Code",
      description:
        "I build high-performance websites using React, Next.js, and TypeScript —with clean code that’s made to scale and last.",
      icon: "⚡",
      gradient: "from-blue-500 via-cyan-500 to-teal-500"
    },
    {
      title: "Full-Stack Power You Can Trust",
      description:
        "I deliver complete web solutions with robust backends, secure APIs, and seamless integrations. From database design to payment processing, I handle every aspect with precision and reliability.",
      icon: "🚀",
      gradient: "from-green-500 via-emerald-500 to-blue-500"
    },
  ];





  return (
    <section className="relative bg-black min-h-screen text-white" id="Expertise">
      <ParticleBackground />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center gap-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
   <CurvedLoop
        marqueeText="Clean Code ✦ Fast Delivery ✦ Modern UI ✦ Scalable Apps ✦ High Performance ✦ Real Results"
        speed={1.6}
        curveAmount={300}
        direction="left"
        interactive
        gradient={["#818cf8", "#a855f7"]}
        className="py-6 font-sans text-base sm:text-lg md:text-xl lg:text-2xl leading-tight tracking-wide"
        minHeight={420}
      />

        <ScrollStack
          className="w-full pt-40"
          animationIntensity="normal"
          smoothScrolling={true}
        >
          {cards.map((card, index) => (
            <Card
              key={card.title}
              title={card.title}
              description={card.description}
              index={index}
              icon={card.icon || "✨"}
              gradient={card.gradient || "from-purple-500 to-pink-500"}
            />
          ))}
        </ScrollStack>
      </motion.div>


    </section>
  );
};

export default About;
