import { escapeHTML, formatDateRange, hexToRgba } from "../common/js/utils.js";

export function addPopup(calFns) {
  const STORAGE_KEY = "calendar.schedules.v1";
  const el = document.querySelector("#calPage");
  if (!el) return;

  // === DOM 요소 정의 ===
  const popup = document.querySelector(".add_popup");
  const addBtn = el.querySelector(".add_sch_1");
  const cancelBtn = el.querySelector(".cancle_btn_1");
  const registerBtn = el.querySelector(".reg_btn_1");
  const schList = el.querySelector("#sch_list_ca");

  const addSchedule = document.querySelector(".add_sch");
  const cancleBtn = document.querySelector(".cancle_btn");
  const addTitle = document.querySelector("#edit_sch_title");

  const calToday = document.querySelector(".today");
  const week = document.querySelector(".week");

  // 입력 필드
  const input = {
    title: el.querySelector("#sch_name_ca"),
    start: el.querySelector("#sch_start_ca"),
    end: el.querySelector("#sch_end_ca"),
    staff: el.querySelector("#staff_name_ca"),
    loc: el.querySelector("#location_ca"),
    color: el.querySelector("#color_picker_ca"),
  };

  // === 내부 변수 ===
  let schedules = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let editId = null;
  let currentSelectedDateStr = null;

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  const genId = () =>
    crypto?.randomUUID?.() ??
    `sch_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  // === 날짜 표시 (요일, 날짜) ===
  function updateSchedulerHeader(dateObj) {
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    if (calToday) calToday.textContent = `${String(dateObj.getMonth() + 1).padStart(2, "0")}월 ${dateObj.getDate()}일`;
    if (week) week.textContent = days[dateObj.getDay()];
  }

  // === 카드 HTML 생성 ===
  function buildCardHTML({ id, title, staff, location, start, end, color }) {
    const barColor = color || "#FFB800";
    const bgColor = hexToRgba(barColor, 0.10);
    const dateRange = formatDateRange(start, end);

    return `
      <div class="today_list" data-id="${id}" 
        style="border-left:2px solid ${barColor}; background:${bgColor}; border-radius:6px;">
        <div class="list_con">
          <div class="list_title">${escapeHTML(title)}</div>
          <div class="name_list">
            <img src="./calendar/img/sch_staff.svg" alt="담당자" class="list_img">
            <span>${escapeHTML(staff || "-")}</span>
          </div>
          <div class="sch_location">
            <img src="./calendar/img/sch_location.svg" alt="위치" class="list_img">
            <span>${escapeHTML(location || "-")}</span>
          </div>
          <div class="sch_date">
            <img src="./calendar/img/sch_cal_icon.svg" alt="일자" class="list_img">
            <span>${dateRange}</span>
          </div>
        </div>
        <img class="more_but" src="./calendar/img/sch_more.svg" alt="더보기">
      </div>
    `;
  }

  // 일정 목록 전체 렌더링
  function renderAll() {
    if (!Array.isArray(schedules)) schedules = [];
    if (schedules.length === 0) {
      schList.innerHTML = `<div class="empty_schedule">등록된 일정이 없습니다.</div>`;
      return;
    }

    const sorted = [...schedules].sort((a, b) => new Date(a.start) - new Date(b.start));
    schList.innerHTML = sorted.map(buildCardHTML).join("");
  }

  // === 특정 날짜 일정 렌더링 ===
  function renderSchedules(targetDateStr) {
    schList.innerHTML = "";

    const filtered = schedules.filter((s) => {
      const start = s.start;
      const end = s.end || start;
      return targetDateStr >= start && targetDateStr <= end;
    });

    if (filtered.length === 0) {
      schList.innerHTML = `<div class="empty_schedule" style="text-align:center; padding:20px; color:#888;">해당 날짜에 등록된 일정이 없습니다.</div>`;
      return;
    }

    filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach((s) => schList.insertAdjacentHTML("beforeend", buildCardHTML(s)));
  }

  // === 팝업 열기 ===
  addBtn.onclick = () => {
    editId = null;
    Object.values(input).forEach((i) => (i.value = ""));
    input.color.value = "#D9D9D9";
    if (addTitle) addTitle.textContent = "일정 추가";
    popup.style.display = "block";
  };

  // === 팝업 닫기 ===
  cancelBtn.onclick = () => (popup.style.display = "none");

  // === 일정 등록 / 수정 ===
  registerBtn.onclick = () => {
    const title = input.title.value.trim();
    const start = input.start.value;
    const end = input.end.value || start;
    const staff = input.staff.value.trim();
    const loc = input.loc.value.trim();
    const color = input.color.value || "#D9D9D9";

    if (!title || !start) return alert("제목과 시작일은 필수 입력입니다.");

    if (editId) {
      // 수정
      const sch = schedules.find((s) => s.id === editId);
      if (sch) Object.assign(sch, { title, start, end, staff, location: loc, color });
    } else {
      // 신규 등록
      schedules.push({
        id: genId(),
        title,
        start,
        end,
        staff,
        location: loc,
        color,
        createdAt: Date.now(),
      });
    }

    save();
    renderSchedules(currentSelectedDateStr ?? start);
    calFns?.renderCalendar?.();
    setTimeout(calFns?.drawScheduleLines, 50);

    popup.style.display = "none";
    editId = null;
  };

  // === 수정/삭제 팝업 ===
  document.addEventListener("click", (e) => {
    const more = e.target.closest(".more_but");
    if (!more) return;
    console.log('dd')

    e.stopPropagation();
    const card = more.closest(".today_list");
    const id = card.dataset.id;

    document.querySelectorAll(".fix_popup").forEach((p) => p.remove());

    const fixPopup = document.createElement("div");
    fixPopup.className = "fix_popup";
    fixPopup.innerHTML = `
      <div class="sch_fix_group">
        <button class="sch_more sch_fix">일정 수정</button>
        <button class="sch_more sch_del">일정 삭제</button>
      </div>
    `;
    fixPopup.style.position = "absolute";
    fixPopup.style.top = `${more.offsetTop + more.offsetHeight - 5}px`;
    const cardWidth = card.offsetWidth;
    const buttonRightEdge = more.offsetLeft + more.offsetWidth;
    const spaceFromRight = cardWidth - buttonRightEdge;
    fixPopup.style.right = `${spaceFromRight}px`;
    fixPopup.style.display='flex';


    card.appendChild(fixPopup);

    // 수정
    fixPopup.querySelector(".sch_fix").addEventListener("click", () => {
      const sch = schedules.find((s) => s.id === id);
      if (!sch) return;
      editId = sch.id;
      input.title.value = sch.title;
      input.start.value = sch.start;
      input.end.value = sch.end;
      input.staff.value = sch.staff;
      input.loc.value = sch.location;
      input.color.value = sch.color || "#D9D9D9";
      popup.style.display = "flex";
      if (addTitle) addTitle.textContent = "일정 수정";
      fixPopup.remove();
    });

    // 삭제
    fixPopup.querySelector(".sch_del").addEventListener("click", () => {
      if (!confirm("정말 삭제하시겠습니까?")) return;
      schedules = schedules.filter((s) => s.id !== id);
      save();
      renderSchedules(currentSelectedDateStr);
      calFns?.renderCalendar?.();
      calFns?.drawScheduleLines?.();
      fixPopup.remove();
    });
  });

  // === 외부 클릭 시 팝업 닫기 ===
  document.addEventListener("click", (e) => {
    const clickedFixPopup = e.target.closest(".fix_popup");
    const clickedMoreButton = e.target.closest(".more_but");
    if (!clickedMoreButton && !clickedFixPopup)
      document.querySelectorAll(".fix_popup").forEach((p) => p.remove());

    const clickedAddPopup = e.target.closest(".add_popup");
    const clickedAddScheduleButton = e.target.closest(".add_sch_1");
    if (popup.style.display === "block" && !clickedAddPopup && !clickedAddScheduleButton)
      popup.style.display = "none";
  });

  // === 날짜 클릭 시 해당 일정 보기 ===
  const calendarDatesContainer = document.querySelector(".dates");
  if (calendarDatesContainer) {
    calendarDatesContainer.addEventListener("click", (e) => {
      const clickedDateCell = e.target.closest(".date");
      if (!clickedDateCell) return;

      const dateStr = clickedDateCell.dataset.date;
      if (!dateStr) return;

      currentSelectedDateStr = dateStr;

      const currentSelected = calendarDatesContainer.querySelector(".selected");
      if (currentSelected) currentSelected.classList.remove("selected");
      clickedDateCell.classList.add("selected");

      const dateObj = new Date(dateStr + "T00:00:00");
      updateSchedulerHeader(dateObj);
      renderSchedules(dateStr);
    });
  }

  // === 페이지 이동 시 팝업 닫기 ===
  function hideAllPopupsOnNavigate() {
    if (popup.style.display === "block") popup.style.display = "none";
    document.querySelectorAll(".fix_popup").forEach((p) => p.remove());
  }
  window.addEventListener("hashchange", hideAllPopupsOnNavigate);
  window.addEventListener("popstate", hideAllPopupsOnNavigate);

  // === 월 변경 시 전체보기 유지 ===
  document.addEventListener("monthChanged", renderAll);

  // === 초기화 ===
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  currentSelectedDateStr = todayStr;
  updateSchedulerHeader(today);
  renderSchedules(todayStr);
}
