/**
 * @file Contiene el modal con el formulario para crear o editar usuarios.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es un componente de formulario.
 *   Utiliza componentes de UI como CloseIcon. Es invocado desde `App` y `UsuariosView`.
 *
 * El componente se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const UsuarioFormModal = ({ usuario, onClose, onSuccess }) => {
    const [formData, setFormData] = React.useState({ nombre: '', email: '', password: '', rol: 'vendedor' });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const token = localStorage.getItem('token');
    const isEditing = usuario && usuario.id;

    React.useEffect(() => {
        if (isEditing) {
            setFormData({
                nombre: usuario.nombre || '',
                email: usuario.email || '',
                password: '',
                rol: usuario.rol || 'vendedor'
            });
        } else {
            setFormData({ nombre: '', email: '', password: '', rol: 'vendedor' });
        }
    }, [usuario, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const url = isEditing ? `${API_URL}/usuarios/${usuario.id}` : `${API_URL}/usuarios`;
        const method = isEditing ? 'PUT' : 'POST';
        
        const body = { ...formData };
        if (body.password === '') {
            delete body.password;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al guardar el usuario.');
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Usuario' : 'Agregar Usuario'}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder={isEditing ? "Dejar en blanco para no cambiar" : ""} />
                    </div>
                     <div>
                        <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
                        <select name="rol" id="rol" value={formData.rol} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                            <option value="vendedor">Vendedor</option>
                            <option value="deposito">Depósito</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">{loading ? 'Guardando...' : 'Guardar Usuario'}</button>
                </div>
            </form>
        </div>
    );
};