import {ScheduleButton,useExercise} from './ExerciseContext';
import React,{useMemo,useState,useEffect,useRef} from 'react';
import {Search,Plus,ChevronUp,ChevronDown,Trash2,X,BookOpen,Save,Image as ImageIcon,Upload,Camera} from 'lucide-react';
import yogaData from './data/yoga-poses.json';
import ActivityStudio from './ActivityStudio';
import MassageLibrary from './MassageLibrary';
import BodyweightStudio from './BodyweightStudio';
import PelvicStudio from './PelvicStudio';
import NatureSound from './NatureSound';
import {yogaSupabase,YOGA_BUCKET,photoPath,signedYogaPhotos} from './supabaseYoga';

const PRIMARY=['스탠딩','전굴','후굴','힙 오프너','트위스트','암 밸런스','코어','척추 움직임','회복·휴식'];
const KEY='mind-flow-yoga-sequences-v1';
const PRESET_KEY='mind-flow-yoga-custom-presets-v1';
const makeKey=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const BASE_PRESETS=[
 {id:'standing-warmup',name:'준비와 정렬',cat:'스탠딩',names:['Tadasana','Urdhva Hastasana','Uttanasana','Ardha Uttanasana','Utkatasana','Tadasana']},
 {id:'standing-strength',name:'하체 강화',cat:'스탠딩',names:['Ashta Chandrasana','Virabhadrasana I','Virabhadrasana II','Utthita Parsvakonasana','Utthita Trikonasana','Parsvottanasana']},
 {id:'standing-balance',name:'균형과 집중',cat:'스탠딩',names:['Vrksasana','Garudasana','Utthita Hasta Padangusthasana','Virabhadrasana III','Ardha Chandrasana']},
 {id:'standing-rotation',name:'회전과 확장',cat:'스탠딩',names:['Parivrtta Utkatasana','Parivrtta Anjaneyasana','Parivrtta Parsvakonasana','Parivrtta Trikonasana','Parivrtta Ardha Chandrasana']},
 {id:'standing-cooldown',name:'마무리',cat:'스탠딩',names:['Malasana','Prasarita Padottanasana','Parivrtta Prasarita Padottanasana','Tadasana']},
 {id:'forward-gentle',name:'기본 전굴',cat:'전굴',names:['Dandasana', 'Janu Sirsasana', 'Paschimottanasana', 'Balasana']},
 {id:'forward-deep',name:'전굴과 고관절',cat:'전굴',names:['Upavistha Konasana', 'Triang Mukhaikapada Paschimottanasana', 'Parivrtta Janu Sirsasana', 'Balasana']},
 {id:'backbend-soft',name:'부드러운 후굴',cat:'후굴',names:['Salamba Bhujangasana', 'Bhujangasana', 'Salabhasana', 'Balasana']},
 {id:'backbend-extension',name:'가슴 열기와 후굴',cat:'후굴',names:['Anahatasana', 'Ustrasana', 'Setu Bandha Sarvangasana', 'Supported Setu Bandha']},
 {id:'hip-basic',name:'고관절 기본 이완',cat:'힙 오프너',names:['Sukhasana', 'Baddha Konasana', 'Ananda Balasana', 'Supta Baddha Konasana']},
 {id:'hip-range',name:'고관절 유연성',cat:'힙 오프너',names:['Malasana', 'Ardha Kapotasana', 'Agnistambhasana', 'Supta Baddha Konasana']},
 {id:'twist-seated',name:'앉아서 트위스트',cat:'트위스트',names:['Dandasana', 'Bharadvajasana', 'Ardha Matsyendrasana', 'Sukhasana']},
 {id:'twist-supine',name:'누워서 트위스트',cat:'트위스트',names:['Supine Twist', 'Jathara Parivartanasana', 'Prop Twist', 'Savasana']},
 {id:'arm-foundations',name:'암 밸런스 기초',cat:'암 밸런스',names:['Adho Mukha Svanasana', 'Phalakasana', 'Makara Adho Mukha Svanasana', 'Balasana']},
 {id:'arm-balance',name:'손 균형 연습',cat:'암 밸런스',names:['Phalakasana', 'Kakasana', 'Bakasana', 'Balasana']},
 {id:'core-basic',name:'코어 기초',cat:'코어',names:['Phalakasana', 'Makara Adho Mukha Svanasana', 'Navasana', 'Balasana']},
 {id:'core-balance',name:'코어와 균형',cat:'코어',names:['Navasana', 'Ubhaya Padangusthasana', 'Vasisthasana', 'Balasana']},
 {id:'spine-mobility',name:'척추 움직임 기본',cat:'척추 움직임',names:['Bharmanasana', 'Marjaryasana', 'Bitilasana', 'Balasana']},
 {id:'spine-restore',name:'척추 부드럽게 풀기',cat:'척추 움직임',names:['Marjaryasana', 'Bitilasana', 'Anahatasana', 'Balasana']},
 {id:'restore-rest',name:'짧은 휴식',cat:'회복·휴식',names:['Sukhasana', 'Balasana', 'Savasana']},
 {id:'restore-relax',name:'누워서 회복',cat:'회복·휴식',names:['Supta Baddha Konasana', 'Supported Setu Bandha', 'Supine Twist', 'Savasana']}];
const readCustomPresets=()=>{try{const v=JSON.parse(localStorage.getItem(PRESET_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};

const unique=arr=>[...new Set(arr)];
// Photos live in this browser's IndexedDB (not in the static JSON).
const PHOTO_DB='mind-flow-yoga-photos-v1';
async function openPhotoDB(){
  const {data:{user}}=await yogaSupabase.auth.getUser();
  if(!user)throw new Error('로그인이 필요해요.');
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window))return reject(new Error('이 브라우저는 사진 저장을 지원하지 않아요.'));
    const request=indexedDB.open(PHOTO_DB+'-home-fit-'+user.id,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('photos');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('사진 저장소를 열 수 없어요.'));
  });
}
async function transactPhoto(mode,operation,key,value){
  const db=await openPhotoDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('photos',mode);
    const store=tx.objectStore('photos');
    let req;
    if(operation==='all')req=store.getAllKeys();
    else if(operation==='get')req=store.get(key);
    else if(operation==='put')req=store.put(value,key);
    else req=store.delete(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
    tx.oncomplete=()=>db.close();
    tx.onabort=()=>db.close();
  });
}
function compressPhoto(file){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/'))return reject(new Error('이미지 파일을 선택해 주세요.'));
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const ratio=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
      const ctx=canvas.getContext('2d');
      if(!ctx)return reject(new Error('사진을 처리할 수 없어요.'));
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('사진 변환에 실패했어요.')),'image/jpeg',0.86);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('사진을 열 수 없어요. 다른 이미지로 시도해 주세요.'))};
    img.src=url;
  });
}

const getSaved=()=>{try{const val=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(val)?val:[]}catch{return []}};
function YogaContent(){
 const exercise=useExercise();
  const poses=yogaData.poses||[];
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('전체');
  const [sub,setSub]=useState('전체');
  const [detail,setDetail]=useState(null);
  const [draft,setDraft]=useState([]);
  const [seqName,setSeqName]=useState('나의 요가 시퀀스');
  const [saved,setSaved]=useState(()=>exercise.localData.sequences||[]);
  const [view,setView]=useState('library');
  const [presetCategory,setPresetCategory]=useState('스탠딩');
  const [customPresets,setCustomPresets]=useState(()=>exercise.localData.presets||[]);
  const [bpm,setBpm]=useState(30);
  const [countLanguage,setCountLanguage]=useState('zh');
  const [player,setPlayer]=useState(null);
  const [playing,setPlaying]=useState(false);
  const [introDone,setIntroDone]=useState(false);
  const [toast,setToast]=useState('');

  const [customPhotos,setCustomPhotos]=useState({});
  const [photoBusy,setPhotoBusy]=useState(false);
  const [photoError,setPhotoError]=useState('');
  const fileInput=useRef(null);
  const photoUrls=useRef({});
  const remotePaths=useRef({});
  const currentUser=useRef(null);
  const [cloudPhotos,setCloudPhotos]=useState({});
  const [cloudStatus,setCloudStatus]=useState('연결 확인 중');
  // Keep existing browser photos as a fallback; never erase them during migration.
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const keys=await transactPhoto('readonly','all');
        const result={};
        for(const key of keys){
          const blob=await transactPhoto('readonly','get',key);
          if(!active)break;
          if(blob instanceof Blob){
            const url=URL.createObjectURL(blob);
            photoUrls.current[key]=url;
            result[key]=url;
          }
        }
        if(active)setCustomPhotos(result);
      }catch(err){if(active)setPhotoError(err.message||'기기 사진을 불러오지 못했어요.')}
    })();
    return ()=>{active=false;Object.values(photoUrls.current).forEach(url=>URL.revokeObjectURL(url));photoUrls.current={}};
  },[]);
  const loadCloudPhotos=async(user)=>{
    if(!user||!yogaSupabase)return;
    const urls={};const paths={};
    let tableError=null;
    try{
      const rows=await signedYogaPhotos(yogaSupabase,user.id);
      Object.assign(urls,rows.urls);Object.assign(paths,rows.paths);
    }catch(err){tableError=err}
    // Rescue already uploaded files even when the metadata table is empty or incomplete.
    try{
      const {data:folders,error:folderError}=await yogaSupabase.storage.from(YOGA_BUCKET).list(user.id,{limit:1000});
      if(folderError)throw folderError;
      const poseIds=new Set(poses.map(p=>p.id));
      const names=(folders||[]).filter(f=>poseIds.has(f.name)&&!urls[f.name]);
      await Promise.all(names.map(async folder=>{
        const {data:images,error:listError}=await yogaSupabase.storage.from(YOGA_BUCKET).list(`${user.id}/${folder.name}`,{limit:100,sortBy:{column:'created_at',order:'desc'}});
        if(listError||!images?.length)return;
        const file=images.find(f=>f.name&&/\.(jpe?g|png|webp)$/i.test(f.name));
        if(!file)return;
        const path=`${user.id}/${folder.name}/${file.name}`;
        const {data:signed,error:signError}=await yogaSupabase.storage.from(YOGA_BUCKET).createSignedUrl(path,3600);
        if(!signError&&signed?.signedUrl){urls[folder.name]=signed.signedUrl;paths[folder.name]=path}
      }));
    }catch(err){if(!Object.keys(urls).length)throw tableError||err}
    remotePaths.current=paths;
    setCloudPhotos(urls);
    setCloudStatus(`${Object.keys(urls).length}개 클라우드 사진 연결`);
    if(tableError&&Object.keys(urls).length===0)setPhotoError(`사진 목록 조회 실패: ${tableError.message}`);
  };
  useEffect(()=>{
    if(!yogaSupabase){setCloudStatus('Supabase 환경 변수 확인 필요');return}
    let live=true;
    const refresh=async()=>{
      try{
        const {data:{user},error}=await yogaSupabase.auth.getUser();
        if(error)throw error;
        if(!live)return;
        currentUser.current=user;
        if(user)await loadCloudPhotos(user);
        else{setCloudStatus('로그인 후 사진 표시');setCloudPhotos({});remotePaths.current={}}
      }catch(err){if(live){setCloudStatus('사진 연결 오류');setPhotoError(err.message||'사진 연결 오류')}}
    };
    refresh();
    const {data:listener}=yogaSupabase.auth.onAuthStateChange(()=>{setTimeout(()=>{if(live)refresh()},0)});
    const onVisible=()=>{if(document.visibilityState==='visible')refresh()};
    document.addEventListener('visibilitychange',onVisible);
    return()=>{live=false;listener?.subscription?.unsubscribe();document.removeEventListener('visibilitychange',onVisible)};
  },[]);
  const photoFor=p=>cloudPhotos[p.id]||exercise.localData.photos?.[p.id]||customPhotos[p.id]||null;
  const uploadPhoto=async(event)=>{
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file||!detail)return;
    const id=detail.id;
    setPhotoBusy(true);setPhotoError('');
    try{
      const blob=await compressPhoto(file);
      const user=currentUser.current;
      if(!yogaSupabase||!user)throw new Error('Supabase 로그인 후 사진을 업로드할 수 있어요.');
      const path=photoPath(user.id,id);
      const {error:uploadError}=await yogaSupabase.storage.from(YOGA_BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false});
      if(uploadError)throw uploadError;
      // Existing photos are retained in Storage until the new database reference is saved.
      const table=yogaSupabase.from('mindflow_yoga_photos');
      const {data:existing,error:readError}=await table.select('storage_path').eq('user_id',user.id).eq('pose_id',id).limit(1);
      if(readError)throw new Error(`사진은 Storage에 업로드됐지만 목록 연결 실패: ${readError.message}`);
      const operation=existing?.length
        ?table.update({storage_path:path}).eq('user_id',user.id).eq('pose_id',id)
        :table.insert({user_id:user.id,pose_id:id,storage_path:path});
      const {error:rowError}=await operation;
      if(rowError)throw new Error(`사진은 Storage에 보관됐지만 목록 저장 실패: ${rowError.message}`);
      const {data:signed,error:signError}=await yogaSupabase.storage.from(YOGA_BUCKET).createSignedUrl(path,3600);
      if(signError)throw signError;
      remotePaths.current[id]=path;
      setCloudPhotos(prev=>({...prev,[id]:signed.signedUrl}));
      setCloudStatus('Supabase에 사진 저장 완료');
      // Local browser backup, intentionally not used as the primary source.
      await transactPhoto('readwrite','put',id,blob).catch(()=>{});
    }catch(err){setPhotoError(err.message||'사진 저장에 실패했어요.')}finally{setPhotoBusy(false)}
  };
  const deletePhoto=async()=>{
    if(!detail||!photoFor(detail))return;
    if(!window.confirm('이 자세의 사진을 삭제할까요?'))return;
    setPhotoBusy(true);setPhotoError('');
    try{
      const id=detail.id,user=currentUser.current;
      if(yogaSupabase&&user){
        const {error:rowError}=await yogaSupabase.from('mindflow_yoga_photos').delete().eq('user_id',user.id).eq('pose_id',id);
        if(rowError)throw rowError;
        // Do not delete historical Storage objects silently: a recovery copy is valuable.
        delete remotePaths.current[id];
        setCloudPhotos(prev=>{const next={...prev};delete next[id];return next});
      }
      await transactPhoto('readwrite','delete',id);
      if(photoUrls.current[id])URL.revokeObjectURL(photoUrls.current[id]);
      delete photoUrls.current[id];
      exercise.onLocalChange(old=>{const photos={...(old.photos||{})};delete photos[id];return {...old,photos}});
      setCustomPhotos(prev=>{const next={...prev};delete next[id];return next});
      setCloudStatus('사진 표시 연결을 삭제했어요 (Storage 원본 보존)');
    }catch(err){setPhotoError(err.message||'사진 삭제에 실패했어요.')}finally{setPhotoBusy(false)}
  };
  useEffect(()=>{exercise.onLocalChange(old=>({...old,sequences:saved}));},[saved]);
  useEffect(()=>{exercise.onLocalChange(old=>({...old,presets:customPresets}));},[customPresets]);
  useEffect(()=>()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel()},[]);
  const presetItems=useMemo(()=>BASE_PRESETS.map(p=>({...p,builtin:true,items:p.names.map(name=>poses.find(x=>x.sanskrit===name)).filter(Boolean).map(x=>({poseId:x.id,beats:x.defaultBeats||8,side:x.sideMode==='selectable'?'양쪽':'기본'}))})),[poses]);
  const allPresets=[...presetItems,...customPresets];
  const appendPreset=p=>{setDraft(prev=>[...prev,...p.items.filter(x=>poses.some(z=>z.id===x.poseId)).map(x=>({...x,key:makeKey()}))]);setView('sequence');setToast(`${p.name} 추가했어요`)};
  const savePreset=()=>{if(!draft.length)return;const name=window.prompt('새 프리셋 이름을 입력해 주세요',seqName.trim()||'나의 스탠딩')?.trim();if(!name)return;setCustomPresets(prev=>[...prev,{id:makeKey(),name,cat:presetCategory,items:draft.map(({poseId,beats,side})=>({poseId,beats,side}))}]);setToast('내 프리셋으로 저장했어요')};
  const normalizeSteps=items=>items.flatMap(item=>{const p=poses.find(x=>x.id===item.poseId);if(!p)return[];const beats=Math.max(1,Math.min(128,Number(item.beats)||8));const sides=item.side==='양쪽'?['왼쪽','오른쪽']:item.side==='왼쪽'||item.side==='오른쪽'?[item.side]:[''];return sides.map(side=>({poseId:p.id,name:p.nameKo||p.sanskrit,side,beats}))});
  const startPlayer=()=>{const steps=normalizeSteps(draft);if(!steps.length)return;setPlayer({steps,index:0,beat:0});setIntroDone(false);setPlaying(true)};
  const jumpTo=delta=>{if(!player)return;const index=player.index+delta;if(index>=player.steps.length){setPlaying(false);setPlayer(null);return}setPlayer(prev=>({...prev,index:Math.max(0,index),beat:0}));setIntroDone(false)};
  const stopPlayer=()=>{setPlaying(false);setPlayer(null);if('speechSynthesis' in window)window.speechSynthesis.cancel()};
  // Pronounce each pose name and side completely before counting begins.
  useEffect(()=>{if(!player||!playing)return;let cancelled=false;setIntroDone(false);const step=player.steps[player.index];if(!step)return;
    if(!('speechSynthesis' in window)){setIntroDone(true);return}
    window.speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(`${step.name}${step.side?' '+step.side:''}`);utter.lang='ko-KR';utter.rate=1;utter.onend=()=>{if(!cancelled)setIntroDone(true)};utter.onerror=()=>{if(!cancelled)setIntroDone(true)};
    // Avoid browser TTS hanging forever when a voice is not present.
    const fallback=setTimeout(()=>{if(!cancelled)setIntroDone(true)},5000);
    window.speechSynthesis.speak(utter);
    return()=>{cancelled=true;clearTimeout(fallback);window.speechSynthesis.cancel()};
  },[player?.index,playing,player?.steps]);
  useEffect(()=>{if(!player||!playing||!introDone||bpm===0)return;const duration=60000/bpm;
    const timer=setTimeout(()=>{const number=player.beat+1;
      if('speechSynthesis' in window){const ko=['하나','둘','셋','넷','다섯','여섯','일곱','여덟'];const zh=['一','二','三','四','五','六','七','八'];const raw=(countLanguage==='zh'?zh:ko)[(number-1)%8];const count=new SpeechSynthesisUtterance(raw);count.lang=countLanguage==='zh'?'zh-CN':'ko-KR';count.rate=0.85;window.speechSynthesis.speak(count)}
      const step=player.steps[player.index];if(number>=step.beats){if(player.index+1>=player.steps.length){setPlaying(false);setPlayer(null)}else{setPlayer(p=>p?{...p,index:p.index+1,beat:0}:null);setIntroDone(false)}}else setPlayer(p=>p?{...p,beat:number}:null)
    },duration);return()=>clearTimeout(timer);
  },[player?.beat,player?.index,playing,introDone,bpm,countLanguage]);

  const subcats=useMemo(()=>unique(poses.filter(p=>category==='전체'||p.categories?.includes(category)).flatMap(p=>p.categories||[])).filter(c=>c!==category&&c!=='전체').sort((a,b)=>a.localeCompare(b,'ko')),[category,poses]);
  const filtered=useMemo(()=>poses.filter(p=>{
    const matchesCategory=category==='전체'||p.categories?.includes(category);
    const matchesSub=sub==='전체'||p.categories?.includes(sub);
    const matchesName=[p.nameKo,p.sanskrit,p.nameEn].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return matchesCategory&&matchesSub&&matchesName;
  }).sort((a,b)=>(a.nameKo||'').localeCompare(b.nameKo||'','ko')),[poses,category,sub,query]);
  const add=p=>{setDraft(prev=>[...prev,{key:`${Date.now()}-${Math.random().toString(36).slice(2)}`,poseId:p.id,beats:p.defaultBeats||8,side:p.sideMode==='selectable'||p.sideMode==='both'?'양쪽':'기본'}]);};
  const move=(i,delta)=>setDraft(prev=>{const next=[...prev];const j=i+delta;if(j<0||j>=next.length)return prev;[next[i],next[j]]=[next[j],next[i]];return next;});
  const saveSequence=()=>{if(!draft.length)return;const name=window.prompt('저장할 시퀀스 이름을 입력해 주세요',seqName.trim()||'')?.trim();if(!name)return;setSeqName(name);setSaved(prev=>[{id:`seq-${Date.now()}`,name,items:draft.map(x=>({...x})),createdAt:new Date().toISOString()},...prev]);setToast(`시퀀스 ‘${name}’ 저장 완료`);};
  const loadSequence=s=>{setDraft(s.items.filter(x=>poses.some(p=>p.id===x.poseId)).map((x,i)=>({...x,key:`load-${Date.now()}-${i}`})));setSeqName(s.name);setView('sequence');};
  const poseById=id=>poses.find(p=>p.id===id);
  return <div className="yoga-library">
    <div className="page-heading"><div className="eyebrow">YOGA STUDIO</div><h1>나의 요가</h1><p>자세를 찾아보고, 나만의 시퀀스를 만들어요.</p></div>
    <section className="panel">
      <div className="yoga-switch"><button className={view==='library'?'active':''} onClick={()=>setView('library')}>자세 라이브러리</button><button className={view==='presets'?'active':''} onClick={()=>setView('presets')}>프리셋</button><button className={view==='sequence'?'active':''} onClick={()=>setView('sequence')}>나의 시퀀스 ({draft.length})</button></div>
      {view==='presets'?<>
        <h2>요가 프리셋</h2><p className="muted">기본 프리셋을 추가하거나, 내가 만든 프리셋을 수정·복제·삭제할 수 있어요.</p>
        <div className="yoga-filters"><label>프리셋 카테고리<select value={presetCategory} onChange={e=>setPresetCategory(e.target.value)}>{PRIMARY.map(c=><option key={c}>{c}</option>)}</select></label></div>
        {allPresets.filter(p=>p.cat===presetCategory).map(p=><div key={p.id} className="yoga-saved-row" style={{gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={()=>appendPreset(p)} style={{flex:1,minWidth:150,textAlign:'left'}}><b>{p.name} {p.builtin?'· 기본':''}</b><small>{p.items.length}자세 · 누르면 시퀀스 뒤에 추가</small></button>
          {!p.builtin&&<><button title="이름 변경" onClick={()=>{const name=window.prompt('프리셋 이름 수정',p.name)?.trim();if(name)setCustomPresets(prev=>prev.map(x=>x.id===p.id?{...x,name}:x))}}>이름</button><button title="편집" onClick={()=>{setDraft(p.items.map(x=>({...x,key:makeKey()})));setSeqName(p.name);setView('sequence')}}>편집</button><button title="복제" onClick={()=>setCustomPresets(prev=>[...prev,{...p,id:makeKey(),name:p.name+' 복사본'}])}>복제</button><button aria-label="프리셋 삭제" onClick={()=>{if(window.confirm('이 프리셋을 삭제할까요?'))setCustomPresets(prev=>prev.filter(x=>x.id!==p.id))}}><Trash2 size={16}/></button></>}
        </div>)}
        {!allPresets.some(p=>p.cat===presetCategory)&&<p className="muted">아직 프리셋이 없어요. 시퀀스를 만들어 이 카테고리에 저장해 주세요.</p>}
        <button className="yoga-add" onClick={()=>{setDraft([]);setSeqName('나의 '+presetCategory+' 프리셋');setView('library');setCategory(presetCategory);setSub('전체')}}><Plus size={16}/> 새 프리셋 만들기 · 자세 선택</button>
      </>:view==='library'?<>
        <div className="yoga-search"><Search size={17}/><input aria-label="요가 자세 검색" placeholder="한국어 · 산스크리트어 검색" value={query} onChange={e=>setQuery(e.target.value)}/></div>
        <div className="yoga-filters"><label>대분류<select value={category} onChange={e=>{setCategory(e.target.value);setSub('전체')}}><option value="전체">전체</option>{PRIMARY.map(c=><option key={c}>{c}</option>)}</select></label><label>세부 태그<select value={sub} onChange={e=>setSub(e.target.value)}><option value="전체">전체</option>{subcats.map(c=><option key={c}>{c}</option>)}</select></label></div>
        <p className="yoga-count">{filtered.length}개 자세 · 전체 {poses.length}개 · 한 자세는 여러 분류에 표시될 수 있어요.</p>
        <div className="yoga-pose-grid">{filtered.map(p=><article key={p.id} className="yoga-pose-card"><button className="yoga-pose-preview" onClick={()=>setDetail(p)} aria-label={`${p.nameKo} 상세 보기`}>{photoFor(p)?<img loading="lazy" src={photoFor(p)} alt={`${p.nameKo} 자세`} />:<><ImageIcon size={27}/><small>사진을 등록해 주세요</small></>}</button><div className="yoga-pose-info"><button className="yoga-pose-name" onClick={()=>setDetail(p)}>{p.nameKo||p.sanskrit}</button><span>{p.sanskrit}</span><button className="yoga-add" onClick={()=>add(p)}><Plus size={15}/> 시퀀스에 추가</button></div></article>)}</div>
        {!filtered.length&&<p className="muted">검색 결과가 없어요. 다른 분류나 이름으로 찾아봐요.</p>}
      </>:<>
        <h2>나의 시퀀스</h2><p className="muted">기본·사용자 프리셋을 불러오거나 자세를 자유롭게 조합해요. 원본 프리셋은 바뀌지 않아요.</p>
        <input className="yoga-seq-title" aria-label="시퀀스 이름" value={seqName} onChange={e=>setSeqName(e.target.value)}/>
        {draft.length===0?<div className="yoga-empty">아직 담은 자세가 없어요.<button onClick={()=>setView('library')}>자세 선택하기</button></div>:<div className="yoga-draft-list">{draft.map((item,i)=>{const p=poseById(item.poseId);return p&&<div key={item.key} className="yoga-draft-item"><span className="yoga-order">{i+1}</span><button type="button" onClick={()=>setDetail(p)} aria-label={`${p.nameKo} 사진 크게 보기`} style={{width:48,height:48,minWidth:48,flexShrink:0,padding:0,border:'1px solid #e7deee',borderRadius:10,background:'#f5f1f8',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>{photoFor(p)?<img src={photoFor(p)} alt={p.nameKo} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<ImageIcon size={19} color="#ad9abf"/>}</button><div className="yoga-draft-title" style={{minWidth:0,flex:'1 1 110px'}}><b>{p.nameKo}</b><small>{p.sanskrit}</small><div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:5}}><select aria-label="좌우 설정" value={item.side||'기본'} onChange={e=>setDraft(prev=>prev.map(x=>x.key===item.key?{...x,side:e.target.value}:x))}>{['기본','양쪽','왼쪽','오른쪽'].map(v=><option key={v}>{v}</option>)}</select><select aria-label="유지 박자" value={item.beats||8} onChange={e=>setDraft(prev=>prev.map(x=>x.key===item.key?{...x,beats:Number(e.target.value)}:x))}>{[4,8,16,24,32,48,64].map(v=><option key={v} value={v}>{v}박</option>)}</select></div></div><div className="yoga-draft-actions"><button aria-label="위로" disabled={i===0} onClick={()=>move(i,-1)}><ChevronUp size={17}/></button><button aria-label="아래로" disabled={i===draft.length-1} onClick={()=>move(i,1)}><ChevronDown size={17}/></button><button aria-label="삭제" onClick={()=>setDraft(prev=>prev.filter(x=>x.key!==item.key))}><Trash2 size={16}/></button></div></div>})}</div>}
        <div className="yoga-seq-actions"><button onClick={()=>setView('library')}>+ 자세</button><button onClick={()=>setView('presets')}>+ 프리셋</button><button disabled={!draft.length} onClick={saveSequence}><Save size={16}/> 시퀀스</button><button disabled={!draft.length} onClick={savePreset}><Save size={16}/> 프리셋</button></div>
        <div style={{border:'1px solid #e8e0ed',borderRadius:14,padding:14,margin:'14px 0',display:'grid',gap:9}}>
          <b>시퀀스 음성 재생</b>
          <label style={{display:'flex',gap:10,alignItems:'center'}}>속도 <input type="range" min="0" max="60" step="1" value={bpm} onChange={e=>setBpm(Number(e.target.value))} style={{flex:1}}/><b style={{minWidth:78,textAlign:"right"}}>{bpm===0?"일시정지":`${bpm} BPM`}</b></label>
          <label>카운트 언어 <select value={countLanguage} onChange={e=>setCountLanguage(e.target.value)}><option value="zh">중국어 (一 二 三...)</option><option value="ko">한국어 (하나 둘 셋...)</option></select></label>
          <button disabled={!draft.length} className="yoga-add" onClick={startPlayer}>▶ 혼합형 재생 시작</button>
          <small style={{color:'#8c8298'}}>자세 이름 → 왼쪽 카운트 → 오른쪽 카운트 · 자동 진행 / 일시정지 / 이전 / 다음</small>
        </div>
        <h3 className="yoga-subtitle">저장한 시퀀스 ({saved.length})</h3>{saved.map(s=><div key={s.id} className="yoga-saved-row"><button onClick={()=>loadSequence(s)}><b>{s.name}</b><small>{s.items.length}개 자세 · 불러오기</small></button><ScheduleButton sequence={{...s,activity:'요가',bpm,language:countLanguage,items:normalizeSteps(s.items).map(step=>({...step,image:photoFor(poseById(step.poseId)),imagePath:remotePaths.current[step.poseId],bucket:YOGA_BUCKET}))}}/><button aria-label="저장한 시퀀스 삭제" onClick={()=>{if(window.confirm('이 시퀀스를 삭제할까?'))setSaved(prev=>prev.filter(x=>x.id!==s.id))}}><Trash2 size={17}/></button></div>)}
      </>}
    </section>
    {toast&&<p role="status" style={{color:'#795b99'}}>{toast}</p>}
    {player&&<div className="modal-backdrop" onClick={stopPlayer}><div className="video-modal yoga-detail" role="dialog" aria-modal="true" aria-label="요가 시퀀스 재생" onClick={e=>e.stopPropagation()} style={{maxWidth:430}}>
      <div className="modal-header"><b>요가 시퀀스 재생 · {player.index+1}/{player.steps.length}</b><button className="iconbtn" onClick={stopPlayer}><X/></button></div>
      {(()=>{const step=player.steps[player.index];const p=poseById(step.poseId);return <>
        <div className="yoga-detail-preview" style={{minHeight:220}}>{p&&photoFor(p)?<img src={photoFor(p)} alt={step.name}/>:<><ImageIcon size={30}/><span>사진 미등록</span></>}</div>
        <h2 style={{textAlign:'center',margin:'12px 0 6px'}}>{step.name}{step.side?' · '+step.side:''}</h2>
        <h1 style={{textAlign:'center',fontSize:40,margin:'10px 0'}}>{player.beat} / {step.beats}</h1>
        <p className="muted" style={{textAlign:'center'}}>{bpm===0?'속도 0 · 카운트 정지':introDone?'카운트 진행 중':'자세 이름 안내 중'} · {bpm} BPM</p>
        <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:12}}><button onClick={()=>jumpTo(-1)} disabled={player.index===0}>◀ 이전</button><button onClick={()=>setPlaying(v=>!v)}>{playing?'Ⅱ 일시정지':'▶ 계속'}</button><button onClick={()=>jumpTo(1)}>다음 ▶</button></div>
        <button style={{display:'block',margin:'16px auto 0'}} onClick={stopPlayer}>재생 종료</button>
      </>})()}
    </div></div>}
    {detail&&<div className="modal-backdrop" onClick={()=>setDetail(null)}><div className="video-modal yoga-detail" role="dialog" aria-modal="true" aria-label="요가 자세 상세" onClick={e=>e.stopPropagation()}><div className="modal-header"><b>{detail.nameKo||detail.sanskrit}</b><button className="iconbtn" onClick={()=>setDetail(null)}><X/></button></div><div className="yoga-detail-preview">{photoFor(detail)?<img src={photoFor(detail)} alt={detail.nameKo}/>:<><BookOpen size={34}/><span>사진을 등록해 주세요</span></>}</div>
      <input ref={fileInput} type="file" accept="image/*" onChange={uploadPhoto} style={{display:'none'}} aria-label="요가 자세 사진 선택"/>
      <div style={{display:'flex',gap:8,margin:'12px 0',alignItems:'center',flexWrap:'wrap'}}>
        <button type="button" disabled={photoBusy} onClick={()=>{setPhotoError('');fileInput.current?.click()}} style={{flex:1,minWidth:150,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'12px',border:'none',borderRadius:12,background:'#eee3f6',color:'#795b99',fontWeight:700,cursor:'pointer'}}><Camera size={18}/>{photoBusy?'사진 처리 중…':photoFor(detail)?'사진 변경':'사진 업로드'}</button>
        {photoFor(detail)&&<button type="button" disabled={photoBusy} onClick={deletePhoto} style={{display:'flex',alignItems:'center',gap:5,padding:'12px',border:'1px solid #e2d9eb',borderRadius:12,background:'white',color:'#8a718e'}}><Trash2 size={16}/> 사진 삭제</button>}
      </div>
      {photoError&&<p role="alert" style={{color:'#b42347',fontSize:13}}>{photoError}</p>}
      <p style={{fontSize:12,color:'#9b8ba8',margin:'0 0 12px'}}>Supabase Storage 사진 동기화 · {cloudStatus}</p>
      <p><b>산스크리트어</b> · {detail.sanskrit}</p><p><b>카테고리</b> · {(detail.categories||[]).join(' · ')}</p><p className="muted">자세 설명·정렬 포인트는 추후 추가할 예정이에요. 기본 유지 박자: {detail.defaultBeats||8}박</p><button className="yoga-add yoga-detail-add" onClick={()=>{add(detail);setDetail(null)}}><Plus size={16}/> 시퀀스에 추가</button></div></div>}
  </div>
}


// Top-level activity selector. Keep YogaContent unchanged so existing photos,
// presets and sequences continue to work as before.
const MIND_FLOW_ACTIVITIES = [
  {name:'요가', en:'YOGA', icon:'🧘‍♀️'},
  {name:'매트 필라테스', en:'MAT PILATES', icon:'🤸‍♀️'},
  {name:'SNPE', en:'SNPE', icon:'🌿'},
  {name:'골반순환', en:'PELVIC FLOW', icon:'🌸'},
  {name:'스트레칭', en:'STRETCHING', icon:'✨'},
  {name:'폼롤러', en:'FOAM ROLLER', icon:'🪷'},
  {name:'마사지', en:'MASSAGE', icon:'💆‍♀️'},
  {name:'맨몸근력', en:'BODYWEIGHT', icon:'💪'},
  {name:'덤벨', en:'DUMBBELL', icon:'🏋️'},
  {name:'바벨', en:'BARBELL', icon:'🏋️‍♀️'},
  {name:'머신', en:'MACHINE', icon:'⚙️'},
  {name:'통합 라이브러리', en:'ALL MOVEMENTS & PRESETS', icon:'🔎'},
];

export default function YogaLibrary(){
  const [activity,setActivity]=useState(null);
  if(activity==='요가')return (
    <div>
      <button type="button" onClick={()=>setActivity(null)} style={{display:'inline-flex',alignItems:'center',gap:7,margin:'4px 0 14px',padding:'10px 15px',border:'1px solid #e7ddec',borderRadius:12,background:'#fff',color:'#775a8f',fontWeight:700,cursor:'pointer'}}>‹ 전체 운동</button>
      <YogaContent />
      <NatureSound />
    </div>
  );
  if(activity)return (
    <div>
      <button type="button" onClick={()=>setActivity(null)} style={{display:'inline-flex',alignItems:'center',gap:7,margin:'4px 0 14px',padding:'10px 15px',border:'1px solid #e7ddec',borderRadius:12,background:'#fff',color:'#775a8f',fontWeight:700,cursor:'pointer'}}>‹ 전체 운동</button>
      {activity==='마사지' ? <MassageLibrary/>
        : activity==='골반순환' ? <PelvicStudio/>
        : activity==='맨몸근력' ? <BodyweightStudio/>
        : <ActivityStudio activity={activity}/>}
      {!['골반순환','맨몸근력'].includes(activity)&&<NatureSound />}
    </div>
  );
  return (
    <section style={{padding:'10px 4px 26px'}}>
      <div style={{padding:'5px 5px 18px'}}>
        <h2 style={{margin:'0 0 7px',fontSize:23,color:'#53435f'}}>운동 라이브러리</h2>
        <p style={{margin:0,color:'#9b8ca5',fontSize:14}}>오늘의 운동을 선택해 주세요.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}>
        {MIND_FLOW_ACTIVITIES.map((item,i)=><button type="button" key={item.name} onClick={()=>setActivity(item.name)} style={{minWidth:0,minHeight:124,padding:'18px 8px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:7,background:i===0?'#eee6f7':'#faf7fc',color:'#684b7c',border:'1px solid #eadff0',borderRadius:18,cursor:'pointer',fontFamily:'inherit'}}>
          <span aria-hidden="true" style={{fontSize:30,lineHeight:1.2}}>{item.icon}</span>
          <strong style={{fontSize:16,wordBreak:'keep-all'}}>{item.name}</strong>
          <small style={{fontSize:10,letterSpacing:1,color:'#a18cac'}}>{item.en}</small>
        </button>)}
      </div>
    </section>
  );
}
