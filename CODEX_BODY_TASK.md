# Home Fit — Body Tab Calendar & Measurements Development Task

Date: 2026-11-02
Scope: **신체 (Body) tab only**. Do not implement KPI Process, Strategy tab, or unrelated features in this task.

## Goal
Enhance the EXISTING 신체 tab, preserving every current body record and feature. Add a monthly measurement calendar inspired by the user's screenshot: each day cell shows the value actually recorded on that date for the selected measurement. Add waist, hip and thigh circumferences.

## Navigation within 신체
Compact subtabs: **달력 | 그래프 | 기록**.
- 달력 shows a month grid, previous/next month controls, weekday labels, date and measurement.
- Above the month grid, compact switcher for: 체중, 체지방률, 골격근량, BMI, 허리, 엉덩이, 허벅지.
- Each date cell shows the chosen metric's actual value for that day, not a presence dot. No measurement → show '—'. Include appropriate units in legend/header rather than every tiny cell.
- Tapping a date displays measurements for that selected date and supports add/edit/delete for that date.
- Keep existing charts under 그래프, including periods 7 days, 30 days, 90 days, 1 year and all time if supported; add charts for three circumferences.
- 기록 contains date-based entry form and history; all fields optional except date, allowing partial measurements.

## Measurement fields
Existing:
- 체중 weight_kg (kg)
- 체지방률 body_fat_pct (%)
- 골격근량 skeletal_muscle_kg (kg)
- BMI (calculated from height and weight, never separately entered; preserve existing height configuration)

Add:
- 허리둘레 waist_cm (cm)
- 엉덩이둘레 hip_cm (cm)
- 허벅지둘레 thigh_cm (cm; one-side measurement convention, display helpful brief label)

Optional derived display:
- WHR = waist_cm / hip_cm when both present; don't show or fabricate when either is missing.

### Daily change / graph details
- For weight show current, previous-day difference and 7-day difference when exact dates have measurements.
- Missing yesterday or 7-day-prior measurement → '기록 없음'; do not silently substitute a nearby date or show 0 change.
- For BMI use the user's configured height and the stored day's weight.
- If multiple records per day exist, inspect the existing data design and choose a consistent explicit representative rule (for example, most recent measurement); do not lose older records.
- Graph interaction can show the selected date's measurement and available day-over-day change.
- Changes in body fat % should be represented in percentage points (%p), not relative percent.

## Data preservation & synchronization
- Inspect the current React/Vite components and Supabase storage mechanism before editing.
- Maintain existing stored records, keys, tables, auth, and cross-device sync.
- If fields are stored in a JSON record, extend with optional properties non-destructively.
- If SQL schema changes are necessary, provide a safe additive migration; no dropping tables, overwriting values or resetting records.
- Preserve history edit/delete and allow date correction.
- Show no fictional measurements. Empty dates remain empty.

## UI
- Focus Flow style: purple/lavender/white/black/gray. Compact iPhone-first UI, responsive iPad/desktop.
- Month grid 7 columns with day number and selected metric beneath; no horizontal overflow, no inflated dialogs.
- Consistent with existing Home Fit controls, keep existing features.
- Screenshot provides **layout inspiration only**; do not copy its ads, branding or paid prompts.

## Development safeguards
1. Read latest Home-fit main code first, then work on a separate code branch.
2. Restrict changes to Body tab and necessary additive storage helpers.
3. Verify prior body records still display; add/edit/delete for existing and new metrics; month navigation; exact-date empty behavior; charts; BMI calculation; auth/sync.
4. Run `npm run build` and relevant tests.
5. Report modified files, schema changes if any, verification results and limitations. Open a PR; do not merge without user approval.

**Do not change** bottom navigation, 프로세스, 전략, 일정, Exercise, login flow, or unrelated KPI modules.