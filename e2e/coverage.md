# 테니스판타지 계산기 요구사항·검증 추적표

기준: `prd.md` v1.2, `프롬프트1.md` v1.1  
최종 갱신: 2026-10-01  
상태 기준: `tests.html` TC-01~TC-29 통과, Playwright S-01~S-51 통과 (아래 표의 줄 번호는 2026-08-30 기준)

## 요구사항 매트릭스 — FR 18개

| ID | 요구 요약 | 구현 위치 | 검증 | 상태 |
|---|---|---|---|---|
| FR-01 | 클래식 스크립트 로드·전역·데이터 검증과 실패 차단 | `index.html:302`, `index.html:385` | S-01, S-33, S-34 | 통과 |
| FR-02 | 월 1일~말일과 미지원 연도 보류 | `calc.js:58`, `index.html:590` | TC-07, S-24 | 통과 |
| FR-03 | `(branchId, productId)` 가격 격리 | `index.html:354`, `prices.js:1` | TC-13, S-08, S-09 | 통과 |
| FR-04 | 주당 횟수와 요일 수 일치, 일요일 허용 | `calc.js:243`, `index.html:475` | TC-08, TC-11, S-04~S-07 | 통과 |
| FR-05 | 전체 월 예정일 계산, 말일·5주차 포함 | `calc.js:283` | TC-01, TC-07, TC-09 | 통과 |
| FR-06 | 휴일 기본 미선택, 사용자 선택분만 일반 제외·대체/임시 포함, 중복 차단 | `index.html:386`, `index.html:616`, `calc.js:283`, `calc.js:194` | TC-02~TC-06, S-14~S-15 | 통과 |
| FR-06.1 | 미지원 연도 동의 계산과 경고 | `index.html:590`, `calc.js:370` | TC-12, S-24 | 통과 |
| FR-07 | 수동 제외·포함, 공휴일 복구·보강 | `calc.js:309`, `index.html:607` | TC-18~TC-21, S-16~S-19 | 통과 |
| FR-08 | 집합 기반 유효일, 중복 제거, 0회·초과 허용 | `calc.js:315` | TC-01, TC-06, TC-10 | 통과 |
| FR-09 | 3 가격 모델, 직접 요금, 100원 절사, 0 override | `calc.js:338` | TC-09, TC-10, TC-16, TC-17, TC-23, S-13 | 통과 |
| FR-10 | 적용 요금 조정·복원·초기화 | `index.html:496`, `index.html:717` | S-10, S-35, S-40 | 통과 |
| FR-11 | 최종 금액 조정·복원·초기화 | `index.html:558`, `index.html:717` | S-11~S-13, S-40 | 통과 |
| FR-11.1 | UI dirty·직전 자동값 상태 관리 | `index.html:323`, `index.html:496`, `index.html:579` | TC-14, S-40 | 통과 |
| FR-12 | 조정 사유 내부 전용·안전 렌더링 | `calc.js:445`, `index.html:629` | TC-15, S-20, S-26 | 통과 |
| FR-13 | 두 복사 문구와 2단계 fallback | `index.html:728`, `calc.js:445` | S-20~S-23, S-38, S-41 | 통과 |
| FR-14 | 상태 비저장·자동완성 방지 | `index.html:161`, `index.html:198`, `index.html:233` | S-25, S-26, 정적 감사 | 통과 |
| FR-15 | 다음 회원에서 개인 값만 초기화 | `index.html:742` | TC-22, S-28 | 통과 |
| FR-16 | 독립 TC-01~TC-24 자동 테스트 | `tests.html:70`, `tests.html:319` | S-32 | 통과 |

## 비기능 요구사항 — NFR 5개

| ID | 요구 요약 | 구현 위치 | 검증 | 상태 |
|---|---|---|---|---|
| NFR-01 | 외부 의존 없는 `file://` 오프라인 동작 | `index.html:302`, 제품 6개 파일 | S-31, 정적 감사 | 통과 |
| NFR-02 | 입력 확정 후 100ms 이내 동기 갱신 | `index.html:558`, `index.html:717` | S-39 5회 중앙값 | 통과 |
| NFR-03 | 문자열 안전 렌더링, 개인정보 비저장 | `index.html:313`, `index.html:629` | S-25, S-26, 정적 감사 | 통과 |
| NFR-04 | 보이는 라벨·키보드·기호+텍스트·모바일 | `index.html:123`, `index.html:161`, `index.html:675` | S-29, S-30, S-37 | 통과 |
| NFR-05 | 데이터·순수 계산·UI 분리 | `calc.js:1`, `index.html:302` | S-32, DOM 금지 grep | 통과 |

## 필수 테스트 — TC 24개

| ID | 자동 단언 위치 | 브라우저 검증 | 상태 |
|---|---|---|---|
| TC-01 | `tests.html:92` | S-02 | 통과 |
| TC-02 | `tests.html:101` | S-14 | 통과 |
| TC-03 | `tests.html:109` | S-35, S-37 | 통과 |
| TC-04 | `tests.html:117` | S-35, S-37 | 통과 |
| TC-05 | `tests.html:124` | S-35 | 통과 |
| TC-06 | `tests.html:131` | S-35 | 통과 |
| TC-07 | `tests.html:138` | S-02 | 통과 |
| TC-08 | `tests.html:145` | S-04~S-06 | 통과 |
| TC-09 | `tests.html:152` | S-22, S-38 | 통과 |
| TC-10 | `tests.html:165` | S-27 | 통과 |
| TC-11 | `tests.html:174` | S-04 | 통과 |
| TC-12 | `tests.html:181` | S-24 | 통과 |
| TC-13 | `tests.html:191` | S-08 | 통과 |
| TC-14 | `tests.html:202` | S-10~S-12, S-40 | 통과 |
| TC-15 | `tests.html:211` | S-20, S-21 | 통과 |
| TC-16 | `tests.html:221` | S-38 | 통과 |
| TC-17 | `tests.html:230` | S-38 | 통과 |
| TC-18 | `tests.html:239` | S-17, S-37 | 통과 |
| TC-19 | `tests.html:246` | S-18, S-37 | 통과 |
| TC-20 | `tests.html:254` | S-19, S-34 | 통과 |
| TC-21 | `tests.html:261` | S-35 | 통과 |
| TC-22 | `tests.html:269` | S-28 | 통과 |
| TC-23 | `tests.html:280` | S-38 | 통과 |
| TC-24 | `tests.html:292` | S-32 | 통과 |

## 차단 오류 코드 — 16개

| 코드 | 구현 위치 | 검증 | 상태 |
|---|---|---|---|
| E-DATA-PRICE-LOAD | `index.html:385` | S-34 | 통과 |
| E-DATA-PRICE-SCHEMA | `calc.js:118` | S-33, S-34 | 통과 |
| E-DATA-HOLIDAY-LOAD | `index.html:385` | S-34 | 통과 |
| E-DATA-HOLIDAY-SCHEMA | `calc.js:194` | S-34 | 통과 |
| E-DATA-CALC-LOAD | `index.html:385` | S-34 | 통과 |
| E-MONTH | `calc.js:243`, `index.html:527` | S-34 | 통과 |
| E-HOLIDAY-YEAR | `index.html:527` | S-24, S-34 | 통과 |
| E-BRANCH | `calc.js:243`, `index.html:527` | S-34 | 통과 |
| E-PRODUCT | `calc.js:243`, `index.html:527` | S-34 | 통과 |
| E-FREQUENCY | `calc.js:243`, `index.html:527` | S-34 | 통과 |
| E-WEEKDAYS | `calc.js:243`, `index.html:527` | S-04, S-34 | 통과 |
| E-PRICE-MISSING | `calc.js:243`, `index.html:527` | S-09, S-34 | 통과 |
| E-PRICE-VALUE | `calc.js:243`, `index.html:527` | S-34 | 통과 |
| E-FINAL-FEE | `calc.js:243`, `index.html:527` | S-34 | 통과 |
| E-ADJUST-RANGE | `calc.js:243`, `index.html:607` | S-34 | 통과 |
| E-ADJUST-DUP | `calc.js:243`, `index.html:607` | S-19, S-34 | 통과 |

## 비차단 안내 코드 — 16개

| 코드 | 구현 위치 | 검증 | 상태 |
|---|---|---|---|
| N-REGULAR-HOLIDAY | `calc.js:361` | S-35 | 통과 |
| N-SPECIAL-HOLIDAY | `calc.js:362` | S-35 | 통과 |
| N-OVER-BASE | `calc.js:367` | S-35 | 통과 |
| N-UNDER-BASE | `calc.js:368` | S-35 | 통과 |
| N-BASE-MATCH | `calc.js:369` | S-35 | 통과 |
| N-ROUNDED | `calc.js:370` | S-35 | 통과 |
| N-MANUAL-EXCLUSION | `calc.js:363` | S-35 | 통과 |
| N-MANUAL-INCLUSION | `calc.js:364` | S-35 | 통과 |
| N-EXCLUSION-NOOP | `calc.js:365` | S-35 | 통과 |
| N-INCLUSION-NOOP | `calc.js:366` | S-35 | 통과 |
| N-NO-HOLIDAY-DATA | `calc.js:371` | S-24, S-35 | 통과 |
| N-HOLIDAY-EMPTY | `index.html:667` | S-35 | 통과 |
| N-PRICE-ADJUSTED | `index.html:667` | S-10, S-35 | 통과 |
| N-FINAL-ADJUSTED | `index.html:667` | S-13, S-35 | 통과 |
| N-ADJUST-RESET | `index.html:374`, `index.html:579` | S-11, S-35, S-40 | 통과 |
| N-WEEKDAY-TRIMMED | `index.html:463` | S-07, S-35 | 통과 |

## 결과 패널 항목 — 18개

| 순서 | 항목 | 구현 위치 | 검증 | 상태 |
|---:|---|---|---|---|
| 1 | 최종 월 수강료 | `index.html:248` | S-36 | 통과 |
| 2 | 조정 요약 | `index.html:252` | S-36 | 통과 |
| 3 | 유효 횟수·기준 대비 | `index.html:253` | S-36 | 통과 |
| 4 | 달력 그리드 | `index.html:259` | S-36 | 통과 |
| 5 | 등록 공휴일 전체 | `index.html:265` | S-36 | 통과 |
| 6 | 계산 기간 | `index.html:271` | S-36 | 통과 |
| 7 | 지점·상품·시행일 | `index.html:272` | S-36 | 통과 |
| 8 | 가격표·적용 요금 | `index.html:273` | S-36 | 통과 |
| 9 | 기준 횟수·회당 금액 | `index.html:274` | S-36 | 통과 |
| 10 | 예정 수업일 | `index.html:277` | S-36 | 통과 |
| 11 | 일반 공휴일 제외 | `index.html:278` | S-36 | 통과 |
| 12 | 추가 제외 | `index.html:279` | S-36 | 통과 |
| 13 | 추가 포함 | `index.html:280` | S-36 | 통과 |
| 14 | 대체·임시 포함 | `index.html:281` | S-36 | 통과 |
| 15 | 실제 유효 수업일 | `index.html:282` | S-36 | 통과 |
| 16 | 계산식 | `index.html:283` | S-36 | 통과 |
| 17 | 조정 사유 | `index.html:284` | S-36 | 통과 |
| 18 | 복사 버튼 2개 | `index.html:285` | S-36 | 통과 |

## 달력 상태 — 8개

| 상태 키 | 기호·라벨 | 구현 위치 | 검증 | 상태 |
|---|---|---|---|---|
| normal-class | `● 수업` | `index.html:675` | S-37 | 통과 |
| regular-excluded | `✕ 제외 · 휴일명` | `index.html:675` | S-37 | 통과 |
| manual-exclude | `⊘ 휴강` | `index.html:675` | S-37 | 통과 |
| manual-include-restored | `＋ 수업(수동)` | `index.html:675` | S-37 | 통과 |
| manual-include-makeup | `＋ 보강` | `index.html:675` | S-37 | 통과 |
| special-class | `★ 수업 · 휴일명` | `index.html:675` | S-37 | 통과 |
| nonclass-holiday | 휴일명만 표시 | `index.html:675` | S-37 | 통과 |
| nonclass-empty | 무표시 | `index.html:675` | S-37 | 통과 |

## 복사 문구 조건부 줄 — 9개

| 문구 | 구현 위치 | 검증 | 상태 |
|---|---|---|---|
| 내부 · 적용 요금 조정 | `calc.js:465` | S-38 양방향 | 통과 |
| 내부 · 100원 절사 | `calc.js:487` | S-38 양방향 | 통과 |
| 내부 · 최종 금액 조정 | `calc.js:488` | S-38 양방향 | 통과 |
| 내부 · 조정 사유 | `calc.js:489` | S-38 양방향 | 통과 |
| 내부 · 공휴일 데이터 없음 | `calc.js:491` | S-38 양방향 | 통과 |
| 회원 · 일반 공휴일 | `calc.js:510` | S-38 양방향 | 통과 |
| 회원 · 대체·임시공휴일 | `calc.js:511` | S-38 양방향 | 통과 |
| 회원 · 보강 | `calc.js:512` | S-38 양방향 | 통과 |
| 회원 · 5주차 | `calc.js:513` | S-38 양방향 | 통과 |

## 루프 결과

### Loop A

- 1회차: 잘못된 최종 금액 입력 시 입력칸까지 잠기는 중대 결함 1건 발견·수정.
- 2회차: 날짜 목록 줄바꿈 구분자와 현재·다음 연도 검증 누락 경미 결함 2건 발견·수정.
- 3회차: 치명 0, 중대 0, 경미 0. 구문·금지 API·데이터 스키마·TC 전수 통과.

### Loop B

- 1회차: 36/41 통과. 제품 결함 1건과 시나리오 조건·계측 문제 4건 수정.
- 2회차: 40/41 통과. 성능 측정이 자동화 왕복을 포함한 계측 문제 수정.
- 3회차: 41/41 통과. 데이터 로드 실패 시나리오까지 예상 밖 콘솔 오류를 단언하도록 검증 강화.
- 4회차: **41/41 통과**, 실패 0, 콘솔 오류 0, `e2e/screenshots/S-01.png`~`S-41.png` 생성.

## 2026-10-01 방배점 가격표 개정

기준 자료: `방배점 가격표.jpg` (정규레슨 평일&주말 통합, 2개월 5% · 3개월 10% 등록 할인)

| 항목 | 구현 위치 | 검증 | 상태 |
|---|---|---|---|
| 방배점 상품 2종(1:1, 2:1 1인)·전 요일 허용·시행일 | `prices.js` 방배점 | S-42 | 통과 |
| 가격표 금액 6칸 + 할인 적용가 12칸 전수 대조 | `prices.js`, `calc.js` `discountedMonthlyFee` | TC-28, S-43 | 통과 |
| 등록 기간은 할인 있는 지점에서만 표시, 기본 1개월 | `index.html` `buildRegistrationButtons` | S-44 | 통과 |
| 평일+주말 혼합 요일의 정가·할인·공휴일·대여비 계산 | `index.html`, `calc.js` | S-45 | 통과 |
| 두 복사 문구의 등록 할인 줄 | `calc.js` `buildInternalReport`, `buildMemberMessage` | TC-28, S-46 | 통과 |
| 할인 위 수동 조정·초기화·다음 회원 | `index.html` `syncFeeAuto`, `nextMember` | S-47 | 통과 |
| 375px 모바일 등록 기간 표시 | `index.html` | S-48 | 통과 |
| 반포점 가격 22칸 불변 | `prices.js` 반포점 | S-49 | 통과 |
| 등록 기간 변경 시 수동 조정 항상 초기화(금액이 같아도) | `index.html` `selectRegistration`, `resetFeeAdjustments` | S-50 | 통과 |
| 적용 요금·최종 결제액 수동 조정 시 복사 문구·화면 안내 구분, 대여비 포함 회원 문구 합계 일치 | `calc.js` `buildInternalReport`, `buildMemberMessage`, `index.html` `renderNotices` | TC-27, TC-28, S-51 | 통과 |
| 지점·상품·대여·할인·요일 배열의 빈 칸(연속 쉼표) 차단 | `calc.js` `validatePriceData` | TC-29 | 통과 |
| 가격 데이터 `registrationDiscounts` 검증 (`E-DATA-PRICE-SCHEMA`) | `calc.js` `validatePriceData` | TC-29 | 통과 |
| 계산 입력 `registrationDiscount` 검증 (`E-REGISTRATION`) | `calc.js` `validateInput` | TC-29 | 통과 |
| 안내 코드 `N-REGISTRATION-DISCOUNT` | `index.html` `renderNotices` | S-45 | 통과 |

같은 날 S-01~S-41의 상품 ID·금액을 샘플 데이터에서 실제 가격표(반포점 `l30-1v1-weekday` 등)로 맞췄다. S-32는 TC-01~TC-29를 확인한다.
