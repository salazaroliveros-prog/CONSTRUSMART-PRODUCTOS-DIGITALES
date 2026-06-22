// i18n - Internationalization structure for Construsmart
// Ready for translation expansion

type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  es: {
    'app.name': 'Construsmart',
    'app.tagline': 'Soluciones Digitales para la Construcción',
    'nav.home': 'Inicio',
    'nav.products': 'Productos Digitales',
    'nav.services': 'Servicios',
    'nav.calculator': 'Calculadora',
    'nav.contact': 'Contacto',
    'nav.portfolio': 'Portfolio',
    'nav.admin': 'Admin',
    'nav.cart': 'Carrito',
    'nav.portal': 'Portal Cliente',
    'nav.licenses': 'Mis Licencias',
    'cart.empty': 'Tu carrito está vacío',
    'cart.checkout': 'Proceder al Pago',
    'checkout.title': 'Finalizar compra',
    'checkout.bankTransfer': 'Transferencia Bancaria',
    'checkout.confirm': 'Confirmar Orden',
    'checkout.uploadProof': 'Sube tu comprobante de pago',
    'portal.title': 'Mis Pedidos',
    'portal.email': 'Ingresa tu correo para ver tus pedidos',
    'product.buy': 'Adquirir',
    'product.compare': 'Comparar',
    'product.promoCode': 'Código promocional',
    'product.apply': 'Aplicar',
    'calculator.title': 'Calculadora de Costos',
    'calculator.calculate': 'Calcular Presupuesto',
    'contact.title': 'Contáctanos',
    'contact.phone': 'Teléfono / WhatsApp',
    'contact.email': 'Correo',
    'contact.address': 'Oficinas',
    'footer.rights': 'Todos los derechos reservados',
    'admin.title': 'Panel Administrativo',
    'admin.dashboard': 'Dashboard',
    'admin.orders': 'Ventas',
    'admin.products': 'Productos',
    'admin.portfolio': 'Portfolio',
    'admin.banking': 'Datos Bancarios',
    'admin.receipts': 'Comprobantes',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.back': 'Volver',
    'common.noData': 'Sin registros',
    'common.view': 'Ver',
    'common.copy': 'Copiar',
    'common.download': 'Descargar',
    'status.pending': 'Pendiente',
    'status.paid': 'Pagado',
    'status.delivered': 'Entregado',
    'status.rejected': 'Rechazado',
    'status.cancelled': 'Cancelado',
    'status.active': 'Activo',
    'status.inactive': 'Inactivo',
    'theme.dark': 'Modo oscuro',
    'theme.light': 'Modo claro',
    'auth.login': 'Iniciar Sesión',
    'auth.logout': 'Cerrar Sesión',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'license.title': 'Mis Licencias',
    'license.key': 'Clave de licencia',
    'license.activations': 'Activaciones',
    'license.expires': 'Expira',
    'license.search': 'Buscar por correo',
    'license.copy': 'Licencia copiada',
    'license.noResults': 'No se encontraron licencias',
  },
  en: {
    'app.name': 'Construsmart',
    'app.tagline': 'Digital Solutions for Construction',
    'nav.home': 'Home',
    'nav.products': 'Digital Products',
    'nav.services': 'Services',
    'nav.calculator': 'Calculator',
    'nav.contact': 'Contact',
    'nav.portfolio': 'Portfolio',
    'nav.admin': 'Admin',
    'nav.cart': 'Cart',
    'nav.portal': 'Client Portal',
    'nav.licenses': 'My Licenses',
    'cart.empty': 'Your cart is empty',
    'cart.checkout': 'Proceed to Checkout',
    'checkout.title': 'Checkout',
    'checkout.bankTransfer': 'Bank Transfer',
    'checkout.confirm': 'Confirm Order',
    'checkout.uploadProof': 'Upload your payment receipt',
    'portal.title': 'My Orders',
    'portal.email': 'Enter your email to view your orders',
    'product.buy': 'Buy',
    'product.compare': 'Compare',
    'product.promoCode': 'Promo code',
    'product.apply': 'Apply',
    'calculator.title': 'Cost Calculator',
    'calculator.calculate': 'Calculate Budget',
    'contact.title': 'Contact Us',
    'contact.phone': 'Phone / WhatsApp',
    'contact.email': 'Email',
    'contact.address': 'Address',
    'footer.rights': 'All rights reserved',
    'admin.title': 'Admin Panel',
    'admin.dashboard': 'Dashboard',
    'admin.orders': 'Orders',
    'admin.products': 'Products',
    'admin.portfolio': 'Portfolio',
    'admin.banking': 'Banking',
    'admin.receipts': 'Receipts',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.back': 'Back',
    'common.noData': 'No records',
    'common.view': 'View',
    'common.copy': 'Copy',
    'common.download': 'Download',
    'status.pending': 'Pending',
    'status.paid': 'Paid',
    'status.delivered': 'Delivered',
    'status.rejected': 'Rejected',
    'status.cancelled': 'Cancelled',
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'theme.dark': 'Dark mode',
    'theme.light': 'Light mode',
    'auth.login': 'Log In',
    'auth.logout': 'Log Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'license.title': 'My Licenses',
    'license.key': 'License key',
    'license.activations': 'Activations',
    'license.expires': 'Expires',
    'license.search': 'Search by email',
    'license.copy': 'License copied',
    'license.noResults': 'No licenses found',
  },
};

let currentLocale: Locale = 'es';

export function setLocale(locale: Locale) {
  currentLocale = locale;
  document.documentElement.lang = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, ...args: (string | number)[]): string {
  const text = translations[currentLocale]?.[key] ?? translations.es[key] ?? key;
  if (args.length === 0) return text;
  return text.replace(/{(\d+)}/g, (_, index) => String(args[Number(index)] ?? ''));
}

// Toggle function for UI
export function toggleLocale(): Locale {
  const newLocale = currentLocale === 'es' ? 'en' : 'es';
  setLocale(newLocale);
  return newLocale;
}

// Get available locales
export function getLocales(): { code: Locale; name: string }[] {
  return [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
  ];
}