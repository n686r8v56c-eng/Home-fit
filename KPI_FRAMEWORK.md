# KPI Framework — Home Fit Development Specification

Version: 1.0  
Date: 2026-11-02  
Status: Framework taxonomy approved; Home Fit indicator selection and implementation details remain subject to review.

## 1. Purpose

A common KPI framework for personal growth and social expansion across Flow apps. It treats KPIs as a **growth process**, not merely a scorecard.

**Personal growth:** Learning → Execution → Outcome  
**Social expansion:** Social → Branding → Monetization → Challenge

The seven categories are a logical presentation order, **not mandatory sequential gates**. Activity, external feedback, and results can inform earlier strategies. Not every project needs all seven categories.

## 2. Seven KPI categories and 36 subcategories

### 01 Learning — 학습 (5)
- 지식 습득: study hours, completed learning units
- 기술 습득: newly acquired skills, proficiency
- 자료 구축: library entries, bookmarks, organized references
- 시스템 구축: sequences, routines, manuals
- 학습 검증: mock exam scores, self-assessment

### 02 Execution — 실행 (5)
- 시간 투입: exercise/study/practice minutes
- 횟수·빈도: gym attendance, practice sessions
- 계획 이행: completion against plans
- 지속성: streaks and active weeks
- 실행 품질: concentration, accurate performance

### 03 Outcome — 결과 (5)
- 신체·상태 변화: weight, BMI, body-fat percentage, skeletal muscle mass
- 능력 변화: strength, flexibility, fitness, examination scores
- 경제적 변화: assets, savings, net worth changes (distinguished from monetization revenue)
- 생활 변화: sleep regularity, habit stability
- 목표 달성: goal weight, qualifications, milestones

### 04 Social — 소셜 (5)
- 커뮤니티 참여: active days, comments, posts
- 오프라인 교류: running groups, events attended
- 관계 형성: new acquaintances, friends
- 관계 유지: repeat meetings, sustained contact
- 지식·가치 공유: useful posts and helping others

### 05 Branding — 브랜딩 (5)
- 정체성 정의: strengths, positioning keywords, self-introduction
- 이미지 구축: profile photo, styling
- 콘텐츠 제작: posts, videos, portfolio
- 노출·인지도: views, profile visits
- 평판·신뢰: recommendations, reviews, collaboration approaches

### 06 Monetization — 수익화 (6)
- 매출: monthly, cumulative, and product-level revenue
- 수익성: profit, operating profit, margin
- 고객 확보: first-time paid customers
- 전환 성과: inquiry-to-purchase conversion
- 반복 수익: recurring revenue, repeat purchases
- 수금: received payments and accounts receivable

### 07 Challenge — 경쟁 (5)
- 도전 기회 탐색: events and competitions researched
- 참가·출전: competition registrations and appearances
- 완주·완수: completed races and submissions
- 객관적 기록: official race times, official scores
- 경쟁 성과: rankings, awards, prizes

Total: **7 major categories / 36 subcategories**.

## 3. Cross-cutting indicator metadata

Every KPI can optionally carry:
- Project ID / category / subcategory / metric name
- Measure type: input (투입), output (산출), change (변화), external response (외부 반응), external validation (외부 검증)
- Controllability: high / medium / low
- Unit, target, actual, reporting period, source app, review cadence
- Connected KPI references, strategy and interpretation notes

**Assessment rule:** use controllable actions to assess daily progress; use less-controllable outcomes to examine strategic effectiveness over an appropriate period. Correlation alone does not establish causation.

## 4. Home Fit application

Home Fit remains the primary location for entering fitness and body measurements. A higher-level KPI Framework or 90 Day Project Flow may read that data rather than requiring duplicate input.

### Existing Home Fit screens to preserve
- 홈: actual workout time, gym attendance, sequence/photo creation indicators, today's planned sequences
- 전략 (to become 프로세스): weekly fitness goals, frequency and minutes/session, 90-day simulations and planned-versus-actual comparisons, including gray subcategory labels beneath charts
- 일정: calendar and date-specific activities
- Exercise: exercise photos, libraries, sequences, bookmarks, playback
- 신체: dated weight, BMI calculated from height and weight, body-fat %, skeletal muscle mass; charts and edit/delete history

### Current Home Fit indicator candidates
- 학습: new sequences created; new exercise photos uploaded (only count verified events and timestamps)
- 실행: manually confirmed exercise minutes (근력운동 / 스트레칭 / 마사지); gym attendance
- 결과: dated weight, BMI, body-fat percentage, skeletal muscle mass
- 소셜: running group participation, community activity, relationships (proposed)
- 브랜딩: profile photo, fitness-related content (proposed)
- 수익화: fitness-related sales, paid clients, actual receipts (proposed)
- 경쟁: competition participation, official results and rankings (proposed)

**Important:** Completing a planned sequence checklist must NOT automatically count as exercise minutes. Sequence creation is distinct from completing or editing an existing sequence.

## 5. Implementation roadmap

### Phase 1: Navigation only
Bottom navigation: **홈 · 프로세스 · 일정 · Exercise · 신체**.

Inside 프로세스, add three compact subtabs: **성장 단계 · 전략 · 분석**.
- 성장 단계: 7 collapsible category cards in exact approved order, without inventing persistent KPI values.
- 전략: move/reuse the current strategy blocks and all calculation/save logic, including five chart periods (오늘, 최근 7일, 이번 주, 이번 달, 90일) and gray exercise-subcategory descriptors.
- 분석: simple placeholder only in Phase 1.
- Keep Supabase auth, records, Exercise and Body screens intact.

### Phase 2: Growth-stage KPI management (requires metric selection)
- Confirm relevant subcategories and measurable Home Fit indicators with product owner before implementation.
- Targets, actuals, units, periods, entry modes, and derived totals.
- Use existing app records for automated counts when safe; clearly label metrics awaiting integration.
- Preserve separation between manual records and automatically sourced data.

### Phase 3: App integrations
- Link records from Home Fit and other Flow apps with clearly defined, testable read models.
- Do not fabricate data, reset tables, or silently change Supabase schemas.

### Phase 4: Analysis and Growth Loop
- Per-category trends and target-versus-actual comparisons
- Explicit KPI connection hypotheses, not claims of causality
- Periodic strategic reflection and adjustment notes

## 6. Design and engineering requirements

- React + Vite + Supabase + Cloudflare Pages; preserve existing structure.
- Focus Flow style: purple/lavender/white/black/gray, mobile-first, compact controls, no horizontal overflow or wide dialogs.
- Keep functional components and CSS maintainable.
- Existing data, login, exercise records, calendar, strategy functionality, and body measurements must remain intact.
- Make changes on a separate branch; verify with `npm run build`; report changed files and known unverified runtime behavior; open a PR for review.
- Treat this file as **design reference**, not an instruction to implement all phases automatically.

## 7. Open design decisions

- Which of the 36 subcategories should be active in Home Fit?
- Which indicators are read-only from existing Exercise/Body data vs manually entered?
- What goals, units and cadences should apply to Social, Branding, Monetization and Challenge?
- What subset of KPIs should appear on Home versus the Process analysis subtab?

Do not invent final answers to these unresolved product choices.
