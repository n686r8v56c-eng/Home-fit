// Home Fit read-only backup helper. Never writes to Supabase or localStorage.
import {supabase, exerciseSupabase} from '../supabase.js';
const TABLES=['mindflow_activity_moves','mindflow_activity_presets','mindflow_activity_sequences','mindflow_yoga_photos'];
const LOCAL_KEYS=['home-fit-v1','mind-flow-yoga-sequences-v1','mind-flow-yoga-custom-presets-v1'];
const valid = x => Array.isArray(x) ? x : [];
const str=x=>String(x??'').trim();
const category=x=>str(x?.activity||x?.category||x?.folders?.[0]||'전체');
const exKey=(cat,name)=>`${cat}|${str(name).toLowerCase()}`;
const makeId=()=>crypto.randomUUID();
const urlFor=v=>v?.url||v?.video_url||(v?.youtubeId?`https://www.youtube.com/watch?v=${v.youtubeId}`:'');
function previewMerged(raw,cloud){
  const exercises=[],sequences=[],bookmarks=[],lookup=new Map();
  function addExercise(item,cat){const name=str(item.name||item.nameKo||item.title||item.sanskrit);if(!name)return null;const k=exKey(cat,name);if(lookup.has(k))return lookup.get(k);const id=makeId();lookup.set(k,id);exercises.push({id,name,category:cat,tags:valid(item.tags),details:str(item.notes||item.description||item.details),image_url:str(item.image_url||''),video_url:str(item.video_url||'')});return id;}
  for(const item of valid(cloud.mindflow_activity_moves))addExercise(item,category(item));
  const seqSources=[...valid(cloud.mindflow_activity_sequences),...valid(raw.sequences),...valid(raw.videos).filter(v=>v.exercise&&Array.isArray(v.items))];
  for(const seq of seqSources){const name=str(seq.name||seq.title);if(!name)continue;const cat=category(seq);const items=valid(seq.items).map(step=>{const exerciseId=addExercise(step,str(step.activity||cat));if(!exerciseId)return null;const minutes=Number(step.minutes)||((Number(step.seconds)||0)/60)||((Number(step.beats)||8)/(Number(seq.bpm)||30));return {exerciseId,sets:Math.max(1,Number(step.sets)||1),minutes:Math.max(.1,Math.round(minutes*10)/10)};}).filter(Boolean);if(items.length)sequences.push({id:makeId(),name,category:cat,items});}
  for(const v of [...valid(raw.videos).filter(v=>!v.exercise),...Object.values(raw.exerciseBookmarkVideos||{})]){const title=str(v.title||v.name);if(!title)continue;bookmarks.push({id:makeId(),title,category:category(v),video_url:urlFor(v),note:str(v.note||v.memo)});}
  const unique=arr=>[...new Map(arr.map(x=>[exKey(x.category,x.name||x.title),x])).values()];
  return {exercises:unique(exercises),sequences:unique(sequences),bookmarks:unique(bookmarks)};
}
async function allRows(client,table,userId){const out=[];for(let from=0;from<100000;from+=500){const {data,error}=await client.from(table).select('*').eq('user_id',userId).range(from,from+499);if(error)throw error;out.push(...(data||[]));if((data||[]).length<500)return out;}throw Error(table+'에서 100,000행 제한에 도달했어요.');}
async function exportAll(){
  const notices=[]; const local={};
  for(const key of LOCAL_KEYS){try{local[key]=JSON.parse(localStorage.getItem(key)||'null')}catch(e){notices.push(key+' 읽기 실패: '+e.message)}}
  const raw=local['home-fit-v1']||{};
  const cloud={}; const users={};
  for(const [name,client] of [['homeFit',supabase],['exercise',exerciseSupabase]]){
    if(!client){notices.push(name+' Supabase 연결 없음');continue}
    try{const {data,error}=await client.auth.getUser();if(error||!data?.user)throw error||Error('로그인 상태가 아니에요');users[name]={id:data.user.id,email:data.user.email};}catch(e){notices.push(name+' 사용자 정보: '+e.message)}
  }
  if(exerciseSupabase&&users.exercise){for(const table of TABLES){try{cloud[table]=await allRows(exerciseSupabase,table,users.exercise.id)}catch(e){notices.push(table+': '+e.message);cloud[table]=[]}}}
  // Preserve raw local and remote data for future migrations, and provide a normalized
  // top-level preview compatible with Home Fit 2.0's existing JSON importer.
  const normalized=previewMerged(raw,cloud);
  const payload={format:'home-fit-legacy-backup',version:1,created_at:new Date().toISOString(),...normalized,
    original:{local,cloud,homeFit:raw},
    sourceSummary:{localVideoCount:valid(raw.videos).length,localPlanCount:valid(raw.plans).length,localCompletionCount:valid(raw.completions).length,cloudRows:Object.fromEntries(Object.entries(cloud).map(([k,v])=>[k,v.length]))},
    warnings:[...notices,'사진은 경로/메타데이터만 백업될 수 있어요. Supabase Storage 파일과 IndexedDB 사진은 별도 백업이 필요합니다.','앱별 특수 동작 유형 및 일부 메모는 2.0 변환 시 제외될 수 있습니다.']};
  const text=JSON.stringify(payload,null,2);
  const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='home-fit-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  return payload;
}
function install(){
  if(document.getElementById('hf-export-btn'))return;
  const btn=document.createElement('button');btn.id='hf-export-btn';btn.type='button';btn.textContent='전체 백업';
  Object.assign(btn.style,{position:'fixed',right:'14px',bottom:'calc(78px + env(safe-area-inset-bottom, 0px))',zIndex:'9999',background:'#7753a1',color:'#fff',border:'0',borderRadius:'18px',padding:'9px 12px',fontSize:'12px',fontWeight:'650',boxShadow:'0 2px 12px #4c326633'});
  btn.onclick=async()=>{if(!confirm('Home Fit 데이터를 읽기 전용으로 백업할까요? 원본은 변경되지 않아요.'))return;btn.disabled=true;btn.textContent='백업 중…';try{const payload=await exportAll();alert(`백업 다운로드 완료\n운동 ${payload.exercises.length}개 · 시퀀스 ${payload.sequences.length}개 · 북마크 ${payload.bookmarks.length}개\n\n주의: 사진 원본과 일부 특수 운동 데이터는 별도 확인이 필요해요.\n경고 ${payload.warnings.length}개`);}catch(e){alert('백업 실패: '+e.message)}finally{btn.disabled=false;btn.textContent='전체 백업'}};
  document.body.appendChild(btn);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
