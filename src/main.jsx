import AuthGate from './AuthGate.jsx';
import React,{useState,useEffect,useRef,useMemo} from 'react';import{createRoot}from'react-dom/client';import{House,Wind,Flower2,Music2,CalendarDays,Settings,Plus,Play,Pause,Square,Heart,Upload,Trash2,Headphones,Volume2,Moon,ChevronLeft,ChevronRight,ExternalLink,Maximize2,Bookmark,Clock3,Check,CloudRain,Waves,Bird,Flame,Trees,X,RotateCcw,Save,Search,FolderPlus}from'lucide-react';import './style.css';
const key='mind-flow-v1';const today=()=>new Date().toLocaleDateString('en-CA');const format=(n)=>`${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n%3600/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;const initial={sessions:[],mantras:[],presets:[],mood:[],volumes:{},selectedMinutes:20};function usePersist(){const [state,set]=useState(()=>{try{return {...initial,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return initial}});useEffect(()=>localStorage.setItem(key,JSON.stringify(state)),[state]);return [state,(patch)=>set(s=>({...s,...(typeof patch==='function'?patch(s):patch)}))]};
const db=()=>new Promise((resolve,reject)=>{const req=indexedDB.open('mind-flow-audio',1);req.onupgradeneeded=()=>req.result.createObjectStore('clips',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});async function dbGet(){const d=await db();return new Promise((res,rej)=>{const r=d.transaction('clips').objectStore('clips').getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}async function dbPut(item){const d=await db();return new Promise((res,rej)=>{let r=d.transaction('clips','readwrite').objectStore('clips').put(item);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}async function dbDelete(id){const d=await db();return new Promise((res,rej)=>{let r=d.transaction('clips','readwrite').objectStore('clips').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
const youtubeId=(url)=>{try{const u=new URL(url);if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0];if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];return null}catch{return null}};
const soundCategories=[['물소리','💧'],['새소리','🐦'],['파도','🌊'],['지하철','🚇'],['회사','🏢'],['커피숍','☕'],['기차','🚆'],['드라이어','💨'],['폭포','🏞️'],['귀뚜라미','🦗'],['모닥불','🔥'],['숲','🌲'],['비','🌧️'],['천둥','⛈️']];
const builtInClips=[{"id":"built-in-15","name":"조용한물","category":"물소리","src":"/audio/audio-15.mp3","size":110880},{"id":"built-in-17","name":"큰물소리","category":"물소리","src":"/audio/audio-17.mp3","size":965485},{"id":"built-in-19","name":"커피숍(노래)","category":"커피숍","src":"/audio/audio-19.mp3","size":3545280},{"id":"built-in-21","name":"커피숍","category":"커피숍","src":"/audio/audio-21.mp3","size":3612480},{"id":"built-in-23","name":"숲","category":"숲","src":"/audio/audio-23.mp3","size":9665280},{"id":"built-in-25","name":"귀뚜라미","category":"귀뚜라미","src":"/audio/audio-25.mp3","size":292571},{"id":"built-in-27","name":"모닥불","category":"모닥불","src":"/audio/audio-27.mp3","size":2545152},{"id":"built-in-29","name":"드라이어","category":"드라이어","src":"/audio/audio-29.mp3","size":1247086},{"id":"built-in-31","name":"지하철","category":"지하철","src":"/audio/audio-31.mp3","size":1303196},{"id":"built-in-33","name":"회사","category":"회사","src":"/audio/audio-33.mp3","size":1118880},{"id":"built-in-35","name":"천둥","category":"천둥","src":"/audio/audio-35.mp3","size":1166106},{"id":"built-in-37","name":"기차","category":"기차","src":"/audio/audio-37.mp3","size":326880},{"id":"built-in-39","name":"폭포","category":"폭포","src":"/audio/audio-39.mp3","size":14405006},{"id":"built-in-41","name":"파도","category":"파도","src":"/audio/audio-41.mp3","size":4226403},{"id":"built-in-43","name":"차위 비","category":"비","src":"/audio/audio-43.mp3","size":1972992},{"id":"built-in-45","name":"조용한비","category":"비","src":"/audio/audio-45.mp3","size":960768},{"id":"built-in-47","name":"새소리","category":"새소리","src":"/audio/audio-47.mp3","size":954624}];
const guessCategory=(name='')=>{const n=name.toLowerCase().replace(/\s/g,'');for(const [category,words] of Object.entries({'물소리':['물소리','조용한물','큰물소리','stream','river','water'],'새소리':['새','bird','chirp'],'파도':['파도','ocean','wave','sea'],'지하철':['지하철','subway','metro'],'회사':['회사','office'],'커피숍':['커피','cafe','coffee'],'기차':['기차','train'],'드라이어':['드라이어','dryer','hairdryer'],'폭포':['폭포','waterfall'],'귀뚜라미':['귀뚜라미','cricket'],'모닥불':['모닥불','fire','campfire'],'숲':['숲','forest'],'비':['비','rain'],'천둥':['천둥','thunder']})){if(words.some(w=>n.includes(w)))return category}return '기타'};

// 두 오디오 요소를 번갈아 사용해 파일 끝 0.5초를 다음 반복의 처음과 겹칩니다.
// Safari 백그라운드에서는 타이머가 제한될 수 있어 기본 loop도 안전장치로 남깁니다.
function createSmoothLoop(url){
 const tracks=[new Audio(url),new Audio(url)];let active=0,transitioning=false,level=.6,started=false,fadeJob=null;
 for(const a of tracks){a.preload='auto';a.loop=true;a.playsInline=true;a.volume=0}
 const clearFade=()=>{if(fadeJob!==null){clearInterval(fadeJob);fadeJob=null}};
 const volume=v=>{level=Math.max(0,Math.min(1,v));if(!transitioning)tracks[active].volume=level};
 const stop=()=>{clearFade();transitioning=false;started=false;for(const a of tracks){a.pause();a.volume=0;try{a.currentTime=0}catch{}}};
 const play=()=>{if(started)return;started=true;const a=tracks[active];a.loop=true;a.volume=level;a.play().catch(e=>{started=false;console.warn('재생 차단',e)})};
 tracks.forEach((audio,idx)=>audio.addEventListener('timeupdate',()=>{
   if(!started||transitioning||active!==idx||document.hidden)return;
   if(!Number.isFinite(audio.duration)||audio.duration<1.5)return;
   if(audio.duration-audio.currentTime>0.62)return;
   const incoming=tracks[1-idx];transitioning=true;incoming.loop=true;incoming.volume=0;
   try{incoming.currentTime=0}catch{}
   incoming.play().then(()=>{
     const began=performance.now();clearFade();fadeJob=setInterval(()=>{
       const t=Math.min(1,(performance.now()-began)/520);
       audio.volume=level*(1-t);incoming.volume=level*t;
       if(t>=1){clearFade();audio.pause();try{audio.currentTime=0}catch{}active=1-idx;transitioning=false}
     },35)
   }).catch(()=>{transitioning=false;audio.loop=true})
 }));
 return {play,stop,volume};
}


// Session events are reconciled by ID so pause/stop never double-count.
const mindSession=(item)=>window.dispatchEvent(new CustomEvent('mind-flow-session',{detail:item}));
const dayStamp=(t=Date.now())=>{const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const sessionClock=()=>new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
const NADI_PHASES=[['左吸','왼쪽 들숨'],['停','멈춤'],['右吐','오른쪽 날숨'],['停','멈춤'],['右吸','오른쪽 들숨'],['停','멈춤'],['左吐','왼쪽 날숨'],['停','멈춤']];
const nadiNumber=n=>{const digits=['零','一','二','三','四','五','六','七','八','九'];return n<10?digits[n]:`${n<20?'':digits[Math.floor(n/10)]}十${n%10?digits[n%10]:''}`};
const nadiStep=(index,inhaleBeats,exhaleBeats,holdBeats)=>{const lengths=[inhaleBeats,holdBeats,exhaleBeats,holdBeats,inhaleBeats,holdBeats,exhaleBeats,holdBeats];const total=lengths.reduce((a,b)=>a+b,0);let offset=index%total;let phase=0;while(offset>=lengths[phase])offset-=lengths[phase++];return {phase,beat:offset,completed:Math.floor(index/total)}};
function NadiBreathing(){
 const [goal,setGoal]=useState(12),[bpm,setBpm]=useState(60),[metroVol,setMetroVol]=useState(30),[voiceVol,setVoiceVol]=useState(80);
 const [inhaleBeats,setInhaleBeats]=useState(4),[exhaleBeats,setExhaleBeats]=useState(4),[holdBeats,setHoldBeats]=useState(4);
 const cycleBeats=2*inhaleBeats+2*exhaleBeats+4*holdBeats;
 const [status,setStatus]=useState('idle'),[completed,setCompleted]=useState(0),[phase,setPhase]=useState(0),[beat,setBeat]=useState(0);
 const phaseBeats=phase%2===1?holdBeats:phase%4===0?inhaleBeats:exhaleBeats;
 const timer=useRef(null),clock=useRef({next:0,index:0}),context=useRef(null),settings=useRef({});
 const logRef=useRef(null);
 const record=(final=false)=>{const r=logRef.current;if(!r||clock.current.index===0)return;const count=Math.floor(clock.current.index/((2*settings.current.inhaleBeats+2*settings.current.exhaleBeats+4*settings.current.holdBeats)));const secs=Math.round(count*(2*settings.current.inhaleBeats+2*settings.current.exhaleBeats+4*settings.current.holdBeats)*60/settings.current.bpm);mindSession({id:r.id,date:dayStamp(r.started),type:'호흡',name:'나디 쇼다나',count,goal:r.goal,secs,finished:final&&count>=r.goal,time:sessionClock(),started:r.started});};
 settings.current={goal,bpm,metroVol,voiceVol,inhaleBeats,exhaleBeats,holdBeats};
 const clear=()=>{if(timer.current){clearInterval(timer.current);timer.current=null}if(typeof window!=='undefined'&&window.speechSynthesis)window.speechSynthesis.cancel()};
 useEffect(()=>()=>{clear();if(context.current)context.current.close().catch(()=>{})},[]);
 const say=(text,rate,vol)=>{if(!vol||!('speechSynthesis' in window))return;const synth=window.speechSynthesis;const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=rate;u.volume=vol/100;const voices=synth.getVoices();const chosen=voices.find(v=>v.lang?.toLowerCase().startsWith('zh-cn'))||voices.find(v=>v.lang?.toLowerCase().startsWith('zh'));if(chosen)u.voice=chosen;u.onerror=e=>console.warn('중국어 음성 재생 오류:',e.error);if(synth.paused)synth.resume();if(synth.pending)synth.cancel();synth.speak(u)};
 const tickSound=(vol)=>{if(!vol)return;try{const c=context.current;if(!c)return;const o=c.createOscillator(),g=c.createGain(),now=c.currentTime;o.type='sine';o.frequency.value=880;g.gain.setValueAtTime(Math.max(.001,vol/100*.15),now);g.gain.exponentialRampToValueAtTime(.001,now+.055);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+.06)}catch{}};
 const run=()=>{clear();const scheduler=()=>{const now=performance.now();if(now+8<clock.current.next)return;const cfg=settings.current;const i=clock.current.index;const {phase:p,beat:b,completed:totalDone}=nadiStep(i,cfg.inhaleBeats,cfg.exhaleBeats,cfg.holdBeats);if(totalDone>=cfg.goal){record(true);logRef.current=null;clear();setCompleted(cfg.goal);setStatus('done');return}setPhase(p);setBeat(b);setCompleted(totalDone);tickSound(cfg.metroVol);say(b===0?NADI_PHASES[p][0]:nadiNumber(b+1),Math.max(0.5,Math.min(3,(b===0?1.55:1.05)*cfg.bpm/60)),cfg.voiceVol);clock.current.index+=1;clock.current.next+=60000/cfg.bpm;if(clock.current.next<now-60000/cfg.bpm)clock.current.next=now+60000/cfg.bpm};scheduler();timer.current=setInterval(scheduler,35)};
 const start=async()=>{logRef.current={id:crypto.randomUUID(),started:Date.now(),goal:settings.current.goal};try{if(!context.current)context.current=new (window.AudioContext||window.webkitAudioContext)();await context.current.resume()}catch{}if('speechSynthesis' in window){try{window.speechSynthesis.getVoices();window.speechSynthesis.resume()}catch{}}clock.current={next:performance.now()+100,index:0};setCompleted(0);setBeat(0);setPhase(0);setStatus('running');run()};
 const pause=()=>{clear();record();setStatus('paused')};
 const resume=async()=>{try{await context.current?.resume()}catch{}clock.current.next=performance.now()+120;setStatus('running');run()};
 const stop=()=>{record();logRef.current=null;clear();setStatus('idle');setCompleted(0);setBeat(0);setPhase(0)};
 const changeBpm=v=>{setBpm(+v);if(status==='running')clock.current.next=performance.now()+60000/(+v)};
 return <><div className="page-heading"><div className="eyebrow">NADI SHODHANA</div><h1>나디 쇼다나 · 108</h1><p>左吸 → 停 → 右吐 → 停 → 右吸 → 停 → 左吐 → 停 · 여덟 단계가 1회</p></div>
 <section className="panel nadi-panel"><div className="nadi-current"><span>{status==='running'?'호흡 진행 중':status==='paused'?'일시정지':status==='done'?'수행 완료':'교대 비공 호흡'}</span><strong>{NADI_PHASES[phase][0]}</strong><div className="nadi-beats" style={{flexWrap:'wrap',gap:6}}>{Array.from({length:phaseBeats},(_,i)=>nadiNumber(i+1)).map((n,i)=><span key={i} className={beat===i&&status==='running'?'on':''}>{i===0?NADI_PHASES[phase][0]:n}</span>)}</div><small>{NADI_PHASES[phase][1]}</small></div><div className="range-label"><b>완료 횟수</b><span>{completed} / {goal}회</span></div><div className="nadi-progress"><div style={{width:`${completed/goal*100}%`}}/></div><div className="action-row">{status==='running'?<button className="primary" onClick={pause}><Pause size={16}/> 일시정지</button>:<button className="primary" onClick={status==='paused'?resume:start}><Play size={16}/> {status==='paused'?'계속하기':'시작'}</button>}<button className="secondary" onClick={stop}><Square size={16}/> 정지</button></div></section>
 <section className="panel nadi-settings"><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:18}}><label>들숨 박자<input aria-label="들숨 공통 박자" type="number" min="1" max="60" step="1" value={inhaleBeats} disabled={status==='running'||status==='paused'} onChange={e=>{setInhaleBeats(Math.max(1,Math.min(60,Math.round(Number(e.target.value)||1))));setPhase(0);setBeat(0);setCompleted(0)}} style={{width:'100%',marginTop:6}}/><small>左吸 · 右吸 공통</small></label><label>날숨 박자<input aria-label="날숨 공통 박자" type="number" min="1" max="60" step="1" value={exhaleBeats} disabled={status==='running'||status==='paused'} onChange={e=>{setExhaleBeats(Math.max(1,Math.min(60,Math.round(Number(e.target.value)||1))));setPhase(0);setBeat(0);setCompleted(0)}} style={{width:'100%',marginTop:6}}/><small>右吐 · 左吐 공통</small></label><label>멈춤 박자<input aria-label="멈춤 공통 박자" type="number" min="1" max="60" step="1" value={holdBeats} disabled={status==='running'||status==='paused'} onChange={e=>{setHoldBeats(Math.max(1,Math.min(60,Math.round(Number(e.target.value)||1))));setPhase(0);setBeat(0);setCompleted(0)}} style={{width:'100%',marginTop:6}}/><small>네 번의 停 공통</small></label></div><p className="micro">박자는 정지한 상태에서 변경해 주세요. 한 바퀴 {cycleBeats}박 · 현재 단계 {phase+1}/8 · {phaseBeats}박</p><div className="range-label"><b>반복 횟수</b><span>{goal} / 108회</span></div><input type="range" min="1" max="108" step="1" value={goal} onChange={e=>setGoal(+e.target.value)}/><div className="range-label"><b>카운트 · 메트로놈 공통 속도</b><span>{bpm} BPM</span></div><input type="range" min="30" max="120" step="5" value={bpm} onChange={e=>changeBpm(e.target.value)}/><div className="range-label"><b>메트로놈 음량</b><span>{metroVol}%</span></div><input type="range" min="0" max="100" step="5" value={metroVol} onChange={e=>setMetroVol(+e.target.value)}/><div className="range-label"><b>중국어 카운트 음량</b><span>{voiceVol}%</span></div><input type="range" min="0" max="100" step="5" value={voiceVol} onChange={e=>setVoiceVol(+e.target.value)}/><p className="muted">예상 시간: {Math.floor(goal*cycleBeats*60/bpm/60)}분 {Math.round(goal*cycleBeats*60/bpm%60)}초 · 첫 박의 두 글자는 빠르게 발음해요.</p></section>
 <button type="button" className="secondary" onClick={()=>say(['左吸',...Array.from({length:inhaleBeats-1},(_,i)=>nadiNumber(i+2)),'停',...Array.from({length:holdBeats-1},(_,i)=>nadiNumber(i+2))].join('，'),Math.max(0.5,Math.min(3,1.05*settings.current.bpm/60)),settings.current.voiceVol||80)}>🔊 중국어 음성 테스트</button><p className="micro">음성은 기기의 중국어 음성 엔진을 사용해요. 음성 발음 속도와 메트로놈 박자 간격은 공통 BPM에 따라 함께 조절되지만 기기별 음성 합성 지연은 있을 수 있어요. 화면 잠금 중 박자 재생은 별도 테스트가 필요해요. 무리해서 숨을 참지 말고 어지러우면 즉시 중단하세요.</p></>;
}

function FireBreathing(){
 const [seconds,setSeconds]=useState(20),[bpm,setBpm]=useState(45),[volume,setVolume]=useState(35);
 const [status,setStatus]=useState('idle'),[elapsed,setElapsed]=useState(0),[pulses,setPulses]=useState(0);
 const interval=useRef(null),timeRef=useRef({elapsed:0,pulses:0,next:0,last:0}),audio=useRef(null),config=useRef({});
 const logRef=useRef(null);
 const record=(final=false)=>{const r=logRef.current;if(!r||timeRef.current.elapsed<500)return;mindSession({id:r.id,date:dayStamp(r.started),type:'호흡',name:'불의 호흡',count:timeRef.current.pulses,goal:r.goal,secs:Math.round(timeRef.current.elapsed/1000),finished:final,time:sessionClock(),started:r.started,unit:'회(날숨)'});};
 config.current={seconds,bpm,volume};
 const clear=()=>{if(interval.current!==null){clearInterval(interval.current);interval.current=null}};
 useEffect(()=>()=>{clear();audio.current?.close().catch(()=>{})},[]);
 const click=()=>{const v=config.current.volume;if(!v||!audio.current)return;try{const ctx=audio.current,t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=540;g.gain.setValueAtTime(Math.max(.0001,v/100*.12),t);g.gain.exponentialRampToValueAtTime(.0001,t+.055);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.06)}catch{}};
 const pump=()=>{const now=performance.now(),c=config.current,r=timeRef.current;const delta=Math.max(0,Math.min(250,now-r.last));r.last=now;r.elapsed+=delta;if(r.elapsed>=c.seconds*1000){r.elapsed=c.seconds*1000;record(true);logRef.current=null;clear();setElapsed(c.seconds);setStatus('done');return}if(now>=r.next){click();r.pulses++;r.next+=60000/c.bpm;if(r.next<now)r.next=now+60000/c.bpm;setPulses(r.pulses)}setElapsed(r.elapsed/1000)};
 const begin=async(fresh)=>{try{if(!audio.current)audio.current=new (window.AudioContext||window.webkitAudioContext)();await audio.current.resume()}catch{}clear();const now=performance.now();if(fresh){logRef.current={id:crypto.randomUUID(),started:Date.now(),goal:config.current.seconds};timeRef.current={elapsed:0,pulses:0,next:now+80,last:now};setElapsed(0);setPulses(0)}else{timeRef.current.last=now;timeRef.current.next=now+80}setStatus('running');interval.current=setInterval(pump,25)};
 const pause=()=>{clear();record();setStatus('paused')};
 const stop=()=>{record();logRef.current=null;clear();timeRef.current={elapsed:0,pulses:0,next:0,last:0};setElapsed(0);setPulses(0);setStatus('idle')};
 const changeBpm=n=>{setBpm(+n);if(status==='running')timeRef.current.next=performance.now()+60000/(+n)};
 return <><div className="page-heading"><div className="eyebrow">BREATH OF FIRE</div><h1>🔥 불의 호흡</h1><p>짧은 날숨마다 복부를 가볍게 당기는 리듬 연습</p></div>
 <section className="panel nadi-panel"><div className="nadi-current"><span>{status==='running'?'리듬에 맞춰 후!':status==='paused'?'일시정지':status==='done'?'연습 완료':'편하게 앉아 준비하세요'}</span><strong style={{fontSize:'clamp(30px,8vw,52px)'}}>{status==='running'?'후!':'🔥'}</strong><small>{Math.ceil(Math.max(0,seconds-elapsed))}초 남음 · {pulses}번 리듬</small></div><div className="nadi-progress"><div style={{width:`${Math.min(100,elapsed/seconds*100)}%`}}/></div><div className="action-row">{status==='running'?<button className="primary" onClick={pause}><Pause size={16}/> 일시정지</button>:<button className="primary" onClick={()=>begin(status!=='paused')}><Play size={16}/> {status==='paused'?'계속하기':'시작'}</button>}<button className="secondary" onClick={stop}><Square size={16}/> 정지</button></div></section>
 <section className="panel nadi-settings"><div className="range-label"><b>수행 시간</b><span>{seconds}초</span></div><input type="range" min="10" max="60" step="5" value={seconds} disabled={status==='running'||status==='paused'} onChange={e=>setSeconds(+e.target.value)}/><div className="range-label"><b>메트로놈 속도</b><span>{bpm} BPM</span></div><input type="range" min="30" max="120" step="5" value={bpm} onChange={e=>changeBpm(e.target.value)}/><div className="range-label"><b>메트로놈 음량</b><span>{volume}%</span></div><input type="range" min="0" max="100" step="5" value={volume} onChange={e=>setVolume(+e.target.value)}/><p className="muted">예상 리듬 횟수: 약 {Math.round(seconds*bpm/60)}회 · 한 번의 소리에 짧게 내쉬고 복부를 편안하게 풀어요.</p></section>
 <p className="micro">빠른 호흡은 어지럼증과 과호흡을 유발할 수 있어요. 처음에는 10~20초만 천천히 연습하고, 어지럽거나 불편하면 즉시 멈추세요. 임신 중이거나 심혈관·호흡기 질환이 있다면 전문가와 상의하세요. 화면 잠금 시 메트로놈 박자는 보장되지 않아요.</p></>;
}
const GUIDED_BREATHS={
 bhramari:{title:'🐝 브라마리',subtitle:'들이마신 뒤 날숨에 편안하게 음~~~~',phases:[['들숨',4],['음~~~~',6]],warning:'목을 조이지 말고 편안한 음높이로 허밍하세요.'},
 sama:{title:'🌿 사마 브리티',subtitle:'들이마시기와 내쉬기를 같은 길이로',phases:[['들이마시기',4],['내쉬기',4]],warning:'무리하게 크게 들이마시지 말고 편안하게 호흡하세요.'},
 ujjayi:{title:'🌊 우짜이',subtitle:'목 뒤쪽에서 부드러운 바람 소리를 내며',phases:[['들이마시기',4],['내쉬기',4]],warning:'목을 세게 조이지 않고 가볍게 숨소리를 느껴보세요.'},
 box:{title:'⬜ 박스 호흡',subtitle:'들숨 · 멈춤 · 날숨 · 멈춤',phases:[['들이마시기',4],['멈춤',4],['내쉬기',4],['멈춤',4]],warning:'숨 참기가 불편하면 즉시 중단하거나 다른 호흡을 선택하세요.'},
 four78:{title:'🌙 4-7-8 호흡',subtitle:'4박 들숨 · 7박 멈춤 · 8박 날숨',phases:[['들이마시기',4],['멈춤',7],['내쉬기',8]],warning:'7박 숨 참기가 불편하거나 어지러우면 바로 멈추세요. 억지로 참지 마세요.'}
};
function GuidedBreathing({mode}){
 const cfg=GUIDED_BREATHS[mode];
 const [bpm,setBpm]=useState(60),[cycles,setCycles]=useState(5),[vol,setVol]=useState(25),[voiceVol,setVoiceVol]=useState(80);
 const [status,setStatus]=useState('idle'),[finished,setFinished]=useState(0),[phase,setPhase]=useState(0),[beat,setBeat]=useState(0);
 const clock=useRef({next:0,index:0}),timer=useRef(null),ctx=useRef(null),settings=useRef({});
 const logRef=useRef(null);
 const record=(final=false)=>{const r=logRef.current;if(!r||clock.current.index===0)return;const count=Math.floor(clock.current.index/totalBeats);mindSession({id:r.id,date:dayStamp(r.started),type:'호흡',name:GUIDED_BREATHS[mode].title.replace(/^[^가-힣]+/,'').trim(),count,goal:r.goal,secs:Math.round(clock.current.index*60/settings.current.bpm),finished:final&&count>=r.goal,time:sessionClock(),started:r.started});};
 settings.current={bpm,cycles,vol,voiceVol};
 const totalBeats=cfg.phases.reduce((a,b)=>a+b[1],0);
 const clear=()=>{if(timer.current!==null){clearInterval(timer.current);timer.current=null}if(typeof window!=='undefined'&&window.speechSynthesis)window.speechSynthesis.cancel()};
 useEffect(()=>()=>{clear();ctx.current?.close().catch(()=>{})},[]);
 const click=()=>{if(!ctx.current||!settings.current.vol)return;try{const t=ctx.current.currentTime,o=ctx.current.createOscillator(),g=ctx.current.createGain();o.frequency.value=440;o.type='sine';g.gain.setValueAtTime(Math.max(.0001,settings.current.vol*.0012),t);g.gain.exponentialRampToValueAtTime(.0001,t+.065);o.connect(g);g.connect(ctx.current.destination);o.start(t);o.stop(t+.07)}catch{}};
 const speakBeat=(phaseIndex,beatIndex)=>{
  const volume=settings.current.voiceVol;
  if(!volume||!('speechSynthesis' in window))return;
  const phaseName=cfg.phases[phaseIndex][0];
  const word=beatIndex===0?(phaseName==='들숨'?'吸':phaseName==='멈춤'?'停':phaseName==='내쉬기'||phaseName==='음~~~~'?'吐':'吸'):(['一','二','三','四','五','六','七','八','九','十'][beatIndex]||String(beatIndex+1));
  const synth=window.speechSynthesis;
  const utterance=new SpeechSynthesisUtterance(word);
  utterance.lang='zh-CN';
  const voices=synth.getVoices();
  utterance.voice=voices.find(v=>v.lang?.toLowerCase().startsWith('zh-cn'))||voices.find(v=>v.lang?.toLowerCase().startsWith('zh'))||null;
  utterance.volume=volume/100;
  utterance.rate=Math.max(.65,Math.min(1.8,settings.current.bpm/60*1.12));
  if(synth.paused)synth.resume();
  // Cancel only speech that is still queued; the new utterance always starts on the shared beat.
  if(synth.pending)synth.cancel();
  synth.speak(utterance);
 };
 const tick=()=>{const now=performance.now(),c=settings.current,r=clock.current;if(now<r.next)return;const current=r.index,done=Math.floor(current/totalBeats);if(done>=c.cycles){record(true);logRef.current=null;clear();setStatus('done');setFinished(c.cycles);return}let pos=current%totalBeats,pi=0;for(let i=0;i<cfg.phases.length;i++){if(pos<cfg.phases[i][1]){pi=i;break}pos-=cfg.phases[i][1]}setPhase(pi);setBeat(pos);setFinished(done);click();speakBeat(pi,pos);r.index++;r.next+=60000/c.bpm;if(r.next<now-300)r.next=now+60000/c.bpm};
 const begin=async(resume=false)=>{try{if(!ctx.current)ctx.current=new (window.AudioContext||window.webkitAudioContext)();await ctx.current.resume()}catch{}clear();if('speechSynthesis' in window){try{window.speechSynthesis.getVoices();window.speechSynthesis.resume()}catch{}}if(!resume){logRef.current={id:crypto.randomUUID(),started:Date.now(),goal:settings.current.cycles};clock.current.index=0;setFinished(0);setPhase(0);setBeat(0)}clock.current.next=performance.now()+60;setStatus('running');timer.current=setInterval(tick,30)};
 const stop=()=>{record();logRef.current=null;clear();clock.current.index=0;setFinished(0);setPhase(0);setBeat(0);setStatus('idle')};
 const changeBpm=v=>{setBpm(+v);if(status==='running')clock.current.next=performance.now()+60000/(+v)};
 return <><div className="page-heading"><div className="eyebrow">PRANAYAMA</div><h1>{cfg.title}</h1><p>{cfg.subtitle}</p></div>
 <section className="panel nadi-panel"><div className="nadi-current"><small>{status==='done'?'수행 완료':status==='paused'?'일시정지':`${finished} / ${cycles}회`}</small><strong>{cfg.phases[phase][0]}</strong><div className="nadi-beats">{Array.from({length:cfg.phases[phase][1]},(_,i)=><span key={i} className={beat===i?'on':''}>{i===0?(cfg.phases[phase][0]==='들숨'?'吸':cfg.phases[phase][0]==='멈춤'?'停':'吐'):['一','二','三','四','五','六','七','八','九','十'][i]}</span>)}</div><small>{cfg.phases[phase][1]}박 · {bpm} BPM</small></div><div className="nadi-progress"><div style={{width:`${Math.min(100,finished/cycles*100)}%`}}/></div><div className="action-row">{status==='running'?<button className="primary" onClick={()=>{clear();record();setStatus('paused')}}><Pause size={16}/> 일시정지</button>:<button className="primary" onClick={()=>begin(status==='paused')}><Play size={16}/> {status==='paused'?'계속하기':'시작'}</button>}<button className="secondary" onClick={stop}><Square size={16}/> 정지</button></div></section>
 <section className="panel nadi-settings"><div className="range-label"><b>반복 횟수</b><span>{cycles}회</span></div><input type="range" min="1" max="30" step="1" value={cycles} disabled={status==='running'||status==='paused'} onChange={e=>setCycles(+e.target.value)}/><div className="range-label"><b>호흡 박자 속도</b><span>{bpm} BPM</span></div><input type="range" min="30" max="90" step="5" value={bpm} onChange={e=>changeBpm(e.target.value)}/><div className="range-label"><b>중국어 카운트 음량</b><span>{voiceVol}%</span></div><input type="range" min="0" max="100" step="5" value={voiceVol} onChange={e=>setVoiceVol(+e.target.value)}/><div className="range-label"><b>메트로놈 음량</b><span>{vol}%</span></div><input type="range" min="0" max="100" step="5" value={vol} onChange={e=>setVol(+e.target.value)}/><p className="muted">한 박 = {Math.round(60000/bpm)/1000}초 · 예상 시간 약 {Math.ceil(cycles*totalBeats*60/bpm)}초</p></section><p className="micro">{cfg.warning} 어지럽거나 숨이 차면 즉시 정지하세요. 화면 잠금 중 메트로놈은 브라우저 정책에 따라 끊길 수 있어요.</p></>;
}
function BreathingStudio({clips=[]}){
 const [mode,setMode]=useState('nadi');
 const [backgroundId,setBackgroundId]=useState('');
 const [backgroundVolume,setBackgroundVolume]=useState(30);
 const [backgroundPlaying,setBackgroundPlaying]=useState(false);
 const backgroundPlayer=useRef(null);
 const backgroundUrl=useRef(null);
 const choices=[['nadi','🧘 나디 쇼다나'],['fire','🔥 불의 호흡'],['bhramari','🐝 브라마리'],['sama','🌿 사마 브리티'],['ujjayi','🌊 우짜이'],['box','⬜ 박스 호흡'],['four78','🌙 4-7-8 호흡']];
 const options=useMemo(()=>[...clips].sort((a,b)=>{
   const ka=`${a.category||guessCategory(a.name)}-${a.name}`;
   const kb=`${b.category||guessCategory(b.name)}-${b.name}`;
   return ka.localeCompare(kb,'ko');
 }),[clips]);
 const stopBackground=()=>{backgroundPlayer.current?.stop();backgroundPlayer.current=null;
   if(backgroundUrl.current){URL.revokeObjectURL(backgroundUrl.current);backgroundUrl.current=null}
   setBackgroundPlaying(false);
 };
 const selectBackground=(id)=>{
   stopBackground();setBackgroundId(id);
   if(!id)return;
   const clip=options.find(c=>c.id===id);if(!clip)return;
   const url=clip.src||URL.createObjectURL(clip.file);
   if(!clip.src)backgroundUrl.current=url;
   const player=createSmoothLoop(url);
   backgroundPlayer.current=player;
   player.volume(backgroundVolume/100);
   player.play();setBackgroundPlaying(true);
 };
 const updateBackgroundVolume=(value)=>{
   const next=Number(value);setBackgroundVolume(next);
   backgroundPlayer.current?.volume(next/100);
 };
 const toggleBackground=()=>{
   if(backgroundPlaying){backgroundPlayer.current?.stop();setBackgroundPlaying(false)}
   else if(backgroundId){const clip=options.find(c=>c.id===backgroundId);if(!clip)return;
     if(!backgroundPlayer.current){selectBackground(backgroundId);return}
     backgroundPlayer.current.volume(backgroundVolume/100);backgroundPlayer.current.play();setBackgroundPlaying(true)}
 };
 useEffect(()=>()=>{backgroundPlayer.current?.stop();if(backgroundUrl.current)URL.revokeObjectURL(backgroundUrl.current)},[]);
 return <>
 <section className="panel"><div className="range-label"><b>호흡 프로그램</b></div><select aria-label="호흡 프로그램 선택" value={mode} onChange={e=>setMode(e.target.value)} style={{width:'100%',padding:'14px 16px',border:'1px solid #e7dbee',borderRadius:'14px',background:'#f7f1fb',color:'#765899',fontSize:'16px',fontWeight:600}}>{choices.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></section>
 {mode==='nadi'?<NadiBreathing key="nadi"/>:mode==='fire'?<FireBreathing key="fire"/>:<GuidedBreathing key={mode} mode={mode}/>}
 <section className="panel nadi-settings" style={{marginTop:20}}>
   <div className="range-label"><b>🌿 자연의 소리</b><span>{backgroundPlaying?'재생 중': '정지'}</span></div>
   <select aria-label="호흡 배경 자연음" value={backgroundId} onChange={e=>selectBackground(e.target.value)} style={{width:'100%',padding:'14px 16px',border:'1px solid #e7dbee',borderRadius:'14px',background:'#f7f1fb',color:'#765899',fontSize:'16px'}}>
     <option value="">선택 안 함 (무음)</option>
     {options.map(clip=><option key={clip.id} value={clip.id}>{clip.category||guessCategory(clip.name)} - {clip.name}</option>)}
   </select>
   <div className="range-label" style={{marginTop:18}}><b>자연음 볼륨</b><span>{backgroundVolume}%</span></div>
   <input type="range" min="0" max="100" step="5" value={backgroundVolume} onChange={e=>updateBackgroundVolume(e.target.value)} aria-label="자연음 볼륨"/>
   <button type="button" className="secondary" disabled={!backgroundId} onClick={toggleBackground}>{backgroundPlaying?'⏸ 자연음 정지':'▶ 자연음 재생'}</button>
   <p className="micro">음원을 선택하면 반복 재생돼요. 호흡 중에도 자연음 볼륨을 조절할 수 있어요. 카운트와 메트로놈의 볼륨은 별도로 유지돼요.</p>
 </section>
 </>;
}

// Independent nature-sound selector for exercise playback. Reuses Mind Flow audio files.
function StudioSoundMixer({clips=[]}){
 const [levels,setLevels]=useState({});
 const players=useRef({});
 const urls=useRef({});
 const audioClips=clips.filter(c=>c.src||c.file);
 const change=(clip,value)=>{
  const v=Number(value);setLevels(prev=>({...prev,[clip.id]:v}));
  if(v<=0){players.current[clip.id]?.stop();return;}
  if(!players.current[clip.id]){
   const url=clip.src||URL.createObjectURL(clip.file);
   if(!clip.src)urls.current[clip.id]=url;
   players.current[clip.id]=createSmoothLoop(url);
  }
  players.current[clip.id].volume(v/100);
  players.current[clip.id].play();
 };
 useEffect(()=>()=>{
   Object.values(players.current).forEach(p=>p.stop());
   Object.values(urls.current).forEach(u=>URL.revokeObjectURL(u));
 },[]);
 return <div style={{display:'grid',gap:10,marginTop:10}}>
   {audioClips.length===0?<p className="micro">자연음 목록을 불러오는 중이에요.</p>:null}
   {audioClips.map(c=><label key={c.id} style={{display:'grid',gap:4,fontSize:13,color:'#735989'}}>
    <span style={{display:'flex',justifyContent:'space-between',gap:8}}><span>{c.category||guessCategory(c.name)} · {c.name}</span><span>{levels[c.id]||0}%</span></span>
    <input type="range" aria-label={c.name+' 자연음 볼륨'} min="0" max="100" step="5" value={levels[c.id]||0} onChange={e=>change(c,e.target.value)}/>
   </label>)}
   <button type="button" className="secondary" onClick={()=>{
    Object.values(players.current).forEach(p=>p.stop());setLevels({});
   }}>■ 자연음 모두 정지</button>
   <p className="micro">여러 소리를 동시에 선택할 수 있어요. 각 소리는 반복 재생돼요.</p>
 </div>;
}
function App(){const [tab,setTab]=useState('홈'),[data,save]=usePersist(),[clips,setClips]=useState([]),[soundCategory,setSoundCategory]=useState('물소리'),[uploadCategory,setUploadCategory]=useState('물소리'),[busy,setBusy]=useState(false),[playing,setPlaying]=useState(false),[paused,setPaused]=useState(false),[remaining,setRemaining]=useState(1200),[duration,setDuration]=useState(data.selectedMinutes||20),[unlimited,setUnlimited]=useState(false),[elapsed,setElapsed]=useState(0),[fade,setFade]=useState(true),[bell,setBell]=useState(true),[selectedDate,setSelectedDate]=useState(today()),[viewMonth,setViewMonth]=useState(new Date()),[folder,setFolder]=useState('전체'),[q,setQ]=useState(''),[currentVideo,setCurrentVideo]=useState(null),[videoError,setVideoError]=useState(false),[breathMode,setBreathMode]=useState('편안한 호흡'),[breathRunning,setBreathRunning]=useState(false),[breathSec,setBreathSec]=useState(0),[breathTotal,setBreathTotal]=useState(5),[showSettings,setShowSettings]=useState(false);const players=useRef({}),urlRefs=useRef({}),endAt=useRef(0),remainingAtPause=useRef(0),timerStart=useRef(0),startTimestamp=useRef(0),sessionRecorded=useRef(false);const [volumes,setVolumes]=useState(data.volumes||{});
 const [recordSections,setRecordSections]=useState({breath:true,meditation:true,mantra:true});
 const sessionsRef=useRef(data.sessions);sessionsRef.current=data.sessions;
 useEffect(()=>{const handler=(event)=>{const item=event.detail;if(!item?.id)return;save(prev=>{const old=prev.sessions||[];return {sessions:[...old.filter(x=>x.id!==item.id),item]}})};window.addEventListener('mind-flow-session',handler);return()=>window.removeEventListener('mind-flow-session',handler)},[]);
 const meditationRef=useRef({id:null,started:0,accum:0,last:0,names:[]});
 const anyNaturePlaying=()=>clips.some(c=>(volumesRef.current[c.id]||0)>0);
 const volumesRef=useRef(volumes);volumesRef.current=volumes;
 const flushMeditation=(active)=>{const r=meditationRef.current;if(!r.id)return;const now=Date.now();if(r.last){r.accum+=Math.max(0,(now-r.last)/1000)}r.last=active?now:0;if(r.accum>=1){mindSession({id:r.id,date:dayStamp(r.started),type:'명상',name:'자연의 소리',secs:Math.round(r.accum),sounds:r.names,time:sessionClock(),started:r.started})}if(!active)meditationRef.current={id:null,started:0,accum:0,last:0,names:[]};};
 const trackMeditation=(nextVolumes)=>{const active=clips.filter(c=>(nextVolumes[c.id]||0)>0);const r=meditationRef.current;if(r.id)flushMeditation(true);if(active.length&&!meditationRef.current.id){meditationRef.current={id:crypto.randomUUID(),started:Date.now(),accum:0,last:Date.now(),names:[]}}if(active.length){meditationRef.current.names=[...new Set([...meditationRef.current.names,...active.map(c=>`${c.category||guessCategory(c.name)} - ${c.name}`)])]}else flushMeditation(false);};
 useEffect(()=>{const timer=setInterval(()=>{if(meditationRef.current.id)flushMeditation(true)},15000);const onHide=()=>{if(document.hidden&&meditationRef.current.id)flushMeditation(true)};document.addEventListener('visibilitychange',onHide);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',onHide);if(meditationRef.current.id)flushMeditation(false)}},[]);
 const loadClips=async()=>{try{const a=await dbGet();setClips([...builtInClips,...a])}catch(e){console.error('음원 저장소 오류',e);setClips(builtInClips)}};useEffect(()=>{loadClips();return()=>{Object.values(players.current).forEach(p=>p.stop());Object.values(urlRefs.current).forEach(URL.revokeObjectURL)}},[]);
 // 오디오별 볼륨과 재생 상태는 React 타이머와 분리. 탭 이동 중에도 재생 유지.
 const playClip=(clip,v=60)=>{let player=players.current[clip.id];if(!player){const url=clip.src||URL.createObjectURL(clip.file);if(!clip.src)urlRefs.current[clip.id]=url;player=createSmoothLoop(url);players.current[clip.id]=player}player.volume(v/100);player.play()};
 const setVolume=(id,v)=>{v=Number(v);const next={...volumesRef.current,[id]:v};volumesRef.current=next;setVolumes(next);save({volumes:next});trackMeditation(next);const clip=clips.find(c=>c.id===id);if(!clip)return;if(v>0)playClip(clip,v);else players.current[id]?.stop();};
 const toggleCategory=(name)=>{setSoundCategory(name);const matches=clips.filter(c=>(c.category||guessCategory(c.name))===name);if(!matches.length)return;const enabled=matches.some(c=>(volumes[c.id]||0)>0);const next={...volumesRef.current};for(const c of matches){next[c.id]=enabled?0:(volumes[c.id]||60);if(enabled)players.current[c.id]?.stop();else playClip(c,next[c.id])}volumesRef.current=next;setVolumes(next);save({volumes:next});trackMeditation(next)};
 const stopAudio=()=>{Object.values(players.current).forEach(p=>p.stop());const next={...volumesRef.current};clips.forEach(c=>next[c.id]=0);volumesRef.current=next;setVolumes(next);save({volumes:next});trackMeditation(next)};
 




const upload=async(e)=>{const files=Array.from(e.target.files||[]);if(!files.length)return;setBusy(true);try{for(const file of files){if(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|ogg|aac)$/i.test(file.name))continue;await dbPut({id:crypto.randomUUID(),name:file.name.replace(/\.[^.]+$/,''),category:uploadCategory,file,created:Date.now()})}await loadClips()}catch(err){alert('저장 실패: '+err.message+'\n이 기기의 브라우저 저장 공간을 확인해줘.')}finally{setBusy(false);e.target.value=''}};const removeClip=async(id)=>{if(String(id).startsWith('built-in-'))return alert('기본 탑재 음원은 앱 파일에서 관리해요.');if(!confirm('이 음원을 삭제할까?'))return;players.current[id]?.pause();delete players.current[id];if(urlRefs.current[id])URL.revokeObjectURL(urlRefs.current[id]);await dbDelete(id);setVolumes(s=>{let a={...s};delete a[id];save({volumes:a});return a});loadClips()};
const addVideo=()=>{const url=prompt('YouTube 영상 링크를 붙여넣어 줘');if(!url)return;const id=youtubeId(url);if(!id)return alert('유효한 YouTube 영상 링크가 아니야.');const name=prompt('영상 제목을 입력해 줘','새 만트라')||'새 만트라';const folderName=prompt('폴더 이름을 입력해 줘','내 만트라')||'내 만트라';save(s=>({mantras:[{id:crypto.randomUUID(),youtubeId:id,name,folder:folderName,url:`https://www.youtube.com/watch?v=${id}`,favorite:false,created:Date.now()},...s.mantras]}));setFolder('전체')};const folders=['전체',...new Set(data.mantras.map(v=>v.folder).filter(Boolean))].sort((a,b)=>{if(a==='전체')return -1;if(b==='전체')return 1;const aKo=/^[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(a),bKo=/^[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(b);if(aKo!==bKo)return aKo?1:-1;return a.localeCompare(b,aKo?'ko':'en',{sensitivity:'base',numeric:true})});const visibleVideos=data.mantras.filter(v=>(folder==='전체'||folder===v.folder)&&v.name.toLowerCase().includes(q.toLowerCase()));const savePreset=()=>{const name=prompt('프리셋 이름을 입력해 줘','나의 숲속 명상');if(!name)return;save(s=>({presets:[{id:crypto.randomUUID(),name,minutes:duration,volumes:{...volumes},fade,created:Date.now()},...s.presets]}))};const applyPreset=(p)=>{if(playing)return alert('실행 중인 명상을 종료한 뒤 변경해줘.');setVolumes(p.volumes);save({volumes:p.volumes,selectedMinutes:p.minutes});setDuration(p.minutes);setRemaining(p.minutes*60);setFade(p.fade)};
const breathPatterns={'편안한 호흡':[4,0,6,0],'박스 호흡':[4,4,4,4],'복식 호흡':[4,0,6,0],'수면 호흡':[4,0,8,0]};const phases=['들이마시기','머무르기','내쉬기','쉬기'];const cycle=breathPatterns[breathMode].reduce((a,b)=>a+b,0);let localPhase=breathSec%cycle;let breathLabel='들이마시기',phaseLength=4;for(let i=0;i<4;i++){let n=breathPatterns[breathMode][i];if(n===0)continue;if(localPhase<n){breathLabel=phases[i];phaseLength=n-localPhase;break}localPhase-=n};useEffect(()=>{if(!breathRunning)return;const t=setInterval(()=>setBreathSec(v=>v+1),1000);return()=>clearInterval(t)},[breathRunning]);useEffect(()=>{if(breathRunning&&breathSec>=breathTotal*60){setBreathRunning(false);save(s=>({sessions:[...s.sessions,{id:crypto.randomUUID(),date:today(),secs:breathTotal*60,type:'호흡 훈련',time:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}]}))}},[breathSec,breathRunning,breathTotal]);const sumToday=data.sessions.filter(s=>s.date===today()).reduce((a,s)=>a+s.secs,0);const total=data.sessions.reduce((a,s)=>a+s.secs,0);
const weeklyStats=Array.from({length:7},(_,i)=>{const dateObj=new Date();dateObj.setHours(12,0,0,0);dateObj.setDate(dateObj.getDate()-6+i);const date=[dateObj.getFullYear(),String(dateObj.getMonth()+1).padStart(2,'0'),String(dateObj.getDate()).padStart(2,'0')].join('-');const sessions=data.sessions.filter(x=>x.date===date);return {date,day:['일','월','화','수','목','금','토'][dateObj.getDay()],breath:sessions.filter(x=>x.type==='호흡').reduce((a,x)=>a+(Number(x.count)||0),0),meditation:Math.floor(sessions.filter(x=>x.type==='명상'||x.type==='자연음 명상').reduce((a,x)=>a+(Number(x.secs)||0),0)/60),mantra:sessions.filter(x=>x.type==='만트라').length};});
const selectedRecords=(data.sessions||[]).filter(r=>r.date===selectedDate);
const recordGroups=[
 {key:'breath',title:'호흡',icon:Wind,items:selectedRecords.filter(r=>r.type==='호흡'||r.type==='호흡 훈련')},
 {key:'meditation',title:'명상',icon:Flower2,items:selectedRecords.filter(r=>r.type==='명상'||r.type==='자연음 명상')},
 {key:'mantra',title:'만트라',icon:Music2,items:selectedRecords.filter(r=>r.type==='만트라')}
];

 const tabs=[['홈',House],['호흡',Wind],['명상',Flower2],['만트라',Music2],['기록',CalendarDays]];const openVideo=(v)=>{setVideoError(false);setCurrentVideo(v)};const renderTimer=()=>null;
const renderCalendar=()=>{let y=viewMonth.getFullYear(),m=viewMonth.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),cells=Array.from({length:Math.ceil((first+days)/7)*7},(_,i)=>i-first+1);return <><div className="month-bar"><button className="iconbtn" onClick={()=>setViewMonth(new Date(y,m-1,1))}><ChevronLeft/></button><b>{y}년 {m+1}월</b><button className="iconbtn" onClick={()=>setViewMonth(new Date(y,m+1,1))}><ChevronRight/></button></div><div className="calendar-grid">{['일','월','화','수','목','금','토'].map(d=><div className="weekday" key={d}>{d}</div>)}{cells.map((d,i)=>{const date=d>0&&d<=days?`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null;const dayRecords=date?(data.sessions||[]).filter(s=>s.date===date):[];return <button key={i} disabled={!date} onClick={()=>setSelectedDate(date)} className={`day ${selectedDate===date?'selected':''}`}><span>{date?d:''}</span><span style={{display:'flex',gap:3,minHeight:5,justifyContent:'center'}}>{[['호흡','#9c78c1'],['명상','#7db5aa'],['만트라','#d8ab73']].filter(([type])=>dayRecords.some(s=>s.type===type||(type==='명상'&&s.type==='자연음 명상'))).map(([type,color])=><i key={type} style={{position:'static',display:'inline-block',width:5,height:5,borderRadius:'50%',background:color}}/>)}</span></button>})}</div></>};
return <div className="shell"><header><div className="brand"><span className="mark">✦</span><span>MIND FLOW</span></div><button className="iconbtn" onClick={()=>setShowSettings(!showSettings)} aria-label="설정"><Settings size={21}/></button></header>{showSettings&&<div className="notice"><b>앱 사용 안내</b><p>이 버전은 로그인 없는 로컬 체험판이야. 음원·영상·기록은 현재 브라우저에 저장되고 기기 간 동기화되지 않아.</p><p>화면 잠금·백그라운드 믹서 재생, 정확한 자동 종료는 iOS Safari에서 보장되지 않아. 나중에 네이티브 오디오로 별도 테스트해야 해.</p><button className="secondary" onClick={()=>setShowSettings(false)}>닫기</button></div>}
<main>
{tab==='홈'&&<><section className="hero"><div className="eyebrow">YOUR DAILY STILLNESS</div><h1>오늘도, 나에게<br/>집중하는 시간</h1><p>하루하루 쌓이는 고요한 수행을 기록해요.</p><div className="hero-orb">☾</div><button className="hero-button" onClick={()=>setTab('명상')}>나만의 명상 시작 <ChevronRight size={17}/></button></section><section className="home-calm-stats"><h2>오늘의 수행</h2><div className="home-calm-summary">{[['호흡',weeklyStats[6].breath,'회'],['명상',weeklyStats[6].meditation,'분'],['만트라',weeklyStats[6].mantra,'개']].map(([name,value,unit])=><div key={name}><span>{name}</span><strong>{value}<small>{unit}</small></strong></div>)}</div></section><div className="home-calm-charts"><h2>최근 7일</h2>{[['호흡 횟수','breath','회'],['명상 시간','meditation','분'],['만트라 영상','mantra','개']].map(([label,field,unit])=>{const values=weeklyStats.map(x=>x[field]);const highest=Math.max(1,...values);const sum=values.reduce((a,b)=>a+b,0);return <section className="home-calm-chart" key={field}><div className="home-calm-heading"><b>{label}</b><span>{sum}{unit}</span></div><div className="home-calm-bars">{weeklyStats.map((d,i)=><div className="home-calm-day" key={d.date}><div className="home-calm-column"><div className="home-calm-bar" style={{height:`${d[field]===0?0:Math.max(8,d[field]/highest*100)}%`}} title={`${d.date}: ${d[field]}${unit}`}/></div><span>{d.day}</span></div>)}</div></section>})}<p className="home-calm-note">저장된 수행 기록 기준 · 숫자가 없는 날은 0으로 표시돼요.</p></div><h2>오늘은 어떤 시간이 필요해?</h2><div className="quickgrid"><button onClick={()=>setTab('호흡')}><Wind/><b>호흡 훈련</b><span>천천히 들이쉬고 내쉬기</span></button><button onClick={()=>setTab('명상')}><Flower2/><b>자연음 명상</b><span>나만의 사운드 믹서</span></button><button onClick={()=>setTab('만트라')}><Music2/><b>만트라</b><span>저장한 영상 만나기</span></button><button onClick={()=>setTab('기록')}><CalendarDays/><b>명상 기록</b><span>고요했던 시간 모아보기</span></button></div></>}
{tab==='명상'&&<><div className="page-heading"><div className="eyebrow">MEDITATION STUDIO</div><h1>나만의 명상실</h1><p>좋아하는 소리를 섞어 나만의 고요를 만들어요.</p></div><section className="panel"><div className="panel-title"><div><h2>자연음 믹서</h2><p>폴더 없이 버튼으로 선택 · 여러 소리 동시 재생</p></div></div>
<div className="sound-category-grid">{soundCategories.map(([name,emoji])=>{const matches=clips.filter(c=>(c.category||guessCategory(c.name))===name);const active=matches.some(c=>(volumes[c.id]||0)>0);return <button type="button" key={name} className={`sound-category-button ${soundCategory===name?'chosen':''} ${active?'has-volume':''}`} onClick={()=>toggleCategory(name)}><span className="sound-category-emoji">{emoji}</span><span className="sound-category-label">{name}</span>{matches.length>0&&<span className="sound-category-count">{matches.length}</span>}{active&&<span className="sound-category-active" aria-label="볼륨 켜짐"/>}</button>})}</div>
<div className="sound-category-detail"><div className="sound-category-heading"><h3>{soundCategories.find(x=>x[0]===soundCategory)?.[1]} {soundCategory}</h3><span>{clips.filter(c=>(c.category||guessCategory(c.name))===soundCategory).length}개 음원</span></div>
{clips.filter(c=>(c.category||guessCategory(c.name))===soundCategory).length===0?<p className="muted">아직 등록한 음원이 없어요. 아래에서 이 종류의 파일을 추가해줘.</p>:clips.filter(c=>(c.category||guessCategory(c.name))===soundCategory).map(c=><div className="sound" key={c.id}><div className="sound-name"><div className="sound-icon"><Music2 size={18}/></div><div className="sound-text"><b>{c.name}</b><span>{((c.file?.size ?? c.size ?? 0)/1024/1024).toFixed(1)} MB · 반복 재생</span></div><span className="percentage">{volumes[c.id]||0}%</span></div><input aria-label={`${c.name} 볼륨`} type="range" min="0" max="100" step="5" value={volumes[c.id]||0} onChange={e=>setVolume(c.id,e.target.value)}/></div>)}
</div>
<p className="micro">버튼을 누르면 바로 재생돼요. 다시 누르면 멈춰요. 아래에서 재생 중에도 각 소리의 볼륨을 조절할 수 있어요.</p><button className="secondary" onClick={stopAudio} style={{width:'100%',marginTop:14}}>■ 모든 소리 멈추기</button></section></>}
{tab==='호흡'&&<BreathingStudio clips={clips}/>}
{tab==='만트라'&&<><div className="page-heading"><div className="eyebrow">MANTRA LIBRARY</div><h1>나의 만트라</h1><p>좋아하는 유튜브 영상을 폴더별로 모아요.</p></div><section className="panel"><div className="panel-title"><div><h2>영상 라이브러리</h2><p>카드에서 바로 재생할 수 있어요</p></div><button className="upload-btn" onClick={addVideo}><Plus size={16}/> 영상 등록</button></div><div className="search"><Search size={16}/><input placeholder="만트라 제목 검색" value={q} onChange={e=>setQ(e.target.value)}/></div><div style={{margin:"16px 0"}}><label htmlFor="mantra-folder-filter" style={{display:"block",fontSize:13,color:"#927ba8",marginBottom:8,fontWeight:600}}>카테고리 선택</label><select id="mantra-folder-filter" value={folder} onChange={e=>setFolder(e.target.value)} style={{width:"100%",minHeight:48,padding:"10px 14px",borderRadius:14,border:"1px solid #e7dbef",background:"#f8f4fa",color:"#544067",fontSize:16}}>{folders.map(f=><option key={f} value={f}>{f}</option>)}</select></div>{visibleVideos.length===0?<div className="empty"><Music2 size={38}/><b>아직 저장된 영상이 없어요</b><p>유튜브 링크를 붙여넣어<br/>나만의 만트라 라이브러리를 만들어봐요.</p></div>:<div className="video-grid">{visibleVideos.map(v=><div className="video-card" key={v.id}><button className="thumb" onClick={()=>openVideo(v)}><img loading="lazy" src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="YouTube 썸네일"/><span className="play-overlay"><Play size={26} fill="currentColor"/></span></button><div className="video-meta"><button className="video-name" onClick={()=>openVideo(v)}>{v.name}</button><small>{v.folder}</small><div className="video-actions"><button title="즐겨찾기" onClick={()=>save(s=>({mantras:s.mantras.map(x=>x.id===v.id?{...x,favorite:!x.favorite}:x)}))}><Heart size={18} fill={v.favorite?'#b794d5':'none'}/></button><button title="제목·폴더 수정" onClick={()=>{const name=prompt('제목 수정',v.name);if(name===null)return;const folderName=prompt('폴더 수정',v.folder);if(folderName===null)return;save(s=>({mantras:s.mantras.map(x=>x.id===v.id?{...x,name:name||x.name,folder:folderName||x.folder}:x)}))}}>수정</button><button title="영상 삭제" onClick={()=>{if(confirm('라이브러리에서 삭제할까?'))save(s=>({mantras:s.mantras.filter(x=>x.id!==v.id)}))}}><Trash2 size={16}/></button></div></div></div>)}</div>}</section>{currentVideo&&<div className="modal-backdrop" onClick={()=>setCurrentVideo(null)}><div className="video-modal" onClick={e=>e.stopPropagation()}><div className="modal-header"><b>{currentVideo.name}</b><button className="iconbtn" onClick={()=>setCurrentVideo(null)}><X/></button></div><div className="iframe-container"><iframe onLoad={e=>registerVideoFrame(e.currentTarget)} referrerPolicy="strict-origin-when-cross-origin" key={currentVideo.youtubeId} src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=1&playsinline=1&enablejsapi=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen title={currentVideo.name}/></div><p className="micro">플레이어의 전체화면 버튼으로 크게 볼 수 있어요. 영상에 따라 외부 재생이 제한될 수 있어요.</p><div className="action-row"><a className="secondary linkbtn" href={currentVideo.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> YouTube에서 열기</a><button className="soft-btn" onClick={()=>setCurrentVideo(null)}>닫기</button></div></div></div>}</>}
{tab==='기록'&&<><div className="page-heading"><div className="eyebrow">DAILY PRACTICE</div><h1>나의 수행 기록</h1><p>호흡 · 명상 · 만트라를 날짜별로 모아요.</p></div><section className="panel">{renderCalendar()}</section><section className="panel"><h2>{Number(selectedDate.slice(5,7))}월 {Number(selectedDate.slice(8,10))}일 기록</h2>{recordGroups.map(group=>{const Icon=group.icon;const open=recordSections[group.key];const summary=group.key==='breath'?`${group.items.length}회 수행`:group.key==='meditation'?`${Math.floor(group.items.reduce((n,r)=>n+(Number(r.secs)||0),0)/60)}분`:`${group.items.length}개 재생`;return <div key={group.key} style={{background:'#f5f4f6',borderRadius:18,padding:'16px 14px',margin:'12px 0'}}><button type="button" onClick={()=>setRecordSections(prev=>({...prev,[group.key]:!prev[group.key]}))} style={{width:'100%',background:'transparent',border:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:0,color:'#43384f',fontSize:18,cursor:'pointer'}}><span style={{display:'flex',alignItems:'center',gap:8}}><Icon size={21}/><b>{group.title}</b></span><span style={{display:'flex',alignItems:'center',gap:12,fontSize:14,color:'#857c90'}}>{summary} {open?'⌃':'⌄'}</span></button>{open&&<div style={{marginTop:16}}>{group.items.length===0?<p className="muted">이날의 {group.title} 기록이 없어요.</p>:group.items.map(r=><div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderTop:'1px solid #e6e3e8'}}>{group.key==='mantra'&&r.youtubeId&&<img src={`https://i.ytimg.com/vi/${r.youtubeId}/mqdefault.jpg`} alt="만트라 썸네일" style={{width:100,aspectRatio:'16/9',objectFit:'cover',borderRadius:10}}/>}<div style={{flex:1,minWidth:0}}><b style={{fontSize:15}}>{r.name||r.type}{group.key==='breath'?` · ${Number(r.count)||0}회${r.goal?` / 목표 ${r.goal}${r.unit==='회(날숨)'?'초':'회'}`:''}`:group.key==='meditation'?` · ${Math.floor((Number(r.secs)||0)/60)}분`:''}</b><div style={{fontSize:12,color:'#8f869b',marginTop:5}}>{group.key==='breath'?(r.finished?'완료':'중간 종료 또는 진행 기록'):group.key==='meditation'?(r.sounds?.join(' + ')||'자연음 재생'):'재생 시작 기록'}{r.time?` · ${r.time}`:''}</div></div><button type="button" className="iconbtn danger" aria-label="기록 삭제" onClick={()=>{if(confirm('이 기록을 삭제할까?'))save(x=>({sessions:x.sessions.filter(y=>y.id!==r.id)}))}}><Trash2 size={15}/></button></div>)}</div>}</div>})}<div className="journal"><b>오늘의 마음 한 줄</b><textarea placeholder="명상 후에 떠오른 생각을 적어봐요..." value={data.mood.find(x=>x.date===selectedDate)?.text||''} onChange={e=>{const text=e.target.value;save(s=>({mood:[...s.mood.filter(x=>x.date!==selectedDate),{date:selectedDate,text}]}))}}/><small>입력 내용은 이 브라우저에 자동 저장돼요.</small></div></section></>}
</main><nav className="bottom-nav" style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:0,paddingLeft:2,paddingRight:2}}>{tabs.map(([name,Icon])=><button key={name} onClick={()=>{setTab(name);window.scrollTo({top:0,behavior:'smooth'})}} className={tab===name?'selected':''} style={{minWidth:0,width:"100%",paddingLeft:0,paddingRight:0,gap:4}}><Icon size={19} strokeWidth={tab===name?2.5:1.8}/><span style={{fontSize:10,whiteSpace:"nowrap"}}>{name}</span></button>)}</nav></div>}
createRoot(document.getElementById('root')).render(<AuthGate><App/></AuthGate>);
