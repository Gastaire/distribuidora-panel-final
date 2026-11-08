const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({console, Intl, Date, AbortController, setTimeout, clearTimeout});
vm.runInContext(fs.readFileSync('services/schedules.js','utf8') + '\n' + fs.readFileSync('services/deliveryRouting.js','utf8'),context);
const run = code => vm.runInContext(code,context);
assert.equal(run('deliveryCoordinate({latitud:"",longitud:10})'),null);
assert.equal(run('deliveryCoordinate({latitud:91,longitud:10})'),null);
assert.equal(run('deliveryDeadline({horario_atencion:JSON.stringify([{dias:[1],inicio:"08:00",fin:"12:00"}])}, new Date("2026-11-09T14:00:00Z"))'),3600);
assert.equal(run('deliveryDeadline({horario_atencion:JSON.stringify([{dias:[1],inicio:"08:00",fin:"12:00"}])}, new Date("2026-11-09T16:00:00Z"))'),null);
assert.equal(run('deliveryDeadline({horario_atencion:JSON.stringify([{dias:[0],inicio:"22:00",fin:"02:00"}])}, new Date("2026-11-09T04:00:00Z"))'),3600);
assert.equal(run('deliveryDeadline({horario_atencion:"Solo por la mañana"}, new Date())'),null);
context.fetch = async url => ({ok:true,json:async()=>url.includes('/table/') ? {code:'Ok',durations:[[0,600,60],[600,0,600],[60,600,0]]} : {code:'Ok',routes:[{geometry:{type:'LineString',coordinates:[]},distance:1000,duration:1200}]}});
(async()=>{
 const result=await run(`planDelivery([
 {id:1,cliente_id:1,latitud:-26.9,longitud:-65.3,horario_atencion:[{dias:[1],inicio:'08:00',fin:'11:15'}]},
 {id:2,cliente_id:2,latitud:-26.8,longitud:-65.2},
 {id:3,cliente_id:3},
 {id:4,cliente_id:1,latitud:-26.9,longitud:-65.3}
 ],[-26.92,-65.33],false,5,new Date('2026-11-09T14:00:00Z'))`);
 assert.equal(result.stops[0].orders[0].id,1);
 assert.equal(result.stops.length,2);
 assert.equal(result.orders.length,4);
 assert.equal(result.orders[3].id,3);
 console.log('PASS coordinates, Argentina time, active and overnight schedules, closing priority, grouped stops and missing GPS');
})().catch(error=>{console.error(error);process.exitCode=1;});
