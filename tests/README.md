# Verificación del rediseño administrativo

El panel mantiene React 17, Babel en el navegador y el despliegue estático original. Las dependencias de npm son exclusivamente herramientas de prueba.

```bash
npm ci
npm test
# Opcional: comprobar con Chart.js real del CDN usado por index.html
QA_REAL_CHARTS=1 npm test
# Si Chrome está instalado en otra ubicación
CHROME_PATH=/ruta/a/chrome npm test
```

Las pruebas sirven los archivos locales mediante Playwright e interceptan todas las llamadas a la API. No acceden a datos reales ni crean registros en staging. Se verifica:

- Renderizado de KPI y cantidades fraccionarias.
- Creación y limpieza de gráficos al actualizar, cambiar fechas y alternar fuentes.
- Recuperación de errores, sin mostrar indicadores anteriores como resultados vigentes.
- Fechas vacías, accesos a importación y navegación.
- Foco inicial, recorrido con Tab, Escape y devolución del foco en formularios.
- Envío a los endpoints originales de creación de productos, clientes y usuarios.
- Navegación móvil y ausencia de desbordamiento horizontal en el resumen.

Se generan capturas en `/tmp/distrimaxi-panel-desktop.png` y `/tmp/distrimaxi-panel-mobile.png`. El CDN de Tailwind requiere conexión; Chart.js está simulado salvo que se indique `QA_REAL_CHARTS=1`. Los demás recursos externos no necesarios para estas pruebas se simulan. No se comprueban exportaciones PDF ni impresiones mediante este test.

## Validación pendiente en staging

Antes de integrar a `dev`, probar con una cuenta admin y una cuenta depósito: edición y estados de pedidos, notas, historial anidado, impresión y PDF, importaciones CSV válidas e inválidas, altas y ediciones, archivo/restauración de productos, categorías, reportes, zonas, permisos y reautenticación para eliminaciones.

## Interpretación de los indicadores

Se conserva el contrato de `/dashboard/stats` sin modificar la API:

- Valor de pedidos incluye estados distintos de cancelado/archivado; no representa cobros.
- Pendientes cuenta pedidos creados en los últimos 7 días.
- Facturados recientes usa estado actual y fecha de creación en las últimas 12 horas, no fecha de facturación.
- Cobertura expresa clientes con pedidos en el período sobre clientes totales; no mide retención histórica.
- Faltantes es una estimación a precios actuales del catálogo.
- Evolución semanal usa los últimos días actuales, independientemente del filtro de fechas; el año anterior es una referencia agregada por día de semana.

## Pedidos, zonas, productos y reportes

`QA_DOCUMENTS=1 npm test` verifica ambos diseños con jsPDF real y guarda ejemplos ficticios en `/tmp/qa-price-list.pdf` y `/tmp/qa-catalog.pdf`.
La suite intercepta cualquier ruta `/api/`, incluida la configuración actual que apunta a producción. Prueba un fallo HTTP al guardar zonas y verifica que el editor siga abierto; también comprueba el acceso al reporte diario y su manejo de error.

Cambios adicionales: filtros de estado y contadores en pedidos, hoja de ruta para depósito conforme a los permisos existentes del backend, disponibilidad de productos considerando stock numérico, precios decimales, validación de cada escritura repetida de zonas, protección ante consultas obsoletas de reportes y calendario, y descarga de tablas visibles en CSV. Las repeticiones del calendario usan operaciones individuales del endpoint existente: si una falla, las anteriores permanecen guardadas y el mensaje lo indica. La API no ofrece una transacción de lote.

La revista nueva es tipográfica, por categorías y precios; no incluye fotos. No se han agregado operaciones de combinación ni limpieza masiva de pedidos. Se mantienen los flujos existentes de edición, archivo, restauración, notas e impresión. La revisión de contratos se hizo contra el código local de la API; no se consultaron endpoints de producción.
