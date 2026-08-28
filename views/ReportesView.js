/**
 * @file ReportesView.js
 * Vista de reportes y métricas de gestión para admins.
 * Consume los endpoints GET /api/reportes/* del backend.
 */

const ReportesView = () => {
    const token = localStorage.getItem('token');

    // --- Estado de fechas y tab activa ---
    const hoy = new Date().toISOString().slice(0, 10);
    const inicioSemana = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    const [activeTab, setActiveTab] = React.useState('resumen');
    const [startDate, setStartDate] = React.useState(inicioSemana);
    const [endDate, setEndDate] = React.useState(hoy);
    const [diasInactivo, setDiasInactivo] = React.useState(30);
    const [orderBy, setOrderBy] = React.useState('cantidad'); // backend sort for productos
    const [filtroCategoria, setFiltroCategoria] = React.useState('');

    const [resumen, setResumen] = React.useState(null);
    const [vendedores, setVendedores] = React.useState(null);
    const [entregados, setEntregados] = React.useState(null);
    const [inactivos, setInactivos] = React.useState(null);
    const [productos, setProductos] = React.useState(null);
    const [faltantes, setFaltantes] = React.useState(null);
    const [categorias, setCategorias] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    // Modal de análisis de cliente inactivo
    const [analisisCliente, setAnalisisCliente] = React.useState(null);   // datos cargados
    const [loadingAnalisis, setLoadingAnalisis] = React.useState(false);
    const [errorAnalisis, setErrorAnalisis] = React.useState(null);
    const [modalClienteId, setModalClienteId] = React.useState(null);

    const apiFetch = async (path) => {
        const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Error al cargar ${path}`);
        return res.json();
    };

    const fmt = (n) => parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtN = (n) => parseInt(n || 0).toLocaleString('es-AR');

    const cargar = async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = `?startDate=${startDate}&endDate=${endDate}`;
            if (activeTab === 'resumen')     setResumen(await apiFetch(`/reportes/resumen-ejecutivo${qs}`));
            if (activeTab === 'diario')      setDiario(await apiFetch(`/reportes/diario-pedidos${qs}`));
            if (activeTab === 'vendedores')  setVendedores(await apiFetch(`/reportes/pedidos-por-vendedor${qs}`));
            if (activeTab === 'entregados')  setEntregados(await apiFetch(`/reportes/pedidos-entregados${qs}`));
            if (activeTab === 'inactivos')   setInactivos(await apiFetch(`/reportes/clientes-inactivos?dias=${diasInactivo}`));
            if (activeTab === 'productos')   setProductos(await apiFetch(`/reportes/productos-mas-pedidos${qs}&orderBy=${orderBy}&limit=30${filtroCategoria ? `&categoria=${encodeURIComponent(filtroCategoria)}` : ''}`));
            if (activeTab === 'faltantes')   setFaltantes(await apiFetch(`/reportes/faltantes-historico${qs}`));
            if (activeTab === 'categorias')  setCategorias(await apiFetch(`/reportes/categorias-comparativa${qs}`));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { cargar(); }, [activeTab, filtroCategoria, diasInactivo]);

    const TABS = [
        { id: 'resumen',    label: '📊 Resumen' },
        { id: 'vendedores', label: '🏆 Vendedores' },
        { id: 'entregados', label: '✅ Entregados' },
        { id: 'inactivos',  label: '💤 Inactivos' },
        { id: 'productos',  label: '📦 Productos' },
        { id: 'faltantes',  label: '⚠️ Faltantes' },
        { id: 'categorias', label: '📁 Categorías' },
    ];

    // ── Abrir modal de análisis de cliente inactivo ──────────────────────
    const abrirAnalisis = async (clienteId) => {
        setModalClienteId(clienteId);
        setAnalisisCliente(null);
        setErrorAnalisis(null);
        setLoadingAnalisis(true);
        try {
            const data = await apiFetch(`/reportes/analisis-cliente-inactivo/${clienteId}`);
            setAnalisisCliente(data);
        } catch(e) {
            setErrorAnalisis(e.message);
        } finally {
            setLoadingAnalisis(false);
        }
    };

    const cerrarAnalisis = () => { setModalClienteId(null); setAnalisisCliente(null); };

    // ── Mini barra de historial mensual (SVG inline) ──────────────────────
    const MiniBarChart = ({ datos }) => {
        if (!datos || datos.length === 0) return <span className="text-gray-400 text-xs">Sin datos</span>;
        const max = Math.max(...datos.map(d => parseInt(d.cantidad_pedidos || 0)), 1);
        return (
            <div className="flex items-end gap-0.5 h-10" title="Pedidos por mes (más reciente a la derecha)">
                {datos.map((d, i) => {
                    const h = Math.round((parseInt(d.cantidad_pedidos) / max) * 40);
                    const isRecent = i >= datos.length - 3;
                    return (
                        <div
                            key={d.mes}
                            title={`${d.mes}: ${d.cantidad_pedidos} pedido(s)`}
                            style={{ height: `${Math.max(h, 2)}px`, width: '10px' }}
                            className={`rounded-sm ${isRecent ? 'bg-orange-400' : 'bg-blue-300'}`}
                        />
                    );
                })}
            </div>
        );
    };

    // ── Modal de Análisis completo ────────────────────────────────────────
    const ModalAnalisisCliente = () => {
        if (!modalClienteId) return null;
        const d = analisisCliente;
        const tendenciaBadge = d ? {
            'caida_gradual': { label: '📉 Caída gradual de frecuencia', cls: 'bg-red-100 text-red-800' },
            'leve_baja':     { label: '📉 Leve baja de actividad',       cls: 'bg-amber-100 text-amber-800' },
            'estable':       { label: '✅ Frecuencia estable',            cls: 'bg-green-100 text-green-800' },
            'sin_datos':     { label: '🔍 Datos insuficientes',           cls: 'bg-gray-100 text-gray-600' },
        }[d.tendencia] || {} : {};

        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={cerrarAnalisis}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex justify-between items-center p-5 border-b bg-gray-50 rounded-t-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {loadingAnalisis ? 'Cargando...' : d?.cliente?.nombre_comercio || 'Análisis de Cliente'}
                            </h2>
                            <p className="text-sm text-gray-500">Análisis de causa de inactividad</p>
                        </div>
                        <button onClick={cerrarAnalisis} className="text-gray-400 hover:text-gray-700 p-1"><CloseIcon /></button>
                    </div>

                    <div className="p-5 space-y-5">
                        {loadingAnalisis && <div className="flex justify-center py-10"><Spinner className="border-blue-500 w-8 h-8" /></div>}
                        {errorAnalisis  && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{errorAnalisis}</div>}

                        {d && !loadingAnalisis && (
                            <>
                                {/* Tendencia */}
                                {tendenciaBadge.label && (
                                    <div className={`px-4 py-3 rounded-xl font-semibold text-sm ${tendenciaBadge.cls}`}>
                                        {tendenciaBadge.label}
                                    </div>
                                )}

                                {/* Intervalos */}
                                {d.intervalos && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500">Total histórico</p>
                                            <p className="text-xl font-bold">{fmtN(d.intervalos.total_pedidos_historicos)}</p>
                                            <p className="text-xs text-gray-400">pedidos</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500">Prom. intervalo</p>
                                            <p className="text-xl font-bold">{d.intervalos.promedio_dias_entre_pedidos ? Math.round(d.intervalos.promedio_dias_entre_pedidos) : '—'}</p>
                                            <p className="text-xs text-gray-400">días entre pedidos</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500">Primer pedido</p>
                                            <p className="text-sm font-bold">{d.intervalos.primer_pedido ? new Date(d.intervalos.primer_pedido).toLocaleDateString('es-AR') : '—'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500">Último pedido</p>
                                            <p className="text-sm font-bold text-orange-600">{d.intervalos.ultimo_pedido ? new Date(d.intervalos.ultimo_pedido).toLocaleDateString('es-AR') : '—'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Historial mensual */}
                                {d.historial_mensual && d.historial_mensual.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-2">Pedidos por mes (18 meses)</h3>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-xs">
                                                <thead><tr className="bg-gray-50">
                                                    <th className="px-3 py-1.5 text-left">Mes</th>
                                                    <th className="px-3 py-1.5 text-right">Pedidos</th>
                                                    <th className="px-3 py-1.5 text-right">Monto</th>
                                                    <th className="px-3 py-1.5 text-left w-24">Vol.</th>
                                                </tr></thead>
                                                <tbody className="divide-y">
                                                    {d.historial_mensual.map((m, i) => {
                                                        const maxM = Math.max(...d.historial_mensual.map(x => parseInt(x.cantidad_pedidos)), 1);
                                                        const pct = Math.round((parseInt(m.cantidad_pedidos) / maxM) * 100);
                                                        const isLast3 = i >= d.historial_mensual.length - 3;
                                                        return (
                                                            <tr key={m.mes} className={`${isLast3 ? 'bg-orange-50' : ''}`}>
                                                                <td className="px-3 py-1.5 font-medium">{m.mes}</td>
                                                                <td className="px-3 py-1.5 text-right font-bold">{m.cantidad_pedidos}</td>
                                                                <td className="px-3 py-1.5 text-right text-green-700">${fmt(m.monto_total)}</td>
                                                                <td className="px-3 py-1.5">
                                                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                                                        <div className={`h-2 rounded-full ${isLast3 ? 'bg-orange-400' : 'bg-blue-400'}`} style={{width:`${pct}%`}} />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Productos que dejó de pedir */}
                                {d.productos_abandonados && d.productos_abandonados.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-2">Productos que dejaron de aparecer en pedidos recientes</h3>
                                        <div className="space-y-1">
                                            {d.productos_abandonados.map(p => (
                                                <div key={p.nombre_producto} className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${p.tuvo_faltante ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                                                    <span className="font-medium">{p.nombre_producto}</span>
                                                    {p.tuvo_faltante
                                                        ? <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">⚠️ Faltante ({p.veces_faltante}x)</span>
                                                        : <span className="text-xs text-gray-400">Sin faltante registrado</span>}
                                                </div>
                                            ))}
                                        </div>
                                        {d.productos_abandonados.some(p => p.tuvo_faltante) && (
                                            <p className="text-xs text-red-600 mt-2 italic">⚠️ Posible causa: uno o más productos que solía pedir tuvieron faltantes.</p>
                                        )}
                                    </div>
                                )}

                                {/* Productos eliminados de pedidos */}
                                {d.productos_eliminados_de_pedidos && d.productos_eliminados_de_pedidos.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-2">Productos removidos de sus pedidos (sin stock)</h3>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-xs">
                                                <thead><tr className="bg-gray-50">
                                                    <th className="px-3 py-1.5 text-left">Producto</th>
                                                    <th className="px-3 py-1.5 text-right">Veces eliminado</th>
                                                    <th className="px-3 py-1.5 text-right">Unidades</th>
                                                    <th className="px-3 py-1.5 text-left">Última vez</th>
                                                </tr></thead>
                                                <tbody className="divide-y">
                                                    {d.productos_eliminados_de_pedidos.map(p => (
                                                        <tr key={p.nombre_producto} className="hover:bg-gray-50">
                                                            <td className="px-3 py-1.5 font-medium">{p.nombre_producto}</td>
                                                            <td className="px-3 py-1.5 text-right font-bold text-red-600">{p.veces_eliminado}</td>
                                                            <td className="px-3 py-1.5 text-right">{p.unidades_eliminadas}</td>
                                                            <td className="px-3 py-1.5 text-gray-500">{p.ultima_vez ? new Date(p.ultima_vez).toLocaleDateString('es-AR') : '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {(!d.productos_abandonados || d.productos_abandonados.length === 0) &&
                                 (!d.productos_eliminados_de_pedidos || d.productos_eliminados_de_pedidos.length === 0) && (
                                    <p className="text-sm text-gray-500 italic text-center py-4">No se detectaron productos abandonados o removidos en el período analizado.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const ESTADO_COLORS = {
        pendiente: 'bg-yellow-100 text-yellow-800',
        visto: 'bg-blue-100 text-blue-800',
        en_preparacion: 'bg-orange-100 text-orange-800',
        listo_para_entrega: 'bg-purple-100 text-purple-800',
        entregado: 'bg-green-100 text-green-800',
        cancelado: 'bg-red-100 text-red-800',
        archivado: 'bg-gray-100 text-gray-600',
        combinado: 'bg-indigo-100 text-indigo-700',
    };

    const BadgeEstado = ({ estado }) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ESTADO_COLORS[estado] || 'bg-gray-100 text-gray-600'}`}>
            {estado?.replace(/_/g, ' ')}
        </span>
    );

    const Card = ({ label, value, sub, color = 'blue' }) => {
        const colors = {
            blue:   'from-blue-500 to-blue-700',
            green:  'from-green-500 to-green-700',
            purple: 'from-purple-500 to-purple-700',
            orange: 'from-orange-400 to-orange-600',
        };
        return (
            <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-5 shadow`}>
                <p className="text-sm font-medium opacity-80">{label}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
                {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
            </div>
        );
    };

    // ─── Filtros comunes ───
    const FiltroFechas = () => {
        if (activeTab === 'inactivos') return null; // Inactivos usa solo Días y se maneja internamente en la tab
        return (
            <div className="flex flex-wrap items-end gap-3 bg-white border rounded-xl p-4 mb-6 shadow-sm">
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Desde</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Hasta</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36" />
                </div>
                {activeTab === 'productos' && (
                    <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Ordenar por</label>
                        <select value={orderBy} onChange={e => setOrderBy(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <option value="cantidad">Unidades vendidas</option>
                            <option value="monto">Monto generado</option>
                        </select>
                    </div>
                )}
                <button onClick={cargar} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition">
                    Consultar
                </button>
            </div>
        );
    };

    // ─── Contenido por tab ───

    const TabDiario = () => {
        if (!diario) return null;
        const r = diario.resumen;
        return (
            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Resumen del Período</h2>
                        <p className="text-sm text-gray-500">
                            Del {new Date(diario.periodo.desde + 'T00:00:00').toLocaleDateString('es-AR')} al {new Date(diario.periodo.hasta + 'T00:00:00').toLocaleDateString('es-AR')}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card label="Total pedidos (activos)" value={fmtN(r.total_pedidos)} color="blue" />
                    <Card label="Monto total" value={`$${fmt(r.monto_total)}`} color="green" />
                    <Card label="Clientes atendidos" value={fmtN(r.clientes_unicos)} color="purple" />
                    <Card label="Vendedores activos" value={fmtN(r.vendedores_activos)} color="orange" />
                </div>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-700">Pedidos por estado</h3>
                    </div>
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2 text-left">Estado</th>
                                <th className="px-4 py-2 text-right">Pedidos</th>
                                <th className="px-4 py-2 text-right">Clientes únicos</th>
                                <th className="px-4 py-2 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {diario.por_estado.map(e => (
                                <tr key={e.estado} className="hover:bg-gray-50">
                                    <td className="px-4 py-2"><BadgeEstado estado={e.estado} /></td>
                                    <td className="px-4 py-2 text-right font-semibold">{fmtN(e.total_pedidos)}</td>
                                    <td className="px-4 py-2 text-right">{fmtN(e.clientes_unicos)}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-green-700">${fmt(e.monto_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const TabVendedores = () => {
        if (!vendedores) return null;
        const { items: sorted, requestSort, sortConfig } = useSortableData(vendedores.vendedores, { key: 'monto_total', direction: 'descending' });
        return (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-700">Rendimiento por vendedor</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <TableHeader sortKey="vendedor" sortConfig={sortConfig} onSort={requestSort}>Vendedor</TableHeader>
                                <TableHeader sortKey="total_pedidos" sortConfig={sortConfig} onSort={requestSort} className="text-right">Pedidos</TableHeader>
                                <TableHeader sortKey="clientes_unicos" sortConfig={sortConfig} onSort={requestSort} className="text-right">Clientes únicos</TableHeader>
                                <TableHeader sortKey="unidades_vendidas" sortConfig={sortConfig} onSort={requestSort} className="text-right">Unidades</TableHeader>
                                <TableHeader sortKey="ticket_promedio" sortConfig={sortConfig} onSort={requestSort} className="text-right">Ticket prom.</TableHeader>
                                <TableHeader sortKey="monto_total" sortConfig={sortConfig} onSort={requestSort} className="text-right">Monto total</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sorted.map((v, i) => (
                                <tr key={v.vendedor_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-gray-800">{v.vendedor}</td>
                                    <td className="px-4 py-3 text-right">{fmtN(v.total_pedidos)}</td>
                                    <td className="px-4 py-3 text-right">{fmtN(v.clientes_unicos)}</td>
                                    <td className="px-4 py-3 text-right">{fmtN(v.unidades_vendidas)}</td>
                                    <td className="px-4 py-3 text-right">${fmt(v.ticket_promedio)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-700">${fmt(v.monto_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {vendedores.vendedores.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No hay datos para el período seleccionado.</p>
                    )}
                </div>
            </div>
        );
    };

    const TabEntregados = () => {
        if (!entregados) return null;
        const r = entregados.resumen;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <Card label="Pedidos entregados" value={fmtN(r.total_pedidos)} color="green" />
                    <Card label="Clientes únicos" value={fmtN(r.clientes_unicos)} color="blue" />
                    <Card label="Monto total" value={`$${fmt(r.monto_total)}`} color="purple" />
                </div>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-2 text-left">Pedido</th>
                                    <th className="px-4 py-2 text-left">Cliente</th>
                                    <th className="px-4 py-2 text-left">Dirección</th>
                                    <th className="px-4 py-2 text-left">Vendedor</th>
                                    <th className="px-4 py-2 text-right">Items</th>
                                    <th className="px-4 py-2 text-right">Monto</th>
                                    <th className="px-4 py-2 text-left">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {entregados.pedidos.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-bold text-blue-600">#{p.id}</td>
                                        <td className="px-4 py-2 font-semibold">{p.nombre_comercio}</td>
                                        <td className="px-4 py-2 text-gray-500 text-xs">{p.direccion}</td>
                                        <td className="px-4 py-2">{p.vendedor}</td>
                                        <td className="px-4 py-2 text-right">{p.cantidad_items}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-green-700">${fmt(p.monto_total)}</td>
                                        <td className="px-4 py-2 text-xs text-gray-500">{new Date(p.fecha_creacion).toLocaleDateString('es-AR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {entregados.pedidos.length === 0 && (
                            <p className="text-center text-gray-400 py-8">No hay pedidos entregados en el período.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const TabInactivos = () => {
        if (!inactivos) return null;
        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💤</span>
                        <div>
                            <p className="font-bold text-amber-800">{fmtN(inactivos.total)} clientes sin pedidos en los últimos {inactivos.dias_sin_pedido} días</p>
                            <p className="text-sm text-amber-600">Oportunidad de seguimiento comercial.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-amber-700">Días sin pedido:</label>
                        <select value={diasInactivo} onChange={e => setDiasInactivo(Number(e.target.value))}
                            className="border border-amber-300 bg-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                            {[7,14,30,60,90].map(d => <option key={d} value={d}>{d} días</option>)}
                        </select>
                    </div>
                </div>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-2 text-left">Cliente</th>
                                    <th className="px-4 py-2 text-left">Contacto</th>
                                    <th className="px-4 py-2 text-left">Teléfono</th>
                                    <th className="px-4 py-2 text-right">Pedidos hist.</th>
                                    <th className="px-4 py-2 text-left">Último pedido</th>
                                    <th className="px-4 py-2 text-center">Análisis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {inactivos.clientes.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-semibold">{c.nombre_comercio}</td>
                                        <td className="px-4 py-2 text-gray-600">{c.nombre_contacto || '—'}</td>
                                        <td className="px-4 py-2 text-gray-600">{c.telefono || '—'}</td>
                                        <td className="px-4 py-2 text-right">{fmtN(c.total_pedidos_historicos)}</td>
                                        <td className="px-4 py-2 text-sm">
                                            {c.ultimo_pedido
                                                ? <span className="text-orange-600 font-medium">{new Date(c.ultimo_pedido).toLocaleDateString('es-AR')}</span>
                                                : <span className="text-red-500 font-medium">Sin pedidos</span>}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => abrirAnalisis(c.id)}
                                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-blue-200 transition"
                                            >
                                                + Info
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };


    const TabProductos = () => {
        if (!productos) return null;
        const { items: sorted, requestSort, sortConfig } = useSortableData(productos.productos, { key: 'unidades_vendidas', direction: 'descending' });
        return (
            <div className="space-y-4">
                {filtroCategoria && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex justify-between items-center text-sm shadow-sm">
                        <span>Filtrando por categoría: <strong className="text-blue-900 text-base ml-1">{filtroCategoria}</strong></span>
                        <button onClick={() => setFiltroCategoria('')} className="text-blue-700 hover:text-blue-900 font-bold px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm transition">Limpiar Filtro</button>
                    </div>
                )}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Top {productos.total_productos} productos — ordenados por {productos.order_by === 'monto' ? 'monto (backend)' : 'unidades (backend)'}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2 text-left">#</th>
                                <TableHeader sortKey="nombre_producto" sortConfig={sortConfig} onSort={requestSort}>Producto</TableHeader>
                                <TableHeader sortKey="categoria" sortConfig={sortConfig} onSort={requestSort}>Categoría</TableHeader>
                                <TableHeader sortKey="codigo_sku" sortConfig={sortConfig} onSort={requestSort}>SKU</TableHeader>
                                <TableHeader sortKey="unidades_vendidas" sortConfig={sortConfig} onSort={requestSort} className="text-right">Unidades</TableHeader>
                                <TableHeader sortKey="aparece_en_pedidos" sortConfig={sortConfig} onSort={requestSort} className="text-right">En pedidos</TableHeader>
                                <TableHeader sortKey="precio_promedio" sortConfig={sortConfig} onSort={requestSort} className="text-right">Precio prom.</TableHeader>
                                <TableHeader sortKey="monto_total" sortConfig={sortConfig} onSort={requestSort} className="text-right">Monto total</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sorted.map((p, i) => (
                                <tr key={p.producto_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-400 font-bold">{i + 1}</td>
                                    <td className="px-4 py-2 font-semibold text-gray-800">{p.nombre_producto}</td>
                                    <td className="px-4 py-2 text-gray-500">{p.categoria || '—'}</td>
                                    <td className="px-4 py-2 text-gray-400 text-xs font-mono">{p.codigo_sku || '—'}</td>
                                    <td className="px-4 py-2 text-right font-bold">{fmtN(p.unidades_vendidas)}</td>
                                    <td className="px-4 py-2 text-right">{fmtN(p.aparece_en_pedidos)}</td>
                                    <td className="px-4 py-2 text-right">${fmt(p.precio_promedio)}</td>
                                    <td className="px-4 py-2 text-right font-bold text-green-700">${fmt(p.monto_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        );
    };

    const TabFaltantes = () => {
        if (!faltantes) return null;
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-700">Resumen por producto</h3>
                    </div>
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2 text-left">Producto</th>
                                <th className="px-4 py-2 text-right">Total removido</th>
                                <th className="px-4 py-2 text-right">Veces removido</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {faltantes.resumen_por_producto.map(f => (
                                <tr key={f.nombre_producto} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-semibold">{f.nombre_producto}</td>
                                    <td className="px-4 py-2 text-right font-bold text-red-600">{fmtN(f.total_faltante)}</td>
                                    <td className="px-4 py-2 text-right">{fmtN(f.veces_removido)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {faltantes.resumen_por_producto.length === 0 && (
                        <p className="text-center text-gray-400 py-8">Sin faltantes en el período.</p>
                    )}
                </div>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-700">Historial detallado</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-2 text-left">Pedido</th>
                                    <th className="px-4 py-2 text-left">Producto</th>
                                    <th className="px-4 py-2 text-right">Cant. original</th>
                                    <th className="px-4 py-2 text-left">Modificado por</th>
                                    <th className="px-4 py-2 text-left">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {faltantes.registros.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-bold text-blue-600">#{r.pedido_id}</td>
                                        <td className="px-4 py-2">{r.nombre_producto}</td>
                                        <td className="px-4 py-2 text-right">{r.cantidad_original}</td>
                                        <td className="px-4 py-2 text-gray-600">{r.modificado_por}</td>
                                        <td className="px-4 py-2 text-xs text-gray-500">{new Date(r.fecha_registro).toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Tab Resumen Ejecutivo ────────────────────────────────────────────────
    const TabResumen = () => {
        if (!resumen) return null;
        const k = resumen.kpis;
        const KpiCard = ({ label, value, sub, color = 'blue' }) => {
            const colors = { blue: 'border-blue-400 bg-blue-50', green: 'border-green-400 bg-green-50', purple: 'border-purple-400 bg-purple-50', orange: 'border-orange-400 bg-orange-50', red: 'border-red-400 bg-red-50' };
            const text = { blue: 'text-blue-700', green: 'text-green-700', purple: 'text-purple-700', orange: 'text-orange-700', red: 'text-red-700' };
            return (
                <div className={`border-l-4 rounded-lg p-4 ${colors[color]}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${text[color]}`}>{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
            );
        };
        return (
            <div className="space-y-6">
                <div className="bg-gray-50 border rounded-xl p-3 text-sm text-gray-500">
                    Período: <strong>{new Date(resumen.periodo.desde+'T00:00:00').toLocaleDateString('es-AR')}</strong> al <strong>{new Date(resumen.periodo.hasta+'T00:00:00').toLocaleDateString('es-AR')}</strong> — {resumen.periodo.dias} días
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <KpiCard label="Ingresos totales" value={`$${fmt(k.ingresos_totales)}`} color="green" />
                    <KpiCard label="Ticket promedio" value={`$${fmt(k.ticket_promedio)}`} sub="por pedido" color="blue" />
                    <KpiCard label="Pedidos activos" value={fmtN(k.total_pedidos)} sub={`${k.pedidos_por_dia}/día prom.`} color="purple" />
                    <KpiCard label="Clientes atendidos" value={fmtN(k.clientes_atendidos)} color="orange" />
                    <KpiCard label="Tasa de entrega" value={`${k.tasa_entrega}%`} sub="pedidos entregados" color={parseFloat(k.tasa_entrega) > 50 ? 'green' : 'orange'} />
                    <KpiCard label="Tasa de cancelación" value={`${k.tasa_cancelacion}%`} color={parseFloat(k.tasa_cancelacion) > 10 ? 'red' : 'blue'} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50"><h3 className="font-bold text-gray-700">Pipeline de pedidos</h3></div>
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr><th className="px-4 py-2 text-left">Estado</th><th className="px-4 py-2 text-right">Pedidos</th><th className="px-4 py-2 text-right">Clientes</th><th className="px-4 py-2 text-right">Monto</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {resumen.por_estado.map(e => (
                                <tr key={e.estado} className="hover:bg-gray-50">
                                    <td className="px-4 py-2"><BadgeEstado estado={e.estado} /></td>
                                    <td className="px-4 py-2 text-right font-semibold">{fmtN(e.total_pedidos)}</td>
                                    <td className="px-4 py-2 text-right">{fmtN(e.clientes_unicos)}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-green-700">${fmt(e.monto_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ─── Tab Categorías ───────────────────────────────────────────────────────
    const TabCategorias = () => {
        if (!categorias) return null;
        const { items: sorted, requestSort, sortConfig } = useSortableData(categorias.categorias, { key: 'monto_total', direction: 'descending' });
        return (
            <div className="space-y-4">
                <div className="bg-gray-50 border rounded-xl p-3 text-sm text-gray-500">
                    Ingreso global del período: <strong className="text-green-700">${fmt(categorias.monto_global)}</strong> · {categorias.total_categorias} categorías activas
                </div>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <TableHeader sortKey="categoria" sortConfig={sortConfig} onSort={requestSort}>Categoría</TableHeader>
                                    <TableHeader sortKey="monto_total" sortConfig={sortConfig} onSort={requestSort}>Monto</TableHeader>
                                    <TableHeader sortKey="pct_del_total" sortConfig={sortConfig} onSort={requestSort}>% Total</TableHeader>
                                    <TableHeader sortKey="unidades_vendidas" sortConfig={sortConfig} onSort={requestSort}>Unidades</TableHeader>
                                    <TableHeader sortKey="productos_activos" sortConfig={sortConfig} onSort={requestSort}>Productos</TableHeader>
                                    <TableHeader sortKey="aparece_en_pedidos" sortConfig={sortConfig} onSort={requestSort}>Pedidos</TableHeader>
                                    <th className="px-4 py-2 text-left">Producto estrella</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sorted.map((c, i) => (
                                    <tr 
                                        key={c.categoria} 
                                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                                        onClick={() => { setFiltroCategoria(c.categoria); setActiveTab('productos'); }}
                                        title="Ver productos de esta categoría"
                                    >
                                        <td className="px-4 py-3 font-semibold text-blue-600 hover:underline">
                                            <span className="text-gray-400 mr-2 no-underline">{i+1}</span>{c.categoria}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-700">${fmt(c.monto_total)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 bg-gray-100 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width:`${Math.min(parseFloat(c.pct_del_total),100)}%`}}></div></div>
                                                <span className="font-semibold w-10 text-right">{c.pct_del_total}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">{fmtN(c.unidades_vendidas)}</td>
                                        <td className="px-4 py-3 text-right">{fmtN(c.productos_activos)}</td>
                                        <td className="px-4 py-3 text-right">{fmtN(c.aparece_en_pedidos)}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{c.producto_estrella}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const tabContent = {
        resumen:    <TabResumen />,
        diario:     <TabDiario />,
        vendedores: <TabVendedores />,
        entregados: <TabEntregados />,
        inactivos:  <TabInactivos />,
        productos:  <TabProductos />,
        faltantes:  <TabFaltantes />,
        categorias: <TabCategorias />,
    };

    return (
        <React.Fragment>
        <div className="p-4 md:p-6 space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
                <p className="text-sm text-gray-500">Métricas de gestión y toma de decisiones</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            activeTab === t.id
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-white border text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Filtros */}
            <FiltroFechas />

            {/* Contenido */}
            {loading && (
                <div className="flex justify-center py-16">
                    <Spinner className="border-blue-500 w-10 h-10" />
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}
            {!loading && !error && tabContent[activeTab]}
        </div>
        <ModalAnalisisCliente />
        </React.Fragment>
    );
};
