// The stack keeps keyboard handling scoped to the most recently opened dialog.
const adminDialogStack = [];
const DialogFrame = ({ children, onClose, busy = false, label = 'Formulario', layer = 50 }) => {
    const ref = React.useRef(null);
    const latest = React.useRef({ onClose, busy });
    latest.current = { onClose, busy };
    React.useEffect(() => {
        const node = ref.current;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        adminDialogStack.push(node);
        const focusable = () => Array.from(node.querySelectorAll('button, input, select, textarea, a[href], [tabindex]'))
            .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
        const frame = requestAnimationFrame(() => (focusable()[0] || node).focus());
        const handleKey = (event) => {
            if (adminDialogStack[adminDialogStack.length - 1] !== node) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                if (!latest.current.busy) latest.current.onClose();
            }
            if (event.key === 'Tab') {
                const items = focusable();
                const first = items[0];
                const last = items[items.length - 1];
                if (!first) { event.preventDefault(); node.focus(); }
                else if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', handleKey, true);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', handleKey, true);
            const index = adminDialogStack.indexOf(node);
            if (index >= 0) adminDialogStack.splice(index, 1);
            document.body.style.overflow = previousOverflow;
            if (previousFocus && previousFocus.isConnected) previousFocus.focus();
        };
    }, []);
    return <div ref={ref} style={{ zIndex: layer }} role="dialog" aria-modal="true" aria-label={label} aria-busy={busy} tabIndex={-1}
        className="dialog-overlay fixed inset-0 z-50 flex justify-center items-center p-4">{children}</div>;
};

/**
 * @file Contiene componentes de modales reutilizables.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo contiene componentes de UI de tipo modal.
 *   Es invocado desde vistas como PedidosView, ProductosView, etc.
 *
 * El componente se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const PasswordConfirmModal = ({ title, message, onConfirm, onClose, loading }) => {
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const token = localStorage.getItem('token');

    const handleConfirm = async () => {
        setError('');
        if (!password) {
            setError('La contraseña es requerida.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/auth/reauthenticate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Contraseña incorrecta.');
            onConfirm();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <p className="text-gray-600 mt-2">{message}</p>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Confirma tu contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end items-center gap-4 rounded-b-xl">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={handleConfirm} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">{loading ? 'Confirmando...' : 'Confirmar'}</button>
                </div>
            </div>
        </div>
    );
};