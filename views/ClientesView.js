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
    const filteredClientes = sortedClientes.filter(c => c.nombre_comercio.toLowerCase().includes(searchTerm.toLowerCase()) || (c.nombre_contacto && c.nombre_contacto.toLowerCase().includes(searchTerm.toLowerCase())));
    const isAdmin = user.rol === 'admin';
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 shrink-0">Gestión de Clientes</h1>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
                    <input type="text" placeholder="Buscar por comercio o contacto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto sm:flex-grow max-w-xs px-4 py-2 border border-gray-300 rounded-lg"/>
                    {isAdmin && (<button onClick={() => onShowClienteForm({})} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center shrink-0"><PlusIcon className="h-5 w-5 mr-2" /> Agregar</button>)}
                </div>
            </div>
            {/* Vista tabla — Desktop */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                    {loading && <div className="p-6 flex justify-center"><Spinner className="border-blue-500"/></div>}
                    {error && <p className="p-6 text-red-500">{error}</p>}
                    {!loading && !error && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr>
                                <TableHeader sortKey="nombre_comercio" sortConfig={sortConfig} onSort={requestSort}>Comercio</TableHeader>
                                <TableHeader sortKey="nombre_contacto" sortConfig={sortConfig} onSort={requestSort}>Contacto</TableHeader>
                                <TableHeader sortKey="telefono" sortConfig={sortConfig} onSort={requestSort}>Teléfono</TableHeader>
                                {isAdmin && <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>}
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClientes.map((cliente) => (
                                    <tr key={cliente.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{cliente.nombre_comercio}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{cliente.nombre_contacto}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{cliente.telefono}</td>
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
                        {cliente.direccion && <p className="text-xs text-gray-400 mt-1">{cliente.direccion}</p>}
                    </div>
                ))}
                {!loading && filteredClientes.length === 0 && <p className="p-6 text-center text-gray-500">No se encontraron resultados.</p>}
            </div>
        </div>
    );
};