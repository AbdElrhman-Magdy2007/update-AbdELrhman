
import React from 'react';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { icon: <Github className="h-5 w-5" />, href: "#", label: "GitHub" },
    { icon: <Linkedin className="h-5 w-5" />, href: "#", label: "LinkedIn" },
    { icon: <Twitter className="h-5 w-5" />, href: "#", label: "Twitter" },
    { icon: <Mail className="h-5 w-5" />, href: "mailto:example@example.com", label: "Email" }
  ];

  const quickLinks = [
    { text: "Home", href: "#home" },
    { text: "Expertise", href: "#Expertise" },
    { text: "Code", href: "#Code" },
    { text: "Projects", href: "#projects" },
    { text: "Contact", href: "#contact" }
  ];

  return (
    <footer className="py-16 relative bg-gradient-to-b from-transparent to-background">
      <div className="container px-4 mx-auto">
        <div className="mb-8 text-center">
          <h2 className="font-heading font-bold text-2xl">
            <span className="text-primary">Abdelrahman</span> Magdy
          </h2>
          <p className="text-gray-400 mt-2">Web Developer & App Designer</p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
          {quickLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-gray-300 hover:text-primary transition-colors"
            >
              {link.text}
            </a>
          ))}
        </div>
        
        <div className="flex justify-center space-x-4 mb-10">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              aria-label={link.label}
              className="bg-white/5 hover:bg-primary/20 p-2 rounded-full transition-colors"
            >
              {link.icon}
            </a>
          ))}
        </div>
        
        <div className="text-center text-gray-400 text-sm">
          <p>© {currentYear} Abdelrahman Magdy. Crafted with 💻 and ☕.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
