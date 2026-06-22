import React from 'react';
import Header from './Header';
import Hero from './Hero';
import ProductsSection from './ProductsSection';
import ServicesSection from './ServicesSection';
import PortfolioSection from './PortfolioSection';
import Calculator from './Calculator';
import TestimonialsSection from './TestimonialsSection';
import ContactSection from './ContactSection';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import ScrollToTop from './ScrollToTop';
import SEO from './SEO';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors">
      <SEO 
        title="ConstructoraGT - Soluciones Digitales para la Construcción en Guatemala"
        description="Productos digitales, software y servicios profesionales para la industria de la construcción en Guatemala. Calcula costos, cotiza proyectos y adquiere herramientas digitales."
      />
      <Header />
      <main>
        <Hero />
        <ProductsSection />
        <ServicesSection />
        <PortfolioSection />
        <Calculator />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
      <ScrollToTop />
    </div>
  );
};

export default AppLayout;
