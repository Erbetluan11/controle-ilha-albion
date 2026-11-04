import {test,expect} from 'vitest';
import {operation, type Operation} from './index.js';
const base:Operation={materials:[{quantity:100,unitPrice:10,returnable:true}],outputQuantity:50,sellPrice:30,returnRate:.2,stationCost:50,transportCost:0,taxRate:.05,setupRate:0,focusUsed:100};
test('separa fluxo de caixa e estoque recuperado',()=>{const r=operation(base);expect(r.cashProfit).toBe(375);expect(r.recoveredValue).toBe(200);expect(r.economicProfit).toBe(575);expect(r.profitPerFocus).toBe(5.75)});
test('material sem retorno',()=>expect(operation({...base,materials:[{quantity:100,unitPrice:10,returnable:false}]}).recoveredValue).toBe(0));
test('sem foco não divide por zero',()=>expect(operation({...base,focusUsed:0}).profitPerFocus).toBeNull());
test('rejeita retorno impossível',()=>expect(()=>operation({...base,returnRate:1})).toThrow());
