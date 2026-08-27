/**
 * @file Contiene la vista de la bandeja de pedidos.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes como Spinner, TableHeader, EstadoBadge, PasswordConfirmModal y varios iconos.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const PedidosView = ({ onSelectPedido, user }) => {
    const [pedidos, setPedidos] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showArchived, setShowArchived] = React.useState(false);
    const [confirmAction, setConfirmAction] = React.useState({ action: null, pedido: null });
    const [printingHojaRuta, setPrintingHojaRuta] = React.useState(false);
    const token = localStorage.getItem('token');
    const { items: sortedPedidos, requestSort, sortConfig } = useSortableData(pedidos, { key: 'id', direction: 'descending' });

    const fetchPedidos = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('No se pudo obtener la lista de pedidos.');
            setPedidos(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const handleActionConfirm = async () => {
        const { action, pedido } = confirmAction;
        if (!action || !pedido) return;
        const url = `${API_URL}/pedidos/${pedido.id}/${action}`;
        try {
            await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            setConfirmAction({ action: null, pedido: null });
            fetchPedidos();
        } catch (err) {
            alert(`Error al ejecutar la acción: ${err.message}`);
            setConfirmAction({ action: null, pedido: null });
        }
    };

    const [hojaRutaData, setHojaRutaData] = React.useState(null);

    const generarHojaRuta = async () => {
        setPrintingHojaRuta(true);
        try {
            const res = await fetch(`${API_URL}/pedidos/hoja-ruta`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Error al obtener datos para hoja de ruta');
            const data = await res.json();
            
            if (data.length === 0) {
                alert('No hay pedidos facturados en las últimas 6 horas.');
                setPrintingHojaRuta(false);
                return;
            }

            setHojaRutaData(data);
            // Esperar a que el DOM renderice el printable div
            setTimeout(() => {
                const printArea = document.getElementById('printableHojaRuta');
                if (printArea) {
                    printArea.style.display = 'block';
                    window.print();
                    printArea.style.display = 'none';
                }
                setPrintingHojaRuta(false);
            }, 200);
        } catch (error) {
            alert('Error: ' + error.message);
            setPrintingHojaRuta(false);
        }
    };

    const HojaRutaPrintable = ({ data }) => {
        if (!data || data.length === 0) return null;
        const fechaHoy = new Date().toLocaleDateString('es-AR');
        const localidades = [...new Set(data.map(p => p.localidad).filter(Boolean))].join(', ');

        return (
            <div id="printableHojaRuta" className="printable-area hidden font-sans bg-white" style={{ fontSize: '9pt', color: '#444' }}>
                {/* Cabecera */}
                <div className="print-header">
                    <div className="flex justify-between items-start text-sm mb-1">
                        <div className="w-1/3"><h1 className="text-base font-bold">Hoja de Ruta</h1></div>
                        <div className="w-1/3 text-center"><span>Fecha: {fechaHoy}</span></div>
                        <div className="w-1/3 text-right"><span>Pedidos: {data.length}</span></div>
                    </div>
                    {localidades && <p className="text-xs mb-1">Destinos: {localidades}</p>}
                    <hr className="border-gray-400 my-1" />
                </div>

                {/* Tabla */}
                <div className="print-body flex-grow">
                    <table className="w-full border-collapse" style={{ fontSize: '8pt' }}>
                        <thead>
                            <tr>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '30%' }}>Cliente</th>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '14%' }}>Efectivo</th>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '16%' }}>Transferencia</th>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '14%' }}>Debe</th>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '26%' }}>Firma Conform.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((pedido, idx) => (
                                <React.Fragment key={pedido.id}>
                                    {/* Fila del cliente - compacta */}
                                    <tr>
                                        <td className="border-b border-gray-200 px-1 py-0.5 text-left">
                                            <span>{pedido.nombre_comercio}</span>
                                            <span style={{ fontSize: '7pt', color: '#888', marginLeft: '4px' }}>#{pedido.id}</span>
                                            {(pedido.horario_atencion || pedido.horario_recepcion) && (
                                                <div style={{ fontSize: '7pt', color: '#888' }}>
                                                    {pedido.horario_recepcion ? 'Recep: ' + pedido.horario_recepcion : pedido.horario_atencion ? 'Aten: ' + pedido.horario_atencion : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td className="border-b border-gray-200 px-1 py-0.5"></td>
                                        <td className="border-b border-gray-200 px-1 py-0.5"></td>
                                        <td className="border-b border-gray-200 px-1 py-0.5"></td>
                                        <td className="border-b border-gray-200 px-1 py-0.5"></td>
                                    </tr>
                                    {/* Fila de observaciones */}
                                    <tr>
                                        <td colSpan="5" className="border-b border-gray-300 px-1" style={{ fontSize: '7pt', fontStyle: 'italic', paddingTop: '1px', paddingBottom: '3px', color: '#999' }}>
                                            Obs: ________________________________________
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                            {/* Fila TOTAL */}
                            <tr>
                                <td className="border-b border-gray-400 px-1 py-1 font-bold text-center">TOTAL</td>
                                <td className="border-b border-gray-400 px-1 py-1"></td>
                                <td className="border-b border-gray-400 px-1 py-1"></td>
                                <td className="border-b border-gray-400 px-1 py-1"></td>
                                <td className="border-b border-gray-400 px-1 py-1 text-center" style={{ paddingTop: '12px' }}>
                                    <div className="border-b border-gray-500 mx-2 mb-0.5"></div>
                                    <span style={{ fontSize: '7pt', color: '#888' }}>Firma del Repartidor</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const filteredPedidos = React.useMemo(() => 
        sortedPedidos.filter(p =>
            (showArchived ? p.estado === 'archivado' : p.estado !== 'archivado') &&
            ((p.nombre_comercio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (p.nombre_vendedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             p.id.toString().includes(searchTerm))
    ), [sortedPedidos, showArchived, searchTerm]);

    const renderActions = (pedido) => (
        <>
            <button onClick={() => onSelectPedido(pedido.id)} className="text-blue-600 hover:text-blue-900 font-semibold">Ver</button>
            {user.rol === 'admin' && pedido.estado !== 'archivado' && (<button onClick={() => setConfirmAction({ action: 'archive', pedido: pedido })} className="text-gray-500 hover:text-red-700 font-semibold">Archivar</button>)}
            {user.rol === 'admin' && pedido.estado === 'archivado' && (<button onClick={() => setConfirmAction({ action: 'unarchive', pedido: pedido })} className="text-green-600 hover:text-green-800 font-semibold">Desarchivar</button>)}
        </>
    );

    return (
        <div>
            {confirmAction.action && (
                <PasswordConfirmModal 
                    title={`¿${confirmAction.action === 'archive' ? 'Archivar' : 'Desarchivar'} Pedido #${confirmAction.pedido.id}?`} 
                    message={confirmAction.action === 'archive' ? 'El pedido se ocultará de la lista principal.' : 'El pedido volverá a la lista de pedidos activos.'}
                    onConfirm={handleActionConfirm} 
                    onClose={() => setConfirmAction({ action: null, pedido: null })} 
                />
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4 shrink-0">
                    <h1 className="text-3xl font-bold text-gray-800">Bandeja de Pedidos</h1>
                    {user.rol === 'admin' && (
                        <button 
                            onClick={generarHojaRuta} 
                            disabled={printingHojaRuta}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm flex items-center transition"
                        >
                            {printingHojaRuta ? <Spinner className="w-5 h-5 mr-2 border-white" /> : '📄 Imprimir Hoja de Ruta'}
                        </button>
                    )}
                </div>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Archivados</span>
                            <button onClick={() => setShowArchived(!showArchived)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showArchived ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showArchived ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                        </div>
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg"/>
                    </div>
                </div>
            </div>

            {loading ? <div className="p-6 flex justify-center"><Spinner className="border-blue-500"/></div> : error ? <p className="p-6 text-red-500">{error}</p> : (
                <>
                    {/* Vista de Tabla para Escritorio */}
                    <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <TableHeader sortKey="id" sortConfig={sortConfig} onSort={requestSort}>ID</TableHeader>
                                        <TableHeader sortKey="nombre_comercio" sortConfig={sortConfig} onSort={requestSort}>Cliente</TableHeader>
                                        <TableHeader sortKey="nombre_vendedor" sortConfig={sortConfig} onSort={requestSort}>Vendedor</TableHeader>
                                        <TableHeader sortKey="fecha_creacion" sortConfig={sortConfig} onSort={requestSort}>Fecha</TableHeader>
                                        <TableHeader sortKey="estado" sortConfig={sortConfig} onSort={requestSort}>Estado</TableHeader>
                                        <th className="relative px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPedidos.map((pedido) => (
                                        <tr key={pedido.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">#{pedido.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{pedido.nombre_comercio}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{pedido.nombre_vendedor}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{new Date(pedido.fecha_creacion).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm capitalize"><EstadoBadge estado={pedido.estado} /></td>
                                            <td className="px-6 py-4 text-right text-sm font-medium space-x-4">{renderActions(pedido)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Vista de Tarjetas para Móvil */}
                    <div className="md:hidden space-y-4">
                        {filteredPedidos.map((pedido) => (
                            <div key={pedido.id} className="bg-white rounded-xl shadow-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{pedido.nombre_comercio}</p>
                                        <p className="text-sm text-gray-500">Pedido #{pedido.id}</p>
                                    </div>
                                    <EstadoBadge estado={pedido.estado} />
                                </div>
                                <div className="border-t border-gray-200 pt-2 space-y-1 text-sm text-gray-700">
                                    <p><strong>Vendedor:</strong> {pedido.nombre_vendedor}</p>
                                    <p><strong>Fecha:</strong> {new Date(pedido.fecha_creacion).toLocaleDateString()}</p>
                                </div>
                                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-end space-x-4 text-sm">
                                    {renderActions(pedido)}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {!loading && filteredPedidos.length === 0 && <p className="p-6 text-center text-gray-500">No se encontraron resultados.</p>}
            <HojaRutaPrintable data={hojaRutaData} />
        </div>
    );
};