import { useEffect, useCallback } from 'react';

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const reportWebVitals = useCallback((metric: any) => {
    if (import.meta.env.DEV) {
      console.log('Web Vital:', metric);
    }
    
    // Send to analytics service in production
    if (import.meta.env.PROD) {
      // Example: sendToAnalytics(metric);
    }
  }, []);

  useEffect(() => {
    // Monitor largest contentful paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            reportWebVitals({
              name: 'LCP',
              value: entry.startTime,
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      return () => observer.disconnect();
    }
  }, [reportWebVitals]);

  // Measure component load time
  const measureComponentLoad = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (import.meta.env.DEV) {
        console.log(`${componentName} load time:`, loadTime.toFixed(2), 'ms');
      }
    };
  }, []);

  return {
    measureComponentLoad,
    reportWebVitals,
  };
};