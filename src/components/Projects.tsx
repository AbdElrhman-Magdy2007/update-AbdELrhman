"use client";

import React, { useRef, useState } from "react";
import { motion, Variants, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github } from "lucide-react";

import projectsData from "../data/projects.json";
import Link from "next/link";
import Image from "next/image";

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
  demoUrl?: string;
  githubUrl?: string;
  featured: boolean;
}

interface ProjectsData {
  projects: Project[];
}

// Letter-by-letter animation for the heading
const letterVariants: Variants = {
  hidden: { opacity: 0, y: 20, rotateX: -90 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const Projects: React.FC = () => {
  const featuredProjects = (projectsData as ProjectsData).projects.filter(
    (project) => project.featured
  );
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  // Memoized animation variants to prevent recreation on every render
  const containerVariants: Variants = React.useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  }), []);

  const itemVariants: Variants = React.useMemo(() => ({
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }), []);

  const cardVariants: Variants = React.useMemo(() => ({
    hidden: { opacity: 0, y: 40, scale: 0.95, rotateX: 10 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.7,
      },
    },
    hover: {
      scale: 1.03,
      rotateY: 5,
      rotateX: -5,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  }), []);

  const buttonVariants: Variants = React.useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12,
        duration: 0.6,
      },
    },
    hover: {
      scale: 1.15,
      boxShadow: "0 0 20px rgba(58, 41, 255, 0.4)",
      filter: "brightness(1.1)", // Fixed: use filter instead of brightness
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.9 },
  }), []);

  // Particle effect state
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Mobile detection state
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Throttled mouse move handler for better performance
  const lastParticleTime = useRef(0);
  const particleTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    // Only enable particle effect on non-mobile devices for better performance
    if (buttonRef.current && !isMobile) {
      const now = Date.now();
      // Throttle particle generation to 60fps (16ms intervals)
      if (now - lastParticleTime.current < 16) return;

      lastParticleTime.current = now;

      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newParticle = { id: now, x, y };
      setParticles((prev) => [...prev, newParticle].slice(-8)); // Limit to 8 particles

      const timeout = setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
        particleTimeouts.current.delete(timeout);
      }, 800);

      particleTimeouts.current.add(timeout);
    }
  }, [isMobile]);

  // Cleanup effect for particle timeouts
  React.useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      particleTimeouts.current.forEach(timeout => clearTimeout(timeout));
      particleTimeouts.current.clear();
    };
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative overflow-hidden py-12 sm:py-16 md:py-24 text-white"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[#7B61FF] via-[#FF6AC2] to-[#38BDF8] bg-clip-text text-transparent mb-4 sm:mb-6 tracking-tight">
              {"Featured Projects".split("").map((char, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={letterVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  {char}
                </motion.span>
              ))}
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
              Explore a curated selection of modern web apps showcasing
              performance, design & interactivity.
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-[#7B61FF] to-[#FF6AC2] mx-auto mt-6 rounded-full" />
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid gap-6 sm:gap-8 md:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16 md:mb-20"
          >
            {featuredProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={cardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.98 }} // Add tap animation for mobile
                className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 shadow-lg hover:shadow-2xl active:shadow-xl"
              >
                <Card className="bg-transparent border-0 h-full flex flex-col">
                  <div className="relative">
                    <div className="aspect-[4/3] overflow-hidden">
                      <Image
                        src={project.image}
                        alt={`Screenshot of ${project.title} project`}
                        width={400}
                        height={300}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={false}
                      />
                    </div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  </div>

                  <CardContent className="flex flex-col p-6 flex-grow">
                    <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#7B61FF] to-[#38BDF8] bg-clip-text text-transparent">
                      {project.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-gradient-to-r from-[#FF6AC2] to-[#7B61FF] text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                      {project.demoUrl && (
                        <motion.a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="w-full min-w-[120px] flex items-center justify-center gap-2 px-6 py-2 text-base font-medium rounded-full bg-gradient-to-r from-[#7B61FF] to-[#38BDF8] text-white hover:brightness-110 shadow-md transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Demo
                        </motion.a>
                      )}
                      {project.githubUrl && (
                        <motion.a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="w-full min-w-[120px] flex items-center justify-center gap-2 px-6 py-2 text-base font-medium rounded-full bg-gradient-to-r from-[#FF6AC2] to-[#FF3B80] text-white hover:brightness-110 shadow-md transition"
                        >
                          <Github className="w-4 h-4" />
                          GitHub
                        </motion.a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <div className="relative" ref={buttonRef} onMouseMove={handleMouseMove}>
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-2 h-2 bg-[#7B61FF] rounded-full"
                  style={{ left: particle.x, top: particle.y }}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.8 }}
                />
              ))}
              <Link href="/projects">
                <Button
                  variant="outline"
                  className="w-full max-w-md px-10 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-[#7B61FF]/20 to-[#38BDF8]/20 border border-white/10 text-white backdrop-blur-md hover:brightness-110 transition duration-300 shadow-md"
                >
                  View All Projects
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;