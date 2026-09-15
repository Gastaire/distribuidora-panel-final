/**
 * @file QuickEditModal - Modal tipo swipe para editar imagen, stock y categoría de productos
 * Se agrega a ProductosView con un botón de acceso rápido en cada fila.
 *
 * Técnicas usadas:
 * - Canvas API (nativa del navegador, 100% gratis) para compresión/resize de imagen
 *   antes de guardar (max 600px, 80% calidad JPEG)
 * - Fetch de URL externa con fallback a URL directa si hay CORS
 * - Navegación tipo Tinder: botones prev/next o teclado ←/→
 * - Sugerencia de categoría por afinidad de keywords (sin API externa, sin costo)
 */

// ─── Diccionario de keywords → categoría sugerida ─────────────────────────────
// Clave: substring en el nombre del producto (lowercase, sin acentos)
// Valor: nombre de categoría sugerida (debe coincidir con categorías reales si existen)
const KEYWORD_CATEGORY_MAP = [
    // Lácteos
    { keys: ['leche', 'yogur', 'yogurt', 'queso', 'manteca', 'crema', 'ricota', 'dulce de leche', 'postre', 'flan', 'danette'], cat: 'Lácteos' },
    // Bebidas
    { keys: ['gaseosa', 'coca', 'pepsi', 'sprite', 'fanta', 'agua', 'jugo', 'néctar', 'nectar', 'soda', 'tónica', 'tonica', 'cerveza', 'vino', 'fernet', 'whisky', 'gin', 'vodka', 'energy', 'te ', 'té ', 'mate', 'cocido', 'limonada'], cat: 'Bebidas' },
    // Panificados y harinas
    { keys: ['pan ', 'harina', 'biscuit', 'galletita', 'galleta', 'tostada', 'wafle', 'waffle', 'facturia', 'factura', 'medialunas', 'tortita'], cat: 'Panificados y Harinas' },
    // Cereales y desayuno
    { keys: ['cereal', 'avena', 'granola', 'muesli', 'copos', 'nesquik', 'cacao en polvo'], cat: 'Cereales y Desayuno' },
    // Aceites y condimentos
    { keys: ['aceite', 'vinagre', 'ketchup', 'mostaza', 'mayonesa', 'salsa', 'aderezos', 'aderezo', 'pimienta', 'orégano', 'oregano', 'perejil', 'laurel', 'ajo', 'sal ', 'condimento'], cat: 'Aceites y Condimentos' },
    // Conservas y enlatados
    { keys: ['lata', 'atún', 'atun', 'sardina', 'caballa', 'tomate en', 'tomate triturado', 'conserva', 'arvejas', 'choclo en', 'palmito', 'durazno en', 'pera en'], cat: 'Conservas' },
    // Fideos y arroz
    { keys: ['fideo', 'pasta', 'spaghetti', 'espagueti', 'ravioles', 'tallarín', 'tallarin', 'ñoquis', 'arroz', 'polenta', 'semola', 'sémola'], cat: 'Pastas y Arroz' },
    // Carnes y fiambres
    { keys: ['jamón', 'jamon', 'salame', 'salami', 'mortadela', 'fiambre', 'chorizo', 'longaniza', 'paleta', 'panceta', 'tocino', 'pollo', 'carne', 'vacuno'], cat: 'Carnes y Fiambres' },
    // Dulces y golosinas
    { keys: ['chocolate', 'alfajor', 'caramelo', 'gomita', 'chicle', 'dulce', 'mermelada', 'miel', 'azucar', 'azúcar', 'coco rallado', 'turron', 'turrón', 'nougat', 'wafer'], cat: 'Dulces y Golosinas' },
    // Limpieza
    { keys: ['jabón', 'jabon', 'detergente', 'limpiapisos', 'desengrasante', 'lavandina', 'cloro', 'suavizante', 'desodorante', 'olor', 'limpiador', 'desinfectante', 'lustramuebles', 'trapo', 'esponja', 'virulana'], cat: 'Limpieza' },
    // Higiene personal
    { keys: ['shampoo', 'champú', 'acondicionador', 'crema de enjuague', 'gel ', 'desodorante personal', 'pasta dental', 'cepillo', 'algodón', 'algodon', 'hisopo', 'pañal', 'panal', 'toallita', 'preservativo', 'anticonceptivo'], cat: 'Higiene Personal' },
    // Papel
    { keys: ['papel ', 'servilleta', 'rollo', 'toalla de papel', 'tissue', 'pañuelo descartable', 'cuaderno', 'bolsa de basura', 'film', 'papel aluminio', 'papel film'], cat: 'Papel y Descartables' },
    // Frutas y verduras
    { keys: ['fruta', 'manzana', 'banana', 'naranja', 'limón', 'limon', 'pera ', 'uva', 'verdura', 'papa', 'tomate', 'cebolla', 'zanahoria', 'zapallo', 'lechuga'], cat: 'Frutas y Verduras' },
    // Snacks
    { keys: ['papas fritas', 'chips', 'palitos', 'maní', 'mani', 'pochoclo', 'crackers', 'snack'], cat: 'Snacks' },
];

/**
 * Sugiere una categoría basándose en el nombre del producto.
 * Primero intenta matchear contra keywords del diccionario,
 * luego contra los nombres de las categorías existentes por similitud.
 *
 * @param {string} nombre - Nombre del producto
 * @param {Array}  categorias - Lista de categorías {id, nombre} del sistema
 * @returns {string|null} - Nombre de categoría sugerida, o null si no hay match
 */
const suggestCategory = (nombre, categorias) => {
    if (!nombre) return null;
    const n = nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
        .replace(/[^a-z0-9 ]/g, ' ');

    // 1. Diccionario de keywords
    for (const entry of KEYWORD_CATEGORY_MAP) {
        if (entry.keys.some(k => n.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
            // Si hay una categoría real que empieza con el mismo texto, usarla
            if (categorias && categorias.length > 0) {
                const catMatch = categorias.find(c => {
                    // categorias puede ser array de strings o array de {nombre}
                    const catNombre = typeof c === 'string' ? c : (c?.nombre || '');
                    return catNombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(
                        entry.cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ')[0]
                    );
                });
                if (catMatch) return typeof catMatch === 'string' ? catMatch : catMatch.nombre;
            }
            return entry.cat;
        }
    }

    // 2. Matcheo directo contra nombres de categorías existentes
    if (categorias && categorias.length > 0) {
        for (const cat of categorias) {
            const catNombre = typeof cat === 'string' ? cat : (cat?.nombre || '');
            if (!catNombre) continue;
            const catNorm = catNombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const palabrasCat = catNorm.split(/[\s&,/]+/).filter(p => p.length >= 4);
            if (palabrasCat.some(p => n.includes(p))) {
                return catNombre;
            }
        }
    }

    return null;
};

// ─── Componente Principal ──────────────────────────────────────────────────────
const QuickEditModal = ({ productos, initialIndex, categorias, onClose, onSaved }) => {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex || 0);
    const [saving, setSaving] = React.useState(false);
    const [imageTab, setImageTab] = React.useState('url'); // 'url' | 'upload'
    const [imageUrl, setImageUrl] = React.useState('');
    const [fetchingUrl, setFetchingUrl] = React.useState(false);
    const [preview, setPreview] = React.useState(null); // base64 para preview
    const [pendingChanges, setPendingChanges] = React.useState({}); // { [productoId]: { imagen_url, stock, categoria } }
    const fileRef = React.useRef(null);

    const producto = productos[currentIndex];
    const changes = pendingChanges[producto?.id] || {};
    
    // Estado actual (aplicando cambios pendientes si los hay)
    const currentImagen    = changes.imagen_url  !== undefined ? changes.imagen_url  : producto?.imagen_url  || '';
    const currentStock     = changes.stock        !== undefined ? changes.stock       : producto?.stock       || 'No';
    const currentCategoria = changes.categoria !== undefined ? changes.categoria : producto?.categoria || '';

    // Helper para obtener el nombre de una categoría (soporte string y objeto)
    const getCatNombre = (cat) => typeof cat === 'string' ? cat : (cat?.nombre || '');

    // Sugerencia de categoría (solo si no tiene categoría asignada)
    const suggestedCat = React.useMemo(() => {
        if (currentCategoria) return null;
        return suggestCategory(producto?.nombre, categorias);
    }, [producto?.id, currentCategoria, categorias]);

    // Reset al cambiar de producto
    React.useEffect(() => {
        if (!producto) return;
        setPreview(null);
        setImageUrl('');
        setImageTab('url');
    }, [currentIndex]);

    // Navegación con teclado
    React.useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
            if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentIndex, productos.length]);

    const goNext = () => {
        if (currentIndex < productos.length - 1) setCurrentIndex(i => i + 1);
    };
    const goPrev = () => {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
    };

    const updateChange = (field, value) => {
        setPendingChanges(prev => ({
            ...prev,
            [producto.id]: { ...(prev[producto.id] || {}), [field]: value }
        }));
    };

    // ─── Compresión de imagen con Canvas API (gratis, nativa del navegador) ────
    const compressImage = (file) => new Promise((resolve, reject) => {
        const MAX_DIM = 600;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
                    else                { width  = Math.round(width  * MAX_DIM / height); height = MAX_DIM; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.80));
            };
            img.onerror = reject;
            img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setPreview(compressed);
            updateChange('imagen_url', compressed);
        } catch (err) {
            alert('Error al procesar la imagen: ' + err.message);
        }
    };

    // ─── Fetch de imagen desde URL ─────────────────────────────────────────────
    const handleFetchUrl = async () => {
        if (!imageUrl.trim()) return;
        setFetchingUrl(true);
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const loaded = await new Promise((resolve) => {
                img.onload  = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = imageUrl.trim();
            });

            if (loaded) {
                const MAX_DIM = 600;
                let { width, height } = img;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
                    else                { width  = Math.round(width  * MAX_DIM / height); height = MAX_DIM; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
                setPreview(dataUrl);
                updateChange('imagen_url', dataUrl);
            } else {
                // CORS bloqueó → guardar URL directa
                setPreview(imageUrl.trim());
                updateChange('imagen_url', imageUrl.trim());
            }
        } catch (err) {
            alert('Error al cargar la imagen: ' + err.message);
        } finally {
            setFetchingUrl(false);
        }
    };

    // ─── Guardar este producto ─────────────────────────────────────────────────
    const handleSave = async () => {
        const toSave = pendingChanges[producto.id];
        if (!toSave || Object.keys(toSave).length === 0) {
            goNext();
            return;
        }
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/productos/${producto.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(toSave)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Error al guardar');
            }
            setPendingChanges(prev => {
                const next = { ...prev };
                delete next[producto.id];
                return next;
            });
            onSaved && onSaved(producto.id, toSave);
            goNext();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!producto) return null;

    const imgSrc = preview || currentImagen || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sin+imagen';
    const hasChanges = !!(pendingChanges[producto.id] && Object.keys(pendingChanges[producto.id]).length > 0);

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '92vh' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
                    <button onClick={goPrev} disabled={currentIndex === 0} className="p-1.5 rounded-lg bg-white/20 disabled:opacity-30 hover:bg-white/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <div className="text-center flex-1 px-2">
                        <p className="font-bold text-sm truncate">{producto.nombre}</p>
                        <p className="text-xs text-white/70">{currentIndex + 1} de {productos.length}</p>
                    </div>
                    <button onClick={goNext} disabled={currentIndex >= productos.length - 1} className="p-1.5 rounded-lg bg-white/20 disabled:opacity-30 hover:bg-white/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-200">
                    <div className="h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / productos.length) * 100}%` }}/>
                </div>

                {/* Imagen actual */}
                <div className="relative bg-gray-100 flex items-center justify-center overflow-hidden" style={{ height: 170 }}>
                    <img
                        src={imgSrc}
                        alt={producto.nombre}
                        className="max-h-full max-w-full object-contain"
                        onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Error'; }}
                    />
                    {hasChanges && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">● Sin guardar</span>
                    )}
                </div>

                {/* Cuerpo scrollable */}
                <div className="overflow-y-auto flex-1 p-4 space-y-4">

                    {/* — IMAGEN — */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Imagen</p>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-3">
                            <button onClick={() => setImageTab('url')}    className={`flex-1 text-xs py-1.5 rounded-md font-semibold transition-colors ${imageTab === 'url'    ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>🔗 Por URL</button>
                            <button onClick={() => setImageTab('upload')} className={`flex-1 text-xs py-1.5 rounded-md font-semibold transition-colors ${imageTab === 'upload' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>📁 Subir</button>
                        </div>

                        {imageTab === 'url' ? (
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                                />
                                <button
                                    onClick={handleFetchUrl}
                                    disabled={fetchingUrl || !imageUrl.trim()}
                                    className="bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:bg-gray-300 hover:bg-indigo-600 flex items-center gap-1"
                                >
                                    {fetchingUrl ? <span className="border-2 border-white border-t-transparent rounded-full h-4 w-4 animate-spin block"/> : '↓'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="w-full border-2 border-dashed border-indigo-300 rounded-xl py-4 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 transition-colors flex flex-col items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    <span>Elegir archivo</span>
                                    <span className="text-xs text-gray-400">Se optimiza automáticamente (max 600px, JPEG 80%)</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* — STOCK — */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Stock</p>
                        <div className="flex gap-2">
                            {['Sí', 'No'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateChange('stock', opt)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                        currentStock === opt
                                            ? opt === 'Sí' ? 'bg-green-500 border-green-500 text-white' : 'bg-red-500 border-red-500 text-white'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    {opt === 'Sí' ? '✅ En stock' : '❌ Sin stock'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* — CATEGORÍA — */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Categoría</p>
                            {/* Sugerencia automática */}
                            {suggestedCat && (
                                <button
                                    onClick={() => updateChange('categoria', suggestedCat)}
                                    className="text-xs bg-amber-50 border border-amber-300 text-amber-700 px-2 py-0.5 rounded-full font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1"
                                    title="Sugerencia basada en el nombre del producto"
                                >
                                    ✨ {suggestedCat}
                                </button>
                            )}
                        </div>
                        <select
                            value={currentCategoria}
                            onChange={e => updateChange('categoria', e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        >
                            <option value="">Sin categoría</option>
                            {(categorias || []).map((cat, i) => {
                                const nombre = getCatNombre(cat);
                                return (
                                    <option key={nombre || i} value={nombre}>{nombre || '(sin nombre)'}</option>
                                );
                            })}
                        </select>
                        {suggestedCat && !currentCategoria && (
                            <p className="text-xs text-amber-600 mt-1.5">
                                ✨ Sugerida por nombre — apretá el botón para aplicar
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex gap-3">
                    <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100">
                        Cerrar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                        {saving
                            ? <span className="border-2 border-white border-t-transparent rounded-full h-4 w-4 animate-spin block"/>
                            : hasChanges ? '💾 Guardar' : '→ Siguiente'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};
