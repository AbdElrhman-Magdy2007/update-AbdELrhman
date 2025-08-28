"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, Variants, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

// ================== Interfaces ==================
interface FormData {
  name: string;
  email: string;
  message: string;
  honeypot: string;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

// ================== Particle Background ==================
const COLORS = ["#5D5FEF", "#EFA6BE", "#F96A6A"];

const ParticleBackground: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Dynamic particle count based on screen size
  const particleCount =
    typeof window !== "undefined"
      ? window.innerWidth < 640
        ? 10 // Mobile
        : window.innerWidth < 1024
          ? 18 // Tablet
          : 28 // Desktop
      : 20;

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 4,
        duration: Math.random() * 6 + 4,
        delay: Math.random() * 2,
        opacity: Math.random() * 0.3 + 0.2,
        color: COLORS[i % COLORS.length],
      })),
    [particleCount]
  );

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-[2px] will-change-transform"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
          }}
          animate={{
            x: [p.x, p.x + (Math.random() * 50 - 25), p.x],
            y: [p.y, p.y + (Math.random() * 50 - 25), p.y],
            opacity: [0, p.opacity, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Circles Background */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute rounded-full border-2 md:border-4 shadow-xl"
          style={{
            width: 160 + i * 100,
            height: 160 + i * 100,
            top: `${30 + i * 8}%`,
            left: `${40 + i * 10}%`,
            transform: "translate(-50%, -50%)",
            borderColor: COLORS[i % COLORS.length],
            boxShadow: `0 0 40px ${COLORS[i % COLORS.length]}44`,
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.25, 0.1, 0.25],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ================== Contact Form ==================
const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
    honeypot: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "success" | "error" | "invalid" | null
  >(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle Input
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    []
  );

  // Sparkle effect
  const createSparkle = useCallback((x: number, y: number) => {
    const id = Date.now();
    setSparkles((prev) => [
      ...prev,
      { id, x: x + Math.random() * 10 - 5, y: y + Math.random() * 10 - 5 },
    ]);
    setTimeout(
      () => setSparkles((prev) => prev.filter((s) => s.id !== id)),
      600
    );
  }, []);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.honeypot) return;

    if (!validateForm()) {
      setSubmitStatus("invalid");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to send");

      setSubmitStatus("success");
      setFormData({ name: "", email: "", message: "", honeypot: "" });
      setErrors({});
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  // Animations
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black py-20 overflow-hidden">
      <ParticleBackground />

      <motion.div
        className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Heading */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            Have a project in mind or want to collaborate? Let’s connect and
            bring your ideas to life.
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-[#5D5FEF] to-[#EFA6BE] mx-auto mt-6 rounded"></div>
        </motion.div>

        {/* Form */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-[0_0_20px_rgba(93,95,239,0.3)] transition-all duration-300">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-2xl font-semibold text-white mb-6">
                Send a Message
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Your Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full bg-white/5 border ${errors.name ? "border-red-500" : "border-white/10"
                      } text-white placeholder-gray-400 focus:border-[#5D5FEF] focus:ring-[#5D5FEF] transition-all duration-300`}
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-1"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Your Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full bg-white/5 border ${errors.email ? "border-red-500" : "border-white/10"
                      } text-white placeholder-gray-400 focus:border-[#5D5FEF] focus:ring-[#5D5FEF] transition-all duration-300`}
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-1"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Share your thoughts..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className={`w-full bg-white/5 border ${errors.message ? "border-red-500" : "border-white/10"
                      } text-white placeholder-gray-400 focus:border-[#5D5FEF] focus:ring-[#5D5FEF] transition-all duration-300 resize-y`}
                  />
                  {errors.message && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-1"
                    >
                      {errors.message}
                    </motion.p>
                  )}
                </div>

                {/* Honeypot */}
                <div className="hidden">
                  <input
                    type="text"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#5D5FEF] to-[#EFA6BE] hover:from-[#4B4CCB] hover:to-[#D68AA6] text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                  onClick={(e) => createSparkle(e.clientX, e.clientY)}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Message"
                  )}
                </Button>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-center"
                  >
                    Message sent successfully! I’ll respond soon.
                  </motion.div>
                )}
                {submitStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-center"
                  >
                    Error sending message. Please try again later.
                  </motion.div>
                )}
                {submitStatus === "invalid" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-center"
                  >
                    Please correct the form errors before submitting.
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Sparkle Effects */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: 10,
            height: 10,
            background: "linear-gradient(135deg, #5D5FEF, #EFA6BE)",
            boxShadow: "0 0 15px rgba(93, 95, 239, 0.5)",
          }}
          initial={{ scale: 0, opacity: 1, rotate: 0 }}
          animate={{ scale: 2.5, opacity: 0, rotate: 180 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      ))}
    </section>
  );
};

export default ContactForm;
