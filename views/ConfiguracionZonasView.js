/**
 * @file Vista de Cronograma de Zonas de Entrega - Estilo Google Calendar
 * 
 * Permite al administrador configurar qué zonas/localidades se atienden cada día.
 * Interfaz tipo calendario mensual con creación de eventos y repetición semanal/bisemanal.
 */

const ConfiguracionZonasView = () => {
    const token = localStorage.getItem('token');

    // Estado del mes visible
    const [mesActual, setMesActual] = React.useState(() => {
        const hoy = new Date();
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    });
    const [cronograma, setCronograma] = React.useState({});
    const [saving, setSaving] = React.useState(false);
    const loadVersion = React.useRef(0);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [successMsg, setSuccessMsg] = React.useState(null);

    // Modal de crear/editar evento
    const [modalEvento, setModalEvento] = React.useState(null); // { fecha, zonas }
    const [zonaInput, setZonaInput] = React.useState('');
    const [repetir, setRepetir] = React.useState('ninguno'); // 'ninguno' | 'semanal' | 'bisemanal'
    const [repetirSemanas, setRepetirSemanas] = React.useState(4);

    // Helpers de fecha
    const formatFecha = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getNombreMes = (date) => {
        return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    };

    const getNombreDia = (date) => {
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return dias[date.getDay()];
    };

    const getNombreDiaLargo = (date) => {
        return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const esHoy = (fechaStr) => {
        return fechaStr === formatFecha(new Date());
    };

    // Generar grilla del mes
    const getDiasDelMes = () => {
        const year = mesActual.getFullYear();
        const month = mesActual.getMonth();
        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);
        
        const dias = [];
        
        // Días vacíos al inicio (la semana empieza en Lunes)
        let diaInicio = primerDia.getDay();
        diaInicio = diaInicio === 0 ? 6 : diaInicio - 1; // Ajustar: Lunes=0
        for (let i = 0; i < diaInicio; i++) {
            dias.push(null);
        }
        
        // Días del mes
        for (let d = 1; d <= ultimoDia.getDate(); d++) {
            dias.push(new Date(year, month, d));
        }
        
        return dias;
    };

    // Cargar datos del mes
    const cargarMes = async () => {
        const version = ++loadVersion.current;
        setLoading(true);
        setError(null);
        try {
            const startDate = formatFecha(mesActual);
            const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
            const endDate = formatFecha(ultimoDia);
            
            const res = await fetch(`${API_URL}/config/cronograma?startDate=${startDate}&endDate=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar cronograma');
            const data = await res.json();
            
            const mapa = {};
            data.forEach(item => {
                const key = item.fecha.split('T')[0];
                mapa[key] = item.zonas;
            });
            if (version === loadVersion.current) setCronograma(mapa);
        } catch (e) {
            if (version === loadVersion.current) setError(e.message);
        } finally {
            if (version === loadVersion.current) setLoading(false);
        }
    };

    React.useEffect(() => {
        cargarMes();
        return () => { loadVersion.current++; };
    }, [mesActual]);

    // Abrir modal al clickear un día
    const abrirModalDia = (fecha) => {
        const fechaStr = formatFecha(fecha);
        setModalEvento({ fecha, fechaStr });
        setZonaInput(cronograma[fechaStr] || '');
        setRepetir('ninguno');
        setRepetirSemanas(4);
    };

    // Guardar evento
    const guardarEvento = async () => {
        if (saving) return;
        if (!zonaInput.trim()) { setError('Ingresá al menos una zona. Para quitarla usá Eliminar zona.'); return; }
        if (repetir !== 'ninguno' && (!Number.isInteger(Number(repetirSemanas)) || Number(repetirSemanas)<1 || Number(repetirSemanas)>52)) { setError('Elegí entre 1 y 52 repeticiones.'); return; }
        setSaving(true);
        try {
            setError(null);
            
            const fechas = [modalEvento.fechaStr];
            if (repetir !== 'ninguno') {
                const incremento = repetir === 'semanal' ? 7 : 14;
                for (let i = 1; i <= Number(repetirSemanas); i++) {
                    const fecha = new Date(modalEvento.fecha);
                    fecha.setDate(fecha.getDate() + incremento * i);
                    fechas.push(formatFecha(fecha));
                }
            }
            const enLote = fechas.length > 1;
            const response = await fetch(`${API_URL}/config/cronograma${enLote ? '/lote' : ''}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(enLote ? { fechas, zonas: zonaInput.trim() } : { fecha: fechas[0], zonas: zonaInput.trim() })
            });
            if (!response.ok) {
                const result = await response.json().catch(() => null);
                throw new Error(result?.message || 'No se pudo guardar el cronograma.');
            }

            setModalEvento(null);
            setSuccessMsg(fechas.length > 1 ? `${fechas.length} días programados` : 'Día programado');
            setTimeout(() => setSuccessMsg(null), 2500);
            cargarMes();
        } catch (e) {
            setError(e.message);
        } finally { setSaving(false); }
    };

    // Borrar evento de un día
    const borrarEvento = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/config/cronograma`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fecha: modalEvento.fechaStr, zonas: '' })
            });
            if (!response.ok) throw new Error('No se pudo eliminar la zona.');
            setModalEvento(null);
            cargarMes();
        } catch (e) {
            setError(e.message);
        } finally { setSaving(false); }
    };

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const diasDelMes = getDiasDelMes();

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Zonas de Entrega</h1>
                <p className="text-sm text-gray-500">Hacé clic en un día para asignar o editar las zonas de entrega.</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{successMsg}</div>}

            {/* Navegación del mes */}
            <div className="flex items-center justify-between bg-white p-3 rounded-t-xl border border-b-0">
                <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-lg font-semibold text-gray-800 capitalize">{getNombreMes(mesActual)}</h2>
                <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {!loading && Object.keys(cronograma).some(fecha => cronograma[fecha]) && (
                <div className="workspace-toolbar mb-4">
                    <h2 className="font-bold mb-2">Agenda del mes</h2>
                    <ul className="divide-y">{Object.entries(cronograma).filter(([, zonas]) => zonas).sort(([a], [b]) => a.localeCompare(b)).map(([fecha, zonas]) => (
                        <li key={fecha} className="py-2 flex gap-3 items-center text-sm">
                            <time dateTime={fecha} className="font-semibold min-w-[110px]">{new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {day:'numeric', month:'short', weekday:'short'})}</time>
                            <span>{zonas}</span>
                            {fecha >= formatFecha(new Date()) && <button className="ml-auto text-teal-700" onClick={() => abrirModalDia(new Date(fecha + 'T12:00:00'))}>Editar</button>}
                        </li>
                    ))}</ul>
                </div>
            )}
            {/* Calendario */}
            <div className="bg-white border rounded-b-xl shadow-sm overflow-hidden">
                {/* Encabezados de días */}
                <div className="grid grid-cols-7 border-b bg-gray-50">
                    {diasSemana.map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-gray-500 uppercase py-2">{d}</div>
                    ))}
                </div>

                {/* Grilla de días */}
                {loading ? (
                    <div className="flex justify-center py-20"><Spinner className="border-blue-500" /></div>
                ) : (
                    <div className="grid grid-cols-7">
                        {diasDelMes.map((dia, i) => {
                            if (!dia) return <div key={`empty-${i}`} className="min-h-[90px] border-b border-r bg-gray-50"></div>;

                            const fechaStr = formatFecha(dia);
                            const zona = cronograma[fechaStr];
                            const hoy = esHoy(fechaStr);
                            const esPasado = dia < new Date(new Date().setHours(0,0,0,0));

                            return (
                                <div 
                                    key={fechaStr} role="button" tabIndex={esPasado ? -1 : 0} aria-disabled={esPasado} aria-label={`Programar ${fechaStr}`}
                                    onKeyDown={e=>{ if(!esPasado && (e.key==='Enter' || e.key===' ')){e.preventDefault();abrirModalDia(dia);} }}
                                    onClick={() => !esPasado && abrirModalDia(dia)}
                                    className={`min-h-[90px] border-b border-r p-1.5 transition ${esPasado ? 'opacity-40 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-blue-50'} ${hoy ? 'bg-blue-50' : ''}`}
                                >
                                    <div className={`text-xs font-medium mb-1 ${hoy ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                                        {dia.getDate()}
                                    </div>
                                    {zona && (
                                        <div className="bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded truncate" title={zona}>
                                            📍 {zona}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Evento */}
            {modalEvento && (
                <DialogFrame label="Programar zonas de entrega" busy={saving} onClose={()=>setModalEvento(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800 capitalize">{getNombreDiaLargo(modalEvento.fecha)}</h2>
                            <button onClick={() => setModalEvento(null)} className="text-gray-400 hover:text-gray-600">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="p-4 space-y-4 overflow-y-auto">{error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
                            {/* Zonas predefinidas como chips */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Zona / Localidad</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {DELIVERY_ZONES.map(zona => {
                                        const activa = zonaInput.split(',').map(z => z.trim()).includes(zona);
                                        return (
                                            <button
                                                key={zona}
                                                onClick={() => {
                                                    const zonas = zonaInput ? zonaInput.split(',').map(z => z.trim()).filter(Boolean) : [];
                                                    if (activa) {
                                                        setZonaInput(zonas.filter(z => z !== zona).join(', '));
                                                    } else {
                                                        zonas.push(zona);
                                                        setZonaInput(zonas.join(', '));
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${activa ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'}`}
                                            >
                                                {activa ? '✓ ' : ''}{zona}
                                            </button>
                                        );
                                    })}
                                </div>
                                <input
                                    type="text"
                                    value={zonaInput}
                                    onChange={e => setZonaInput(e.target.value)}
                                    placeholder="Seleccioná arriba o escribí otro destino"
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    onKeyDown={e => { if (e.key === 'Enter') guardarEvento(); }}
                                />
                            </div>

                            {/* Repetición */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Repetir</label>
                                <select 
                                    value={repetir} 
                                    onChange={e => setRepetir(e.target.value)}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                >
                                    <option value="ninguno">No repetir</option>
                                    <option value="semanal">Todas las semanas</option>
                                    <option value="bisemanal">Semanas de por medio</option>
                                </select>
                            </div>

                            {/* Cantidad de repeticiones */}
                            {repetir !== 'ninguno' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Durante cuántas {repetir === 'semanal' ? 'semanas' : 'repeticiones'}?</label>
                                    <input
                                        type="number"
                                        min="1" max="24"
                                        value={repetirSemanas}
                                        onChange={e => setRepetirSemanas(e.target.value)}
                                        className="w-full border rounded-lg p-2.5"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {repetir === 'semanal' 
                                            ? `Se aplicará todos los ${getNombreDia(modalEvento.fecha)} por ${repetirSemanas} semanas.`
                                            : `Se aplicará cada 2 semanas (${repetirSemanas} veces).`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-xl">
                            <div>
                                {cronograma[modalEvento.fechaStr] && (
                                    <button disabled={saving} onClick={borrarEvento} className="text-red-500 hover:text-red-700 text-sm font-medium">
                                        Eliminar zona
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setModalEvento(null)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium transition">
                                    Cancelar
                                </button>
                                <button disabled={saving} onClick={guardarEvento} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </DialogFrame>
            )}
        </div>
    );
};
