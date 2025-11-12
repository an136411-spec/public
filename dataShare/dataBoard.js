import { escapeHTML } from '../common/js/utils.js';
// (()=>{ 
export function dataBoard(){ 
// const escapeHTML = (s="")=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = iso=>{
    const d=new Date(iso);
    const pad=(n)=>String(n).padStart(2,"0");
    return`
        ${pad(d.getMonth()+1)}월 ${pad(d.getDate())}일
        ${pad(d.getHours())}:${pad(d.getMinutes())}`
    };

const key="app.datashare.dpj.v1";

const get = ()=>{
    try{
        return JSON.parse(localStorage.getItem(key))||[]
    }
    catch{
        return[]}
    };
    
const set = (list)=>{
    localStorage.setItem(key,JSON.stringify(list))
};

const store={
    list(){return get()},

    // 기본 글
    seedIfEmpty(){
        if(this.list().length)return;
        
        const seed=Array.from({length:2},(_,i)=>({
            id:crypto.randomUUID(),
            title:`테스트 글${2-i}`,
            content:`글 내용(${i+1})`,
            category:"건축",
            file:"첨부파일이 없습니다.",
            createdAt:new Date(Date.now()-i*3600_000).toISOString(),
            state:"진행중"
        }));
            
            set(seed);
        },
    
    
    // 글 생성
    create({title,content,category,file}){
        const item={
            id:crypto.randomUUID(),
            title:title.trim(),
            content:content.trim(),
            category:category||"건축",
            file:file||"첨부파일이 없습니다.",
            createdAt:new Date().toISOString(),
            state:"진행중"
        };

        set([item,...get()]);

        return item;
    },
    
    
    // 글 수정
    update(id,fields){
        const list=get();
        const idx=list.findIndex(p=>p.id===id);

        if(idx<0) {return null;}
        list[idx]={...list[idx],...fields};
        set(list);

        return list[idx];
    },
    
    
    // 글 삭제
    remove(id){
        set(get().filter(p=>p.id!==id))
    }
};


class BoardApp{
    constructor(store){
        this.store=store;
        this.initialized = false; // 추가 중복 실행 방지
         
        // 선택자
        this.dataSearchInput=document.querySelector('#dataSearchInput');
        this.openWriteBtn=document.querySelector('#openWriteBtn');
        this.listEl=document.querySelector('#dataList');
        this.viewDlg=document.querySelector('#viewDlg');
        this.viewTitle=document.querySelector('#viewTitle');
        this.viewCategory=document.querySelector('#viewCategory');
        this.viewMeta=document.querySelector('#viewMeta');
        this.viewContent=document.querySelector('#viewContent');
        this.viewFile=document.querySelector('#viewFile');
        this.editBtn=document.querySelector('#editBtn');
        this.deleteBtn=document.querySelector('#deleteBtn');
        this.closeViewBtn=document.querySelector('#closeViewBtn');
        this.formDlg=document.querySelector('#formDlg');
        this.postForm=document.querySelector('#postForm');
        this.formTitle=document.querySelector('#formTitle');
        this.titleInput=document.querySelector('#title');
        this.contentInput=document.querySelector('#content');
        this.categoryInput=document.querySelector('#category');
        this.postId=document.querySelector('#postId');
        this.fileInput=document.querySelector('#file');
        this.uploadName=document.querySelector('#uploadName');
        this.cancle=document.querySelector('#cancle');
        this.checkAll=document.querySelector('#dataCheckAll');
        this.listDelBtn=document.querySelector('#listDelBtn');
        this.authorName = document.querySelector("#authorName").textContent;


        this.filter={kw:""};
        this.currentViewingId=null;
    }

    // 이벤트 정의, 첫번째 로드 영역
    init(){
        // 초기화 상태 재실행 방지
        if(this.initialized) return;
        this.initialized = true;

        this.store.seedIfEmpty();

        // 검색
        this.dataSearchInput.addEventListener('input',()=>{
            this.filter.kw=this.dataSearchInput.value;
            this.render(true);
        });

        // 글 쓰기
        this.openWriteBtn.addEventListener('click',()=>{
            this.openForm();
            this.openWriteBtn.setAttribute("aria-expanded","true");
            queueMicrotask(()=>this.titleInput?.focus());
        });

        // 리스트 -> 게시글 클릭
        this.listEl.addEventListener('click',(e)=>{
            const card=e.target.closest(".dataCard");

            if(!card)return;

            const id=card.dataset.id;
            
            // 상태 토글
            if(e.target.classList.contains("state_toggle")){
                const post=this.store.list().find((p)=> p.id === id);

            if (!post) return;

            const newState=post.state === "진행중" ? "완료됨" : "진행중";
            this.store.update(id, { state: newState });

            // 스타일 변경
            const stateEl=e.target;

            if (newState === "완료됨") {
                stateEl.classList.add("state_toggle_done");
            } else {
                stateEl.classList.remove("state_toggle_done");
            }
            stateEl.innerHTML=`
                <div class="state_icon"></div>
                ${newState}
            `

            return;
        }


            // 상세보기
            if(e.target.classList.contains("title-text")){
                this.openView(id);
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

            this.store.remove(this.currentViewingId);
            this.viewDlg.close();
            this.render(true);
        });
        
        // 글쓰기/수정 폼 제출 이벤트
        this.postForm.addEventListener('submit',(e)=>{
            e.preventDefault();
            const id=this.postId.value.trim();
            const title=this.titleInput.value.trim();
            const content=this.contentInput.value.trim();
            const category=this.categoryInput.value;
            const file=this.fileInput.files[0]?.name||"첨부파일이 없습니다.";
            if(!title || !content){
                alert("모든 필드를 입력하세요.");
                return;
            }

            if(id){
                this.store.update(id,{title,content,category,file});
            } else{
                this.store.create({title,content,category,file});
            }
            this.formDlg.close();
            this.render(true);
            this.openWriteBtn.setAttribute("aria-expanded","false");
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
        this.checkAll.addEventListener('change',()=>{
            const check_item=document.querySelectorAll('.check_item');
            check_item.forEach((item)=>{
                item.checked=this.checkAll.checked;
            });
        });
        this.listEl.addEventListener("change", (e) => {
            if (e.target.matches(".check_item")) {
                const checkItems = this.listEl.querySelectorAll(".check_item");
                const allChecked = Array.from(checkItems).every((item) => item.checked);
                this.checkAll.checked = allChecked;
            }
        });

        // 선택 삭제 버튼 이벤트
        this.listDelBtn.addEventListener("click", ()=>{
        const check_items=this.listEl.querySelectorAll('input[type="checkbox"].check_item');
        const idsToDelete=[];
        check_items.forEach((item)=>{
            if(item.checked){
            const card=item.closest(".dataCard");
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

        idsToDelete.forEach((id) => this.store.remove(id));

        this.render(true);
        this.checkAll.checked = false;
        });

        this.render(true);
    }


    // 검색
    applyFilters(){
        const kw=this.filter.kw.trim().toLowerCase();
        let data=[...this.store.list()];

        if(kw){
            data=data.filter((p)=>
                p.title.toLowerCase().includes(kw) ||
                p.content.toLowerCase().includes(kw)
            )
        };
        return data;
    }

    // 게시글 카드, 목록 영역
    render(reset=false){
        const listEl=this.listEl;
        const all=this.applyFilters();

        listEl.setAttribute('aria-busy','true');

        if(reset){
            listEl.innerHTML="";
        }
        if(all.length===0){
            listEl.innerHTML=`<div class=empty>표시할 게시글이 없습니다.</div>`;
        }else{
            listEl.innerHTML=all.map((post)=>
            `
                <article class="dataCard" data-id="${post.id}">
                    <label class="board_title board_check">
                        <input type="checkbox" class="check_item" id="data_check_box${post.id}">
                    </label>
                    <p class="board_category">${post.category}</p>
                    <p class="board_name align_left title-text">${escapeHTML(post.title)}</p>
                    <div class="board_state">
                        <div class="board_state state_toggle ${post.state === "완료됨" ? "state_toggle_done" : ""}">
                        <div class="state_icon" style="background-color: ${post.state === "완료됨" ? "#A5ABBD" : "#1B263B"}"></div>
                        ${post.state}
                    </div>
                    </div>
                    <div class="board_time">${fmt(post.createdAt)}</div>
                </article>
            `
        ).join("");
        }
        listEl.setAttribute('aria-busy','false');
    }

    // 글 상세보기
    openView(id){
        const post=this.store.list().find(p=>p.id===id);

        if(!post)return;

        this.currentViewingId=id;
        this.viewCategory.textContent=post.category
        this.viewTitle.textContent=post.title;
        this.viewMeta.textContent = `${this.authorName} · ${fmt(post.createdAt)}`;
        this.viewContent.textContent=post.content;
        this.viewFile.textContent=`첨부파일 : ${post.file}`||"첨부파일이 없습니다.";

        // this.render(true);
        this.viewDlg.showModal();
        queueMicrotask(()=>this.closeViewBtn?.focus());
    }

    // 글쓰기/수정 폼 열기
    openForm(id=null){
        if(id){
            const post=this.store.list().find(p=>p.id===id);
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

        if(this.data_category){
            this.data_category.style.display='block'
        }
        if(this.author_category){
            this.author_category.style.display='none'
        }
        this.formDlg.showModal();
        queueMicrotask(()=>this.titleInput?.focus());
    }
}

// document.addEventListener("DOMContentLoaded",()=>{
//     const app=new BoardApp(store);
//     app.init();
// });

//  })();

const app = new BoardApp(store);
  app.init();

};
