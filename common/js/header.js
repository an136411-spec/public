import { escapeHTML } from './utils.js';

export function header(){ 
const el = document.querySelector("#headerLog");

  if (!el) return;
  console.log("Header initialized");
  const profileCard = el.querySelector("#profileCard");
  const profileClick = el.querySelector("#profileClick");
  const profileEditBtn = el.querySelector("#profileEditBtn");
  const bellIconBg = el.querySelector("#bellIconBg");
  const alarmWrap = el.querySelector("#alarmWrap");
  const alarmBox = document.querySelector(".alarm_box");
  const logoutBtn = document.querySelector("#logoutBtn");
  const moMenu = el.querySelector('#moMenu');
  const mainHeader = document.querySelector('#mainHeader');
  const menuBg = document.querySelector('#menuBg');
  const moMenuClose = document.querySelector('#moMenuClose');

const KEY_SESSION = "currentUser";

  const storedData = sessionStorage.getItem("currentUser"); // 로그인한 사용자 정보
  // sessionStorage에서 사용자 정보가 존재하는지 확인
  if (storedData) {
    const userData = JSON.parse(storedData);
    // 부서 데이터를 JSON 파일에서 가져오기
    fetch('./tel/data/employee.json') // employee.json 파일 경로에 맞게 수정
      .then(response => response.json())
      .then(teamData => {
        const departments = teamData.departments;
        // 로그인한 사용자 팀 정보
        const userTeam = userData.team;
        // 해당 팀
        const teamInfo = departments.find(department => department.team === userTeam);
        console.log(userTeam);  
        
        if (teamInfo) {
          const teamTel = teamInfo.teamTel;
          document.getElementById("profile_card_teamTel").textContent = teamTel;
        } else {
          console.log("부서 정보가 없습니다.");
        }
        

        document.getElementById("profile_card_team").textContent = userData.team;
        document.getElementById("profile_card_email").textContent = userData.email;
        document.getElementById("profile_card_mobile").textContent = userData.phone;
        document.getElementById("m_profile_name").textContent = userData.name;
      })
      .catch(error => {
        console.error("부서 데이터를 가져오는 중 오류 발생:", error);
      });

      const authorName = document.querySelector("#authorName");
      if (authorName) {
        authorName.textContent = userData.name;
      }
      const authorNameDoc = document.querySelector("#authorNameDoc");
      if (authorNameDoc) {
        authorNameDoc.textContent = userData.name;
      }
  } else {
    console.warn("sessionStorage에 저장된 사용자 정보가 없습니다.");
  }
const logo=document.querySelector('#logo');
logo.addEventListener('click',()=>{
  location.reload()
})

// 프로필 클릭
profileClick.addEventListener('click', () => {
    profileCard.classList.toggle('collapsed');
    profileClick.classList.toggle('collapsed');
});

// 프로필 수정
let isEditing = false;
profileEditBtn.addEventListener('click', () => {
    if (!isEditing) {
      // 수정 모드: p → input
       el.querySelectorAll(".profile_card_field").forEach((p) => {
        const parent = p.parentElement;
        const input = document.createElement("input");
        input.type = "text";
        input.value = p.textContent.trim();
        input.dataset.type = p.dataset.type;
        input.className = "edit_input";
        parent.replaceChild(input, p);
      });
      profileEditBtn.textContent = "완료";
      profileEditBtn.classList.remove("edit_done");
      profileEditBtn.classList.add("edit_on");
      isEditing = true;
    }
    else {
      // 완료 모드: input → p, 값 저장
      el.querySelectorAll(".edit_input").forEach((input) => {
        const parent = input.parentElement;
        const p = document.createElement("p");
        p.className = "profile_card_field";
        p.dataset.type = input.dataset.type;
        p.textContent = input.value.trim();
        parent.replaceChild(p, input);
      });
      profileEditBtn.textContent = "수정";
      profileEditBtn.classList.remove("edit_on");
      profileEditBtn.classList.add("edit_done");
      isEditing = false;
    }
  });

  // 알림창
async function loadNoticeData() {
    try {
      const res = await fetch("./common/data/notice.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`파일 로드 실패 (${res.status})`);
      const data = await res.json();
      return data.notices || [];
    } catch (err) {
      console.error("❌ 알림 데이터 로드 오류:", err);
      return [];
    }
}

function createAlarmItem(item) {
    const alarm = document.createElement("div");
    alarm.className = "alarms";
    alarm.innerHTML = `
        <div class="alarm_img">
            <img src="./common/img/profile_icon_r.svg" alt="profile_icon">
        </div>
        <div class="alarm_con">
            <p>[${escapeHTML(item.rank || "-")}] ${escapeHTML(item.name || "-")}님이 새 파일을 업로드하였습니다.</p>
            <p class="alarm_time">${escapeHTML(item.date || "")}</p>
        </div>
    `;
    return alarm;
}

function renderAlarms(notices = []) {
    alarmBox.innerHTML = "";
    if (!notices.length) {
      alarmBox.innerHTML = `<div class="no_alarm">📭 현재 알림이 없습니다.</div>`;
      updateBadge(0);
      return;
    }
    notices.forEach((item) => {
      alarmBox.appendChild(createAlarmItem(item));
    });
    updateBadge(notices.length);
}

function updateBadge(count) {
    let badge = bellIconBg.querySelector(".alarm_badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "alarm_badge";
      bellIconBg.appendChild(badge);
    }
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count; // 100개 이상이면 "99+"
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
}

async function init() {
  const data = await loadNoticeData();
  renderAlarms(data);
}
init();




// 알림창 클릭
bellIconBg.addEventListener('click', () => {
    alarmWrap.classList.toggle('alarm_wrap_on');
    bellIconBg.classList.toggle('bell_icon_bg_on');
});

// 닫기
document.addEventListener('click', (e) => {
  // 알림창 닫기
  if
  (alarmWrap.classList.contains('alarm_wrap_on') && 
  !alarmWrap.contains(e.target) &&
  !bellIconBg.contains(e.target)){
    bellIconBg.classList.remove('bell_icon_bg_on');
    alarmWrap.classList.remove('alarm_wrap_on');
  }

  // 프로필카드 닫기
  if(profileCard.classList.contains('collapsed') &&
    !profileCard.contains(e.target) &&
    !profileClick.contains(e.target)){
    profileCard.classList.remove('collapsed');
    profileClick.classList.remove('collapsed');
  }
  
});

// 모바일 메뉴
moMenu.addEventListener('click',()=>{
  mainHeader.style.left='0'
  menuBg.classList.toggle('mo_menu_bg_on');
})
moMenuClose.addEventListener('click',()=>{
  mainHeader.style.left='-100%'
  menuBg.classList.toggle('mo_menu_bg_on');
})

    logoutBtn.addEventListener('click',()=>{
         try {
            sessionStorage.removeItem(KEY_SESSION);
            if (confirm("로그아웃하시겠습니까?")) {
                alert("로그아웃되었습니다.");
                location.href = "./index.html";
            }
        } catch (e) {
            console.warn("로그아웃 처리 중 오류:", e);
            }
    })
};

















