// Google Analytics 4 Integration
// Sistema de tracking y analytics

declare global {
  interface Window {
    gtag: any;
  }
}

export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || 'G-XXXXXXXXXX';

// Initialize GA4
export const initGA = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    if (GA_TRACKING_ID && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
      window.gtag('js', new Date());
      window.gtag('config', GA_TRACKING_ID);
    }
  }
};

// Track page view
export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

// Track custom event
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// E-commerce tracking
export const trackAddToCart = (productId: string, productName: string, price: number, category: string) => {
  trackEvent('add_to_cart', {
    currency: 'GTQ',
    value: price,
    items: [{
      item_id: productId,
      item_name: productName,
      category: category,
      price: price,
      quantity: 1,
    }],
  });
};

export const trackBeginCheckout = (totalValue: number, items: any[]) => {
  trackEvent('begin_checkout', {
    currency: 'GTQ',
    value: totalValue,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      category: item.category,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
};

export const trackPurchase = (transactionId: string, value: number, items: any[]) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    currency: 'GTQ',
    value: value,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      category: item.category,
      price: item.price,
      quantity: 1,
    })),
  });
};

export const trackCalculatorUsage = (department: string, constructionType: string, estimatedCost: number) => {
  trackEvent('calculator_usage', {
    department,
    construction_type: constructionType,
    estimated_cost: estimatedCost,
    currency: 'GTQ',
  });
};

export const trackServiceRequest = (serviceType: string, department: string) => {
  trackEvent('service_request', {
    service_type: serviceType,
    department,
  });
};

export const trackQuoteRequest = (department: string, squareMeters: number, quality: string) => {
  trackEvent('quote_request', {
    department,
    square_meters: squareMeters,
    quality_level: quality,
  });
};