import {getVoiceVolume} from './SequenceMetronome';
import SequenceMetronome from './SequenceMetronome';
import {ScheduleButton,useExercise} from './ExerciseContext';
import React,{useEffect,useRef,useState} from 'react';
import sequences from './data/massageSequences.json';
import triggerMuscles from './data/triggerMuscles.json';
import {yogaSupabase,YOGA_BUCKET} from './supabaseYoga';
import MassageBookmarks from './MassageBookmarks';

const COLORS={ink:'#594a64',sub:'#9788a3',edge:'#e8ddf0',pale:'#f5eff9'};
const POINT_DETAILS={
 'BL2':['찬죽','눈썹 안쪽 끝의 오목한 부위','눈·안구를 직접 누르지 않기'], 'LI20':['영향','콧방울 가쪽, 코입술고랑 부근','코 주변의 피부를 세게 누르지 않기'], 'ST4':['지창','입꼬리 가쪽 부근','입술·점막 직접 압박 피하기'], 'ST6':['협거','아래턱각 앞위쪽, 깨물근 부근','턱관절 통증 시 자극하지 않기'], 'ST7':['하관','광대활 아래 턱관절 부근','턱관절에 깊은 압박 금지'], 'EX-HN5':['태양','관자놀이 부근의 경외기혈','측두부 강한 압박 금지'],
 'CV17':['전중','흉골 앞면, 양쪽 유두 사이 높이의 정중부 부근','흉골·가슴 강압 금지'], 'LU1':['중부','상부 가슴 바깥쪽의 폐경 혈위','가슴·겨드랑이 깊은 압박 금지'], 'ST12':['결분','쇄골 위 오목한 부위','혈관·신경이 있어 압박 금지'], 'GB21':['견정','목과 어깨 끝 사이 윗등 근육 부위','임신 중 자극 회피, 강압 금지'],
 'GV20':['백회','머리 정중선의 정수리 부근','과도한 압박 금지'], 'GV24':['신정','앞쪽 머리 정중선, 앞머리선 위쪽','두피 염증 시 피하기'], 'GB20':['풍지','뒤통수뼈 아래, 목 뒤 가쪽의 오목한 부위','목 깊은 압박 금지'], 'BL10':['천주','뒤통수 아래 목 뒤 근육 가쪽','목 강압 금지'], 'EX-HN1':['사신총','백회 주변 네 방향에 위치하는 경외기혈','가벼운 접촉만'],
 'GV14':['대추','목과 등 경계의 등쪽 정중선 부근','척추뼈 직접 압박 금지'], 'SI11':['천종','견갑골 뒤면의 오목한 부위','뼈 위 강압 금지'], 'BL13':['폐수','등 위쪽 흉추 양옆의 방광경 혈위','가슴우리 강압 금지'], 'BL18':['간수','등 중간 흉추 양옆의 방광경 혈위','척추·늑골 강압 금지'], 'BL20':['비수','등 아래 흉추 양옆의 방광경 혈위','강한 깊은 압박 금지'], 'BL23':['신수','허리 위쪽 요추 양옆의 방광경 혈위','신장 주변 강압 금지'],
 'GV4':['명문','허리 정중선, 요추 부근','척추 직접 압박 금지'], 'BL25':['대장수','허리 요추 양옆의 방광경 혈위','허리 강압 금지'], 'BL32':['차료','천골의 둘째 뒤천골구멍 부근','천골 구멍 깊은 압박 금지'], 'GB30':['환도','엉덩이 뒤가쪽 깊은 근육 부근','좌골신경 주변 깊은 압박 금지'],
 'CV12':['중완','명치와 배꼽 사이 복부 정중선','깊은 복부 압박 금지'], 'ST25':['천추','배꼽 좌우의 위경 혈위','복통·임신 가능성 시 압박 피하기'], 'CV6':['기해','배꼽 아래 복부 정중선','깊은 압박 금지'], 'CV4':['관원','배꼽 아래 복부 정중선','임신 가능성·복통 시 압박 금지'],
 'BL54':['질변','엉덩이의 천골 바깥쪽 부근','신경 경로 깊은 압박 피하기'], 'GB29':['거료','고관절 바깥쪽 골반 부근','뼈·신경 강압 금지'],
 'ST36':['족삼리','무릎 아래 정강이뼈 바깥쪽 부근','통증 유발 압박 금지'], 'SP6':['삼음교','안쪽 복사뼈 위, 정강이뼈 안쪽 뒤편','임신 중 자극 주의'], 'GB34':['양릉천','무릎 바깥 아래 종아리뼈 머리 앞아래','신경 주행 부위 강압 금지'], 'SP9':['음릉천','무릎 안쪽 아래 정강이뼈 내측 부근','강한 압박 금지'], 'BL40':['위중','무릎 뒤 오금 중앙','혈관·신경 있으므로 강압 금지'], 'BL57':['승산','종아리 뒤쪽 근육 하부 부근','종아리 붓기·열감·통증 시 마사지 금지'], 'KI3':['태계','안쪽 복사뼈와 아킬레스건 사이','혈관·건 직접 강압 금지']
};
const CSS={panel:{border:`1px solid ${COLORS.edge}`,borderRadius:18,padding:15,background:'white',marginBottom:12},button:{border:`1px solid ${COLORS.edge}`,borderRadius:12,padding:'10px 13px',background:COLORS.pale,color:'#755990',fontWeight:700,fontFamily:'inherit',cursor:'pointer'},small:{fontSize:12,color:COLORS.sub}};
const timeText=s=>`${String(Math.floor(Math.max(0,s)/60)).padStart(2,'0')}:${String(Math.max(0,s)%60).padStart(2,'0')}`;

// Supabase object keys must be ASCII-safe, independent of Korean UI labels.
const LYMPH_REGION_KEYS={
 '얼굴':'face','데콜테':'decollete','두피':'scalp','등':'back',
 '골반':'pelvis','복부':'abdomen','엉덩이':'glutes','다리':'legs'
};
const LYMPH_KEY_REGIONS=Object.fromEntries(Object.entries(LYMPH_REGION_KEYS).map(([label,key])=>[key,label]));
const lymphRegionFromFileName=(name)=>{
 const stem=name.replace(/\.jpg$/i,'');
 if(LYMPH_KEY_REGIONS[stem])return LYMPH_KEY_REGIONS[stem];
 // Backward compatibility for any previously saved Korean-name objects.
 try {const decoded=decodeURIComponent(stem);return LYMPH_REGION_KEYS[decoded]?decoded:null;} catch {return null;}
};

function announce(t){try{if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';u.rate=.88;u.volume=.8;(u.volume=getVoiceVolume(),window.speechSynthesis.speak(u))}catch{}}
export default function MassageLibrary(){
 const [region,setRegion]=useState(null),[tab,setTab]=useState('sequence'),[muscleSearch,setMuscleSearch]=useState(''),[index,setIndex]=useState(0),[remaining,setRemaining]=useState(0),[running,setRunning]=useState(false),[finished,setFinished]=useState(false);
 const timer=useRef(null),deadline=useRef(0),stepRef=useRef(0),seqRef=useRef(null);
 const [triggerUser,setTriggerUser]=useState(null),[triggerPhotos,setTriggerPhotos]=useState({}),[uploading,setUploading]=useState(''),[triggerError,setTriggerError]=useState('');
 const triggerInput=useRef(null),selectedMuscle=useRef(null);
 const [pointPhotos,setPointPhotos]=useState({}),[pointUploading,setPointUploading]=useState(''),[pointError,setPointError]=useState('');
 const pointInput=useRef(null),selectedPointCode=useRef(null);
 const [lymphPhotos,setLymphPhotos]=useState({}),[lymphBusy,setLymphBusy]=useState(false),[lymphError,setLymphError]=useState('');
 const lymphInput=useRef(null);
 const lymphInfo={
 '얼굴': ['귀앞·턱밑·턱끝밑·깊은목 림프절', '얼굴 영역별 배액은 귀앞·턱밑·턱끝밑을 거쳐 목 림프절 계통으로 이어져요.','림프절과 목 앞쪽을 세게 누르지 않아요.'],
 '데콜테':['목 림프절·쇄골 주변 림프 경로','얼굴과 목에서 내려오는 림프의 해부학적 경로를 학습해요.','쇄골 위 오목한 부위는 깊이 압박하지 않아요.'],
 '두피':['귀앞·귀뒤·뒤통수·목 림프절','두피 각 영역은 인접한 머리·목 림프절 계통으로 배액돼요.','두피 염증·통증이 있으면 마사지하지 않아요.'],
 '등':['겨드랑이 주변·척추 양옆 표재 림프 경로','등의 피부 부위에 따라 림프 배액 방향이 달라요.','겨드랑이와 척추뼈를 강하게 누르지 않아요.'],
 '골반':['골반·서혜부 림프절 계통','골반 주변 심부 림프계와 피부의 표재 림프계를 구분해 공부해요.','사타구니와 골반 깊은 곳은 압박하지 않아요.'],
 '복부':['복벽 표재 림프계·심부 림프계','복부의 표재 림프 배액은 배꼽 위아래에서 경로가 달라요.','복통·임신 가능성·염증이 있으면 마사지 전에 전문가와 상담해요.'],
 '엉덩이':['서혜부 림프절·둔부 심부 림프 경로','피부 표재 림프계와 깊은 둔부 구조를 구분해 공부해요.','좌골신경 주변과 사타구니 강압을 피해요.'],
 '다리':['오금·서혜부 림프절','다리의 표재 림프는 주로 서혜부 방향으로, 일부는 오금 경로로 배액돼요.','일측성 붓기·열감·통증이 있으면 마사지하지 말고 의료 평가를 받아요.']};
 const saveLymphPhoto=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f||!region)return;
   if(!triggerUser||!yogaSupabase){setLymphError('로그인이 필요해요.');return;}
   setLymphBusy(true);setLymphError('');try{
     if(f.size>15*1024*1024)throw new Error('15MB 이하 그림만 등록할 수 있어요.');
     const blob=await new Promise((resolve,reject)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);const c=document.createElement('canvas'),k=Math.min(1,1600/Math.max(im.width,im.height));c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(b=>b?resolve(b):reject(new Error('사진 변환 실패')),'image/jpeg',.86)};im.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('사진 열기 실패'))};im.src=u});
     const path=`${triggerUser}/massage-lymph/${LYMPH_REGION_KEYS[region]}.jpg`;
     const {error:up}=await yogaSupabase.storage.from(YOGA_BUCKET).upload(path,blob,{upsert:true,contentType:'image/jpeg',cacheControl:'0'});if(up)throw up;
     const {data,error:er}=await yogaSupabase.storage.from(YOGA_BUCKET).createSignedUrl(path,3600);if(er)throw er;
     setLymphPhotos(x=>({...x,[region]:data.signedUrl+'#'+Date.now()}));
   }catch(err){setLymphError(err.message)}finally{setLymphBusy(false)}
 };
 const openPointPhoto=(code)=>{if(pointUploading||!code)return;selectedPointCode.current=code;pointInput.current?.click()};
 const savePointPhoto=async(e)=>{
   const file=e.target.files?.[0],code=selectedPointCode.current;e.target.value='';if(!file||!code)return;
   if(!triggerUser||!yogaSupabase){setPointError('로그인 후 사진을 등록해 주세요.');return;}
   setPointError('');setPointUploading(code);
   try{
     if(file.size>15*1024*1024)throw new Error('사진은 15MB 이하만 등록할 수 있어요.');
     const blob=await new Promise((resolve,reject)=>{
       const obj=URL.createObjectURL(file),img=new Image();
       img.onload=()=>{URL.revokeObjectURL(obj);const scale=Math.min(1,1600/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>b?resolve(b):reject(new Error('이미지 변환 실패')),'image/jpeg',.86)};
       img.onerror=()=>{URL.revokeObjectURL(obj);reject(new Error('이미지를 열지 못했어요.'))};img.src=obj;
     });
     const path=`${triggerUser}/massage-acupoints/${code}.jpg`;
     const {error:upErr}=await yogaSupabase.storage.from(YOGA_BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:true,cacheControl:'0'});
     if(upErr)throw upErr;
     const {data,error:signErr}=await yogaSupabase.storage.from(YOGA_BUCKET).createSignedUrl(path,3600);
     if(signErr)throw signErr;
     setPointPhotos(current=>({...current,[code]:data.signedUrl}));
   }catch(error){setPointError('경혈 사진 저장 실패: '+error.message)}finally{setPointUploading('')}
 };

 useEffect(()=>{let active=true;if(!yogaSupabase){setTriggerError('사진 저장 연결을 확인해 주세요.');return;}
   (async()=>{const {data:{user},error}=await yogaSupabase.auth.getUser();if(!active)return;if(error||!user){setTriggerError('사진을 등록하려면 로그인이 필요해요.');return;}setTriggerUser(user.id);
     const prefix=`${user.id}/trigger-point-muscles`;
     const {data:files,error:listError}=await yogaSupabase.storage.from(YOGA_BUCKET).list(prefix,{limit:1000});
     if(!active)return;
     if(listError){setTriggerError('사진 목록을 불러오지 못했어요: '+listError.message);return;}
     const valid=(files||[]).filter(f=>f.name.endsWith('.jpg'));
     const results=await Promise.all(valid.map(async f=>{const path=`${prefix}/${f.name}`;const {data,error:signError}=await yogaSupabase.storage.from(YOGA_BUCKET).createSignedUrl(path,3600);return signError?null:[f.name.replace(/\.jpg$/,''),data.signedUrl];}));
     if(active)setTriggerPhotos(Object.fromEntries(results.filter(Boolean)));
     const {data:lf,error:le}=await yogaSupabase.storage.from(YOGA_BUCKET).list(`${user.id}/massage-lymph`,{limit:100});
     if(!le&&active){
       const loaded=await Promise.all((lf||[]).filter(f=>/\.jpg$/i.test(f.name)).map(async f=>{
         const label=lymphRegionFromFileName(f.name);
         if(!label)return null;
         const {data,error}=await yogaSupabase.storage.from(YOGA_BUCKET).createSignedUrl(`${user.id}/massage-lymph/${f.name}`,3600);
         return error?null:{label,url:data.signedUrl,priority:LYMPH_KEY_REGIONS[f.name.replace(/\.jpg$/i,'')]?2:1};
       }));
       if(active){const selected={};for(const item of loaded.filter(Boolean)){if(!selected[item.label]||item.priority>selected[item.label].priority)selected[item.label]=item;}setLymphPhotos(Object.fromEntries(Object.values(selected).map(item=>[item.label,item.url])))}
     }

     const pointPrefix=`${user.id}/massage-acupoints`;
     const {data:pointFiles,error:pointListError}=await yogaSupabase.storage.from(YOGA_BUCKET).list(pointPrefix,{limit:1000});
     if(pointListError){if(active)setPointError('경혈 사진 목록을 불러오지 못했어요: '+pointListError.message)}
     else{
       const points=await Promise.all((pointFiles||[]).filter(f=>f.name.endsWith('.jpg')).map(async f=>{
         const {data,error:signErr}=await yogaSupabase.storage.from(YOGA_BUCKET).createSignedUrl(`${pointPrefix}/${f.name}`,3600);
         return signErr?null:[f.name.replace(/\.jpg$/,''),data.signedUrl];
       }));
       if(active)setPointPhotos(Object.fromEntries(points.filter(Boolean)));
     }

   })().catch(e=>{if(active)setTriggerError(e.message)});
   return()=>{active=false};
 },[]);
 const openTriggerPhoto=(muscle)=>{if(uploading)return;selectedMuscle.current=muscle;triggerInput.current?.click()};
 const saveTriggerPhoto=async(e)=>{const file=e.target.files?.[0];const muscle=selectedMuscle.current;e.target.value='';if(!file||!muscle)return;
   if(!triggerUser||!yogaSupabase){setTriggerError('로그인 후 사진을 등록해 주세요.');return;}
   setTriggerError('');setUploading(muscle.id);
   try{if(file.size>15*1024*1024)throw new Error('사진은 15MB 이하만 등록할 수 있어요.');
     const blob=await new Promise((resolve,reject)=>{const obj=URL.createObjectURL(file);const img=new Image();img.onload=()=>{URL.revokeObjectURL(obj);const scale=Math.min(1,1600/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(b=>b?resolve(b):reject(new Error('사진을 변환하지 못했어요.')),'image/jpeg',.86)};img.onerror=()=>{URL.revokeObjectURL(obj);reject(new Error('사진을 열지 못했어요.'))};img.src=obj});
     const path=`${triggerUser}/trigger-point-muscles/${muscle.id}.jpg`;
     const {error:uploadError}=await yogaSupabase.storage.from(YOGA_BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:true,cacheControl:'0'});
     if(uploadError)throw uploadError;
     const {data,error:signError}=await yogaSupabase.storage.from(YOGA_BUCKET).createSignedUrl(path,3600);
     if(signError)throw signError;
     setTriggerPhotos(current=>({...current,[muscle.id]:data.signedUrl}));
   }catch(error){setTriggerError('사진 저장 실패: '+error.message)}finally{setUploading('')}
 };

 const seq=sequences.find(s=>s.region===region);
 useEffect(()=>{seqRef.current=seq},[seq]);
 const stop=()=>{clearInterval(timer.current);timer.current=null;setRunning(false);window.speechSynthesis?.cancel?.()};
 useEffect(()=>()=>{clearInterval(timer.current);window.speechSynthesis?.cancel?.()},[]);
 const switchStep=(next,play)=>{const s=seqRef.current;if(!s)return;clearInterval(timer.current);timer.current=null;if(next>=s.steps.length){stepRef.current=0;setRunning(false);setFinished(true);setRemaining(0);announce(`${s.region} 마사지가 끝났습니다. 수고하셨어요.`);return}const n=Math.max(0,next);stepRef.current=n;setIndex(n);setFinished(false);setRemaining(s.steps[n].seconds);setRunning(Boolean(play));if(play){deadline.current=Date.now()+s.steps[n].seconds*1000;announce(`${s.steps[n].title} 시작`);timer.current=setInterval(()=>{const left=Math.max(0,Math.ceil((deadline.current-Date.now())/1000));setRemaining(left);if(left===0){clearInterval(timer.current);timer.current=null;switchStep(stepRef.current+1,true)}},250)}};
 const begin=()=>{if(!seq)return;if(finished||remaining<=0){switchStep(0,true);return}setRunning(true);deadline.current=Date.now()+remaining*1000;announce(`${seq.steps[stepRef.current].title} 시작`);clearInterval(timer.current);timer.current=setInterval(()=>{const left=Math.max(0,Math.ceil((deadline.current-Date.now())/1000));setRemaining(left);if(left===0){clearInterval(timer.current);timer.current=null;switchStep(stepRef.current+1,true)}},250)};
 const pause=()=>{if(!running)return;clearInterval(timer.current);timer.current=null;setRemaining(Math.max(0,Math.ceil((deadline.current-Date.now())/1000)));setRunning(false);window.speechSynthesis?.cancel?.()};
 const enter=r=>{stop();setRegion(r);setTab('sequence');setIndex(0);stepRef.current=0;setRemaining(sequences.find(s=>s.region===r)?.steps[0]?.seconds||0);setFinished(false)};
 return <section style={{color:COLORS.ink,padding:'4px 2px 25px'}}><SequenceMetronome active={running}/>
 {!region?<><h2 style={{fontSize:24}}>마사지</h2><p style={CSS.small}>부위를 선택하면 기본 시퀀스와 경혈을 볼 수 있어요.</p><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:11}}>{sequences.map(s=><button key={s.region} onClick={()=>enter(s.region)} style={{...CSS.button,minHeight:106,textAlign:'left',background:'#fbf8fd'}}><strong style={{display:'block',fontSize:19,marginBottom:6}}>{s.region}</strong><span style={CSS.small}>{s.steps.length}개 동작 · {s.minutes}분</span></button>)}</div><p style={{...CSS.small,marginTop:14}}>학습용 저강도 시퀀스 · 통증이나 불편감이 있으면 즉시 중단해 주세요.</p></>:
 <><button style={{...CSS.button,background:'white',marginBottom:16}} onClick={()=>{stop();setRegion(null)}}>‹ 마사지 부위</button><h2 style={{margin:'4px 0 12px'}}>{region} 마사지</h2><div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:4,width:'100%',maxWidth:'100%',boxSizing:'border-box',marginBottom:14}}>{[['sequence','시퀀스'],['points','경혈'],['trigger','트리거\n포인트'],['lymph','림프'],['bookmarks','북마크']].map(([key,name])=><button type='button' key={key} style={{...CSS.button,minWidth:0,width:'100%',boxSizing:'border-box',padding:'10px 1px',fontSize:'clamp(10px,2.45vw,12px)',whiteSpace:'pre-line',wordBreak:'keep-all',lineHeight:1.25,overflow:'hidden',background:tab===key?'#e8def2':'white'}} onClick={()=>{if(key!=='sequence')pause();setTab(key)}}>{name}</button>)}</div>
 {tab==='sequence'?<><section style={CSS.panel}><b>{seq.title}</b><ScheduleButton sequence={{id:region,name:seq.title,activity:'마사지',items:seq.steps.map(x=>({...x,name:x.title,description:[x.start,x.end,x.technique,x.caution].filter(Boolean).join(' · ')}))}}/><div style={{...CSS.small,margin:'5px 0 12px'}}>{seq.steps.length}동작 · {seq.minutes}분 · 약한 압력 중심</div>{seq.steps.map((s,i)=><button key={s.order} onClick={()=>switchStep(i,false)} style={{textAlign:'left',display:'block',width:'100%',background:i===index?'#f2eaf8':'#fff',border:`1px solid ${i===index?'#cbb6de':'#ece5f0'}`,borderRadius:13,padding:12,margin:'8px 0',fontFamily:'inherit',color:COLORS.ink}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{String(i+1).padStart(2,'0')}. {s.title}</strong><span style={CSS.small}>{Math.round(s.seconds/60*10)/10}분</span></div><div style={{fontSize:13,marginTop:6}}>{s.start} → {s.end}</div><div style={{...CSS.small,marginTop:5}}>수법: {s.technique}</div>{s.caution&&<div style={{...CSS.small,color:'#a55c71',marginTop:4}}>주의: {s.caution}</div>}</button>)}</section><section style={CSS.panel}><b>시퀀스 타이머</b><div style={{textAlign:'center',padding:'15px 0'}}><div style={{fontSize:40,fontWeight:750,fontVariantNumeric:'tabular-nums'}}>{finished?'완료':timeText(remaining)}</div><div style={{fontSize:15,fontWeight:700,margin:'7px 0'}}>{finished?'마사지 종료':seq.steps[index]?.title}</div><div style={CSS.small}>{finished?'':`${index+1} / ${seq.steps.length} · ${seq.steps[index]?.start} → ${seq.steps[index]?.end}`}</div></div><div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><button style={CSS.button} disabled={index===0} onClick={()=>switchStep(index-1,running)}>‹ 이전</button><button style={{...CSS.button,background:'#e8def2'}} onClick={running?pause:begin}>{running?'⏸ 일시정지':finished?'↺ 다시 시작':'▶ 시작 / 재개'}</button><button style={CSS.button} onClick={()=>switchStep(index+1,running)}>다음 ›</button></div><p style={{...CSS.small,margin:'12px 0 0'}}>시작·동작 변경·종료 시 음성 안내 · 기기를 잠그면 브라우저 타이머가 일시 중단될 수 있어요.</p></section></>:
 tab==='bookmarks'?<MassageBookmarks region={region} /> :
 tab==='lymph'?<section style={CSS.panel}><b>{region} · 림프</b><p style={CSS.small}>해부학적 림프 흐름과 마사지 손동작 방향은 항상 같지 않아요. 그림은 학습용이며, 위치·방향은 검수 자료와 대조해 주세요.</p>
 <input ref={lymphInput} type="file" accept="image/*" onChange={saveLymphPhoto} style={{display:'none'}} aria-label="림프 그림 선택" />
 {lymphError&&<p role="alert" style={{color:'#ad405e'}}>{lymphError}</p>}
 <button type="button" disabled={lymphBusy} onClick={()=>lymphInput.current?.click()} style={{width:'100%',padding:0,background:'#faf7fc',border:`1px solid ${COLORS.edge}`,borderRadius:14,overflow:'hidden',minHeight:160,cursor:'pointer'}}>
 {lymphPhotos[region]||region==='얼굴'?<img src={lymphPhotos[region]||'/images/face-lymph-study.png'} alt={`${region} 림프 흐름 학습 그림`} style={{display:'block',width:'100%',height:'auto',maxHeight:650,objectFit:'contain'}}/>:<div style={{padding:34,color:COLORS.sub}}>▧<br/>그림을 눌러 추가</div>}
 <span style={{display:'block',padding:9,fontSize:12,color:COLORS.sub}}>{lymphBusy?'저장 중…':'그림 터치 → 등록 / 교체'}</span></button>
 <div style={{marginTop:17}}><strong>관련 림프 구조</strong><p style={{fontSize:14}}>{lymphInfo[region]?.[0]}</p><strong>림프 흐름</strong><p style={{fontSize:14}}>{lymphInfo[region]?.[1]}</p><strong>주의사항</strong><p style={{fontSize:13,color:'#a65d75'}}>{lymphInfo[region]?.[2]}</p></div>
 </section> :
 tab==='points'?<section style={CSS.panel}><b>{region} 주요 경혈</b><p style={CSS.small}>경혈 그림을 눌러 사진을 추가하거나 교체할 수 있어. 같은 경혈은 다른 부위에서도 같은 사진이 보여. 위치 설명과 그림은 학습용이며 강한 압박 지시가 아니야.</p><input ref={pointInput} type="file" accept="image/*" onChange={savePointPhoto} style={{display:'none'}} aria-label="경혈 사진 선택"/>{pointError&&<p role="alert" style={{color:'#aa4264',fontSize:12}}>{pointError}</p>}{seq.points.map(p=>{const code=p.match(/(?:EX-HN|[A-Z]{2,3})\d+/)?.[0];const d=POINT_DETAILS[code]||[];return <div key={p} style={{padding:'12px 2px',borderBottom:`1px solid ${COLORS.edge}`}}><strong>{d[0]||p} · {code||''}</strong><p style={{margin:'6px 0',fontSize:13}}>{d[1]||'해부학적 위치 추후 검수 필요'}</p><p style={{...CSS.small,margin:'0 0 10px'}}>주의: {d[2]||'강한 압박 피하기'}</p><button type="button" disabled={Boolean(pointUploading)||!code} onClick={()=>openPointPhoto(code)} aria-label={`${d[0]||p} 사진 ${pointPhotos[code]?'교체':'추가'}`} style={{width:'100%',border:`1px solid ${COLORS.edge}`,borderRadius:12,background:'#f7f3fa',padding:0,overflow:'hidden',minHeight:110,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',cursor:'pointer',color:'#9276a3',font:'inherit'}}>{pointPhotos[code]?<img src={pointPhotos[code]} alt={`${d[0]||p} 경혈 학습 그림`} style={{width:'100%',maxHeight:340,objectFit:'contain'}}/>:<><span style={{fontSize:27}}>▧</span><span style={{fontSize:13,marginTop:4}}>사진 눌러 추가</span></>}{pointUploading===code&&<span style={{fontSize:12,padding:8}}>사진 저장 중…</span>}</button></div>})}</section> :
 <section style={CSS.panel}><b>{region} · 근육별 트리거포인트</b><p style={CSS.small}>책의 근육 목록이야. 사진 칸을 누르면 해당 근육 그림을 등록하거나 교체할 수 있어. 같은 근육은 다른 마사지 부위에서도 같은 사진이 보여.</p><input ref={triggerInput} type="file" accept="image/*" onChange={saveTriggerPhoto} style={{display:'none'}} aria-label="근육 사진 선택"/>{triggerError&&<p role="alert" style={{color:'#aa4264',fontSize:12}}>{triggerError}</p>}<input value={muscleSearch} onChange={e=>setMuscleSearch(e.target.value)} placeholder="근육명 한글·영어 검색" aria-label="근육 검색" style={{boxSizing:'border-box',width:'100%',padding:'11px 12px',margin:'8px 0 12px',border:`1px solid ${COLORS.edge}`,borderRadius:10,font:'inherit',color:COLORS.ink}}/>{triggerMuscles.filter(m=>m.regions.includes(region)&&`${m.nameKo} ${m.nameEn} ${m.category}`.toLocaleLowerCase().includes(muscleSearch.trim().toLocaleLowerCase())).map(m=><div key={m.id} style={{padding:'12px 0',borderBottom:`1px solid ${COLORS.edge}`}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><strong style={{fontSize:17}}>{m.nameKo}</strong><span style={CSS.small}>p. {m.page}</span></div><div style={{...CSS.small,margin:'3px 0 9px'}}>{m.nameEn}</div><button type="button" disabled={Boolean(uploading)} onClick={()=>openTriggerPhoto(m)} aria-label={`${m.nameKo} 사진 ${triggerPhotos[m.id]?'교체':'추가'}`} style={{width:'100%',border:`1px solid ${COLORS.edge}`,borderRadius:12,background:'#f7f3fa',padding:0,overflow:'hidden',minHeight:120,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',cursor:'pointer',color:'#9276a3',font:'inherit'}}>{triggerPhotos[m.id]?<img src={triggerPhotos[m.id]} alt={`${m.nameKo} 트리거포인트 학습 그림`} style={{width:'100%',height:'auto',maxHeight:360,objectFit:'contain'}}/>:<><span style={{fontSize:27}}>▧</span><span style={{fontSize:13,marginTop:4}}>사진 눌러 추가</span></>}{uploading===m.id&&<span style={{fontSize:12,padding:8}}>사진 저장 중…</span>}</button></div>)}{!triggerMuscles.some(m=>m.regions.includes(region)&&`${m.nameKo} ${m.nameEn} ${m.category}`.toLocaleLowerCase().includes(muscleSearch.trim().toLocaleLowerCase()))&&<p style={CSS.small}>해당 부위에 일치하는 근육이 없어요.</p>}<p style={{...CSS.small,marginTop:12}}>그림의 점은 학습 자료이며 직접 강하게 눌러야 하는 위치라는 뜻이 아니야. 특히 목 앞·옆은 혈관과 신경이 있어 깊은 압박을 피해야 해.</p></section>}
 </>}
 </section>
}
