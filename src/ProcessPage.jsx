import React,{useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {StrategyPage} from './Dashboard.jsx';
import './process.css';

const stages=[
 ['learning','학습','Learning'],
 ['execution','실행','Execution'],
 ['outcome','결과','Outcome'],
 ['social','소셜','Social'],
 ['branding','브랜딩','Branding'],
 ['monetization','수익화','Monetization'],
 ['challenge','경쟁','Challenge'],
];
const tabs=[['growth','성장 단계'],['strategy','전략'],['analysis','분석']];

export default function ProcessPage(props){
 const [tab,setTab]=useState('growth');
 function moveTab(event,index){
  let next;
  if(event.key==='ArrowRight')next=(index+1)%tabs.length;
  else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=tabs.length-1;
  else return;
  event.preventDefault();setTab(tabs[next][0]);
  document.getElementById(`process-tab-${tabs[next][0]}`)?.focus();
 }
 return <div className="hf-dashboard process-page">
  <header className="hf-page-head"><small>HOME FIT · PROCESS</small><h1>프로세스</h1></header>
  <div className="process-tabs" role="tablist" aria-label="프로세스 보기">
   {tabs.map(([id,label],index)=><button key={id} type="button" role="tab" id={`process-tab-${id}`} aria-controls={`process-panel-${id}`} aria-selected={tab===id} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={event=>moveTab(event,index)}>{label}</button>)}
  </div>
  <section role="tabpanel" id="process-panel-growth" aria-labelledby="process-tab-growth" hidden={tab!=='growth'}>
   <div className="process-stages">{stages.map(([id,label,english])=><details key={id} className="process-stage">
    <summary><span>{label} <small>{english}</small></span><ChevronDown size={16} aria-hidden="true"/></summary>
    <p>아직 등록된 항목이 없어요.</p>
   </details>)}</div>
  </section>
  {/* Keep the existing component mounted: its inputs, period and calculations
      continue to use the same record and saveRecord throughout tab switches. */}
  <section role="tabpanel" id="process-panel-strategy" className="process-strategy" aria-labelledby="process-tab-strategy" hidden={tab!=='strategy'}>
   <StrategyPage {...props}/>
  </section>
  <section role="tabpanel" id="process-panel-analysis" aria-labelledby="process-tab-analysis" hidden={tab!=='analysis'}>
   <div className="process-empty"><h2>분석</h2><p>종합 분석은 추후 제공될 예정이에요.</p></div>
  </section>
 </div>;
}
