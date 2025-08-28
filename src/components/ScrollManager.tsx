import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollManagerProps {
  showProgressBar?: boolean;
  showScrollToTop?: boolean;
  scrollToTopOffset?: number;
  progressBarHeight?: number;
}

const ScrollManager: React.FC<ScrollManagerProps> = ({
  showProgressBar = true,
  showScrollToTop = true,
  scrollToTopOffset = 300,
  progressBarHeight = 3
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      
      setScrollProgress(progress);
      setShowButton(scrollTop > scrollToTopOffset);
    };

    // Throttled scroll handler
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    updateScrollProgress(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollToTopOffset]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Progress Bar */}
      {showProgressBar && (
        <div
          className="fixed top-0 left-0 z-50 transition-all duration-100 ease-out"
          style={{
            width: `${scrollProgress}%`,
            height: `${progressBarHeight}px`,
            background: 'linear-gradient(90deg, #7B61FF 0%, #FF6AC2 50%, #38BDF8 100%)',
            boxShadow: scrollProgress > 0 
              ? '0 0 15px rgba(123, 97, 255, 0.7), 0 0 30px rgba(255, 106, 194, 0.4)'
              : '0 0 10px rgba(123, 97, 255, 0.5)'
          }}
        />
      )}

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className={`
            fixed bottom-8 right-8 z-50 p-3 rounded-full
            bg-gradient-to-r from-[#7B61FF] to-[#FF6AC2]
            text-white shadow-lg transition-all duration-300 ease-in-out
            hover:shadow-xl hover:scale-110 active:scale-95
            ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
          `}
          style={{
            boxShadow: showButton 
              ? '0 4px 20px rgba(123, 97, 255, 0.4), 0 0 20px rgba(255, 106, 194, 0.3)'
              : 'none'
          }}
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

export default ScrollManager;