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
    const [formData, setFormData] = React.useState({ 
        nombre_comercio: '', nombre_contacto: '', direccion: '', telefono: '', 
        vendedor_id: '', vendedor_nombre: '', latitud: '', longitud: '', 
        horario_atencion: '', horario_entrega: '' 
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [vendedores, setVendedores] = React.useState([]);
    const token = localStorage.getItem('token');
    const isEditing = cliente && cliente.id;

    React.useEffect(() => { 
        if (isEditing) { 
            setFormData({ 
                nombre_comercio: cliente.nombre_comercio || '', 
                nombre_contacto: cliente.nombre_contacto || '', 
                direccion: cliente.direccion || '', 
                telefono: cliente.telefono || '', 
                vendedor_id: cliente.vendedor_id || '', 
                vendedor_nombre: cliente.vendedor_nombre || '',
                latitud: cliente.latitud ?? '',
                longitud: cliente.longitud ?? '',
                horario_atencion: cliente.horario_atencion || '',
                horario_entrega: cliente.horario_entrega || cliente.horario_recepcion || ''
            }); 
        } else {
            setFormData({ 
                nombre_comercio: '', nombre_contacto: '', direccion: '', telefono: '', 
                vendedor_id: '', vendedor_nombre: '', latitud: '', longitud: '', 
                horario_atencion: '', horario_entrega: '' 
            });
        }
    }, [cliente, isEditing]);

    React.useEffect(() => {
        const fetchVendedores = async () => {
            try {
                const res = await fetch(`${API_URL}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setVendedores(data.filter(u => u.rol === 'vendedor' && u.activo !== false));
                }
            } catch (e) { console.error("Error fetching vendedores", e); }
        };
        fetchVendedores();
    }, [token]);

    const handleChange = (e) => { 
        const { name, value } = e.target;
        if (name === 'vendedor_id') {
            const vendedor = vendedores.find(v => v.id == value);
            setFormData(prev => ({ ...prev, vendedor_id: value, vendedor_nombre: vendedor ? vendedor.nombre : '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value })); 
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const latitud = String(formData.latitud ?? '').trim().replace(',', '.');
        const longitud = String(formData.longitud ?? '').trim().replace(',', '.');
        if ((latitud || longitud) && (!latitud || !longitud || !Number.isFinite(Number(latitud)) || !Number.isFinite(Number(longitud))
            || Math.abs(Number(latitud)) > 90 || Math.abs(Number(longitud)) > 180)) {
            setError('Ingresá latitud y longitud válidas, o dejá ambas vacías.');
            return;
        }
        setLoading(true);
        setError(null);
        const url = isEditing ? `${API_URL}/clientes/${cliente.id}` : `${API_URL}/clientes`;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ ...formData, latitud, longitud }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al guardar el cliente.');
            onSuccess();
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    const mapCoordinate = (value, limit) => {
        const text = String(value ?? '').trim().replace(',', '.');
        const number = Number(text);
        return text && Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
    };

    return (
        <DialogFrame onClose={onClose} busy={loading} label="Cliente">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Cliente' : 'Agregar Cliente'}</h2><button type="button" aria-label="Cerrar formulario" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button></div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label htmlFor="nombre_comercio" className="block text-sm font-medium text-gray-700">Nombre del Comercio</label><input type="text" name="nombre_comercio" id="nombre_comercio" value={formData.nombre_comercio} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required /></div>
                        <div><label htmlFor="nombre_contacto" className="block text-sm font-medium text-gray-700">Nombre del Contacto</label><input type="text" name="nombre_contacto" id="nombre_contacto" value={formData.nombre_contacto} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                        <div><label htmlFor="direccion" className="block text-sm font-medium text-gray-700">Detalles / Referencias</label><input type="text" name="direccion" id="direccion" value={formData.direccion} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                        <div><label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label><input type="text" name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                    </div>
                    <div className="border-t pt-4">
                        <p className="block text-sm font-medium text-gray-700 mb-2">Ubicación GPS</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <label className="text-sm">Latitud <input className="w-full border rounded p-2" inputMode="decimal" name="latitud" value={formData.latitud} onChange={handleChange} /></label>
                            <label className="text-sm">Longitud <input className="w-full border rounded p-2" inputMode="decimal" name="longitud" value={formData.longitud} onChange={handleChange} /></label>
                        </div>
                        <LocationPicker 
                            lat={mapCoordinate(formData.latitud, 90)}
                            lng={mapCoordinate(formData.longitud, 180)}
                            onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitud: lat, longitud: lng }))}
                        />
                    </div>
                    <div className="border-t pt-4 space-y-4">
                        <HorariosPicker 
                            label="Horario de Atención" 
                            hint="Seleccione los días y el rango de horas."
                            value={formData.horario_atencion}
                            onChange={(val) => setFormData(prev => ({ ...prev, horario_atencion: val }))}
                        />
                        <HorariosPicker 
                            label="Horario de Recepción de Pedidos" 
                            hint="Opcional. Solo si difiere del horario de atención."
                            value={formData.horario_entrega}
                            onChange={(val) => setFormData(prev => ({ ...prev, horario_entrega: val }))}
                        />
                    </div>
                    <div className="border-t pt-4">
                        <label htmlFor="vendedor_id" className="block text-sm font-medium text-gray-700">Vendedor Asignado</label>
                        <select name="vendedor_id" id="vendedor_id" value={formData.vendedor_id} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white">
                            <option value="">-- Seleccionar Vendedor --</option>
                            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                        </select>
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">{error && <p className="text-red-500 text-sm">{error}</p>}<button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">{loading ? 'Guardando...' : 'Guardar Cliente'}</button></div>
            </form>
        </DialogFrame>
    );
};
