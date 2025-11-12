export function msg() {
  const el = document.querySelector("#messagePage");
  if (!el) return;
  console.log("Messenger initialized");

  // 시간 포맷
  const fmt = (iso) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getMonth() + 1)}월 ${pad(d.getDate())}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // DOM 요소 탐색
  const search = el.querySelector("#search");
  const messageList = el.querySelector("#messageList");
  const roomName = el.querySelector("#roomName");
  const chatBox = el.querySelector("#chatBox");
  const chatForm = el.querySelector("#chatForm");
  const chatInput = el.querySelector("#chatInput");
  const msg_set = el.querySelector("#msg_set");
  const setting = el.querySelector("#setting");
  const exit = el.querySelector("#m_exit");

  if (!search || !chatForm || !messageList || !chatBox) {
    console.warn("⚠️ msg.js: 일부 DOM 요소를 찾을 수 없어 초기화를 중단합니다.");
    return;
  }

  // 임시 메신저 방
  const roomsData = [
    { id: 1, title: "00팀 이00 주임", lastMessage: "마지막 메시지", time: "2025-09-30 09:30:00", views: 12, messages: [] },
    { id: 2, title: "00팀 김00 과장", lastMessage: "마지막 메시지", time: "2025-09-29 09:30:00", views: 5, messages: [] },
    { id: 3, title: "00팀 윤00 대리", lastMessage: "마지막 메시지", time: "2025-09-28 09:30:00", views: 30, messages: [] },
    { id: 4, title: "00팀 정00 주임", lastMessage: "마지막 메시지", time: "2025-09-27 09:30:00", views: 1, messages: [] },
    { id: 5, title: "00팀 임00 부장", lastMessage: "마지막 메시지", time: "2025-09-26 09:30:00", views: 6, messages: [] },
  ];

  let activeRoom = null;

  // 방 목록 렌더링
  function renderRoomList(data = roomsData) {
    messageList.innerHTML = "";
    roomsData.sort((a, b) => new Date(b.time) - new Date(a.time));

    data.forEach(room => {
      const msgBox = document.createElement("div");
      msgBox.className = `room room_${room.id}`;

      const trimmedMessage = room.lastMessage.length > 20
        ? room.lastMessage.slice(0, 20) + "..."
        : room.lastMessage;

      msgBox.innerHTML = `
        <div class="roomBox ${activeRoom && activeRoom.id === room.id ? 'active' : ''}">
          <div class="room_left">
            <div class="title text_18">${room.title}</div>
            <div class="last_message">${trimmedMessage}</div>
          </div>
          <div class="room_right">
            <div class="time text_14">${fmt(room.time)}</div>
          </div>
        </div>`;
      msgBox.addEventListener("click", () => selectRoom(room));
      messageList.appendChild(msgBox);
    });
  }

  // 검색
  if (search) {
    search.addEventListener("input", () => {
      const keyword = search.value.toLowerCase().trim();
      const filtered = roomsData.filter(room =>
        room.title.toLowerCase().includes(keyword)
      );
      renderRoomList(filtered);
    });
  }

  // 방 선택
  function selectRoom(room) {
    el.querySelectorAll(".roomBox").forEach(r => r.classList.remove("active"));

    const clicked = el.querySelector(`.room_${room.id} .roomBox`);
    clicked?.classList.add("active");

    activeRoom = room;
    roomName.textContent = room.title;
    renderMessages(room);
  }

  // 메시지 표시
  function renderMessages(room) {
    chatBox.innerHTML = "";

    if (room.messages.length === 0) {
      chatBox.innerHTML = `<li style="color:#999;">${room.title} 채팅이 없습니다.</li>`;
    } else {
      room.messages.forEach(msg => {
        const li = document.createElement("li");
        li.className = "msg_con";

        // 현재 시간
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const time = `${hours}:${minutes}`;

        // 메시지 구조 (시간 + 내용)
        li.innerHTML = `
          <div class="msg_wrap">
            <span class="msg_time">${time}</span>
            <div class="msg_bubble">${msg}</div>
          </div>
        `;
        chatBox.appendChild(li);
      });
    }
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // 메시지 전송
  chatForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!activeRoom) {
      alert("메신저 방을 선택하세요.");
      return;
    }
    const msg = chatInput.value.trim();
    if (!msg) return;

    activeRoom.messages.push(msg);
    activeRoom.lastMessage = msg;
    activeRoom.time = new Date().toISOString();
    chatInput.value = "";
    renderMessages(activeRoom);
    renderRoomList();
  });

  // 설정 버튼 토글
  if (msg_set && setting) {
    msg_set.addEventListener("click", () => {
      if (setting.style.display === "block") {
        setting.style.display = "none";
      } else {
        setting.style.display = "block";
      }
    });
  }

  // 설정 메뉴 동작
  el.querySelectorAll(".set_menu")?.forEach(menu => {
    menu.addEventListener("click", () => {
      el.querySelectorAll(".set_menu").forEach(m => m.classList.remove("active"));
      menu.classList.add("active");

      if (menu.id === "m_exit") {
        activeRoom = null;
        roomName.textContent = "";
        chatBox.innerHTML = `<li style="color:#999;">메신저 방을 선택하세요.</li>`;
        el.querySelectorAll(".roomBox").forEach(r => r.classList.remove("active"));
      }

      setTimeout(() => {
        setting.style.display = "none";
        el.querySelectorAll(".set_menu").forEach(m => m.classList.remove("active"));
      }, 300);
    });
  });

  renderRoomList();
}
