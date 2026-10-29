# Mind Flow 운동 기능 → Home Fit

브랜치: `feat/mind-flow-exercise-migration`

기준 커밋:
- Home Fit: `69e84b313023d7e6ea33c8864655d1982f266a5f`
- Mind Flow: `9658507e8894fd83cfb9bcb639a831ced3f35133`

## 구현

하단 메뉴는 Home / Calendar / Exercise / Library / 메모 순서입니다.
Exercise는 원본 요가 탭의 전체 선택기를 이식합니다: 요가, 매트 필라테스, SNPE, 골반순환, 스트레칭, 폼롤러, 마사지, 맨몸근력, 덤벨, 바벨, 머신, 통합 라이브러리.
원본 동작 CRUD, 사진, 사용자 프리셋과 시퀀스, 재생·타이머·음성 안내, 부위·태그·폴더, 북마크, 자연음과 정적 사진/음원 자산을 포함합니다. 원본의 미구현 항목이나 기본 데이터 범위도 그대로 유지합니다.

저장한 시퀀스의 ‘일정 추가’에서 날짜와 기존 세 가지 분류를 고릅니다. Home과 Calendar에서 실행·일시정지·이전/다음·완료 체크가 가능합니다. 일정 실행기는 초 단위 타이머와 한국어 동작 안내를 제공하고, 기존 운동 편집기의 박자·언어 설정과 재생 기능도 그대로 남습니다. 완료는 사용자가 명시적으로 기록합니다.

일정에는 동작 사본을 저장하고 완료 시 다시 사본을 남깁니다. 원본 시퀀스 변경·삭제 및 일정 제거 후에도 완료 기록은 남습니다. 같은 날짜/같은 시퀀스의 재등록은 일정만 갱신하며 완료 당시 사본은 유지합니다. 영상과 운동은 ID 접두사로 구분하며 기존 `videoId` 일정/완료 구조와 호환됩니다.

## 데이터와 연결

Mind Flow 저장소에는 변경을 하지 않았습니다. SQL/테이블/버킷 생성·삭제, 실제 계정 데이터 이전·덮어쓰기, 배포, main 병합도 수행하지 않습니다.

Home Fit의 `home_fit_data.content` 저장 경로와 순차 저장 방식은 유지합니다. 신규 필드는 `exerciseYoga`와 일정/완료의 `sequence` 사본이며, 나머지 기존 필드는 spread로 보존합니다. 로컬 요가 시퀀스·프리셋을 가져오면 Home Fit 로그인 계정의 `exerciseYoga`에 보관하므로 다른 기기에도 동기화됩니다. 로컬 사진은 백업 JSON의 이미지 데이터로 같은 계정에 보관하며, 사진 수가 많으면 저장 용량과 전송량이 커집니다.

운동 데이터는 원본 테이블과 버킷 이름을 그대로 사용합니다:
- `mindflow_activity_moves`, `mindflow_activity_presets`, `mindflow_activity_sequences`
- `mindflow_studio_data` (bodyweight/pelvic), `mindflow_snpe_studio`
- `mindflow_foam_roller_moves`, `mindflow_foam_roller_sequences`
- `mindflow_yoga_photos`, `mindflow_massage_bookmarks`, `mindflow_massage_bookmark_folders`
- `mindflow-yoga`, `mindflow-studio-photos` Storage 버킷

원본과 Home Fit이 같은 Supabase 프로젝트라면 기존 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 또는 `VITE_SUPABASE_PUBLISHABLE_KEY`와 로그인 세션을 재사용합니다. 클라이언트를 중복 생성하지 않습니다.

서로 다른 프로젝트라면 **기존 Mind Flow 프로젝트 값**을 다음 빌드 환경변수에 설정해야 합니다. 기존 Home Fit 설정을 바꾸지 마세요:

```dotenv
VITE_EXERCISE_SUPABASE_URL=<기존 Mind Flow 프로젝트 URL>
VITE_EXERCISE_SUPABASE_ANON_KEY=<해당 프로젝트의 anon 또는 publishable key>
```

그 경우 Exercise에서 기존 Mind Flow 계정으로 별도 로그인하며, 원본 사용자 ID/사진 경로와 RLS를 유지합니다. 비밀 키나 service_role 키는 사용하지 않습니다. 두 화면이 같은 원본 운동 데이터를 공유하므로 Home Fit Exercise에서 사용자가 직접 수정한 운동은 원본 클라우드 데이터에도 반영됩니다. 시퀀스 일정/완료 사본은 Home Fit 프로젝트에 저장합니다.

## 브라우저에만 남아 있는 요가 자료

브라우저는 서로 다른 사이트의 localStorage/IndexedDB를 읽을 수 없습니다. 코드 이식만으로 다른 주소의 로컬 데이터가 자동 이동하지 않습니다.

1. 기존 Mind Flow를 사용하던 동일 브라우저/주소에서 `public/exercise-export.js` 내용을 개발자 도구 콘솔에 실행합니다. 원본 저장소에 파일을 추가할 필요가 없습니다.
2. 내려받은 `mind-flow-exercise-backup.json`을 Home Fit Exercise의 ‘이전 기기의 요가 시퀀스·사진 가져오기’에서 선택합니다.
3. 기존 ID는 덮어쓰지 않고 빠진 시퀀스·프리셋·사진만 합칩니다. 사진/시퀀스 원본은 삭제하지 않습니다.

내보내기는 `mind-flow-yoga-sequences-v1`, `mind-flow-yoga-custom-presets-v1` 및 `mind-flow-yoga-photos-v1` IndexedDB만 읽습니다. 인증 토큰·비밀번호는 포함하지 않습니다. 가져온 사진은 Home Fit 계정별 데이터에 저장하며, 새 업로드용 IndexedDB도 계정별로 분리합니다.

## 검증

실행 완료:
- `npm run build`: 통과 (기존 lucide-react의 `use client` 번들 경고만 발생)
- `node --test tests/exercise-scheduling.test.mjs`: 6개 통과
- `node tests/exercise-render.mjs`: 혼합 Home 영상/시퀀스·완료 기록, 메뉴 순서, 9개 운동 모듈, 일정 실행기 서버 렌더 통과
- `git diff --check`: 통과

`tests/exercise-browser.cjs`에는 실제 데이터 요청을 가로채는 모바일 Playwright 시나리오가 준비되어 있습니다. 이 환경에는 Chromium이 없고 다운로드가 차단되어 **브라우저 시나리오는 미실행**입니다. 실행하려면 Playwright 및 Chromium이 있는 환경에서 `node tests/exercise-browser.cjs`를 사용합니다. 실제 계정 로그인, RLS/Storage 접근 및 기기별 재생 동작도 아직 실기기 검증 전입니다.

원격 브랜치 생성은 GitHub 연결의 `403 Resource not accessible by integration`으로 거절되었습니다. 로컬 브랜치에 구현·검증 결과를 남기며 main은 변경하지 않습니다.
