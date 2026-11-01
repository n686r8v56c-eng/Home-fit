// Non-destructive legacy Home Fit backup mapper. Never modifies the source.
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idFor=(v)=>UUID_RE.test(String(v||''))?v:crypto.randomUUID();
const clean=(s)=>String(s||'').trim();
const category=(v)=>clean(v?.activity||v?.category||v?.folders?.[0]||'전체');
const youtubeUrl=(v)=>v?.url||v?.video_url||(v?.youtubeId?`https://www.youtube.com/watch?v=${v.youtubeId}`:'');
export function normalizeLegacy(raw){
  const root=raw?.data&&typeof raw.data==='object'?raw.data:raw;
  if(!root||typeof root!=='object'||Array.isArray(root))throw Error('올바른 JSON 백업 파일이 아니에요.');
  const legacy=!!(root.videos||root.completions||root.folders||root.exerciseBookmarkVideos||root.presets);
  if(!legacy&&!['exercises','sequences','bookmarks'].some(k=>Array.isArray(root[k])))throw Error('지원하지 않는 백업 구조예요.');
  const exerciseSources=[...(Array.isArray(root.exercises)?root.exercises:[])];
  const sequenceSources=[...(Array.isArray(root.sequences)?root.sequences:[]),...(root.videos||[]).filter(v=>v.exercise&&Array.isArray(v.items))];
  const bookmarkSources=[...(root.bookmarks||[]),...(root.videos||[]).filter(v=>!v.exercise),...Object.values(root.exerciseBookmarkVideos||{})];
  const exercises=[], sequences=[], bookmarks=[];
  const exIds=new Map();
  const exByKey=new Map();
  function ensureExercise(step,cat){
    const title=clean(step.name||step.title||step.pose||step.asana||step.exerciseName);
    if(!title)return null;
    const k=`${cat}|${title.toLowerCase()}`;
    if(exByKey.has(k))return exByKey.get(k);
    const id=crypto.randomUUID();exByKey.set(k,id);
    exercises.push({id,name:title,category:cat,tags:[],details:clean(step.details||step.description),image_url:clean(step.image_url||step.imageUrl),video_url:clean(step.video_url)});
    return id;
  }
  for(const x of exerciseSources){if(!clean(x.name||x.title))continue;const id=idFor(x.id);exIds.set(x.id,id);exercises.push({id,name:clean(x.name||x.title),category:category(x),tags:Array.isArray(x.tags)?x.tags.map(clean):[],details:clean(x.details||x.description),image_url:clean(x.image_url||x.imageUrl),video_url:clean(x.video_url)})}
  for(const x of sequenceSources){if(!clean(x.name||x.title))continue;const cat=category(x);const steps=[];
    for(const s of x.items||[]){if(s.sequenceId)continue;const exId=exIds.get(s.exerciseId)||ensureExercise(s,cat);if(!exId)continue;
      const mins=Number(s.minutes)||((Number(s.seconds)>0)?Number(s.seconds)/60:(Number(s.beats)>0?Number(s.beats)*60/Math.max(1,Number(x.bpm)||30)/60:0));
      steps.push({exerciseId:exId,sets:Math.max(1,Number(s.sets)||1),minutes:Math.max(0.1,Math.round((mins||1)*10)/10)});
    }
    sequences.push({id:idFor(x.id),name:clean(x.name||x.title),category:cat,items:steps});
  }
  for(const x of bookmarkSources){if(!clean(x.title||x.name))continue; bookmarks.push({id:idFor(x.id),title:clean(x.title||x.name),category:category(x),video_url:clean(youtubeUrl(x)),note:clean(x.note||x.memo)})}
  const dedup=(arr)=>[...new Map(arr.map(o=>[`${o.category}|${(o.name||o.title).toLowerCase()}`,o])).values()];
  const result={exercises:dedup(exercises),sequences:dedup(sequences),bookmarks:dedup(bookmarks)};
  return {...result,warnings:[...((root.completions?.length||root.plans?.length)?['기존 일정·완료 기록은 변환하지 않았어요.']:[]),...(root.notes?.length?['별도 메모 기록은 변환하지 않았어요.']:[]),'로컬/비공개 사진 파일과 원본 실행 설정은 JSON에 포함되지 않을 수 있어요.']};
}
