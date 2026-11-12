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
        

        const PdfOptionsModal = ({ onClose, onGenerate, loading, error }) => {
            const [options, setOptions] = React.useState({
                format: 'price-list', // Valores posibles: 'price-list', 'catalog'
                stock: 'in-stock',
                withPrices: true,
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
                <DialogFrame onClose={onClose} busy={loading} label="Generar lista">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Generar lista</h2>
                            <button type="button" disabled={loading} onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">1. Elige el formato</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <OptionButton 
                                        label="Lista de precios"
                                        description="Un listado compacto, organizado por categorías. Ideal para imprimir."
                                        value="price-list"
                                        type="format"
                                        selectedValue={options.format}
                                        onSelect={handleOptionChange}
                                    />
                                    <OptionButton 
                                        label="Revista de precios"
                                        description="Una sección por categoría, fotos disponibles y precios destacados."
                                        value="catalog"
                                        type="format"
                                        selectedValue={options.format}
                                        onSelect={handleOptionChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-4"><input type="checkbox" checked={options.withPrices} onChange={event => handleOptionChange('withPrices', event.target.checked)} /> Incluir precios (validez de 48 horas). Sin precios deja espacio para etiquetas.</label>
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
                        {error && <p role="alert" className="px-4 pb-2 text-red-700">{error}</p>}
                        <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">
                            <button type="button" disabled={loading} onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button type="button" onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                                {loading ? <><Spinner className="mr-2"/>Generando...</> : 'Generar lista'}
                            </button>
                        </div>
                    </div>
                </DialogFrame>
            );
        };

        const LogsModal = ({ logs, pedidoId, onClose }) => {
            return (
                <DialogFrame onClose={onClose} busy={false} label="Historial del pedido" layer={60}>
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
                </DialogFrame>
            );
        };

        
            const PedidoDetailModal = ({ pedidoId, onClose, user, onUpdate }) => {
            const [pedido, setPedido] = React.useState(null);
            const [loading, setLoading] = React.useState(true);
            const [error, setError] = React.useState(null);
            const [isEditing, setIsEditing] = React.useState(false);
            const [pricePassword, setPricePassword] = React.useState('');
            const [confirmPrices, setConfirmPrices] = React.useState(false);
            const [orderClients, setOrderClients] = React.useState([]);
            const [selectedOrderClient, setSelectedOrderClient] = React.useState('');
            const [clientLoadError, setClientLoadError] = React.useState('');
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
                    setSelectedOrderClient(String(pedidoData.cliente_id));
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
                const itemsToSave = editableItems.map(item => ({ producto_id: item.producto_id, cantidad: item.cantidad, ...(pricePassword ? { precio_congelado: item.precio_congelado } : {}) })).filter(item => item.cantidad > 0);
                try {
                    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/items`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ items: itemsToSave, ...(pricePassword ? { password: pricePassword, ...(selectedOrderClient !== String(pedido.cliente_id) ? {cliente_id: Number(selectedOrderClient)} : {}) } : {}) }) });
                    if (!response.ok) throw new Error((await response.json()).message || 'Error al guardar los cambios.');
                    setPricePassword('');
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
                    <DialogFrame onClose={onClose} busy={loading || guardandoNotas} label="Detalle del pedido">
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
                                    <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-800">Items del Pedido</h3>{isAdmin && !isEditing && (<button onClick={() => { setPricePassword(''); setIsEditing(true); }} className="bg-blue-100 text-blue-800 text-xs font-bold py-1 px-3 rounded-full">Editar Pedido</button>)}</div>
                                    
                                    {isAdmin && isEditing && !pricePassword && <button className="border rounded px-3 py-2 mb-3" onClick={() => setConfirmPrices(true)}>Editar precios</button>}
                                    {confirmPrices && <PasswordConfirmModal title="Autorizar precios y cliente" message="Confirmá tu contraseña para editar los precios o el cliente de este pedido." onClose={() => setConfirmPrices(false)} onConfirm={async password => {
                                        setPricePassword(password); setConfirmPrices(false); setClientLoadError('');
                                        try {
                                            const response = await fetch(`${API_URL}/clientes`, {headers:{Authorization:`Bearer ${token}`}});
                                            if (!response.ok) throw new Error('No se pudieron cargar los clientes. Cerrá la edición y volvé a intentar.');
                                            setOrderClients(await response.json());
                                        } catch (err) {setClientLoadError(err.message);}
                                    }} />}
                                    {isEditing && pricePassword && <div className="border rounded p-3 mb-3"><label className="block font-semibold" htmlFor="order-client">Cliente del pedido</label><select id="order-client" className="border rounded p-2 w-full" value={selectedOrderClient} onChange={e => setSelectedOrderClient(e.target.value)}>
                                        {!orderClients.some(c => String(c.id) === String(pedido.cliente_id)) && <option value={pedido.cliente_id}>{pedido.nombre_comercio || 'Cliente actual'}</option>}
                                        {orderClients.map(c => <option key={c.id} value={c.id}>{c.nombre_comercio} · #{c.id}</option>)}
                                    </select><p className="text-sm text-gray-500">Se conserva el vendedor original. El cambio queda registrado en el historial.</p>{clientLoadError && <p role="alert" className="text-red-700">{clientLoadError}</p>}</div>}
                                    {isEditing && pricePassword && <div className="border rounded p-3 mb-3 space-y-2"><p>Precios particulares de este pedido</p>{editableItems.map(item => <label key={item.producto_id} className="flex justify-between gap-3"><span>{item.nombre_producto}</span><input aria-label={`Precio de ${item.nombre_producto}`} className="border rounded w-28 p-1" type="number" min="0" step="0.01" value={item.precio_congelado} onChange={event => { const value = event.target.value; setEditableItems(rows => rows.map(row => row.producto_id === item.producto_id ? {...row, precio_congelado: value} : row)); }} /></label>)}</div>}
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
                                                <button onClick={() => { setIsEditing(false); setPricePassword(''); fetchAllData(); }} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
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
                                            <select onChange={(e) => handleUpdateStatus(e.target.value)} value={pedido.estado} className="w-full p-2 border rounded-md">{!estadosDisponibles[pedido.estado] && <option value={pedido.estado} disabled>{pedido.estado.replace(/_/g, " ")}</option>}{Object.entries(estadosDisponibles).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogFrame>
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
                            <div className="w-1/3 px-2 text-center"><p className="text-xs">Vendedor: {pedido.nombre_vendedor || "Sin vendedor registrado"}</p><h2 className="font-bold underline">Datos del Cliente</h2><p>{pedido.nombre_comercio}</p><p className="text-xs">{pedido.direccion}</p></div>
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
                 <DialogFrame onClose={onClose} busy={loading} label="Importar productos">
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
                </DialogFrame>
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
                 <DialogFrame onClose={onClose} busy={loading} label="Importar ventas presenciales">
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
                </DialogFrame>
            );
        };

        
        const DashboardPage = ({ user, onLogout, currentPage, setCurrentPage, onShowPedido, onShowProductoForm, onShowClienteForm, onShowImportModal, onShowUsuarioForm, onShowImportVentasModal, productos, categorias, loadingProductos, errorProductos, fetchProductos, onShowRenameModal, onShowManageModal, onShowPdfOptionsModal }) => {
            const isAdmin = user.rol === 'admin';

            const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
            const [isAdminOpen, setIsAdminOpen] = React.useState(
                ['usuarios', 'actividad'].includes(currentPage)
            );
            
            const handleNavItemClick = (page) => {
                setCurrentPage(page);
                setIsSidebarOpen(false);
            };
            
            const renderContent = () => {
                switch (currentPage) {
                    case 'rescates':
                        return isAdmin ? <RescatesView onSelectPedido={onShowPedido} /> : null;
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
                                    categorias={categorias}
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
                    case 'integridad':
                        return <DataIntegrityView onSelectPedido={onShowPedido} />;
                    case 'reportes':
                        return <ReportesView onSelectPedido={onShowPedido} />;
                    case 'mapa':
                        return isAdmin ? <MapaView /> : null;
                    case 'zonas':
                        return <ConfiguracionZonasView />;
                    case 'dashboard': 
                    default:
                        return <DashboardView onShowImportVentasModal={onShowImportVentasModal} onNavigate={handleNavItemClick} />;
                }
            };

            return (
                <div className="admin-shell flex h-screen bg-gray-100 font-sans">
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
                            <div><span className="text-xl font-bold">DistriMaxi</span><p className="brand-caption">ADMINISTRACIÓN</p></div>
                        </div>
                        <nav aria-label="Navegación principal" className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                            <p className="nav-caption">ESPACIO DE TRABAJO</p>
                            <NavItem icon={<HomeIcon />} text="Resumen" active={currentPage === 'dashboard'} onClick={() => handleNavItemClick('dashboard')} />
                            <NavItem icon={<ShoppingCartIcon />} text="Pedidos" active={currentPage === 'pedidos'} onClick={() => handleNavItemClick('pedidos')} />
                            {isAdmin && <NavItem icon={<ActivityIcon />} text="Pedidos rescatados" active={currentPage === 'rescates'} onClick={() => handleNavItemClick('rescates')} />}
                            {isAdmin && <NavItem icon={<ChartBarIcon />} text="Reportes" active={currentPage === 'reportes'} onClick={() => handleNavItemClick('reportes')} />}
                            <NavItem icon={<PackageIcon />} text="Productos" active={currentPage === 'productos'} onClick={() => handleNavItemClick('productos')} />
                            {isAdmin && <NavItem icon={<TagIcon />} text="Categorías" active={currentPage === 'categorias'} onClick={() => handleNavItemClick('categorias')} />}
                            <NavItem icon={<UsersIcon />} text="Clientes" active={currentPage === 'clientes'} onClick={() => handleNavItemClick('clientes')} />
                            {isAdmin && <NavItem icon={<MapPinIcon />} text="Mapa y reparto" active={currentPage === 'mapa'} onClick={() => handleNavItemClick('mapa')} />}
                            {isAdmin && <NavItem icon={<MapPinIcon />} text="Zonas" active={currentPage === 'zonas'} onClick={() => handleNavItemClick('zonas')} />}

                            {/* Grupo Administración colapsable — solo admin */}
                            {isAdmin && (
                                <div>
                                    <button
                                        aria-expanded={isAdminOpen}
                                        onClick={() => setIsAdminOpen(o => !o)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2 ${
                                            ['usuarios','actividad'].includes(currentPage)
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ShieldWarningIcon className="h-5 w-5" />
                                            Administración
                                        </span>
                                        <svg className={`h-4 w-4 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {isAdminOpen && (
                                        <div className="ml-4 mt-1 space-y-1 border-l border-gray-600 pl-2">
                                            <NavItem icon={<UsersIcon />} text="Usuarios" active={currentPage === 'usuarios'} onClick={() => handleNavItemClick('usuarios')} />
                                            <NavItem icon={<ActivityIcon />} text="Actividad" active={currentPage === 'actividad'} onClick={() => handleNavItemClick('actividad')} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </nav>
                        <div className="px-4 py-6 border-t border-gray-700">
                            <div className="mb-4"><p className="text-sm font-semibold">{user.nombre}</p><p className="text-xs text-gray-400 capitalize">{user.rol}</p></div>
                            <button onClick={onLogout} className="w-full flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"><LogOutIcon className="h-5 w-5 mr-2" />Cerrar Sesión</button>
                        </div>
                    </aside>
                    
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Barra Superior con Botón de Hamburguesa */}
                        <header className="admin-topbar bg-white p-4 flex justify-between items-center">
                            <button aria-label="Abrir navegación" onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                            </button>
                            <p className="text-sm text-gray-500">Administración <span className="mx-2 text-gray-300">/</span><span className="font-semibold text-gray-800">{{ mapa: 'Mapa y reparto', dashboard: 'Resumen', pedidos: 'Pedidos', reportes: 'Reportes', productos: 'Productos', categorias: 'Categorías', clientes: 'Clientes', zonas: 'Zonas', usuarios: 'Usuarios', actividad: 'Actividad', integridad: 'Integridad' }[currentPage] || currentPage}</span></p>
                            <span className="hidden sm:block text-xs text-gray-500">{user.nombre} · <span className="capitalize">{user.rol}</span></span>
                        </header>
                        
                        {/* Contenido Principal */}
                        <main id="contenido" className="admin-content flex-1 p-4 md:p-8 overflow-y-auto">{renderContent()}</main>
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
            const [pdfError, setPdfError] = React.useState('');
            const [pdfLoading, setPdfLoading] = React.useState(false);
            
            // --- NUEVOS ESTADOS PARA GESTIÓN DE CATEGORÍAS ---
            const [renamingCategory, setRenamingCategory] = React.useState(null);
            const [managingCategory, setManagingCategory] = React.useState(null);
            const [categoryActionLoading, setCategoryActionLoading] = React.useState(false);
            const [categoryActionError, setCategoryActionError] = React.useState(null);

            // --- INICIO DE LA MODIFICACIÓN ---
            const fetchProductos = React.useCallback(async (includeArchived = false) => {
                if (!token) return;
                
                const scroller = document.getElementById('contenido');
                const scrollTop = scroller?.scrollTop || 0;
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
                    requestAnimationFrame(() => { if (scroller?.isConnected) scroller.scrollTop = scrollTop; });
                }
            }, [token]);
            // --- FIN DE LA MODIFICACIÓN ---

            React.useEffect(() => {
                if (token && currentPage === 'categorias') fetchProductos();
            }, [token, currentPage, fetchProductos]);

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

            const generatePdf = async (options) => {
                setPdfLoading(true);
                setPdfError('');
                try {
                    await generatePriceDocument({ products: productos, options });
                    setIsPdfModalOpen(false);
                } catch(error) {
                    setPdfError(error.message);
                }
                finally { setPdfLoading(false); }
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
                        onShowPdfOptionsModal={() => { setPdfError(''); setIsPdfModalOpen(true); }}
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
                            onGenerate={generatePdf}
                            error={pdfError}
                            loading={pdfLoading}
                        />
                    )}
                </React.Fragment>
            );
        }