const DeliveryMap = ({ rows, plan, origin }) => {
    const element = React.useRef(null);
    React.useEffect(() => {
        if (!window.L || !element.current) return;
        const map = L.map(element.current, {zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([-26.927315885, -65.33431335], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
        const bounds = [];
        const add = (point, text, color) => {
            const label = document.createElement('span');
            label.textContent = text;
            L.circleMarker(point, {radius:8,color,fillOpacity:0.8}).bindPopup(label).addTo(map);
            bounds.push(point);
        };
        if (plan) plan.stops.forEach((stop,index) => add(stop.point, `${index + 1}. ${stop.orders[0].nombre_comercio} · ${deliveryClock(stop.arrival)}${stop.late ? ' · Llegada después del cierre' : ''}`, stop.late ? '#b45309' : '#0f766e'));
        else rows.forEach(row => { const point = deliveryCoordinate(row); if (point) add(point, `${row.nombre_comercio || 'Cliente'} · ${row.direccion || ''}`, '#1e40af'); });
        if (origin) add(origin, 'Depósito / salida', '#9333ea');
        if (plan) L.geoJSON(plan.route.geometry, {style:{color:'#0f766e',weight:4}}).addTo(map);
        if (bounds.length) map.fitBounds(bounds, {padding:[25,25],maxZoom:16});
        let active = true;
        const resize = new ResizeObserver(() => { if (active) map.invalidateSize({animate:false}); });
        resize.observe(element.current);
        return () => {active = false;resize.disconnect();map.stop();map.remove();};
    }, [rows, plan, origin]);
    return <div>{!window.L && <p role="alert">No se pudo cargar el mapa. Recargá el panel.</p>}<div ref={element} style={{height:440,zIndex:0}} className="rounded-xl border" /></div>;
};
const DeliveryPlanner = ({orders}) => {
    const [lat, setLat] = React.useState('-26.927315885017734');
    const [lng, setLng] = React.useState('-65.33431334986939');
    const [roundTrip, setRoundTrip] = React.useState(false);
    const [minutes, setMinutes] = React.useState(5);
    const [plan, setPlan] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');
    const [printed, setPrinted] = React.useState(null);
    const version = React.useRef(0);
    React.useEffect(() => {version.current++;setPlan(null);}, [orders,lat,lng,roundTrip,minutes]);
    React.useEffect(() => () => {version.current++;}, []);
    const origin = React.useMemo(() => deliveryCoordinate({latitud:lat,longitud:lng}), [lat,lng]);
    const calculate = async () => {
        if (!origin || !Number.isFinite(Number(minutes)) || Number(minutes) < 0 || Number(minutes) > 120) {setError('Revisá las coordenadas de salida y los minutos por parada (0 a 120).');return;}
        const request = ++version.current;
        setBusy(true);setError('');setPlan(null);
        try {
            const result = await planDelivery(orders, origin, roundTrip, Number(minutes));
            if (request === version.current) setPlan(result);
        } catch (err) {if (request === version.current) setError(err.message);}
        finally {setBusy(false);}
    };
    const print = async usePlan => {
        // Recalculate for the actual print time so active opening windows stay current.
        const request = ++version.current;
        setBusy(true);setError('');
        try {
            const result = usePlan ? await planDelivery(orders, origin, roundTrip, Number(minutes)) : null;
            if (request !== version.current) return;
            if (result) setPlan(result);
            setPrinted({orders:result ? result.orders : orders, summary:result ? `Orden sugerido por calles · ${deliveryClock(result.departure)} · ${result.missing.length} pedidos sin GPS al final. Verificar horarios de llegada.` : 'Orden original por zona y cliente.'});
        } catch (err) {setError(err.message);}
        finally {setBusy(false);}
    };
    React.useEffect(() => {
        if (!printed) return;
        const timer = setTimeout(() => {
            const area = document.getElementById('printableHojaRuta');
            if (area) {area.style.display='block';window.print();area.style.display='none';}
            setPrinted(null);
        }, 100);
        return () => clearTimeout(timer);
    }, [printed]);
    return <section className="space-y-4">
        <h2 className="text-xl font-bold">Planificar hoja de ruta</h2>
        <p className="text-sm text-gray-600">{orders.length} pedidos facturados en las últimas 6 horas. Salida ahora desde el depósito. Recorrido sugerido en automóvil, sin tráfico en vivo.</p>
        <div className="flex flex-wrap gap-3 items-end">
            <label>Latitud de salida<input disabled={busy} className="block border rounded p-2 w-44" value={lat} onChange={e=>setLat(e.target.value)} /></label>
            <label>Longitud de salida<input disabled={busy} className="block border rounded p-2 w-44" value={lng} onChange={e=>setLng(e.target.value)} /></label>
            <label>Minutos por parada<input disabled={busy} type="number" min="0" max="120" className="block border rounded p-2 w-24" value={minutes} onChange={e=>setMinutes(e.target.value)} /></label>
            <label><input disabled={busy} type="checkbox" checked={roundTrip} onChange={e=>setRoundTrip(e.target.checked)} /> Volver al depósito</label>
            <button disabled={busy || !orders.length} className="bg-teal-700 text-white rounded px-4 py-2" onClick={calculate}>{busy ? 'Calculando…' : 'Calcular recorrido'}</button>
        </div>
        <p className="text-xs text-gray-500">Se priorizan cierres de horarios vigentes al salir. Horarios ausentes, texto no interpretable o fuera del horario actual se ignoran. El cálculo comparte coordenadas con el servicio público OSRM de FOSSGIS. Máximo 40 paradas.</p>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <DeliveryMap rows={orders} plan={plan} origin={origin} />
        {plan && <div className="workspace-toolbar"><strong>{(plan.route.distance / 1000).toFixed(1)} km · {Math.ceil(plan.route.duration / 60 + plan.stops.length * Number(minutes))} min estimados con paradas</strong><ol className="mt-3 space-y-2">{plan.stops.map((stop,index)=><li key={stop.index}>{index + 1}. {stop.orders[0].nombre_comercio} · {deliveryClock(stop.arrival)} · Pedidos {stop.orders.map(row=>'#'+row.id).join(', ')} {stop.late && <strong className="text-amber-700">Llegaría después del cierre</strong>}</li>)}</ol>{plan.missing.length > 0 && <p className="text-amber-700 mt-3">Sin GPS, al final de la hoja y fuera del cálculo de tiempo y distancia — {plan.missing.map(row=>`${row.nombre_comercio} (#${row.id})`).join(', ')}</p>}</div>}
        <div className="flex gap-3 flex-wrap"><button disabled={busy || !plan} className="bg-blue-800 text-white rounded px-4 py-2" onClick={()=>print(true)}>Recalcular e imprimir recorrido</button><button disabled={busy || !orders.length} className="border rounded px-4 py-2" onClick={()=>print(false)}>Imprimir orden original</button></div>
        <p className="text-xs text-gray-500">Rutas © FOSSGIS / OSRM · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Corregir el mapa</a></p>
        {ReactDOM.createPortal(<HojaRutaPrintable data={printed?.orders} routeSummary={printed?.summary} />, document.body)}
    </section>;
};
