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
            await fetch(`${API_URL}/usuarios/${confirmDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            setConfirmDelete(null);
            fetchUsers();
        } catch (err) {
            alert("Error al eliminar el usuario.");
            setConfirmDelete(null);
        }
    };

    return (
        <div>
            {confirmDelete && (
                <PasswordConfirmModal
                    title={`¿Eliminar a ${confirmDelete.nombre}?`}
                    message="Esta acción es irreversible. Todos los datos asociados a este usuario se perderán."
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
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th><th className="relative px-6 py-3"></th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 font-medium">{user.nombre}</td>
                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                <td className="px-6 py-4 text-gray-600 capitalize">{user.rol}</td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button onClick={() => onShowUsuarioForm(user)} className="text-blue-600 hover:text-blue-900">Editar</button>
                                    <button onClick={() => setConfirmDelete(user)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};