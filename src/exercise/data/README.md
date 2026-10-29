# Mind Flow Yoga Database (v1 draft)

기존 앱을 덮어쓰지 않는 독립 데이터 모듈입니다. 역자세 5개를 제외했습니다.

## 설치
두 파일 `yoga-poses.json`, `yoga-poses.js`를 `src/data/` 안에 복사하세요.

```js
import { yogaPoses, yogaCategories, findYogaPoses } from './data/yoga-poses';
const standing = findYogaPoses({category:'스탠딩'});
```

자세별 복수 카테고리를 지원합니다. 각 항목에 고유 ID가 있어 이후 이름·사진을 수정해도 시퀀스 참조가 유지됩니다.

`image: null`: 실제 사진은 아직 연결하지 않았습니다. 이미지의 라이선스와 자세 일치 여부를 확인한 뒤 연결하세요.

`reviewStatus: name-needs-review`: 사용자 책의 이미지 목록과 변형 명칭을 대조한 최종 검수가 남아 있습니다.

`difficulty: unspecified`: 난이도는 추측하지 않고 빈 상태로 둔 값입니다. 일부 고급 자세만 `advanced`입니다.

이 파일은 데이터베이스 초안이며 아직 Mind Flow 요가 화면에 연결되지 않았습니다.
