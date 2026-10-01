/* ============================================================
   테니스판타지 가격 데이터 — 가격표 원문 전사본

   출처
     반포점 : Notion "테니스판타지(반포)_가격표"
              (반포점 공지 > 테판 공지들) — 이미지 게시물
              https://app.notion.com/p/5c9245aef7164d8b9da1d1b23d8e4290
     방배점 : 프로젝트 폴더의 "방배점 가격표.jpg"
              (TENNIS FANTASY PRICE LIST(방배점), 2026-10-01 반영)
              이전 기준이던 Notion "테니스판타지_방배 가격표"(2024.3.16 update)를 대체한다.

   운영자 확인 (2026-08-30)
     - 반포점 원문 이미지에서 금액과 "회당" 표기가 어긋나는 칸이 2곳 있는데,
       **금액이 맞고 회당 표기가 오기**임을 확인했다. 이 파일은 금액을 따른다.
       해당 칸은 각 상품 주석에 표시해 두었다.
     - 쿠폰레슨, 코트 대여, 볼머신 대여는 월 정액이 아니므로
       이 계산기에서 제외하기로 확정했다.

   방배점 개정 (2026-10-01)
     - 정규레슨이 "평일&주말" 단일 요금으로 통합되었다. 평일/주말/혼합 구분이 없어졌으므로
       상품은 1:1, 2:1(1인) 두 개이고 전 요일을 선택할 수 있다.
     - "2개월 등록 5% / 3개월 등록 10% 할인"은 registrationDiscounts 로 옮겼다.
       가격표 금액은 1개월 등록 기준이다.
     - 쿠폰레슨(1·5·10·20·30회권)은 월 정액이 아니므로 기존 결정대로 제외한다.
     - 새 가격표의 금액과 "회당" 표기는 모든 칸에서 일치한다.

   ⚠ 남은 주의사항
     - 반포점 "평일+주말 혼합" 상품은 요일 구성을 계산기가 강제하지 못한다.
       allowedWeekdays 를 전 요일로 두었으니 담당자가 요일을 직접 맞춰야 한다.
     - 방배점 가격표 이미지에는 시행일이 적혀 있지 않다. effectiveFrom 은
       가격표를 반영한 날짜(2026-10-01)로 두었으니 실제 시행일이 다르면 고쳐야 한다.

   모든 금액은 VAT 포함, 1:2·2:1 상품은 1인 기준이다.
   ============================================================ */

const PRICE_DATA = {
  schemaVersion: 2,
  currency: "KRW",
  source: "테니스판타지 가격표 (반포점 Notion 공지 · 방배점 가격표 이미지)",
  updatedAt: "2026-10-01",

  /* 월 정액 부가 항목.
     수업 횟수와 무관하게 그 달에 이용하면 정액으로 붙는다.
     공휴일·휴강으로 수업이 줄어도 깎지 않는다. */
  rentals: [
    { id: "locker", label: "라커 대여", monthlyFee: 10000 },
    { id: "racket", label: "라켓 대여", monthlyFee: 10000 }
  ],

  branches: [
    {
      id: "banpo",
      name: "반포점",
      sourceTitle: "테니스판타지(반포)_가격표",
      // Notion 최종 수정일 기준. 가격표에 시행일이 따로 적혀 있지 않다.
      effectiveFrom: "2026-07-06",
      products: [
        // ---------- 20분 레슨 (평일 오전 ~ 14시) ----------
        {
          id: "l20-1v1-weekday",
          label: "20분 · 1:1 · 평일(오전~14시)",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "20분" },
            { key: "lessonType", label: "레슨 유형", value: "1:1" },
            { key: "schedule", label: "수업 구분", value: "평일 오전~14시" }
          ],
          allowedWeekdays: [1, 2, 3, 4, 5],
          monthlyFees: { "1": 160000, "2": 300000, "3": 420000 }
        },
        {
          id: "l20-1v2-weekday",
          label: "20분 · 1:2 · 평일(오전~14시) · 1인",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "20분" },
            { key: "lessonType", label: "레슨 유형", value: "1:2 (1인 기준)" },
            { key: "schedule", label: "수업 구분", value: "평일 오전~14시" }
          ],
          allowedWeekdays: [1, 2, 3, 4, 5],
          // 주3회: 원문 회당 표기는 2.85만원이지만 금액 31.8만원이 맞다(운영자 확인).
          //        318,000 ÷ 12 = 26,500원(2.65만)이 정확한 회당 금액이다.
          monthlyFees: { "1": 120000, "2": 220000, "3": 318000 }
        },

        // ---------- 30분 레슨 · 평일 ----------
        {
          id: "l30-1v1-weekday",
          label: "30분 · 1:1 · 평일",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:1" },
            { key: "schedule", label: "수업 구분", value: "평일" }
          ],
          allowedWeekdays: [1, 2, 3, 4, 5],
          monthlyFees: { "1": 240000, "2": 440000, "3": 600000 }
        },
        {
          id: "l30-1v2-weekday",
          label: "30분 · 1:2 · 평일 · 1인",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:2 (1인 기준)" },
            { key: "schedule", label: "수업 구분", value: "평일" }
          ],
          allowedWeekdays: [1, 2, 3, 4, 5],
          monthlyFees: { "1": 180000, "2": 300000, "3": 380000 }
        },

        // ---------- 30분 레슨 · 주말 ----------
        {
          id: "l30-1v1-weekend",
          label: "30분 · 1:1 · 주말",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:1" },
            { key: "schedule", label: "수업 구분", value: "주말" }
          ],
          allowedWeekdays: [0, 6],
          monthlyFees: { "1": 260000, "2": 480000 }
        },
        {
          id: "l30-1v2-weekend",
          label: "30분 · 1:2 · 주말 · 1인",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:2 (1인 기준)" },
            { key: "schedule", label: "수업 구분", value: "주말" }
          ],
          allowedWeekdays: [0, 6],
          monthlyFees: { "1": 200000, "2": 320000 }
        },

        // ---------- 30분 레슨 · 평일+주말 혼합 ----------
        // ⚠ 요일 구성(평일 N회 + 주말 M회)은 계산기가 강제하지 못한다.
        {
          id: "l30-1v1-mix-wd1-we1",
          label: "30분 · 1:1 · 평일1회+주말1회 (주 2회)",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:1" },
            { key: "schedule", label: "수업 구분", value: "평일 1회 + 주말 1회" }
          ],
          monthlyFees: { "2": 460000 }
        },
        {
          id: "l30-1v2-mix-wd1-we1",
          label: "30분 · 1:2 · 평일1회+주말1회 (주 2회) · 1인",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:2 (1인 기준)" },
            { key: "schedule", label: "수업 구분", value: "평일 1회 + 주말 1회" }
          ],
          monthlyFees: { "2": 320000 }
        },
        {
          id: "l30-1v1-mix-wd2-we1",
          label: "30분 · 1:1 · 평일2회+주말1회 (주 3회)",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:1" },
            { key: "schedule", label: "수업 구분", value: "평일 2회 + 주말 1회" }
          ],
          // 원문 회당 표기는 5.7만원이지만 금액 66만원이 맞다(운영자 확인).
          //        660,000 ÷ 12 = 55,000원(5.5만)이 정확한 회당 금액이다.
          monthlyFees: { "3": 660000 }
        },
        {
          id: "l30-1v2-mix-wd2-we1",
          label: "30분 · 1:2 · 평일2회+주말1회 (주 3회) · 1인",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:2 (1인 기준)" },
            { key: "schedule", label: "수업 구분", value: "평일 2회 + 주말 1회" }
          ],
          monthlyFees: { "3": 460000 }
        },
        {
          id: "l30-1v1-mix-wd1-we2",
          label: "30분 · 1:1 · 평일1회+주말2회 (주 3회)",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:1" },
            { key: "schedule", label: "수업 구분", value: "평일 1회 + 주말 2회" }
          ],
          monthlyFees: { "3": 700000 }
        },
        {
          id: "l30-1v2-mix-wd1-we2",
          label: "30분 · 1:2 · 평일1회+주말2회 (주 3회) · 1인",
          pricingModel: "monthly4week",
          attributes: [
            { key: "duration", label: "수업 시간", value: "30분" },
            { key: "lessonType", label: "레슨 유형", value: "1:2 (1인 기준)" },
            { key: "schedule", label: "수업 구분", value: "평일 1회 + 주말 2회" }
          ],
          monthlyFees: { "3": 480000 }
        }
      ]
    },

    {
      id: "bangbae",
      name: "방배점",
      sourceTitle: "TENNIS FANTASY PRICE LIST(방배점) — 방배점 가격표.jpg",
      // 가격표 이미지에 시행일이 적혀 있지 않아 반영일을 적었다.
      effectiveFrom: "2026-10-01",
      /* 정규레슨 다개월 등록 할인. 가격표 금액은 1개월 등록 기준이고,
         선택한 등록 기간의 할인율을 월 기준 요금에 적용한다. */
      registrationDiscounts: [
        { months: 2, percent: 5 },
        { months: 3, percent: 10 }
      ],
      products: [
        // ---------- 정규레슨 평일&주말 (요일·시간 고정제) ----------
        {
          id: "1v1-regular",
          label: "정규레슨 1:1 · 평일&주말",
          pricingModel: "monthly4week",
          attributes: [
            { key: "lessonType", label: "레슨 유형", value: "1:1" },
            { key: "schedule", label: "수업 구분", value: "평일&주말" }
          ],
          // 회당 4.5만 / 4.0만 / 3.75만
          monthlyFees: { "1": 180000, "2": 320000, "3": 450000 }
        },
        {
          id: "2v1-regular",
          label: "정규레슨 2:1 · 평일&주말 · 1인",
          pricingModel: "monthly4week",
          attributes: [
            { key: "lessonType", label: "레슨 유형", value: "2:1 (1인 기준)" },
            { key: "schedule", label: "수업 구분", value: "평일&주말" }
          ],
          // 회당 3.5만 / 3.0만 / 2.75만
          monthlyFees: { "1": 140000, "2": 240000, "3": 330000 }
        }
      ]
    }
  ]
};
