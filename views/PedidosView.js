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
                <h1 className="text-3xl font-bold text-gray-800 shrink-0">Bandeja de Pedidos</h1>
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
        </div>
    );
};