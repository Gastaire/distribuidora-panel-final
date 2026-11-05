const ProductPhotoQueue = ({ products, categories, onClose, onSaved }) => {
    const [pending] = React.useState(() => products.filter(product => !product.archivado && !product.imagen_url));
    const [position, setPosition] = React.useState(0);
    const [imageUrl, setImageUrl] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');
    const [failedImage, setFailedImage] = React.useState('');
    const touchStart = React.useRef(null);
    const product = pending[position];
    const normalizedUrl = imageUrl.trim();
    const validUrl = /^https?:\/\/[^\s]+$/i.test(normalizedUrl);

    const changeProduct = next => {
        if (saving || next < 0 || next > pending.length) return;
        setPosition(next);
        setImageUrl('');
        setCategory(pending[next]?.categoria || '');
        setError('');
        setFailedImage('');
    };

    React.useEffect(() => { setCategory(product?.categoria || ''); }, [product]);

    const tokens = name => new Set(String(name || '').toLowerCase().match(/[\p{L}]{4,}/gu) || []);
    const suggestion = React.useMemo(() => {
        if (!product || product.categoria) return '';
        const words = tokens(product.nombre);
        const scores = new Map();
        products.forEach(other => {
            if (other.archivado || !other.categoria) return;
            const score = [...tokens(other.nombre)].filter(word => words.has(word)).length;
            if (score > 0) scores.set(other.categoria, (scores.get(other.categoria) || 0) + score);
        });
        const ranked = [...scores].sort((a, b) => b[1] - a[1]);
        return ranked.length && ranked[0][1] > (ranked[1]?.[1] || 0) ? ranked[0][0] : '';
    }, [product, products]);

    const save = async () => {
        if (!product || !validUrl || saving) return;
        setSaving(true);
        setError('');
        try {
            const body = { imagen_url: normalizedUrl };
            if (category !== (product.categoria || '')) body.categoria = category;
            const response = await fetch(`${API_URL}/productos/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const result = await response.json().catch(() => null);
                throw new Error(result?.message || 'No se pudo guardar la foto.');
            }
            changeProduct(position + 1);
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return <DialogFrame label="Revisar fotos del catálogo" busy={saving} onClose={onClose}>
        <div className="bg-white w-full max-w-lg p-6 space-y-4">
            <header>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Fotos del catálogo</p>
                <h2 className="text-xl font-bold">{product?.nombre || 'Fin de la revisión'}</h2>
                <p className="text-sm text-gray-500">{product ? `${position + 1} de ${pending.length} sin foto · SKU ${product.codigo_sku || '—'}` : 'Volvé al catálogo para revisar los cambios.'}</p>
            </header>
            {product && <>
                <div className="bg-slate-100 rounded-xl h-40 flex items-center justify-center" onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
                    onTouchEnd={e => {
                        if (touchStart.current == null) return;
                        const distance = e.changedTouches[0].clientX - touchStart.current;
                        touchStart.current = null;
                        if (Math.abs(distance) > 70) changeProduct(position + (distance < 0 ? 1 : -1));
                    }}>
                    {validUrl && failedImage !== normalizedUrl ? <img src={normalizedUrl} className="h-full max-w-full object-contain" alt="Vista previa" onError={() => setFailedImage(normalizedUrl)} referrerPolicy="no-referrer" /> : <span className="text-sm text-gray-500">{failedImage && failedImage === normalizedUrl ? 'No se pudo cargar la imagen' : 'Pegá el enlace de una foto'}</span>}
                </div>
                <label className="block text-sm">Enlace de la foto
                    <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="block border rounded-lg px-3 py-2 w-full" />
                </label>
                <label className="block text-sm">Categoría
                    <select value={category} onChange={e => setCategory(e.target.value)} className="block border rounded-lg px-3 py-2 w-full">
                        <option value="">Sin categoría</option>
                        {[...new Set([...categories, product.categoria].filter(Boolean))].map(name => <option key={name}>{name}</option>)}
                    </select>
                </label>
                {suggestion && !category && <button className="text-sm text-teal-700" onClick={() => setCategory(suggestion)}>Usar categoría sugerida · {suggestion}</button>}
                {error && <p role="alert" className="text-red-700">{error}</p>}
            </>}
            <div className="flex flex-wrap gap-2">
                <button disabled={saving} onClick={onClose} className="border rounded-lg px-3 py-2">Cerrar</button>
                {product && <>
                    <button disabled={saving || position === 0} onClick={() => changeProduct(position - 1)} className="border rounded-lg px-3 py-2">Anterior</button>
                    <button disabled={saving} onClick={() => changeProduct(position + 1)} className="border rounded-lg px-3 py-2">Saltar</button>
                    <button disabled={!validUrl || failedImage === normalizedUrl || saving} onClick={save} className="bg-blue-600 text-white rounded-lg px-3 py-2">Guardar y seguir</button>
                </>}
            </div>
        </div>
    </DialogFrame>;
};
