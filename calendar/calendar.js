// calendar.js
import { hexToRgba } from "../common/js/utils.js";
import { addPopup } from "./add_popup.js";

// 리사이즈 이벤트 최적화
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function calendar() {
  const el = document.querySelector("#calPage");
  if (!el) return console.warn("calPage not found");

  console.log("[calendar.js] Calendar initialized");

  const STORAGE_KEY = "calendar.schedules.v1";
  const COLOR_MAP = ["#FFB800", "#8C1BC1", "#1B8BC1", "#28A745", "#E91E63", "#FF5722"];
  const colorIndexMap = {};

  // 담당자별 고유 색상
  const getColorForStaff = (staff) => {
    if (!staff) return "#D9D9D9";
    if (!colorIndexMap[staff]) {
      const used = Object.keys(colorIndexMap).length;
      colorIndexMap[staff] = COLOR_MAP[used % COLOR_MAP.length];
    }
    return colorIndexMap[staff];
  };

  const normalizeDate = (d) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  };

  const formatDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  let today = new Date();

  // 오늘 날짜 & 요일 표시
  function updateTodayLabel(date = new Date()) {
    const todayLabel = el.querySelector(".today");
    const weekLabel = el.querySelector(".week");
    if (!todayLabel || !weekLabel) return;
    const weekNames = ["일", "월", "화", "수", "목", "금", "토"];
    todayLabel.textContent = `${String(date.getMonth() + 1).padStart(2, "0")}월 ${String(date.getDate()).padStart(2, "0")}일`;
    weekLabel.textContent = `${weekNames[date.getDay()]}요일`;
  }

  // === 달력 렌더링 ===
  function renderCalendar() {
    const year = today.getFullYear();
    const month = today.getMonth();
    const yearEl = el.querySelector(".year_now");
    const monthEl = el.querySelector(".month_now");
    const datesEl = el.querySelector(".dates");
    if (!yearEl || !monthEl || !datesEl) return;

    yearEl.textContent = year;
    monthEl.textContent = `${month + 1}월`;

    const prevLast = new Date(year, month, 0);
    const thisLast = new Date(year, month + 1, 0);
    const prevDates = [];
    const thisDates = Array.from({ length: thisLast.getDate() }, (_, i) => i + 1);
    const nextDates = [];

    if (prevLast.getDay() !== 6) {
      for (let i = 0; i <= prevLast.getDay(); i++) prevDates.unshift(prevLast.getDate() - i);
    }
    for (let i = 1; i <= 6 - thisLast.getDay(); i++) nextDates.push(i);

    const allDates = [...prevDates, ...thisDates, ...nextDates];
    const firstIndex = allDates.indexOf(1);
    const lastIndex = allDates.lastIndexOf(thisLast.getDate());

    datesEl.innerHTML = allDates
      .map((date, i) => {
        const isThisMonth = i >= firstIndex && i <= lastIndex;
        const cellDate = new Date(year, month + (isThisMonth ? 0 : i < firstIndex ? -1 : 1), date);
        const dateStr = formatDate(cellDate);
        return `<div class="date" data-date="${dateStr}">
                  <span class="${isThisMonth ? "this" : "other"}">${date}</span>
                </div>`;
      })
      .join("");

    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth()) {
      datesEl.querySelectorAll(".this").forEach((span) => {
        if (+span.textContent === now.getDate()) span.closest(".date").classList.add("now");
      });
    }

    setTimeout(() => {
      drawScheduleLines();
      updateTodayLabel(now);
    }, 50);
  }

  // === 일정 라인 표시 (첫 번째 코드 기반, 완성도 높음) ===
  function drawScheduleLines() {
    const schedules = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const datesWrap = el.querySelector(".dates");
    if (!datesWrap || !schedules.length) return;

    datesWrap.querySelectorAll(".event-bar").forEach((el) => el.remove());
    datesWrap.querySelectorAll(".event-more-link").forEach((el) => el.remove());

    const allCells = Array.from(datesWrap.querySelectorAll(".date"));
    if (!allCells.length) return;

    const firstCell = allCells[0];
    if (firstCell && firstCell.offsetWidth === 0) {
      setTimeout(drawScheduleLines, 100);
      return;
    }

    const dayRects = {};
    const weekTopOffsets = new Set();

    allCells.forEach((cell) => {
      const dateStr = cell.dataset.date;
      if (!dateStr) return;
      const rectTop = cell.offsetTop;
      weekTopOffsets.add(rectTop);
      dayRects[dateStr] = {
        left: cell.offsetLeft,
        right: cell.offsetLeft + cell.offsetWidth,
        top: rectTop,
        width: cell.offsetWidth,
      };
    });

    const sortedWeeks = Array.from(weekTopOffsets).sort((a, b) => a - b);
    Object.keys(dayRects).forEach((dateStr) => {
      dayRects[dateStr].weekIndex = sortedWeeks.indexOf(dayRects[dateStr].top);
    });

    // 디바이스별 라벨 크기 조정
    const screenWidth = window.innerWidth;
    let barVSpacing = 22;
    let dateHeaderOffset = 22;
    let barPaddingY = "0px";
    let barFontSize = "10px";

    if (screenWidth >= 918 && screenWidth <= 1345) {
      barVSpacing = 22;
      dateHeaderOffset = 26;
      barPaddingY = "1px";
      barFontSize = "10px";
    } else if (screenWidth >= 1346) {
      barVSpacing = 23;
      dateHeaderOffset = 28;
      barPaddingY = "1px";
      barFontSize = "14px";
    }

    const cellHeight = allCells[0]?.offsetHeight || 0;
    const availableSpace = cellHeight - dateHeaderOffset - 4;
    const totalSlots = Math.floor(availableSpace / barVSpacing);
    let MAX_EVENTS_PER_DAY = Math.max(0, totalSlots - 1);

    const dayUsage = {};
    const moreCounters = {};

    schedules.forEach((s) => {
      const color = s.color || getColorForStaff(s.staff);
      const start = normalizeDate(s.start);
      const end = normalizeDate(s.end || s.start);
      const isSingleDay = start.getTime() === end.getTime();

      let current = new Date(start);
      while (current <= end) {
        const currentStr = formatDate(current);
        const startRect = dayRects[currentStr];
        if (!startRect) {
          current.setDate(current.getDate() + 1);
          continue;
        }

        let segmentEnd = new Date(current);
        let endRect = startRect;
        while (true) {
          const nextDay = new Date(segmentEnd);
          nextDay.setDate(nextDay.getDate() + 1);
          if (nextDay > end) break;
          const nextDayStr = formatDate(nextDay);
          const nextRect = dayRects[nextDayStr];
          if (!nextRect || nextRect.top !== startRect.top) break;
          segmentEnd = nextDay;
          endRect = nextRect;
        }

        let targetSlot = 0;
        let tempDay = new Date(current);
        while (tempDay <= segmentEnd) {
          const tempStr = formatDate(tempDay);
          targetSlot = Math.max(targetSlot, dayUsage[tempStr] || 0);
          tempDay.setDate(tempDay.getDate() + 1);
        }

        if (targetSlot >= MAX_EVENTS_PER_DAY) {
          let tempDay = new Date(current);
          while (tempDay <= segmentEnd) {
            const tempStr = formatDate(tempDay);
            moreCounters[tempStr] = (moreCounters[tempStr] || 0) + 1;
            tempDay.setDate(tempDay.getDate() + 1);
          }
        } else {
          const bar = document.createElement("div");
          bar.className = "event-bar";
          bar.textContent = s.title;
          bar.style.position = "absolute";
          bar.style.left = `${startRect.left}px`;
          bar.style.width = `${endRect.right - startRect.left}px`;
          bar.style.top = `${startRect.top + targetSlot * barVSpacing + dateHeaderOffset}px`;
          bar.style.height = "18px";
          bar.style.fontSize = barFontSize;
          bar.style.border = `1px dashed ${color}`;
          bar.style.background = hexToRgba(color, 0.25);
          bar.style.borderRadius = "4px";
          bar.style.padding = barPaddingY;
          bar.style.overflow = "hidden";
          bar.style.textOverflow = "ellipsis";
          bar.style.whiteSpace = "nowrap";
          datesWrap.appendChild(bar);

          let fill = new Date(current);
          while (fill <= segmentEnd) {
            dayUsage[formatDate(fill)] = targetSlot + 1;
            fill.setDate(fill.getDate() + 1);
          }
        }

        current = new Date(segmentEnd);
        current.setDate(current.getDate() + 1);
      }
    });

    // "+n개 더" 표시
    Object.keys(moreCounters).forEach((dateStr) => {
      const count = moreCounters[dateStr];
      const rect = dayRects[dateStr];
      if (count > 0 && rect) {
        const moreLink = document.createElement("div");
        moreLink.className = "event-more-link";
        moreLink.textContent = `+${count}개 더`;
        moreLink.style.position = "absolute";
        moreLink.style.left = `${rect.left + 4}px`;
        moreLink.style.top = `${rect.top + MAX_EVENTS_PER_DAY * barVSpacing + dateHeaderOffset}px`;
        moreLink.style.fontSize = "12px";
        moreLink.style.color = "#333";
        moreLink.style.cursor = "pointer";
        moreLink.dataset.date = dateStr;
        moreLink.addEventListener("click", (e) => {
          e.stopPropagation();
          alert(`날짜: ${dateStr}\n숨겨진 일정: ${count}개`);
        });
        datesWrap.appendChild(moreLink);
      }
    });
  }

  // === 네비게이션 ===
  el.querySelector(".prev_btn")?.addEventListener("click", () => {
    today.setDate(1)
    today.setMonth(today.getMonth() - 1);
    renderCalendar();
  });

  el.querySelector(".next_btn")?.addEventListener("click", () => {
    today.setDate(1)
    today.setMonth(today.getMonth() + 1);
    renderCalendar();
  });

  el.querySelector(".year_now")?.addEventListener("click", () => {
    today = new Date();
    renderCalendar();
  });
  el.querySelector(".month_now")?.addEventListener("click", () => {
    today = new Date();
    renderCalendar();
  });

  // === 초기 렌더링 ===
  renderCalendar();
  addPopup({ renderCalendar, drawScheduleLines });
  window.addEventListener("resize", debounce(drawScheduleLines, 100));

  return { renderCalendar, drawScheduleLines };
}
