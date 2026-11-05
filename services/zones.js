const DELIVERY_ZONES = [
    'Lules', 'Ingenio Lules', 'San Pablo', 'Manantial', 'Ingenio Viejo',
    'La Reducción', 'García Fernández', 'Bella Vista', 'Santa Rosa de Leales', 'Famaillá', 'Santa Lucía'
];

const normalizeDeliveryZone = value => String(value || '').trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');

const canonicalDeliveryZone = value => DELIVERY_ZONES.find(zone =>
    normalizeDeliveryZone(zone) === normalizeDeliveryZone(value)
);

const suggestDeliveryZone = (client, customers) => {
    const point = item => {
        if (item.latitud == null || item.longitud == null || item.latitud === '' || item.longitud === '') return null;
        const lat = Number(item.latitud);
        const lng = Number(item.longitud);
        return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
            && (lat !== 0 || lng !== 0) ? { lat, lng } : null;
    };
    const origin = point(client);
    if (!origin) return null;

    const zones = new Set();
    let references = 0;
    for (const candidate of customers) {
        if (candidate.id === client.id || candidate.zona_manual !== true) continue;
        const zone = canonicalDeliveryZone(candidate.zona);
        const location = point(candidate);
        if (!zone || !location) continue;
        const dx = (origin.lng - location.lng) * Math.cos(origin.lat * Math.PI / 180);
        const dy = origin.lat - location.lat;
        if (Math.hypot(dx, dy) * 111.2 > 1) continue;
        zones.add(zone);
        references++;
    }
    return references >= 2 && zones.size === 1 ? [...zones][0] : null;
};
