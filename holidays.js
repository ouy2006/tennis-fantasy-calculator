/* ============================================================
   ⚠ 이 공휴일 데이터는 아직 사람이 검수하지 않았습니다.
   특히 kind: "regular" 항목의 누락은 금액을 조용히 틀리게 만듭니다.
   운영 전에 정부 관보 기준으로 전수 대조하십시오.
   ============================================================ */

const HOLIDAY_DATA = {
  schemaVersion: 1,
  timezone: "Asia/Seoul",
  years: {
    "2026": [
      { date: "2026-01-01", name: "신정", kind: "regular" },
      { date: "2026-02-16", name: "설날 연휴", kind: "regular" },
      { date: "2026-02-17", name: "설날", kind: "regular" },
      { date: "2026-02-18", name: "설날 연휴", kind: "regular" },
      { date: "2026-03-01", name: "삼일절", kind: "regular" },
      { date: "2026-03-02", name: "삼일절 대체공휴일", kind: "substitute" },
      { date: "2026-05-05", name: "어린이날", kind: "regular" },
      { date: "2026-05-24", name: "부처님오신날", kind: "regular" },
      { date: "2026-05-25", name: "부처님오신날 대체공휴일", kind: "substitute" },
      { date: "2026-06-06", name: "현충일", kind: "regular" },
      { date: "2026-08-15", name: "광복절", kind: "regular" },
      { date: "2026-08-17", name: "광복절 대체공휴일", kind: "substitute" },
      { date: "2026-09-24", name: "추석 연휴", kind: "regular" },
      { date: "2026-09-25", name: "추석", kind: "regular" },
      { date: "2026-09-26", name: "추석 연휴", kind: "regular" },
      { date: "2026-10-03", name: "개천절", kind: "regular" },
      { date: "2026-10-05", name: "개천절 대체공휴일", kind: "substitute" },
      { date: "2026-10-09", name: "한글날", kind: "regular" },
      { date: "2026-12-25", name: "기독탄신일", kind: "regular" }
    ],
    "2027": [
      { date: "2027-01-01", name: "신정", kind: "regular" },
      { date: "2027-02-06", name: "설날 연휴", kind: "regular" },
      { date: "2027-02-07", name: "설날", kind: "regular" },
      { date: "2027-02-08", name: "설날 연휴", kind: "regular" },
      { date: "2027-03-01", name: "삼일절", kind: "regular" },
      { date: "2027-05-05", name: "어린이날", kind: "regular" },
      { date: "2027-05-13", name: "부처님오신날", kind: "regular" },
      { date: "2027-06-06", name: "현충일", kind: "regular" },
      { date: "2027-08-15", name: "광복절", kind: "regular" },
      { date: "2027-09-14", name: "추석 연휴", kind: "regular" },
      { date: "2027-09-15", name: "추석", kind: "regular" },
      { date: "2027-09-16", name: "추석 연휴", kind: "regular" },
      { date: "2027-10-03", name: "개천절", kind: "regular" },
      { date: "2027-10-09", name: "한글날", kind: "regular" },
      { date: "2027-12-25", name: "기독탄신일", kind: "regular" }
    ]
  }
};
