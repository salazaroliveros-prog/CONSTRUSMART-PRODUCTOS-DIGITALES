import React from 'react';
import Header from './Header';
import Hero from './Hero';
import ProductsSection from './ProductsSection';
import ServicesSection from './ServicesSection';
import Calculator from './Calculator';
import TestimonialsSection from './TestimonialsSection';
import ContactSection from './ContactSection';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <ProductsSection />
        <ServicesSection />
        <Calculator />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default AppLayout;
