/**
 * @file Contiene la vista de gestión de productos.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes como Spinner, TableHeader, PasswordConfirmModal y varios iconos.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const ProductosView = ({ user, onShowProductoForm, onShowImportModal, productos, loading, error, onRefresh, onShowPdfOptionsModal }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showArchived, setShowArchived] = React.useState(false);

    React.useEffect(() => {
        onRefresh(showArchived);
    }, [showArchived]);

    const { items: sortedProductos, requestSort, sortConfig } = useSortableData(productos, { key: 'nombre', direction: 'ascending' });
    const [confirmArchive, setConfirmArchive] = React.useState(null);
    const [confirmRestore, setConfirmRestore] = React.useState(null);
    const [actionLoading, setActionLoading] = React.useState(false);
    
    const handleExportCsv = () => {
        const headers = "codigo_sku,nombre,categoria,precio_unitario,stock\n";
        const csvContent = "data:text/csv;charset=utf-8," 
            + productos.map(p => `${p.codigo_sku || ''},"${p.nombre.replace(/"/g, '""')}",${p.categoria || ''},${p.precio_unitario},${p.stock}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `productos_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const executeArchive = async () => {
        if (!confirmArchive) return;
        
        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/productos/${confirmArchive.id}`, { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al archivar el producto.');
            }
            setConfirmArchive(null);
            onRefresh(showArchived);
        } catch (err) { 
            alert(err.message);
            setConfirmArchive(null);
        } finally {
            setActionLoading(false);
        }
    };
    
    const executeRestore = async () => {
        if (!confirmRestore) return;

        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/productos/${confirmRestore.id}/restore`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al restaurar el producto.');
            }
            setConfirmRestore(null);
            onRefresh(showArchived);
        } catch (err) {
            alert(err.message);
            setConfirmRestore(null);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredProductos = sortedProductos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || (p.codigo_sku && p.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase())));
    const isAdmin = user.rol === 'admin';

    return (
        <div>
            {confirmArchive && (
                <PasswordConfirmModal
                    title={`¿Archivar "${confirmArchive.nombre}"?`}
                    message="El producto se ocultará de las listas de venta y no podrá ser agregado a nuevos pedidos. Podrás restaurarlo más tarde."
                    onConfirm={executeArchive}
                    onClose={() => setConfirmArchive(null)}
                    loading={actionLoading}
                />
            )}
            {confirmRestore && (
                <PasswordConfirmModal
                    title={`¿Restaurar "${confirmRestore.nombre}"?`}
                    message="El producto volverá a estar disponible para la venta."
                    onConfirm={executeRestore}
                    onClose={() => setConfirmRestore(null)}
                    loading={actionLoading}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 shrink-0">Gestión de Productos</h1>
                <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                    <input type="text" placeholder="Buscar por nombre o SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto sm:flex-grow max-w-xs px-4 py-2 border border-gray-300 rounded-lg"/>
                    
                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Archivados</span>
                            <button onClick={() => setShowArchived(!showArchived)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showArchived ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showArchived ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 flex-wrap justify-start">
                        {isAdmin && <button onClick={onShowImportModal} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shrink-0"><UploadIcon className="h-5 w-5 mr-2" /> Importar</button>}
                        <button onClick={handleExportCsv} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shrink-0"><DownloadIcon className="h-5 w-5 mr-2" /> Exportar CSV</button>
                        {isAdmin && <button onClick={onShowPdfOptionsModal} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shrink-0"><FileTextIcon className="h-5 w-5 mr-2" /> Exportar PDF</button>}
                        {isAdmin && (<button onClick={() => onShowProductoForm({})} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shrink-0"><PlusIcon className="h-5 w-5 mr-2" /> Agregar</button>)}
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {loading && <div className="p-6 flex justify-center"><Spinner className="border-blue-500"/></div>}
                    {error && <p className="p-6 text-red-500">{error}</p>}
                    {!loading && !error && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imagen</th>
                                <TableHeader sortKey="nombre" sortConfig={sortConfig} onSort={requestSort}>Nombre</TableHeader>
                                <TableHeader sortKey="categoria" sortConfig={sortConfig} onSort={requestSort}>Categoría</TableHeader>
                                <TableHeader sortKey="precio_unitario" sortConfig={sortConfig} onSort={requestSort}>Precio</TableHeader>
                                <TableHeader sortKey="stock" sortConfig={sortConfig} onSort={requestSort}>Stock</TableHeader>
                                {isAdmin && <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>}
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProductos.map((producto) => (
                                    <tr key={producto.id} className={`hover:bg-gray-50 transition-opacity ${producto.archivado ? 'opacity-50 bg-gray-100' : ''}`}>
                                        <td className="px-6 py-4"><img src={producto.imagen_url || 'https://placehold.co/400x400/e2e8f0/e2e8f0?text=...'} alt={producto.nombre} className="h-12 w-12 rounded-md object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/e2e8f0/e2e8f0?text=...'; }} /></td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{producto.nombre}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{producto.categoria || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">${producto.precio_unitario}</td>
                                        {/* --- INICIO DE LA MODIFICACIÓN: Usar StockBadge --- */}
                                        <td className="px-6 py-4 text-sm"><StockBadge producto={producto} /></td>
                                        {/* --- FIN DE LA MODIFICACIÓN --- */}
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                                <a href="#" onClick={(e) => { e.preventDefault(); onShowProductoForm(producto); }} className="text-blue-600 hover:text-blue-900">Editar</a>
                                                {producto.archivado ? (
                                                    <a href="#" onClick={(e) => { e.preventDefault(); setConfirmRestore(producto); }} className="text-green-600 hover:text-green-900">Restaurar</a>
                                                ) : (
                                                    <a href="#" onClick={(e) => { e.preventDefault(); setConfirmArchive(producto); }} className="text-red-600 hover:text-red-900">Archivar</a>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && filteredProductos.length === 0 && <p className="p-6 text-center text-gray-500">No se encontraron resultados.</p>}
                </div>
            </div>
        </div>
    );
};