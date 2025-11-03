/**
 * @file Contiene un combobox personalizado para seleccionar o crear categorías.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este es un componente de UI genérico.
 *   Es utilizado por `ProductoFormModal`.
 *
 * El componente se carga globalmente en `index.html` y queda disponible
 * para otros scripts que se carguen después.
 */

const CategoryCombobox = ({ value, onChange, suggestions }) => {
    const [inputValue, setInputValue] = React.useState(value || '');
    const [isOpen, setIsOpen] = React.useState(false);
    const wrapperRef = React.useRef(null);

    // Sincroniza el valor interno si el prop externo cambia
    React.useEffect(() => { setInputValue(value || ''); }, [value]);

    // Cierra el desplegable si se hace clic fuera
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        if (!isOpen) setIsOpen(true);
        onChange({ target: { name: 'categoria', value: newValue } });
    };

    const handleSelectSuggestion = (selectedValue) => {
        setInputValue(selectedValue);
        setIsOpen(false);
        onChange({ target: { name: 'categoria', value: selectedValue } });
    };

    const filteredSuggestions = suggestions.filter(
        suggestion => suggestion.toLowerCase().includes(inputValue.toLowerCase())
    );

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor="categoria-input" className="block text-sm font-medium text-gray-700">Categoría</label>
            <input
                type="text"
                id="categoria-input"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
                placeholder="Buscar o crear categoría..."
            />
            {isOpen && (
                <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                    {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map(suggestion => (
                            <div
                                key={suggestion}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="cursor-pointer hover:bg-blue-500 hover:text-white p-2 text-sm"
                            >
                                {suggestion}
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-sm text-gray-500">
                            {inputValue ? `Crear nueva: "${inputValue}"` : 'Escribe para buscar...'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};