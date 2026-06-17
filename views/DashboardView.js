const DashboardView = ({ onShowImportVentasModal }) => {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    // Filtros de fecha y visualización
    const [startDate, setStartDate] = React.useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
    const [endDate, setEndDate] = React.useState(new Date().toISOString().slice(0, 10));
    const [topProductsLimit, setTopProductsLimit] = React.useState(5);
    const [dataSource, setDataSource] = React.useState('pedidos');
    const token = localStorage.getItem('token');
    const chartInstances = React.useRef({});

    const fetchStats = React.useCallback(async () => {
        setLoading(true); setError(null); setStats(null);
        try {
            const url = `${API_URL}/dashboard/stats?source=${dataSource}&startDate=${startDate}&endDate=${endDate}&topProductsLimit=${topProductsLimit}`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'No se pudieron cargar las estadísticas.');
            }
            setStats(await response.json());
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    }, [token, startDate, endDate, topProductsLimit, dataSource]);

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
                chartInstances.current.salesChart = new Chart(salesCtx, { 
                    type: 'line', 
                    data: { 
                        labels: stats.salesByDay.map(d => new Date(d.saleDate).toLocaleDateString('es-AR')), 
                        datasets: [{ 
                            label: `Ingresos por Día`, 
                            data: stats.salesByDay.map(d => d.dailyRevenue), 
                            borderColor: 'rgb(59, 130, 246)', 
                            backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                            fill: true, 
                            tension: 0.3 
                        }] 
                    },
                    options: { maintainAspectRatio: false }
                });
            }
            const productsCtx = document.getElementById('productsChart');
            if (productsCtx) {
                chartInstances.current.productsChart = new Chart(productsCtx, { 
                    type: 'bar', 
                    data: { 
                        labels: stats.topProducts.map(p => p.nombre), 
                        datasets: [{ 
                            label: 'Unidades', 
                            data: stats.topProducts.map(p => p.totalQuantity), 
                            backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)'] 
                        }] 
                    }, 
                    options: { maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } } 
                });
            }
        }
    }, [stats]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Intelligence Center</h1>
                    <p className="text-gray-500">Métricas clave de negocio e ingresos operativos.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setDataSource('pedidos')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dataSource === 'pedidos' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>App</button>
                        <button onClick={() => setDataSource('presencial')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dataSource === 'presencial' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>Presencial</button>
                    </div>
                    <button onClick={onShowImportVentasModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shrink-0 shadow"><UploadIcon className="h-5 w-5 mr-2" /> Importar</button>
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 bg-white border rounded-xl p-4 shadow-sm">
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Desde</label>
                    <input type="text" placeholder="DD/MM/YYYY" onFocus={e => e.target.type = 'date'} onBlur={e => { e.target.type = 'text'; if (e.target.value) { const [y,m,d]=e.target.value.split('-'); e.target.value=`${d}/${m}/${y}`; } }} defaultValue={startDate.split('-').reverse().join('/')} onChange={e => { if(e.target.type==='date') setStartDate(e.target.value); }} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Hasta</label>
                    <input type="text" placeholder="DD/MM/YYYY" onFocus={e => e.target.type = 'date'} onBlur={e => { e.target.type = 'text'; if (e.target.value) { const [y,m,d]=e.target.value.split('-'); e.target.value=`${d}/${m}/${y}`; } }} defaultValue={endDate.split('-').reverse().join('/')} onChange={e => { if(e.target.type==='date') setEndDate(e.target.value); }} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36" />
                </div>
                <div className="flex-1"></div>
            </div>
            
            {loading && <div className="flex justify-center p-16"><Spinner className="border-blue-500 h-10 w-10" /></div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            {stats && !loading && (
                <div className="space-y-6">
                    {/* Primera fila de KPIs principales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Ingresos Totales" value={`$${parseFloat(stats.totalRevenue).toLocaleString('es-AR')}`} icon={<ChartBarIcon className="h-6 w-6 text-green-600" />} color="green" />
                        <StatCard title="Total Transacciones" value={stats.totalOrders} icon={<ShoppingCartIcon className="h-6 w-6 text-blue-600" />} color="blue" />
                        <StatCard title="Ticket Promedio" value={`$${(stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders) : 0).toLocaleString('es-AR', {maximumFractionDigits: 0})}`} icon={<ActivityIcon className="h-6 w-6 text-purple-600" />} color="purple" />
                        <StatCard title="Productos Distintos" value={stats.topProducts.length} icon={<PackageIcon className="h-6 w-6 text-orange-600" />} color="orange" />
                    </div>

                    {/* Segunda fila de KPIs avanzados (solo si es app) */}
                    {dataSource === 'pedidos' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 rounded-xl shadow-sm">
                                <p className="text-sm font-bold text-red-800">Ventas Perdidas (Faltantes)</p>
                                <p className="text-2xl font-black text-red-600 mt-1">${parseFloat(stats.lostRevenue).toLocaleString('es-AR')}</p>
                                <p className="text-xs text-red-700 mt-1">{stats.lostUnits} unidades sin stock</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-indigo-200 p-4 rounded-xl shadow-sm">
                                <p className="text-sm font-bold text-indigo-800">Clientes Activos</p>
                                <p className="text-2xl font-black text-indigo-600 mt-1">{stats.activeCustomers} <span className="text-sm font-medium">/ {stats.totalCustomers}</span></p>
                                <p className="text-xs text-indigo-700 mt-1">Han comprado en este período</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4 rounded-xl shadow-sm col-span-2 md:col-span-1">
                                <p className="text-sm font-bold text-amber-800">Eficacia de Retención</p>
                                <p className="text-2xl font-black text-amber-600 mt-1">{stats.totalCustomers > 0 ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) : 0}%</p>
                                <p className="text-xs text-amber-700 mt-1">Tasa de clientes activos</p>
                            </div>
                        </div>
                    )}

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-700">Evolución de Ingresos</h3>
                            </div>
                            {/* Scrollable Chart */}
                            <div className="overflow-x-auto pb-4 flex-1">
                                <div style={{ minWidth: `${Math.max(stats.salesByDay.length * 40, 600)}px`, height: '250px' }}>
                                    <canvas id="salesChart"></canvas>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-700">Top Productos</h3>
                                <select className="text-xs border rounded p-1 bg-gray-50" value={topProductsLimit} onChange={e => setTopProductsLimit(Number(e.target.value))}>
                                    <option value={5}>Top 5</option>
                                    <option value={10}>Top 10</option>
                                </select>
                            </div>
                            <div className="flex-1" style={{ minHeight: '250px' }}>
                                <canvas id="productsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
