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
    const [confirmDelete, setConfirmDelete] = React.useState(null);
    const token = localStorage.getItem('token');

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } });
            setUsers(await response.json());
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleDelete = async () => {
        try {
            const res = await fetch(`${API_URL}/usuarios/${confirmDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Error al desactivar.');
            setConfirmDelete(null);
            fetchUsers();
        } catch (err) {
            alert(err.message || "Error al desactivar el usuario.");
            setConfirmDelete(null);
        }
    };

    const handleRestore = async (usuarioId) => {
        if (!window.confirm("¿Seguro que quieres reactivar este usuario?")) return;
        try {
            const res = await fetch(`${API_URL}/usuarios/${usuarioId}/restore`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Error al reactivar.');
            fetchUsers();
        } catch (err) {
            alert(err.message || "Error al reactivar el usuario.");
        }
    };

    return (
        <div>
            {confirmDelete && (
                <PasswordConfirmModal
                    title={`¿Desactivar a ${confirmDelete.nombre}?`}
                    message="El usuario no podrá acceder al sistema, pero sus registros de ventas se mantendrán."
                    onConfirm={handleDelete}
                    onClose={() => setConfirmDelete(null)}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <button onClick={() => onShowUsuarioForm({})} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"><UserPlusIcon className="h-5 w-5 mr-2" /> Agregar Usuario</button>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th><th className="relative px-6 py-3"></th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 font-medium">{user.nombre}</td>
                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                <td className="px-6 py-4 text-gray-600 capitalize">{user.rol}</td>
                                <td className="px-6 py-4">
                                    {user.activo === false ? (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactivo</span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Activo</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button onClick={() => onShowUsuarioForm(user)} className="text-blue-600 hover:text-blue-900">Editar</button>
                                    {user.activo === false ? (
                                        <button onClick={() => handleRestore(user.id)} className="text-green-600 hover:text-green-900">Activar</button>
                                    ) : (
                                        <button onClick={() => setConfirmDelete(user)} className="text-red-600 hover:text-red-900">Desactivar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};