/**
 * @file Contiene el modal con el formulario para crear o editar productos.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es un componente de formulario.
 *   Utiliza componentes de UI como CloseIcon y CategoryCombobox. Es invocado desde `App` y `ProductosView`.
 *
 * El componente se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const ProductoFormModal = ({ producto, onClose, onSuccess, allCategories }) => {
    // --- INICIO DE LA MODIFICACIÓN: Añadir nuevos campos de stock al estado ---
    const [formData, setFormData] = React.useState({ 
        codigo_sku: '', 
        nombre: '', 
        descripcion: '', 
        precio_unitario: '', 
        stock: 'Sí', 
        imagen_url: '', 
        categoria: '',
        controla_stock: false,
        stock_cantidad: 0
    });
    // --- FIN DE LA MODIFICACIÓN ---

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const token = localStorage.getItem('token');
    const isEditing = producto && producto.id;

    React.useEffect(() => { 
        if (isEditing) { 
            // --- INICIO DE LA MODIFICACIÓN: Cargar los nuevos campos al editar ---
            setFormData({ 
                codigo_sku: producto.codigo_sku || '', 
                nombre: producto.nombre || '', 
                descripcion: producto.descripcion || '', 
                precio_unitario: producto.precio_unitario || '', 
                stock: producto.stock || 'Sí', 
                imagen_url: producto.imagen_url || '', 
                categoria: producto.categoria || '',
                controla_stock: producto.controla_stock || false,
                stock_cantidad: producto.stock_cantidad || 0
            }); 
            // --- FIN DE LA MODIFICACIÓN ---
        } else {
            // --- INICIO DE LA MODIFICACIÓN: Estado inicial para nuevos productos ---
            setFormData({ 
                codigo_sku: '', 
                nombre: '', 
                descripcion: '', 
                precio_unitario: '', 
                stock: 'Sí', 
                imagen_url: '', 
                categoria: '',
                controla_stock: false,
                stock_cantidad: 0
            });
            // --- FIN DE LA MODIFICACIÓN ---
        }
    }, [producto, isEditing]);

    const handleChange = (e) => { 
        const { name, value, type, checked } = e.target; 
        // --- INICIO DE LA MODIFICACIÓN: Manejar el interruptor (checkbox) ---
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value })); 
        }
        // --- FIN DE LA MODIFICACIÓN ---
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        const url = isEditing ? `${API_URL}/productos/${producto.id}` : `${API_URL}/productos`;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            // --- INICIO DE LA MODIFICACIÓN: Asegurar que todos los campos se envíen correctamente ---
            const body = { 
                ...formData, 
                categoria: formData.categoria || '',
                stock_cantidad: formData.controla_stock ? parseFloat(formData.stock_cantidad) : 0,
                stock: formData.controla_stock ? (parseFloat(formData.stock_cantidad) > 0 ? 'Sí' : 'No') : formData.stock
            };
            // --- FIN DE LA MODIFICACIÓN ---
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al guardar el producto.');
            onSuccess();
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
     return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Producto' : 'Agregar Producto'}</h2><button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button></div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div><label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Producto</label><input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required /></div>
                    <div><label htmlFor="imagen_url" className="block text-sm font-medium text-gray-700">URL de la Imagen</label><input type="text" name="imagen_url" id="imagen_url" value={formData.imagen_url} onChange={handleChange} placeholder="https://ejemplo.com/imagen.jpg" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                    
                    {/* --- INICIO DE LA MODIFICACIÓN: Nuevo bloque de gestión de stock --- */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="controla_stock" className="font-medium text-gray-700">Controlar stock numéricamente</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="controla_stock" name="controla_stock" checked={formData.controla_stock} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {formData.controla_stock ? (
                            <div>
                                <label htmlFor="stock_cantidad" className="block text-sm font-medium text-gray-700">Cantidad en Stock</label>
                                <input type="number" step="0.001" name="stock_cantidad" id="stock_cantidad" value={formData.stock_cantidad} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="Ej: 150 o 12.500" />
                                <p className="text-xs text-gray-500 mt-1">Usa punto (.) para decimales. Ej: para 5kg y medio, escribe 5.5</p>
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Disponibilidad</label>
                                <select name="stock" id="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                                    <option>Sí</option>
                                    <option>No</option>
                                </select>
                            </div>
                        )}
                    </div>
                    {/* --- FIN DE LA MODIFICACIÓN --- */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="precio_unitario" className="block text-sm font-medium text-gray-700">Precio</label><input type="number" name="precio_unitario" id="precio_unitario" value={formData.precio_unitario} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required /></div>
                        <div><label htmlFor="codigo_sku" className="block text-sm font-medium text-gray-700">SKU (Código Interno)</label><input type="text" name="codigo_sku" id="codigo_sku" value={formData.codigo_sku} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                    </div>
                    <div className="grid grid-cols-1">
                        <CategoryCombobox 
                            value={formData.categoria}
                            onChange={handleChange}
                            suggestions={allCategories}
                        />
                    </div>
                    <div><label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label><textarea name="descripcion" id="descripcion" rows="3" value={formData.descripcion} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea></div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">{error && <p className="text-red-500 text-sm">{error}</p>}<button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">{loading ? 'Guardando...' : 'Guardar Producto'}</button></div>
            </form>
        </div>
    );
};