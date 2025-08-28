// Scroll Progress Indicator
export const initScrollProgress = () => {
  // Create progress bar element
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, #7B61FF 0%, #FF6AC2 50%, #38BDF8 100%);
    z-index: 9999;
    transition: width 0.1s ease;
    box-shadow: 0 0 10px rgba(123, 97, 255, 0.5);
  `;
  
  document.body.appendChild(progressBar);

  // Update progress on scroll
  const updateProgress = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollProgress = (scrollTop / scrollHeight) * 100;
    
    progressBar.style.width = `${scrollProgress}%`;
    
    // Add glow effect when scrolling
    if (scrollProgress > 0) {
      progressBar.style.boxShadow = `
        0 0 15px rgba(123, 97, 255, 0.7),
        0 0 30px rgba(255, 106, 194, 0.4)
      `;
    } else {
      progressBar.style.boxShadow = '0 0 10px rgba(123, 97, 255, 0.5)';
    }
  };

  // Throttled scroll event
  let ticking = false;
  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll);
  
  // Initial call
  updateProgress();

  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (progressBar.parentNode) {
      progressBar.parentNode.removeChild(progressBar);
    }
  };
};

// Smooth scroll to element
export const smoothScrollTo = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// Scroll to top with animation
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// Custom scrollbar visibility controller
export const toggleScrollbarVisibility = (show = true) => {
  const style = document.createElement('style');
  style.textContent = show ? '' : `
    ::-webkit-scrollbar {
      display: none;
    }
    * {
      scrollbar-width: none;
    }
  `;
  
  if (show) {
    const existingStyle = document.querySelector('style[data-scrollbar-hidden]');
    if (existingStyle) {
      existingStyle.remove();
    }
  } else {
    style.setAttribute('data-scrollbar-hidden', 'true');
    document.head.appendChild(style);
  }
};