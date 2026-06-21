// Costos de construcción por departamento de Guatemala (en Quetzales GTQ por m²)
// Basados en estimaciones del mercado guatemalteco 2024-2025
// Incluyen materiales + mano de obra (sin acabados de lujo)

export interface DepartmentCost {
  name: string;
  // Costo base por m² en GTQ (calidad económica/estándar/premium)
  economico: number;
  estandar: number;
  premium: number;
  // Multiplicador por logística/accesibilidad
  factor: number;
}

export const GUATEMALA_DEPARTMENTS: DepartmentCost[] = [
  { name: 'Guatemala',       economico: 3200, estandar: 4800, premium: 7500, factor: 1.00 },
  { name: 'Sacatepéquez',    economico: 3100, estandar: 4700, premium: 7400, factor: 1.02 },
  { name: 'Chimaltenango',   economico: 2950, estandar: 4500, premium: 7000, factor: 1.03 },
  { name: 'Escuintla',       economico: 2900, estandar: 4400, premium: 6900, factor: 1.02 },
  { name: 'Santa Rosa',      economico: 2850, estandar: 4300, premium: 6800, factor: 1.05 },
  { name: 'Sololá',          economico: 2900, estandar: 4400, premium: 6900, factor: 1.08 },
  { name: 'Totonicapán',     economico: 2800, estandar: 4250, premium: 6700, factor: 1.10 },
  { name: 'Quetzaltenango',  economico: 3000, estandar: 4500, premium: 7100, factor: 1.04 },
  { name: 'Suchitepéquez',   economico: 2850, estandar: 4300, premium: 6800, factor: 1.05 },
  { name: 'Retalhuleu',      economico: 2850, estandar: 4300, premium: 6800, factor: 1.05 },
  { name: 'San Marcos',      economico: 2800, estandar: 4200, premium: 6700, factor: 1.10 },
  { name: 'Huehuetenango',   economico: 2750, estandar: 4150, premium: 6600, factor: 1.12 },
  { name: 'Quiché',          economico: 2700, estandar: 4100, premium: 6500, factor: 1.15 },
  { name: 'Baja Verapaz',    economico: 2750, estandar: 4150, premium: 6600, factor: 1.10 },
  { name: 'Alta Verapaz',    economico: 2800, estandar: 4200, premium: 6700, factor: 1.12 },
  { name: 'Petén',           economico: 3000, estandar: 4600, premium: 7200, factor: 1.20 },
  { name: 'Izabal',          economico: 2900, estandar: 4400, premium: 6900, factor: 1.15 },
  { name: 'Zacapa',          economico: 2800, estandar: 4200, premium: 6700, factor: 1.08 },
  { name: 'Chiquimula',      economico: 2800, estandar: 4200, premium: 6700, factor: 1.10 },
  { name: 'Jalapa',          economico: 2750, estandar: 4150, premium: 6600, factor: 1.10 },
  { name: 'Jutiapa',         economico: 2800, estandar: 4200, premium: 6700, factor: 1.08 },
  { name: 'El Progreso',     economico: 2850, estandar: 4300, premium: 6800, factor: 1.06 },
];

export interface ConstructionType {
  id: string;
  name: string;
  multiplier: number;
  description: string;
}

export const CONSTRUCTION_TYPES: ConstructionType[] = [
  { id: 'vivienda-1n', name: 'Vivienda 1 nivel',       multiplier: 1.00, description: 'Casa de un solo nivel, diseño tradicional' },
  { id: 'vivienda-2n', name: 'Vivienda 2 niveles',     multiplier: 1.15, description: 'Casa de dos niveles con escaleras' },
  { id: 'vivienda-3n', name: 'Vivienda 3+ niveles',    multiplier: 1.28, description: 'Residencia de 3 o más niveles' },
  { id: 'apartamento', name: 'Edificio de apartamentos', multiplier: 1.22, description: 'Construcción multifamiliar' },
  { id: 'comercial',   name: 'Local comercial',        multiplier: 1.10, description: 'Tiendas, oficinas, locales' },
  { id: 'bodega',      name: 'Bodega / Industrial',    multiplier: 0.75, description: 'Estructura industrial básica' },
  { id: 'ampliacion',  name: 'Ampliación / Remodelación', multiplier: 0.85, description: 'Modificación a estructura existente' },
];

export const QUALITY_LEVELS = [
  { id: 'economico', name: 'Económico',  description: 'Materiales básicos, acabados estándar' },
  { id: 'estandar',  name: 'Estándar',   description: 'Calidad media, buen acabado' },
  { id: 'premium',   name: 'Premium',    description: 'Materiales de alta gama, acabados de lujo' },
];

// PRODUCTOS DIGITALES
export interface DigitalProduct {
  id: string;
  name: string;
  category: string;
  price: number; // GTQ
  priceLabel: string;
  description: string;
  features: string[];
  image: string;
  badge?: string;
}

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: 'app-calculo',
    name: 'App Cálculo y Presupuesto',
    category: 'Software',
    price: 1495,
    priceLabel: 'Q1,495',
    description: 'Aplicación móvil para cálculo automatizado de materiales y presupuestos de obra.',
    features: ['Cálculo de materiales', 'Presupuestos en PDF', 'Base de precios actualizada', 'Multi-proyecto'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473573644_b3b147af.png',
    badge: 'Más Vendido',
  },
  {
    id: 'app-seguimiento',
    name: 'App Seguimiento y Control de Obras',
    category: 'Software',
    price: 1895,
    priceLabel: 'Q1,895',
    description: 'Controla avance, gastos y personal de tus obras en tiempo real desde el celular.',
    features: ['Reportes diarios', 'Control de gastos', 'Fotos georeferenciadas', 'Asignación de tareas'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473573644_b3b147af.png',
  },
  {
    id: 'app-rendimiento',
    name: 'App Cálculo de Rendimiento en Campo',
    category: 'Software',
    price: 1295,
    priceLabel: 'Q1,295',
    description: 'Mide el rendimiento de cuadrillas y materiales directamente en obra.',
    features: ['Rendimiento por cuadrilla', 'Costo unitario real', 'Comparativas', 'Reportes exportables'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473573644_b3b147af.png',
  },
  {
    id: 'erp-completo',
    name: 'ERP Completo para Constructoras',
    category: 'Software',
    price: 9995,
    priceLabel: 'Q9,995',
    description: 'Sistema integral para administrar finanzas, RRHH, inventario, proyectos y clientes.',
    features: ['Multi-empresa', 'Contabilidad', 'Inventarios', 'CRM integrado', 'Reportes ejecutivos'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473765444_5fdfb566.png',
    badge: 'Premium',
  },
  {
    id: 'diseno-vivienda',
    name: 'Diseños y Anteproyectos Residenciales',
    category: 'Diseño',
    price: 3500,
    priceLabel: 'Desde Q3,500',
    description: 'Anteproyectos personalizados de viviendas residenciales con plantas y fachadas.',
    features: ['Plantas arquitectónicas', 'Fachadas', 'Distribución optimizada', 'Revisiones incluidas'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473590603_388cd05b.jpg',
  },
  {
    id: 'planos-presupuesto',
    name: 'Planos Constructivos + Presupuesto',
    category: 'Diseño',
    price: 6500,
    priceLabel: 'Desde Q6,500',
    description: 'Juego completo de planos constructivos con presupuesto detallado de obra.',
    features: ['Planos estructurales', 'Eléctricos e hidráulicos', 'Cuantificación', 'Presupuesto desglosado'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473652873_8a6fd92f.png',
    badge: 'Recomendado',
  },
  {
    id: 'render-3d',
    name: 'Render 3D Fotorrealista',
    category: 'Diseño',
    price: 1800,
    priceLabel: 'Desde Q1,800',
    description: 'Visualizaciones 3D fotorrealistas de tu proyecto, interiores y exteriores.',
    features: ['Calidad fotorrealista', 'Interior y exterior', 'Múltiples vistas', 'Entrega en alta resolución'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473679589_4545d1cd.png',
  },
];

// SERVICIOS DE CONSTRUCCIÓN
export interface ConstructionService {
  id: string;
  name: string;
  description: string;
  features: string[];
  image: string;
  startingPrice: string;
}

export const CONSTRUCTION_SERVICES: ConstructionService[] = [
  {
    id: 'proyecto-completo',
    name: 'Ejecución de Proyectos Completos',
    description: 'Ejecutamos su proyecto de construcción de principio a fin con calidad garantizada.',
    features: ['Construcción llave en mano', 'Materiales de calidad', 'Mano de obra certificada', 'Garantía estructural'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473701474_41a8466c.png',
    startingPrice: 'Cotización personalizada',
  },
  {
    id: 'supervision',
    name: 'Supervisión de Obras',
    description: 'Supervisión profesional para garantizar la calidad y cumplimiento de su proyecto.',
    features: ['Inspecciones periódicas', 'Reportes técnicos', 'Control de calidad', 'Bitácora de obra'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473324122_560bb4c3.jpg',
    startingPrice: 'Desde Q4,500/mes',
  },
  {
    id: 'agrimensura',
    name: 'Agrimensura (Medición de Terrenos)',
    description: 'Medición profesional y precisa de terrenos con equipos de última generación.',
    features: ['Medición con GPS de precisión', 'Cálculo de áreas', 'Linderos certificados', 'Planos georeferenciados'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473620811_6741cbc5.png',
    startingPrice: 'Desde Q2,500',
  },
  {
    id: 'planos-registro',
    name: 'Planos de Registro',
    description: 'Elaboración de planos de registro avalados para trámites en RIC y RGP.',
    features: ['Plano oficial certificado', 'Trámite ante RIC', 'Documentación legal', 'Entrega digital y física'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473652873_8a6fd92f.png',
    startingPrice: 'Desde Q1,800',
  },
  {
    id: 'urbanizaciones',
    name: 'Planificación de Urbanizaciones',
    description: 'Diseño y planificación integral de urbanizaciones y lotificaciones.',
    features: ['Diseño urbanístico', 'Lotificación óptima', 'Trámites municipales', 'Servicios e infraestructura'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473788741_c06171f6.png',
    startingPrice: 'Cotización personalizada',
  },
  {
    id: 'topografia',
    name: 'Levantamientos Topográficos',
    description: 'Estudios topográficos completos para proyectos públicos y privados.',
    features: ['Curvas de nivel', 'Perfiles longitudinales', 'Modelos digitales', 'Informe técnico'],
    image: 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473620811_6741cbc5.png',
    startingPrice: 'Desde Q3,500',
  },
];

export function calculateCost(
  departmentName: string,
  constructionTypeId: string,
  qualityLevelId: string,
  squareMeters: number
): { min: number; max: number; avg: number; pricePerM2: number } | null {
  const dept = GUATEMALA_DEPARTMENTS.find(d => d.name === departmentName);
  const type = CONSTRUCTION_TYPES.find(t => t.id === constructionTypeId);
  if (!dept || !type || squareMeters <= 0) return null;

  const baseCost = dept[qualityLevelId as 'economico' | 'estandar' | 'premium'];
  const pricePerM2 = baseCost * type.multiplier * dept.factor;
  const total = pricePerM2 * squareMeters;

  return {
    min: Math.round(total * 0.92),
    max: Math.round(total * 1.12),
    avg: Math.round(total),
    pricePerM2: Math.round(pricePerM2),
  };
}

export const HERO_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473307230_44576eec.png';
export const CONSTRUCTION_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473324122_560bb4c3.jpg';

export function formatQ(amount: number): string {
  return 'Q' + amount.toLocaleString('es-GT', { maximumFractionDigits: 0 });
}
