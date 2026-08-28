/**
 * @file DashboardView.js — Centro de Operaciones
 * KPIs: Pedidos Pendientes, Facturados 12h, Clientes Activos, Eficacia Retención,
 * Evolución de Ingresos (comparativa semanal + año anterior con Chart.js)
 */

const DashboardView = ({ onShowImportVentasModal }) => {
    const token = localStorage.getItem('token');

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const fmt = (d) => d.toISOString().split('T')[0];

    const [startDate,    setStartDate]    = React.useState(fmt(thirtyDaysAgo));
    const [endDate,      setEndDate]      = React.useState(fmt(today));
    const [dataSource,   setDataSource]   = React.useState('pedidos');
    const [stats,        setStats]        = React.useState(null);
    const [loading,      setLoading]      = React.useState(true);
    const [error,        setError]        = React.useState(null);
    const [fetchTrigger, setFetchTrigger] = React.useState(0);

    const topProductsRef  = React.useRef(null);
    const topFaltantesRef = React.useRef(null);
    const evolucionRef    = React.useRef(null);
    const chartInstances  = React.useRef({});

    const CHART_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#84CC16','#EC4899','#6366F1'];

    const destroyCharts = () => {
        Object.values(chartInstances.current).forEach(c => { try { c.destroy(); } catch(e) {} });
        chartInstances.current = {};
    };

    React.useEffect(() => {
        setLoading(true);
        setError(null);
        let isMounted = true;
        const doFetch = async () => {
            try {
                const url = `${API_URL}/dashboard/stats?source=${dataSource}&startDate=${startDate}&endDate=${endDate}&topProductsLimit=10`;
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'No se pudieron cargar las estadísticas.');
                }
                const data = await response.json();
                if (isMounted) setStats(data);
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        doFetch();
        return () => { isMounted = false; destroyCharts(); };
    }, [startDate, endDate, dataSource, token, fetchTrigger]);

    // ── Inicializar gráficos cuando cambia stats ────────────────────────────
    React.useEffect(() => {
        if (!stats) return;
        destroyCharts();

        // ── Gráfico A: Top 10 Más Vendidos ────────────────────────────────
        const topProdCanvas = topProductsRef.current;
        if (topProdCanvas && stats.topProducts && stats.topProducts.length > 0) {
            chartInstances.current.topProducts = new Chart(topProdCanvas, {
                type: 'bar',
                data: {
                    labels: stats.topProducts.map(p => p.nombre),
                    datasets: [{
                        label: 'Unidades vendidas',
                        data: stats.topProducts.map(p => parseFloat(p.totalQuantity)),
                        backgroundColor: stats.topProducts.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
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
                        y: { ticks: { font: { size: 11 }, callback: (v, i) => { const l = stats.topProducts[i]?.nombre || ''; return l.length > 22 ? l.slice(0, 22) + '…' : l; } } }
                    }
                }
            });
        }

        // ── Gráfico B: Top Faltantes ──────────────────────────────────────
        const topFaltCanvas = topFaltantesRef.current;
        if (topFaltCanvas && stats.topFaltantes && stats.topFaltantes.length > 0) {
            chartInstances.current.topFaltantes = new Chart(topFaltCanvas, {
                type: 'bar',
                data: {
                    labels: stats.topFaltantes.map(p => p.nombre),
                    datasets: [{
                        label: 'Unidades faltantes',
                        data: stats.topFaltantes.map(p => parseFloat(p.totalFaltante)),
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
                        y: { ticks: { font: { size: 11 }, callback: (v, i) => { const l = stats.topFaltantes[i]?.nombre || ''; return l.length > 22 ? l.slice(0, 22) + '…' : l; } } }
                    }
                }
            });
        }

        // ── Gráfico C: Evolución de Ingresos (comparativa semanal) ────────
        const evCanvas = evolucionRef.current;
        if (evCanvas && stats.evolucion_semanal && stats.evolucion_semanal.length > 0) {
            // Construir etiquetas de días
            const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const data14 = stats.evolucion_semanal || [];

            // Separar semana actual (últimos 7 días) y semana anterior
            const now = new Date();
            const semActual = [];
            const semAnterior = [];
            const labels14 = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const ds = d.toISOString().split('T')[0];
                labels14.push(DIAS[d.getDay()]);

                const rowActual = data14.find(r => r.dia && r.dia.startsWith(ds));
                semActual.push(rowActual ? parseFloat(rowActual.ingresos) : 0);

                const dp = new Date(d);
                dp.setDate(d.getDate() - 7);
                const dps = dp.toISOString().split('T')[0];
                const rowAnterior = data14.find(r => r.dia && r.dia.startsWith(dps));
                semAnterior.push(rowAnterior ? parseFloat(rowAnterior.ingresos) : 0);
            }

            // Año anterior — agrupado por DOW (0-6)
            const anioAnt = stats.anio_anterior_semanal || [];
            const semAnioAnt = labels14.map((_, i) => {
                const d = new Date(now);
                d.setDate(now.getDate() - (6 - i));
                const dow = d.getDay();
                const row = anioAnt.find(r => parseInt(r.dow) === dow);
                return row ? parseFloat(row.ingresos) : 0;
            });

            chartInstances.current.evolucion = new Chart(evCanvas, {
                type: 'bar',
                data: {
                    labels: labels14,
                    datasets: [
                        {
                            label: 'Esta semana',
                            data: semActual,
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderRadius: 5,
                            borderSkipped: false,
                            order: 2,
                        },
                        {
                            label: 'Semana anterior',
                            data: semAnterior,
                            backgroundColor: 'rgba(156, 163, 175, 0.5)',
                            borderRadius: 5,
                            borderSkipped: false,
                            order: 3,
                        },
                        {
                            label: 'Año anterior (ref.)',
                            data: semAnioAnt,
                            type: 'line',
                            borderColor: 'rgba(251, 146, 60, 0.9)',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderDash: [5, 4],
                            pointRadius: 3,
                            pointBackgroundColor: 'rgba(251, 146, 60, 1)',
                            tension: 0.3,
                            order: 1,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { font: { size: 11 }, padding: 12, usePointStyle: true }
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: $${parseFloat(ctx.raw || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(0,0,0,0.05)' },
                            ticks: {
                                font: { size: 11 },
                                callback: (v) => `$${(v / 1000).toFixed(0)}K`
                            }
                        },
                        x: { grid: { display: false }, ticks: { font: { size: 12 } } }
                    }
                }
            });
        }
    }, [stats]);

    const fmtMoney = (v) => `$${parseFloat(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    const fmtNum   = (v) => parseFloat(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

    const noDataMsg = (msg = 'Sin datos para el período seleccionado') => (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <p className="text-sm">{msg}</p>
        </div>
    );

    // ── KPI Card genérico ─────────────────────────────────────────────────────
    const KpiCard = ({ title, value, sub, icon, accent = 'blue', badge = null }) => {
        const accents = {
            blue:   'bg-blue-50 border-blue-100 text-blue-600',
            green:  'bg-green-50 border-green-100 text-green-600',
            purple: 'bg-purple-50 border-purple-100 text-purple-600',
            amber:  'bg-amber-50 border-amber-100 text-amber-600',
            red:    'bg-red-50 border-red-100 text-red-600',
            indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
        };
        return (
            <div className={`rounded-xl border p-4 shadow-sm ${accents[accent]} flex flex-col gap-1`}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</span>
                    {badge && <span className="text-xs font-bold bg-white bg-opacity-60 px-2 py-0.5 rounded-full">{badge}</span>}
                </div>
                <p className="text-2xl font-black">{value}</p>
                {sub && <p className="text-xs opacity-70">{sub}</p>}
            </div>
        );
    };

    return (
        <div className="space-y-6">

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Centro de Operaciones</h1>
                    <p className="text-gray-500 mt-0.5">Visión operativa de ventas, clientes y productos.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setDataSource('pedidos')}   className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dataSource === 'pedidos'    ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>App</button>
                        <button onClick={() => setDataSource('presencial')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dataSource === 'presencial' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>Presencial</button>
                    </div>
                    <button onClick={onShowImportVentasModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shrink-0 shadow transition-colors">
                        <UploadIcon className="h-5 w-5 mr-2" /> Importar
                    </button>
                </div>
            </div>

            {/* ── Filtros de fecha ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-end gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Desde</label>
                    <input
                        type="text" placeholder="DD/MM/YYYY"
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
                        type="text" placeholder="DD/MM/YYYY"
                        onFocus={e => e.target.type = 'date'}
                        onBlur={e => { e.target.type = 'text'; if (e.target.value) { const [y,m,d]=e.target.value.split('-'); e.target.value=`${d}/${m}/${y}`; } }}
                        defaultValue={endDate.split('-').reverse().join('/')}
                        onChange={e => { if(e.target.type==='date') setEndDate(e.target.value); }}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36 bg-gray-50"
                    />
                </div>
                <div className="flex-1" />
                <button
                    onClick={() => setFetchTrigger(t => t + 1)}
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

                    {/* ── KPIs fila 1: operativo en tiempo real (solo App) ───────── */}
                    {dataSource === 'pedidos' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard
                                title="Pedidos Pendientes"
                                value={fmtNum(stats.pedidos_pendientes)}
                                sub="Esperando atención ahora"
                                accent={parseInt(stats.pedidos_pendientes) > 10 ? 'red' : 'amber'}
                            />
                            <KpiCard
                                title="Facturados (12hs)"
                                value={fmtNum(stats.facturados_12h)}
                                sub="Últimas 12 horas"
                                accent="green"
                            />
                            <KpiCard
                                title="Clientes Activos"
                                value={fmtNum(stats.activeCustomers)}
                                sub={`de ${fmtNum(stats.totalCustomers)} totales · período`}
                                accent="indigo"
                            />
                            <KpiCard
                                title="Eficacia de Retención"
                                value={stats.totalCustomers > 0 ? `${Math.round((stats.activeCustomers / stats.totalCustomers) * 100)}%` : '—'}
                                sub="Clientes activos / total"
                                accent={stats.totalCustomers > 0 && (stats.activeCustomers / stats.totalCustomers) > 0.6 ? 'green' : 'amber'}
                            />
                        </div>
                    )}

                    {/* ── KPIs fila 2: métricas del período ─────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard title="Ingresos Totales"  value={fmtMoney(stats.totalRevenue)}   accent="green" />
                        <KpiCard title="Transacciones"     value={fmtNum(stats.totalOrders)}      accent="blue" />
                        <KpiCard title="Ticket Promedio"   value={fmtMoney(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0)} accent="purple" />
                        <KpiCard title="Unidades Vendidas" value={fmtNum(stats.unidadesVendidas)} accent="indigo" />
                    </div>

                    {/* ── Faltantes (solo App) ──────────────────────────────────── */}
                    {dataSource === 'pedidos' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KpiCard
                                title="Ventas Perdidas (Faltantes)"
                                value={fmtMoney(stats.lostRevenue)}
                                sub={`${fmtNum(stats.lostUnits)} unidades sin stock en el período`}
                                accent="red"
                            />
                        </div>
                    )}

                    {/* ── Gráfico de Evolución de Ingresos ─────────────────────── */}
                    {dataSource === 'pedidos' && (
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <h3 className="font-bold text-gray-700">📈 Evolución de Ingresos — Comparativa Semanal</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Esta semana vs. semana anterior · línea punteada = mismo período año pasado (referencia)</p>
                                </div>
                            </div>
                            <div className="relative" style={{ height: '240px' }}>
                                {stats.evolucion_semanal && stats.evolucion_semanal.length > 0
                                    ? <canvas ref={evolucionRef}></canvas>
                                    : noDataMsg('Sin datos de evolución para el período')}
                            </div>
                            <p className="text-xs text-gray-400 mt-3 italic border-t pt-2">
                                ℹ️ Para un análisis preciso de crecimiento real, comparar contra el índice de inflación del período y la variación salarial correspondiente.
                            </p>
                        </div>
                    )}

                    {/* ── Gráficos: Top Productos y Top Faltantes ───────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700">🏆 Top 10 Más Vendidos</h3>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">unidades · período</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">Productos con mayor volumen en el rango seleccionado</p>
                            <div className="relative flex-1" style={{ minHeight: '300px' }}>
                                {stats.topProducts && stats.topProducts.length > 0
                                    ? <canvas ref={topProductsRef}></canvas>
                                    : noDataMsg()}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700">⚠️ Top Faltantes del Período</h3>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">unidades removidas</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">Productos más removidos por sin-stock</p>
                            <div className="relative flex-1" style={{ minHeight: '300px' }}>
                                {dataSource === 'pedidos'
                                    ? (stats.topFaltantes && stats.topFaltantes.length > 0
                                        ? <canvas ref={topFaltantesRef}></canvas>
                                        : noDataMsg('Sin faltantes registrados en este período ✓'))
                                    : noDataMsg('Solo disponible para la fuente App')}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
