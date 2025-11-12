import { escapeHTML } from '../common/js/utils.js';
import { calendar_mp } from './calendar_mp.js';
import { addPopup_mp } from './add_popup_mp.js';

export function mp() {
  const el = document.querySelector("#myPage");
  if (!el) return;
  console.log("MyPage initialized");

  const calObj = calendar_mp();
  addPopup_mp(calObj);

  // ===================== 📄 개인 문서 게시판 영역 =====================
  const fmtMp = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getMonth() + 1)}월 ${pad(d.getDate())}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // localStorage 키 이름 정의
  const key = "app.datashare.dpj.v1";

  // 데이터 입출력 함수
  const getMp = () => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  };
  const setMp = (list) => localStorage.setItem(key, JSON.stringify(list));

 
  const storeMp = {
    list() {
      return getMp();
    },
    seedIfEmptyMp() {
      if (this.list().length) return;
      const seed = Array.from({ length: 2 }, (_, i) => ({
        id: crypto.randomUUID(),
        title: `테스트 글${2 - i}`,
        content: `글 내용(${i + 1})`,
        category: `건축`,
        createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
        state: "진행중",
      }));
      setMp(seed);
    },
    createMp({ title, content, category }) {
      const item = {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        createdAt: new Date().toISOString(),
        state: "진행중",
      };
      setMp([item, ...getMp()]);
      return item;
    },
    updateMp(id, fields) {
      const list = getMp();
      const idx = list.findIndex((p) => p.id === id);
      if (idx < 0) return null;
      list[idx] = { ...list[idx], ...fields };
      setMp(list);
      return list[idx];
    },
    removeMp(id) {
      setMp(getMp().filter((p) => p.id !== id));
    },
  };


  class MypageApp {
    constructor(storeMp) {
      this.storeMp = storeMp;
      this.initialized = false;

      // 주요 요소 선택자
      this.searchInput = document.querySelector("#SearchBox");
      this.sortSelect = document.querySelector("#sortSelect");
      this.addBut = document.querySelector("#add");
      this.listEl = document.querySelector("#myList");
      this.selDelBtn = document.querySelector("#sel_del");
      this.myCheckAll = document.querySelector("#myCheckAll");

      // 폼 관련
      this.formDlg = document.querySelector("#formDlg");
      this.postForm = document.querySelector("#postForm");
      this.formTitle = document.querySelector("#formTitle");
      this.titleInput = document.querySelector("#title");
      this.contentInput = document.querySelector("#content");
      this.uploadName = document.querySelector("#uploadName");
      this.fileInput = document.querySelector("#file");
      this.cancleBtn = document.querySelector("#cancle");
      this.submitBtn = document.querySelector("#submitBtn");
      this.postId = document.querySelector("#postId");
      this.category = document.querySelector("#category");

      // 보기 영역
      this.viewDlg = document.querySelector("#viewDlg");
      this.viewCategory = document.querySelector("#viewCategory");
      this.viewTitle = document.querySelector("#viewTitle");
      this.viewFile = document.querySelector("#viewFile");
      this.viewContent = document.querySelector("#viewContent");
      this.viewMeta = document.querySelector("#viewMeta");
      this.editBtn = document.querySelector("#editBtn");
      this.deleteBtn = document.querySelector("#deleteBtn");
      this.closeViewBtn = document.querySelector("#closeViewBtn");
      this.authorName = document.querySelector("#authorName")?.textContent || "작성자";

      this.filter = { kw: "", sortBy: "recent" };
      this.currentViewingId = null;
    }

    initMp() {
      if (this.initialized) return;
      this.initialized = true;
      this.storeMp.seedIfEmptyMp();

      // 검색
      this.searchInput?.addEventListener("input", () => {
        this.filter.kw = this.searchInput.value;
        this.renderMp(true);
      });
      // 정렬
      this.sortSelect?.addEventListener("change", () => {
        this.filter.sortBy = this.sortSelect.value;
        this.renderMp(true);
      });
      // 새 글 작성
      this.addBut?.addEventListener("click", () => this.openFormMp());
      // 파일명 표시
      this.fileInput?.addEventListener("change", () => {
        const fileName = this.fileInput.files[0]?.name || "첨부파일이 없습니다.";
        this.uploadName.value = fileName;
      });
      // 보기창 닫기
      this.closeViewBtn?.addEventListener("click", () => this.viewDlg.close());
      // 수정
      this.editBtn?.addEventListener("click", () => {
        if (!this.currentViewingId) return;
        this.viewDlg.close();
        this.openFormMp(this.currentViewingId);
      });
      // 삭제
      this.deleteBtn?.addEventListener("click", () => {
        if (!this.currentViewingId) return;
        if (!confirm("삭제하시겠습니까?")) return;
        this.storeMp.removeMp(this.currentViewingId);
        this.viewDlg.close();
        this.renderMp(true);
      });
      // 작성/수정 제출
      this.postForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = this.postId.value.trim();
        const title = this.titleInput.value.trim();
        const content = this.contentInput.value.trim();
        const category = this.category.value.trim();


        if (!title || !content) {
          alert("모든 필드를 입력하세요.");
          return;
        }

        if (id) {
          const prev = this.storeMp.list().find((p) => p.id === id);
          this.storeMp.updateMp(id, { title, content, category, createdAt: prev?.createdAt });
        } else {
          this.storeMp.createMp({ title, content, category });
        }

        this.renderMp(true);
        this.formDlg.close();
        this.postForm.reset();
        this.uploadName.value = "";
      });
      // 취소
      this.cancleBtn?.addEventListener("click", () => {
        this.formDlg.close();
        this.postForm.reset();
        this.uploadName.value = "";
      });

      // 목록 영역 클릭 이벤트
      this.listEl?.addEventListener("click", (e) => {
        const card = e.target.closest(".card");
        if (!card) return;
        const id = card.dataset.id;
        const act = e.target.dataset.act || (e.target.classList.contains("title-text") ? "open" : "");
        if (act === "open") this.openViewMp(id);
        if (act === "quick-edit") this.openFormMp(id);
        if (act === "quick-del") this.deletePostMp(id);
      });

      // 전체선택
      this.myCheckAll?.addEventListener("change", () => {
        const checkItems = this.listEl.querySelectorAll(".checkItem");
        checkItems.forEach((i) => (i.checked = this.myCheckAll.checked));
      });

      // 개별선택
      this.listEl?.addEventListener("change", (e) => {
        if (!e.target.matches(".checkItem")) return;
        const checkItems = this.listEl.querySelectorAll(".checkItem");
        const allChecked = Array.from(checkItems).every((i) => i.checked);
        this.myCheckAll.checked = allChecked;
      });

      // 선택삭제
      this.selDelBtn?.addEventListener("click", () => {
        const checkItems = this.listEl.querySelectorAll(".checkItem:checked");
        const idsToDelete = Array.from(checkItems).map((i) => i.closest(".card")?.dataset.id).filter(Boolean);
        if (!idsToDelete.length) return alert("삭제할 게시글을 선택하세요.");
        if (!confirm(`${idsToDelete.length}개의 글을 삭제하시겠습니까?`)) return;
        idsToDelete.forEach((id) => this.storeMp.removeMp(id));
        this.renderMp(true);
        this.myCheckAll.checked = false;
      });

      this.renderMp(true);
    }

    // 정렬 , 검색
    applyFiltersMp() {
      const kw = this.filter.kw.trim().toLowerCase();
      let data = [...this.storeMp.list()];
      if (kw) data = data.filter((p) => p.title.toLowerCase().includes(kw) || p.content.toLowerCase().includes(kw));

      const byDateDesc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      const byDateAsc = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
      const byTitle = (a, b) => a.title.localeCompare(b.title);

      const sortBy = this.filter.sortBy;
      if (sortBy === "recent") data.sort(byDateDesc);
      if (sortBy === "old") data.sort(byDateAsc);
      if (sortBy === "title") data.sort(byTitle);
      return data;
    }

    // 목록 렌더링
    renderMp(reset = false) {
      const listEl = this.listEl;
      const all = this.applyFiltersMp();
      if (reset) listEl.innerHTML = "";
      if (!all.length) {
        listEl.innerHTML = `<div class="empty">표시할 게시글이 없습니다.</div>`;
        return;
      }

      const html = all
        .map(
          (p) => `
        <article class="card" data-id="${p.id}">
          <label class="board_title b_check">
            <input type="checkbox" class="checkItem" aria-label="선택: ${escapeHTML(p.title)}">
          </label>
          <p class="b_category">${escapeHTML(p.category)}</p>
          <p class="b_name align_left title-text" data-act="open">${escapeHTML(p.title)}</p>
          <p class="b_time">${fmtMp(p.createdAt)}</p>
          <div class="butSec">
            <button class="listBut text_14" data-act="quick-edit">수정</button>
            <button class="listBut mp_edit text_14" data-act="quick-del">삭제</button>
          </div>
        </article>`
        )
        .join("");
      listEl.innerHTML = html;
    }

    // 보기 다이얼로그
    openViewMp(id) {
      const post = this.storeMp.list().find((p) => p.id === id);
      if (!post) return;
      this.currentViewingId = id;

      this.viewCategory.textContent = post.category;
      this.viewTitle.textContent = post.title;
      this.viewMeta.textContent = `${this.authorName} · ${fmtMp(post.createdAt)}`;
      this.viewContent.textContent = post.content;
      this.viewFile.textContent = `첨부파일 : ${post.file || "첨부파일이 없습니다."}`;

      this.viewDlg.showModal();
      queueMicrotask(() => this.closeViewBtn?.focus());
    }

    // 폼 열기
    openFormMp(id = null) {
      if (id) {
        const post = this.storeMp.list().find((p) => p.id === id);
        if (!post) return;
        this.formTitle.textContent = "글 수정";
        this.postId.value = post.id;
        this.titleInput.value = post.title;
        this.contentInput.value = post.content;
      } else {
        this.formTitle.textContent = "새 글 작성";
        this.postId.value = "";
        this.titleInput.value = "";
        this.contentInput.value = "";
        this.uploadName.value = "";
        this.fileInput.value = "";
      }
      this.formDlg.showModal();
      queueMicrotask(() => this.titleInput?.focus());
    }

    deletePostMp(id) {
      const post = this.storeMp.list().find((p) => p.id === id);
      if (!post) return;
      if (!confirm(`"${post.title}" 글을 삭제하시겠습니까?`)) return;
      this.storeMp.removeMp(id);
      this.renderMp(true);
    }
  }


  const tabs = document.querySelectorAll(".tabs .tab");
  const mp_tab_con = document.querySelectorAll(".mp_tab_con");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      mp_tab_con.forEach((con) => con.classList.add("hidden"));
      const targetCon = el.querySelector(`#${target}`);
      if (targetCon) targetCon.classList.remove("hidden");
    });
  });


  const appMp = new MypageApp(storeMp);
  appMp.initMp();
}