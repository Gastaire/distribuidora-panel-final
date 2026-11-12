// Snapshots are separate from operational orders until an administrator reviews them.
const RescatesView = ({onSelectPedido}) => {
    const [rows, setRows] = React.useState([]);
    const [next, setNext] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [selected, setSelected] = React.useState(null);
    const [clients, setClients] = React.useState([]);
    const [products, setProducts] = React.useState([]);
    const [clientId, setClientId] = React.useState('');
    const [items, setItems] = React.useState([]);
    const [confirm, setConfirm] = React.useState(false);
    const [notice, setNotice] = React.useState('');
    const headers = {Authorization:`Bearer ${localStorage.getItem('token')}`, 'Content-Type':'application/json'};
    const request = async (path, options = {}) => {
        const response = await fetch(`${API_URL}${path}`, {...options, headers});
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || 'No se pudo completar la operación.');
        return body;
    };
    const load = async (cursor = null) => {
        setLoading(true); setError('');
        try {
            const data = await request(`/pedidos/rescates${cursor ? `?before=${cursor}` : ''}`);
            setRows(previous => cursor ? [...previous, ...data.rescates] : data.rescates);
            setNext(data.next);
        } catch (err) {setError(err.message);}
        finally {setLoading(false);}
    };
    React.useEffect(() => {load();}, []);
    const open = async row => {
        setLoading(true); setError(''); setNotice('');
        try {
            const [customers, catalog] = await Promise.all([request('/clientes'), request('/productos?include_archived=true')]);
            setClients(customers); setProducts(catalog); setSelected(row);
            setClientId(String(row.pedido.cliente_id || ''));
            setItems(row.pedido.items.map(value => { const item = value || {}; return ({producto_id:item.producto_id || '', cantidad:item.cantidad ?? '', precio_congelado:item.precio_congelado ?? item.precio_unitario ?? '', nombre_original:item.nombre_producto || item.nombre || `Producto ${item.producto_id || 'sin ID'}`}); }));
        } catch (err) {setError(err.message);}
        finally {setLoading(false);}
    };
    const recover = async password => {
        setConfirm(false); setLoading(true); setError('');
        try {
            const result = await request(`/pedidos/rescates/${selected.id}/recuperar`, {method:'POST', body:JSON.stringify({password, cliente_id:Number(clientId), items:items.map(item => ({producto_id:Number(item.producto_id),cantidad:item.cantidad,precio_congelado:item.precio_congelado}))})});
            setNotice(`${result.message} Pedido #${result.pedido_id}.`);
            setSelected(previous => ({...previous, pedido:{...previous.pedido, resolution:{type:result.existing ? 'sent' : 'recovered',pedido_id:result.pedido_id}}}));
            await load();
        } catch (err) {setError(err.message);}
        finally {setLoading(false);}
    };
    const changeItem = (index, field, value) => setItems(previous => previous.map((item,i) => i === index ? {...item,[field]:value} : item));
    const money = value => Number(value || 0).toLocaleString('es-AR',{style:'currency',currency:'ARS'});
    const date = value => value && !isNaN(Date.parse(value)) ? new Date(value).toLocaleString('es-AR') : 'Sin fecha';
    const linked = selected?.pedido.resolution?.pedido_id || selected?.pedido.id;
    const valid = clients.some(c => String(c.id) === clientId) && items.length > 0 && items.every(i => products.some(p => String(p.id) === String(i.producto_id)) && Number(i.cantidad) > 0 && i.precio_congelado !== '' && Number.isFinite(Number(i.precio_congelado)) && Number(i.precio_congelado) >= 0);
    return <section className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">Pedidos rescatados</h1><p className="text-gray-600">Copias de envíos guardados en los teléfonos, disponibles para revisión.</p></div><button disabled={loading} onClick={() => load()} className="border rounded-lg px-4 py-2 bg-white">Actualizar rescates</button></div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-900">La app envía estas copias al abrirse con conexión. Recuperar crea un pedido <strong>archivado</strong>: no entra al reparto ni se prepara hasta que lo revises y desarchives. Si el envío ya existe, se abre ese pedido para evitar duplicados.</div>
        {error && <p role="alert" className="bg-red-50 text-red-800 p-3 rounded">{error}</p>}
        {notice && <p role="status" className="bg-green-50 text-green-800 p-3 rounded">{notice}</p>}
        {selected && <div className="bg-white rounded-xl border p-5 space-y-4">
            <div className="flex justify-between"><h2 className="text-xl font-bold">Rescate #{selected.id} · {selected.pedido.cliente_nombre_snapshot || 'Cliente sin identificar'}</h2><button disabled={loading} onClick={() => setSelected(null)} className="border rounded px-3">Cerrar revisión</button></div>
            <p className="text-sm text-gray-600">Vendedor: {selected.vendedor} · Original: {date(selected.pedido.fecha)} · ID local: {selected.pedido.local_id}</p>
            <p className="text-red-700">{selected.pedido.sync_error || 'Pendiente de envío, sin error informado.'}</p>
            <p className="whitespace-pre-wrap">Notas: {selected.pedido.notas_entrega || 'Sin notas'}{selected.pedido.fecha_entrega_programada && ` · Entrega original: ${selected.pedido.fecha_entrega_programada}`}</p>
            {linked ? <div className="bg-teal-50 p-3 rounded"><p>Ya asociado al pedido #{linked}. Compará la copia con el pedido antes de modificarlo.</p><button onClick={() => onSelectPedido(linked)} className="font-bold underline">Abrir pedido #{linked}</button></div> : <p className="text-sm text-gray-600">Confirmá el cliente y reemplazá productos inexistentes. Los precios aprobados se guardan sólo en este pedido. Revisá pedidos recientes del vendedor si el envío proviene de una versión antigua.</p>}
            <label className="block font-semibold">Cliente para recuperar<select disabled={!!linked || loading} value={clientId} onChange={e => setClientId(e.target.value)} className="block border rounded p-2 w-full"><option value="">Seleccionar cliente</option>{!clients.some(c => String(c.id) === clientId) && clientId && <option value={clientId}>Cliente inexistente #{clientId} · Reemplazar</option>}{clients.map(c => <option key={c.id} value={c.id}>{c.nombre_comercio} · #{c.id}</option>)}</select></label>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left p-2">Producto original / recuperado</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>{items.map((item,index) => <tr key={index} className="border-t"><td className="p-2"><p className="text-gray-500 mb-1">{item.nombre_original}</p><select aria-label={`Producto ${index+1}`} disabled={!!linked || loading} value={item.producto_id} onChange={e => changeItem(index,'producto_id',e.target.value)} className="border rounded p-2 w-full"><option value="">Seleccionar producto</option>{!products.some(p => String(p.id) === String(item.producto_id)) && item.producto_id && <option value={item.producto_id}>Inexistente #{item.producto_id} · Reemplazar</option>}{products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></td><td className="p-2"><input aria-label={`Cantidad ${index+1}`} disabled={!!linked || loading} type="number" min="0.001" step="any" className="border rounded p-2 w-24" value={item.cantidad} onChange={e => changeItem(index,'cantidad',e.target.value)} /></td><td className="p-2"><input aria-label={`Precio ${index+1}`} disabled={!!linked || loading} type="number" min="0" step="0.01" className="border rounded p-2 w-28" value={item.precio_congelado} onChange={e => changeItem(index,'precio_congelado',e.target.value)} /></td><td className="p-2">{money(Number(item.cantidad)*Number(item.precio_congelado))}</td></tr>)}</tbody></table></div>
            {!items.length && <p>La copia no contiene productos. Se conserva para revisión; no puede convertirse en pedido vacío.</p>}
            <p className="text-right font-bold text-lg">Total a recuperar: {money(items.reduce((total,item) => total + Number(item.cantidad)*Number(item.precio_congelado),0))}</p>
            {!linked && <button disabled={!valid || loading} onClick={() => setConfirm(true)} className="bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50">Recuperar como archivado</button>}
        </div>}
        <div className="bg-white border rounded-xl divide-y">{rows.map(row => <button key={row.id} disabled={loading} onClick={() => open(row)} className="w-full text-left p-4 hover:bg-gray-50"><div className="flex flex-wrap justify-between gap-2"><strong>#{row.id} · {row.pedido.cliente_nombre_snapshot || 'Cliente sin identificar'}</strong><span className={row.pedido.resolution ? 'text-teal-700' : 'text-amber-700'}>{row.pedido.resolution ? `Asociado a #${row.pedido.resolution.pedido_id}` : row.pedido.id ? `Revisar pedido #${row.pedido.id}` : 'Por revisar'}</span></div><p className="text-sm text-gray-500">{row.vendedor} · {date(row.pedido.fecha)} · {row.pedido.items.length} productos</p><p className="text-sm text-red-700">{row.pedido.sync_error || 'Copia de envío pendiente'}</p></button>)}{!rows.length && !loading && <p className="p-8 text-center text-gray-500">Todavía no llegaron copias para revisar.</p>}</div>
        {loading && <p role="status">Procesando…</p>}
        {next && <button disabled={loading} onClick={() => load(next)} className="border rounded px-4 py-2">Cargar más rescates</button>}
        {confirm && <PasswordConfirmModal title="Recuperar pedido archivado" message="Confirmá tu contraseña. Se conserva el vendedor y la copia original; el pedido se crea archivado para revisión." loading={loading} onClose={() => setConfirm(false)} onConfirm={recover} />}
    </section>;
};
