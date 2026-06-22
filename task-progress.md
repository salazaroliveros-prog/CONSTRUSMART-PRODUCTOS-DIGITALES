# Checklist de Implementación — Mejoras Construsmart

## 🔴 CRÍTICAS (5/5)
- [x] 1. Eliminar Stripe muerto (functions + dependencia)
- [ ] 2. Migrar emailService.ts a Edge Function segura + limpiar frontend
- [x] 3. CRM hardcodeado → env var + try/catch + fallback  
- [x] 4. Rate limiting en OTP del portal cliente
- [x] 5. Configurar manualChunks en vite.config.ts

## 🟡 ALTAS (3/7)
- [ ] 6. Notificaciones email automatizadas (aprobación/rechazo/entrega)
- [x] 7. Dashboard con gráficos (recharts + react-query)
- [ ] 8. Pasarela de pago con tarjeta (Stripe)
- [x] 9. Subida comprobantes para todas las órdenes
- [ ] 10. Abandono de carrito automático
- [x] 11. Búsqueda y filtros de productos
- [ ] 12. Paginación server-side en tablas Admin

## 🟢 MEDIAS (3/8)
- [ ] 13. Página "Mis Licencias" dedicada
- [x] 14. Toggle modo oscuro funcional
- [x] 15. SEO por página (Open Graph)
- [ ] 16. Skeletons y estados vacíos con ilustraciones
- [ ] 17. i18n preparación
- [ ] 18. Caching con React Query para productos
- [x] 19. Lazy loading nativo en imágenes
- [ ] 20. Lógica de descuentos en backend

## 🔵 BAJAS (2/6)
- [x] 21. Limpiar shadcn/ui no utilizados
- [ ] 22. Email de bienvenida
- [x] 23. Botón "Volver arriba" flotante
- [ ] 24. Cron job de limpieza
- [ ] 25. Tests unitarios y E2E
- [ ] 26. Logging centralizado