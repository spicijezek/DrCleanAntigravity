import { useEffect } from 'react';

export function useMobileResponsive() {
  useEffect(() => {
    // Add responsive classes to body for mobile optimization
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 430;
      if (isMobile) {
        document.body.classList.add('mobile-optimized');
      }
      
      const handleResize = () => {
        const mobile = window.innerWidth <= 430;
        if (mobile) {
          document.body.classList.add('mobile-optimized');
        } else {
          document.body.classList.remove('mobile-optimized');
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
}