import { authorList } from './authorList.js';
export function documentP(){  


  const el = document.querySelector("#documentPage");
  if (!el) return;
  console.log("Document initialized");


  // 최근 열람한 문서
  const LIST_SELECTOR = '.list_content';
  const JSON_URL = './document/data/categorys.json';
  const RECENT_KEY = 'recentDocs';
  const MAX_RECENT = 20;

  const q = (sel, scope = document) => scope.querySelector(sel);

  async function loadJSON(url) {
    try{
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("⚠️ JSON 로드 오류:", err); 
      // 수정됨: 오류 로깅 추가
      return { categorys: [] }; 
      // 수정됨: 기본 구조 반환 (categorys)
    }
  }


  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? []; }
    catch { return []; }
  }

  function saveRecent(list) {
    localStorage.setItem(RECENT_KEY, 
    JSON.stringify(list.slice(0, MAX_RECENT)));
  }

  function pushRecent(item) {
    const recent = getRecent().filter(d => d.id !== item.id);
    recent.unshift({ id: item.id, title: item.title, icon: item.icon, url: item.url });
    saveRecent(recent);
  }

  // render
  function renderList(container, items) {
    if (!container) return;

    if (items.length >= 10) {
      container.style.display = 'flex';       // 항목을 가로로 나열
      container.style.overflowX = 'auto';     // 가로 스크롤 활성화
      container.style.flexWrap = 'nowrap';    // 줄 바꿈 방지
    } else {
      // 10개 미만이면 기본 스타일로 복원
      container.style.display = '';           // CSS에 정의된 기본값 (예: 'block' 또는 'grid')
      container.style.overflowX = '';
      container.style.flexWrap = '';
    }






    if (!items || items.length === 0) {
      container.innerHTML = '<p class="no_history" style="padding:1rem;color:#888">최근 열람한 문서가 없습니다.</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach(doc => {
      const a = document.createElement('a');
      a.href = doc.url;
      a.className = 'doc_inbox_link';
      a.style.textDecoration = 'none';
      a.style.color = 'inherit';
      a.dataset.id = doc.id;

      a.style.minWidth = '120px';

      const box = document.createElement('div');
      box.className = 'doc_inbox';

      const imgBox = document.createElement('div');
      imgBox.className = 'doc_img_box';

      const img = document.createElement('img');
      img.className = 'doc_icon';
      img.src = doc.icon;
      img.alt = `${doc.title} 아이콘`;

      const title = document.createElement('p');
      title.className = 'doc_list_title';
      title.textContent = doc.title;

      title.style.whiteSpace = 'nowrap';
      title.style.overflow = 'hidden';
      title.style.textOverflow = 'ellipsis';
      title.style.width = '100%';

      imgBox.appendChild(img);
      box.append(imgBox, title);
      a.appendChild(box);

      a.addEventListener('click', () => {
        pushRecent(doc);
      });


      frag.appendChild(a);
    });
    container.replaceChildren(frag);
  }

  // 초기 실행
  async function init() {
    try {
      const container = q(LIST_SELECTOR, el);
      if (!container) return;

      // 최근 열람문서 가로 스크롤 이벤트
      container.addEventListener('wheel', (e) => {
        if (container.scrollWidth > container.clientWidth) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
        }
      });

      const data = await loadJSON(JSON_URL);
      const docs =  data.categorys || data.documents || [];

      // 최신 10개 표시
      const recentDocs = getRecent();
      renderList(container, recentDocs.length ? recentDocs : docs);
    } catch (err) {
      console.error("문서 로딩 오류:", err);
    }
  }

  init();
  authorList()

  localStorage.removeItem('recentDocs');


};