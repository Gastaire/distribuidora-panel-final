const MapaView = () => {
    const [data, setData] = React.useState(null);
    const [mode, setMode] = React.useState('today');
    const [search, setSearch] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const load = async () => {
        setLoading(true);setError('');
        try {
            const headers = {Authorization:`Bearer ${localStorage.getItem('token')}`};
            const results = await Promise.all(['/clientes','/pedidos','/pedidos/hoja-ruta'].map(async path => {
                const response = await fetch(API_URL + path, {headers});
                if (!response.ok) throw new Error('No se pudieron cargar los datos del mapa.');
                return response.json();
            }));
            setData({clients:results[0],orders:results[1],route:results[2]});
        } catch (err) {setError(err.message);}
        finally {setLoading(false);}
    };
    React.useEffect(() => {load();}, []);
    const rows = React.useMemo(() => {
        if (!data) return [];
        const today = deliveryDate(new Date());
        const ids = new Set(data.route.map(row=>String(row.cliente_id)));
        data.orders.filter(row => String(row.fecha_entrega_programada || '').slice(0,10) === today && !['cancelado','archivado','combinado','entregado'].includes(row.estado)).forEach(row=>ids.add(String(row.cliente_id)));
        return data.clients.filter(row => (mode === 'all' || ids.has(String(row.id))) && `${row.nombre_comercio || ''} ${row.direccion || ''} ${row.zona || ''}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
    }, [data,mode,search]);
    return <div className="space-y-5"><div className="flex justify-between"><h1 className="text-2xl font-bold">Mapa y reparto</h1><button disabled={loading} onClick={load} className="border rounded px-3 py-2">{loading?'Actualizando…':'Actualizar'}</button></div>
        <div className="flex flex-wrap gap-2">{[['all','Todos los clientes'],['today','Entregas de hoy'],['route','Hoja de ruta actual']].map(([key,label])=><button key={key} onClick={()=>setMode(key)} className={`rounded px-4 py-2 ${mode===key?'bg-blue-900 text-white':'bg-white border'}`}>{label}</button>)}</div>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {data && (mode === 'route' ? <DeliveryPlanner orders={data.route} /> : <><p className="text-sm text-gray-600">{mode==='today'?'Entregas programadas para hoy aún pendientes, más pedidos de la hoja de ruta actual (facturados en las últimas 6 horas).':'Cartera completa de clientes.'}</p><input aria-label="Buscar en mapa" placeholder="Buscar comercio, dirección o zona" className="border rounded p-3 w-full" value={search} onChange={e=>setSearch(e.target.value)} /><p>{rows.length} clientes · {rows.filter(row=>deliveryCoordinate(row)).length} con GPS · {rows.filter(row=>!deliveryCoordinate(row)).length} sin GPS válido</p><DeliveryMap rows={rows} /><details><summary className="cursor-pointer">Clientes sin ubicación</summary><ul>{rows.filter(row=>!deliveryCoordinate(row)).map(row=><li key={row.id}>{row.nombre_comercio} · {row.direccion || 'Sin dirección'}</li>)}</ul></details></>)}
    </div>;
};
