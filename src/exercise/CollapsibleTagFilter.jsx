import React,{useState} from 'react';
import {ChevronDown,ChevronUp} from 'lucide-react';
export default function CollapsibleTagFilter({tags,value,onChange}){
 const [expanded,setExpanded]=useState(false);
 const choices=['전체',...(value!=='전체'?[value]:[]),...tags.filter(t=>t!==value&&t!=='전체')];
 const base={height:30,minHeight:30,padding:'4px 9px',border:'1px solid #e0d1ed',borderRadius:40,color:'#735989',fontSize:13,lineHeight:'20px',whiteSpace:'nowrap',cursor:'pointer',boxSizing:'border-box',flexShrink:0};
 const Icon=expanded?ChevronUp:ChevronDown;
 return <div style={{display:'flex',gap:6,alignItems:'flex-start',marginBottom:12,minWidth:0}}><div aria-label="운동 태그 필터" style={{display:'flex',flexWrap:'wrap',gap:6,flex:1,minWidth:0,maxHeight:expanded?'none':30,overflow:'hidden'}}>{[...new Set(choices)].map(t=><button key={t} type="button" aria-pressed={value===t} style={{...base,background:value===t?'#e4d3f1':'#fff'}} onClick={()=>onChange(t)}>{t==='전체'?t:`#${t}`}</button>)}</div>{tags.length>0&&<button type="button" aria-label={expanded?'태그 접기':'태그 펼치기'} title={expanded?'태그 접기':'태그 펼치기'} aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)} style={{...base,width:30,padding:0,borderRadius:9,background:'#f3ebf8',display:'grid',placeItems:'center'}}><Icon size={16}/></button>}</div>;
}
