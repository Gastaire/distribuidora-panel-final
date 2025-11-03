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
                
                // --- INICIO DE LA MODIFICACIÓN: Lógica especial para 'categoria' ---
                if (sortConfig.key === 'categoria') {
                    const aHasCategory = valA && valA.trim() !== '';
                    const bHasCategory = valB && valB.trim() !== '';

                    if (!aHasCategory && bHasCategory) return -1; // 'a' (sin categoría) va primero
                    if (aHasCategory && !bHasCategory) return 1;  // 'b' (sin categoría) va primero
                    
                    // Si ambos tienen o no tienen categoría, se aplica el ordenamiento normal de texto.
                }
                // --- FIN DE LA MODIFICACIÓN ---

                // --- Lógica de ordenamiento numérico ---
                if (numericSort && (sortConfig.key === 'total_monto' || sortConfig.key === 'total_cantidad' || sortConfig.key === 'id')) {
                    const numA = parseFloat(valA);
                    const numB = parseFloat(valB);
                    if (numA < numB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (numA > numB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }

                // Ordenamiento de texto por defecto
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
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