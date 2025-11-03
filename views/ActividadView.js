/**
 * @file Contiene la vista del registro de actividad.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes de UI como Spinner y hace llamadas a la API.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App` que se cargue después.
 */

const ActividadView = () => {
    const [logs, setLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const token = localStorage.getItem('token');
    React.useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch(`${API_URL}/logs`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('No se pudo obtener el registro de actividad.');
                setLogs(await response.json());
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchLogs();
    }, [token]);
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Registro de Actividad</h1>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {loading ? <p className="p-4">Cargando...</p> : (
                    <ul className="divide-y divide-gray-200">
                        {logs.map(log => (
                            <li key={log.id} className="p-4">
                                <p><span className="font-bold">{log.nombre_usuario}</span> {log.accion.toLowerCase().replace(/_/g, ' ')}</p>
                                <p className="text-sm text-gray-600">{log.detalle}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(log.fecha_creacion).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};