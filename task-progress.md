# Checklist de Implementación — Mejoras Construsmart

## 🔴 CRÍTICAS
- [ ] 1. Eliminar Stripe muerto (functions + dependencia)
- [ ] 2. Migrar emailService.ts a Edge Function segura + limpiar frontend
- [ ] 3. CRM hardcodeado → env var + try/catch + fallback
- [ ] 4. Rate limiting en OTP del portal cliente
- [ ] 5. Configurar manualChunks en vite.config.ts

## 🟡 ALTAS
- [ ] 6. Notificaciones email automatizadas (aprobación/rechazo/entrega)
- [ ] 7. Dashboard con gráficos (recharts + react-query)
- [ ] 8. Pasarela de pago con tarjeta (Stripe)
- [ ] 9. Subida comprobantes para todas las órdenes
- [ ] 10. Abandono de carrito automático
- [ ] 11. Búsqueda y filtros de productos
- [ ] 12. Paginación server-side en tablas Admin

## 🟢 MEDIAS
- [ ] 13. Página "Mis Licencias" dedicada
- [ ] 14. Toggle modo oscuro funcional
- [ ] 15. SEO por página (Open Graph)
- [ ] 16. Skeletons y estados vacíos con ilustraciones
- [ ] 17. i18n preparación
- [ ] 18. Caching con React Query para productos
- [ ] 19. Lazy loading nativo en imágenes
- [ ] 20. Lógica de descuentos en backend

## 🔵 BAJAS
- [ ] 21. Limpiar shadcn/ui no utilizados
- [ ] 22. Email de bienvenida
- [ ] 23. Botón "Volver arriba" flotante
- [ ] 24. Cron job de limpieza
- [ ] 25. Tests unitarios y E2E
- [ ] 26. Logging centralizado