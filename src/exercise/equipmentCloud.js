import {yogaSupabase as db,YOGA_BUCKET} from './supabaseYoga';
import {studioUser,uploadStudioPhoto as upload} from './studioCloud';
const keys={'바벨':'barbell','덤벨':'dumbbell','머신':'machine'};
export const uploadStudioPhoto=async(activity,file)=>({...await upload(keys[activity],file),bucket:'mindflow-studio-photos'});
export async function loadStudio(activity,onPhotos){
 const user=await studioUser();
 const {data,error}=await db.from('mindflow_studio_data').select('data').eq('user_id',user.id).eq('studio',keys[activity]).maybeSingle();if(error)throw error;
 let record=data?.data||{};
 // Copy legacy activity records once; originals remain untouched.
 if(!record.legacyImported){
  const results=await Promise.all(['moves','sequences','presets'].map(kind=>db.from('mindflow_activity_'+kind).select('*').eq('user_id',user.id).eq('activity',activity)));
  const failure=results.find(r=>r.error);if(failure)throw failure.error;
  const convert=x=>({...x,id:x.id,name:x.name,description:x.description||x.notes||'',major:x.major||'미분류',minor:x.minor||'미분류',imagePath:x.imagePath||x.image_path||'',bucket:x.bucket||YOGA_BUCKET,weight:x.weight??0,reps:x.reps??10});
  const merge=(old=[],incoming=[])=>{const ids=new Set(old.map(x=>x.id));return [...old,...incoming.filter(x=>!ids.has(x.id))]};
  record={...record,legacyImported:true,exercises:merge(record.exercises,results[0].data.map(convert)),saved:merge(record.saved,[...results[1].data,...results[2].data.map(x=>({...x,id:'preset:'+x.id}))].map(x=>({...x,items:(x.items||[]).map(convert)})))};
 }
 const items=[...(record.exercises||[]),...(record.saved||[]).flatMap(s=>s.items||[])];
 void Promise.all(items.filter(x=>x.imagePath).map(async x=>{const {data}=await db.storage.from(x.bucket||'mindflow-studio-photos').createSignedUrl(x.imagePath,86400);return [x.imagePath,data?.signedUrl||'']})).then(pairs=>onPhotos?.(Object.fromEntries(pairs)));
 return record;
}
export async function saveStudio(activity,record){
 const user=await studioUser();const clean=x=>{const {image,...rest}=x;return rest};
 const data={...record,exercises:(record.exercises||[]).map(clean),saved:(record.saved||[]).map(s=>({...s,items:(s.items||[]).map(clean)}))};
 const {error}=await db.from('mindflow_studio_data').upsert({user_id:user.id,studio:keys[activity],data,updated_at:new Date().toISOString()},{onConflict:'user_id,studio'});if(error)throw error;
}
