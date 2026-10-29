export const YOGA_GROUPS=['스탠딩','전굴','후굴','힙 오프너','트위스트','암 밸런스','코어','척추 움직임','회복·휴식'];
export function importYogaStudio(poses,local={},record={},paths={}){
 const convert=p=>({id:p.id,name:p.nameKo||p.sanskrit,description:p.sanskrit||'',major:(p.categories||[]).find(c=>YOGA_GROUPS.includes(c))||'미분류',tags:p.categories||[],seconds:Math.max(1,Number(p.defaultBeats||8)*2),imagePath:paths[p.id]||'',bucket:'mindflow-yoga',image:local.photos?.[p.id]||''});
 const byId=new Map(poses.map(p=>[p.id,convert(p)]));
 const merge=(old=[],incoming=[])=>{const ids=new Set(old.map(x=>x.id));return [...old,...incoming.filter(x=>!ids.has(x.id))]};
 const saved=[...(local.sequences||[]),...(local.presets||[]).map(p=>({...p,id:'preset:'+p.id}))].map(seq=>({...seq,items:(seq.items||[]).flatMap((item,i)=>{
  const pose=byId.get(item.poseId||item.exerciseId);if(!pose)return [];
  const sides=item.side==='양쪽'?['왼쪽','오른쪽']:[item.side||'기본'];
  return sides.map((side,j)=>({...pose,...item,id:`${seq.id}:step:${i}:${j}`,exerciseId:pose.id,name:pose.name,side,seconds:Math.max(1,Number(item.seconds)||Number(item.beats||8)*2)}));
 })}));
 return {...record,legacyImported:true,exercises:merge(record.exercises,poses.map(convert)),saved:merge(record.saved,saved)};
}
