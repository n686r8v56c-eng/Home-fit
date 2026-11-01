// Uses mocked, user-scoped Supabase and Storage. No live data access.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
 const host=new URL(env.VITE_SUPABASE_URL).hostname,exerciseHost=new URL(env.VITE_EXERCISE_SUPABASE_URL||'https://nywmfapcjqlvjhrdbrrc.supabase.co').hostname;
 const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const user={id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
 const exerciseUser=host===exerciseHost?user:{...user,id:'00000000-0000-4000-8000-000000000002'};
 function sessionFor(user){const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+86400,aud:'authenticated'},'signature'].map(x=>typeof x==='string'?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');return {access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,token_type:'bearer',user};}
 const session=sessionFor(user),exerciseSession=sessionFor(exerciseUser);
 const original={folders:['keep'],videos:[],plans:[{date:today,videoId:'planned',sequence:{id:'planned',title:'never actual',minutes:999}}],completions:[],notes:[{id:'keep',text:'preserve'}],exerciseYoga:{sequences:[{id:'old'}],activityStudios:{yoga:{saved:[{id:'old'}]}}},hfDashboard:{strategy:{workout:{days:4,minutes:45},stretch:{days:7,minutes:30},skin:{days:5,minutes:20}},timeLogs:{[today]:{workout:{done:true,minutes:30},stretch:{done:false,minutes:99}}},attendance:{[today]:true},bodyHeight:160,bodyMeasurements:[{date:today,weight:64,fat:20,muscle:28,waist_cm:72,hip_cm:92,thigh_cm:52,custom:'keep'}],unknown:{preserve:true}}};
 let content=structuredClone(original);const errors=[],writes=[],exerciseRequests=[];
 const tables={mindflow_studio_data:[{studio:'yoga',data:{saved:[{id:'old'}]}}],mindflow_activity_sequences:[{id:'new',activity:'요가',created_at:`${today}T12:00:00Z`}],mindflow_yoga_photos:[{pose_id:'pose',storage_path:`${exerciseUser.id}/yoga/one.jpg`}]};
 async function handler(route){
  const req=route.request(),url=new URL(req.url());if(![host,exerciseHost].includes(url.hostname))return route.abort();
  const who=url.hostname===exerciseHost?exerciseUser:user;let body=[];
  if(url.pathname.startsWith('/auth/v1/user'))body=who;
  else if(url.pathname.startsWith('/auth/v1/token'))body=session;
  else if(url.pathname.startsWith('/auth/v1/logout'))body={};
  else if(url.pathname.endsWith('/home_fit_data')){
   if(req.method()==='GET')body={content};else{const data=req.postDataJSON();assert.equal(data.user_id,user.id);content=data.content;writes.push(structuredClone(content));body=[];}
  }else if(url.pathname.startsWith('/rest/v1/')){
   assert.equal(req.method(),'GET','Exercise source must remain read-only');
   assert.equal(url.searchParams.get('user_id'),`eq.${exerciseUser.id}`);exerciseRequests.push(url.pathname);
   body=tables[url.pathname.split('/').at(-1)]||[];
  }else if(url.pathname.includes('/storage/v1/object/list/')){
   const prefix=req.postDataJSON().prefix;assert.ok(prefix===exerciseUser.id||prefix.startsWith(exerciseUser.id+'/'));
   if(url.pathname.endsWith('/mindflow-yoga'))body=prefix===exerciseUser.id?[{name:'yoga',id:null,metadata:null}]:prefix===`${exerciseUser.id}/yoga`?[{id:'photo',name:'one.jpg',metadata:{size:10},created_at:`${today}T12:00:00Z`}]:[];
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 }
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PROCESS_CHROMIUM_PATH?{executablePath:process.env.PROCESS_CHROMIUM_PATH}:{})});
 try{
  async function createContext(){const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(({key,session,exerciseSession,separate})=>{localStorage.setItem(key,JSON.stringify(session));if(separate)localStorage.setItem('home-fit-exercise-auth',JSON.stringify(exerciseSession));},{key:`sb-${host.split('.')[0]}-auth-token`,session,exerciseSession,separate:host!==exerciseHost});await context.route('https://**/*',handler);return context;}
  const context=await createContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.PROCESS_TEST_URL||'http://127.0.0.1:5173/';
  await page.goto(url);await page.getByRole('button',{name:'프로세스',exact:true}).click();
  await page.getByText('Exercise 연결 완료 · 현재 저장본 기준',{exact:false}).waitFor();
  const growth=page.locator('.process-growth'),learning=growth.locator('[data-stage=learning]'),execution=growth.locator('[data-stage=execution]'),outcome=growth.locator('[data-stage=outcome]'),social=growth.locator('[data-stage=social]');
  for(const stage of [learning,execution,outcome,social])await stage.locator(':scope>summary').click();
  const sequence=learning.locator('[data-kpi-id="auto:sequence"]');
  assert.match(await sequence.innerText(),/실제 1개/);assert.match(await sequence.innerText(),/현재 누적 2개 · 날짜 미상 1개/);
  assert.match(await learning.locator('[data-kpi-id="auto:photo"]').innerText(),/실제 1장/);
  assert.match(await execution.locator('[data-kpi-id="auto:workout"]').innerText(),/실제 30분/);
  assert.match(await execution.locator('[data-kpi-id="auto:workout"]').innerText(),/목표 180분/);
  assert.match(await execution.locator('[data-kpi-id="auto:stretch"]').innerText(),/실제 0분/);
  assert.match(await execution.locator('[data-kpi-id="auto:attendance"]').innerText(),/실제 1일/);
  assert.match(await outcome.locator('[data-kpi-id="auto:body:bmi"]').innerText(),/실제 25/);
  assert.match(await outcome.locator('[data-kpi-id="auto:body:waist_cm"]').innerText(),/실제 72cm/);
  assert.equal(await outcome.getByRole('button',{name:'+ 실적 기록',exact:true}).count(),0);
  assert.equal(await growth.locator('[data-stage=social] .pg-kpi').count(),0);
  const dialog=page.getByRole('dialog');
  await social.getByRole('button',{name:'+ 중분류',exact:true}).click();
  await dialog.getByLabel('중분류 이름',{exact:true}).fill('커뮤니티');await dialog.getByRole('button',{name:'저장',exact:true}).click();
  const group=social.locator('.pg-group');
  await group.getByRole('button',{name:'+ KPI',exact:true}).click();
  await dialog.getByLabel('KPI 이름',{exact:true}).fill('대화 횟수');await dialog.getByLabel('단위',{exact:true}).fill('회');await dialog.getByLabel('목표',{exact:true}).fill('10');await dialog.getByRole('button',{name:'저장',exact:true}).click();
  const manual=group.locator('.pg-kpi').filter({has:page.getByRole('heading',{name:'대화 횟수',exact:true})});
  async function addEntry(value){await manual.getByRole('button',{name:'+ 실적 기록',exact:true}).click();await dialog.getByLabel('실적 값',{exact:true}).fill(String(value));await dialog.getByRole('button',{name:'저장',exact:true}).click();}
  await addEntry(4);await addEntry(3);assert.match(await manual.innerText(),/실제 7회/);assert.match(await manual.innerText(),/목표 10회/);
  await manual.locator('.pg-history>summary').click();
  await manual.locator('.pg-entry').first().getByRole('button',{name:'수정',exact:true}).click();await dialog.getByLabel('실적 값',{exact:true}).fill('5');await dialog.getByRole('button',{name:'저장',exact:true}).click();assert.match(await manual.innerText(),/실제 8회/);
  // Manual records prevent accidental conversion to an automatic source.
  await manual.getByRole('button',{name:'편집',exact:true}).click();assert.equal(await dialog.getByLabel('데이터 소스',{exact:true}).isDisabled(),true);await dialog.getByLabel('집계 기간',{exact:true}).selectOption('day');await dialog.getByRole('button',{name:'저장',exact:true}).click();
  await group.getByRole('button',{name:'이름 수정',exact:true}).click();await dialog.getByLabel('중분류 이름',{exact:true}).fill('소통');await dialog.getByRole('button',{name:'저장',exact:true}).click();
  // Group deletion defaults to reversible archive, including nested entries.
  await group.locator(':scope>.pg-line').getByRole('button',{name:'삭제',exact:true}).click();assert.equal(await dialog.getByLabel('처리 방식',{exact:true}).inputValue(),'archive');await dialog.getByRole('button',{name:'적용',exact:true}).click();assert.equal(await social.locator('.pg-group').count(),0);
  await growth.getByLabel('보관함 표시',{exact:true}).check();await social.locator('.pg-group>.pg-line').getByRole('button',{name:'복원',exact:true}).click();assert.match(await manual.innerText(),/실제 8회/);
  // Existing source records survive archiving a default automatic KPI.
  await outcome.locator('[data-kpi-id="auto:body:weight"]').getByRole('button',{name:'보관',exact:true}).click();
  assert.deepEqual(content.hfDashboard.bodyMeasurements,original.hfDashboard.bodyMeasurements);
  await outcome.locator('[data-kpi-id="auto:body:weight"]').getByRole('button',{name:'복원',exact:true}).click();
  // A clean browser context reads only its authenticated cloud record.
  await waitFor(()=>content.hfDashboard.processKpis?.kpis[0]?.entries?.length===2);
  const other=await createContext(),otherPage=await other.newPage();await otherPage.goto(url);await otherPage.getByRole('button',{name:'프로세스',exact:true}).click();await otherPage.locator('[data-stage=social]>summary').click();assert.match(await otherPage.locator('[data-stage=social]').innerText(),/실제 8회/);await other.close();
  // Reload and logout/re-login retain the server's user-scoped JSON.
  await page.reload();await page.getByRole('button',{name:'프로세스',exact:true}).click();await social.locator(':scope>summary').click();assert.match(await social.innerText(),/실제 8회/);
  await page.getByRole('button',{name:'로그아웃',exact:true}).click();await page.locator('.auth-form').waitFor();await page.locator('.auth-form input[type=email]').fill(user.email);await page.locator('.auth-form input[type=password]').fill('fixture-password');await page.locator('.auth-form button').click();await page.getByRole('button',{name:'프로세스',exact:true}).click();await social.locator(':scope>summary').click();assert.match(await social.innerText(),/실제 8회/);
  await manual.locator('.pg-history>summary').click();
  page.once('dialog',d=>d.accept());await manual.locator('.pg-entry').first().getByRole('button',{name:'삭제',exact:true}).click();
  assert.match(await manual.innerText(),/실제 3회/);await addEntry(5);assert.match(await manual.innerText(),/실제 8회/);
  // Explicit permanent deletion removes only a user-defined KPI and its entries.
  await social.locator('.pg-kpi>.pg-line').getByRole('button',{name:'삭제',exact:true}).click();await dialog.getByLabel('처리 방식',{exact:true}).selectOption('delete');page.once('dialog',d=>d.accept());await dialog.getByRole('button',{name:'적용',exact:true}).click();await waitFor(()=>content.hfDashboard.processKpis.kpis.length===0);
  // Users may link their own KPI to a read-only automatic source.
  await group.getByRole('button',{name:'+ KPI',exact:true}).click();await dialog.getByLabel('KPI 이름',{exact:true}).fill('체중 연결');await dialog.getByLabel('데이터 소스',{exact:true}).selectOption('auto');await dialog.getByLabel('자동 연결',{exact:true}).selectOption('body:weight');await dialog.getByRole('button',{name:'저장',exact:true}).click();assert.match(await group.locator('.pg-kpi').innerText(),/실제 64kg/);assert.equal(await group.getByRole('button',{name:'+ 실적 기록',exact:true}).count(),0);
  for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);await group.getByRole('button',{name:'+ KPI',exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`dialog overflow ${width}`);await dialog.getByRole('button',{name:'취소',exact:true}).click();}
  await waitFor(()=>content.hfDashboard.processKpis.kpis.length===1);
  const {processKpis,...rest}=content.hfDashboard;assert.deepEqual(rest,original.hfDashboard);
  for(const key of ['exerciseYoga','plans','completions','notes'])assert.deepEqual(content[key],original[key]);
  assert.ok(exerciseRequests.length>=7);assert.ok(writes.length>5);assert.deepEqual(errors,[]);
  console.log('PASS: automatic Exercise dedup/dates/photos, actual exercise/attendance, body/BMI, manual category/KPI/record CRUD, safe archive/restore/delete, readonly sources, user-scoped cloud persistence across clean context/reload/logout/login, existing data preservation, responsive dialogs.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
async function waitFor(condition){for(let i=0;i<100;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,50))}throw Error('Mock cloud write timed out')}
