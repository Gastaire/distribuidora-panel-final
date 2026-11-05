const DELIVERY_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const parseCustomerSchedule = value => {
    let data = value;
    if (typeof value === 'string') {
        if (!value.trim()) return [];
        try { data = JSON.parse(value); } catch (_) { return []; }
    }
    const turns = Array.isArray(data) ? data : Object.entries(data || {}).flatMap(([day, value]) => {
        const index = DELIVERY_DAYS.findIndex(name => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            === day.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 3).toLowerCase());
        if (index < 0) return [];
        const dayTurns = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [value];
        return dayTurns.map(turn => {
            const [inicio, fin] = typeof turn === 'string' ? turn.split(/[-–]/).map(time => time.trim()) : [turn?.desde, turn?.hasta];
            return { dias: [index], inicio, fin };
        });
    });
    return turns.filter(turn => Array.isArray(turn?.dias) && turn.dias.length && turn.inicio && turn.fin)
        .map(turn => ({ ...turn, dias: turn.dias.map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6) }));
};

const formatScheduleDays = days => [...new Set(days)].sort((a, b) => (a || 7) - (b || 7))
    .map(day => DELIVERY_DAYS[day]).filter(Boolean).join(', ');

const formatCustomerSchedule = value => {
    const turns = parseCustomerSchedule(value);
    if (turns.length) return turns.map(turn => `${formatScheduleDays(turn.dias)} ${turn.inicio}–${turn.fin}`).join(' · ');
    if (typeof value !== 'string' || !value.trim() || /^[\[{]/.test(value.trim())) return '';
    return value.trim();
};
