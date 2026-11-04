export type Material = { quantity: number; unitPrice: number; returnable: boolean };
export type Operation = { materials: Material[]; outputQuantity: number; sellPrice: number; returnRate: number; stationCost: number; transportCost: number; taxRate: number; setupRate: number; focusUsed: number };
export function operation(x: Operation) {
  const values = [x.outputQuantity,x.sellPrice,x.returnRate,x.stationCost,x.transportCost,x.taxRate,x.setupRate,x.focusUsed,...x.materials.flatMap(m=>[m.quantity,m.unitPrice])];
  if(values.some(v=>!Number.isFinite(v)||v<0)||x.outputQuantity<=0||x.returnRate>=1||x.taxRate>1||x.setupRate>1) throw Error('Parâmetros inválidos');
  const purchaseCost=x.materials.reduce((s,m)=>s+m.quantity*m.unitPrice,0);
  const recoveredValue=x.materials.reduce((s,m)=>s+(m.returnable?m.quantity*x.returnRate*m.unitPrice:0),0);
  const revenue=x.outputQuantity*x.sellPrice;
  const taxes=revenue*(x.taxRate+x.setupRate);
  const cashCost=purchaseCost+x.stationCost+x.transportCost;
  const effectiveCost=cashCost-recoveredValue;
  const cashProfit=revenue-taxes-cashCost;
  const economicProfit=cashProfit+recoveredValue;
  return {purchaseCost,recoveredValue,revenue,taxes,cashCost,effectiveCost,cashProfit,economicProfit,perUnit:economicProfit/x.outputQuantity,roi:effectiveCost>0?economicProfit/effectiveCost:null,focusUsed:x.focusUsed,profitPerFocus:x.focusUsed>0?economicProfit/x.focusUsed:null};
}
