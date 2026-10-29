import yogaData from './data/yoga-poses.json';
import {importYogaStudio} from './yogaStudioData.mjs';
import {yogaSupabase as db,YOGA_BUCKET} from './supabaseYoga';
import {studioUser,uploadStudioPhoto as upload} from './studioCloud';
const keys={'스트레칭':'stretching','매트 필라테스':'mat-pilates','요가':'yoga'};
export const uploadStudioPhoto=async(activity,file)=>({...await upload(keys[activity],file),bucket:'mindflow-studio-photos'});
export async function loadStudio(activity,onPhotos,context){
 const user=await studioUser();
 let record=context.localData?.activityStudios?.[keys[activity]]||{};
 // Copy legacy activity records once; originals remain untouched.
 if(activity==='요가'){
  const paths={};
  const {data:rows,error}=await db.from('mindflow_yoga_photos').select('pose_id,storage_path').eq('user_id',user.id);
  if(!error)for(const row of rows||[])paths[row.pose_id]=row.storage_path;
  // Older uploads may exist only in storage, without a photo-table row.
  const {data:folders}=await db.storage.from(YOGA_BUCKET).list(user.id,{limit:1000});
  const known=new Set(yogaData.poses.map(p=>p.id));
  await Promise.all((folders||[]).filter(f=>known.has(f.name)&&!paths[f.name]).map(async f=>{
   const {data:files}=await db.storage.from(YOGA_BUCKET).list(`${user.id}/${f.name}`,{limit:100,sortBy:{column:'created_at',order:'desc'}});
   const file=files?.find(x=>/\.(jpe?g|png|webp)$/i.test(x.name));
   if(file)paths[f.name]=`${user.id}/${f.name}/${file.name}`;
  }));
  if(!record.legacyImported)record=importYogaStudio(yogaData.poses,context.localData,record,paths);
  record={...record,exercises:(record.exercises||[]).map(x=>!x.imagePath&&paths[x.id]?{...x,imagePath:paths[x.id],bucket:YOGA_BUCKET}:x)};
 }
 if(activity!=='요가'&&!record.legacyImported){
  const results=await Promise.all(['moves','sequences','presets'].map(kind=>db.from('mindflow_activity_'+kind).select('*').eq('user_id',user.id).eq('activity',activity)));
  const failure=results.find(r=>r.error);if(failure)throw failure.error;
  const convert=x=>({...x,id:x.id,name:x.name,tags:x.tags||[],description:x.description||x.notes||'',major:x.major||x.group_name||'미분류',minor:x.minor||'미분류',imagePath:x.imagePath||x.image_path||'',bucket:x.bucket||YOGA_BUCKET,seconds:Math.max(1,Math.round(Number(x.seconds)||((Number(x.beats)||8)*2)))});
  const merge=(old=[],incoming=[])=>{const ids=new Set(old.map(x=>x.id));return [...old,...incoming.filter(x=>!ids.has(x.id))]};
  record={...record,legacyImported:true,exercises:merge(record.exercises,results[0].data.map(convert)),saved:merge(record.saved,[...results[1].data,...results[2].data.map(x=>({...x,id:'preset:'+x.id}))].map(x=>({...x,items:(x.items||[]).map((item,i)=>({...convert(item),exerciseId:item.id,id:`${x.id}:step:${i}`}))})))};
 }
 const items=[...(record.exercises||[]),...(record.saved||[]).flatMap(s=>s.items||[])];
 void Promise.all(items.filter(x=>x.imagePath).map(async x=>{const {data}=await db.storage.from(x.bucket||'mindflow-studio-photos').createSignedUrl(x.imagePath,86400);return [x.imagePath,data?.signedUrl||'']})).then(pairs=>onPhotos?.(Object.fromEntries(pairs)));
 return record;
}
export async function saveStudio(activity,record,context){
 const clean=x=>{const {image,...rest}=x;return image&&!x.imagePath&&!/^https?:/.test(image)?{...rest,image}:rest};
 const data={...record,exercises:(record.exercises||[]).map(clean),saved:(record.saved||[]).map(s=>({...s,items:(s.items||[]).map(clean)}))};
 context.onLocalChange(old=>({...old,activityStudios:{...(old.activityStudios||{}),[keys[activity]]:data}}));
}
