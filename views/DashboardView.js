const DashboardView = ({ onShowImportVentasModal }) => {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    const [startDate, setStartDate] = React.useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
    const [endDate, setEndDate] = React.useState(new Date().toISOString().slice(0, 10));
    const [dataSource, setDataSource] = React.useState('pedidos');
    const token = localStorage.getItem('token');

    // Refs para los canvas
    const topProductsRef = React.useRef(null);
    const topFaltantesRef = React.useRef(null);
    const evolutionRef    = React.useRef(null);
    const chartInstances  = React.useRef({});

    const CHART_COLORS = [
        'rgba(59, 130, 246, 0.85)',
        'rgba(16, 185, 129, 0.85)',
        'rgba(245, 158, 11, 0.85)',
        'rgba(139, 92, 246, 0.85)',
        'rgba(236, 72, 153, 0.85)',
        'rgba(20, 184, 166, 0.85)',
        'rgba(249, 115, 22, 0.85)',
        'rgba(99, 102, 241, 0.85)',
        'rgba(34, 197, 94, 0.85)',
        'rgba(239, 68, 68, 0.85)',
    ];

    const LINE_COLORS = [
        { border: 'rgb(59, 130, 246)',   bg: 'rgba(59, 130, 246, 0.1)'   },
        { border: 'rgb(16, 185, 129)',   bg: 'rgba(16, 185, 129, 0.1)'   },
        { border: 'rgb(245, 158, 11)',   bg: 'rgba(245, 158, 11, 0.1)'   },
        { border: 'rgb(139, 92, 246)',   bg: 'rgba(139, 92, 246, 0.1)'   },
        { border: 'rgb(236, 72, 153)',   bg: 'rgba(236, 72, 153, 0.1)'   },
    ];

    const destroyCharts = () => {
        Object.values(chartInstances.current).forEach(c => { try { c.destroy(); } catch(e){} });
        chartInstances.current = {};
    };

    const fetchStats = React.useCallback(async () => {
        setLoading(true); setError(null); setStats(null);
        try {
            const url = `${API_URL}/dashboard/stats?source=${dataSource}&startDate=${startDate}&endDate=${endDate}&topProductsLimit=10`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'No se pudieron cargar las estadísticas.');
            }
            setStats(await response.json());
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    }, [token, startDate, endDate, dataSource]);

    React.useEffect(() => {
        fetchStats();
        return () => destroyCharts();
    }, [fetchStats]);

    React.useEffect(() => {
        if (!stats) return;
        destroyCharts();

        // ── Gráfico A: Top 10 Más Vendidos ──────────────────────────────────────
        const topProdCanvas = topProductsRef.current;
        if (topProdCanvas && stats.topProducts && stats.topProducts.length > 0) {
            const labels  = stats.topProducts.map(p => p.nombre);
            const data    = stats.topProducts.map(p => parseFloat(p.totalQuantity));
            chartInstances.current.topProducts = new Chart(topProdCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Unidades vendidas',
                        data,
                        backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                afterLabel: (ctx) => {
                                    const rev = parseFloat(stats.topProducts[ctx.dataIndex]?.totalRevenue || 0);
                                    return `Ingreso: $${rev.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
                        y: { ticks: { font: { size: 11 }, callback: (v, i) => { const l = labels[i]; return l.length > 22 ? l.slice(0, 22) + '…' : l; } } }
                    }
                }
            });
        }

        // ── Gráfico B: Top Faltantes ─────────────────────────────────────────────
        const topFaltCanvas = topFaltantesRef.current;
        if (topFaltCanvas && stats.topFaltantes && stats.topFaltantes.length > 0) {
            const labels = stats.topFaltantes.map(p => p.nombre);
            const data   = stats.topFaltantes.map(p => parseFloat(p.totalFaltante));
            chartInstances.current.topFaltantes = new Chart(topFaltCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Unidades faltantes',
                        data,
                        backgroundColor: 'rgba(239, 68, 68, 0.75)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                afterLabel: (ctx) => {
                                    const veces = stats.topFaltantes[ctx.dataIndex]?.vecesRemovido || 0;
                                    return `Aparece en ${veces} pedido(s)`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
                        y: { ticks: { font: { size: 11 }, callback: (v, i) => { const l = labels[i]; return l.length > 22 ? l.slice(0, 22) + '…' : l; } } }
                    }
                }
            });
        }

        // ── Gráfico C: Evolución Comparada top 5 ────────────────────────────────
        const evoCanvas = evolutionRef.current;
        const evo = stats.topProductsEvolution;
        if (evoCanvas && evo && evo.fechas && evo.fechas.length > 0 && evo.series && evo.series.length > 0) {
            const labels = evo.fechas.map(f => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }));
            chartInstances.current.evolution = new Chart(evoCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: evo.series.map((serie, i) => ({
                        label: serie.producto.length > 20 ? serie.producto.slice(0, 20) + '…' : serie.producto,
                        data: serie.datos,
                        borderColor: LINE_COLORS[i % LINE_COLORS.length].border,
                        backgroundColor: LINE_COLORS[i % LINE_COLORS.length].bg,
                        fill: true,
                        tension: 0.4,
                        pointRadius: evo.fechas.length > 30 ? 2 : 4,
                        pointHoverRadius: 6,
                        borderWidth: 2,
                    }))
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: { font: { size: 11 }, boxWidth: 12, padding: 10 }
                        },
                    },
                    scales: {
                        x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, maxTicksLimit: 15 } },
                        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } }, beginAtZero: true }
                    }
                }
            });
        }

    }, [stats]);

    // ── Helpers ──────────────────────────────────────────────────────────────────
    const formatMoney = (v) => `$${parseFloat(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    const formatNum   = (v) => parseFloat(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

    const noDataMsg = (msg = 'Sin datos para el período seleccionado') => (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <p className="text-sm">{msg}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Centro de Operaciones</h1>
                    <p className="text-gray-500 mt-0.5">Visión operativa de ventas, productos y faltantes.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setDataSource('pedidos')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dataSource === 'pedidos' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>App</button>
                        <button onClick={() => setDataSource('presencial')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dataSource === 'presencial' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>Presencial</button>
                    </div>
                    <button onClick={onShowImportVentasModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shrink-0 shadow transition-colors">
                        <UploadIcon className="h-5 w-5 mr-2" /> Importar
                    </button>
                </div>
            </div>

            {/* ── Filtros de fecha ────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-end gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Desde</label>
                    <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        onFocus={e => e.target.type = 'date'}
                        onBlur={e => { e.target.type = 'text'; if (e.target.value) { const [y,m,d]=e.target.value.split('-'); e.target.value=`${d}/${m}/${y}`; } }}
                        defaultValue={startDate.split('-').reverse().join('/')}
                        onChange={e => { if(e.target.type==='date') setStartDate(e.target.value); }}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36 bg-gray-50"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Hasta</label>
                    <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        onFocus={e => e.target.type = 'date'}
                        onBlur={e => { e.target.type = 'text'; if (e.target.value) { const [y,m,d]=e.target.value.split('-'); e.target.value=`${d}/${m}/${y}`; } }}
                        defaultValue={endDate.split('-').reverse().join('/')}
                        onChange={e => { if(e.target.type==='date') setEndDate(e.target.value); }}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36 bg-gray-50"
                    />
                </div>
                <div className="flex-1" />
                <button
                    onClick={fetchStats}
                    className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    Actualizar
                </button>
            </div>

            {loading && <div className="flex justify-center p-16"><Spinner className="border-blue-500 h-10 w-10" /></div>}
            {error   && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl" role="alert"><p className="font-bold">Error al cargar</p><p className="text-sm mt-1">{error}</p></div>}

            {stats && !loading && (
                <div className="space-y-6">

                    {/* ── KPIs principales ──────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Ingresos Totales"
                            value={formatMoney(stats.totalRevenue)}
                            icon={<ChartBarIcon className="h-6 w-6 text-green-600" />}
                            color="green"
                        />
                        <StatCard
                            title="Transacciones"
                            value={formatNum(stats.totalOrders)}
                            icon={<ShoppingCartIcon className="h-6 w-6 text-blue-600" />}
                            color="blue"
                        />
                        <StatCard
                            title="Ticket Promedio"
                            value={formatMoney(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0)}
                            icon={<ActivityIcon className="h-6 w-6 text-purple-600" />}
                            color="purple"
                        />
                        <StatCard
                            title="Unidades Vendidas"
                            value={formatNum(stats.unidadesVendidas)}
                            icon={<PackageIcon className="h-6 w-6 text-orange-600" />}
                            color="orange"
                        />
                    </div>

                    {/* ── KPIs avanzados (solo App) ─────────────────────────── */}
                    {dataSource === 'pedidos' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 rounded-xl shadow-sm">
                                <p className="text-sm font-bold text-red-800">Ventas Perdidas (Faltantes)</p>
                                <p className="text-2xl font-black text-red-600 mt-1">{formatMoney(stats.lostRevenue)}</p>
                                <p className="text-xs text-red-700 mt-1">{formatNum(stats.lostUnits)} unidades sin stock</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-indigo-200 p-4 rounded-xl shadow-sm">
                                <p className="text-sm font-bold text-indigo-800">Clientes Activos</p>
                                <p className="text-2xl font-black text-indigo-600 mt-1">
                                    {formatNum(stats.activeCustomers)} <span className="text-sm font-medium">/ {formatNum(stats.totalCustomers)}</span>
                                </p>
                                <p className="text-xs text-indigo-700 mt-1">Han comprado en este período</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4 rounded-xl shadow-sm col-span-2 md:col-span-1">
                                <p className="text-sm font-bold text-amber-800">Eficacia de Retención</p>
                                <p className="text-2xl font-black text-amber-600 mt-1">
                                    {stats.totalCustomers > 0 ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) : 0}%
                                </p>
                                <p className="text-xs text-amber-700 mt-1">Tasa de clientes activos</p>
                            </div>
                        </div>
                    )}

                    {/* ── Gráficos — fila 1 ─────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Gráfico A: Top 10 Más Vendidos */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700">🏆 Top 10 Más Vendidos</h3>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">unidades · período</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">Productos con mayor volumen de ventas en el rango seleccionado</p>
                            <div className="relative flex-1" style={{ minHeight: '320px' }}>
                                {stats.topProducts && stats.topProducts.length > 0
                                    ? <canvas ref={topProductsRef}></canvas>
                                    : noDataMsg()}
                            </div>
                        </div>

                        {/* Gráfico B: Top Faltantes (solo pedidos) */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700">⚠️ Top Faltantes del Período</h3>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">unidades removidas</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">Productos más removidos por sin-stock en pedidos del rango</p>
                            <div className="relative flex-1" style={{ minHeight: '320px' }}>
                                {dataSource === 'pedidos'
                                    ? (stats.topFaltantes && stats.topFaltantes.length > 0
                                        ? <canvas ref={topFaltantesRef}></canvas>
                                        : noDataMsg('Sin faltantes registrados en este período ✓'))
                                    : noDataMsg('Solo disponible para la fuente App')}
                            </div>
                        </div>
                    </div>

                    {/* ── Gráfico C: Evolución Comparada ────────────────────── */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-gray-700">📈 Evolución Comparada de los Top 5 Productos</h3>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">unidades/día</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Tendencia diaria de los 5 productos más vendidos del período</p>
                        <div className="overflow-x-auto">
                            <div style={{ minWidth: `${Math.max((stats.topProductsEvolution?.fechas?.length || 0) * 35, 500)}px`, height: '280px', position: 'relative' }}>
                                {stats.topProductsEvolution?.fechas?.length > 0 && stats.topProductsEvolution?.series?.length > 0
                                    ? <canvas ref={evolutionRef}></canvas>
                                    : noDataMsg()}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
