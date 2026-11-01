// Start Vite first. Uses mocked Supabase only; never reads or writes live data.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
 const host=new URL(env.VITE_SUPABASE_URL).hostname;
 const user={id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
 const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+86400,aud:'authenticated'},'signature'].map(x=>typeof x==='string'?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 const session={access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,token_type:'bearer',user};
 const legacy=[{date:'2026-10-25',weight:65,fat:23,muscle:27,metadata:{keep:true}},{date:'2026-10-31',weight:62,fat:21,muscle:28},{date:'2026-11-01',weight:60,fat:20,muscle:29},{date:'2026-11-01',weight:61,fat:20.5,muscle:29.5,waist_cm:71,hip_cm:91,thigh_cm:51,unknown:'retain'}];
 let content={folders:['preserved'],videos:[],plans:[],completions:[],notes:[{id:'preserved-note',text:'keep'}],hfDashboard:{bodyHeight:160,bodyMeasurements:structuredClone(legacy),unrelated:{keep:true}}};
 const writes=[],errors=[];
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.BODY_CHROMIUM_PATH?{executablePath:process.env.BODY_CHROMIUM_PATH}:{})});
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
 await page.goto(process.env.BODY_TEST_URL||'http://127.0.0.1:5173/');
 await page.locator('.bottom-nav button').filter({hasText:'신체'}).click();
 const body=page.locator('.bm-page');
 const month=body.locator('.bm-month-head h2');
 for(let i=0;i<36;i++){const text=await month.innerText();if(text==='2026년 11월')break;const [y,m]=text.match(/\d+/g).map(Number);await body.getByRole('button',{name:y*12+m>2026*12+11?'이전 달':'다음 달',exact:true}).click();}
 await body.getByRole('button',{name:'2026-11-01 체중 61.0kg',exact:true}).click();
 const details=body.getByRole('region',{name:'선택한 날짜 측정값'});
 assert.match(await details.innerText(),/전일 대비 -1.0kg · 7일 전 대비 -4.0kg/);
 await body.getByRole('button',{name:'BMI',exact:true}).click();
 assert.equal(await body.getByRole('button',{name:'2026-11-01 BMI 23.8',exact:true}).count(),1);
 await body.getByRole('button',{name:'체지방률',exact:true}).click();
 assert.match(await details.innerText(),/체지방률 전일 대비 -0.5%p/);
 await body.getByRole('button',{name:'허리',exact:true}).click();
 await body.getByRole('button',{name:'2026-11-02 허리 기록 없음',exact:true}).click();
 assert.match(await details.innerText(),/전일 대비 기록 없음 · 7일 전 대비 기록 없음/);
 await body.getByRole('button',{name:'이 날짜 기록 추가',exact:true}).click();
 await body.getByLabel('허리둘레 (cm)',{exact:true}).fill('72');
 await body.getByLabel('엉덩이둘레 (cm)',{exact:true}).fill('92');
 await body.getByLabel('허벅지둘레 (cm)',{exact:true}).fill('52');
 await body.getByRole('button',{name:'기록 저장',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.bm-page [role=status]')?.textContent.includes('저장했어요'));
 await waitFor(()=>content.hfDashboard.bodyMeasurements.length===5);
 assert.deepEqual(content.hfDashboard.bodyMeasurements.slice(0,4),legacy);
 assert.equal(content.hfDashboard.bodyMeasurements[4].weight,null);
 assert.equal(content.hfDashboard.bodyMeasurements[4].waist_cm,72);
 assert.deepEqual(content.hfDashboard.unrelated,{keep:true});
 // Correct the date of this single record; no existing row is overwritten.
 await body.getByLabel('날짜',{exact:true}).fill('2026-10-31');
 await body.getByRole('button',{name:'기록 저장',exact:true}).click();
 await waitFor(()=>content.hfDashboard.bodyMeasurements[4].date==='2026-10-31');
 assert.deepEqual(content.hfDashboard.bodyMeasurements.slice(0,4),legacy);
 page.once('dialog',dialog=>dialog.accept());
 await body.getByRole('button',{name:'선택한 기록 삭제',exact:true}).click();
 await waitFor(()=>content.hfDashboard.bodyMeasurements.length===4);
 assert.deepEqual(content.hfDashboard.bodyMeasurements,legacy);
 // Edit only the representative duplicate; preserve its unknown metadata.
 await body.getByRole('button',{name:'달력',exact:true}).click();
 await body.getByRole('button',{name:'다음 달',exact:true}).click();
 await body.getByRole('button',{name:'2026-11-01 허리 71.0cm',exact:true}).click();
 await body.getByRole('button',{name:'이 날짜 기록 수정',exact:true}).click();
 assert.equal(await body.getByLabel('체중 (kg)',{exact:true}).inputValue(),'61');
 await body.getByLabel('허리둘레 (cm)',{exact:true}).fill('73');
 await body.getByRole('button',{name:'기록 저장',exact:true}).click();
 await waitFor(()=>content.hfDashboard.bodyMeasurements[3].waist_cm===73);
 assert.equal(content.hfDashboard.bodyMeasurements[3].unknown,'retain');
 assert.deepEqual(content.hfDashboard.bodyMeasurements[0],legacy[0]);
 assert.equal(content.hfDashboard.bodyMeasurements.length,4);
 // A new authenticated browser context reloads the persisted mock cloud JSON.
 const second=await context.newPage();await second.goto(process.env.BODY_TEST_URL||'http://127.0.0.1:5173/');
 await second.locator('.bottom-nav button').filter({hasText:'신체'}).click();
 await second.getByRole('button',{name:'기록',exact:true}).click();
 assert.match(await second.locator('.bm-history').innerText(),/73.0cm/);
 await second.close();
 await body.getByRole('button',{name:'그래프',exact:true}).click();
 await body.getByRole('button',{name:'전체',exact:true}).click();
 for(const name of ['체중','체지방률','골격근량','BMI','허리','엉덩이','허벅지']){
  await body.getByRole('button',{name,exact:true}).click();
  assert.equal(await body.locator('.bm-chart').count(),1);
 }
 await body.getByRole('button',{name:'체중',exact:true}).click();
 await body.locator('.bm-chart [role=button]').last().focus();await page.keyboard.press('Enter');
 assert.match(await details.innerText(),/2026-11-01 측정/);
 for(const size of [{width:320,height:740},{width:390,height:844},{width:768,height:1024},{width:1280,height:900}]){
  await page.setViewportSize(size);await body.getByRole('button',{name:'달력',exact:true}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${size.width}`);
  assert.equal(await body.locator('.bm-days').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),7);
 }
 // Updating height uses the existing JSON key and recalculates BMI.
 await body.locator('.bm-height button').click();
 await body.getByLabel('키 cm',{exact:true}).fill('170');
 await body.locator('.bm-height-edit').getByRole('button',{name:'저장',exact:true}).click();
 await waitFor(()=>content.hfDashboard.bodyHeight===170);
 assert.equal(content.hfDashboard.bodyMeasurements[3].waist_cm,73);
 // Removing a duplicate deletes only that row; the older day record remains.
 await body.getByRole('button',{name:'기록',exact:true}).click();
 page.once('dialog',dialog=>dialog.accept());
 await body.getByRole('button',{name:'2026-11-01 기록 4 삭제',exact:true}).click();
 await waitFor(()=>content.hfDashboard.bodyMeasurements.length===3);
 assert.deepEqual(content.hfDashboard.bodyMeasurements,legacy.slice(0,3));
 assert.deepEqual(content.notes,[{id:'preserved-note',text:'keep'}]);
 assert.deepEqual(errors,[]);assert.ok(writes.length>=4);
 console.log('PASS: legacy data, duplicate preservation, exact date deltas, BMI, %p, circumference CRUD/date correction, authenticated mock cloud reload, all charts, keyboard selection, 320/390/768/1280px layouts.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
async function waitFor(condition){for(let i=0;i<100;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,50))}throw new Error('Mock cloud write timed out')}
