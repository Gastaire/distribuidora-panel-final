/**
 * @file Contiene la configuración central de la API.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este es el servicio de API.
 *   Existen otros módulos para componentes de UI, vistas, hooks, etc.
 *
 * Este archivo define la URL base para todas las llamadas a la API.
 * Se carga globalmente en `index.html` y la variable `API_URL` queda disponible
 * para todos los demás scripts que se carguen después.
 */
const API_URL = 'https://distriapi2.onzacore.site/api';
