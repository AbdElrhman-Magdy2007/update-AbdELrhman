"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import Image from "next/image";

// Components
import Hero from "../components/Hero/Hero";
import About from "../components/About/About";
import Services from "../components/Services/Services";
import Skills from "../components/Skills/Skills";
import Projects from "../components/Projects";
import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";
import { ThemeProvider } from "../components/ThemeProvider";
import { LanguageProvider } from "../components/LanguageProvider";

/* ------------------------------
    Loader Component
------------------------------- */
const Loader = () => {
  return (
    <motion.div
      key="loader"
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Animated Circle Loader */}
        <motion.div className="relative w-24 h-24 mb-6">
          <motion.div
            className="w-24 h-24 border-4 rounded-full"
            animate={{
              rotate: 360,
              borderColor: ["#3A29FF", "#FF94B4", "#FF3232", "#3A29FF"],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
            style={{
              borderImage:
                "linear-gradient(45deg, #3A29FF, #FF94B4, #FF3232) 1",
            }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Image
              src="/images/AbdELrhman.png"
              alt="Abdelrahman Magdy"
              width={80}
              height={80}
              className="object-contain rounded-full"
            />
          </motion.div>
        </motion.div>

        {/* Dots Animation */}
        <motion.div
          className="mt-4 flex space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-indigo-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/* ------------------------------
    Main Index Component
------------------------------- */
const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { scrollYProgress } = useScroll();

  // Animate scroll progress bar
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Cursor trail state
  const [cursorTrail, setCursorTrail] = useState<
    { x: number; y: number; id: number }[]
  >([]);

  useEffect(() => {
    /** SEO: Dynamic Title + Description */
    document.title =
      "Abdelrahman Magdy | Senior Full-Stack Developer & UI/UX Designer";

    const metaDescription = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement;

    if (metaDescription) {
      metaDescription.content =
        "Senior Full-Stack Developer with 5+ years of experience in React, Next.js, TypeScript, and Node.js. Creating exceptional digital experiences for startups and enterprises.";
    }

    /** Loading Screen Timeout */
    const timer = setTimeout(() => setIsLoading(false), 2000);

    /** Cursor Trail Effect */
    const handleMouseMove = (e: MouseEvent) => {
      const hero = document.getElementById("home");
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const newDot = { x: e.clientX, y: e.clientY, id: Date.now() };
        setCursorTrail((prev) => [...prev, newDot]);

        setTimeout(() => {
          setCursorTrail((prev) => prev.filter((dot) => dot.id !== newDot.id));
        }, 1000);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Toaster />
        <AnimatePresence>{isLoading ? <Loader /> : null}</AnimatePresence>

        {!isLoading && (
          <motion.div
            key="content"
            className="min-h-screen bg-black text-white font-inter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Scroll Progress Bar */}
            <motion.div
              className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-pink-400 to-red-500 origin-left z-50"
              style={{ scaleX }}
            />

            {/* Cursor Trail Effect */}
            {cursorTrail.map((dot) => (
              <motion.div
                key={dot.id}
                className="cursor-trail"
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 0.4 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ left: dot.x, top: dot.y }}
              />
            ))}

            {/* Main Sections */}
            <main>
              <section id="home">
                <Hero />
              </section>

              <section id="experience" className="relative bg-black">
                <About />
              </section>

              <section id="skills" className="relative bg-black">
                <Skills />
              </section>

              <section id="services" className="relative bg-black">
                <Services />
              </section>

              <section id="projects" className="relative bg-black">
                <Projects />
              </section>

              <section id="contact" className="relative bg-black">
                <ContactForm />
              </section>
            </main>

            {/* Footer */}
            <Footer />
          </motion.div>
        )}
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default Index;
