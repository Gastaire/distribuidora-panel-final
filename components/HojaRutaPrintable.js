    const HojaRutaPrintable = ({ data, routeSummary }) => {
        if (!data || data.length === 0) return null;
        const fechaHoy = new Date().toLocaleDateString('es-AR');
        const localidades = [...new Set(data.map(p => p.zona_operativa || p.localidad).filter(Boolean))].join(', ');

        return (
            <div id="printableHojaRuta" className="printable-area hidden font-sans bg-white" style={{ fontSize: '10pt', color: '#444' }}>
                {/* Cabecera */}
                <div className="print-header">
                    <div className="flex justify-between items-start text-sm mb-1">
                        <div className="w-1/3"><h1 className="text-base font-bold">Hoja de Ruta</h1></div>
                        <div className="w-1/3 text-center"><span>Fecha: {fechaHoy}</span></div>
                        <div className="w-1/3 text-right"><span>Pedidos: {data.length}</span></div>
                    </div>
                    <p className="text-xs">Pedidos facturados en las últimas 6 horas que continúan en estado facturado.</p>
                    {routeSummary && <p className="text-xs">{routeSummary}</p>}
                    {localidades && <p className="text-xs mb-1">Destinos: {localidades}</p>}
                    <hr className="border-gray-400 my-1" />
                </div>

                {/* Tabla */}
                <div className="print-body flex-grow">
                    <table className="w-full border-collapse" style={{ fontSize: '10pt' }}>
                        <thead>
                            <tr>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '28%' }}>Cliente</th>
                                <th className="border-b border-gray-400 p-1 text-center">Monto</th>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '12%' }}>Efectivo</th>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '12%' }}>Transferencia</th>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '12%' }}>Debe</th>
                                <th className="border-b border-gray-400 p-1 text-center" style={{ width: '18%' }}>Firma Conform.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((pedido, idx) => (
                                <React.Fragment key={pedido.id}>
                                    {/* Fila del cliente - compacta */}
                                    <tr>
                                        <td className="border-b border-gray-200 px-1 py-0.5 text-left">
                                            <span>{pedido.route_position ? `${pedido.route_position}. ` : ''}{pedido.nombre_comercio}</span>
                                            {pedido.route_arrival && <div style={{fontSize:'9pt'}}>Llegada estimada {pedido.route_arrival}{pedido.route_late ? ' · Revisar cierre' : ''}</div>}
                                            {pedido.route_missing && <div style={{fontSize:'9pt'}}>Sin GPS · Coordinar recorrido</div>}
                                            {pedido.zona_operativa && <div style={{fontSize:"9pt"}}>{pedido.zona_operativa}</div>}
                                            <span style={{ fontSize: '9pt', color: '#888', marginLeft: '4px' }}>#{pedido.id}</span>
                                            {formatCustomerSchedule(pedido.horario_atencion) && <div style={{fontSize:'9pt'}}>Atención: {formatCustomerSchedule(pedido.horario_atencion)}</div>}
                                            {formatCustomerSchedule(pedido.horario_entrega || pedido.horario_recepcion) && <div style={{fontSize:'9pt'}}>Recepción: {formatCustomerSchedule(pedido.horario_entrega || pedido.horario_recepcion)}</div>}
                                        </td>
                                        <td className="border-b border-gray-200 px-1 py-0.5 text-right">{Number(pedido.monto_total).toLocaleString("es-AR", {style:"currency",currency:"ARS"})}</td>
                                        <td className="border-b border-gray-200 px-1 py-0.5"></td>
                                        <td className="border-b border-gray-200 px-1 py-0.5"></td>
                                        <td className="border-b border-gray-200 px-1 py-0.5"></td>
                                        <td className="border-b border-gray-200 px-1 py-0.5"></td>
                                    </tr>
                                    {/* Fila de observaciones */}
                                    <tr>
                                        <td colSpan="6" className="border-b border-gray-300 px-1" style={{ fontSize: '9pt', fontStyle: 'italic', paddingTop: '1px', paddingBottom: '3px', color: '#999' }}>
                                            Obs: ________________________________________
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                            {/* Fila TOTAL */}
                            <tr>
                                <td className="border-b border-gray-400 px-1 py-1 font-bold text-center">TOTAL</td>
                                <td className="text-right font-bold">{data.reduce((sum, row) => sum + Number(row.monto_total || 0), 0).toLocaleString("es-AR", {style:"currency",currency:"ARS"})}</td>
                                <td className="border-b border-gray-400 px-1 py-1"></td>
                                <td className="border-b border-gray-400 px-1 py-1"></td>
                                <td className="border-b border-gray-400 px-1 py-1"></td>
                                <td className="border-b border-gray-400 px-1 py-1 text-center" style={{ paddingTop: '12px' }}>
                                    <div className="border-b border-gray-500 mx-2 mb-0.5"></div>
                                    <span style={{ fontSize: '9pt', color: '#888' }}>Firma del Repartidor</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

