import { header } from "./header.js";
import { calendar } from "../../calendar/calendar.js";
import { dataShare } from "../../dataShare/dataShare.js";
import { documentP } from "../../document/document.js";
import { msg } from "../../message/msg.js";
import { mp } from "../../mypage/mp.js";
import { tel } from "../../tel/tel.js";


// 각페이지 초기화상태
const initialized = {
  calendar: false,
  datashare: false,
  document: false,
  messenger: false,
  mypage: false,
  tel: false,
};

// 페이지별 초기화 함수 매핑
const pageMap = {
  0: { fn: calendar, key: "calendar" },
  1: { fn: dataShare, key: "datashare" },
  2: { fn: documentP, key: "document" },
  3: { fn: msg, key: "messenger" },
  4: { fn: mp, key: "mypage" },
  5: { fn: tel, key: "tel" },
};



window.addEventListener("DOMContentLoaded", () => {
  // 헤더, 프로필, 로그아웃 등 초기화
  header();

    const menus = document.querySelectorAll("#mainMenuList .menu");
    const sections = document.querySelectorAll(".content_wrap");
    const mainHeader = document.querySelector('#mainHeader');
    const menuBg = document.querySelector('#menuBg');

    // 메뉴 아이콘 변경 초기화
    function resetMenuIcons() {
        menus.forEach((m)=>{
            const img=m.querySelector('.menu_icon_img');
            if(img){
                const alt=img.alt
                img.src=`./common/img/${alt}_w.svg`;
            }
        });
    }

  menus.forEach((menu, idx) => {
    menu.addEventListener("click", () => {
      // 메뉴 및 섹션 활성화 전환
      menus.forEach(m => m.classList.remove("on"));
      sections.forEach(s => s.classList.remove("page_on"));
      menu.classList.add("on");
      sections[idx].classList.add("page_on");
      
        // 모바일 메뉴 클릭 시 메뉴창 사라짐
        mainHeader.style.left='-100%'
        menuBg.classList.remove('mo_menu_bg_on');

        resetMenuIcons();
        const img=menu.querySelector('.menu_icon_img');
        if(img){
            const alt=img.alt;
            img.src=`./common/img/${alt}_n.svg`;
        }

      // 초기화 함수 호출
      const page = pageMap[idx];
      if (page && !initialized[page.key]) {
        page.fn();
        initialized[page.key] = true;
      }
    });
  });

  

  // 초기 진입 메뉴 실행 (예: 캘린더)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      menus[0].click(); // 캘린더 페이지
    });
  });
});
