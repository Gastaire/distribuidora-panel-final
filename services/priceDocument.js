// Generates a local document from the loaded catalog. No API writes.
const loadPricePhoto = source => new Promise(resolve => {
    if (!source || !/^https?:|^data:image\//i.test(source)) { resolve(null); return; }
    const image = new Image();
    const finish = result => { clearTimeout(timeout); image.onload = image.onerror = null; resolve(result); };
    const timeout = setTimeout(() => finish(null), 2500);
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    image.src = source;
});

const generatePriceDocument = async ({ products, options }) => {
    if (!window.jspdf?.jsPDF) throw new Error('No se pudo cargar el generador. Recargá el panel e intentá nuevamente.');
    const available = p => p.controla_stock ? Number(p.stock_cantidad) > 0 : p.stock === 'Sí';
    const items = products.filter(p => !p.archivado && (options.stock !== 'in-stock' || available(p)))
        .sort((a,b) => (a.categoria || 'Sin categoría').localeCompare(b.categoria || 'Sin categoría', 'es') || (a.nombre || '').localeCompare(b.nombre || '', 'es'));
    if (!items.length) throw new Error('No hay productos para las opciones seleccionadas.');
    const doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4' });
    const magazine = options.format === 'catalog';
    const money = v => Number(v || 0).toLocaleString('es-AR', {style:'currency', currency:'ARS',minimumFractionDigits:2});
    const groups = new Map();
    items.forEach(p => { const key=p.categoria || 'Sin categoría'; if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(p); });
    const header = () => {
        doc.setFillColor(20,45,53); doc.rect(0,0,210,35,'F');
        doc.setTextColor(255); doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('DistriMaxi',14,17);
        doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(magazine?'REVISTA DE PRECIOS':'LISTA DE PRECIOS',14,26);
        doc.setFontSize(8);doc.text(new Date().toLocaleDateString('es-AR'),196,17,{align:'right'});
    };
    header();
    let y = 46;
    let firstCategory = true;
    for(const [category, rows] of groups){
        if ((magazine && !firstCategory) || y > 235) {
            doc.addPage();
            header();
            y = 46;
        }
        firstCategory = false;
        const categoryHeading = continuation => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 122, 112);
            doc.setFontSize(magazine ? 20 : 13);
            const title = doc.splitTextToSize(category, 182).slice(0, 2);
            doc.text(title, 14, y);
            y += title.length * (magazine ? 8 : 6);
            if (magazine) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(95, 113, 121);
                doc.text(continuation ? 'Continuación' : `${rows.length} productos`, 14, y);
                y += 8;
            }
            y += 3;
        };
        categoryHeading(false);
        if(!magazine){
            if(typeof doc.autoTable!=='function')throw new Error('La herramienta de tablas no está disponible. Recargá el panel.');
            doc.autoTable({startY:y,margin:{left:14,right:14,top:45,bottom:18},head:[['Código','Producto','Precio','Disponibilidad']],body:rows.map(p=>[p.codigo_sku || '—',p.nombre || '',money(p.precio_unitario),available(p)?'Disponible':'Sin stock']),theme:'striped',styles:{fontSize:9,cellPadding:3,overflow:'linebreak'},headStyles:{fillColor:[22,122,112]},columnStyles:{0:{cellWidth:26},1:{cellWidth:87},2:{cellWidth:35,halign:'right'},3:{cellWidth:34}},didDrawPage:()=>header()});
            y=doc.lastAutoTable.finalY+12;
        }else{
            for (let i = 0; i < rows.length; i += 3) {
                const pageRow = rows.slice(i, i + 3);
                const photos = await Promise.all(pageRow.map(product => loadPricePhoto(product.imagen_url)));
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                const names = pageRow.map(product => doc.splitTextToSize(product.nombre || '', 49).slice(0, 3));
                const photoSpace = photos.some(Boolean) ? 31 : 0;
                const height = 45 + photoSpace;
                if (y + height > 275) {
                    doc.addPage();
                    header();
                    y = 46;
                    categoryHeading(true);
                }
                pageRow.forEach((product, index) => {
                    const x = 14 + index * 62;
                    doc.setFillColor(244, 248, 247);
                    doc.roundedRect(x, y, 58, height, 3, 3, 'F');
                    if (photoSpace) {
                        doc.setFillColor(227, 237, 234);
                        doc.roundedRect(x + 4, y + 4, 50, 28, 2, 2, 'F');
                    }
                    const image = photos[index];
                    if (image) {
                        const scale = Math.min(50 / image.naturalWidth, 28 / image.naturalHeight);
                        const width = image.naturalWidth * scale;
                        const imageHeight = image.naturalHeight * scale;
                        try {
                            doc.addImage(image, undefined, x + 29 - width / 2, y + 18 - imageHeight / 2, width, imageHeight);
                        } catch (_) {
                            // The product remains readable if the source image cannot be embedded.
                        }
                    }
                    doc.setTextColor(95, 113, 121);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    const code = doc.splitTextToSize(String(product.codigo_sku || ''), 49)[0];
                    if (code) doc.text(code, x + 4, y + photoSpace + 6);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(24, 43, 55);
                    doc.text(names[index], x + 4, y + photoSpace + 11);
                    doc.setFillColor(22, 122, 112);
                    doc.roundedRect(x + 4, y + photoSpace + 23, 50, 10, 2, 2, 'F');
                    doc.setTextColor(255);
                    doc.setFontSize(14);
                    doc.text(money(product.precio_unitario), x + 29, y + photoSpace + 30, { align: 'center' });
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(95, 113, 121);
                    doc.text(available(product) ? 'Disponible' : 'Consultar disponibilidad', x + 4, y + photoSpace + 39);
                });
                y += height + 4;
            }
            y+=8;
        }
    }
    const pages=doc.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(105);doc.text('Precios al momento de generar. Sujetos a actualización.',14,287);doc.text(`${i} / ${pages}`,196,287,{align:'right'});}
    doc.save(`${magazine?'revista':'lista'}-precios-${new Date().toISOString().slice(0,10)}.pdf`);
};
