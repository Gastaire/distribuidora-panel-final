/**
 * @file Contiene la vista de análisis de ventas.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes de UI como StatCard, Spinner, TableHeader y el hook useSortableData.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const AnalyticsView = ({ allCategories }) => {
    const [filters, setFilters] = React.useState({
        category: allCategories.length > 0 ? allCategories[0] : '',
        channel: 'todos',
        startDate: '',
        endDate: ''
    });
    const [kpiData, setKpiData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const token = localStorage.getItem('token');

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const fetchKpis = async () => {
        if (!filters.category) {
            setError('Por favor, selecciona una categoría para empezar.');
            setKpiData(null);
            return;
        }
        setLoading(true);
        setError(null);
        setKpiData(null);
        try {
            const params = new URLSearchParams({
                category: filters.category,
                channel: filters.channel
            });
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(`${API_URL}/kpi/category-kpis?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al obtener los datos.');
            setKpiData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Cargar datos iniciales para la primera categoría al montar el componente
    React.useEffect(() => {
        if (filters.category) {
            fetchKpis();
        }
    }, []); // Se ejecuta solo una vez

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Análisis de Ventas por Categoría</h1>
                <p className="text-gray-500">Analiza el rendimiento de los productos por categoría, canal y período de tiempo.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
                        <select name="category" id="category" value={filters.category} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="channel" className="block text-sm font-medium text-gray-700">Canal de Venta</label>
                        <select name="channel" id="channel" value={filters.channel} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="todos">Todos</option>
                            <option value="pedidos">Pedidos App</option>
                            <option value="presencial">Venta Presencial</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                        <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                        <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={fetchKpis} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        {loading ? <><Spinner className="mr-2"/> Analizando...</> : 'Generar Reporte'}
                    </button>
                </div>
            </div>

            {loading && <div className="flex justify-center p-10"><Spinner className="border-blue-500 h-10 w-10" /></div>}
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            {kpiData && (
                <div className="space-y-8">
                    {/* Tarjetas de Resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Ingresos Totales" 
                            value={`$${parseFloat(kpiData.summary.totalMonto).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                            icon={<UsersIcon className="h-6 w-6 text-green-600" />}
                            color="green"
                        />
                        <StatCard 
                            title="Unidades/Kilos Vendidos" 
                            value={parseFloat(kpiData.summary.totalCantidad).toLocaleString('es-AR', { 
                                minimumFractionDigits: filters.category.toLowerCase() === 'fiambreria' ? 2 : 0,
                                maximumFractionDigits: filters.category.toLowerCase() === 'fiambreria' ? 2 : 0
                            })} 
                            icon={<PackageIcon className="h-6 w-6 text-yellow-600" />}
                            color="yellow"
                        />
                        <StatCard 
                            title="Productos Distintos" 
                            value={kpiData.summary.totalProductos} 
                            icon={<ShoppingCartIcon className="h-6 w-6 text-purple-600" />}
                            color="purple"
                        />
                    </div>

                    {/* Tabla de Resultados Detallados */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <h3 className="text-lg font-bold text-gray-800 p-6">Detalle por Producto</h3>
                        {kpiData.kpis.length > 0 ? (
                            <KpiResultsTable data={kpiData.kpis} category={filters.category} />
                        ) : (
                            <p className="px-6 pb-6 text-center text-gray-500">No se encontraron ventas para los filtros seleccionados.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const KpiResultsTable = ({ data, category }) => {
    const { items: sortedItems, requestSort, sortConfig } = useSortableData(data, { key: 'total_monto', direction: 'descending' }, true);
    
    const formatQuantity = (quantity) => {
        const number = parseFloat(quantity);
        if (category.toLowerCase() === 'fiambreria') {
            return number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return number.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <TableHeader sortKey="nombre" sortConfig={sortConfig} onSort={requestSort}>Producto</TableHeader>
                        <TableHeader sortKey="total_cantidad" sortConfig={sortConfig} onSort={requestSort}>Cantidad Vendida</TableHeader>
                        <TableHeader sortKey="total_monto" sortConfig={sortConfig} onSort={requestSort}>Monto Total</TableHeader>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nombre}</td>
                            <td className="px-6 py-4 text-sm text-gray-700 text-center">{formatQuantity(item.total_cantidad)}</td>
                            <td className="px-6 py-4 text-sm text-gray-700 text-right font-semibold">${parseFloat(item.total_monto).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};