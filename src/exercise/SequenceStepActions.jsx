import React from 'react';
import {ArrowUp,ArrowDown,X,Copy} from 'lucide-react';
export default function SequenceStepActions({index,count,onUp,onDown,onDelete,onCopy}){
 const style={width:28,height:28,minWidth:28,minHeight:28,padding:0,border:'1px solid #e0d1ed',borderRadius:8,background:'#f3ebf8',color:'#735989',display:'grid',placeItems:'center',cursor:'pointer',boxSizing:'border-box'};
 return <div role="group" aria-label="동작 순서 및 복사" style={{display:'grid',gridTemplateColumns:'28px 28px',gap:4,flex:'0 0 60px'}}>{[
  ['위로 이동',onUp,index===0,ArrowUp],['동작 삭제',onDelete,false,X],
  ['아래로 이동',onDown,index===count-1,ArrowDown],['동작 복사',onCopy,false,Copy]
 ].map(([label,onClick,disabled,Icon])=><button key={label} type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} style={{...style,opacity:disabled?.35:1}}><Icon size={14}/></button>)}</div>;
}
