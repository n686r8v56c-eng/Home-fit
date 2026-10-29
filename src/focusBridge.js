const ENDPOINT='https://cntwtmaqyjwtnpybjare.supabase.co/functions/v1/home-fit-bridge';
const PUBLIC_KEY='sb_publishable_8tjs1LsNSb2Ro0Hlw7Ka0A_-a60Ak8U';
export async function bridgeRequest(client,action,body={}){
 const {data,error}=await client.auth.getSession();if(error||!data.session)throw new Error('Home Fit에 다시 로그인해 주세요.');
 const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',apikey:PUBLIC_KEY,Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({...body,action}),signal:AbortSignal.timeout(15000)});
 const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'연결 기능 설치와 네트워크를 확인해 주세요.');return result;
}
// Each client publishes serially; the server also guards races across devices.
const queues=new WeakMap();
export function queueBridgeSync(client){
 if(!queues.has(client))queues.set(client,{running:null,again:false});const queue=queues.get(client);queue.again=true;
 if(queue.running)return queue.running;
 queue.running=(async()=>{let result;while(queue.again){queue.again=false;result=await bridgeRequest(client,'sync')}return result})().finally(()=>{queue.running=null});return queue.running;
}
