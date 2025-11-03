/**
 * @file Contiene la vista para el diagnóstico y corrección de la integridad de los datos.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Contiene la lógica para encontrar y corregir items de pedidos huérfanos.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const ReportModal = ({ report, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md text-center p-6">
            <h2 className="text-2xl font-bold text-green-600 mb-4">¡Corrección Completada!</h2>
            <p className="text-gray-700 mb-2">{report.message}</p>
            <div className="text-5xl font-bold text-green-500 my-4">{report.updatedCount}</div>
            <p className="text-sm text-gray-500 mb-6">Items re-vinculados exitosamente.</p>
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">Entendido</button>
        </div>
    </div>
);

const CollapsibleSection = ({ title, count, color, children }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const colors = {
        green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
        red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' }
    };
    const c = colors[color] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800' };

    return (
        <div className={`border ${c.border} rounded-xl overflow-hidden`}>
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex justify-between items-center p-4 ${c.bg} hover:opacity-90`}>
                <div className="flex items-center">
                    <h3 className={`font-bold text-lg ${c.text}`}>{title}</h3>
                    <span className={`ml-3 px-2.5 py-0.5 rounded-full text-sm font-semibold ${c.bg.replace('50', '100')} ${c.text}`}>{count}</span>
                </div>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && <div className="p-4 bg-white">{children}</div>}
        </div>
    );
};

const DataIntegrityView = ({ onSelectPedido }) => {
    const [analysis, setAnalysis] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [fixing, setFixing] = React.useState(false);
    const [fixReport, setFixReport] = React.useState(null);
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const token = localStorage.getItem('token');

    const fetchAnalysis = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const response = await fetch(`${API_URL}/diagnostics/orphaned-items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'No se pudo obtener el reporte de integridad.');
            }
            setAnalysis(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    const handleExecuteFix = async () => {
        setShowConfirmModal(false);
        setFixing(true);
        setError(null);
        setFixReport(null);
        try {
            const response = await fetch(`${API_URL}/diagnostics/fix-orphans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ candidates: analysis.automaticFixCandidates })
            });
            const reportData = await response.json();
            if (!response.ok) throw new Error(reportData.message || 'Ocurrió un error durante la corrección.');
            setFixReport(reportData);
            fetchAnalysis(); // Recargar análisis después de la corrección
        } catch (err) {
            setError(err.message);
        } finally {
            setFixing(false);
        }
    };
    
    const totalIssues = analysis ? (analysis.automaticFixCandidates.length + analysis.manualFixCandidates.length + analysis.needsIntervention.length) : 0;

    return (
        <div className="space-y-6">
            {showConfirmModal && (
                <PasswordConfirmModal
                    title="Confirmar Corrección Automática"
                    message={`Estás a punto de re-vincular automáticamente ${analysis?.automaticFixCandidates.length || 0} items de pedidos. Esta acción es segura y se basa en la coincidencia de SKU. ¿Deseas continuar?`}
                    onConfirm={handleExecuteFix}
                    onClose={() => setShowConfirmModal(false)}
                    loading={fixing}
                />
            )}
            {fixReport && <ReportModal report={fixReport} onClose={() => setFixReport(null)} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Diagnóstico y Corrección de Integridad</h1>
                    <p className="text-gray-500 mt-2">Analiza y repara items de pedidos cuyos productos han sido eliminados o modificados.</p>
                </div>
                <button onClick={fetchAnalysis} disabled={loading || fixing} className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg flex items-center disabled:opacity-50">
                    {loading || fixing ? <Spinner className="border-blue-500 mr-2"/> : '🔄'} Refrescar Análisis
                </button>
            </div>

            {loading && <div className="p-8 flex justify-center items-center gap-3"><Spinner className="border-blue-500 h-12 w-12"/> <span className="text-gray-600 text-lg">Analizando integridad...</span></div>}
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            {analysis && (
                <>
                    {totalIssues === 0 && !loading ? (
                        <div className="p-8 text-center bg-white rounded-xl shadow-lg">
                            <h3 className="text-2xl font-bold text-green-600">✅ ¡Todo en orden!</h3>
                            <p className="text-gray-600 mt-2">No se encontraron items de pedidos huérfanos. La integridad de los datos es correcta.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {analysis.automaticFixCandidates.length > 0 && (
                                <CollapsibleSection title="Correcciones Automáticas Sugeridas (Alta Confianza)" count={analysis.automaticFixCandidates.length} color="green">
                                    <p className="text-sm text-gray-600 mb-4">Estos items tienen un SKU que coincide con un único producto activo. Se pueden corregir automáticamente con seguridad.</p>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead><tr className="text-left text-gray-500"><th className="p-2">Producto Huérfano</th><th className="p-2">Nuevo Producto Sugerido</th></tr></thead>
                                            <tbody>{analysis.automaticFixCandidates.slice(0, 10).map(item => (
                                                <tr key={item.pedido_item_id} className="border-t">
                                                    <td className="p-2">{item.nombre_producto_huerfano}</td>
                                                    <td className="p-2 font-semibold text-green-700">{item.nombre_producto_nuevo}</td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                        {analysis.automaticFixCandidates.length > 10 && <p className="text-xs text-gray-500 mt-2">...y {analysis.automaticFixCandidates.length - 10} más.</p>}
                                    </div>
                                </CollapsibleSection>
                            )}

                            {analysis.manualFixCandidates.length > 0 && (
                                <CollapsibleSection title="Sugerencias por Coincidencia de Nombre (Confianza Media)" count={analysis.manualFixCandidates.length} color="blue">
                                    <p className="text-sm text-gray-600 mb-4">Estos items no coincidieron por SKU, pero su nombre coincide con un único producto activo. La corrección manual para estos casos se implementará en el futuro.</p>
                                    <ul className="list-disc list-inside text-sm text-gray-700">{analysis.manualFixCandidates.slice(0, 10).map(item => (<li key={item.pedido_item_id}>"{item.nombre_producto}" en pedido de <b>{item.nombre_comercio}</b>.</li>))}</ul>
                                    {analysis.manualFixCandidates.length > 10 && <p className="text-xs text-gray-500 mt-2">...y {analysis.manualFixCandidates.length - 10} más.</p>}
                                </CollapsibleSection>
                            )}

                            {analysis.needsIntervention.length > 0 && (
                                <CollapsibleSection title="Requieren Intervención Manual (Baja Confianza)" count={analysis.needsIntervention.length} color="red">
                                    <p className="text-sm text-gray-600 mb-4">Estos items son ambiguos (ej: múltiples productos con el mismo nombre) o no tienen ninguna coincidencia clara. Requerirán una herramienta de asignación manual.</p>
                                    <ul className="list-disc list-inside text-sm text-gray-700">{analysis.needsIntervention.slice(0, 10).map(item => (<li key={item.pedido_item_id}>"{item.nombre_producto}" en pedido de <b>{item.nombre_comercio}</b> (Razón: {item.reason}).</li>))}</ul>
                                    {analysis.needsIntervention.length > 10 && <p className="text-xs text-gray-500 mt-2">...y {analysis.needsIntervention.length - 10} más.</p>}
                                </CollapsibleSection>
                            )}
                        </div>
                    )}

                    {analysis.automaticFixCandidates.length > 0 && (
                        <div className="mt-6 p-6 bg-white rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-center md:text-left">
                                <h3 className="text-xl font-bold">¡Acción Requerida!</h3>
                                <p className="text-gray-600">Hemos encontrado {analysis.automaticFixCandidates.length} problemas que se pueden solucionar ahora.</p>
                            </div>
                            <button onClick={() => setShowConfirmModal(true)} disabled={fixing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center disabled:bg-gray-400">
                                {fixing ? <><Spinner className="mr-3"/> Corrigiendo...</> : 'Ejecutar Corrección Automática'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};