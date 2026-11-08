const deliveryCoordinate = row => {
    if (row.latitud == null || row.longitud == null || String(row.latitud).trim() === '' || String(row.longitud).trim() === '') return null;
    const lat = Number(row.latitud), lng = Number(row.longitud);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
};
const deliveryDate = date => new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Argentina/Tucuman', year:'numeric', month:'2-digit', day:'2-digit'}).format(date);
const deliveryClock = date => new Intl.DateTimeFormat('es-AR', {timeZone:'America/Argentina/Tucuman',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
const deliveryDeadline = (row, departure) => {
    const local = new Date(departure.getTime() - 3 * 3600000);
    const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
    const turns = parseCustomerSchedule(row.horario_entrega || row.horario_recepcion || row.horario_atencion);
    const deadlines = [];
    for (const turn of turns) {
        if (!/^\d{2}:\d{2}$/.test(turn.inicio) || !/^\d{2}:\d{2}$/.test(turn.fin)) continue;
        const [sh, sm] = turn.inicio.split(':').map(Number);
        const [eh, em] = turn.fin.split(':').map(Number);
        if (sh > 23 || eh > 23 || sm > 59 || em > 59) continue;
        const start = sh * 60 + sm, end = eh * 60 + em;
        const day = local.getUTCDay();
        let remaining = null;
        if (end > start && turn.dias.includes(day) && minutes >= start && minutes < end) remaining = end - minutes;
        if (end < start && turn.dias.includes(day) && minutes >= start) remaining = 1440 - minutes + end;
        if (end < start && turn.dias.includes((day + 6) % 7) && minutes < end) remaining = end - minutes;
        if (remaining != null) deadlines.push(remaining * 60);
    }
    return deadlines.length ? Math.max(...deadlines) : null;
};
let deliveryLastRequest = 0;
const deliveryRoadRequest = async path => {
    const delay = Math.max(0, deliveryLastRequest + 1100 - Date.now());
    deliveryLastRequest = Date.now() + delay;
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
        const response = await fetch(`https://routing.openstreetmap.de/routed-car/${path}`, {signal: controller.signal});
        if (!response.ok) throw new Error('El servicio de calles no está disponible. Podés imprimir el orden original o reintentar.');
        const data = await response.json();
        if (data.code !== 'Ok') throw new Error('No se encontró un recorrido por calles para estas ubicaciones.');
        return data;
    } finally { clearTimeout(timer); }
};
const planDelivery = async (orders, origin, returnToOrigin, serviceMinutes, departure = new Date()) => {
    const groups = new Map();
    const missing = [];
    for (const order of orders) {
        const point = deliveryCoordinate(order);
        if (!point) { missing.push(order); continue; }
        const key = `${order.cliente_id}:${point.join(',')}`;
        if (!groups.has(key)) groups.set(key, {point, orders:[], deadline:deliveryDeadline(order, departure)});
        groups.get(key).orders.push(order);
    }
    const stops = [...groups.values()];
    if (!stops.length) throw new Error('Los pedidos no tienen coordenadas válidas. Corregí el GPS en Clientes.');
    if (stops.length > 40) throw new Error('El cálculo admite hasta 40 paradas por recorrido.');
    const points = [origin, ...stops.map(stop => stop.point)];
    const coordinates = points.map(([lat,lng]) => `${lng},${lat}`).join(';');
    const table = await deliveryRoadRequest(`table/v1/driving/${coordinates}?annotations=duration`);
    if (!Array.isArray(table.durations) || table.durations.length !== points.length) throw new Error('La matriz de tiempos recibida es inválida.');
    const remaining = stops.map((stop,index) => ({...stop, index:index + 1}));
    const ordered = [];
    let current = 0, elapsed = 0;
    while (remaining.length) {
        const reachable = remaining.filter(stop => Number.isFinite(table.durations[current]?.[stop.index]));
        if (!reachable.length) throw new Error('Hay paradas sin conexión por calles. Revisá sus coordenadas.');
        // Prioritize active closing windows that cannot wait one additional stop.
        const urgent = reachable.filter(stop => stop.deadline != null && stop.deadline - elapsed - table.durations[current][stop.index] < serviceMinutes * 60 + 900);
        const candidates = urgent.length ? urgent : reachable;
        candidates.sort((a,b) => urgent.length ? a.deadline - b.deadline || table.durations[current][a.index] - table.durations[current][b.index] : table.durations[current][a.index] - table.durations[current][b.index]);
        const next = candidates[0];
        elapsed += table.durations[current][next.index];
        ordered.push({...next, arrival:new Date(departure.getTime() + elapsed * 1000), late:next.deadline != null && elapsed > next.deadline});
        elapsed += serviceMinutes * 60;
        current = next.index;
        remaining.splice(remaining.indexOf(next),1);
    }
    // Improve the initial order using directed road times and closing-window penalties.
    const score = sequence => {
        let seconds = 0, previous = 0, lateSeconds = 0;
        for (const stop of sequence) {
            const travel = table.durations[previous]?.[stop.index];
            if (!Number.isFinite(travel)) return Infinity;
            seconds += travel;
            if (stop.deadline != null) lateSeconds += Math.max(0, seconds - stop.deadline);
            seconds += serviceMinutes * 60;
            previous = stop.index;
        }
        if (returnToOrigin) {
            const back = table.durations[previous]?.[0];
            if (!Number.isFinite(back)) return Infinity;
            seconds += back;
        }
        return seconds + lateSeconds * 100;
    };
    let bestScore = score(ordered);
    if (!Number.isFinite(bestScore)) throw new Error('No hay conexión por calles para completar el recorrido.');
    for (let pass = 0; pass < 5; pass++) {
        let improved = false;
        for (let from = 0; from < ordered.length - 1; from++) {
            for (let to = from + 1; to < ordered.length; to++) {
                const candidate = [...ordered.slice(0, from), ...ordered.slice(from, to + 1).reverse(), ...ordered.slice(to + 1)];
                const candidateScore = score(candidate);
                if (candidateScore < bestScore) {
                    ordered.splice(0, ordered.length, ...candidate);
                    bestScore = candidateScore;
                    improved = true;
                }
            }
        }
        if (!improved) break;
    }
    elapsed = 0;
    current = 0;
    for (const stop of ordered) {
        elapsed += table.durations[current][stop.index];
        stop.arrival = new Date(departure.getTime() + elapsed * 1000);
        stop.late = stop.deadline != null && elapsed > stop.deadline;
        elapsed += serviceMinutes * 60;
        current = stop.index;
    }
    const routePoints = [origin, ...ordered.map(stop => stop.point), ...(returnToOrigin ? [origin] : [])];
    const route = await deliveryRoadRequest(`route/v1/driving/${routePoints.map(([lat,lng]) => `${lng},${lat}`).join(';')}?overview=full&geometries=geojson`);
    if (!route.routes?.[0]?.geometry) throw new Error('El servicio no devolvió el trazado del recorrido.');
    return {stops:ordered, missing, orders:[...ordered.flatMap((stop, index) => stop.orders.map(order => ({...order, route_position:index + 1, route_arrival:deliveryClock(stop.arrival), route_late:stop.late}))), ...missing.map(order => ({...order, route_missing:true}))], route:route.routes[0], departure};
};
