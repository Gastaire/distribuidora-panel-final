/**
 * @file Contiene la vista del Dashboard principal.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes como StatCard, Spinner, y varios iconos.
 *   Interactúa con la librería Chart.js para renderizar gráficos.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const DashboardView = ({ onShowImportVentasModal }) => {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [salesPeriod, setSalesPeriod] = React.useState('7d');
    const [topProductsLimit, setTopProductsLimit] = React.useState(5);
    const [dataSource, setDataSource] = React.useState('pedidos');
    const token = localStorage.getItem('token');
    const chartInstances = React.useRef({});

    const fetchStats = React.useCallback(async () => {
        setLoading(true); setError(null); setStats(null);
        try {
            const url = `${API_URL}/dashboard/stats?source=${dataSource}&salesPeriod=${salesPeriod}&topProductsLimit=${topProductsLimit}`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'No se pudieron cargar las estadísticas.');
            }
            setStats(await response.json());
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    }, [token, salesPeriod, topProductsLimit, dataSource]);

    React.useEffect(() => {
        fetchStats();
        return () => { Object.values(chartInstances.current).forEach(chart => chart.destroy()); };
    }, [fetchStats]);
    
    React.useEffect(() => {
        if (stats) {
            Object.values(chartInstances.current).forEach(chart => chart.destroy());
            chartInstances.current = {};
            
            const salesCtx = document.getElementById('salesChart');
            if (salesCtx) {
                const isMonthly = salesPeriod === 'monthly';
                chartInstances.current.salesChart = new Chart(salesCtx, { type: 'line', data: { labels: isMonthly ? stats.salesByDay.map(d => d.saleMonth) : stats.salesByDay.map(d => new Date(d.saleDate).toLocaleDateString()), datasets: [{ label: `Ingresos (${isMonthly ? 'por Mes' : 'por Día'})`, data: isMonthly ? stats.salesByDay.map(d => d.monthlyRevenue) : stats.salesByDay.map(d => d.dailyRevenue), borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.5)', fill: true, tension: 0.1 }] } });
            }
            const productsCtx = document.getElementById('productsChart');
            if (productsCtx) {
                chartInstances.current.productsChart = new Chart(productsCtx, { type: 'bar', data: { labels: stats.topProducts.map(p => p.nombre), datasets: [{ label: 'Unidades Vendidas', data: stats.topProducts.map(p => p.totalQuantity), backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(249, 115, 22, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(132, 204, 22, 0.7)', 'rgba(34, 197, 94, 0.7)'] }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } } } });
            }
            const customersCtx = document.getElementById('customersChart');
            if (customersCtx && stats.topCustomers && stats.topCustomers.length > 0) {
                 chartInstances.current.customersChart = new Chart(customersCtx, { type: 'doughnut', data: { labels: stats.topCustomers.map(c => c.nombre_comercio), datasets: [{ label: 'Monto Comprado', data: stats.topCustomers.map(c => c.totalSpent), backgroundColor: ['#4c51bf', '#667eea', '#7f9cf5', '#a3bffa', '#c3dafe'] }] } });
            }
        }
    }, [stats, salesPeriod]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">Dashboard</h1><p className="text-gray-500">Resumen general de la actividad.</p></div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg"><button onClick={() => setDataSource('pedidos')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${dataSource === 'pedidos' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>Pedidos App</button><button onClick={() => setDataSource('presencial')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${dataSource === 'presencial' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>Ventas Presenciales</button></div>
                    <button onClick={onShowImportVentasModal} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shrink-0"><UploadIcon className="h-5 w-5 mr-2" /> Importar</button>
                </div>
            </div>
            
            {loading && <div className="flex justify-center p-10"><Spinner className="border-blue-500 h-10 w-10" /></div>}
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            {stats && (
                <div className="space-y-8">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Ingresos Totales" value={`$${parseFloat(stats.totalRevenue).toLocaleString('es-AR')}`} icon={<ChartBarIcon className="h-6 w-6 text-green-600" />} color="green" />
                        <StatCard title="Total Transacciones" value={stats.totalOrders} icon={<ShoppingCartIcon className="h-6 w-6 text-blue-600" />} color="blue" />
                        <StatCard title="Ticket Promedio" value={`$${(stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders) : 0).toLocaleString('es-AR', {maximumFractionDigits: 0})}`} icon={<ActivityIcon className="h-6 w-6 text-purple-600" />} color="purple" />
                        <StatCard title="Productos Distintos" value={stats.topProducts.length} icon={<PackageIcon className="h-6 w-6 text-orange-600" />} color="orange" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-700">Evolución de Ingresos</h3><div className="flex gap-1 bg-gray-100 p-1 rounded-lg"><button onClick={() => setSalesPeriod('7d')} className={`px-2 py-1 text-xs font-bold rounded-md ${salesPeriod === '7d' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>7 Días</button><button onClick={() => setSalesPeriod('30d')} className={`px-2 py-1 text-xs font-bold rounded-md ${salesPeriod === '30d' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>30 Días</button><button onClick={() => setSalesPeriod('monthly')} className={`px-2 py-1 text-xs font-bold rounded-md ${salesPeriod === 'monthly' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Meses</button></div></div>
                            <div className="h-64"><canvas id="salesChart"></canvas></div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-700">Top Productos</h3><div className="flex gap-1 bg-gray-100 p-1 rounded-lg"><button onClick={() => setTopProductsLimit(5)} className={`px-2 py-1 text-xs font-bold rounded-md ${topProductsLimit === 5 ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>5</button><button onClick={() => setTopProductsLimit(10)} className={`px-2 py-1 text-xs font-bold rounded-md ${topProductsLimit === 10 ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>10</button></div></div>
                            <div className="h-64"><canvas id="productsChart"></canvas></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};