import {createClient} from '@supabase/supabase-js';
import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {z} from 'zod';

export const db=import.meta.env.VITE_SUPABASE_URL&&import.meta.env.VITE_SUPABASE_ANON_KEY?createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY):null;
export const usePrefs=create(persist<{server:string;city:string;sound:boolean;volume:number;light:boolean;collapsed:boolean;set:(x:Partial<{server:string;city:string;sound:boolean;volume:number;light:boolean;collapsed:boolean}>)=>void}>((set)=>({server:'west',city:'Thetford',sound:false,volume:.1,light:false,collapsed:false,set:x=>set(x)}),{name:'ac-preferences-v1'}));
export const cities=['Thetford','Fort Sterling','Lymhurst','Bridgewatch','Martlock','Caerleon','Brecilien'];
export const catalog=[['T5_CABBAGE','Repolho T5'],['T5_FARM_CABBAGE_SEED','Semente de repolho T5'],['T4_ORE','Minério T4'],['T4_METALBAR','Barra T4'],['T4_WOOD','Madeira T4'],['T4_PLANKS','Tábuas T4'],['T4_FIBER','Fibra T4'],['T4_CLOTH','Tecido T4'],['T4_HIDE','Pele T4'],['T4_LEATHER','Couro T4'],['T4_ROCK','Pedra T4'],['T4_STONEBLOCK','Bloco T4']];

export class MarketError extends Error {
  constructor(message:string,public status:number|null=null){super(message);this.name='MarketError'}
}
const envelope=z.object({data:z.array(z.any()),source:z.string(),server:z.string(),fetchedAt:z.string().datetime(),stale:z.boolean(),notice:z.string().nullable().optional()});
const priceRow=z.object({item_id:z.string(),city:z.string(),quality:z.number(),sell_price_min:z.number().finite(),buy_price_max:z.number().finite(),sell_price_min_date:z.string(),buy_price_max_date:z.string()}).passthrough();
const historyRow=z.object({data:z.array(z.object({timestamp:z.string(),avg_price:z.number().finite()}).passthrough())}).passthrough();
export async function market(kind:string,items:string,server:string,city?:string){
  const base=String(import.meta.env.VITE_API_URL||'').trim().replace(/\/+$/,'');
  if(!base)throw new MarketError('A URL da API não foi configurada no build do site.');
  let endpoint:URL;
  try{endpoint=new URL(base)}catch{throw new MarketError('A URL configurada para a API é inválida.')}
  if(!['http:','https:'].includes(endpoint.protocol))throw new MarketError('Protocolo da API inválido.');
  if(!['prices','history'].includes(kind)||!['west','europe','east'].includes(server))throw new MarketError('Consulta de mercado inválida.');
  const ids=items.trim().toUpperCase().split(',');
  if(ids.length<1||ids.length>30||ids.some(id=>!/^[A-Z0-9_@]+$/.test(id)))throw new MarketError('Informe de 1 a 30 IDs de item válidos.');
  if(city&&!cities.includes(city))throw new MarketError('Cidade inválida.');
  const params=new URLSearchParams({items:ids.join(','),server});
  if(city)params.set('city',city);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),90000);
  try{
    const response=await fetch(`${base}/api/market/${kind}?${params}`,{signal:controller.signal});
    const text=await response.text();
    let body:unknown;
    try{body=JSON.parse(text)}catch{
      if(!response.ok)throw new MarketError(`A API retornou HTTP ${response.status}. Ela pode estar iniciando; tente novamente.`,response.status);
      throw new MarketError('A API retornou uma resposta que não é JSON. Confira a URL e tente novamente.',response.status);
    }
    if(!response.ok){
      const upstream=z.object({error:z.string().max(500)}).safeParse(body);
      const message=response.status===429?'Muitas consultas. Aguarde um minuto e tente novamente.':response.status===503?'Os dados de mercado estão temporariamente indisponíveis. Tente novamente mais tarde.':upstream.success?upstream.data.error:`Falha na API (HTTP ${response.status}).`;
      throw new MarketError(message,response.status);
    }
    const parsed=envelope.safeParse(body);
    if(!parsed.success)throw new MarketError('Formato inesperado na resposta da API. Nenhum preço foi estimado.');
    const valid=kind==='prices'?z.array(priceRow).safeParse(parsed.data.data):z.array(historyRow).safeParse(parsed.data.data);
    if(!valid.success)throw new MarketError('Os dados retornados pelo mercado são inválidos. Tente novamente mais tarde.');
    return parsed.data;
  }catch(error){
    if(error instanceof MarketError)throw error;
    if(controller.signal.aborted)throw new MarketError('A API não respondeu em 90 segundos. O serviço pode estar iniciando; tente novamente.');
    throw new MarketError('Não foi possível conectar à API. Verifique sua conexão e a configuração WEB_ORIGINS do backend e tente novamente.');
  }finally{clearTimeout(timer)}
}

let audio:AudioContext|undefined;
export function clickSound(){const p=usePrefs.getState();if(!p.sound)return;try{audio??=new AudioContext();void audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type='sine';o.frequency.setValueAtTime(640,t);o.frequency.exponentialRampToValueAtTime(310,t+.06);g.gain.setValueAtTime(Math.max(.001,Math.min(p.volume,.3)),t);g.gain.exponentialRampToValueAtTime(.001,t+.07);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.08)}catch{}}
export const money=(v:number|null|undefined)=>v==null?'—':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(v);
export function observed(s?:string){if(!s||s.startsWith('0001'))return {text:'Sem data',old:true};const d=new Date(/Z$|[+-]\d{2}:\d{2}$/i.test(s)?s:s+'Z');return {text:isNaN(+d)?'Sem data':d.toLocaleString('pt-BR'),old:isNaN(+d)||Date.now()-+d>86400000}}
