/**
 * HorariosPicker component for Admin Panel
 */
const HorariosPicker = ({ label, hint, value, onChange }) => {
    // value es un string JSON que representa un array de objetos, o string vacío
    // Ejemplo de array subyacente: [{ dias: [1, 2, 3], inicio: '08:00', fin: '13:00' }]
    const [horarios, setHorarios] = React.useState([]);
    const [nuevoDias, setNuevoDias] = React.useState([]);
    const [nuevoInicio, setNuevoInicio] = React.useState('');
    const [nuevoFin, setNuevoFin] = React.useState('');

    const diasSemana = [
        { id: 1, label: 'L' },
        { id: 2, label: 'M' },
        { id: 3, label: 'X' },
        { id: 4, label: 'J' },
        { id: 5, label: 'V' },
        { id: 6, label: 'S' },
        { id: 0, label: 'D' },
    ];

    React.useEffect(() => {
        if (value) {
            try {
                setHorarios(JSON.parse(value));
            } catch (e) {
                setHorarios([]);
            }
        } else {
            setHorarios([]);
        }
    }, [value]);

    const toggleDiaNuevo = (diaId) => {
        setNuevoDias(prev => 
            prev.includes(diaId) ? prev.filter(d => d !== diaId) : [...prev, diaId].sort()
        );
    };

    const handleAgregar = () => {
        if (nuevoDias.length === 0 || !nuevoInicio || !nuevoFin) return;
        const newHorarios = [...horarios, { dias: nuevoDias, inicio: nuevoInicio, fin: nuevoFin }];
        setHorarios(newHorarios);
        onChange(JSON.stringify(newHorarios));
        setNuevoDias([]);
        setNuevoInicio('');
        setNuevoFin('');
    };

    const handleEliminar = (index) => {
        const newHorarios = horarios.filter((_, i) => i !== index);
        setHorarios(newHorarios);
        onChange(newHorarios.length > 0 ? JSON.stringify(newHorarios) : '');
    };

    const formatDias = (diasArr) => {
        return diasArr.map(d => diasSemana.find(ds => ds.id === d)?.label).join(', ');
    };

    return (
        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700">{label}</label>
            {hint && <p className="text-xs text-gray-500 mb-3">{hint}</p>}
            
            {/* Lista de horarios existentes */}
            {horarios.length > 0 && (
                <div className="space-y-2 mb-4">
                    {horarios.map((h, i) => (
                        <div key={i} className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded shadow-sm text-sm">
                            <div>
                                <span className="font-bold text-blue-600">{formatDias(h.dias)}</span>
                                <span className="text-gray-600 ml-2">{h.inicio} - {h.fin} hs</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => handleEliminar(i)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Selector para agregar nuevo horario */}
            <div className="bg-white border border-gray-300 p-3 rounded text-sm">
                <p className="font-medium text-gray-700 mb-2">Nuevo rango horario</p>
                <div className="flex gap-1 mb-3">
                    {diasSemana.map(dia => (
                        <button
                            key={dia.id}
                            type="button"
                            onClick={() => toggleDiaNuevo(dia.id)}
                            className={`flex-1 py-1 rounded border font-medium ${nuevoDias.includes(dia.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
                        >
                            {dia.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 items-center">
                    <input 
                        type="time" 
                        value={nuevoInicio} 
                        onChange={(e) => setNuevoInicio(e.target.value)}
                        className="flex-1 border border-gray-300 rounded p-1.5"
                    />
                    <span className="text-gray-500">a</span>
                    <input 
                        type="time" 
                        value={nuevoFin} 
                        onChange={(e) => setNuevoFin(e.target.value)}
                        className="flex-1 border border-gray-300 rounded p-1.5"
                    />
                    <button 
                        type="button"
                        onClick={handleAgregar}
                        disabled={nuevoDias.length === 0 || !nuevoInicio || !nuevoFin}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded disabled:bg-blue-300 font-bold"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};
