const ConfiguracionZonasView = () => {
    const [semana, setSemana] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [editando, setEditando] = React.useState(null);
    const [zonasTemp, setZonasTemp] = React.useState("");
    const [error, setError] = React.useState(null);
    
    // Modal de Repetir Patrón
    const [showModal, setShowModal] = React.useState(false);
    const [weeksToRepeat, setWeeksToRepeat] = React.useState(1);

    const token = localStorage.getItem('token');
    
    // Configurar fechas de la semana actual (Lunes a Domingo)
    const [fechaBase, setFechaBase] = React.useState(new Date());

    const getFechasSemana = (base) => {
        const fechas = [];
        const d = new Date(base);
        const day = d.getDay(); // 0 = Domingo, 1 = Lunes, etc.
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar al lunes
        const lunes = new Date(d.setDate(diff));
        
        for (let i = 0; i < 7; i++) {
            const f = new Date(lunes);
            f.setDate(lunes.getDate() + i);
            fechas.push(f.toISOString().split('T')[0]);
        }
        return fechas;
    };

    const cargarSemana = async () => {
        setLoading(true);
        setError(null);
        try {
            const fechas = getFechasSemana(fechaBase);
            const res = await fetch(`${API_URL}/config/cronograma?startDate=${fechas[0]}&endDate=${fechas[6]}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar configuración de zonas');
            const data = await res.json();
            
            // Mapear datos a los días de la semana
            const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            const semanaData = fechas.map((fecha, i) => {
                const registro = data.find(d => d.fecha.startsWith(fecha));
                return {
                    fecha,
                    diaSemana: diasNombres[i],
                    zonas: registro ? registro.zonas : ''
                };
            });
            setSemana(semanaData);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        cargarSemana();
    }, [fechaBase]);

    const guardarDia = async (fecha, zonas) => {
        try {
            const res = await fetch(`${API_URL}/config/cronograma`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fecha, zonas })
            });
            if (!res.ok) throw new Error('Error al guardar zonas');
            setEditando(null);
            cargarSemana();
        } catch (e) {
            setError(e.message);
        }
    };

    const repetirPatron = async () => {
        try {
            const fechas = getFechasSemana(fechaBase);
            const res = await fetch(`${API_URL}/config/cronograma/repetir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    patternStartDate: fechas[0],
                    patternEndDate: fechas[6],
                    weeksToRepeat: parseInt(weeksToRepeat)
                })
            });
            if (!res.ok) throw new Error('Error al repetir patrón');
            alert('Patrón aplicado exitosamente');
            setShowModal(false);
        } catch (e) {
            setError(e.message);
            alert('Error: ' + e.message);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Cronograma de Zonas de Entrega</h1>
                    <p className="text-sm text-gray-500">Planifica qué días se entrega en qué zonas (Visible para Vendedores)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition">
                    🔄 Repetir esta semana
                </button>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <button onClick={() => { const d = new Date(fechaBase); d.setDate(d.getDate() - 7); setFechaBase(d); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold transition">
                    &larr; Semana Anterior
                </button>
                <div className="font-bold text-gray-700">
                    Semana del {semana.length > 0 ? new Date(semana[0].fecha + 'T00:00:00').toLocaleDateString('es-AR') : ''} al {semana.length > 0 ? new Date(semana[6].fecha + 'T00:00:00').toLocaleDateString('es-AR') : ''}
                </div>
                <button onClick={() => { const d = new Date(fechaBase); d.setDate(d.getDate() + 7); setFechaBase(d); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold transition">
                    Semana Siguiente &rarr;
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12"><Spinner className="w-10 h-10 border-blue-500" /></div>
            ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 w-1/4">Día</th>
                                <th className="px-6 py-3">Zonas / Localidades</th>
                                <th className="px-6 py-3 w-32 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {semana.map(dia => (
                                <tr key={dia.fecha} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{dia.diaSemana}</div>
                                        <div className="text-xs text-gray-500">{new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editando === dia.fecha ? (
                                            <input 
                                                type="text" 
                                                value={zonasTemp} 
                                                onChange={e => setZonasTemp(e.target.value)}
                                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                placeholder="Ej: Lules, San Pablo (vacío = Ninguno)"
                                                autoFocus
                                                onKeyDown={e => { if(e.key === 'Enter') guardarDia(dia.fecha, zonasTemp); }}
                                            />
                                        ) : (
                                            <span className={dia.zonas ? 'font-semibold text-gray-700' : 'text-gray-400 italic'}>
                                                {dia.zonas || 'Ninguno'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editando === dia.fecha ? (
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => guardarDia(dia.fecha, zonasTemp)} className="text-green-600 hover:text-green-800 font-bold p-1">Guardar</button>
                                                <button onClick={() => setEditando(null)} className="text-gray-500 hover:text-gray-700 font-bold p-1">Cancelar</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setZonasTemp(dia.zonas); setEditando(dia.fecha); }} className="text-blue-600 hover:text-blue-800 font-bold p-1">
                                                Editar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal para Repetir Patrón */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Repetir Patrón Semanal</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Se copiará la configuración de zonas de <strong>esta semana</strong> hacia adelante de forma automática.
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">¿Cuántas semanas hacia adelante deseas repetir esto?</label>
                            <input 
                                type="number" 
                                min="1" max="12" 
                                value={weeksToRepeat} 
                                onChange={e => setWeeksToRepeat(e.target.value)}
                                className="w-full border p-2 rounded-lg" 
                            />
                            <p className="text-xs text-gray-500 mt-2">Recomendado: 4 semanas (1 mes) para no llenar la base de datos innecesariamente.</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-semibold transition">Cancelar</button>
                            <button onClick={repetirPatron} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">Aplicar Patrón</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
