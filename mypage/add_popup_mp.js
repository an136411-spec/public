import { escapeHTML, formatDateRange, hexToRgba } from "../common/js/utils.js";

export function addPopup_mp(calFns) {
  const STORAGE_KEY = "mypage.schedules.v1";
  const el = document.querySelector("#myPage");
  if (!el) return;

  console.log("[add_popup_mp.js] MyPage Schedule Popup Loaded");

  // === DOM 요소 ===
  const popup = el.querySelector(".add_popup_mp");
  const addBtn = el.querySelector(".add_sch_2");
  const cancelBtn = el.querySelector(".cancle_btn_2");
  const registerBtn = el.querySelector(".reg_btn_2");
  const schList = el.querySelector("#sch_list_mp");

  const addTitle = el.querySelector(".add_title_mp");

  const input = {
    title: el.querySelector("#sch_name_mp"),
    start: el.querySelector("#sch_start_mp"),
    end: el.querySelector("#sch_end_mp"),
    staff: el.querySelector("#staff_name_mp"),
    loc: el.querySelector("#location_mp"),
    color: el.querySelector("#color_picker_mp"),
  };

  let schedules = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let editId = null;
  let currentSelectedDateStr = null;

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  const genId = () =>
    crypto?.randomUUID?.() ?? `sch_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  // === 카드 HTML 생성 ===
  function buildCardHTML({ id, title, staff, location, start, end, color }) {
    const barColor = color || "#FFB800";
    const bgColor = hexToRgba(barColor, 0.10);
    const dateRange = formatDateRange(start, end);

    return `
      <div class="today_list" data-id="${id}" 
        style="border-left:2px solid ${barColor}; background:${bgColor}; border-radius:6px; position:relative;">
        <div class="list_con">
          <div class="list_title">${escapeHTML(title)}</div>
          <div class="name_list">
            <img src="./mypage/img/sch_staff.svg" alt="담당자" class="list_img">
            <span>${escapeHTML(staff || "-")}</span>
          </div>
          <div class="sch_location">
            <img src="./mypage/img/sch_location.svg" alt="위치" class="list_img">
            <span>${escapeHTML(location || "-")}</span>
          </div>
          <div class="sch_date">
            <img src="./mypage/img/sch_cal_icon.svg" alt="일자" class="list_img">
            <span>${dateRange}</span>
          </div>
        </div>
        <img class="more_but_mp" src="./mypage/img/sch_more.svg" alt="더보기">
      </div>
    `;
  }

  // === 전체 렌더링 ===
  function renderAll() {
    if (!schList) return;
    if (!Array.isArray(schedules)) schedules = [];

    if (schedules.length === 0) {
      schList.innerHTML = `<div class="empty_schedule">등록된 일정이 없습니다.</div>`;
      return;
    }

    const sorted = [...schedules].sort((a, b) => new Date(a.start) - new Date(b.start));
    schList.innerHTML = sorted.map(buildCardHTML).join("");
  }

  // === 특정 날짜 렌더링 ===
  function renderSchedules(targetDateStr) {
    if (!schList) return;
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
  addBtn?.addEventListener("click", () => {
    editId = null;
    Object.values(input).forEach((i) => (i.value = ""));
    input.color.value = "#D9D9D9";
    if (addTitle) addTitle.textContent = "개인 일정 추가";
    popup.style.display = "block";

    const todayStr = new Date().toISOString().split("T")[0];
    input.start.value = todayStr;
    input.end.value = todayStr;
  });

  // === 팝업 닫기 ===
  cancelBtn?.addEventListener("click", () => (popup.style.display = "none"));

  // === 일정 등록/수정 ===
  registerBtn?.addEventListener("click", () => {
    const title = input.title.value.trim();
    const start = input.start.value;
    const end = input.end.value || start;
    const staff = input.staff.value.trim();
    const loc = input.loc.value.trim();
    const color = input.color.value || "#D9D9D9";

    if (!title || !start) return alert("제목과 시작일은 필수입니다.");

    if (editId) {
      const sch = schedules.find((s) => s.id === editId);
      if (sch) Object.assign(sch, { title, start, end, staff, location: loc, color });
    } else {
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
  });

  // === 더보기 클릭 (수정/삭제) ===
  document.addEventListener("click", (e) => {
    const more = e.target.closest(".more_but_mp");
    if (!more) return;

    e.stopPropagation();
    const card = more.closest(".today_list");
    const id = card.dataset.id;

    document.querySelectorAll(".fix_popup_mp").forEach((p) => p.remove());

    const fixPopup = document.createElement("div");
    fixPopup.className = "fix_popup_mp";
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
    fixPopup.style.zIndex = 99999;
    fixPopup.style.display = "flex";
    fixPopup.style.justifyContent = "center";
    fixPopup.style.alignItems = "center";

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
      if (addTitle) addTitle.textContent = "개인 일정 수정";
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
    const clickedFixPopup = e.target.closest(".fix_popup_mp");
    const clickedMoreButton = e.target.closest(".more_but_mp");
    if (!clickedMoreButton && !clickedFixPopup)
      document.querySelectorAll(".fix_popup_mp").forEach((p) => p.remove());

    const clickedAddPopup = e.target.closest(".add_popup_mp");
    const clickedAddScheduleButton = e.target.closest(".add_sch_2");
    if (popup.style.display === "block" && !clickedAddPopup && !clickedAddScheduleButton)
      popup.style.display = "none";
  });

  // === 날짜 클릭 시 해당 일정 보기 ===
  el.querySelector(".calendar_2 .dates")?.addEventListener("click", (e) => {
    const cell = e.target.closest(".date");
    if (!cell) return;

    currentSelectedDateStr = cell.dataset.date;

    el.querySelectorAll(".calendar_2 .date").forEach((d) =>
      d.classList.toggle("selected", d.dataset.date === cell.dataset.date)
    );

    renderSchedules(currentSelectedDateStr);
  });

  // === 초기화 ===
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  currentSelectedDateStr = todayStr;
  renderAll();
}
