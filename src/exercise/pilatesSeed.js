// Original classical mat order (1–34); functional groupings are Mind Flow's own taxonomy.
// The import deliberately never includes photo paths.
export const PILATES_GROUPS = [
 '호흡 · 코어 활성화','복부 · 코어 강화','척추 분절 · 유연성','골반 · 둔근 강화',
 '고관절 · 다리','등 · 척추 신전','회전 · 측면 안정화','전신 통합 · 밸런스'
];
const rows = [
 ['헌드레드','The Hundred',1,0,'호흡,복부,코어,바로 누움'],
 ['롤 업','The Roll Up',2,2,'척추 분절,복부,굴곡'],
 ['롤 오버','The Roll Over',3,2,'척추 분절,역전,고급'],
 ['원 레그 서클','The One Leg Circle',4,4,'고관절,골반 안정,바로 누움'],
 ['롤링 라이크 어 볼','Rolling Like a Ball',5,2,'척추 마사지,균형,복부'],
 ['싱글 레그 스트레치','The One Leg Stretch',6,1,'복부,코어,교대 다리'],
 ['더블 레그 스트레치','The Double Leg Stretch',7,1,'복부,코어,팔다리 협응'],
 ['스파인 스트레치','The Spine Stretch',8,2,'척추 굴곡,앉은 자세,유연성'],
 ['오픈 레그 로커','Rocker with Open Legs',9,7,'복부,균형,롤링'],
 ['코르크스크루','The Cork-Screw',10,6,'복부,회전,골반 안정'],
 ['쏘우','The Saw',11,6,'척추 회전,햄스트링,앉은 자세'],
 ['스완 다이브','The Swan Dive',12,5,'등,척추 신전,엎드림'],
 ['싱글 레그 킥','The One Leg Kick',13,5,'등,햄스트링,엎드림'],
 ['더블 레그 킥','The Double Kick',14,5,'등,가슴 열기,엎드림'],
 ['넥 풀','The Neck Pull',15,2,'척추 분절,복부,고급'],
 ['시저스','The Scissors',16,4,'다리,고관절,역전,고급'],
 ['바이시클','The Bicycle',17,4,'다리,고관절,역전,고급'],
 ['숄더 브릿지','The Shoulder Bridge',18,3,'골반,둔근,척추 분절'],
 ['스파인 트위스트','The Spine Twist',19,6,'척추 회전,앉은 자세,코어'],
 ['잭 나이프','The Jack-Knife',20,7,'전신,역전,복부,고급'],
 ['사이드 킥','The Side Kick',21,4,'고관절,둔근,옆으로 누움'],
 ['티저','The Teaser',22,1,'복부,코어,밸런스,고급'],
 ['힙 트위스트','The Hip Twist with Stretched Arms',23,6,'골반,복부,회전'],
 ['스위밍','Swimming',24,5,'등,척추 신전,팔다리 협응'],
 ['레그 풀 프런트','The Leg Pull – Front',25,7,'플랭크,어깨 안정,전신'],
 ['레그 풀 백','The Leg Pull',26,7,'후면 사슬,어깨 안정,전신'],
 ['닐링 사이드 킥','The Side Kick – Kneeling',27,4,'고관절,옆구리,무릎 지지'],
 ['사이드 벤드','The Side Bend',28,6,'측면 코어,어깨 안정,옆구리'],
 ['부메랑','The Boomerang',29,7,'전신,롤링,균형,고급'],
 ['실','The Seal',30,2,'척추 마사지,롤링,균형'],
 ['크랩','The Crab',31,2,'척추 마사지,롤링,고급'],
 ['로킹','The Rocking',32,5,'등,척추 신전,엎드림,고급'],
 ['컨트롤 밸런스','The Control Balance',33,7,'역전,균형,전신,고급'],
 ['푸시 업','The Push Up',34,7,'팔,어깨,전신,플랭크'],
];
export const PILATES_CLASSICAL_34 = rows.map(([name,english,order,group,tags])=>({
 name,english,order,group_name:PILATES_GROUPS[group],
 tags:['클래식 34',...tags.split(',')],
 notes:`클래식 매트 ${String(order).padStart(2,'0')}/34 · ${english}\n사진과 개인 동작 메모를 추가해 주세요.`,
 beats:8,side:'기본'
}));
