// calendar_mp.js
import { hexToRgba } from "../common/js/utils.js";
import { addPopup_mp } from "./add_popup_mp.js";

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function calendar_mp() {
  const el = document.querySelector("#myPage");
  if (!el) return console.warn("myPage not found");

  console.log("[calendar_mp.js] MyPage Calendar Loaded");

  const STORAGE_KEY = "mypage.schedules.v1";
  const COLOR_MAP = ["#FFB800", "#8C1BC1", "#1B8BC1", "#28A745", "#E91E63", "#FF5722"];
  const colorIndexMap = {};

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
    const datesEl = el.querySelector(".calendar_2 .dates");
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

  // === 일정 라인 표시 + "+n개 더" ===
  function drawScheduleLines() {
    const schedules = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const datesWrap = el.querySelector(".calendar_2 .dates");
    if (!datesWrap || !schedules.length) return;

    datesWrap.querySelectorAll(".event-bar, .event-more-link").forEach((n) => n.remove());

    const allCells = Array.from(datesWrap.querySelectorAll(".date"));
    if (!allCells.length || allCells[0].offsetWidth === 0) {
      setTimeout(drawScheduleLines, 100);
      return;
    }

    const dayRects = {};
    const weekTopOffsets = new Set();
    allCells.forEach((cell) => {
      const dateStr = cell.dataset.date;
      const top = cell.offsetTop;
      if (!dateStr) return;
      weekTopOffsets.add(top);
      dayRects[dateStr] = {
        left: cell.offsetLeft,
        right: cell.offsetLeft + cell.offsetWidth,
        top,
        width: cell.offsetWidth,
      };
    });

    const sortedWeeks = Array.from(weekTopOffsets).sort((a, b) => a - b);
    Object.keys(dayRects).forEach((dateStr) => {
      dayRects[dateStr].weekIndex = sortedWeeks.indexOf(dayRects[dateStr].top);
    });

    // 화면별 스타일
    const screenWidth = window.innerWidth;
    let barVSpacing = 22, dateHeaderOffset = 22, barPaddingY = "0px", barFontSize = "12px";
    if (screenWidth >= 1346) { barVSpacing = 23; dateHeaderOffset = 28; barFontSize = "14px"; }

    const cellHeight = allCells[0]?.offsetHeight || 0;
    const totalSlots = Math.floor((cellHeight - dateHeaderOffset - 4) / barVSpacing);
    let MAX_EVENTS_PER_DAY = Math.max(0, totalSlots - 1);

    const dayUsage = {};
    const moreCounters = {};

    schedules.forEach((s) => {
      const color = s.color || getColorForStaff(s.staff);
      const start = normalizeDate(s.start);
      const end = normalizeDate(s.end || s.start);

      let current = new Date(start);
      while (current <= end) {
        const currentStr = formatDate(current);
        const startRect = dayRects[currentStr];
        if (!startRect) { current.setDate(current.getDate() + 1); continue; }

        // 이벤트가 한 줄 이상 필요한 경우
        let segmentEnd = new Date(current);
        let endRect = startRect;
        while (true) {
          const nextDay = new Date(segmentEnd);
          nextDay.setDate(segmentEnd.getDate() + 1);
          const nextRect = dayRects[formatDate(nextDay)];
          if (!nextRect || nextRect.top !== startRect.top) break;
          segmentEnd = nextDay;
          endRect = nextRect;
        }

        // 어느 슬롯에 넣을지
        let targetSlot = 0;
        let tempDay = new Date(current);
        while (tempDay <= segmentEnd) {
          targetSlot = Math.max(targetSlot, dayUsage[formatDate(tempDay)] || 0);
          tempDay.setDate(tempDay.getDate() + 1);
        }

        if (targetSlot >= MAX_EVENTS_PER_DAY) {
          tempDay = new Date(current);
          while (tempDay <= segmentEnd) {
            moreCounters[formatDate(tempDay)] = (moreCounters[formatDate(tempDay)] || 0) + 1;
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
          bar.style.border = `1px solid ${color}`;
          bar.style.background = hexToRgba(color, 0.25);
          bar.style.borderRadius = "4px";
          bar.style.padding = barPaddingY;
          bar.style.overflow = "hidden";
          bar.style.textOverflow = "ellipsis";
          bar.style.whiteSpace = "nowrap";
          datesWrap.appendChild(bar);

          tempDay = new Date(current);
          while (tempDay <= segmentEnd) {
            dayUsage[formatDate(tempDay)] = targetSlot + 1;
            tempDay.setDate(tempDay.getDate() + 1);
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
  el.querySelector(".calendar_2 .dates")?.addEventListener("click", (e) => {
    const cell = e.target.closest(".date");
    if (!cell) return;
    const date = new Date(cell.dataset.date);
    updateTodayLabel(date);
  });
   
  el.querySelector(".prev_btn")?.addEventListener("click", () => { today.setDate(1); today.setMonth(today.getMonth() - 1); renderCalendar(); });
  el.querySelector(".next_btn")?.addEventListener("click", () => { today.setDate(1); today.setMonth(today.getMonth() + 1); renderCalendar(); });

  renderCalendar();
  addPopup_mp({ renderCalendar, drawScheduleLines });
  window.addEventListener("resize", debounce(drawScheduleLines, 100));

  return { renderCalendar, drawScheduleLines };
}

