import React from "react";
import { motion } from "framer-motion";

const Logo: React.FC = () => {
  const logoVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.08,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.a
      href="/"
      className="flex items-center gap-3 group"
      variants={logoVariants}
      style={{ textDecoration: "none" }}
    >
      <h1 className="flex items-center md:text-3xl text-xl font-extrabold font-heading tracking-tight select-none">
        <img
          src="https://i.postimg.cc/yxQgP74Q/Abd-ELrhman.png"
          className="w-12 h-12 md:w-16 md:h-16 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl object-cover bg-indigo-600"
          alt="Abdelrahman Logo"
        />
        <span className="ml-2 flex items-center space-x-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          {["A", "b", "d", "e", "l", "r", "h", "m", "a", "n"].map((letter, index) => (
            <motion.span
              key={`name-${index}`}
              className="transition-transform duration-300 group-hover:scale-110"
              variants={letterVariants}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      </h1>
    </motion.a>
  );
};

export default Logo;
