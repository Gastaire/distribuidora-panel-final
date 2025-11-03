/**
 * @file Contiene componentes de modales reutilizables.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo contiene componentes de UI de tipo modal.
 *   Es invocado desde vistas como PedidosView, ProductosView, etc.
 *
 * El componente se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const PasswordConfirmModal = ({ title, message, onConfirm, onClose, loading }) => {
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const token = localStorage.getItem('token');

    const handleConfirm = async () => {
        setError('');
        if (!password) {
            setError('La contraseña es requerida.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/auth/reauthenticate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Contraseña incorrecta.');
            onConfirm();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <p className="text-gray-600 mt-2">{message}</p>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Confirma tu contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end items-center gap-4 rounded-b-xl">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={handleConfirm} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">{loading ? 'Confirmando...' : 'Confirmar'}</button>
                </div>
            </div>
        </div>
    );
};