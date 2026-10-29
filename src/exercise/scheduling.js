const bounded=(n,fallback)=>Number.isFinite(Number(n))&&Number(n)>0?Math.min(86400,Number(n)):fallback;
const STRETCH_ACTIVITIES=new Set(['요가','SNPE','매트 필라테스','골반순환','스트레칭','폼롤러']);
export const activityKind=activity=>activity==='마사지'?'skin':STRETCH_ACTIVITIES.has(activity)?'stretch':'workout';
export function makeSequence({id,name,title,activity,items,steps,bpm=30,language='ko',...extra}){
 const source=items||steps||[];
 const normalized=source.map((item,index)=>({...item,
  name:item.name||item.title||`동작 ${index+1}`,
  seconds:item.reps!=null?0:Math.max(1,Math.round(bounded(item.seconds, bounded(item.beats,8)*60/bounded(bpm,30)))),
 }));
 return {...extra,id:`exercise:${activity}:${id}`,sourceId:id,title:name||title||'운동 시퀀스',activity,
  items:normalized,bpm,language,kind:activityKind(activity),folders:[activity],
  minutes:Math.ceil(normalized.reduce((sum,item)=>sum+item.seconds,0)/60),exercise:true};
}
export function addSequencePlan(data,date,sequence,kind){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!sequence.items?.length)throw new Error('날짜와 동작을 확인해 주세요.');
 const snapshot=JSON.parse(JSON.stringify(sequence));
 const record={date,videoId:sequence.id,kind:kind||sequence.kind,sequence:snapshot};
 return {...data,plans:data.plans.some(p=>p.date===date&&p.videoId===sequence.id)
  ?data.plans.map(p=>p.date===date&&p.videoId===sequence.id?record:p):[...data.plans,record]};
}
export function toggleCompletion(data,date,id){
 const done=data.completions.some(c=>c.date===date&&c.videoId===id);
 const plan=data.plans.find(p=>p.date===date&&p.videoId===id);
 return {...data,completions:done?data.completions.filter(c=>!(c.date===date&&c.videoId===id)):
  [...data.completions,{date,videoId:id,createdAt:new Date().toISOString(),...(plan?.sequence?{sequence:plan.sequence,kind:plan.kind}:{})}]};
}
export function mergeYogaData(current={},incoming={}){
 const merge=(a=[],b=[])=>{const ids=new Set(a.map(x=>x.id));return [...a,...b.filter(x=>!ids.has(x.id)&&ids.add(x.id))]};
 return {...current,sequences:merge(current.sequences,incoming.sequences),presets:merge(current.presets,incoming.presets)};
}
