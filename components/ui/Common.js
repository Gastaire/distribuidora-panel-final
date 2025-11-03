/**
 * @file Contiene componentes de UI comunes y reutilizables.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo contiene componentes de UI comunes.
 *   Se integra con las vistas (ej. PedidosView, DashboardView) y otros componentes.
 *
 * Los componentes se cargan globalmente en `index.html` y quedan disponibles
 * para todos los demás scripts que se carguen después.
 */

const NavItem = ({ icon, text, active, onClick }) => (<a href="#" onClick={onClick} className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${ active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white' }`}><span className="mr-3">{icon}</span><span className="font-medium">{text}</span></a>);

const EstadoBadge = ({ estado }) => {
    const estados = { pendiente: 'Pendiente', visto: 'Visto', en_preparacion: 'En Preparación', facturado: 'Facturado', listo_para_entrega: 'Listo p/ Entrega', entregado: 'Entregado', cancelado: 'Cancelado', archivado: 'Archivado' };
    const styles = { pendiente: 'bg-yellow-100 text-yellow-800', visto: 'bg-blue-100 text-blue-800', en_preparacion: 'bg-indigo-100 text-indigo-800', entregado: 'bg-green-100 text-green-800', listo_para_entrega: 'bg-purple-100 text-purple-800', facturado: 'bg-gray-200 text-gray-800', cancelado: 'bg-red-100 text-red-800', archivado: 'bg-gray-400 text-white' };
    return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>{estados[estado] || estado}</span>);
};

// --- INICIO DE LA MODIFICACIÓN: Añadir StockBadge ---
const StockBadge = ({ producto }) => {
    if (!producto) return null;

    if (producto.controla_stock) {
        const cantidad = parseFloat(producto.stock_cantidad);
        let style = 'bg-green-100 text-green-800'; // Stock positivo
        if (cantidad <= 0) {
            style = 'bg-red-100 text-red-800'; // Sin stock
        } else if (cantidad <= 5) {
            style = 'bg-yellow-100 text-yellow-800'; // Stock bajo
        }
        
        // Formatear número con 3 decimales si los tiene, si no, sin decimales.
        const formattedCantidad = Number.isInteger(cantidad) 
            ? cantidad 
            : cantidad.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 3 });

        return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>{formattedCantidad}</span>);
    } else {
        const tieneStock = producto.stock === 'Sí';
        const style = tieneStock ? 'text-gray-700' : 'text-red-500 font-bold';
        return (<span className={`text-sm ${style}`}>{producto.stock}</span>);
    }
};
// --- FIN DE LA MODIFICACIÓN ---

const TableHeader = ({ children, sortKey, sortConfig, onSort }) => (<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => onSort(sortKey)}>{children}{sortConfig.key === sortKey ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</th>);

const StatCard = ({ title, value, icon, color }) => {
    const colors = {
        green: 'bg-green-100',
        yellow: 'bg-yellow-100',
        purple: 'bg-purple-100'
    };
    const iconColors = {
        green: 'text-green-600',
        yellow: 'text-yellow-600',
        purple: 'text-purple-600',
        default: 'text-blue-600'
    };

    // Si el icono es un componente React, le pasamos la clase de color.
    const coloredIcon = React.isValidElement(icon) 
        ? React.cloneElement(icon, { className: `${icon.props.className || ''} ${iconColors[color] || iconColors.default}` })
        : icon;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
            <div className={`${colors[color] || 'bg-blue-100'} p-3 rounded-full`}>{coloredIcon}</div>
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};