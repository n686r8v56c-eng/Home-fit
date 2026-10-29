/* Run in the Mind Flow origin's browser console. Read-only: no writes/deletes. */
(async()=>{
 const read=key=>{const value=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(value))throw Error('Invalid sequence data');return value};
 const backup={format:'mind-flow-exercise-v1',exportedAt:new Date().toISOString(),sequences:read('mind-flow-yoga-sequences-v1'),presets:read('mind-flow-yoga-custom-presets-v1'),photos:{}};
 // Do not create a database if this browser never stored photos.
 const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('mind-flow-yoga-photos-v1');request.onupgradeneeded=()=>{request.transaction.abort();resolve(null)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>request.error?.name==='AbortError'?resolve(null):reject(request.error)});
 if(db){try{if(db.objectStoreNames.contains('photos')){
  const rows=await new Promise((resolve,reject)=>{const store=db.transaction('photos','readonly').objectStore('photos');const cursor=store.openCursor();const rows=[];cursor.onsuccess=()=>{const c=cursor.result;if(c){rows.push([c.key,c.value]);c.continue()}else resolve(rows)};cursor.onerror=()=>reject(cursor.error)});
  for(const [id,blob] of rows)if(blob instanceof Blob)backup.photos[id]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)});
 }}finally{db.close()}}
 const url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mind-flow-exercise-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 console.info('운동 백업 완료. 원본 데이터는 변경하지 않았어요.');
})().catch(error=>console.error('운동 백업 실패:',error));
