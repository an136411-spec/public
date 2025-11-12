import { escapeHTML, formatDate } from '../common/js/utils.js';
import { dataBoard } from './dataBoard.js';
export function dataShare(){ 
// const escapeHTML = (s="")=>s.replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}));


const el = document.querySelector("#dataPage");
  if (!el) return;
  console.log("DataShare initialized");

const key="app.folders.dpj.v1";
// ㄴ> 데이터값에 맞춰 바꿔서 사용

const get = ()=>{
    try{
        return JSON.parse(localStorage.getItem(key)) || [];
    }
    catch{
        return [];
    }
}

const set = (list)=>{
    localStorage.setItem(key, JSON.stringify(list));
}

const store={
    list(){return get();},

    seedIfEmpty(){
        if(this.list().length) return;

        const seed=Array.from({length:3},(_,i)=>({
            id:crypto.randomUUID(), 
            title:["아쿠아 아트 육교","디올 성수","비발디파크"][i%3],
            createdAt:new Date(Date.now()-i*3600_000).toISOString(),       
        }))
        set(seed);
      },

    create({title}){
        const item={
            id: crypto.randomUUID(),
            title: title.trim(),
            createdAt: new Date().toISOString(),
        }
        set([item, ...get()]);

        return item;
    },

    remove(id){
        set(get().filter(f=>f.id !== id));
    }
};


class FolderApp {
    constructor(store){
        this.store=store;
        this.addFolderBtn=document.querySelector('#addFolderBtn');
        this.folderList=document.querySelector('#folderList');
        this.addFolderDlg=document.querySelector('#addFolderDlg');
        this.addFolderForm=document.querySelector('#addFolderForm');
        this.folderTitle=document.querySelector('#folderTitle');
        this.cancelBtn=document.querySelector('#cancelBtn');
        this.addFolderDlg=document.querySelector('#addFolderDlg');
        this.editingId=null; // 수정 모드 구분
    }

    init(){
        this.store.seedIfEmpty();

        this.addFolderBtn.addEventListener('click',()=>{
            this.editingId=null;
            this.folderTitle.value="";
            this.addFolderDlg.showModal();
        });

        this.addFolderForm.addEventListener('submit',(e)=>{
            e.preventDefault();
            const title=this.folderTitle.value.trim();
            const saveBtn=document.querySelector('#saveBtn');
            if(!title) return;

            if(this.editingId){ // 수정 모드
                const list=this.store.list();
                const idx=list.findIndex(f=>f.id===this.editingId);
                if(idx>=0){
                list[idx].title=title;
                localStorage.setItem("app.folders.dpj.v1", JSON.stringify(list));
                }
            }else{ // 새로 추가
                this.store.create({title});
            }

            this.render();
            this.addFolderDlg.close();
        });

        // 취소 버튼
        this.cancelBtn.addEventListener('click',()=>{
            this.addFolderDlg.close();
        });
    
        

        // 폴더 목록 이벤트
        this.folderList.addEventListener('click',(e)=>{
            const folder=e.target.closest(".folder");
            if(!folder) return;
            const id=folder.dataset.id;

            // 더보기 버튼 클릭 시 메뉴 열기/닫기
            if(e.target.closest(".more_icon")){
                const menu=folder.querySelector(".folder_menu");
                menu.classList.toggle("hidden");
                return;
            }

            // 수정 클릭
            if(e.target.dataset.act==="edit"){
                this.editingId=id;
                const target=this.store.list().find(f=>f.id===id);
                if(target){
                this.folderTitle.value=target.title;
                this.addFolderDlg.showModal();
                }
            }

            // 삭제 클릭
            if(e.target.dataset.act==="delete"){
                if(confirm("이 폴더를 삭제할까요?")){
                this.store.remove(id);
                this.render();
                }
            }

            // 닫기 클릭
            // if(e.target.dataset.act==="close"){
            //     const menu=folder.querySelector(".folder_menu");
            //     menu.classList.toggle("hidden");
            //     return;
            // }
        });

        this.render();
    }

    render(){
        const list=this.store.list();
        if(list.length===0){
        this.folderList.innerHTML="<div class='empty'>폴더가 없습니다.</div>";
        return;
        }
        this.folderList.innerHTML=list.map(f=>`
            <li class="folder swiper-slide" data-id="${f.id}">
                <div class="folder_top">
                    <div class="folder_icon">
                        <img src="./dataShare/img/folder_icon.png" alt="folder_icon">
                    </div>
                </div>

                <div class="folder_bottom" style="position:relative">
                    <p class="title">${escapeHTML(f.title)}</p>
                    <div class="more_icon">
                        <img src="./dataShare/img/more_icon.png" alt="more_icon">
                    </div>
                    <div class="folder_menu hidden">
                        <button class="folder_menu_btn editBtn" data-act="edit">폴더 명 수정</button>
                        <button class="folder_menu_btn deleteBtn" data-act="delete">폴더 삭제</button>
                    </div>
                </div>
            </li>
        `).join("");

        if(this.swiper){
            this.swiper.update();
        }
        else{
            this.swiper=new Swiper(".folderSwiper", {
                slidesPerView: 4.5,
                spaceBetween: 10,
                breakpoints: {
                    1344: {
                        slidesPerView: 6.5,
                        spaceBetween: 16
                    },
                    917: {
                        slidesPerView: 4.5,
                        spaceBetween: 12
                    }
                }
            });
        }
    }
}


dataBoard()
const app = new FolderApp(store);
  app.init();

};