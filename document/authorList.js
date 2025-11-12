import { escapeHTML } from '../common/js/utils.js';
// (()=>{ 
export function authorList(){ 
// const escapeHTML = (s="")=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDoc = iso=>{
    const d=new Date(iso);
    const pad=(n)=>String(n).padStart(2,"0");
    return`
        ${pad(d.getMonth()+1)}월 ${pad(d.getDate())}일
        ${pad(d.getHours())}:${pad(d.getMinutes())}`
    };

const docKey="app.author.dpj.v1";

const getDoc = ()=>{
    try{
        return JSON.parse(localStorage.getItem(docKey))||[]
    }
    catch{
        return[]}
    };
    
const setDoc = (list)=>{
    localStorage.setItem(docKey,JSON.stringify(list))
};

const storeDoc={
    list(){return getDoc()},

    // 기본 글
    seedIfEmptyDoc(){
        if(this.list().length)return;
        
        const seed=Array.from({length:2},(_,i)=>({
            id:crypto.randomUUID(),
            title:`테스트 글${2-i}`,
            content:`글 내용(${i+1})`,
            category:"휴가신청서",
            file:"첨부파일이 없습니다.",
            createdAt:new Date(Date.now()-i*3600_000).toISOString(),
            state:"상신"
        }));
            
            setDoc(seed);
        },
    
    
    // 글 생성
    createDoc({title,content,category,file}){
        const item={
            id:crypto.randomUUID(),
            title:title.trim(),
            content:content.trim(),
            category:category||"휴가신청서",
            file:file||"첨부파일이 없습니다.",
            createdAt:new Date().toISOString(),
            state:"상신"
        };

        setDoc([item,...getDoc()]);

        return item;
    },
    
    
    // 글 수정
    updateDoc(id,fields){
        const list=getDoc();
        const idx=list.findIndex(p=>p.id===id);

        if(idx<0) {return null;}
        list[idx]={...list[idx],...fields};
        setDoc(list);

        return list[idx];
    },
    
    
    // 글 삭제
    removeDoc(id){
        setDoc(getDoc().filter(p=>p.id!==id))
    }
};


class DocApp{
    constructor(storeDoc){
        this.storeDoc=storeDoc;
        this.initialized = false; // 추가 중복 실행 방지
         
        // 선택자
        this.docSearchBox=document.querySelector('#docSearchBox');
        this.addWriteBtn=document.querySelector('#addWriteBtn');
        this.listEl=document.querySelector('#authorList');
        this.viewDlg=document.querySelector('#viewDlg');
        this.viewTitle=document.querySelector('#viewTitle');
        this.viewCategory=document.querySelector('#viewCategory');
        this.viewMeta=document.querySelector('#viewMeta');
        this.viewContent=document.querySelector('#viewContent');
        this.viewFile=document.querySelector('#viewFile');
        this.editBtn=document.querySelector('#editBtn');
        this.deleteBtn=document.querySelector('#deleteBtn');
        this.closeViewBtn=document.querySelector('#closeViewBtn');

        this.formDlg=document.querySelector('#formDlgDoc');
        this.postForm=document.querySelector('#postFormDoc');
        this.formTitle=document.querySelector('#formTitleDoc');
        this.titleInput=document.querySelector('#titleDoc');
        this.contentInput=document.querySelector('#contentDoc');
        this.categoryInput=document.querySelector('#categoryDoc');
        this.postId=document.querySelector('#postIdDoc');
        this.fileInput=document.querySelector('#fileDoc');
        this.uploadName=document.querySelector('#uploadNameDoc');
        this.cancle=document.querySelector('#cancleDoc');
        this.checkAllDoc=document.querySelector('#checkAllDoc');
        this.listDelBtn=document.querySelector('#delListBtn');
        this.authorNameDoc = document.querySelector("#authorNameDoc").textContent;

        this.docCategoryFilter = document.querySelector('#docCategoryFilter');
        this.docStateFilter = document.querySelector('#docStateFilter');

        this.filter = { kw: "", category: "전체", state: "전체"};
        this.currentViewingId=null;
    }

    // 이벤트 정의, 첫번째 로드 영역
    updateStatusDashboard() {
        // 1. 카운트 객체 초기화
        const counts = {
            '상신': 0,
            '수신': 0,
            '승인': 0,
            '반려': 0,
            '대기': 0
        };

        // localStorage의 모든 데이터 가져와서 집계
        const allItems = this.storeDoc.list();
        for (const item of allItems) {
            if (counts.hasOwnProperty(item.state)) {
                counts[item.state]++;
            }
        }

        // 집계된 숫자를 HTML에 반영
        document.querySelectorAll('.doc_con_box .send_num_box').forEach(box => {
            const statusEl = box.querySelector('.doc_send');
            const countEl = box.querySelector('.send_num');

            if (statusEl && countEl) {
                const statusName = statusEl.textContent.trim();
                const count = counts[statusName] || 0;
                countEl.innerHTML = `${count} <span class="doc_num">건</span>`;
            }
        });
    }


    initDoc(){
        // 초기화 상태 재실행 방지
        if(this.initialized) return;
        this.initialized = true;

        this.storeDoc.seedIfEmptyDoc();

        // 검색
        this.docSearchBox.addEventListener('input',()=>{
            this.filter.kw=this.docSearchBox.value;
            this.renderDoc(true);
        });

        // 결재목록 카테고리 필터 이벤트
        if (this.docCategoryFilter) { 
            this.docCategoryFilter.addEventListener('change', () => {
                this.filter.category = this.docCategoryFilter.value;
                this.renderDoc(true);
            });
        } else {
            console.error("오류: #docCategoryFilter 요소를 찾을 수 없습니다!");
        }

        if (this.docStateFilter) {
            this.docStateFilter.addEventListener('change', () => {
                // 필터 상태 업데이트
                this.filter.state = this.docStateFilter.value;
                // 목록 새로고침
                this.renderDoc(true);
            });
        } else {
            console.error("오류: #docStateFilter 요소를 찾을 수 없습니다!");
        }

        // 글 쓰기
        this.addWriteBtn.addEventListener('click',()=>{
            this.openForm();
            this.addWriteBtn.setAttribute("aria-expanded","true");
            queueMicrotask(()=>this.titleInput?.focus());
        });

        // 리스트 -> 게시글 클릭
        this.listEl.addEventListener('click',(e)=>{
            const card=e.target.closest(".docCard");

            if(!card)return;

            const id=card.dataset.id;
            
            


            // 상세보기
            if(e.target.classList.contains("title-text")){
                this.openView(id);
            }
        });

        this.listEl.addEventListener('change', (e) => {
            // 개별 체크박스 클릭 시 전체선택 상태 동기화
            if (e.target.matches(".check_item_doc")) {
                const checkItems = this.listEl.querySelectorAll(".check_item_doc");
                const allChecked = Array.from(checkItems).every((item) => item.checked);
                this.checkAllDoc.checked = allChecked;
            }

            // 상태 변경 시
            if (e.target.classList.contains("doc_state_sel")) {
                const card = e.target.closest(".docCard");
                const id = card.dataset.id;
                const newState = e.target.value;

                this.storeDoc.updateDoc(id, { state: newState });
                
                this.updateStatusDashboard();
            }
        });

        // 상세보기 닫기
        this.closeViewBtn.addEventListener('click',()=>{
            this.viewDlg.close();
        });

        // 상세보기 - 수정
        this.editBtn.addEventListener('click',()=>{
            if(!this.currentViewingId)return;
            this.viewDlg.close();
            this.openForm(this.currentViewingId);
        });

        // 상세보기 - 삭제
        this.deleteBtn.addEventListener('click',()=>{
            if(!this.currentViewingId) return;
            if(!confirm("삭제하시겠습니까?")) return;

            this.storeDoc.removeDoc(this.currentViewingId);
            this.viewDlg.close();
            this.renderDoc(true);
        });
        
        // 글쓰기/수정 폼 제출 이벤트
        this.postForm.addEventListener('submit',(e)=>{
            e.preventDefault();
            const id=this.postId.value.trim();
            const title=this.titleInput.value.trim();
            const content=this.contentInput.value.trim();
            const file=this.fileInput.files[0]?.name||"첨부파일이 없습니다.";
            const category=this.categoryInput.value;

            if(!title || !content){
                alert("모든 필드를 입력하세요.");
                return;
            }

            if(id){
                this.storeDoc.updateDoc(id,{title,content,category,file});
            } else{
                this.storeDoc.createDoc({title,content,category,file});
            }
            this.formDlg.close();
            this.renderDoc(true);
            this.addWriteBtn.setAttribute("aria-expanded","false");
        });

        // 폼 취소 버튼
        this.cancle.addEventListener('click',()=>{
            this.formDlg.close();
        });
        
        // 파일 업로드 변경 시 파일명 표시
        const fileInput=document.querySelector("#file");
        const uploadName=document.querySelector("#uploadName");
        fileInput.addEventListener("change",()=>{
            uploadName.value=fileInput.value; 
        });
        
        // 전체 선택 체크박스
        this.checkAllDoc.addEventListener('change',()=>{
            const check_item_doc=document.querySelectorAll('.check_item_doc');
            check_item_doc.forEach((item)=>{
                item.checked=this.checkAllDoc.checked;
            });
        });
        this.listEl.addEventListener("change", (e) => {
            if (e.target.matches(".check_item_doc")) {
                const checkItems = this.listEl.querySelectorAll(".check_item_doc");
                const allChecked = Array.from(checkItems).every((item) => item.checked);
                this.checkAllDoc.checked = allChecked;
            }
        });

        // 선택 삭제 버튼 이벤트
        this.listDelBtn.addEventListener("click", ()=>{
        const check_items=this.listEl.querySelectorAll('input[type="checkbox"].check_item_doc');
        const idsToDelete=[];
        check_items.forEach((item)=>{
            if(item.checked){
            const card=item.closest(".docCard");
            if(card?.dataset.id){
                idsToDelete.push(card.dataset.id);
            }
            }
        });

        if (idsToDelete.length === 0) {
            alert("삭제할 게시글을 선택하세요.");
            return;
        }

        if (!confirm(`${idsToDelete.length}개의 글을 삭제하시겠습니까?`)) return;

        idsToDelete.forEach((id) => this.storeDoc.removeDoc(id));

        this.renderDoc(true);
        this.checkAllDoc.checked = false;
        });

        this.renderDoc(true);
    }


    // 검색, 필터
    applyFiltersDoc(){
        const kw=this.filter.kw.trim().toLowerCase();
        const category = this.filter.category;
        const state = this.filter.state;
        let data=[...this.storeDoc.list()];

        if (category !== "전체") {
            data = data.filter(post => post.category === category);
        }
        if (state !== "전체") {
            data = data.filter(post => post.state === state);
        }

        // 키워드 검색 필터링
        if (kw) {
            data = data.filter((post) =>
                post.title.toLowerCase().includes(kw) ||
                post.content.toLowerCase().includes(kw)
            );
        };
        return data;
    }

    // 게시글 카드, 목록 영역
    renderDoc(reset=false){
        this.updateStatusDashboard();
        const listEl=this.listEl;
        const all=this.applyFiltersDoc();

        listEl.setAttribute('aria-busy','true');

        if(reset){
            listEl.innerHTML="";
        }
        if(all.length===0){
            listEl.innerHTML=`<div class=empty>표시할 게시글이 없습니다</div>`;
        }else{
            listEl.innerHTML = all.map((post) => {
                // state 값에 따라 올바르게 선택되도록 html을 동적 생성
                const states = ['상신', '수신', '대기', '승인', '반려'];
                const optionsHTML = states.map(state =>
                    `<option value="${state}" ${post.state === state ? 'selected' : ''}>${state}</option>`
                ).join('');

                return `
                <article class="docCard" data-id="${post.id}">
                    <label class="board_title doc_board_check">
                        <input type="checkbox" class="check_item_doc" id="data_check_box${post.id}">
                    </label>
                    <p class="doc_category">${post.category}</p>
                    <p class="doc_name align_left title-text">${escapeHTML(post.title)}</p>
                    <div class="doc_state">
                        <select name="docState" class="doc_state_sel" id="docState${post.id}">
                            ${optionsHTML}
                        </select>
                    </div>
                    <div class="doc_time">${fmtDoc(post.createdAt)}</div>
                </article>
                `;
            }).join("");
        }
        listEl.setAttribute('aria-busy','false');
    }

    // 글 상세보기
    openView(id){
        const post=this.storeDoc.list().find(p=>p.id===id);

        if(!post)return;

        this.currentViewingId=id;
        this.viewCategory.textContent=post.category
        this.viewTitle.textContent=post.title;
        this.viewMeta.textContent=` ${this.authorNameDoc} · ${fmtDoc(post.createdAt)}`;
        this.viewContent.textContent=post.content;
        this.viewFile.textContent=`첨부파일 : ${post.file}`||"첨부파일이 없습니다.";

        // this.render(true);
        this.viewDlg.showModal();
        queueMicrotask(()=>this.closeViewBtn?.focus());
    }

    // 글쓰기/수정 폼 열기
    openForm(id=null){
        if(id){
            const post=this.storeDoc.list().find(p=>p.id===id);
            if(!post)return;
            this.formTitle.textContent="글 수정";
            this.postId.value=post.id;
            this.titleInput.value=post.title;
            this.contentInput.value=post.content;
            this.categoryInput.value=post.category;
            this.uploadName.value=post.file||"첨부파일이 없습니다.";
        }else{
            this.formTitle.textContent="새 글 작성";
            this.postId.value="";
            this.titleInput.value="";
            this.contentInput.value="";
            // this.categoryInput.value="";
            this.uploadName.value="";
        }

        if (this.data_category) {
            this.data_category.style.display = 'none';
        }
        // 결재 카테고리 보이기
        if (this.author_category) {
            this.author_category.style.display = 'block';
        }

        this.formDlg.showModal();
        queueMicrotask(()=>this.titleInput?.focus());
    }
}

// document.addEventListener("DOMContentLoaded",()=>{
//     const app=new DocApp(storeDoc);
//     app.init();
// });

//  })();

const app = new DocApp(storeDoc);
  app.initDoc();

};
