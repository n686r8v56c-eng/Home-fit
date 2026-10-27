# Home Fit — 홈트 유튜브 운동 기록 앱

기존 북마크 앱에서 영감을 받은 독립형 React/Vite 앱입니다.

## 실행

```bash
npm install
npm run dev
```

Codespaces에서 포트 5173을 열어 사용하세요. Netlify에는 이 폴더를 새 GitHub 저장소로 배포하고 Build command=`npm run build`, Publish directory=`dist`로 설정합니다.

## 현재 기능
- Home / Calendar / Library 하단 3탭
- 유튜브 주소 등록, 썸네일 표시, 제목 자동 불러오기(YouTube oEmbed 허용 시), 시간·메모·복수 폴더 입력
- 폴더 추가/수정/삭제: 모바일에서 폴더 수정은 길게 누르기(브라우저별로 길게 누르기가 다르게 작동할 수 있음)
- 오늘 및 선택한 날짜에 운동 영상 배정
- 영상별 운동 완료 체크 및 체크 해제
- 캘린더 날짜 클릭 시 **그 날짜에 실제로 완료한 영상**을 썸네일·제목·시간과 함께 표시
- 운동 시간 및 완료 영상 수 합계
- 제목/카테고리/메모 검색

## 데이터 저장과 주의사항

**이 첫 버전은 브라우저 localStorage에 저장합니다.** 동일 브라우저/기기에서는 새로고침 후에도 남지만, Safari 저장 데이터 초기화 시 삭제될 수 있습니다. iPhone/iPad 간 동기화는 아직 없습니다. 별도 Supabase 프로젝트 연결 및 사용자별 RLS 설정이 필요합니다.

YouTube 썸네일과 oEmbed 제목 조회에는 네트워크가 필요합니다. 조회가 안 되면 제목을 수동 입력할 수 있습니다. 운동 영상은 YouTube에서 재생되고, 앱은 시청 종료를 자동 감지하지 않습니다. 사용자가 완료 체크해야 기록됩니다.

## 다음 단계
- Supabase Auth + 사용자별 folders/videos/plans/completions 테이블 및 RLS
- 폴더 모바일 길게 누르기 메뉴 안정화
- 반복 루틴 / 주간 운동 통계
