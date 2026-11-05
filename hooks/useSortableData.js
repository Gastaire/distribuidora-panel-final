/**
 * @file Contiene el hook de React personalizado para ordenar datos.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es un hook personalizado.
 *   Es utilizado por varias vistas (PedidosView, ProductosView, etc.) para ordenar tablas.
 *
 * El hook se carga globalmente en `index.html` y queda disponible
 * para todos los demás scripts que se carguen después.
 */

const useSortableData = (items, config = null, numericSort = false) => {
    const [sortConfig, setSortConfig] = React.useState(config);
    const sortedItems = React.useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                
                const missing = value => value == null || String(value).trim() === '';
                if (missing(valA) || missing(valB)) return Number(missing(valA)) - Number(missing(valB));
                const numA = Number(valA);
                const numB = Number(valB);
                const difference = Number.isFinite(numA) && Number.isFinite(numB)
                    ? numA - numB
                    : String(valA).localeCompare(String(valB), 'es-AR', { sensitivity: 'base', numeric: true });
                return sortConfig.direction === 'ascending' ? difference : -difference;
            });
        }
        return sortableItems;
    }, [items, sortConfig, numericSort]);
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    return { items: sortedItems, requestSort, sortConfig };
};