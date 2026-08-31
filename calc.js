(function (root) {
  "use strict";

  var WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  var PRICE_MODELS = ["monthly4week", "perSession", "flatMonthly"];
  var HOLIDAY_KINDS = ["regular", "substitute", "temporary"];

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function parseDateKey(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1) return null;
    var lastDay = new Date(year, month, 0).getDate();
    if (day > lastDay) return null;
    return { year: year, month: month, day: day };
  }

  function parseMonthKey(value) {
    var match = /^(\d{4})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return { year: year, month: month };
  }

  function dateKey(year, month, day) {
    return String(year).padStart(4, "0") + "-" + pad2(month) + "-" + pad2(day);
  }

  function localWeekday(value) {
    var parts;
    if (typeof value === "string") {
      parts = parseDateKey(value);
    } else if (isPlainObject(value)) {
      parts = value;
    } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
      parts = {
        year: value.getFullYear(),
        month: value.getMonth() + 1,
        day: value.getDate()
      };
    }
    if (!parts) return NaN;
    return new Date(parts.year, parts.month - 1, parts.day).getDay();
  }

  function monthRange(targetMonth) {
    var parts = parseMonthKey(targetMonth);
    if (!parts) return null;
    var lastDay = new Date(parts.year, parts.month, 0).getDate();
    return {
      year: parts.year,
      month: parts.month,
      daysInMonth: lastDay,
      start: dateKey(parts.year, parts.month, 1),
      end: dateKey(parts.year, parts.month, lastDay)
    };
  }

  function formatDate(value) {
    var parts = parseDateKey(value);
    if (!parts) return String(value || "");
    return dateKey(parts.year, parts.month, parts.day) + "(" + WEEKDAY_NAMES[localWeekday(parts)] + ")";
  }

  function formatDateShort(value) {
    var parts = parseDateKey(value);
    if (!parts) return String(value || "");
    return parts.month + "/" + parts.day + "(" + WEEKDAY_NAMES[localWeekday(parts)] + ")";
  }

  function formatMoney(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return "-";
    var sign = number < 0 ? "-" : "";
    var digits = String(Math.abs(Math.trunc(number)));
    return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
  }

  function formatDateList(values, mode) {
    var list = Array.isArray(values) ? values : [];
    if (!list.length) return "없음";
    var formatter = mode === "member" || mode === "short" ? formatDateShort : formatDate;
    var formatted = list.map(function (value) {
      return formatter(typeof value === "string" ? value : value.date);
    });
    if (mode === "member" || mode === "short") return formatted.join(", ");
    var lines = [];
    for (var i = 0; i < formatted.length; i += 4) {
      lines.push((i === 0 ? "" : "  ") + formatted.slice(i, i + 4).join(", "));
    }
    return lines.join(",\n");
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values)).sort();
  }

  function error(code, message) {
    return { code: code, message: message };
  }

  function validationResult(errors) {
    return { ok: errors.length === 0, errors: errors };
  }

  function validatePriceData(data) {
    var errors = [];
    var prefix = "가격표 형식이 올바르지 않습니다: ";
    function add(detail) {
      errors.push(error("E-DATA-PRICE-SCHEMA", prefix + detail));
    }

    if (!isPlainObject(data)) return validationResult([error("E-DATA-PRICE-SCHEMA", prefix + "PRICE_DATA가 객체가 아닙니다.")]);
    if (data.schemaVersion !== 2) add("schemaVersion은 2여야 합니다.");
    if (data.currency !== "KRW") add("currency는 KRW여야 합니다.");
    if (typeof data.source !== "string" || !data.source.trim()) add("source가 비어 있습니다.");
    if (!parseDateKey(data.updatedAt)) add("updatedAt이 유효한 YYYY-MM-DD 날짜가 아닙니다.");
    if (data.rentals !== undefined) {
      if (!Array.isArray(data.rentals)) {
        add("rentals가 배열이 아닙니다.");
      } else {
        var rentalIds = new Set();
        data.rentals.forEach(function (rental, i) {
          var rpath = "rentals[" + i + "]";
          if (!isPlainObject(rental)) { add(rpath + "가 객체가 아닙니다."); return; }
          if (typeof rental.id !== "string" || !rental.id.trim()) add(rpath + ".id가 비어 있습니다.");
          if (rentalIds.has(rental.id)) add("대여 항목 ID " + rental.id + "가 중복되었습니다.");
          rentalIds.add(rental.id);
          if (typeof rental.label !== "string" || !rental.label.trim()) add(rpath + ".label이 비어 있습니다.");
          if (!Number.isInteger(rental.monthlyFee) || rental.monthlyFee <= 0) add(rpath + ".monthlyFee는 0보다 큰 정수여야 합니다.");
        });
      }
    }

    if (!Array.isArray(data.branches)) {
      add("branches가 배열이 아닙니다.");
      return validationResult(errors);
    }

    var branchIds = new Set();
    data.branches.forEach(function (branch, branchIndex) {
      var path = "branches[" + branchIndex + "]";
      if (!isPlainObject(branch)) {
        add(path + "가 객체가 아닙니다.");
        return;
      }
      if (typeof branch.id !== "string" || !branch.id.trim()) add(path + ".id가 비어 있습니다.");
      if (branchIds.has(branch.id)) add("지점 ID " + branch.id + "가 중복되었습니다.");
      branchIds.add(branch.id);
      if (typeof branch.name !== "string" || !branch.name.trim()) add(path + ".name이 비어 있습니다.");
      if (typeof branch.sourceTitle !== "string" || !branch.sourceTitle.trim()) add(path + ".sourceTitle이 비어 있습니다.");
      if (!parseDateKey(branch.effectiveFrom)) add(path + ".effectiveFrom이 유효한 날짜가 아닙니다.");
      if (!Array.isArray(branch.products) || branch.products.length === 0) {
        add(path + ".products에는 상품이 한 개 이상 있어야 합니다.");
        return;
      }
      var productIds = new Set();
      branch.products.forEach(function (product, productIndex) {
        var productPath = path + ".products[" + productIndex + "]";
        if (!isPlainObject(product)) {
          add(productPath + "가 객체가 아닙니다.");
          return;
        }
        if (typeof product.id !== "string" || !product.id.trim()) add(productPath + ".id가 비어 있습니다.");
        if (productIds.has(product.id)) add("지점 " + branch.id + "의 상품 ID " + product.id + "가 중복되었습니다.");
        productIds.add(product.id);
        if (typeof product.label !== "string" || !product.label.trim()) add(productPath + ".label이 비어 있습니다.");
        var model = product.pricingModel || "monthly4week";
        if (PRICE_MODELS.indexOf(model) === -1) add(productPath + ".pricingModel이 지원되지 않습니다.");
        if (product.allowedWeekdays !== undefined) {
          if (!Array.isArray(product.allowedWeekdays)) {
            add(productPath + ".allowedWeekdays가 배열이 아닙니다.");
          } else {
            var weekdaySet = new Set(product.allowedWeekdays);
            if (weekdaySet.size !== product.allowedWeekdays.length || product.allowedWeekdays.some(function (day) {
              return !Number.isInteger(day) || day < 0 || day > 6;
            })) add(productPath + ".allowedWeekdays는 중복 없는 0~6 정수 배열이어야 합니다.");
          }
        }
        if (!isPlainObject(product.monthlyFees)) {
          add(productPath + ".monthlyFees가 객체가 아닙니다.");
        } else {
          var feeKeys = Object.keys(product.monthlyFees);
          if (!feeKeys.length) add(productPath + ".monthlyFees가 비어 있습니다.");
          feeKeys.forEach(function (key) {
            if (["1", "2", "3"].indexOf(key) === -1) add(productPath + ".monthlyFees의 키 " + key + "는 지원되지 않습니다.");
            var fee = product.monthlyFees[key];
            if (!Number.isInteger(fee) || fee <= 0) add(productPath + ".monthlyFees[" + key + "]는 0보다 큰 정수여야 합니다.");
          });
        }
      });
    });
    ["banpo", "bangbae"].forEach(function (requiredId) {
      if (!branchIds.has(requiredId)) add(requiredId + " 지점이 없습니다.");
    });
    return validationResult(errors);
  }

  function validateHolidayData(data) {
    var errors = [];
    var prefix = "공휴일 데이터 형식이 올바르지 않습니다: ";
    function add(detail) {
      errors.push(error("E-DATA-HOLIDAY-SCHEMA", prefix + detail));
    }

    if (!isPlainObject(data)) return validationResult([error("E-DATA-HOLIDAY-SCHEMA", prefix + "HOLIDAY_DATA가 객체가 아닙니다.")]);
    if (data.schemaVersion !== 1) add("schemaVersion은 1이어야 합니다.");
    if (data.timezone !== "Asia/Seoul") add("timezone은 Asia/Seoul이어야 합니다.");
    if (!isPlainObject(data.years)) {
      add("years가 객체가 아닙니다.");
      return validationResult(errors);
    }
    var yearKeys = Object.keys(data.years);
    if (yearKeys.length < 2) add("최소 현재 연도와 다음 연도 데이터가 필요합니다.");
    var seoulNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    var currentYear = String(seoulNow.getUTCFullYear());
    var nextYear = String(seoulNow.getUTCFullYear() + 1);
    if (!Object.prototype.hasOwnProperty.call(data.years, currentYear)) add("현재 연도 " + currentYear + "년 데이터가 없습니다.");
    if (!Object.prototype.hasOwnProperty.call(data.years, nextYear)) add("다음 연도 " + nextYear + "년 데이터가 없습니다.");
    yearKeys.forEach(function (year) {
      var records = data.years[year];
      if (!/^\d{4}$/.test(year) || !Array.isArray(records)) {
        add("years[" + year + "]는 4자리 연도 키의 배열이어야 합니다.");
        return;
      }
      var dates = new Set();
      var recurringSundayCount = 0;
      records.forEach(function (record, index) {
        var path = "years[" + year + "][" + index + "]";
        if (!isPlainObject(record)) {
          add(path + "가 객체가 아닙니다.");
          return;
        }
        var parts = parseDateKey(record.date);
        if (!parts) add(path + ".date가 유효한 YYYY-MM-DD 날짜가 아닙니다.");
        else if (String(parts.year) !== year) add(path + ".date의 연도와 year 키가 다릅니다.");
        if (dates.has(record.date)) add(year + "년 " + record.date + " 날짜가 중복되었습니다.");
        dates.add(record.date);
        if (typeof record.name !== "string" || !record.name.trim()) add(path + ".name이 비어 있습니다.");
        if (HOLIDAY_KINDS.indexOf(record.kind) === -1) add(path + ".kind가 지원되지 않습니다.");
        if (parts && localWeekday(parts) === 0 && /^(정기\s*)?일요일$/.test(String(record.name || "").trim())) recurringSundayCount += 1;
      });
      if (recurringSundayCount > 1) add(year + "년에 반복 일요일 레코드가 등록되어 있습니다.");
    });
    return validationResult(errors);
  }

  function validateInput(input) {
    var errors = [];
    if (!isPlainObject(input)) return validationResult([error("E-MONTH", "계산할 달을 선택해 주세요.")]);
    var period = monthRange(input.targetMonth);
    if (!period) errors.push(error("E-MONTH", "계산할 달을 선택해 주세요."));
    if (typeof input.branchId !== "string" || !input.branchId) errors.push(error("E-BRANCH", "지점을 선택해 주세요."));
    if (typeof input.productId !== "string" || !input.productId) errors.push(error("E-PRODUCT", "가격 상품을 선택해 주세요."));
    if (![1, 2, 3].includes(input.weeklyFrequency)) errors.push(error("E-FREQUENCY", "주당 수업 횟수를 선택해 주세요."));

    var selected = Array.isArray(input.selectedWeekdays) ? input.selectedWeekdays : [];
    var weekdaysValid = selected.every(function (day) { return Number.isInteger(day) && day >= 0 && day <= 6; });
    if (!weekdaysValid || new Set(selected).size !== selected.length || (input.weeklyFrequency && selected.length !== input.weeklyFrequency)) {
      var count = [1, 2, 3].includes(input.weeklyFrequency) ? input.weeklyFrequency : "N";
      errors.push(error("E-WEEKDAYS", "주 " + count + "회 수업은 요일 " + count + "개를 선택해야 합니다."));
    }
    if (PRICE_MODELS.indexOf(input.pricingModel || "monthly4week") === -1) errors.push(error("E-PRICE-MISSING", "선택한 조건의 가격 정보가 없습니다."));
    if (!Number.isInteger(input.baseMonthlyFee) || input.baseMonthlyFee <= 0) errors.push(error("E-PRICE-MISSING", "선택한 조건의 가격 정보가 없습니다."));
    if (!Number.isInteger(input.appliedMonthlyFee) || input.appliedMonthlyFee <= 0) errors.push(error("E-PRICE-VALUE", "적용 월 기준 요금은 0보다 큰 정수여야 합니다."));
    if (input.finalFeeOverride !== null && input.finalFeeOverride !== undefined && (!Number.isInteger(input.finalFeeOverride) || input.finalFeeOverride < 0)) {
      errors.push(error("E-FINAL-FEE", "최종 결제액은 0 이상의 정수여야 합니다."));
    }

    var excluded = Array.isArray(input.manualExcludedDates) ? input.manualExcludedDates : [];
    var included = Array.isArray(input.manualIncludedDates) ? input.manualIncludedDates : [];
    var seen = new Set();
    excluded.concat(included).forEach(function (value) {
      var parts = parseDateKey(value);
      if (!parts || (period && (value < period.start || value > period.end))) {
        errors.push(error("E-ADJUST-RANGE", "추가 제외일·포함일은 계산 대상 월 안에서 선택해 주세요."));
      }
      if (seen.has(value)) errors.push(error("E-ADJUST-DUP", value + "은 이미 등록되어 있습니다."));
      seen.add(value);
    });
    return validationResult(errors);
  }

  function warning(code, message, dates) {
    return { code: code, message: message, dates: dates || [] };
  }

  function calculate(input, holidayRecords) {
    var validation = validateInput(input);
    if (!validation.ok) {
      var invalidError = new Error(validation.errors[0].message);
      invalidError.code = validation.errors[0].code;
      invalidError.errors = validation.errors;
      throw invalidError;
    }

    var period = monthRange(input.targetMonth);
    var records = Array.isArray(holidayRecords) ? holidayRecords.slice() : [];
    var holidayByDate = Object.create(null);
    records.forEach(function (record) {
      if (holidayByDate[record.date]) {
        var duplicateError = new Error("공휴일 데이터 형식이 올바르지 않습니다: " + record.date + " 날짜가 중복되었습니다.");
        duplicateError.code = "E-DATA-HOLIDAY-SCHEMA";
        throw duplicateError;
      }
      holidayByDate[record.date] = record;
    });

    var selectedSet = new Set(input.selectedWeekdays);
    var scheduledDates = [];
    for (var day = 1; day <= period.daysInMonth; day += 1) {
      var key = dateKey(period.year, period.month, day);
      if (selectedSet.has(localWeekday({ year: period.year, month: period.month, day: day }))) scheduledDates.push(key);
    }

    var scheduledSet = new Set(scheduledDates);
    var manualExcludeSet = new Set(input.manualExcludedDates || []);
    var manualIncludeSet = new Set(input.manualIncludedDates || []);
    var regularHolidayExclusions = scheduledDates.filter(function (key) {
      return holidayByDate[key] && holidayByDate[key].kind === "regular" && !manualIncludeSet.has(key);
    });
    var manualExclusions = scheduledDates.filter(function (key) { return manualExcludeSet.has(key); });
    var excludedDates = uniqueSorted(regularHolidayExclusions.concat(manualExclusions));
    var excludedSet = new Set(excludedDates);
    var keptDates = scheduledDates.filter(function (key) { return !excludedSet.has(key); });
    var manualInclusionsRestored = uniqueSorted(Array.from(manualIncludeSet).filter(function (key) {
      return scheduledSet.has(key) && holidayByDate[key] && holidayByDate[key].kind === "regular";
    }));
    var manualInclusionsMakeup = uniqueSorted(Array.from(manualIncludeSet).filter(function (key) {
      return !scheduledSet.has(key) && !manualExcludeSet.has(key);
    }));
    var manualInclusionsNoop = uniqueSorted(Array.from(manualIncludeSet).filter(function (key) {
      return scheduledSet.has(key) && !(holidayByDate[key] && holidayByDate[key].kind === "regular") && !manualExcludeSet.has(key);
    }));
    var manualExclusionsNoop = uniqueSorted(Array.from(manualExcludeSet).filter(function (key) {
      return !scheduledSet.has(key);
    }));
    var validSessionDates = uniqueSorted(keptDates.concat(manualInclusionsMakeup));
    var includedSpecialHolidays = validSessionDates.filter(function (key) {
      return holidayByDate[key] && ["substitute", "temporary"].includes(holidayByDate[key].kind);
    });

    var validSessionCount = validSessionDates.length;
    var baseSessionCount = input.weeklyFrequency * 4;
    var model = input.pricingModel || "monthly4week";
    var unitFee = model === "perSession" ? input.appliedMonthlyFee : Math.floor(input.appliedMonthlyFee / baseSessionCount);
    var computedFeeRaw;
    var usedBaseFeeDirectly = false;
    if (validSessionCount === 0) {
      computedFeeRaw = 0;
    } else if (model === "flatMonthly") {
      computedFeeRaw = input.appliedMonthlyFee;
      usedBaseFeeDirectly = true;
    } else if (model === "monthly4week" && validSessionCount === baseSessionCount) {
      computedFeeRaw = input.appliedMonthlyFee;
      usedBaseFeeDirectly = true;
    } else {
      computedFeeRaw = unitFee * validSessionCount;
    }
    var computedFee = usedBaseFeeDirectly ? computedFeeRaw : Math.floor(computedFeeRaw / 100) * 100;
    var roundingDelta = computedFeeRaw - computedFee;

    /* 월 정액 대여비. 수업 횟수와 무관하므로 100원 절사 뒤에 더한다.
       유효 수업이 0회여도 그 달에 빌렸다면 부과된다. */
    var rentals = Array.isArray(input.rentals) ? input.rentals.slice() : [];
    var rentalTotal = rentals.reduce(function (sum, r) { return sum + r.monthlyFee; }, 0);
    var subtotal = computedFee + rentalTotal;
    var finalFee = input.finalFeeOverride ?? subtotal;
    var overBaseCount = validSessionCount - baseSessionCount;
    var warnings = [];

    if (regularHolidayExclusions.length) warnings.push(warning("N-REGULAR-HOLIDAY", "일반 공휴일 수업 " + regularHolidayExclusions.length + "회가 제외되었습니다.", regularHolidayExclusions));
    if (includedSpecialHolidays.length) warnings.push(warning("N-SPECIAL-HOLIDAY", "대체·임시공휴일 " + includedSpecialHolidays.length + "회가 정상 수업에 포함됩니다.", includedSpecialHolidays));
    if (manualExclusions.length) warnings.push(warning("N-MANUAL-EXCLUSION", "추가 제외일이 적용되었습니다.", manualExclusions));
    if (manualInclusionsRestored.length || manualInclusionsMakeup.length) warnings.push(warning("N-MANUAL-INCLUSION", "추가 포함일이 적용되었습니다.", manualInclusionsRestored.concat(manualInclusionsMakeup)));
    if (manualExclusionsNoop.length) warnings.push(warning("N-EXCLUSION-NOOP", "정규 수업일이 아니어서 계산에 영향이 없는 날짜입니다.", manualExclusionsNoop));
    if (manualInclusionsNoop.length) warnings.push(warning("N-INCLUSION-NOOP", "이미 정상 수업일이어서 계산에 영향이 없습니다.", manualInclusionsNoop));
    if (overBaseCount > 0) warnings.push(warning("N-OVER-BASE", "기준 " + baseSessionCount + "회를 초과한 " + validSessionCount + "회입니다. (5주차 포함)"));
    else if (overBaseCount < 0) warnings.push(warning("N-UNDER-BASE", "기준 " + baseSessionCount + "회보다 " + Math.abs(overBaseCount) + "회 적습니다."));
    else warnings.push(warning("N-BASE-MATCH", "기준 " + baseSessionCount + "회를 전부 수강해 월 기준 요금을 그대로 적용합니다."));
    if (rentalTotal > 0) warnings.push(warning("N-RENTAL", "월 정액 대여비 " + formatMoney(rentalTotal) + "이 더해집니다. (" + rentals.map(function (r) { return r.label; }).join(", ") + ")"));
    if (roundingDelta > 0) warnings.push(warning("N-ROUNDED", formatMoney(computedFeeRaw) + " → " + formatMoney(computedFee) + " (100원 절사, -" + formatMoney(roundingDelta) + ")"));
    if (input.noHolidayData === true) warnings.push(warning("N-NO-HOLIDAY-DATA", "※ " + period.year + "년 공휴일 데이터 없이 계산한 결과입니다."));

    return {
      periodStart: period.start,
      periodEnd: period.end,
      baseSessionCount: baseSessionCount,
      unitFee: unitFee,
      scheduledDates: scheduledDates,
      regularHolidayExclusions: regularHolidayExclusions,
      manualExclusions: manualExclusions,
      manualInclusionsRestored: manualInclusionsRestored,
      manualInclusionsMakeup: manualInclusionsMakeup,
      manualInclusionsNoop: manualInclusionsNoop,
      manualExclusionsNoop: manualExclusionsNoop,
      includedSpecialHolidays: includedSpecialHolidays,
      excludedDates: excludedDates,
      validSessionDates: validSessionDates,
      validSessionCount: validSessionCount,
      overBaseCount: overBaseCount,
      computedFeeRaw: computedFeeRaw,
      computedFee: computedFee,
      roundingDelta: roundingDelta,
      usedBaseFeeDirectly: usedBaseFeeDirectly,
      rentals: rentals,
      rentalTotal: rentalTotal,
      subtotal: subtotal,
      finalFee: finalFee,
      warnings: warnings,
      holidayByDate: holidayByDate
    };
  }

  function monthLabel(targetMonth) {
    var parts = parseMonthKey(targetMonth);
    return parts ? parts.year + "년 " + parts.month + "월" : targetMonth;
  }

  function weekdayLabel(days) {
    return (days || []).slice().sort(function (a, b) { return a - b; }).map(function (day) { return WEEKDAY_NAMES[day]; }).join("·");
  }

  function signedMoney(value) {
    if (value === 0) return "0원";
    return (value > 0 ? "+" : "-") + formatMoney(Math.abs(value));
  }

  function holidayDetailList(dates, result, mode, includeKind) {
    if (!dates.length) return "없음";
    var kindNames = { regular: "일반", substitute: "대체", temporary: "임시" };
    var values = dates.map(function (key) {
      var holiday = result.holidayByDate[key];
      var base = (mode === "member" ? formatDateShort(key) : formatDate(key));
      if (!holiday) return base;
      return base + " · " + (includeKind ? kindNames[holiday.kind] + " · " : "") + holiday.name;
    });
    if (mode === "member") return values.join(", ");
    var lines = [];
    for (var i = 0; i < values.length; i += 4) lines.push((i === 0 ? "" : "  ") + values.slice(i, i + 4).join(", "));
    return lines.join(",\n");
  }

  function calculationFormula(input, result) {
    if (result.validSessionCount === 0) return "유효 수업 0회 = 0원";
    if (result.usedBaseFeeDirectly) {
      if ((input.pricingModel || "monthly4week") === "flatMonthly") return "고정 월정액 " + formatMoney(input.appliedMonthlyFee) + " = " + formatMoney(result.computedFee);
      return "적용 월 기준 요금 " + formatMoney(input.appliedMonthlyFee) + " (기준 " + result.baseSessionCount + "회 전부 수강) = " + formatMoney(result.computedFee);
    }
    return "회당 " + formatMoney(result.unitFee) + " × " + result.validSessionCount + "회 = " + formatMoney(result.computedFeeRaw);
  }

  function formatDetailedList(values) {
    if (!values.length) return "없음";
    var lines = [];
    for (var i = 0; i < values.length; i += 4) lines.push((i === 0 ? "" : "  ") + values.slice(i, i + 4).join(", "));
    return lines.join(",\n");
  }

  function buildInternalReport(input, result, meta) {
    meta = meta || {};
    var memberName = String(meta.memberName !== undefined ? meta.memberName : (input.memberName || "")).trim() || "미입력";
    var reason = String(meta.adjustmentReason !== undefined ? meta.adjustmentReason : (input.adjustmentReason || "")).trim();
    var branchName = meta.branchName || input.branchId;
    var productLabel = meta.productLabel || input.productId;
    var effectiveFrom = meta.effectiveFrom || "미확인";
    var lines = [
      "[테니스판타지 월 수강료 계산]",
      "",
      "회원: " + memberName,
      "대상 월: " + monthLabel(input.targetMonth),
      "지점: " + branchName,
      "가격 상품: " + productLabel,
      "가격표 시행일: " + effectiveFrom,
      "주당 횟수: 주 " + input.weeklyFrequency + "회",
      "수업 요일: " + weekdayLabel(input.selectedWeekdays),
      "",
      "가격표 월 기준 요금: " + formatMoney(input.baseMonthlyFee)
    ];
    if (input.appliedMonthlyFee !== input.baseMonthlyFee) lines.push("적용 월 기준 요금: " + formatMoney(input.appliedMonthlyFee) + " (" + signedMoney(input.appliedMonthlyFee - input.baseMonthlyFee) + ")");
    lines.push("기준 횟수: " + result.baseSessionCount + "회");
    lines.push("회당 금액: " + formatMoney(result.unitFee));
    lines.push("");
    lines.push("예정 수업: " + result.scheduledDates.length + "회");
    lines.push("- " + formatDateList(result.scheduledDates));
    lines.push("일반 공휴일 제외: " + result.regularHolidayExclusions.length + "회");
    lines.push("- " + holidayDetailList(result.regularHolidayExclusions, result));
    lines.push("추가 제외: " + result.manualExclusions.length + "회");
    lines.push("- " + formatDateList(result.manualExclusions));
    var inclusionDetails = result.manualInclusionsRestored.map(function (key) { return formatDate(key) + " · 공휴일 복구"; })
      .concat(result.manualInclusionsMakeup.map(function (key) { return formatDate(key) + " · 보강"; }));
    lines.push("추가 포함: " + inclusionDetails.length + "회");
    lines.push("- " + formatDetailedList(inclusionDetails));
    lines.push("대체·임시공휴일 정상 포함: " + result.includedSpecialHolidays.length + "회");
    lines.push("- " + holidayDetailList(result.includedSpecialHolidays, result, "internal", true));
    lines.push("유효 수업: " + result.validSessionCount + "회");
    lines.push("- " + formatDateList(result.validSessionDates));
    lines.push("");
    if (result.overBaseCount === 0) lines.push("기준 " + result.baseSessionCount + "회 전부 수강");
    else lines.push("기준 " + result.baseSessionCount + "회 대비 " + (result.overBaseCount > 0 ? "+" : "") + result.overBaseCount + "회");
    lines.push("계산 월 수강료: " + calculationFormula(input, result));
    if (result.roundingDelta > 0) lines.push("100원 절사: " + formatMoney(result.computedFeeRaw) + " → " + formatMoney(result.computedFee));
    if (result.rentalTotal > 0) {
      result.rentals.forEach(function (r) { lines.push("대여비 · " + r.label + ": " + formatMoney(r.monthlyFee)); });
      lines.push("수강료 " + formatMoney(result.computedFee) + " + 대여비 " + formatMoney(result.rentalTotal) + " = " + formatMoney(result.subtotal));
    }
    if (result.finalFee !== result.subtotal) lines.push("조정 최종 수강료: " + formatMoney(result.finalFee) + " (" + signedMoney(result.finalFee - result.subtotal) + ")");
    if (reason) lines.push("조정 사유: " + reason);
    lines.push("최종 월 수강료: " + formatMoney(result.finalFee));
    if (input.noHolidayData === true || meta.noHolidayData === true) lines.push("※ " + monthRange(input.targetMonth).year + "년 공휴일 데이터 없이 계산한 결과입니다.");
    return lines.join("\n");
  }

  function buildMemberMessage(input, result, meta) {
    meta = meta || {};
    var rawMemberName = String(meta.memberName !== undefined ? meta.memberName : (input.memberName || "")).trim();
    var memberPhrase = rawMemberName ? rawMemberName + "님의" : "회원님의";
    var branchName = meta.branchName || input.branchId;
    var productLabel = meta.productLabel || input.productId;
    var lines = [
      "안녕하세요, 테니스판타지입니다.",
      "",
      memberPhrase + " " + monthLabel(input.targetMonth) + " 수강료 안내드립니다.",
      "",
      "- 지점: " + branchName,
      "- 수업: " + productLabel + " / 주 " + input.weeklyFrequency + "회 (" + weekdayLabel(input.selectedWeekdays) + ")",
      "- 유효 수강 횟수: " + result.validSessionCount + "회"
    ];
    if (result.regularHolidayExclusions.length) lines.push("- 일반 공휴일 제외: " + result.regularHolidayExclusions.length + "회 (" + formatDateList(result.regularHolidayExclusions, "member") + ")");
    if (result.includedSpecialHolidays.length) lines.push("- 대체·임시공휴일 정상 수업 포함: " + result.includedSpecialHolidays.length + "회 (" + formatDateList(result.includedSpecialHolidays, "member") + ")");
    if (result.manualInclusionsMakeup.length) lines.push("- 보강 수업 포함: " + result.manualInclusionsMakeup.length + "회 (" + formatDateList(result.manualInclusionsMakeup, "member") + ")");
    if (result.overBaseCount > 0) lines.push("- 5주차가 포함되어 기준 " + result.baseSessionCount + "회보다 " + result.overBaseCount + "회 많습니다.");
    if (result.rentalTotal > 0) {
      lines.push("- 수강료: " + formatMoney(result.computedFee));
      result.rentals.forEach(function (r) { lines.push("- " + r.label + ": " + formatMoney(r.monthlyFee)); });
      lines.push("- 합계: " + formatMoney(result.finalFee));
    } else {
      lines.push("- 수강료: " + formatMoney(result.finalFee));
    }
    lines.push("");
    lines.push("감사합니다.");
    if (input.noHolidayData === true || meta.noHolidayData === true) lines.push("※ 공휴일 반영 전 안내입니다.");
    return lines.join("\n");
  }

  root.TFCalc = {
    validatePriceData: validatePriceData,
    validateHolidayData: validateHolidayData,
    validateInput: validateInput,
    calculate: calculate,
    buildInternalReport: buildInternalReport,
    buildMemberMessage: buildMemberMessage,
    monthRange: monthRange,
    localWeekday: localWeekday,
    formatDate: formatDate,
    formatDateShort: formatDateShort,
    formatMoney: formatMoney,
    formatDateList: formatDateList
  };
})(typeof window !== "undefined" ? window : globalThis);
