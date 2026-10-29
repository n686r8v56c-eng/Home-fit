import {createServer} from 'vite';
import React from 'react';
import {renderToString} from 'react-dom/server';
import assert from 'node:assert/strict';
// SSR exercises render paths without browser credentials or any network access.
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {App}=await server.ssrLoadModule('/src/main.jsx');
 const {makeSequence}=await server.ssrLoadModule('/src/exercise/scheduling.js');
 const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const sequence=makeSequence({id:'render',name:'렌더링 시퀀스',activity:'요가',items:[{name:'동작',seconds:60}]});
 const props={initialData:{folders:['근력운동'],videos:[{id:'legacy',title:'기존 영상',youtubeId:'abcdefghijk',folders:['근력운동'],minutes:10}],plans:[{date:today,videoId:'legacy'},{date:today,videoId:sequence.id,sequence}],completions:[{date:today,videoId:sequence.id,sequence}],notes:[]},onDataChange:()=>{},onLogout:()=>{}};
 const html=renderToString(React.createElement(App,props));
 assert.match(html,/렌더링 시퀀스/);assert.match(html,/기존 영상/);assert.match(html,/완료 체크/);assert.ok(html.indexOf('Calendar')<html.indexOf('Exercise')&&html.indexOf('Exercise')<html.indexOf('Library'));
 const {ExerciseContext}=await server.ssrLoadModule('/src/exercise/ExerciseContext.jsx');
 for(const name of ['YogaLibrary','ActivityStudio','BodyweightStudio','PelvicStudio','SNPEStudio','FoamRollerLibrary','MassageLibrary','MassageBookmarks','NatureSound']){
  const {default:Component}=await server.ssrLoadModule(`/src/exercise/${name}.jsx`);
  assert.ok(renderToString(React.createElement(ExerciseContext.Provider,{value:{localData:{},onLocalChange:()=>{},onSchedule:()=>{}}},React.createElement(Component,{activity:'스트레칭',region:'얼굴'}))).length>0,name);
 }
 const {default:Player}=await server.ssrLoadModule('/src/exercise/SequencePlayer.jsx');
 const player=renderToString(React.createElement(Player,{sequence,close:()=>{},onComplete:()=>{},done:false}));
 assert.match(player,/운동 완료 기록/);assert.match(player,/1:00/);
 console.log('PASS: server render for Home mixed video/sequence plans and completion, tab order, nine exercise modules, sequence player. No live data access.');
}finally{await server.close()}
