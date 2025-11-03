/**
 * @file Contiene el componente principal de la aplicación y la lógica de orquestación.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: Completamente modularizada. Este es el punto de entrada de la aplicación React.
 *
 * Este archivo define el componente `App` que maneja el estado global, la autenticación,
 * el enrutamiento y la visualización de modales. Se carga al final en `index.html`
 * y renderiza toda la interfaz en el div #root.
 */

// --- Componentes de Modales y Layout ---

        const LoginPage = ({ onLogin, loading, error }) => {
          const [email, setEmail] = React.useState('');
          const [password, setPassword] = React.useState('');
          const handleSubmit = (e) => { e.preventDefault(); onLogin(email, password); };
          return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center font-sans">
              <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Panel de Control</h1>
                <p className="text-center text-gray-500 mb-8">Inicia sesión para continuar</p>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Correo Electrónico</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@distribuidora.com" className="w-full px-4 py-3 rounded-lg bg-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none" required /></div>
                  <div className="mb-6"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Contraseña</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" className="w-full px-4 py-3 rounded-lg bg-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none" required /></div>
                  {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">{loading ? <Spinner /> : 'Ingresar'}</button>
                </form>
              </div>
            </div>
          );
        };
        

        const PdfOptionsModal = ({ onClose, onGenerate, loading }) => {
            const [options, setOptions] = React.useState({
                format: 'price-list', // Valores posibles: 'price-list', 'catalog'
                stock: 'in-stock',
            });
        
            const handleOptionChange = (type, value) => {
                setOptions(prev => ({ ...prev, [type]: value }));
            };
        
            const handleSubmit = () => {
                onGenerate(options);
            };
        
            const OptionButton = ({ label, description, value, type, selectedValue, onSelect, disabled = false }) => (
                <button
                    onClick={() => onSelect(type, value)}
                    disabled={disabled}
                    className={`text-left p-4 border rounded-lg w-full transition-all duration-200 ${selectedValue === value ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-white hover:bg-gray-50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <p className="font-bold text-gray-800">{label}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                </button>
            );
        
            return (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Exportar a PDF</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">1. Elige el formato</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <OptionButton 
                                        label="Lista de Precios"
                                        description="Un listado compacto, organizado por categorías. Ideal para imprimir."
                                        value="price-list"
                                        type="format"
                                        selectedValue={options.format}
                                        onSelect={handleOptionChange}
                                    />
                                    <OptionButton 
                                        label="Catálogo con Fotos"
                                        description="Muestra los productos en cuadrícula con imágenes destacadas."
                                        value="catalog"
                                        type="format"
                                        selectedValue={options.format}
                                        onSelect={handleOptionChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">2. Elige qué productos incluir</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <OptionButton 
                                        label="Sólo productos en Stock"
                                        description="La lista contendrá únicamente productos marcados como 'Sí' en stock."
                                        value="in-stock"
                                        type="stock"
                                        selectedValue={options.stock}
                                        onSelect={handleOptionChange}
                                    />
                                    <OptionButton 
                                        label="Todos los productos"
                                        description="La lista contendrá todos los productos, sin importar su stock."
                                        value="all"
                                        type="stock"
                                        selectedValue={options.stock}
                                        onSelect={handleOptionChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button type="button" onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                                {loading ? <><Spinner className="mr-2"/>Generando...</> : 'Generar PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        const LogsModal = ({ logs, pedidoId, onClose }) => {
            return (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Historial del Pedido #{pedidoId}</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {logs.length > 0 ? (
                                <ul className="space-y-4">
                                    {logs.map(log => (
                                        <li key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-center text-sm">
                                                <p className="font-bold text-gray-800">{log.nombre_usuario}</p>
                                                <p className="text-gray-500">{new Date(log.fecha_creacion).toLocaleString()}</p>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-700"><span className="font-semibold capitalize">{log.accion.replace(/_/g, ' ')}:</span> {log.detalle}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No hay historial de cambios para este pedido.</p>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
                        </div>
                    </div>
                </div>
            );
        };

        
            const PedidoDetailModal = ({ pedidoId, onClose, user, onUpdate }) => {
            const [pedido, setPedido] = React.useState(null);
            const [loading, setLoading] = React.useState(true);
            const [error, setError] = React.useState(null);
            const [isEditing, setIsEditing] = React.useState(false);
            const [editableItems, setEditableItems] = React.useState([]);
            const [allProducts, setAllProducts] = React.useState([]);
            const [productSearch, setProductSearch] = React.useState('');
            const [logs, setLogs] = React.useState([]);
            const [showLogs, setShowLogs] = React.useState(false);
            const [integrityIssues, setIntegrityIssues] = React.useState([]);
            
            const [notasEditables, setNotasEditables] = React.useState('');
            const [guardandoNotas, setGuardandoNotas] = React.useState(false);
            const token = localStorage.getItem('token');
            
            const fetchAllData = React.useCallback(async () => {
                setLoading(true);
                try {
                    const [pedidoRes, productsRes] = await Promise.all([
                        fetch(`${API_URL}/pedidos/${pedidoId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch(`${API_URL}/productos`, { headers: { 'Authorization': `Bearer ${token}` } })
                    ]);
        
                    if (!pedidoRes.ok) throw new Error('No se pudo obtener el detalle del pedido.');
                    if (!productsRes.ok) throw new Error('No se pudo obtener la lista de productos.');
        
                    const pedidoData = await pedidoRes.json();
                    const allProductsData = await productsRes.json();
                    
                    setPedido(pedidoData);
                    setEditableItems(pedidoData.items);
                    setAllProducts(allProductsData);
                    setNotasEditables(pedidoData.notas_entrega || '');
        
                    const issues = [];
                    const productIds = allProductsData.map(p => p.id);
                    pedidoData.items.forEach(item => {
                        if (!productIds.includes(item.producto_id)) {
                            issues.push(`El producto "${item.nombre_producto}" (ID: ${item.producto_id}) ya no existe.`);
                        }
                    });
                    setIntegrityIssues(issues);
        
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            }, [pedidoId, token]);
            
            React.useEffect(() => {
                fetchAllData();
            }, [fetchAllData]);

            // --- INICIO DE LA MODIFICACIÓN ---
            const sortedEditableItems = React.useMemo(() => {
                if (!editableItems) return [];
        
                const getCategoryWeight = (category) => {
                    const cat = category ? category.toLowerCase() : 'sin categoría';
                    if (cat === 'fiambreria') return 2;
                    if (cat === 'sin categoría') return 1;
                    return 0; // Todas las demás categorías
                };
        
                return [...editableItems].sort((a, b) => {
                    const categoryA = a.categoria || 'Sin Categoría';
                    const categoryB = b.categoria || 'Sin Categoría';
        
                    const weightA = getCategoryWeight(categoryA);
                    const weightB = getCategoryWeight(categoryB);
        
                    if (weightA !== weightB) {
                        return weightA - weightB;
                    }
        
                    if (categoryA.localeCompare(categoryB) !== 0) {
                        return categoryA.localeCompare(categoryB);
                    }
        
                    return a.nombre_producto.localeCompare(b.nombre_producto);
                });
            }, [editableItems]);
            // --- FIN DE LA MODIFICACIÓN ---
        
            const fetchLogs = async () => {
                try {
                    const response = await fetch(`${API_URL}/logs`, { headers: { 'Authorization': `Bearer ${token}` } });
                    const allLogs = await response.json();
                    setLogs(allLogs.filter(log => log.detalle && log.detalle.includes(`#${pedidoId}`)));
                    setShowLogs(true);
                } catch (err) { alert("Error al cargar los logs."); }
            };
        
            const handleUpdateStatus = async (nuevoEstado) => {
                try {
                    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ estado: nuevoEstado }) });
                    if (!response.ok) throw new Error('Error al actualizar estado.');
                    // En lugar de cerrar, recargamos los datos del pedido
                    fetchAllData(); 
                    onUpdate(); // Mantenemos onUpdate para refrescar la lista de fondo si es necesario
                } catch(err) { alert(err.message); }
            };
            
            const handleQuantityChange = (itemId, newQuantity) => {
                const quantity = parseFloat(String(newQuantity).replace(',', '.'));
                setEditableItems(items => items.map(item => (item.id === itemId || item.producto_id === itemId) ? { ...item, cantidad: isNaN(quantity) ? 0 : quantity } : item));
            };
        
            const handleRemoveItem = (itemId) => { setEditableItems(items => items.filter(item => (item.id !== itemId && item.producto_id !== itemId))); };
            
            const handleAddItem = (productToAdd) => {
                if (productToAdd && !editableItems.find(item => item.producto_id === productToAdd.id)) {
                    const newItem = { id: `new_${productToAdd.id}`, producto_id: productToAdd.id, nombre_producto: productToAdd.nombre, cantidad: 1, precio_congelado: productToAdd.precio_unitario, aviso_faltante: productToAdd.stock === 'No', codigo_sku: productToAdd.codigo_sku, categoria: productToAdd.categoria };
                    setEditableItems(items => [...items, newItem]);
                }
                setProductSearch('');
            };
        
            const handleSaveChanges = async () => {
                const itemsToSave = editableItems.map(item => ({ producto_id: item.producto_id, cantidad: item.cantidad })).filter(item => item.cantidad > 0);
                try {
                    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/items`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ items: itemsToSave }) });
                    if (!response.ok) throw new Error('Error al guardar los cambios.');
                    setIsEditing(false);
                    // En lugar de cerrar, recargamos los datos
                    fetchAllData();
                    onUpdate(); // Mantenemos onUpdate para refrescar la lista de fondo
                } catch (err) { alert(err.message); }
            };
            
            const handleGuardarNotas = async () => {
                setGuardandoNotas(true);
                try {
                    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/notas`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ notas_entrega: notasEditables })
                    });
                    if (!response.ok) throw new Error('Error al guardar la nota.');
                    const pedidoActualizadoParcial = await response.json();
                    
                    setPedido(prevPedido => ({ ...prevPedido, notas_entrega: pedidoActualizadoParcial.notas_entrega }));
        
                } catch(err) {
                    alert(err.message);
                } finally {
                    setGuardandoNotas(false);
                }
            };
        
            const handlePrint = (printType) => {
                const printArea = document.getElementById(printType);
                const originalVis = document.body.style.visibility;
                document.body.style.visibility = 'hidden';
                printArea.style.display = 'block';
                window.print();
                printArea.style.display = 'none';
                document.body.style.visibility = originalVis;
            };
        
            const totalPedido = (pedido && editableItems) ? editableItems.reduce((acc, item) => acc + (item.cantidad * item.precio_congelado), 0) : 0;
            const isAdmin = user.rol === 'admin';
            const isDeposito = user.rol === 'deposito';
            const estadosDisponibles = isAdmin ? { pendiente: 'Pendiente', visto: 'Visto', en_preparacion: 'En Preparación', facturado: 'Facturado', listo_para_entrega: 'Listo p/ Entrega', entregado: 'Entregado', cancelado: 'Cancelado' } : { pendiente: 'Pendiente', visto: 'Visto', en_preparacion: 'En Preparación', listo_para_entrega: 'Listo p/ Entrega', entregado: 'Entregado' };
            const filteredProductsToAdd = allProducts.filter(p => productSearch && p.nombre.toLowerCase().includes(productSearch.toLowerCase()) && !editableItems.some(item => item.producto_id === p.id)).slice(0, 5);
            
            const renderItem = (item) => {
                const itemId = item.id || item.producto_id;
                const subtotal = (item.cantidad * item.precio_congelado).toFixed(2);
                return (
                    <>
                        <div className="flex-grow">
                            <p className={`text-sm font-medium text-gray-800 ${integrityIssues.some(i => i.includes(`ID: ${item.producto_id}`)) ? 'text-red-600' : ''}`}>
                                {item.aviso_faltante && <WarningIcon className="h-4 w-4 text-yellow-500 mr-2 inline" title="Producto sin stock al momento del pedido" />}
                                {item.nombre_producto}
                            </p>
                            {!isEditing && <p className="text-sm text-gray-500">Cant: {item.cantidad}</p>}
                        </div>
                        <div className="flex items-center gap-4">
                            {isEditing ? (
                                <input type="number" step="0.001" value={item.cantidad} onChange={(e) => handleQuantityChange(itemId, e.target.value)} className="w-24 text-center border rounded-md py-1"/>
                            ) : (
                                <p className="text-sm font-semibold text-gray-900">${subtotal}</p>
                            )}
                            {isEditing && (
                                <button onClick={() => handleRemoveItem(itemId)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </>
                );
            };

            return (
                <React.Fragment>
                    {showLogs && <LogsModal logs={logs} pedidoId={pedidoId} onClose={() => setShowLogs(false)} />}
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b gap-3">
                                <h2 className="text-xl font-bold text-gray-800">Detalle del Pedido #{pedidoId}</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button onClick={fetchLogs} className="relative flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-lg text-sm"><HistoryIcon className="h-5 w-5"/>Logs{integrityIssues.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white"></span>}</button>
                                    <button onClick={() => handlePrint('printableAreaAssembly')} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-3 rounded-lg text-sm"><CheckSquareIcon className="h-5 w-5"/>P/ Armar</button>
                                    <button onClick={() => handlePrint('printableArea')} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-sm"><PrintIcon className="h-5 w-5"/>Imprimir</button>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2"><CloseIcon/></button>
                                </div>
                            </div>
                            
                            {loading && <div className="p-8 flex justify-center"><Spinner className="border-blue-500"/></div>}
                            {error && <p className="p-8 text-red-500">{error}</p>}
                            
                            {!loading && !error && pedido && (
                                <div className="p-6 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div><h3 className="font-bold text-gray-800 mb-2">Cliente</h3><p className="text-gray-600">{pedido.nombre_comercio}</p><p className="text-gray-500 text-sm">{pedido.direccion}</p></div>
                                        <div><h3 className="font-bold text-gray-800 mb-2">Información del Pedido</h3><p className="text-gray-600">Vendedor: <span className="font-semibold">{pedido.nombre_vendedor}</span></p><p className="text-gray-600">Fecha: <span className="font-semibold">{new Date(pedido.fecha_creacion).toLocaleString()}</span></p><p className="text-gray-600 flex items-center">Estado actual: <span className="ml-2"><EstadoBadge estado={pedido.estado}/></span></p></div>
                                    </div>
                                    <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-800">Items del Pedido</h3>{isAdmin && !isEditing && (<button onClick={() => setIsEditing(true)} className="bg-blue-100 text-blue-800 text-xs font-bold py-1 px-3 rounded-full">Editar Pedido</button>)}</div>
                                    
                                    {/* --- INICIO DE LA MODIFICACIÓN RESPONSIVE --- */}
                                    {/* Vista de Tabla para Escritorio */}
                                    <div className="hidden md:block border rounded-lg overflow-hidden mb-4">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 text-xs uppercase">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Producto</th>
                                                    <th className="px-4 py-2 text-center">Cantidad</th>
                                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                                    {isEditing && <th className="px-4 py-2 text-right"></th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {sortedEditableItems.map(item => (
                                                    <tr key={item.id || item.producto_id} className={integrityIssues.some(i => i.includes(`ID: ${item.producto_id}`)) ? 'bg-red-50' : ''}>
                                                        <td className="px-4 py-3 text-sm flex items-center">
                                                            {item.aviso_faltante && <WarningIcon className="h-4 w-4 text-yellow-500 mr-2" title="Producto sin stock al momento del pedido"/>}
                                                            {item.nombre_producto}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm">
                                                            {isEditing ? <input type="number" step="0.001" value={item.cantidad} onChange={(e) => handleQuantityChange(item.id || item.producto_id, e.target.value)} className="w-20 text-center border rounded-md"/> : item.cantidad}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold">${(item.cantidad * item.precio_congelado).toFixed(2)}</td>
                                                        {isEditing && <td className="px-4 py-3 text-right"><button onClick={() => handleRemoveItem(item.id || item.producto_id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5" /></button></td>}
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {!isEditing && (
                                                <tfoot className="bg-gray-50 font-bold">
                                                    <tr>
                                                        <td colSpan="2" className="px-4 py-2 text-right">Total:</td>
                                                        <td className="px-4 py-2 text-right">${totalPedido.toFixed(2)}</td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                    
                                    {/* Vista de Tarjetas para Móvil */}
                                    <div className="md:hidden space-y-3 mb-4">
                                        {sortedEditableItems.map(item => (
                                            <div key={item.id || item.producto_id} className={`bg-white rounded-lg border p-3 flex items-center justify-between ${integrityIssues.some(i => i.includes(`ID: ${item.producto_id}`)) ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                                                {renderItem(item)}
                                            </div>
                                        ))}
                                        {!isEditing && (
                                            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center font-bold text-gray-800">
                                                <span>Total:</span>
                                                <span>${totalPedido.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* --- FIN DE LA MODIFICACIÓN RESPONSIVE --- */}

                                    {isEditing && (
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar producto para agregar..." className="w-full p-2 border rounded-md"/>
                                                {productSearch && (
                                                    <div className="absolute bg-white border shadow-lg max-h-48 overflow-y-auto w-full left-0 z-20 rounded-b-md">
                                                        {filteredProductsToAdd.length > 0 ? (
                                                            filteredProductsToAdd.map((p) => (<div key={p.id} onClick={() => handleAddItem(p)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm">{p.nombre} <span className="text-gray-400">(${p.precio_unitario})</span></div>))
                                                        ) : (<div className="p-3 text-sm text-gray-500">No se encontraron productos.</div>)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-end gap-4">
                                                <button onClick={() => { setIsEditing(false); fetchAllData(); }} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                                                <button onClick={handleSaveChanges} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                            <h3 className="font-bold text-gray-800 mb-2">Notas Originales del Vendedor</h3>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap h-24 overflow-y-auto">{pedido.notas_entrega || 'No se dejaron notas.'}</p>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                            <h3 className="font-bold text-gray-800 mb-2">Notas para Impresión (Editable)</h3>
                                            <textarea value={notasEditables} onChange={(e) => setNotasEditables(e.target.value)} rows="3" className="w-full p-2 border rounded-md" placeholder="Añadir o editar notas para la impresión..."></textarea>
                                            <button onClick={handleGuardarNotas} disabled={guardandoNotas} className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg text-sm disabled:bg-gray-400">{guardandoNotas ? 'Guardando...' : 'Guardar Nota'}</button>
                                        </div>
                                    </div>
        
                                    {(isAdmin || isDeposito) && !isEditing && (
                                        <div className="bg-gray-50 p-4 rounded-lg mt-4">
                                            <h3 className="font-bold text-gray-800 mb-3">Actualizar Estado</h3>
                                            <select onChange={(e) => handleUpdateStatus(e.target.value)} value={pedido.estado} className="w-full p-2 border rounded-md">{Object.entries(estadosDisponibles).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {pedido && (
                        <React.Fragment>
                            <PrintableView pedido={pedido} total={totalPedido} notasParaImprimir={notasEditables} />
                            <PrintForAssemblyView pedido={pedido} />
                        </React.Fragment>
                    )}
                </React.Fragment>
            );
        };                                     
        
        const PrintableView = ({ pedido, total, notasParaImprimir }) => {
            const formatNumber = (num) => parseFloat(Number(num).toFixed(3));
            
            // --- INICIO DE LA MODIFICACIÓN ---
            const sortedItems = React.useMemo(() => {
                if (!pedido || !pedido.items) return [];
        
                const getCategoryWeight = (category) => {
                    const cat = category ? category.toLowerCase() : 'sin categoría';
                    if (cat === 'fiambreria') return 2;
                    if (cat === 'sin categoría') return 1;
                    return 0; // Todas las demás categorías
                };
        
                return [...pedido.items].sort((a, b) => {
                    const categoryA = a.categoria || 'Sin Categoría';
                    const categoryB = b.categoria || 'Sin Categoría';
        
                    const weightA = getCategoryWeight(categoryA);
                    const weightB = getCategoryWeight(categoryB);
        
                    // 1. Ordenar por peso de categoría (Fiambreria y Sin Categoría al final)
                    if (weightA !== weightB) {
                        return weightA - weightB;
                    }
        
                    // 2. Ordenar por nombre de categoría
                    if (categoryA.localeCompare(categoryB) !== 0) {
                        return categoryA.localeCompare(categoryB);
                    }
        
                    // 3. Ordenar por nombre de producto
                    return a.nombre_producto.localeCompare(b.nombre_producto);
                });
            }, [pedido]);
            // --- FIN DE LA MODIFICACIÓN ---
        
            return (
                <div id="printableArea" className="printable-area hidden font-sans text-gray-700 bg-white">
                    <div className="print-header">
                        <div className="flex justify-between items-start text-sm mb-4">
                            <div className="w-1/3"><h1 className="text-lg font-bold">Mayorista Comestibles</h1></div>
                            <div className="w-1/3 px-2 text-center"><h2 className="font-bold underline">Datos del Cliente</h2><p>{pedido.nombre_comercio}</p><p className="text-xs">{pedido.direccion}</p></div>
                            <div className="w-1/3 text-right"><p><span className="font-bold">Pedido N°:</span> {pedido.id}</p><p><span className="font-bold">Fecha:</span> {new Date(pedido.fecha_creacion).toLocaleDateString()}</p></div>
                        </div>
                        <hr className="border-gray-600 my-2"/>
                    </div>
                    <div className="print-body flex-grow py-4">
                        <table className="w-full text-left border-collapse mb-4 text-[10pt]">
                            <thead>
                                <tr>
                                    <th className="border-b-2 border-gray-600 p-1 text-center">Cant.</th>
                                    <th className="border-b-2 border-gray-600 p-1">Producto</th>
                                    <th className="border-b-2 border-gray-600 p-1 text-right">P. Unit</th>
                                    <th className="border-b-2 border-gray-600 p-1 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* --- MODIFICACIÓN: Usar la lista ordenada --- */}
                                {sortedItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="border-b border-gray-300 py-0.5 px-1 text-center font-bold">{formatNumber(item.cantidad)}</td>
                                        <td className="border-b border-gray-300 py-0.5 px-1">{item.nombre_producto} {item.aviso_faltante && <span className="font-bold">(S/STOCK)</span>}</td>
                                        <td className="border-b border-gray-300 py-0.5 px-1 text-right">${formatNumber(item.precio_congelado)}</td>
                                        <td className="border-b border-gray-300 py-0.5 px-1 text-right font-semibold">${formatNumber(item.cantidad * item.precio_congelado)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="print-footer flex gap-4 pt-4 mt-auto">
                        <table className="w-full">
                            <tfoot>
                                <tr>
                                    <td colSpan="3" className="font-bold text-right p-2 border-t-4 border-gray-600">Total:</td>
                                    <td className="font-bold text-right p-2 border-t-4 border-gray-600">${formatNumber(total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="print-footer flex gap-4 pt-4 mt-auto">
                        <div style={{ width: '80%' }}>
                            <h3 className="font-bold mb-1 text-sm">Notas:</h3>
                            <div className="border border-gray-600 h-24 p-1">{notasParaImprimir}</div>
                        </div>
                        <div style={{ width: '20%' }} className="flex flex-col justify-end">
                            <div className="border-b-2 border-gray-600 mt-12 mb-1"></div>
                            <p className="text-xs text-center">Firma de Conformidad</p>
                        </div>
                    </div>
                </div>
            );
        };
        
        const PrintForAssemblyView = ({ pedido }) => {
            const formatNumber = (num) => parseFloat(Number(num).toFixed(3));
            return (
                <div id="printableAreaAssembly" className="printable-area hidden font-sans text-gray-700 bg-white" style={{ fontSize: '10pt' }}>
                    <div className="print-header flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
                        <h1 className="text-lg font-bold">Hoja de Armado de Pedido</h1>
                        <div>
                            <p className="font-semibold">{pedido.nombre_comercio}</p>
                            <p className="text-sm">Pedido N°: <span className="font-bold">{pedido.id}</span></p>
                        </div>
                    </div>
                    <div className="print-body">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="border-b-2 border-gray-600 p-1 text-center w-16">Listo</th>
                                    <th className="border-b-2 border-gray-600 p-1 text-center w-24">Cantidad</th>
                                    <th className="border-b-2 border-gray-600 p-1 text-left">Producto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedido.items.map(item => (
                                    <tr key={item.id} className="border-b border-gray-300">
                                        <td className="p-2 text-center"><input type="checkbox" style={{ width: '20px', height: '20px' }} /></td>
                                        <td className="p-2 text-center font-bold text-lg">{formatNumber(item.cantidad)}</td>
                                        <td className="p-2">{item.nombre_producto}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        };

        

        const ImportModal = ({ onClose, onSuccess }) => {
            const [file, setFile] = React.useState(null);
            const [loading, setLoading] = React.useState(false);
            const [report, setReport] = React.useState(null);
            const [error, setError] = React.useState(null);
            const token = localStorage.getItem('token');

            const handleFileChange = (e) => {
                setFile(e.target.files[0]);
                setReport(null);
                setError(null);
            };

            const ImportVentasModal = ({ onClose }) => {
            const [file, setFile] = React.useState(null);
            const [loading, setLoading] = React.useState(false);
            const [message, setMessage] = React.useState('');
            const [error, setError] = React.useState(null);
            const token = localStorage.getItem('token');

            const handleSubmit = async (e) => {
                e.preventDefault();
                if (!file) { setError('Por favor, selecciona un archivo CSV.'); return; }
                setLoading(true); setError(null); setMessage('');

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch(`${API_URL}/import/ventas-presenciales`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData,
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Error al importar archivo.');
                    setMessage(data.message);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            return (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">Importar Ventas Presenciales (CSV)</h2><button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button></div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <p className="text-sm text-gray-600">Selecciona el archivo CSV exportado desde el sistema de ventas presencial.</p>
                            <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                             {message && <p className="p-3 bg-green-100 text-green-800 rounded-md">{message}</p>}
                             {error && <p className="p-3 bg-red-100 text-red-800 rounded-md">{error}</p>}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
                            <button type="submit" disabled={loading || !file} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-400">
                                {loading ? 'Importando...' : 'Importar Ventas'}
                            </button>
                        </div>
                    </form>
                </div>
            );
        };

            const handleSubmit = async (e) => {
                e.preventDefault();
                if (!file) {
                    setError('Por favor, selecciona un archivo CSV.');
                    return;
                }
                setLoading(true);
                setError(null);
                setReport(null);

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch(`${API_URL}/productos/import`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData,
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Error al importar archivo.');
                    
                    setReport(data);
                    onSuccess(); 

                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            return (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">Importar Productos desde CSV</h2><button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button></div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <p className="text-sm text-gray-600">Selecciona un archivo CSV. Las columnas necesarias son <b>A_COD</b> (SKU), <b>A_DET</b> (Nombre) y <b>A_PLIS1</b> (Precio).</p>
                            <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                            
                            {loading && <div className="flex items-center gap-2 text-blue-600"><Spinner className="border-blue-600"/> <p>Procesando archivo, por favor espera...</p></div>}
                            {error && <p className="p-3 bg-red-100 text-red-800 rounded-md">{error}</p>}
                            {report && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                                    <h3 className="font-bold text-lg text-gray-800">{report.message}</h3>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-2 bg-green-100 rounded-md"><p className="text-2xl font-bold text-green-800">{report.creados}</p><p className="text-sm text-green-700">Creados</p></div>
                                        <div className="p-2 bg-blue-100 rounded-md"><p className="text-2xl font-bold text-blue-800">{report.actualizados}</p><p className="text-sm text-blue-700">Actualizados</p></div>
                                        <div className="p-2 bg-yellow-100 rounded-md"><p className="text-2xl font-bold text-yellow-800">{report.filasOmitidas}</p><p className="text-sm text-yellow-700">Omitidos</p></div>
                                    </div>
                                    {report.errores && report.errores.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700">Detalle de filas omitidas:</h4>
                                            <ul className="text-xs text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
                                                {report.errores.map(e => <li key={e.fila}><b>Fila {e.fila}:</b> {e.error}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
                            <button type="submit" disabled={loading || !file} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-400">
                                {loading ? 'Importando...' : 'Importar Archivo'}
                            </button>
                        </div>
                    </form>
                </div>
            );
        };

         const ImportVentasModal = ({ onClose, onSuccess }) => {
            const [file, setFile] = React.useState(null);
            const [loading, setLoading] = React.useState(false);
            const [report, setReport] = React.useState(null);
            const [error, setError] = React.useState(null);
            const token = localStorage.getItem('token');

            const handleFileChange = (e) => {
                setFile(e.target.files[0]);
                setReport(null);
                setError(null);
            };

            const handleSubmit = async (e) => {
                e.preventDefault();
                if (!file) {
                    setError('Por favor, selecciona un archivo CSV.');
                    return;
                }
                setLoading(true);
                setError(null);
                setReport(null);

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch(`${API_URL}/import/ventas-presenciales`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData,
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Error al importar el archivo.');
                    
                    setReport(data);
                    onSuccess();

                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            return (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Importar Ventas Presenciales (CSV)</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <p className="text-sm text-gray-600">Selecciona el archivo CSV exportado desde el sistema de ventas. El sistema evitará duplicar ventas con el mismo número de comprobante.</p>
                            <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            
                            {loading && <div className="flex items-center gap-2 text-blue-600"><Spinner className="border-blue-600"/> <p>Procesando archivo, por favor espera...</p></div>}
                            {error && <p className="p-3 bg-red-100 text-red-800 rounded-md">{error}</p>}
                            {report && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                                    <h3 className="font-bold text-lg text-green-800">{report.message}</h3>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
                            <button type="submit" disabled={loading || !file} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-400">
                                {loading ? 'Importando...' : 'Importar Archivo'}
                            </button>
                        </div>
                    </form>
                </div>
            );
        };

        
        const DashboardPage = ({ user, onLogout, currentPage, setCurrentPage, onShowPedido, onShowProductoForm, onShowClienteForm, onShowImportModal, onShowUsuarioForm, onShowImportVentasModal, productos, categorias, loadingProductos, errorProductos, fetchProductos, onShowRenameModal, onShowManageModal, onShowPdfOptionsModal }) => {
            const isAdmin = user.rol === 'admin';

            const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
            
            const handleNavItemClick = (page) => {
                setCurrentPage(page);
                setIsSidebarOpen(false); // Cierra el menú al seleccionar una opción
            };
            
            const renderContent = () => {
                switch (currentPage) {
                    case 'pedidos': 
                        return <PedidosView onSelectPedido={onShowPedido} user={user} />;
                    case 'productos': 
                        return <ProductosView 
                                    user={user} 
                                    onShowProductoForm={onShowProductoForm} 
                                    onShowImportModal={onShowImportModal}
                                    productos={productos}
                                    loading={loadingProductos}
                                    error={errorProductos}
                                    onRefresh={fetchProductos}
                                    onShowPdfOptionsModal={onShowPdfOptionsModal}
                                />;
                    case 'categorias':
                        return <CategoriasView
                                    categorias={categorias}
                                    loading={loadingProductos}
                                    error={errorProductos}
                                    onRename={onShowRenameModal}
                                    onManage={onShowManageModal}
                                />;
                    case 'clientes': 
                        return <ClientesView user={user} onShowClienteForm={onShowClienteForm} />;
                    case 'usuarios': 
                        return <UsuariosView onShowUsuarioForm={onShowUsuarioForm} />;
                    case 'actividad': 
                        return <ActividadView />;
                    case 'analisis':
                        return <AnalyticsView allCategories={categorias} />;
                    // --- INICIO DE LA MODIFICACIÓN ---
                    case 'integridad':
                        return <DataIntegrityView onSelectPedido={onShowPedido} />;
                    // --- FIN DE LA MODIFICACIÓN ---
                    case 'dashboard': 
                    default:
                        return <DashboardView onShowImportVentasModal={onShowImportVentasModal} />;
                }
            };

            return (
                <div className="flex h-screen bg-gray-100 font-sans">
                    {/* Overlay para cerrar el menú en móvil */}
                    {isSidebarOpen && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        ></div>
                    )}

                    {/* Barra Lateral Adaptable */}
                    <aside className={`fixed inset-y-0 left-0 bg-gray-800 text-white flex flex-col shrink-0 w-64 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="h-20 flex items-center justify-center border-b border-gray-700">
                            <PackageIcon className="h-8 w-8 mr-2" />
                            <span className="text-xl font-bold">Distribuidora</span>
                        </div>
                        <nav className="flex-1 px-4 py-6 space-y-2">
                            <NavItem icon={<HomeIcon />} text="Dashboard" active={currentPage === 'dashboard'} onClick={() => handleNavItemClick('dashboard')} />
                            {isAdmin && <NavItem icon={<ChartBarIcon />} text="Análisis" active={currentPage === 'analisis'} onClick={() => handleNavItemClick('analisis')} />}
                            <NavItem icon={<ShoppingCartIcon />} text="Pedidos" active={currentPage === 'pedidos'} onClick={() => handleNavItemClick('pedidos')} />
                            <NavItem icon={<PackageIcon />} text="Productos" active={currentPage === 'productos'} onClick={() => handleNavItemClick('productos')} />
                            {isAdmin && <NavItem icon={<TagIcon />} text="Categorías" active={currentPage === 'categorias'} onClick={() => handleNavItemClick('categorias')} />}
                            <NavItem icon={<UsersIcon />} text="Clientes" active={currentPage === 'clientes'} onClick={() => handleNavItemClick('clientes')} />
                            {isAdmin && <NavItem icon={<UsersIcon />} text="Usuarios" active={currentPage === 'usuarios'} onClick={() => handleNavItemClick('usuarios')} />}
                            {isAdmin && <NavItem icon={<ActivityIcon />} text="Actividad" active={currentPage === 'actividad'} onClick={() => handleNavItemClick('actividad')} />}
                            {isAdmin && <NavItem icon={<ShieldWarningIcon />} text="Integridad" active={currentPage === 'integridad'} onClick={() => handleNavItemClick('integridad')} />}
                        </nav>
                        <div className="px-4 py-6 border-t border-gray-700">
                            <div className="mb-4"><p className="text-sm font-semibold">{user.nombre}</p><p className="text-xs text-gray-400 capitalize">{user.rol}</p></div>
                            <button onClick={onLogout} className="w-full flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"><LogOutIcon className="h-5 w-5 mr-2" />Cerrar Sesión</button>
                        </div>
                    </aside>
                    
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Barra Superior con Botón de Hamburguesa */}
                        <header className="md:hidden bg-white shadow-md p-4 flex justify-between items-center">
                            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                            </button>
                            <h1 className="text-lg font-bold text-gray-800 capitalize">{currentPage}</h1>
                            <div></div> {/* Espaciador */}
                        </header>
                        
                        {/* Contenido Principal */}
                        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{renderContent()}</main>
                    </div>
                </div>
            );
        };

        function App() {
            const [currentPage, setCurrentPage] = React.useState('dashboard');
            const [token, setToken] = React.useState(localStorage.getItem('token'));
            const [user, setUser] = React.useState(JSON.parse(localStorage.getItem('user')));
            const [loading, setLoading] = React.useState(false);
            const [error, setError] = React.useState(null);
            
            // --- ESTADOS DE DATOS GLOBALES ---
            const [productos, setProductos] = React.useState([]);
            const [categorias, setCategorias] = React.useState([]); // <-- NUEVO ESTADO
            const [loadingProductos, setLoadingProductos] = React.useState(true);
            const [errorProductos, setErrorProductos] = React.useState(null);
            
            const [viewingPedidoId, setViewingPedidoId] = React.useState(null);
            const [editingProducto, setEditingProducto] = React.useState(null);
            const [editingCliente, setEditingCliente] = React.useState(null);
            const [editingUsuario, setEditingUsuario] = React.useState(null);
            const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
            const [isImportVentasModalOpen, setIsImportVentasModalOpen] = React.useState(false);
            const [isPdfModalOpen, setIsPdfModalOpen] = React.useState(false);
            const [pdfLoading, setPdfLoading] = React.useState(false);
            
            // --- NUEVOS ESTADOS PARA GESTIÓN DE CATEGORÍAS ---
            const [renamingCategory, setRenamingCategory] = React.useState(null);
            const [managingCategory, setManagingCategory] = React.useState(null);
            const [categoryActionLoading, setCategoryActionLoading] = React.useState(false);
            const [categoryActionError, setCategoryActionError] = React.useState(null);

            // --- INICIO DE LA MODIFICACIÓN ---
            const fetchProductos = React.useCallback(async (includeArchived = false) => {
                if (!token) return;
                
                setLoadingProductos(true);
                setErrorProductos(null);
                
                try {
                    // Construimos la URL con el parámetro para incluir archivados si es necesario
                    const url = new URL(`${API_URL}/productos`);
                    url.searchParams.append('format', 'full');
                    if (includeArchived) {
                        url.searchParams.append('include_archived', 'true');
                    }
                    
                    const response = await fetch(url.toString(), {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (!response.ok) throw new Error('No se pudo obtener la lista de productos y categorías.');
                    
                    const data = await response.json();
                    setProductos(data.productos);
                    setCategorias(data.categorias);
                } catch (err) {
                    setErrorProductos(err.message);
                } finally {
                    setLoadingProductos(false);
                }
            }, [token]);
            // --- FIN DE LA MODIFICACIÓN ---

            React.useEffect(() => {
                if (token) {
                    fetchProductos();
                }
            }, [token, fetchProductos]);

            const handleSaveRename = async (oldName, newName) => {
                setCategoryActionLoading(true);
                setCategoryActionError(null);
                try {
                    const response = await fetch(`${API_URL}/categorias/rename`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ oldName, newName })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Error al renombrar la categoría.');
                    
                    setRenamingCategory(null);
                    fetchProductos();
                } catch (err) {
                    setCategoryActionError(err.message);
                } finally {
                    setCategoryActionLoading(false);
                }
            };

            const handleSaveCategoryProducts = async (categoryName, productIds) => {
                setCategoryActionLoading(true);
                setCategoryActionError(null);
                try {
                    const response = await fetch(`${API_URL}/categorias/manage-products`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ categoryName, productIds })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Error al guardar los productos de la categoría.');
                    
                    setManagingCategory(null);
                    fetchProductos();
                } catch (err) {
                    setCategoryActionError(err.message);
                } finally {
                    setCategoryActionLoading(false);
                }
            };

            const generatePdf = (options) => {
                setPdfLoading(true);
                const { jsPDF } = window.jspdf;
                if (!jsPDF) {
                    alert("Error: La librería jsPDF no está cargada.");
                    setPdfLoading(false);
                    return;
                }
                
                // Crear documento PDF en formato A4 (siempre vertical para ambos formatos)
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                // Constantes para márgenes y dimensiones
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 5; // Margen general reducido para aprovechar más espacio
                const contentWidth = pageWidth - (margin * 2);
                
                // 1. Filtrar productos según las opciones
                let productosFiltrados = [...productos];
                if (options.stock === 'in-stock') {
                    productosFiltrados = productosFiltrados.filter(p => p.stock === 'Sí');
                }
            
                // 2. Agrupar por categoría
                const groupedProducts = productosFiltrados.reduce((acc, product) => {
                    const category = product.categoria || 'Sin Categoría';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(product);
                    return acc;
                }, {});
            
                const sortedCategories = Object.keys(groupedProducts).sort();
            
                // 3. Diseño del PDF - Encabezado general
                // Crear un fondo para el encabezado
                doc.setFillColor(22, 160, 133); // Color verde corporativo
                doc.rect(0, 0, pageWidth, 25, 'F');
                
                // Título principal
                doc.setFontSize(22);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255); // Texto blanco sobre fondo verde
                doc.text("Lista de Precios", pageWidth / 2, 15, { align: 'center' });
                
                // Subtítulos
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(240, 240, 240); // Gris claro para los subtítulos
                doc.text(`Generado por: ${user.nombre}`, margin, 22);
                doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - margin, 22, { align: 'right' });
            
                let yPosition = 35; // Posición inicial tras el encabezado
            
                // Colores para alternar entre categorías
                const categoryColors = [
                    [26, 188, 156], // Verde turquesa
                    [41, 128, 185], // Azul
                    [142, 68, 173], // Púrpura
                    [192, 57, 43]   // Rojo
                ];
                
                if (options.format === 'catalog') {
                    // FORMATO CATÁLOGO (CUADRÍCULA) - AHORA EN VERTICAL CON MANEJO MEJORADO DE IMÁGENES
                    // Parámetros para la cuadrícula de 4x5
                    const cols = 4; // 4 columnas
                    const itemWidth = (contentWidth - ((cols-1) * 2)) / cols; // Ancho de cada celda con pequeño gap
                    const imgSize = itemWidth - 4; // Tamaño de la imagen ajustado para dejar margen
                    const itemHeight = imgSize + 20; // Alto para imagen + texto y precio
                    
                    // Crear una imagen de marcador de posición
                    const placeholderImgData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OENDRjNBN0E2NTZBMTFFMEI3QjRBODM4NzJDMjlGNDgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OENDRjNBN0I2NTZBMTFFMEI3QjRBODM4NzJDMjlGNDgiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo4Q0NGM0E3ODY1NkExMUUwQjdCNEE4Mzg3MkMyOUY0OCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo4Q0NGM0E3OTY1NkExMUUwQjdCNEE4Mzg3MkMyOUY0OCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqqezsUAAAAfSURBVHjaYmRgYJD6//8/AwMDEwMDAwMDEAMDAAMBAQB+EXF/AAAAABJRU5ErkJggg==';
                    
                    let colorIndex = 0; // Para alternar colores entre categorías
                    
                    for (const category of sortedCategories) {
                        const productsInCategory = groupedProducts[category];
                        
                        // Si la categoría no tiene productos después del filtrado, la saltamos
                        if (!productsInCategory || productsInCategory.length === 0) {
                            continue;
                        }
            
                        // Agregar una página nueva si no hay suficiente espacio
                        if (yPosition > pageHeight - 40) {
                            doc.addPage();
                            yPosition = 15;
                        }
            
                        // TÍTULO DE CATEGORÍA MEJORADO
                        const categoryColor = categoryColors[colorIndex % categoryColors.length];
                        colorIndex++;
                        
                        // Fondo de título con degradado
                        doc.setFillColor(categoryColor[0], categoryColor[1], categoryColor[2]);
                        doc.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'F');
                        
                        // Texto del título
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(14);
                        doc.text(category.toUpperCase(), pageWidth / 2, yPosition + 6.5, { align: 'center' });
                        
                        yPosition += 14;
            
                        // Dibujar productos en formato cuadrícula
                        let colIndex = 0;
                        let rowStartY = yPosition;
                        
                        for (let i = 0; i < productsInCategory.length; i++) {
                            const product = productsInCategory[i];
                            
                            // Calcular posición X,Y para la celda actual
                            const x = margin + (colIndex * (itemWidth + 1));
                            let y = rowStartY;
                            
                            // Verificar si necesitamos una nueva página
                            if (y + itemHeight > pageHeight - 10) {
                                doc.addPage();
                                y = 15; // Asignamos a la variable local 'y', no modificamos rowStartY aquí
                                rowStartY = 15; // Ahora actualizamos rowStartY para las siguientes celdas
                                colIndex = 0;
                            }
                            
                            // Dibujar fondo de celda con borde suave
                            doc.setFillColor(248, 248, 248);
                            doc.setDrawColor(220, 220, 220);
                            doc.roundedRect(x, y, itemWidth, itemHeight, 1, 1, 'FD');
                            
                            // Agregar imagen (centrada)
                            const imgX = x + (itemWidth - imgSize) / 2;
                            const imgY = y + 2;
                            
                            // Marco para la imagen
                            doc.setDrawColor(200, 200, 200);
                            doc.setFillColor(255, 255, 255);
                            doc.roundedRect(imgX, imgY, imgSize, imgSize, 1, 1, 'FD');
                            
                            // MANEJO SEGURO DE IMÁGENES - Usar imagen placeholder por defecto
                            try {
                                // Si el producto tiene una URL de imagen, intenta agregarla
                                if (product.imagen_url) {
                                    // Verificamos si la URL es CORS-friendly (mismo origen o data URL)
                                    if (product.imagen_url.startsWith('data:') || 
                                        product.imagen_url.startsWith(window.location.origin)) {
                                        doc.addImage(
                                            product.imagen_url,
                                            'JPEG',
                                            imgX,
                                            imgY,
                                            imgSize,
                                            imgSize,
                                            '',
                                            'FAST'
                                        );
                                    } else {
                                        // Si no es CORS-friendly, usamos la imagen de marcador de posición
                                        doc.addImage(
                                            placeholderImgData,
                                            'PNG',
                                            imgX,
                                            imgY,
                                            imgSize,
                                            imgSize,
                                            '',
                                            'FAST'
                                        );
                                        
                                        // Dibujar texto de producto en el centro de la imagen
                                        doc.setFontSize(8);
                                        doc.setTextColor(100, 100, 100);
                                        doc.text(product.nombre.substring(0, 10) + '...', 
                                            imgX + imgSize/2, 
                                            imgY + imgSize/2, 
                                            {align: 'center', baseline: 'middle'});
                                    }
                                } else {
                                    // Si no hay URL de imagen, también usamos el marcador de posición
                                    doc.addImage(
                                        placeholderImgData,
                                        'PNG',
                                        imgX,
                                        imgY,
                                        imgSize,
                                        imgSize,
                                        '',
                                        'FAST'
                                    );
                                    
                                    // Dibujar texto de producto en el centro de la imagen
                                    doc.setFontSize(8);
                                    doc.setTextColor(100, 100, 100);
                                    doc.text('Sin imagen', 
                                        imgX + imgSize/2, 
                                        imgY + imgSize/2, 
                                        {align: 'center', baseline: 'middle'});
                                }
                            } catch (e) {
                                console.log(`No se pudo cargar la imagen para: ${product.nombre}`, e);
                                // En caso de error, también usamos el marcador de posición
                                try {
                                    doc.addImage(
                                        placeholderImgData,
                                        'PNG',
                                        imgX,
                                        imgY,
                                        imgSize,
                                        imgSize,
                                        '',
                                        'FAST'
                                    );
                                } catch (e2) {
                                    // Si incluso esto falla, simplemente continuamos sin imagen
                                    console.error("Error crítico al manejar imágenes:", e2);
                                }
                            }
                            
                            // Fondo para el nombre (mejora legibilidad)
                            const nameBoxHeight = 12;
                            doc.setFillColor(240, 240, 240);
                            doc.roundedRect(x + 1, y + imgSize + 2, itemWidth - 2, nameBoxHeight, 1, 1, 'F');
                            
                            // Nombre del producto (centrado)
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(60, 60, 60);
                            doc.setFontSize(7);
                            
                            // Truncar nombre si es muy largo
                            let nombre = product.nombre;
                            if (nombre.length > 25) {
                                nombre = nombre.substring(0, 22) + '...';
                            }
                            
                            // Texto con fondo blanco para mejor legibilidad
                            doc.text(nombre, x + itemWidth/2, y + imgSize + 8, { 
                                align: 'center',
                                maxWidth: itemWidth - 4
                            });
                            
                            // Precio (centrado y más grande)
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(22, 160, 133);
                            doc.setFontSize(12);
                            const precio = `$${parseFloat(product.precio_unitario).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
                            doc.text(precio, x + itemWidth/2, y + imgSize + 19, { align: 'center' });
                            
                            // Avanzar a la siguiente columna o fila
                            colIndex++;
                            if (colIndex >= cols) {
                                colIndex = 0;
                                rowStartY += itemHeight + 3; // 3mm de espacio entre filas
                            }
                        }
                        
                        // Actualizar yPosition para la siguiente categoría
                        yPosition = rowStartY + 10;
                    }
                } else {
                    // FORMATO LISTA DE PRECIOS (sin cambios)
                    let colorIndex = 0;
                    
                    for (const category of sortedCategories) {
                        const productsInCategory = groupedProducts[category];
                        
                        if (!productsInCategory || productsInCategory.length === 0) {
                            continue;
                        }
            
                        if (yPosition > pageHeight - 30) {
                            doc.addPage();
                            yPosition = 15;
                        }
            
                        const categoryColor = categoryColors[colorIndex % categoryColors.length];
                        colorIndex++;
                        
                        doc.setFillColor(categoryColor[0], categoryColor[1], categoryColor[2]);
                        doc.roundedRect(margin, yPosition, contentWidth, 10, 3, 3, 'F');
                        
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(14);
                        doc.text(category.toUpperCase(), pageWidth / 2, yPosition + 6.5, { align: 'center' });
                        
                        yPosition += 14;
            
                        doc.setDrawColor(200, 200, 200);
                        doc.setLineWidth(0.3);
                        doc.line(margin, yPosition - 2, margin + contentWidth, yPosition - 2);
            
                        for (const product of productsInCategory) {
                            if (yPosition > pageHeight - 16) {
                                doc.addPage();
                                yPosition = 15;
                            }
            
                            const isEven = productsInCategory.indexOf(product) % 2 === 0;
                            doc.setFillColor(isEven ? 252 : 248, isEven ? 252 : 248, isEven ? 252 : 248);
                            doc.roundedRect(margin, yPosition, contentWidth, 15, 1, 1, 'F');
                            
                            const imageSize = 12;
                            doc.setDrawColor(200, 200, 200);
                            doc.setLineWidth(0.1);
                            doc.roundedRect(margin + 2, yPosition + 1.5, imageSize, imageSize, 1, 1, 'F');
                            
                            if (product.imagen_url) {
                                try {
                                    // Solo intentamos cargar la imagen si es del mismo origen o data URL
                                    if (product.imagen_url.startsWith('data:') || 
                                        product.imagen_url.startsWith(window.location.origin)) {
                                        doc.addImage(
                                            product.imagen_url, 
                                            'JPEG', 
                                            margin + 2, 
                                            yPosition + 1.5, 
                                            imageSize, 
                                            imageSize, 
                                            '', 
                                            'FAST'
                                        );
                                    }
                                } catch (e) {
                                    console.log(`No se pudo cargar la imagen para: ${product.nombre}`);
                                }
                            }
                            
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(60, 60, 60);
                            doc.setFontSize(9);
                            
                            const nombreY = yPosition + 7.5;
                            doc.text(product.nombre, margin + imageSize + 5, nombreY);
                            
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(22, 160, 133);
                            doc.setFontSize(11);
                            const precio = `$${parseFloat(product.precio_unitario).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
                            doc.text(precio, pageWidth - margin - 3, nombreY, { align: 'right' });
                            
                            yPosition += 16;
                        }
                        
                        yPosition += 5;
                    }
                }
                
                // 5. Agregar pie de página con numeración
                const totalPages = doc.internal.getNumberOfPages();
                
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFontSize(7);
                    doc.setTextColor(150);
                    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
                }
            
                // 6. Guardar el archivo con nombre según formato
                const fileName = options.format === 'catalog' 
                    ? `catalogo-productos-${new Date().toISOString().slice(0,10)}.pdf`
                    : `lista-de-precios-${new Date().toISOString().slice(0,10)}.pdf`;
                
                doc.save(fileName);
                setPdfLoading(false);
            };
        
            const handleLogin = React.useCallback(async (email, password) => {
                setLoading(true); setError(null);
                try {
                    const response = await fetch(`${API_URL}/auth/login`, { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ email, password }) 
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión.');
                    localStorage.setItem('token', data.token); 
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setToken(data.token); 
                    setUser(data.user);
                } catch (err) { 
                    setError(err.message); 
                } finally { 
                    setLoading(false); 
                }
            }, []);

            const handleLogout = React.useCallback(() => {
                localStorage.removeItem('token'); 
                localStorage.removeItem('user');
                setToken(null); 
                setUser(null); 
                setViewingPedidoId(null); 
                setEditingProducto(null); 
                setEditingCliente(null); 
                setEditingUsuario(null);
            }, []);
        
            const forceRerender = (page) => {
                // Si la página es de productos o categorías, refrescamos los datos.
                if (page === 'productos' || page === 'categorias' || page === 'dashboard') {
                    fetchProductos();
                }
                setCurrentPage('');
                setTimeout(() => setCurrentPage(page), 0);
            };
        
            if (!token || !user) {
                return <LoginPage onLogin={handleLogin} loading={loading} error={error} />;
            }
        
            if (user.rol !== 'admin' && user.rol !== 'deposito') {
                handleLogout();
                return <LoginPage onLogin={handleLogin} loading={false} error="No tienes permiso para acceder a este panel." />;
            }
        
            return (
                <React.Fragment>
                    <DashboardPage
                        user={user}
                        onLogout={handleLogout}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        onShowPedido={setViewingPedidoId}
                        onShowProductoForm={setEditingProducto}
                        onShowClienteForm={setEditingCliente}
                        onShowImportModal={() => setIsImportModalOpen(true)}
                        onShowUsuarioForm={setEditingUsuario}
                        onShowImportVentasModal={() => setIsImportVentasModalOpen(true)}
                        productos={productos}
                        categorias={categorias}
                        loadingProductos={loadingProductos}
                        errorProductos={errorProductos}
                        fetchProductos={fetchProductos}
                        onShowRenameModal={setRenamingCategory}
                        onShowManageModal={setManagingCategory}
                        onShowPdfOptionsModal={() => setIsPdfModalOpen(true)}
                    />
                    {viewingPedidoId && (
                        <PedidoDetailModal
                            pedidoId={viewingPedidoId}
                            onClose={() => setViewingPedidoId(null)}
                            user={user}
                            onUpdate={() => forceRerender('pedidos')}
                        />
                    )}
                    {renamingCategory && (
                        <RenameCategoryModal
                            categoryName={renamingCategory}
                            onClose={() => { setRenamingCategory(null); setCategoryActionError(null); }}
                            onSave={handleSaveRename}
                            loading={categoryActionLoading}
                            error={categoryActionError}
                        />
                    )}
                    {managingCategory && (
                        <ManageCategoryProductsModal
                            categoryName={managingCategory}
                            allProducts={productos}
                            onClose={() => { setManagingCategory(null); setCategoryActionError(null); }}
                            onSave={handleSaveCategoryProducts}
                            loading={categoryActionLoading}
                            error={categoryActionError}
                        />
                    )}
                    {editingProducto !== null && (
                        <ProductoFormModal
                            producto={editingProducto}
                            onClose={() => setEditingProducto(null)}
                            onSuccess={() => { setEditingProducto(null); fetchProductos(); }}
                            allCategories={categorias} // <-- USAR NUEVO ESTADO
                        />
                    )}
                    {editingCliente !== null && (
                        <ClienteFormModal
                            cliente={editingCliente}
                            onClose={() => setEditingCliente(null)}
                            onSuccess={() => { setEditingCliente(null); forceRerender('clientes'); }}
                        />
                    )}
                    {editingUsuario !== null && (
                        <UsuarioFormModal 
                            usuario={editingUsuario} 
                            onClose={() => setEditingUsuario(null)} 
                            onSuccess={() => { setEditingUsuario(null); forceRerender('usuarios'); }} 
                        />
                    )}
                    {isImportModalOpen && (
                        <ImportModal
                            onClose={() => setIsImportModalOpen(false)}
                            onSuccess={() => forceRerender('productos')}
                        />
                    )}
                    {isImportVentasModalOpen && (
                        <ImportVentasModal 
                            onClose={() => { setIsImportVentasModalOpen(false); forceRerender('dashboard'); }} 
                        />
                    )}
                    {isPdfModalOpen && (
                        <PdfOptionsModal
                            onClose={() => setIsPdfModalOpen(false)}
                            onGenerate={(options) => {
                                setIsPdfModalOpen(false);
                                generatePdf(options);
                            }}
                            loading={pdfLoading}
                        />
                    )}
                </React.Fragment>
            );
        }