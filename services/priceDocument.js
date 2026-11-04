// Generates a local document from the loaded catalog. No API writes.
const generatePriceDocument = ({ products, options }) => {
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
    header(); let y=46;
    for(const [category, rows] of groups){
        if(y>235){doc.addPage();header();y=46;}
        doc.setTextColor(22,122,112);doc.setFont('helvetica','bold');doc.setFontSize(13);
        const title=doc.splitTextToSize(category,180);doc.text(title,14,y); y+=title.length*6+3;
        if(!magazine){
            if(typeof doc.autoTable!=='function')throw new Error('La herramienta de tablas no está disponible. Recargá el panel.');
            doc.autoTable({startY:y,margin:{left:14,right:14,top:45,bottom:18},head:[['Código','Producto','Precio','Disponibilidad']],body:rows.map(p=>[p.codigo_sku || '—',p.nombre || '',money(p.precio_unitario),available(p)?'Disponible':'Sin stock']),theme:'striped',styles:{fontSize:9,cellPadding:3,overflow:'linebreak'},headStyles:{fillColor:[22,122,112]},columnStyles:{0:{cellWidth:26},1:{cellWidth:87},2:{cellWidth:35,halign:'right'},3:{cellWidth:34}},didDrawPage:()=>header()});
            y=doc.lastAutoTable.finalY+12;
        }else{
            for(let i=0;i<rows.length;i+=2){
                const pair=rows.slice(i,i+2);
                doc.setFont('helvetica','bold');doc.setFontSize(11);
                const names=pair.map(p=>doc.splitTextToSize(p.nombre || '',75));
                const height=Math.max(48,...names.map(n=>n.length*5+34));
                if(y+height>275){doc.addPage();header();y=46;doc.setFontSize(10);doc.setTextColor(22,122,112);doc.text(doc.splitTextToSize(category,180),14,y);y+=title.length*6+3;}
                pair.forEach((p,j)=>{const x=14+j*94;doc.setFillColor(244,248,247);doc.roundedRect(x,y,88,height,3,3,'F');doc.setTextColor(95,113,121);doc.setFontSize(8);doc.setFont('helvetica','normal');doc.text(doc.splitTextToSize(String(p.codigo_sku || 'CATÁLOGO'),75)[0],x+6,y+8);doc.setTextColor(24,43,55);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(names[j],x+6,y+17);doc.setTextColor(22,122,112);doc.setFontSize(17);doc.text(money(p.precio_unitario),x+6,y+height-13);doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(95,113,121);doc.text(available(p)?'Disponible':'Consultar disponibilidad',x+6,y+height-6);});
                y+=height+5;
            }
            y+=8;
        }
    }
    const pages=doc.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(105);doc.text('Precios al momento de generar. Sujetos a actualización.',14,287);doc.text(`${i} / ${pages}`,196,287,{align:'right'});}
    doc.save(`${magazine?'revista':'lista'}-precios-${new Date().toISOString().slice(0,10)}.pdf`);
};
