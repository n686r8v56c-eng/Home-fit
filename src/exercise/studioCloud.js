import {yogaSupabase as supabase} from './supabaseYoga';
const BUCKET='mindflow-studio-photos';

export async function studioUser(){
  const {data,error}=await supabase.auth.getUser();
  if(error)throw error;
  if(!data?.user)throw new Error('먼저 Mind Flow에 로그인해 주세요.');
  return data.user;
}
// Load metadata first. Photo URLs are hydrated independently so they never block the screen.
export async function loadStudio(studio,onPhotos){
  const user=await studioUser();
  const {data,error}=await supabase.from('mindflow_studio_data')
    .select('data').eq('user_id',user.id).eq('studio',studio).maybeSingle();
  if(error)throw error;
  const record=data?.data||{};
  const normalized={...record,exercises:record.exercises||[],saved:record.saved||[]};
  const paths=new Set();
  normalized.exercises.forEach(x=>{if(x.imagePath)paths.add(x.imagePath)});
  normalized.saved.forEach(s=>(s.items||[]).forEach(x=>{if(x.imagePath)paths.add(x.imagePath)}));
  if(typeof onPhotos==='function'){
    // Never delay the initial screen for Storage signing requests.
    void Promise.all([...paths].map(async path=>{
      const {data:signed,error:e}=await supabase.storage.from(BUCKET).createSignedUrl(path,86400);
      return [path,!e?signed?.signedUrl||'':''];
    })).then(entries=>onPhotos(Object.fromEntries(entries))).catch(()=>{});
    return normalized;
  }
  const entries=await Promise.all([...paths].map(async path=>{
    const {data:signed,error:e}=await supabase.storage.from(BUCKET).createSignedUrl(path,86400);
    return [path,!e?signed?.signedUrl||'':''];
  }));
  const urls=Object.fromEntries(entries);
  const withImage=x=>({...x,image:x.imagePath?(urls[x.imagePath]||''):''});
  return {...normalized,exercises:normalized.exercises.map(withImage),saved:normalized.saved.map(s=>({...s,items:(s.items||[]).map(withImage)}))};
}
export async function saveStudio(studio,record){
  const user=await studioUser();
  const stripImage=x=>{const {image,...other}=x;return other};
  const clean={...record,exercises:(record.exercises||[]).map(stripImage),saved:(record.saved||[]).map(s=>({...s,items:(s.items||[]).map(stripImage)}))};
  const {error}=await supabase.from('mindflow_studio_data').upsert({user_id:user.id,studio,data:clean,updated_at:new Date().toISOString()},{onConflict:'user_id,studio'});
  if(error)throw error;
}
export async function uploadStudioPhoto(studio,file){
  const user=await studioUser();
  if(!file?.type?.startsWith('image/'))throw new Error('이미지를 선택해 주세요.');
  const url=URL.createObjectURL(file);
  const blob=await new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const factor=Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      canvas.toBlob(b=>b?resolve(b):reject(new Error('사진 변환 실패')),'image/jpeg',.82);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('사진을 읽을 수 없어요.'))};img.src=url;
  });
  const path=`${user.id}/${studio}/${crypto.randomUUID()}.jpg`;
  const {error}=await supabase.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false});
  if(error)throw error;
  const {data,error:signedError}=await supabase.storage.from(BUCKET).createSignedUrl(path,60*60*24);
  if(signedError)throw signedError;
  return {imagePath:path,image:data.signedUrl};
}
