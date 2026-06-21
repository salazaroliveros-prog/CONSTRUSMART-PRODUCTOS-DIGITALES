
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import SEO from '@/components/SEO';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <SEO 
        title="ConstructoraGT - Soluciones Digitales para la Construcción en Guatemala"
        description="Software de construcción, calculadora de costos, diseños arquitectónicos y servicios profesionales. Todo para tu proyecto de construcción en Guatemala."
        keywords="construcción guatemala, calculadora costos construcción, software construcción, planos arquitectónicos, diseños 3D, servicios construcción"
      />
      <AppLayout />
    </AppProvider>
  );
};

export default Index;
