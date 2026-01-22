---
description: Prompt template para Step 1 - Seguridad y Base de Datos
---

```markdown
# PROMPT TÉCNICO (Step 5): OPTIMIZACIÓN Y PERFORMANCE + QUALITY GATES (MI PANA APP 3.0)

**Rol**: Frontend Performance Engineer + PWA Specialist + Release Gatekeeper  
**Modelo Objetivo**: Gemini Flash  
**Objetivo**: Optimizar la app para producción (bundle, PWA, Lighthouse) minimizando tiempos de carga y maximizando eficiencia en móviles, **sin romper estabilidad** (tests y smoke E2E deben seguir pasando).

---

## CONTEXTO (ENTRADA APROBADA)
Step 4.1 + 4.2 completados. El proyecto está READY FOR STEP 5 (con observaciones ya mitigadas: smoke E2E wallet dentro de auth flow, null-safety en WalletDashboard, y tests unitarios robustos en Wallet/Trips). 

---

## EJECUCIÓN EN PARALELO (PARALLEL TRACKS)
Ejecuta y reporta resultados por tracks paralelos:

- **Track A**: Build + Bundle
- **Track B**: PWA + Assets
- **Track C**: Lighthouse + UX móvil
- **Track D (Gate)**: No-regresión (Tests + Smoke E2E) en paralelo

**Regla**: Si un Track bloquea, se detiene el avance y se reporta FAILED/REQUIRES FIX.

---

# TRACK A) ANÁLISIS DE BUILD Y BUNDLE

## A1. Ejecución de Build
1. Ejecuta `npm run build`.
2. Reporta:
- Build: OK / FAIL
- Tiempo de build
- Warnings (no ignorar)
- Tamaño total de `dist/` (aprox)
3. Clasifica warnings:
- **W1**: Ruido (no afecta prod)
- **W2**: Riesgo potencial (performance/compatibilidad)
- **W3**: Riesgo crítico (seguridad/integridad/build)

**BLOQUEO**: Si el build falla → Step 5 = FAILED.

## A2. Auditoría de Bundle (Bundle Inspection)
Objetivo: identificar los paquetes/chunks más pesados y optimizarlos con:
- tree-shaking
- code splitting
- lazy loading por rutas/componentes

### Herramienta recomendada (Vite/Rollup)
Si el proyecto usa Vite, propone y/o configura análisis con:
- `rollup-plugin-visualizer` para generar `stats.html` (treemap) [web:53][web:101]
- Alternativa: `vite-bundle-analyzer` si aplica en tu stack [web:97]

**Salida requerida**:
```text
Top 10 módulos/chunks por peso:
| Módulo/Chunk | Tamaño | Por qué pesa | Acción | Ahorro estimado |
```

### Acciones típicas (solo proponer, no romper nada)
- Lazy loading de pantallas pesadas (Wallet, Admin, Driver Dashboard).
- Importaciones por-path (ej: `lodash-es/pick` en vez de `lodash`) si aplica.
- Reemplazo de libs pesadas si existen.
- Split de vendor chunks si Vite no lo hace como esperas.
- Eliminar dependencias no usadas / duplicadas.

## A3. Dependencias “dev” colándose en prod
- Revisa si algo de `devDependencies` se está bundleando.
- Propón mover/eliminar/reemplazar.
- Detecta “dead code” que infla bundle.

---

# TRACK B) OPTIMIZACIÓN PWA Y ASSETS

## B1. Service Worker (SW) y estrategias de caché
Verifica configuración (Workbox / vite-pwa / custom SW):

Estrategias recomendadas:
- **Cache First**: assets estáticos versionados (JS/CSS/icons/fonts).
- **Stale-While-Revalidate**: shell, assets con actualizaciones frecuentes [web:54][web:105].
- **Network-only**: mutaciones y flujos financieros (recargas/pagos/viajes) → NO cachear.

**BLOQUEO**: Si detectas caching de endpoints financieros o auth sensibles → marcar CRÍTICO.

## B2. manifest.json (instalabilidad)
Audita `manifest.json`:
- `name`, `short_name`
- `start_url`
- `display: "standalone"`
- `theme_color`, `background_color`
- `icons` correctos (incluyendo tamaños y maskable si aplica)

Reporta campos faltantes o inconsistentes (Android/iOS).

## B3. Assets (imágenes y estáticos)
- Verifica compresión y formatos modernos: WebP/SVG (y AVIF si aplica).
- Confirma que imágenes grandes tengan lazy loading bajo el fold.
- Evitar CLS: `width/height` o contenedores con ratio.
- Revisión de fuentes: preloads solo si realmente aportan.

---

# TRACK C) MÉTRICAS LIGHTHOUSE (SIMULACIÓN GUIADA + OBJETIVOS)

Simula/guía análisis Lighthouse enfocado en:

## C1. Performance
- FCP (First Contentful Paint)
- TTI (Time to Interactive) [web:106]
- (si aplica) LCP/CLS/TBT

**Objetivos sugeridos**:
- FCP < 1.8s
- TTI < 3.8s (umbral típico “verde”) [web:103]
- Performance score 90+

## C2. Accesibilidad
- Contraste
- labels/aria en botones y formularios críticos (login, recarga, solicitar viaje)

## C3. Best Practices
- HTTPS
- errores en consola: 0
- librerías inseguras/deprecadas (si se detectan)

## C4. SEO (landing)
- `<title>` y meta description
- viewport
- canonical básico
- OpenGraph mínimo si aplica

**Salida requerida**:
```text
| Categoría | Score objetivo | Score estimado | Bloqueadores | Acciones |
```

---

# TRACK D) QUALITY GATES (NO-REGRESIÓN) — EN PARALELO

## D1. Gate de unit tests
1. Ejecuta `npm run test`.
2. (Si existe) Ejecuta `npm run test:coverage` y reporta cobertura por servicios críticos.

**BLOQUEO**: Si tests fallan → Step 5 FAILED.

## D2. Gate Smoke E2E
Ejecuta el smoke E2E mínimo (Playwright):
- Login + navegación a Wallet + verificar que se renderiza el botón “Recargar”
- (Opcional) mock de recarga para confirmar UI feedback

**BLOQUEO**:
- Si falla login o wallet render → Step 5 REQUIRES FIX (porque rompe UI core).

---

# RESTRICCIONES OPERATIVAS (STRICT)
1. **No ignores Warnings** del build o tests.
2. **No sacrifiques seguridad por performance**: nada de cachear auth o pagos.
3. **No merges optimizaciones** si:
- aumenta bundle size sin mejora real
- rompe tests o smoke E2E
- introduce “quick hacks” que afecten UX o integridad

---

# ENTREGABLE (GOVERNANCE REPORT)

Genera el reporte final con este formato exacto:

```text
## REPORTE DE OPTIMIZACIÓN Y PERFORMANCE (Step 5)

### 1) RESUMEN EJECUTIVO
- Estado general: [OPTIMIZADO / REQUIERE AJUSTES / BLOQUEADO]
- Track A (Build/Bundle): [OK/FAIL]
- Track B (PWA/Assets): [OK/FAIL]
- Track C (Lighthouse): [OK/REQUIERE AJUSTES]
- Track D (Gates Tests/E2E): [OK/FAIL]
- Riesgo móvil: [BAJO/MEDIO/ALTO]

### 2) TRACK A — BUNDLE SIZE
- Build: [OK/FAIL] + Warnings (W1/W2/W3)
- Tamaño dist/: [X]
- Top 10 módulos/chunks: [lista]
- Ahorros detectados: [X kb/mb]
- Acciones priorizadas:
  1) [...]
  2) [...]
  3) [...]

### 3) TRACK B — PWA + ASSETS
- Service Worker: [OK/INCOMPLETO/RIESGOSO]
- Estrategias de caché por tipo: [detalle]
- Manifest: [OK/Correcciones]
- Assets: [OK/Correcciones]

### 4) TRACK C — LIGHTHOUSE (OBJETIVOS)
- Performance: [estimación] (objetivo 90+)
- Accesibilidad: [estimación] (objetivo 95+)
- Best Practices: [estimación] (objetivo 100)
- SEO: [estimación] (objetivo 100)
- Principales causas de score bajo: [lista]
- Acciones: [lista concreta]

### 5) TRACK D — QUALITY GATES (NO-REGRESIÓN)
- Unit tests: [passed/failed]
- Coverage (si aplica): Wallet / Trips / Auth
- Smoke E2E: [passed/failed]
- Resultado gate: [OK / BLOQUEADO]

### 6) RECOMENDACIÓN DE AVANCE
- ¿App optimizada para despliegue? [SÍ/NO]
- Bloqueadores: [#]
- Cambios obligatorios antes de release: [lista]
```

---

## NOTA FINAL (si no puedes ejecutar comandos)
Si el entorno no permite ejecución real, entonces:
1) Genera checklist de comandos exactos a correr local/CI.
2) Propón cambios por archivo (vite config, SW, manifest, lazy routes).
3) Prioriza acciones por impacto móvil (alto/medio/bajo).
```

Si me confirmas si estás en **Vite + React**, puedo darte un “micro-addendum” con comandos exactos de analyzer (visualizer) y un ejemplo de lazy loading por rutas sin tocar tu arquitectura.



# PROMPT (Step 5.1): FIX BLOQUEADOR E2E WALLET RECHARGE (MI PANA APP 3.0)

**Rol**: Playwright E2E Stabilization Engineer  
**Objetivo**: Reparar `wallet-recharge.spec.ts` eliminando flakiness y evitando dependencias frágiles (placeholder '0.00'). El gate Step 5 debe pasar.

---

## CONTEXTO DEL FALLO
- Smoke E2E falló: Timeout 30s esperando input de monto ('0.00').
- Posible causa: modal no abre o placeholder cambió.
- Login flow ya pasa.

---

## 1) DIAGNÓSTICO OBLIGATORIO (SIN ADIVINAR)
1. Abre `wallet-recharge.spec.ts` y localiza:
   - cómo se abre el modal
   - cómo se selecciona el input
2. Ejecuta el test en modo debug/trace.
3. Entrega evidencia mínima:
   - screenshot en el punto de fallo
   - DOM snippet (o selector log) confirmando si el modal existe
   - si el botón “Recargar” fue clickeado realmente

---

## 2) CAMBIO DE ESTRATEGIA DE SELECTORES (ESTABLE)
Reescribe el test usando esta jerarquía:

### Prioridad 1 (ideal): getByRole / getByLabel
- Botón abrir modal:
  - `page.getByRole('button', { name: /recargar/i })`
- Modal:
  - `page.getByRole('dialog', { name: /recarga|recargar/i })` (si aplica)
- Input monto:
  - `modal.getByRole('textbox', { name: /monto/i })` o `modal.getByLabel(/monto/i)`

### Prioridad 2 (fallback): data-testid
Si no hay labels/roles claros, agrega en el componente:
- `data-testid="wallet-recharge-open"`
- `data-testid="wallet-recharge-amount"`
- `data-testid="wallet-recharge-submit"`

Y usa en Playwright:
- `page.getByTestId('wallet-recharge-amount')`

**Regla**: Prohibido depender de placeholder exacto como selector.

---

## 3) ASSERTIONS POR ETAPAS (EVITAR TIMEOUTS CIEGOS)
El test debe validar etapa por etapa:

1. Estoy en WalletPage
   - `await expect(page).toHaveURL(/wallet/)`
2. Botón “Recargar” visible
   - `await expect(openBtn).toBeVisible()`
3. Clic abre modal
   - `await openBtn.click()`
4. Modal visible (assert)
   - `await expect(modal).toBeVisible()`
5. Input monto visible (assert)
   - `await expect(amountInput).toBeVisible()`
6. Interacción robusta con input (si masked):
   - `await amountInput.click()`
   - `await amountInput.fill('100')`
7. Submit y confirmación:
   - Esperar toast/alert “Recarga exitosa” o estado “pendiente”, según UI.

---

## 4) OUTPUT REQUERIDO
Entrega:
- Código final completo de `wallet-recharge.spec.ts` actualizado.
- Si hiciste cambios UI: snippet del componente con data-testid o labels.
- Confirmación: Smoke E2E pasa localmente (o con command exacto para correrlo).
- Nota: qué selector quedó como estándar para el resto de E2E.

---

## 5) CRITERIO DE CIERRE
- `npx playwright test wallet-recharge.spec.ts` pasa 3 veces seguidas.
- Sin aumentar timeouts globales como “solución”.
