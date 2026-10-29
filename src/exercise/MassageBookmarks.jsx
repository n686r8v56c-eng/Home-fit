import {BookmarkScheduleButton,BookmarkVideoLink} from './ExerciseContext';
import {Folder} from 'lucide-react';
import React, {useEffect,useMemo,useState,useRef} from 'react';
import {yogaSupabase} from './supabaseYoga';

const T='mindflow_massage_bookmarks';
const F='mindflow_massage_bookmark_folders';
const violet='#765895',edge='#e7d9ef';
const button={background:'#f1e8f7',border:`1px solid ${edge}`,borderRadius:11,color:violet,padding:'9px 11px',font:'inherit',fontWeight:650,cursor:'pointer'};
const input={width:'100%',boxSizing:'border-box',padding:11,border:`1px solid ${edge}`,borderRadius:11,font:'inherit',color:'#594969',background:'white'};
const getId=url=>{try{const u=new URL(url);const h=u.hostname.replace(/^www\./,'').toLowerCase();if(h==='youtu.be')return u.pathname.slice(1).split('/')[0].match(/^[\w-]{11}$/)?.[0]||'';if(h==='youtube.com'||h==='m.youtube.com'||h==='music.youtube.com'||h==='youtube-nocookie.com'){let id=u.searchParams.get('v');if(!id){const parts=u.pathname.split('/');if(['shorts','embed','live'].includes(parts[1]))id=parts[2];}return id?.match(/^[\w-]{11}$/)?.[0]||''}}catch{}return ''};
const thumb=id=>`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
async function fetchTitle(url){
  // Public oEmbed gateway; blocked/unknown metadata is handled by manual title editing.
  try{const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(),4500);try{const r=await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`,{signal:ctl.signal});if(r.ok){const j=await r.json();if(j.title&&typeof j.title==='string')return j.title.trim()}}finally{clearTimeout(timeout)}}catch{}
  return '';
}
export default function MassageBookmarks({region}){
  const [uid,setUid]=useState(''),[folders,setFolders]=useState([]),[items,setItems]=useState([]),[folder,setFolder]=useState('all');
  const [search,setSearch]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[creating,setCreating]=useState(false),[editing,setEditing]=useState(null),[url,setUrl]=useState(''),[name,setName]=useState(''),[destination,setDestination]=useState('');
  const titleRequest=useRef(0);
  const load=async who=>{const [fr,br]=await Promise.all([yogaSupabase.from(F).select('*').eq('user_id',who).eq('region',region).order('created_at'),yogaSupabase.from(T).select('*').eq('user_id',who).eq('region',region).order('created_at',{ascending:false})]);if(fr.error||br.error)throw(fr.error||br.error);setFolders(fr.data||[]);setItems(br.data||[])};
  useEffect(()=>{let active=true;setError('');setFolder('all');setFolders([]);setItems([]);(async()=>{if(!yogaSupabase)throw new Error('Supabase 설정이 필요해요.');const {data:{user},error}=await yogaSupabase.auth.getUser();if(error||!user)throw new Error('로그인이 필요해요.');if(!active)return;setUid(user.id);const [fr,br]=await Promise.all([yogaSupabase.from(F).select('*').eq('user_id',user.id).eq('region',region).order('created_at'),yogaSupabase.from(T).select('*').eq('user_id',user.id).eq('region',region).order('created_at',{ascending:false})]);if(fr.error||br.error)throw(fr.error||br.error);if(active){setFolders(fr.data||[]);setItems(br.data||[])}})().catch(e=>{if(active)setError('북마크 연결 오류: '+e.message+' · 제공한 SQL을 실행했는지 확인해 주세요.')});return()=>{active=false}},[region]);
  const visible=useMemo(()=>items.filter(it=>(folder==='all'||(folder==='none'?!it.folder_id:it.folder_id===folder||folders.some(f=>f.id===it.folder_id&&f.name.startsWith((folders.find(x=>x.id===folder)?.name||'')+'/'))))&&`${it.title} ${it.youtube_url}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),[items,folder,search,folders]);
  const saveFolder=async()=>{const leaf=window.prompt('새 폴더 이름')?.trim();if(!leaf||!uid)return;const parent=folders.find(f=>f.id===folder)?.name;const v=parent?parent+'/'+leaf:leaf;setBusy(true);setError('');try{const {error}=await yogaSupabase.from(F).insert({user_id:uid,region,name:v});if(error)throw error;await load(uid)}catch(e){setError(e.message)}finally{setBusy(false)}};
  const manageFolder=async f=>{const action=window.prompt(`‘${f.name}’ 폴더\n1 = 이름 수정\n2 = 폴더 삭제 (영상은 미분류로 이동)`, '1');if(!['1','2'].includes(action))return;setBusy(true);setError('');try{if(action==='1'){const n=window.prompt('폴더 이름',f.name)?.trim();if(!n)return;const {error}=await yogaSupabase.from(F).update({name:n}).eq('id',f.id).eq('user_id',uid);if(error)throw error;}else{if(!window.confirm(`‘${f.name}’ 폴더를 삭제할까요? 영상은 삭제되지 않아요.`))return;const {error}=await yogaSupabase.from(F).delete().eq('id',f.id).eq('user_id',uid);if(error)throw error;if(folder===f.id)setFolder('all')}await load(uid)}catch(e){setError(e.message)}finally{setBusy(false)}};
  const startAdd=()=>{setEditing(null);setUrl('');setName('');setDestination(folder==='all'||folder==='none'?'':folder);setCreating(true)};
  const startEdit=it=>{setEditing(it);setUrl(it.youtube_url);setName(it.title);setDestination(it.folder_id||'');setCreating(true)};
  const onUrl=async v=>{const request=++titleRequest.current;setUrl(v);setName('');if(getId(v)){const title=await fetchTitle(`https://www.youtube.com/watch?v=${getId(v)}`);if(request===titleRequest.current)setName(old=>old||title||'')}};
  const save=async e=>{e.preventDefault();if(!uid)return;const vid=getId(url.trim());if(!vid){setError('유효한 YouTube 영상 링크를 넣어주세요.');return}setBusy(true);setError('');try{const title=name.trim()||await fetchTitle(`https://www.youtube.com/watch?v=${vid}`)||'YouTube 영상';const record={user_id:uid,region,title,youtube_url:`https://www.youtube.com/watch?v=${vid}`,video_id:vid,folder_id:destination||null};const q=editing?yogaSupabase.from(T).update(record).eq('id',editing.id).eq('user_id',uid):yogaSupabase.from(T).insert(record);const {error}=await q;if(error)throw error;await load(uid);setCreating(false)}catch(e){setError('저장 실패: '+e.message)}finally{setBusy(false)}};
  const remove=async it=>{if(!window.confirm(`‘${it.title}’ 북마크를 삭제할까요?`))return;setBusy(true);try{const {error}=await yogaSupabase.from(T).delete().eq('id',it.id).eq('user_id',uid);if(error)throw error;await load(uid)}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <section style={{border:`1px solid ${edge}`,borderRadius:18,padding:14,background:'white',color:'#594969'}}>
    <h3>영상 북마크</h3>
    <p style={{fontSize:12,color:'#927ca0'}}>유튜브 링크 저장 · 기본 분류 · 사용자 서브폴더</p>
    {error&&<p role="alert" style={{color:'#aa4163',fontSize:12}}>{error}</p>}
    {folder!=='all'&&<button style={button} onClick={()=>{const path=folders.find(f=>f.id===folder)?.name||'';const parent=path.includes('/')?path.slice(0,path.lastIndexOf('/')):'';setFolder(folders.find(f=>f.name===parent)?.id||'all')}}>← 상위 폴더</button>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,margin:'14px 0'}}>
      {[...(folder==='all'?[{id:'none',name:'미분류'}]:[]),...folders.filter(f=>{const parent=folders.find(x=>x.id===folder)?.name;return folder==='all'?!f.name.includes('/'):parent&&f.name.startsWith(parent+'/')&&!f.name.slice(parent.length+1).includes('/')})].map(f=><button key={f.id} onClick={()=>setFolder(f.id)} onContextMenu={e=>{e.preventDefault();if(f.id!=='none')manageFolder(f)}} style={{border:0,background:'transparent',color:'#755b8c',font:'inherit',padding:0,minWidth:0,cursor:'pointer'}}>
        <span style={{display:'grid',placeItems:'center',height:90,background:'#eee6f5',borderRadius:20,marginBottom:8}}><Folder size={36} strokeWidth={1.7}/></span>
        <b style={{display:'block',overflowWrap:'anywhere'}}>{f.name.split('/').at(-1)}</b>
        <small>{items.filter(it=>f.id==='none'?!it.folder_id:it.folder_id===f.id||folders.some(child=>child.id===it.folder_id&&child.name.startsWith(f.name+'/'))).length}개 영상</small>
      </button>)}
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}><button style={button} disabled={!uid||busy} onClick={saveFolder}>＋ 폴더 추가</button><button onClick={startAdd} style={{...button,background:'#c98dad',color:'white'}}>＋ 북마크 추가</button></div>
    {creating&&<div role="dialog" aria-modal="true" aria-label="북마크 저장" style={{position:'fixed',inset:0,zIndex:10000,background:'#0006',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setCreating(false)}>
      <form onSubmit={save} style={{background:'white',border:`1px solid ${edge}`,borderRadius:18,padding:16,width:'100%',maxWidth:500,maxHeight:'85dvh',overflowY:'auto',boxSizing:'border-box'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3>북마크 저장</h3><button type="button" style={button} aria-label="닫기" onClick={()=>setCreating(false)}>✕</button></div>
        <label style={{display:'block',marginBottom:9}}>유튜브 링크<input required type="url" value={url} style={input} placeholder="https://youtu.be/..." onChange={e=>onUrl(e.target.value)}/></label>
        <label style={{display:'block',marginBottom:9}}>영상 제목<input style={input} value={name} onChange={e=>setName(e.target.value)} placeholder="링크 입력 시 자동으로 제목을 가져와요"/></label>
        <div style={{display:'flex',gap:8}}><button disabled={busy} style={button} type="submit">저장</button><button type="button" style={button} onClick={()=>setCreating(false)}>취소</button></div>
        <p style={{fontSize:12,color:'#927ca0'}}>썸네일과 제목을 YouTube 링크에서 가져와요. 제목 조회가 불가능하면 직접 입력할 수 있어요.</p>
      </form>
    </div>}
    <input style={{...input,marginBottom:12}} placeholder="영상 제목 검색" value={search} onChange={e=>setSearch(e.target.value)}/>
    <h3>{folder==='all'?'전체 영상':`${folder==='none'?'미분류':folders.find(f=>f.id===folder)?.name.split('/').at(-1)||''} 영상`}</h3>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:14}}>{visible.map(it=><article key={it.id} style={{border:`1px solid ${edge}`,borderRadius:13,padding:8,minWidth:0,position:'relative'}}><BookmarkVideoLink bookmark={it} activity="마사지"><img src={thumb(it.video_id)} alt={`${it.title} 썸네일`} loading="lazy" style={{width:'100%',aspectRatio:'16/9',objectFit:'cover',borderRadius:9,background:'#f2edf5'}}/><div style={{fontSize:13,fontWeight:700,margin:'7px 0',overflowWrap:'anywhere',display:'-webkit-box',WebkitBoxOrient:'vertical',WebkitLineClamp:2,overflow:'hidden',lineHeight:1.5,minHeight:'3em'}}>{it.title}</div></BookmarkVideoLink><BookmarkScheduleButton bookmark={it} activity="마사지"/><button type="button" title="삭제" aria-label={`${it.title} 북마크 삭제`} disabled={busy} onClick={()=>remove(it)} style={{position:'absolute',top:5,right:5,width:32,height:32,padding:0,border:0,borderRadius:'50%',background:'rgba(255,255,255,.94)',color:violet,fontSize:23,lineHeight:1,cursor:'pointer'}}>×</button></article>)}</div>
    {!visible.length&&<p style={{color:'#9587a1',fontSize:12}}>이 폴더에는 등록된 영상이 없어요.</p>}
  </section>;
}
