import { useEffect, useState, useCallback } from 'react';

interface UseScrollbarOptions {
  hideOnInactive?: boolean;
  inactiveDelay?: number;
  customClass?: string;
}

export const useScrollbar = (options: UseScrollbarOptions = {}) => {
  const {
    hideOnInactive = false,
    inactiveDelay = 2000,
    customClass = ''
  } = options;

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      setScrollPosition(scrollTop);
      setScrollProgress(progress);
      setIsScrolling(true);

      // Clear existing timer
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      // Set new timer for inactive state
      if (hideOnInactive) {
        scrollTimer = setTimeout(() => {
          setIsScrolling(false);
        }, inactiveDelay);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [hideOnInactive, inactiveDelay]);

  // Apply custom scrollbar class
  useEffect(() => {
    if (customClass) {
      document.body.classList.add(customClass);
      return () => document.body.classList.remove(customClass);
    }
  }, [customClass]);

  const scrollTo = useCallback((position: number, smooth = true) => {
    window.scrollTo({
      top: position,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  const scrollToElement = useCallback((elementId: string, offset = 0, smooth = true) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const targetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  const scrollToTop = useCallback((smooth = true) => {
    scrollTo(0, smooth);
  }, [scrollTo]);

  const scrollToBottom = useCallback((smooth = true) => {
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    scrollTo(documentHeight - windowHeight, smooth);
  }, [scrollTo]);

  return {
    isScrolling,
    scrollPosition,
    scrollProgress,
    scrollTo,
    scrollToElement,
    scrollToTop,
    scrollToBottom
  };
};

// Hook for scroll direction detection
export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return scrollDirection;
};

// Hook for scroll-based animations
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);

  const elementRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold]);

  return { isVisible, elementRef };
};