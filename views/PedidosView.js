/**
 * @file Contiene la vista de la bandeja de pedidos.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes como Spinner, TableHeader, EstadoBadge, PasswordConfirmModal y varios iconos.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const PedidosView = ({ onSelectPedido, user }) => {
    const [pedidos, setPedidos] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showArchived, setShowArchived] = React.useState(false);
    const [confirmAction, setConfirmAction] = React.useState({ action: null, pedido: null });
    const [printingHojaRuta, setPrintingHojaRuta] = React.useState(false);
    const token = localStorage.getItem('token');
    const { items: sortedPedidos, requestSort, sortConfig } = useSortableData(pedidos, { key: 'id', direction: 'descending' });

    const fetchPedidos = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('No se pudo obtener la lista de pedidos.');
            setPedidos(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const handleActionConfirm = async () => {
        const { action, pedido } = confirmAction;
        if (!action || !pedido) return;
        const url = `${API_URL}/pedidos/${pedido.id}/${action}`;
        try {
            await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            setConfirmAction({ action: null, pedido: null });
            fetchPedidos();
        } catch (err) {
            alert(`Error al ejecutar la acción: ${err.message}`);
            setConfirmAction({ action: null, pedido: null });
        }
    };

    const generarHojaRutaPDF = async () => {
        setPrintingHojaRuta(true);
        try {
            const res = await fetch(`${API_URL}/pedidos/hoja-ruta`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Error al obtener datos para hoja de ruta');
            const data = await res.json();
            
            if (data.length === 0) {
                alert('No hay pedidos facturados en las últimas 6 horas.');
                setPrintingHojaRuta(false);
                return;
            }

            // Márgenes mínimos para economizar papel
            const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();
            const margen = 8;
            const anchoUtil = pageW - (margen * 2);

            // --- CABECERA: estilo idéntico a la hoja de pedidos ---
            // Fila superior: Título | Fecha | Cant. Pedidos
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(68, 68, 68); // #444 gris oscuro como en pedidos
            doc.text('Hoja de Ruta', margen, 12);

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            const fechaHoy = new Date().toLocaleDateString('es-AR');
            doc.text('Fecha: ' + fechaHoy, pageW / 2, 12, { align: 'center' });
            doc.text('Pedidos: ' + data.length, pageW - margen, 12, { align: 'right' });

            // Localidades
            const localidades = [...new Set(data.map(p => p.direccion).filter(Boolean))].join(', ');
            if (localidades) {
                doc.text('Destinos: ' + localidades, margen, 17);
            }

            // Línea separadora fina
            doc.setDrawColor(180, 180, 180); // gris claro
            doc.setLineWidth(0.3);
            doc.line(margen, localidades ? 19 : 15, pageW - margen, localidades ? 19 : 15);

            // --- TABLA ---
            const tableData = [];
            data.forEach(pedido => {
                // Fila del cliente
                tableData.push([
                    pedido.nombre_comercio + '\n#' + pedido.id,
                    '', // Efectivo
                    '', // Transferencia
                    '', // Debe
                    ''  // Firma
                ]);
                // Fila de observaciones
                tableData.push([
                    { content: 'Obs: ____________________________________________', colSpan: 5, styles: { fontSize: 7, fontStyle: 'italic', cellPadding: { top: 1, bottom: 2, left: 2, right: 2 } } }
                ]);
            });

            // Fila de TOTALES
            tableData.push([
                { content: 'TOTAL', styles: { fontStyle: 'bold' } },
                '', '', '', ''
            ]);

            doc.autoTable({
                startY: localidades ? 21 : 17,
                margin: { left: margen, right: margen },
                head: [['Cliente', 'Efectivo', 'Transferencia', 'Debe', 'Firma Conform.']],
                body: tableData,
                theme: 'grid',
                // Sin colores - todo gris como la hoja de pedidos
                headStyles: { 
                    fillColor: false, 
                    textColor: [68, 68, 68],
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center',
                    cellPadding: 2,
                    lineColor: [150, 150, 150],
                    lineWidth: 0.3
                },
                bodyStyles: {
                    textColor: [68, 68, 68],
                    fontSize: 8,
                    cellPadding: 3,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.2
                },
                columnStyles: {
                    0: { cellWidth: anchoUtil * 0.30, halign: 'left' },
                    1: { cellWidth: anchoUtil * 0.15, halign: 'center' },
                    2: { cellWidth: anchoUtil * 0.18, halign: 'center' },
                    3: { cellWidth: anchoUtil * 0.15, halign: 'center' },
                    4: { cellWidth: anchoUtil * 0.22, halign: 'center' }
                },
                styles: { 
                    minCellHeight: 10,
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                alternateRowStyles: { fillColor: false }
            });

            // --- PIE: Firma del repartidor ---
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.3);
            doc.line(pageW - margen - 55, finalY, pageW - margen, finalY);
            doc.setFontSize(7);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Firma del Repartidor', pageW - margen - 27.5, finalY + 4, { align: 'center' });

            doc.save('Hoja_de_Ruta_' + fechaHoy.replace(/\//g, '-') + '.pdf');
        } catch (error) {
            alert('Error generando PDF: ' + error.message);
        } finally {
            setPrintingHojaRuta(false);
        }
    };

    const filteredPedidos = React.useMemo(() => 
        sortedPedidos.filter(p =>
            (showArchived ? p.estado === 'archivado' : p.estado !== 'archivado') &&
            ((p.nombre_comercio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (p.nombre_vendedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             p.id.toString().includes(searchTerm))
    ), [sortedPedidos, showArchived, searchTerm]);

    const renderActions = (pedido) => (
        <>
            <button onClick={() => onSelectPedido(pedido.id)} className="text-blue-600 hover:text-blue-900 font-semibold">Ver</button>
            {user.rol === 'admin' && pedido.estado !== 'archivado' && (<button onClick={() => setConfirmAction({ action: 'archive', pedido: pedido })} className="text-gray-500 hover:text-red-700 font-semibold">Archivar</button>)}
            {user.rol === 'admin' && pedido.estado === 'archivado' && (<button onClick={() => setConfirmAction({ action: 'unarchive', pedido: pedido })} className="text-green-600 hover:text-green-800 font-semibold">Desarchivar</button>)}
        </>
    );

    return (
        <div>
            {confirmAction.action && (
                <PasswordConfirmModal 
                    title={`¿${confirmAction.action === 'archive' ? 'Archivar' : 'Desarchivar'} Pedido #${confirmAction.pedido.id}?`} 
                    message={confirmAction.action === 'archive' ? 'El pedido se ocultará de la lista principal.' : 'El pedido volverá a la lista de pedidos activos.'}
                    onConfirm={handleActionConfirm} 
                    onClose={() => setConfirmAction({ action: null, pedido: null })} 
                />
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4 shrink-0">
                    <h1 className="text-3xl font-bold text-gray-800">Bandeja de Pedidos</h1>
                    {user.rol === 'admin' && (
                        <button 
                            onClick={generarHojaRutaPDF} 
                            disabled={printingHojaRuta}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm flex items-center transition"
                        >
                            {printingHojaRuta ? <Spinner className="w-5 h-5 mr-2 border-white" /> : '📄 Imprimir Hoja de Ruta'}
                        </button>
                    )}
                </div>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Archivados</span>
                            <button onClick={() => setShowArchived(!showArchived)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showArchived ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showArchived ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                        </div>
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg"/>
                    </div>
                </div>
            </div>

            {loading ? <div className="p-6 flex justify-center"><Spinner className="border-blue-500"/></div> : error ? <p className="p-6 text-red-500">{error}</p> : (
                <>
                    {/* Vista de Tabla para Escritorio */}
                    <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <TableHeader sortKey="id" sortConfig={sortConfig} onSort={requestSort}>ID</TableHeader>
                                        <TableHeader sortKey="nombre_comercio" sortConfig={sortConfig} onSort={requestSort}>Cliente</TableHeader>
                                        <TableHeader sortKey="nombre_vendedor" sortConfig={sortConfig} onSort={requestSort}>Vendedor</TableHeader>
                                        <TableHeader sortKey="fecha_creacion" sortConfig={sortConfig} onSort={requestSort}>Fecha</TableHeader>
                                        <TableHeader sortKey="estado" sortConfig={sortConfig} onSort={requestSort}>Estado</TableHeader>
                                        <th className="relative px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPedidos.map((pedido) => (
                                        <tr key={pedido.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">#{pedido.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{pedido.nombre_comercio}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{pedido.nombre_vendedor}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{new Date(pedido.fecha_creacion).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm capitalize"><EstadoBadge estado={pedido.estado} /></td>
                                            <td className="px-6 py-4 text-right text-sm font-medium space-x-4">{renderActions(pedido)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Vista de Tarjetas para Móvil */}
                    <div className="md:hidden space-y-4">
                        {filteredPedidos.map((pedido) => (
                            <div key={pedido.id} className="bg-white rounded-xl shadow-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{pedido.nombre_comercio}</p>
                                        <p className="text-sm text-gray-500">Pedido #{pedido.id}</p>
                                    </div>
                                    <EstadoBadge estado={pedido.estado} />
                                </div>
                                <div className="border-t border-gray-200 pt-2 space-y-1 text-sm text-gray-700">
                                    <p><strong>Vendedor:</strong> {pedido.nombre_vendedor}</p>
                                    <p><strong>Fecha:</strong> {new Date(pedido.fecha_creacion).toLocaleDateString()}</p>
                                </div>
                                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-end space-x-4 text-sm">
                                    {renderActions(pedido)}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {!loading && filteredPedidos.length === 0 && <p className="p-6 text-center text-gray-500">No se encontraron resultados.</p>}
        </div>
    );
};