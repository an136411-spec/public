    (()=>{
    // const KEY = "users";
     const KEY_USERS = "users";

    // const getUsers = () => {
    //   try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    //   catch { return []; }
    // };

    const getUsersAuthReset = () => {
        try {
          return JSON.parse(localStorage.getItem(KEY_USERS)) || [];
        } catch {
          return [];
        }
    };
    // const saveUsers = (list) => localStorage.setItem(KEY, JSON.stringify(list));
    const saveUsersAuthReset = (list) => {
        localStorage.setItem(KEY_USERS, JSON.stringify(list));
      };
    // 전화번호 자동 하이픈 삽입
    // function addHyphenToPhoneNumber(phoneNumberInput) {
    // const phoneNumber = phoneNumberInput.value;
    // const length = phoneNumber.length;

    //       if(length >= 9) {
    //           let numbers = phoneNumber.replace(/[^0-9]/g, "")
    //                 .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
    //           phoneNumberInput.value = numbers;
    //       }
    //   }
    const addHyphenToPhoneNumber = (input) => {
        let numbers = input.value.replace(/[^0-9]/g, "");
        if (numbers.length >= 9) {
          numbers = numbers.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
          input.value = numbers;
        }
      };

    //   const phoneInput = document.querySelector("phone");
    //   phoneInput.addEventListener("input", () => {
    //     addHyphenToPhoneNumber(phoneInput);
    //   });
      
    //   //취소버튼
      
    //   const cancleBtn=document.querySelector(".cancle-Btn");
    //   cancleBtn.addEventListener("click",()=>{
    //     window.location.href = '../../index.html';
    //   })

    // // 비밀번호 재설정
    // document.querySelector("resetPwForm").addEventListener("submit", (e) => {
    //   e.preventDefault();
    //   const employeeNum = document.querySelector("employeeNum").value.trim();
    //   const phone = document.querySelector("phone").value.trim();
    //   const new_password = document.querySelector("new_password").value;

    //   const users = getUsers();
    //   const idx = users.findIndex(u => u.employeeNum === employeeNum && u.phone === phone);

    //   const box = document.querySelector("pwResult");
    //   if (idx === -1) {
    //     alert("일치하는 계정을 찾을 수 없습니다.");
    //     return;
    //   }
    //   users[idx].password = new_password;
    //   saveUsers(users);
    //   alert("비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.");
    //   window.location.href = '../../index.html';
    //   return;
      
    // });

      document.addEventListener("DOMContentLoaded", () => {
        const resetForm = document.querySelector("#resetPwForm");
        const phoneInput = document.querySelector("#phone");
        const cancelBtn = document.querySelector("#cancelBtn");

        if (!resetForm || !phoneInput) return;

        // 전화번호 하이픈 자동 삽입
        phoneInput.addEventListener("input", () => addHyphenToPhoneNumber(phoneInput));

        // 취소 버튼
        cancelBtn.addEventListener("click", () => {
          window.location.href = "../../index.html";
        });

        // 비밀번호 재설정
        resetForm.addEventListener("submit", (e) => {
          e.preventDefault();

          const name = document.querySelector("#name").value.trim();
          const employeeNum = document.querySelector("#employeeNum").value.trim();
          const phone = document.querySelector("#phone").value.trim();
          const newPassword = document.querySelector("#password").value.trim();
          const confirmPassword = document.querySelector("#new_password").value.trim();

          // 입력값 검증
          if (!name || !employeeNum || !phone || !newPassword || !confirmPassword) {
            alert("모든 필수항목을 입력해주세요.");
            return;
          }

          if (newPassword !== confirmPassword) {
            alert("비밀번호 확인이 일치하지 않습니다.");
            return;
          }

          if (newPassword.length < 8 || newPassword.length > 16) {
            alert("비밀번호는 8~16자로 입력해주세요.");
            return;
          }

          const users = getUsersAuthReset();
          const idx = users.findIndex((u) =>
              u.name === name &&
              u.employeeNum === employeeNum &&
              u.phone === phone
          );

          if (idx === -1) {
            alert("입력한 정보와 일치하는 계정을 찾을 수 없습니다.");
            return;
          }

          // 비밀번호 변경
          users[idx].password = newPassword;
          saveUsersAuthReset(users);

          alert("비밀번호가 성공적으로 변경되었습니다.\n로그인 페이지로 이동합니다.");
          window.location.href = "../../index.html";
        });
    });

 })();