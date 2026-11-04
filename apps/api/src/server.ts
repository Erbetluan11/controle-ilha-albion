import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {z} from 'zod';
const app=express();
app.use(helmet());
app.use(cors({origin:(process.env.WEB_ORIGINS||'http://localhost:5173').split(',')}));
app.use(rateLimit({windowMs:60000,limit:60,standardHeaders:true,legacyHeaders:false}));
const servers={west:'https://west.albion-online-data.com',europe:'https://europe.albion-online-data.com',east:'https://east.albion-online-data.com'};
const cities=['Thetford','Fort Sterling','Lymhurst','Bridgewatch','Martlock','Caerleon','Brecilien'] as const;
const query=z.object({server:z.enum(['west','europe','east']).default('west'),items:z.string().min(1).max(1200).regex(/^[A-Z0-9_@,]+$/),city:z.enum(cities).optional()});
type Entry={data:unknown;fetchedAt:number};
const cache=new Map<string,Entry>();
const inflight=new Map<string,Promise<Entry>>();
let cooldown=0;
let calls:number[]=[];
async function upstream(key:string,url:string):Promise<Entry>{
  const current=inflight.get(key);if(current)return current;
  const task=(async()=>{
    const now=Date.now();calls=calls.filter(t=>now-t<300000);
    if(now<cooldown||calls.length>=240||calls.filter(t=>now-t<60000).length>=80)throw Error('UPSTREAM_BUDGET');
    calls.push(now);
    const r=await fetch(url,{signal:AbortSignal.timeout(15000)});
    if(r.status===429){cooldown=Date.now()+300000;throw Error('UPSTREAM_LIMIT')}
    if(!r.ok)throw Error('UPSTREAM_HTTP_'+r.status);
    const data=await r.json();if(!Array.isArray(data))throw Error('UPSTREAM_FORMAT');
    const entry={data,fetchedAt:Date.now()};
    if(cache.size>=500)cache.delete(cache.keys().next().value!);
    cache.set(key,entry);return entry;
  })();inflight.set(key,task);
  try{return await task}finally{inflight.delete(key)}
}
app.get('/api/health',(_req,res)=>{res.json({status:'ok',version:'0.1.0',source:'Albion Online Data Project'})});
app.get('/api/market/:kind',async(req,res)=>{
  const parsed=query.safeParse(req.query);const kind=req.params.kind;
  if(!parsed.success||!['prices','history'].includes(kind)){res.status(400).json({error:'Consulta inválida'});return}
  const q=parsed.data;const ids=[...new Set(q.items.split(','))].sort();
  if(ids.length>30||ids.some(i=>!i)){res.status(400).json({error:'Use de 1 a 30 itens'});return}
  const url=new URL(`${servers[q.server]}/api/v2/stats/${kind}/${ids.join(',')}.json`);
  url.searchParams.set('locations',q.city||cities.join(','));url.searchParams.set('qualities','1');
  if(kind==='history')url.searchParams.set('time-scale','24');
  const key=url.toString(),old=cache.get(key),ttl=kind==='prices'?120000:900000;
  function payload(e:Entry,stale:boolean){return {data:e.data,source:'Albion Online Data Project',server:q.server,fetchedAt:new Date(e.fetchedAt).toISOString(),stale,notice:stale?'Cache de contingência: dados não atualizados.':null}}
  if(old&&Date.now()-old.fetchedAt<ttl){res.json(payload(old,false));return}
  try{const e=await upstream(key,url.toString());res.json(payload(e,false))}
  catch(e){if(old&&Date.now()-old.fetchedAt<86400000){res.json(payload(old,true));return}console.error(e);res.status(503).json({error:'Fonte indisponível ou limite atingido. Tente novamente mais tarde.',source:'Albion Online Data Project'})}
});
app.listen(Number(process.env.PORT||3001),()=>console.log('Albion Companion API iniciada'));
