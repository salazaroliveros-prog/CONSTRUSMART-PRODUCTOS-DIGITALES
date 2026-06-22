# Checklist de Implementación — Mejoras Construsmart

## 🔴 CRÍTICAS (4/5)
- [x] 1. Eliminar Stripe muerto (functions + dependencia)
- [ ] 2. Migrar emailService.ts a Edge Function segura
- [x] 3. CRM hardcodeado → env var + try/catch + fallback  
- [x] 4. Rate limiting en OTP del portal cliente
- [x] 5. Configurar manualChunks en vite.config.ts

## 🟡 ALTAS (5/7)
- [x] 6. Notificaciones email automatizadas (aprobación/rechazo/entrega)
- [x] 7. Dashboard con gráficos (recharts)
- [ ] 8. Pasarela de pago con tarjeta (Stripe)
- [x] 9. Subida comprobantes para todas las órdenes
- [x] 10. Abandono de carrito automático
- [x] 11. Búsqueda y filtros de productos
- [x] 12. Paginación server-side en tablas Admin

## 🟢 MEDIAS (6/8)
- [ ] 13. Página "Mis Licencias" dedicada
- [x] 14. Toggle modo oscuro funcional
- [x] 15. SEO por página (Open Graph)
- [x] 16. Skeletons y estados vacíos con ilustraciones
- [ ] 17. i18n preparación
- [x] 18. Caching con React Query para productos
- [x] 19. Lazy loading nativo en imágenes
- [ ] 20. Lógica de descuentos en backend

## 🔵 BAJAS (3/6)
- [x] 21. Limpiar shadcn/ui no utilizados
- [ ] 22. Email de bienvenida
- [x] 23. Botón "Volver arriba" flotante
- [ ] 24. Cron job de limpieza
- [ ] 25. Tests unitarios y E2E
- [ ] 26. Logging centralizado