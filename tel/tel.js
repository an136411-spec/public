import { escapeHTML } from '../common/js/utils.js';

export function tel(){

  const el = document.querySelector("#telPage");
  if (!el) return;
  console.log("Tel initialized");



  let fullData = [];

  async function loadData() {
    try {
      const res = await fetch("../tel/data/employee.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`파일 로드 실패 (${res.status})`);
      return await res.json();
    } catch (err) {
      console.error("데이터 로드 오류:", err);
      return { employees: [] };
    }
  }

  function createTeam(teamItem) {
    const { team, members } = teamItem;
    const teamEl = document.createElement("div");
    teamEl.className = "team";

    const title = document.createElement("div");
    title.className = "teamTitle";
    title.textContent = team || "무소속";

    const membersBox = document.createElement("div");
    membersBox.className = "teamMembers";

    (members || []).forEach((member) => {
      const profile = document.createElement("div");
      profile.className = "profile";
      profile.innerHTML = `
        <div class="profile_top">
          <div class="prf_img">
            <img src="./tel/img/profile.svg" alt="프로필사진">
          </div>
          <div class="rank_name">
            <span class="rank">[${escapeHTML(member.rank || "-")}]</span>
            <span class="name">${escapeHTML(member.name || "-")}</span>
          </div>
          <img class="chat_img" src="./tel/img/chat.svg" alt="채팅">
        </div>
        <div class="profile_info">
          <div class="profile_info_in info1">${escapeHTML(member.tel || "-")}</div>
          <div class="profile_info_in info2">${escapeHTML(member.phone || "-")}</div>
          <div class="profile_info_in info3">${escapeHTML(member.email || "-")}</div>
        </div>`;
      membersBox.appendChild(profile);
    });

    teamEl.append(title, membersBox);
    return teamEl;
  }

  function renderTeams(list = [], els = {}) {
    const { teamList, noResultsMsg } = els;
    if (!teamList || !noResultsMsg) {
      console.warn("⚠️ renderTeams: 요소 누락");
      return;
    }
    teamList.innerHTML = "";
    if (!list.length) {
      noResultsMsg.style.display = "block";
      return;
    }
    noResultsMsg.style.display = "none";
    list.forEach((team) => teamList.appendChild(createTeam(team)));
  }

  function filterTeams(keyword = "", selectedTeam = "all", els = {}) {
    const { teamList, teamFilter, searchInput, noResultsMsg } = els;
    const kw = keyword.trim();
    const filtered = fullData.filter((team) => {
      const matchTeam = selectedTeam === "all" || team.team === selectedTeam;
      const members = Array.isArray(team.members) ? team.members : [];
      const matchMember = !kw
        ? true
        : members.some((m = {}) => {
            const { name = "", rank = "", tel = "", phone = "" } = m;
            return (
              name.includes(kw) ||
              rank.includes(kw) ||
              tel.includes(kw) ||
              phone.includes(kw)
            );
          });
      return matchTeam && matchMember;
    });
    renderTeams(filtered, els);
  }

  function attachEventHandlers(els = {}) {
    const { teamFilter, searchInput } = els;
    if (!teamFilter || !searchInput) return;
    searchInput.addEventListener("input", () => {
      filterTeams(searchInput.value.trim(), teamFilter.value, els);
    });
    teamFilter.addEventListener("change", () => {
      filterTeams(searchInput.value.trim(), teamFilter.value, els);
    });
  }

  async function init() {
  const teamList = el.querySelector("#teamList");
  const teamFilter = el.querySelector("#teamFilter");
  const searchInput = el.querySelector("#searchInput");
  const noResultsMsg = el.querySelector("#noResultsMessage");

  if (!teamList || !teamFilter || !searchInput || !noResultsMsg) {
    console.warn("⚠️ Tel 페이지 DOM 요소를 찾을 수 없습니다.");
    return;
  }

  try {
    const res = await fetch("./tel/data/employee.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`파일 로드 실패 (${res.status})`);
    const data = await res.json();

    // ✅ 구조 자동 대응
    fullData = data.departments || data.employees || data || [];
    console.log("📦 불러온 데이터:", fullData);

    const els = { teamList, teamFilter, searchInput, noResultsMsg };
    renderTeams(fullData, els);
    attachEventHandlers(els);
  } catch (err) {
    console.error("❌ Tel 데이터 로드 오류:", err);
  }
}

  init();
}

