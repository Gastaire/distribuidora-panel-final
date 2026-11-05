const {chromium}=require('playwright');
const fs=require('fs'), path=require('path');
const babel=require('@babel/standalone');
const assert=require('node:assert/strict');
const built = process.env.QA_BUILD === '1';
const root=path.resolve(__dirname, '..', built ? 'dist' : '.');
const stats={totalRevenue:'125000',totalOrders:'10',unidadesVendidas:'12.5',topProducts:[{nombre:'Producto de prueba',totalQuantity:'12.5',totalRevenue:'125000'}],topFaltantes:[{nombre:'Producto faltante',totalFaltante:'2',vecesRemovido:'1'}],lostRevenue:'2000',lostUnits:'2',activeCustomers:'4',totalCustomers:'20',pedidos_pendientes:3,facturados_12h:2,evolucion_semanal:[{dia:new Date().toISOString().slice(0,10),ingresos:'10000'}],anio_anterior_semanal:[]};
const period = { desde: '2026-11-01', hasta: '2026-11-05', dias: 5 };
const orderRow = { id: 1, estado: 'entregado', fecha_creacion: new Date().toISOString(), nombre_comercio: 'Cliente de prueba' };
const stateRow = { estado: 'entregado', total_pedidos: '3', monto_total: '4800', clientes_unicos: '2' };
const reports = {
 'resumen-ejecutivo': { periodo: period, kpis: { total_pedidos: 3, ingresos_totales: 4800 }, por_estado: [stateRow], por_dia: [{ fecha: period.hasta, ingresos: 4800 }] },
 'diario-pedidos': { periodo: period, resumen: stateRow, por_estado: [stateRow] },
 'pedidos-entregados': { resumen: stateRow, pedidos: [orderRow] },
 'pedidos-por-vendedor': { vendedores: [{ vendedor_id: 1, vendedor: 'Equipo QA', monto_total: '4800' }] },
 'clientes-inactivos': { total: 1, dias_sin_pedido: 30, clientes: [{ id: 1, nombre_comercio: 'Comercio inactivo', telefono: '3811234567' }] },
 'productos-mas-pedidos': { total_productos: 1, order_by: 'cantidad', productos: [{ producto_id: 1, nombre_producto: 'Producto QA', unidades_vendidas: '3.5' }] },
 'faltantes-historico': { resumen_por_producto: [{ nombre_producto: 'Faltante QA', total_faltante: '2' }], registros: [] },
 'categorias-comparativa': { categorias: [{ categoria: 'Almacén', pct_del_total: '100' }], monto_global: 4800, total_categorias: 1 }
};
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let fail=false;let calls=[];
await page.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.hostname==='panel.test'){
  if(url.pathname==='/'){let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="https:\/\/unpkg.com\/@babel[^>]*><\/script>/,'').replaceAll('type="text/babel"','type="text/javascript"').replace('ReactDOM.render(<App />,', 'ReactDOM.render(React.createElement(App),');return route.fulfill({body:html,contentType:'text/html'});}
  const file=path.join(root,url.pathname);if(!fs.existsSync(file))return route.fulfill({status:404,body:'Missing'});
  const body=fs.readFileSync(file,'utf8');return route.fulfill({body:file.endsWith('.js') && !built ?babel.transform(body,{presets:[['react',{runtime:'classic'}]]}).code:body,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'application/json'});
 }
 if(url.pathname.startsWith('/api/')){
 calls.push({path:url.pathname,search:url.search,method:route.request().method(),body:route.request().postData()});
 if (url.pathname.includes('/config/cronograma') && route.request().method()==='PUT')return route.fulfill({status:500,json:{message:'Fallo simulado de guardado'}});
 if(url.pathname.includes('/reportes/')) {
  const report = reports[url.pathname.split('/').pop()];
  return route.fulfill({status:report ? 200 : 500,json:report || {message:'Reporte no disponible'}});
 }
 let body=url.pathname.endsWith('/productos') ? {productos:[],categorias:[]} : [];if(url.pathname.includes('/dashboard/stats'))body=fail?{message:'Error de prueba'}:stats;
 else if(url.pathname.endsWith('/pedidos'))body=[orderRow, {...orderRow,id:2,estado:'pendiente'}, {...orderRow,id:3,estado:'pendiente',fecha_creacion:new Date(Date.now()-14*86400000).toISOString()}];
 else if(url.pathname.endsWith('/auth/profile')||url.pathname.endsWith('/auth/me'))body={id:1,nombre:'Admin de prueba',rol:'admin'};
 return route.fulfill({status:fail&&url.pathname.includes('/dashboard/stats')?500:200,json:body});
 }
 if(url.href.includes('react@17/'))return route.fulfill({path:require.resolve('react/umd/react.development.js'),contentType:'application/javascript'});
 if(url.href.includes('react-dom@17/'))return route.fulfill({path:require.resolve('react-dom/umd/react-dom.development.js'),contentType:'application/javascript'});
 if(url.href.includes('chart.js') && process.env.QA_REAL_CHARTS === '1')return route.continue();
 if(url.href.includes('chart.js'))return route.fulfill({body:'window.Chart=class{static instances=[];constructor(canvas,config){this.canvas=canvas;this.config=config;this.destroyed=false;Chart.instances.push(this)}destroy(){this.destroyed=true}};',contentType:'application/javascript'});
 if(url.href.includes('jspdf'))return route.continue();
 if(url.href.includes('tailwindcss'))return route.continue();
 return route.fulfill({body:'',contentType:'application/javascript'});
});
await page.addInitScript(()=>{localStorage.setItem('token','test-token');localStorage.setItem('user',JSON.stringify({id:1,nombre:'Admin de prueba',rol:'admin'}));});
await page.goto('http://panel.test', { waitUntil:'networkidle' });
const dashboardReady = () => page.locator('.kpi-card').first().waitFor();
await dashboardReady();
assert.equal(await page.locator('.kpi-card').count(),9);
assert.match(await page.locator('.kpi-card').last().innerText(), /2.000/);
assert.match(await page.locator('.kpi-card').nth(7).innerText(), /12,5/);
const expectCharts = (count) => page.waitForFunction(count => Object.values(Chart.instances).filter(c => !c.destroyed).length === count, count);
await expectCharts(3);
await page.getByRole('button',{name:'Actualizar',exact:true}).click();
await dashboardReady();await expectCharts(3);
await page.getByRole('button',{name:'Últimos 7 días',exact:true}).click();
await dashboardReady();await expectCharts(3);
await page.getByRole('button',{name:'Presencial',exact:true}).click();
await dashboardReady();assert.equal(await page.locator('.kpi-card').count(),4);
await expectCharts(1);
await page.getByRole('button',{name:'Pedidos de la app',exact:true}).click();await dashboardReady();
fail=true;await page.getByRole('button',{name:'Actualizar',exact:true}).click();
await page.getByRole('alert').waitFor();assert.equal(await page.locator('.kpi-card').count(),0,'No stale KPI on error');
fail=false;await page.getByRole('button',{name:'Actualizar',exact:true}).click();await dashboardReady();

await page.locator('#dashboard-desde').fill('');await page.getByRole('alert').waitFor();
assert.equal(await page.locator('.kpi-card').count(),0);assert.ok(calls.filter(c=>c.path.includes('/dashboard/stats')).every(c=>new URLSearchParams(c.search).get('startDate') && new URLSearchParams(c.search).get('endDate')), 'Empty dates never reach API');
await page.getByRole('button',{name:'Hoy',exact:true}).click();await dashboardReady();
await page.getByRole('button',{name:'Importar',exact:true}).click();
await page.getByRole('dialog',{name:'Importar ventas presenciales'}).waitFor();
await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
for (const [nav,label,button] of [['Productos','Producto','Agregar'],['Clientes','Cliente','Agregar'],['Usuarios','Usuario','Agregar Usuario']]) {
 if(nav==='Usuarios')await page.getByRole('button',{name:'Administración',exact:true}).click();
 await page.getByRole('navigation').getByRole('button',{name:nav,exact:true}).click();
 await page.getByRole('button',{name:button,exact:true}).click();
 const dialog=page.getByRole('dialog',{name:label,exact:true});await dialog.waitFor();
 await page.waitForFunction(()=>document.querySelector('[role="dialog"]').contains(document.activeElement));
 const controls=dialog.locator('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]');
 await controls.last().focus();await page.keyboard.press('Tab');assert.ok(await controls.first().evaluate(el=>el===document.activeElement),'Tab wraps within dialog');
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await page.waitForFunction(name=>document.activeElement?.textContent.trim()===name,button); // Passive effect cleanup restores focus.
 // Verify that the original create endpoint and payload still run.
 await page.getByRole('button',{name:button,exact:true}).click();
 if(label==='Producto'){await dialog.locator('[name="nombre"]').fill('Producto QA');await dialog.locator('[name="precio_unitario"]').fill('1500');}
 if(label==='Cliente')await dialog.locator('[name="nombre_comercio"]').fill('Comercio QA');
 if(label==='Usuario'){await dialog.locator('[name="nombre"]').fill('Usuario QA');await dialog.locator('[name="email"]').fill('qa@example.test');await dialog.locator('[name="password"]').fill('clave-de-prueba');}
 await dialog.getByRole('button',{name:`Guardar ${label}`,exact:true}).click();
 await dialog.waitFor({state:'detached'});
 assert.ok(calls.some(c=>c.method==='POST'&&c.path.endsWith('/'+({Producto:'productos',Cliente:'clientes',Usuario:'usuarios'}[label]))));
}
await page.getByRole('navigation').getByRole('button',{name:'Resumen',exact:true}).click();await dashboardReady();
// Local document generation uses synthetic catalog data, never production records.
if (process.env.QA_DOCUMENTS === '1') {
 for(const format of ['price-list','catalog']){
  const download=page.waitForEvent('download');
  await page.evaluate(format=>{
   const canvas=document.createElement('canvas');canvas.width=100;canvas.height=75;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#008378';ctx.fillRect(15,10,70,55);
   return generatePriceDocument({products:Array.from({length:30},(_,i)=>({id:i,nombre:`Producto de prueba ${i} con descripción comercial extendida`,codigo_sku:`SKU-${i}`,categoria:i<16?'Almacén':'Bebidas y especialidades',precio_unitario:1234.56+i,stock:'Sí',imagen_url:i===0?canvas.toDataURL():null})),options:{format,stock:'in-stock'}});
  },format);
  await (await download).saveAs(`/tmp/qa-${format}.pdf`);
 }
}
await page.getByRole('navigation').getByRole('button',{name:'Zonas',exact:true}).click();
await page.locator('[role="button"][aria-disabled="false"]').last().click();
await page.getByRole('dialog',{name:'Programar zonas de entrega'}).waitFor();
await page.getByPlaceholder('Seleccioná arriba o escribí otro destino').fill('Zona de prueba');
await page.getByRole('button',{name:'Guardar',exact:true}).click();
await page.getByRole('dialog').getByRole('alert').waitFor();
assert.equal(await page.getByRole('dialog').count(),1,'Failed zone save keeps editor open');
await page.keyboard.press('Escape');
await page.getByRole('navigation').getByRole('button',{name:'Reportes',exact:true}).click();
await page.getByRole('button',{name:'Operación diaria',exact:true}).click();
await page.getByText('Volumen por estado',{exact:true}).waitFor();
for (const [tab, content] of [
 ['Vendedores', 'Rendimiento por vendedor'], ['Entregas', 'Cliente de prueba'], ['Recuperar clientes', 'Comercio inactivo'],
 ['Demanda', 'Mayor demanda por unidades'], ['Faltantes', 'Faltante QA'], ['Categorías', 'Participación por categoría']
]) {
 await page.getByRole('navigation',{name:'Secciones de reportes'}).getByRole('button',{name:tab,exact:true}).click();
 await page.getByText(content,{exact:true}).first().waitFor();
}
await page.getByRole('navigation',{name:'Navegación principal'}).getByRole('button',{name:'Pedidos',exact:true}).click();
const pendingCard = page.getByRole('button',{name:/Por atender/});
await page.waitForFunction(() => [...document.querySelectorAll('.operations-summary strong')].some(el => el.textContent === '1'));
assert.match(await pendingCard.innerText(), /1/);
await page.getByLabel('Pedidos creados en').selectOption('30');
assert.match(await pendingCard.innerText(), /2/);
assert.ok(calls.some(c=>c.path.endsWith('/reportes/diario-pedidos')));
await page.getByRole('navigation').getByRole('button',{name:'Resumen',exact:true}).click();await dashboardReady();
await page.screenshot({path:process.env.QA_SCREENSHOT || '/tmp/distrimaxi-panel-desktop.png',fullPage:true,animations:'disabled'});
await page.setViewportSize({width:390,height:844});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow on mobile');
await page.getByRole('button',{name:'Abrir navegación'}).click();
await page.getByRole('navigation').getByRole('button',{name:'Clientes',exact:true}).click();
await page.getByRole('button',{name:'Agregar',exact:true}).click();
await page.getByRole('dialog',{name:'Cliente',exact:true}).waitFor();
await page.screenshot({path:'/tmp/distrimaxi-panel-mobile.png',fullPage:true,animations:'disabled'});
await page.keyboard.press('Escape');
console.log('PASS: KPI, refresh, dates, source switching, failure recovery, modal keyboard/focus, create endpoints, mobile navigation and overflow.');
await browser.close();assert.equal(errors.length,0,errors.join('\n')); 
})();
