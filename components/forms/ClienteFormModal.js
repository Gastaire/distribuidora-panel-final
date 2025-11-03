/**
 * @file Contiene el modal con el formulario para crear o editar clientes.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es un componente de formulario.
 *   Utiliza componentes de UI como CloseIcon. Es invocado desde `App` y `ClientesView`.
 *
 * El componente se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const ClienteFormModal = ({ cliente, onClose, onSuccess }) => {
    const [formData, setFormData] = React.useState({ nombre_comercio: '', nombre_contacto: '', direccion: '', telefono: '' });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const token = localStorage.getItem('token');
    const isEditing = cliente && cliente.id;

    React.useEffect(() => { 
        if (isEditing) { 
            setFormData({ nombre_comercio: cliente.nombre_comercio || '', nombre_contacto: cliente.nombre_contacto || '', direccion: cliente.direccion || '', telefono: cliente.telefono || '' }); 
        } else {
            setFormData({ nombre_comercio: '', nombre_contacto: '', direccion: '', telefono: '' });
        }
    }, [cliente, isEditing]);

    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        const url = isEditing ? `${API_URL}/clientes/${cliente.id}` : `${API_URL}/clientes`;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al guardar el cliente.');
            onSuccess();
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Cliente' : 'Agregar Cliente'}</h2><button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button></div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div><label htmlFor="nombre_comercio" className="block text-sm font-medium text-gray-700">Nombre del Comercio</label><input type="text" name="nombre_comercio" id="nombre_comercio" value={formData.nombre_comercio} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required /></div>
                    <div><label htmlFor="nombre_contacto" className="block text-sm font-medium text-gray-700">Nombre del Contacto</label><input type="text" name="nombre_contacto" id="nombre_contacto" value={formData.nombre_contacto} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                    <div><label htmlFor="direccion" className="block text-sm font-medium text-gray-700">Dirección</label><input type="text" name="direccion" id="direccion" value={formData.direccion} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                    <div><label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label><input type="text" name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">{error && <p className="text-red-500 text-sm">{error}</p>}<button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">{loading ? 'Guardando...' : 'Guardar Cliente'}</button></div>
            </form>
        </div>
    );
};