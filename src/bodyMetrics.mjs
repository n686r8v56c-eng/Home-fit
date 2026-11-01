// Legacy keys remain authoritative; circumference fields extend the existing JSON.
export const metrics = [
  {key:'weight',label:'체중',unit:'kg',min:15,max:400},
  {key:'fat',label:'체지방률',unit:'%',changeUnit:'%p',min:0,max:100},
  {key:'muscle',label:'골격근량',unit:'kg',min:0,max:200},
  {key:'bmi',label:'BMI',unit:''},
  {key:'waist_cm',label:'허리',unit:'cm',min:1,max:300},
  {key:'hip_cm',label:'엉덩이',unit:'cm',min:1,max:300},
  {key:'thigh_cm',label:'허벅지',unit:'cm',min:1,max:200},
];
export const number = value => value == null || String(value).trim()==='' ? null : Number.isFinite(Number(value)) ? Number(value) : null;
export const localDay = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function validDay(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return false;
  const d=new Date(`${date}T12:00:00`);
  return Number.isFinite(d.getTime())&&localDay(d)===date;
}
export function shiftDay(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+days);return localDay(d)}
export function valueFor(row,key,height){
  if(key!=='bmi')return number(row?.[key]);
  const w=number(row?.weight),h=number(height);
  return w!==null&&h>0?w/(h/100)**2:null;
}
// Last array entry for a date is representative. Never collapse the stored array.
export function dailyRows(rows=[]){
  const days=new Map();
  rows.forEach((row,index)=>{if(row&&validDay(row.date))days.set(row.date,{row,index})});
  return [...days.values()].sort((a,b)=>a.row.date.localeCompare(b.row.date));
}
export function difference(rows,date,key,height,days=1){
  const daily=dailyRows(rows),current=daily.find(x=>x.row.date===date)?.row;
  const prior=daily.find(x=>x.row.date===shiftDay(date,-days))?.row;
  const a=valueFor(current,key,height),b=valueFor(prior,key,height);
  return a===null||b===null?null:a-b;
}
export function saveMeasurement(rows,index,patch){
  // Replace only the selected record and retain all unknown fields and siblings.
  if(index===null)return [...rows,{...patch}];
  return rows.map((row,i)=>i===index?{...row,...patch}:row);
}
