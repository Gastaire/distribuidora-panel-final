/**
 * @file Contiene la vista de gestión de clientes.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes como Spinner, TableHeader, PlusIcon y el hook useSortableData.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const ClientesView = ({ user, onShowClienteForm }) => {
    const [clientes, setClientes] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [zoneFilter, setZoneFilter] = React.useState('');
    const [zoneClient, setZoneClient] = React.useState(null);
    const [selectedZone, setSelectedZone] = React.useState('');
    const [savingZone, setSavingZone] = React.useState(false);
    const [zoneError, setZoneError] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const token = localStorage.getItem('token');
    const { items: sortedClientes, requestSort, sortConfig } = useSortableData(clientes, { key: 'nombre_comercio', direction: 'ascending' });
    const fetchClientes = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/clientes`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('No se pudo obtener la lista de clientes.');
            setClientes(await response.json());
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    }, [token]);
    React.useEffect(() => { fetchClientes(); }, [fetchClientes]);
    const handleDelete = async (clienteId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            try {
                const response = await fetch(`${API_URL}/clientes/${clienteId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('Error al eliminar el cliente.');
                fetchClientes();
            } catch (err) { alert(err.message); }
        }
    };
    const openZone = cliente => {
        setZoneClient(cliente);
        setSelectedZone((cliente.zona_manual && canonicalDeliveryZone(cliente.zona)) || suggestDeliveryZone(cliente, clientes) || canonicalDeliveryZone(cliente.zona) || canonicalDeliveryZone(cliente.localidad) || '');
        setZoneError('');
    };
    const saveZone = async () => {
        if (!selectedZone || savingZone) return;
        setSavingZone(true);
        setZoneError('');
        try {
            const response = await fetch(`${API_URL}/clientes/${zoneClient.id}/zona`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ zona: selectedZone })
            });
            if (!response.ok) throw new Error('No se pudo guardar la zona operativa.');
            const updated = await response.json();
            setClientes(current => current.map(c => c.id === updated.id ? updated : c));
            setZoneClient(null);
        } catch (err) {
            setZoneError(err.message);
        } finally {
            setSavingZone(false);
        }
    };
    const filteredClientes = sortedClientes.filter(c => !zoneFilter || (zoneFilter === "pendiente" ? !c.zona_manual : canonicalDeliveryZone(c.zona) === zoneFilter)).filter(c => c.nombre_comercio.toLowerCase().includes(searchTerm.toLowerCase()) || (c.nombre_contacto && c.nombre_contacto.toLowerCase().includes(searchTerm.toLowerCase())));
    const isAdmin = user.rol === 'admin';
    const renderLogistica = cliente => {
        const atencion = formatCustomerSchedule(cliente.horario_atencion);
        const recepcion = formatCustomerSchedule(cliente.horario_entrega || cliente.horario_recepcion);
        const hasGps = cliente.latitud != null && cliente.longitud != null && cliente.latitud !== '' && cliente.longitud !== '';
        return <div className="client-logistics">
            {cliente.direccion && <p className="font-medium">{cliente.direccion}</p>}
            {atencion && <p><strong>Atención</strong> {atencion}</p>}
            {recepcion && <p><strong>Recepción</strong> {recepcion}</p>}
            {hasGps ? <p><strong>GPS</strong> <span className="tabular-nums">{cliente.latitud}, {cliente.longitud}</span></p>
                : <p className="text-gray-500">GPS pendiente</p>}
        </div>;
    };
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 shrink-0">Gestión de Clientes</h1>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
                    <input type="text" placeholder="Buscar por comercio o contacto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto sm:flex-grow max-w-xs px-4 py-2 border border-gray-300 rounded-lg"/>
                    {isAdmin && (<button onClick={() => onShowClienteForm({})} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center shrink-0"><PlusIcon className="h-5 w-5 mr-2" /> Agregar</button>)}
                </div>
            </div>
            <div className="workspace-toolbar mb-4 flex items-center flex-wrap gap-3">
                <label className="text-sm">Zona de reparto <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="ml-2 border rounded-lg p-2">
                    <option value="">Todas</option><option value="pendiente">Por confirmar</option>
                    {DELIVERY_ZONES.map(zona => <option key={zona}>{zona}</option>)}
                </select></label>
                <span className="text-sm text-gray-500">{filteredClientes.length} clientes</span>
            </div>
            {zoneClient && <DialogFrame label="Zona de reparto" busy={savingZone} onClose={() => setZoneClient(null)}>
                <div className="bg-white w-full max-w-lg p-6 space-y-4">
                    <h2 className="font-bold text-xl">{zoneClient.nombre_comercio}</h2>
                    <p className="text-sm text-gray-500">La sugerencia GPS usa clientes cercanos con una zona confirmada. Revisá el nombre de reparto antes de guardar.</p>
                    <p className="text-sm">{zoneClient.direccion} · GPS {zoneClient.latitud && zoneClient.longitud ? 'registrado' : 'pendiente'}</p>
                    <label className="block text-sm">Zona operativa
                        <select className="block w-full border p-2 rounded-lg" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}><option value="">Seleccionar zona</option>{DELIVERY_ZONES.map(zona => <option key={zona}>{zona}</option>)}</select>
                    </label>
                    {zoneError && <p role="alert" className="text-red-700">{zoneError}</p>}
                    <button disabled={savingZone || !selectedZone} onClick={saveZone} className="bg-blue-600 text-white rounded-lg px-4 py-2">Confirmar zona</button>
                </div>
            </DialogFrame>}
            {/* Vista tabla — Desktop */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                    {loading && <div className="p-6 flex justify-center"><Spinner className="border-blue-500"/></div>}
                    {error && <p className="p-6 text-red-500">{error}</p>}
                    {!loading && !error && (
                        <table className="min-w-[960px] w-full divide-y divide-gray-200 client-table">
                            <thead className="bg-gray-50"><tr>
                                <TableHeader sortKey="nombre_comercio" sortConfig={sortConfig} onSort={requestSort}>Comercio</TableHeader>
                                <TableHeader sortKey="nombre_contacto" sortConfig={sortConfig} onSort={requestSort}>Contacto</TableHeader>
                                <th className="px-6 py-3 text-left">Zona operativa</th>
                                <TableHeader sortKey="telefono" sortConfig={sortConfig} onSort={requestSort}>Teléfono</TableHeader>
                                <TableHeader sortKey="vendedor_nombre" sortConfig={sortConfig} onSort={requestSort}>Vendedor</TableHeader>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección, horarios y GPS</th>
                                {isAdmin && <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>}
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClientes.map((cliente) => (
                                    <tr key={cliente.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{cliente.nombre_comercio}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{cliente.nombre_contacto}</td>
                                        <td className="px-6 py-4 text-sm">{isAdmin ? <button className="text-teal-700 font-semibold" onClick={() => openZone(cliente)}>{cliente.zona || 'Asignar zona'}{cliente.zona_manual ? '' : ' · revisar'}</button> : (cliente.zona || '—')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{cliente.telefono}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{cliente.vendedor_nombre || 'Sin asignar'}</td>
                                        <td className="px-6 py-4 text-sm">{renderLogistica(cliente)}</td>
                                        {isAdmin && <td className="px-6 py-4 text-right text-sm font-medium space-x-4"><a href="#" onClick={(e) => { e.preventDefault(); onShowClienteForm(cliente); }} className="text-blue-600 hover:text-blue-900">Editar</a><a href="#" onClick={(e) => { e.preventDefault(); handleDelete(cliente.id); }} className="text-red-600 hover:text-red-900">Eliminar</a></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && filteredClientes.length === 0 && <p className="p-6 text-center text-gray-500">No se encontraron resultados.</p>}
                </div>
            </div>

            {/* Vista cards — Móvil */}
            <div className="md:hidden space-y-3">
                {loading && <div className="p-4 flex justify-center"><Spinner className="border-blue-500"/></div>}
                {error && <p className="p-4 text-red-500">{error}</p>}
                {!loading && !error && filteredClientes.map((cliente) => (
                    <div key={cliente.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-start">
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{cliente.nombre_comercio}</p>
                                {cliente.nombre_contacto && <p className="text-sm text-gray-500">{cliente.nombre_contacto}</p>}
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2 shrink-0 ml-2">
                                    <button onClick={() => onShowClienteForm(cliente)} className="text-xs text-blue-600 font-semibold py-1 px-2 rounded bg-blue-50">Editar</button>
                                    <button onClick={() => handleDelete(cliente.id)} className="text-xs text-red-500 font-semibold py-1 px-2 rounded bg-red-50">Eliminar</button>
                                </div>
                            )}
                        </div>
                        {cliente.telefono && (
                            <a href={`tel:${cliente.telefono}`} className="mt-2 flex items-center gap-1 text-sm text-blue-600 font-medium">
                                📞 {cliente.telefono}
                            </a>
                        )}
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                            {cliente.vendedor_nombre && <p><strong>Vendedor</strong> {cliente.vendedor_nombre}</p>}
                            {renderLogistica(cliente)}
                        </div>
                        {isAdmin && <button className="text-sm text-teal-700" onClick={() => openZone(cliente)}>{cliente.zona || "Asignar zona"}</button>}
                    </div>
                ))}
                {!loading && filteredClientes.length === 0 && <p className="p-6 text-center text-gray-500">No se encontraron resultados.</p>}
            </div>
        </div>
    );
};