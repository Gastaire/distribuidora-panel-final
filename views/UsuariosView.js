/**
 * @file Contiene la vista de gestión de usuarios.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes de UI como PasswordConfirmModal y UserPlusIcon, y hace llamadas a la API.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const UsuariosView = ({ onShowUsuarioForm }) => {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(null);
    const token = localStorage.getItem('token');

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json().catch(() => null);
            if (!response.ok || !Array.isArray(data)) throw new Error(data?.message || 'No se pudieron cargar los usuarios.');
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const cambiarEstado = async (usuario, restaurar) => {
        setSaving(true);
        setError('');
        try {
            const suffix = restaurar ? '/restore' : '';
            const response = await fetch(`${API_URL}/usuarios/${usuario.id}${suffix}`, {
                method: restaurar ? 'PUT' : 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'No se pudo cambiar el estado del usuario.');
            }
            fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
            setConfirmDelete(null);
        }
    };

    return (
        <div>
            {confirmDelete && (
                <PasswordConfirmModal
                    title={`¿Desactivar a ${confirmDelete.nombre}?`}
                    message="El usuario dejará de ingresar y sus clientes asignados quedarán disponibles para reasignar."
                    onConfirm={() => cambiarEstado(confirmDelete, false)} loading={saving}
                    onClose={() => setConfirmDelete(null)}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <button onClick={() => onShowUsuarioForm({})} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"><UserPlusIcon className="h-5 w-5 mr-2" /> Agregar Usuario</button>
            </div>
            {error && <p role="alert" className="p-3 bg-red-50 text-red-800 rounded-lg mb-4">{error}</p>}
            {loading && <p role="status" className="text-sm text-gray-500 mb-4">Cargando usuarios…</p>}
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th><th className="relative px-6 py-3"></th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 font-medium">{user.nombre}</td>
                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                <td className="px-6 py-4 text-gray-600 capitalize">{user.rol} · {user.activo === false ? 'Inactivo' : 'Activo'}</td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button onClick={() => onShowUsuarioForm(user)} className="text-blue-600 hover:text-blue-900">Editar</button>
                                    {user.activo === false
                                        ? <button disabled={saving} onClick={() => cambiarEstado(user, true)} className="text-green-700">Reactivar</button>
                                        : <button disabled={saving} onClick={() => setConfirmDelete(user)} className="text-red-600">Desactivar</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};