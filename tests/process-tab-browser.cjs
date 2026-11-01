// Start Vite before running. Only mocked Supabase requests are allowed.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
 const host=new URL(env.VITE_SUPABASE_URL).hostname;
 const user={id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
 const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+86400,aud:'authenticated'},'signature'].map(x=>typeof x==='string'?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 const session={access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,token_type:'bearer',user};
 const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const preserved={bodyHeight:160,bodyMeasurements:[{date:today,weight:64,fat:23,muscle:28,waist_cm:72,hip_cm:92,thigh_cm:52,unknown:'preserve'}],timeLogs:{[today]:{workout:{done:true,minutes:30},stretch:{done:true,minutes:15},skin:{done:true,minutes:5}}},attendance:{[today]:true},custom:{keep:true}};
 const original={folders:['preserved'],videos:[{id:'video',title:'preserved video',youtubeId:'abcdefghijk',minutes:10,folders:['preserved']}],plans:[{date:today,videoId:'video'}],completions:[{date:today,videoId:'video'}],notes:[{id:'note',text:'preserve'}],exerciseYoga:{sequences:[{id:'exercise',name:'preserved sequence',items:[]}],custom:{keep:true}},hfDashboard:{...structuredClone(preserved),strategy:{workout:{days:3,minutes:40},stretch:{days:7,minutes:30},skin:{days:5,minutes:20}}}};
 let content=structuredClone(original);const writes=[],errors=[];
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PROCESS_CHROMIUM_PATH?{executablePath:process.env.PROCESS_CHROMIUM_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${host.split('.')[0]}-auth-token`,session});
  await context.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.hostname!==host)return route.abort();
   let body=[];
   if(url.pathname.startsWith('/auth/v1/user'))body=user;
   else if(url.pathname.endsWith('/home_fit_data')){
    if(req.method()==='GET')body={content};else{content=req.postDataJSON().content;writes.push(structuredClone(content));body=[];}
   }
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PROCESS_TEST_URL||'http://127.0.0.1:5173/');
  const nav=page.getByRole('navigation',{name:'메인 메뉴'});
  await nav.getByRole('button',{name:'프로세스',exact:true}).waitFor();
  assert.deepEqual(await nav.getByRole('button').allTextContents(),['홈','프로세스','일정','Exercise','신체']);
  assert.equal(await nav.getByRole('button',{name:'프로세스',exact:true}).locator('.lucide-workflow').count(),1);
  const home=page.locator('main>.hf-dashboard');
  assert.match(await home.innerText(),/50분/);
  await nav.getByRole('button',{name:'프로세스',exact:true}).click();
  const processView=page.locator('.process-page');
  assert.deepEqual(await processView.getByRole('tab').allTextContents(),['성장 단계','전략','분석']);
  assert.deepEqual(await processView.locator('summary').allTextContents(),['학습 Learning','실행 Execution','결과 Outcome','소셜 Social','브랜딩 Branding','수익화 Monetization','경쟁 Challenge']);
  await processView.locator('summary').first().click();
  assert.equal(await processView.locator('details[open]').count(),1);
  assert.equal(await processView.getByRole('tabpanel').locator('input,select').count(),0);
  await processView.getByRole('tab',{name:'전략',exact:true}).click();
  const strategy=processView.getByRole('tabpanel',{name:'전략',exact:true});
  assert.match(await strategy.innerText(),/주간 운동 설계/);
  assert.match(await strategy.locator('.hf-three').innerText(),/430분/);
  const rows=strategy.locator('.hf-goal-row');
  assert.deepEqual(await rows.locator('strong').allTextContents(),['근력운동','스트레칭','마사지']);
  await rows.first().locator('select').selectOption('4');
  await rows.first().locator('input').fill('45');
  await waitFor(()=>content.hfDashboard.strategy.workout.days===4&&content.hfDashboard.strategy.workout.minutes===45);
  assert.match(await strategy.locator('.hf-three').innerText(),/490분/);
  assert.match(await strategy.locator('.hf-three').innerText(),/6,300분/);
  assert.equal(await strategy.locator('.hf-comparison').count(),3);
  assert.equal(await strategy.locator('.hf-bar').count(),6);
  for(const text of ['맨몸근력 · 덤벨 · 바벨 · 머신 · 케이블','요가 · 필라테스 · 골반순환 · SNPE 운동','폼롤러 · SNPE 소도구 · 마사지'])assert.ok((await strategy.innerText()).includes(text));
  assert.deepEqual(await strategy.locator('.hf-periods button').allTextContents(),['오늘','최근 7일','이번 주','이번 달','90일']);
  for(const name of ['오늘','최근 7일','이번 주','이번 달','90일']){
   await strategy.getByRole('button',{name,exact:true}).click();
   assert.equal(await strategy.locator('.hf-periods .active').innerText(),name);
   assert.match(await strategy.locator('.hf-overview').innerText(),/50분/);
  }
  const beforeSwitch=await strategy.locator('.hf-overview').innerText();
  await processView.getByRole('tab',{name:'분석',exact:true}).click();
  const analysis=processView.getByRole('tabpanel',{name:'분석',exact:true});
  assert.match(await analysis.innerText(),/추후 제공/);
  assert.equal(await analysis.locator('input,select,.hf-kpi,.hf-bar').count(),0);
  await processView.getByRole('tab',{name:'성장 단계',exact:true}).click();
  assert.equal(await processView.locator('details[open]').count(),1);
  await processView.getByRole('tab',{name:'전략',exact:true}).click();
  assert.equal(await rows.first().locator('input').inputValue(),'45');
  assert.equal(await strategy.locator('.hf-periods .active').innerText(),'90일');
  assert.equal(await strategy.locator('.hf-overview').innerText(),beforeSwitch);
  // Keyboard tab navigation, including wraparound.
  await processView.getByRole('tab',{name:'전략',exact:true}).focus();await page.keyboard.press('ArrowRight');
  assert.equal(await processView.getByRole('tab',{name:'분석',exact:true}).getAttribute('aria-selected'),'true');
  await page.keyboard.press('ArrowRight');
  assert.equal(await processView.getByRole('tab',{name:'성장 단계',exact:true}).getAttribute('aria-selected'),'true');
  // The original bottom destinations and the strategy's mounted state survive.
  for(const name of ['홈','일정','Exercise','신체']){
   await nav.getByRole('button',{name,exact:true}).click();
   if(name==='신체')assert.match(await page.locator('.bm-page').innerText(),/64.0kg/);
   if(name==='일정')await page.getByRole('heading',{name:'일정',exact:true}).waitFor();
   if(name==='Exercise')await page.getByRole('heading',{name:'Exercise',exact:true}).waitFor();
  }
  await nav.getByRole('button',{name:'프로세스',exact:true}).click();
  await processView.getByRole('tab',{name:'전략',exact:true}).click();
  assert.equal(await strategy.locator('.hf-periods .active').innerText(),'90일');
  assert.equal(await rows.first().locator('input').inputValue(),'45');
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:900});
   for(const name of ['성장 단계','전략','분석']){
    await processView.getByRole('tab',{name,exact:true}).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} overflow at ${width}`);
   }
  }
  // A second page reads the saved mock cloud record using the existing auth flow.
  const second=await context.newPage();await second.goto(process.env.PROCESS_TEST_URL||'http://127.0.0.1:5173/');
  await second.getByRole('button',{name:'프로세스',exact:true}).click();
  await second.getByRole('tab',{name:'전략',exact:true}).click();
  assert.equal(await second.locator('.hf-goal-row').first().locator('input').inputValue(),'45');
  await second.close();
  const {strategy:updated,...rest}=content.hfDashboard;
  assert.deepEqual(rest,preserved);
  assert.deepEqual(updated,{...original.hfDashboard.strategy,workout:{days:4,minutes:45}});
  for(const key of ['videos','plans','completions','notes','exerciseYoga'])assert.deepEqual(content[key],original[key]);
  assert.deepEqual(errors,[]);assert.ok(writes.length>=2);
  console.log('PASS: navigation/icon, 7 ordered collapsible stages, empty analysis, unchanged strategy calculations/periods/descriptions, subtab/main-tab state retention, authenticated mock cloud writes/reload, preservation of body/Exercise/schedule/home data, keyboard controls, 320/390/768/1280px layouts.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
async function waitFor(condition){for(let i=0;i<100;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,50))}throw new Error('Mock cloud write timed out')}
