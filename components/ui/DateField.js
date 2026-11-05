const formatDateAR = value => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
};

const DateFieldAR = ({ id, label, value, onChange }) => {
    const [draft, setDraft] = React.useState(value ? formatDateAR(value) : '');
    const [month, setMonth] = React.useState(null);
    const [invalid, setInvalid] = React.useState(false);

    React.useEffect(() => {
        setDraft(value ? formatDateAR(value) : '');
        setInvalid(false);
    }, [value]);

    const commit = () => {
        if (!draft.trim()) { setInvalid(false); onChange(''); return; }
        const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(draft.trim());
        if (!match) { setInvalid(true); return; }
        const iso = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        const date = new Date(iso);
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso) {
            setInvalid(true);
            return;
        }
        setInvalid(false);
        setDraft(formatDateAR(iso));
        onChange(iso);
    };

    const chooseDate = iso => {
        setMonth(null);
        setDraft(formatDateAR(iso));
        setInvalid(false);
        onChange(iso);
    };
    const moveMonth = offset => setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
    const days = month ? new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() : 0;
    const blanks = month ? (month.getDay() + 6) % 7 : 0;
    const openCalendar = () => {
        if (month) { setMonth(null); return; }
        const date = value ? new Date(value + 'T12:00:00') : new Date();
        setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    };

    return <div className="relative" onKeyDown={event => { if (event.key === 'Escape') setMonth(null); }}>
        <label htmlFor={id} className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
        <div className="flex gap-1 items-center"><input id={id} type="text" placeholder="dd/mm/aaaa" autoComplete="off" value={draft}
            aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}
            onChange={event => {
                setDraft(event.target.value);
                setInvalid(false);
                if (!event.target.value) onChange('');
            }}
            onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
            <button type="button" onClick={openCalendar} aria-label={`Calendario · ${label}`} aria-expanded={!!month} className="border rounded-lg px-2 py-2 text-sm text-blue-800">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="2" /><path d="M7 3v4m10-4v4M3 10h18" strokeWidth="2" /></svg>
            </button>
        </div>
        {month && <div className="date-field-calendar absolute z-30 top-full mt-2 left-0 bg-white border rounded-xl shadow-lg p-3 w-64" role="group" aria-label={`Elegir fecha · ${label}`}>
            <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => moveMonth(-1)} aria-label="Mes anterior" className="p-2">‹</button>
                <strong className="text-sm capitalize">{month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</strong>
                <button type="button" onClick={() => moveMonth(1)} aria-label="Mes siguiente" className="p-2">›</button>
            </div>
            <div className="grid grid-cols-7 text-center gap-1">
                {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(day => <span key={day} className="text-xs text-gray-500">{day}</span>)}
                {Array.from({length: blanks}, (_, index) => <span key={`empty-${index}`} />)}
                {Array.from({length: days}, (_, index) => {
                    const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2,'0')}-${String(index + 1).padStart(2,'0')}`;
                    return <button type="button" key={iso} onClick={() => chooseDate(iso)} aria-label={formatDateAR(iso)} aria-pressed={value === iso}
                        className={`text-sm p-1 rounded ${value === iso ? 'bg-blue-700 text-white' : 'hover:bg-blue-50'}`}>{index + 1}</button>;
                })}
            </div>
        </div>}
        {invalid && <p id={`${id}-error`} role="alert" className="text-xs text-red-700 mt-1">Usá dd/mm/aaaa.</p>}
    </div>;
};
