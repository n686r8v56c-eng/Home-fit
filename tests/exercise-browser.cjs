const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').trim().split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
 const host=new URL(env.VITE_SUPABASE_URL).hostname,uid='00000000-0000-4000-8000-000000000001';
 const user={id:uid,email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
 const token=[{alg:'HS256',typ:'JWT'},{sub:uid,exp:Math.floor(Date.now()/1000)+86400,aud:'authenticated'},'signature'].map(x=>typeof x==='string'?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 const session={access_token:token,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,token_type:'bearer',user};
 const yoga=require('../src/exercise/data/yoga-poses.json').poses[0];
 let content={folders:['근력운동','스트레칭','마사지'],videos:[{id:'legacy-video',title:'기존 영상',youtubeId:'abcdefghijk',minutes:10,folders:['근력운동'],kind:'workout'}],plans:[],completions:[],notes:[{id:'legacy-note',text:'기존 메모',createdAt:new Date().toISOString(),kind:'workout'}],exerciseYoga:{sequences:[{id:'fixture-yoga',name:'테스트 요가',items:[{poseId:yoga.id,beats:4,side:'양쪽'}]}],presets:[]}};
 const writes=[],errors=[];
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${host.split('.')[0]}-auth-token`,session});
 await page.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.hostname!==host)return route.abort();
  let body=[];
  if(url.pathname.startsWith('/auth/v1/user'))body=user;
  else if(url.pathname.includes('/storage/'))body=url.pathname.includes('/sign/')?{signedURL:'/fixture.jpg'}:[];
  else if(url.pathname.endsWith('/home_fit_data')){
   if(req.method()==='GET')body={content};else{content=req.postDataJSON().content;writes.push(content);body=[]}
  }else if(url.pathname.endsWith('/mindflow_activity_sequences'))body=[{id:'act-seq',activity:'매트 필라테스',name:'필라테스 테스트',items:[{id:'move-a',name:'필라테스 동작',beats:8}]}];
  else if(url.pathname.endsWith('/mindflow_studio_data'))body={data:{exercises:[],saved:[{id:'studio-seq',name:'스튜디오 테스트',items:[{id:'m',name:'스튜디오 동작',seconds:1}]}]}};
  else if(url.pathname.endsWith('/mindflow_snpe_studio'))body={data:{moves:[{id:'snpe-m',name:'SNPE 동작',seconds:10}],saved:[{id:'snpe-s',name:'SNPE 테스트',steps:[{id:'snpe-m',name:'SNPE 동작',seconds:10}]}]}};
  else if(url.pathname.endsWith('/mindflow_foam_roller_moves'))body=[{id:'foam-m',title:'폼롤러 동작',seconds:60,category:'등/흉추'}];
  else if(url.pathname.endsWith('/mindflow_foam_roller_sequences'))body=[{id:'foam-s',title:'폼롤러 테스트',move_ids:['foam-m']}];
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto('http://127.0.0.1:5173/');
 const nav=page.getByRole('navigation',{name:'메인 메뉴'});
 await nav.getByRole('button',{name:'Exercise',exact:true}).click();
 assert.deepEqual(await nav.getByRole('button').allTextContents(),['Home','Calendar','Exercise','Library','메모']);
 await page.getByRole('button',{name:'요가 YOGA'}).click();
 await page.getByRole('button',{name:/나의 시퀀스/}).click();
 await page.getByRole('button',{name:'＋ 일정 추가',exact:true}).click();
 await page.locator('input[type=date]').fill('2026-10-29');
 await page.getByRole('button',{name:'이 일정에 추가하기'}).click();
 await page.waitForTimeout(100);
 assert.equal(content.plans.length,1);assert.equal(content.plans[0].sequence.items.length,2);
 await nav.getByRole('button',{name:'Calendar',exact:true}).click();
 // Navigate to the scheduled month, regardless of test host clock.
 for(let attempts=0;attempts<36;attempts++){const heading=await page.locator('.month-head h2').textContent();if(heading.includes('2026년 10월'))break;const numbers=heading.match(/\d+/g).map(Number);await page.locator('.month-head button').nth(numbers[0]*12+numbers[1]>2026*12+10?0:1).click()}
 await page.locator('.calendar-grid .day').filter({has:page.locator('span',{hasText:/^29$/})}).click();
 await page.getByRole('button',{name:'실행',exact:true}).click();
 await page.getByRole('button',{name:'시작 / 재개',exact:true}).click();
 await page.getByRole('button',{name:'일시정지',exact:true}).click();
 await page.getByRole('button',{name:'운동 완료 기록',exact:true}).click();
 await page.getByRole('button',{name:'닫기',exact:true}).click();
 await page.waitForTimeout(100);assert.equal(content.completions.length,1);assert.equal(content.completions[0].sequence.title,'테스트 요가');
 await page.getByRole('button',{name:'일정에서 삭제',exact:true}).click();
 await page.waitForTimeout(100);assert.equal(content.plans.length,0);assert.equal(content.completions.length,1);
 await page.reload();await nav.getByRole('button',{name:'Library',exact:true}).click();await page.getByText('기존 영상',{exact:true}).waitFor();
 await nav.getByRole('button',{name:'메모',exact:true}).click();await page.getByText('기존 메모',{exact:true}).waitFor();
 // Every migrated module mounts independently under a mobile viewport.
 for(const name of ['매트 필라테스','SNPE','골반순환','스트레칭','폼롤러','마사지','맨몸근력','덤벨','바벨','머신','통합 라이브러리']){
  await nav.getByRole('button',{name:'Home',exact:true}).click();await nav.getByRole('button',{name:'Exercise',exact:true}).click();
  await page.getByRole('button',{name:new RegExp('^'+name+' ')}).click();await page.waitForTimeout(130);
  assert.equal(await page.getByText('운동 화면을 열지 못했어요.',{exact:false}).count(),0,name);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),name+' horizontal overflow');
 }
 assert.deepEqual(errors,[]);
 assert.ok(writes.length>0);
 console.log('PASS: 5-tab navigation, yoga schedule snapshot, bilateral steps, Calendar execution/pause/completion, schedule deletion with history, reload persistence, existing video/memo preservation, 12 exercise categories, mobile overflow and runtime errors. Mock Supabase only.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
