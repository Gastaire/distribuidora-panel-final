/**
 * @file Contiene la vista y los modales para la gestión de categorías.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Contiene la vista principal de categorías y los modales para renombrar y gestionar productos.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const CategoriasView = ({ categorias, loading, error, onRename, onManage }) => {
    if (loading) {
        return <div className="flex justify-center p-10"><Spinner className="border-blue-500 h-10 w-10" /></div>;
    }

    if (error) {
        return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Categorías</h1>
                {/* Futuro botón para "Crear Categoría" podría ir aquí */}
            </div>
            <div className="bg-white rounded-xl shadow-lg">
                <ul className="divide-y divide-gray-200">
                    {categorias.length > 0 ? (
                        categorias.map(cat => (
                            <li key={cat} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <span className="text-sm font-medium text-gray-900">{cat}</span>
                                <div className="space-x-4">
                                    <button onClick={() => onManage(cat)} className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Gestionar Productos</button>
                                    <button onClick={() => onRename(cat)} className="text-sm text-blue-600 hover:text-blue-900 font-semibold">Renombrar</button>
                                    <button className="text-sm text-red-600 hover:text-red-900 font-semibold">Eliminar</button>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="px-6 py-4 text-center text-gray-500">No se encontraron categorías.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

const ManageCategoryProductsModal = ({ categoryName, allProducts, onClose, onSave, loading, error }) => {
    const [productsInCategory, setProductsInCategory] = React.useState([]);
    const [productsOutsideCategory, setProductsOutsideCategory] = React.useState([]);
    const [searchTermIn, setSearchTermIn] = React.useState('');
    const [searchTermOut, setSearchTermOut] = React.useState('');

    React.useEffect(() => {
        const inCategory = allProducts.filter(p => p.categoria === categoryName);
        const outOfCategory = allProducts.filter(p => p.categoria !== categoryName);
        setProductsInCategory(inCategory);
        setProductsOutsideCategory(outOfCategory);
    }, [categoryName, allProducts]);

    const moveToCategory = (product) => {
        setProductsOutsideCategory(prev => prev.filter(p => p.id !== product.id));
        setProductsInCategory(prev => [...prev, product].sort((a,b) => a.nombre.localeCompare(b.nombre)));
    };

    const removeFromCategory = (product) => {
        setProductsInCategory(prev => prev.filter(p => p.id !== product.id));
        setProductsOutsideCategory(prev => [...prev, product].sort((a,b) => a.nombre.localeCompare(b.nombre)));
    };

    const handleSave = () => {
        const productIds = productsInCategory.map(p => p.id);
        onSave(categoryName, productIds);
    };

    const filteredInCategory = productsInCategory.filter(p => p.nombre.toLowerCase().includes(searchTermIn.toLowerCase()));
    const filteredOutsideCategory = productsOutsideCategory.filter(p => p.nombre.toLowerCase().includes(searchTermOut.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Gestionar Productos en "{categoryName}"</h2>
                    <p className="text-sm text-gray-500">Mueve productos entre las listas para asignarlos o quitarlos de esta categoría.</p>
                </div>
                <div className="p-6 flex-grow overflow-hidden grid grid-cols-2 gap-6">
                    {/* Columna de productos DENTRO de la categoría */}
                    <div className="flex flex-col border rounded-lg">
                        <div className="p-3 bg-gray-50 border-b"><h3 className="font-bold">Productos en esta categoría ({filteredInCategory.length})</h3><input type="text" placeholder="Buscar aquí..." value={searchTermIn} onChange={e => setSearchTermIn(e.target.value)} className="w-full p-1 mt-1 border rounded"/></div>
                        <ul className="overflow-y-auto p-3 space-y-2">
                            {filteredInCategory.map(p => (
                                <li key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-red-50">
                                    <span className="text-sm">{p.nombre}</span>
                                    <button onClick={() => removeFromCategory(p)} className="text-red-500 font-bold text-lg px-2 rounded-full hover:bg-red-100">&times;</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                     {/* Columna de productos FUERA de la categoría */}
                    <div className="flex flex-col border rounded-lg">
                        <div className="p-3 bg-gray-50 border-b"><h3 className="font-bold">Otros productos ({filteredOutsideCategory.length})</h3><input type="text" placeholder="Buscar aquí..." value={searchTermOut} onChange={e => setSearchTermOut(e.target.value)} className="w-full p-1 mt-1 border rounded"/></div>
                        <ul className="overflow-y-auto p-3 space-y-2">
                            {filteredOutsideCategory.map(p => (
                                <li key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-green-50">
                                    <span className="text-sm">{p.nombre} <em className="text-xs text-gray-400">({p.categoria || 'Sin cat.'})</em></span>
                                    <button onClick={() => moveToCategory(p)} className="text-green-500 font-bold text-lg px-2 rounded-full hover:bg-green-100">&#43;</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end items-center gap-4 rounded-b-xl">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="button" onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-400">
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RenameCategoryModal = ({ categoryName, onClose, onSave, loading, error }) => {
    const [newCategoryName, setNewCategoryName] = React.useState(categoryName);

    React.useEffect(() => {
        setNewCategoryName(categoryName);
    }, [categoryName]);

    const handleSave = (e) => {
        e.preventDefault();
        if (newCategoryName && newCategoryName !== categoryName) {
            onSave(categoryName, newCategoryName);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800">Renombrar Categoría</h2>
                    <p className="text-gray-600 mt-2">Estás a punto de cambiar el nombre de la categoría <span className="font-bold">{categoryName}</span>.</p>
                    <div className="mt-4">
                        <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700">Nuevo nombre para la categoría</label>
                        <input 
                            type="text" 
                            id="newCategoryName"
                            value={newCategoryName} 
                            onChange={(e) => setNewCategoryName(e.target.value)} 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required 
                        />
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end items-center gap-4 rounded-b-xl">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={loading || !newCategoryName || newCategoryName === categoryName} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-400">
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};