     (()=>{ 
    //  const KEY = "users";
    const KEY_USERS = "users";

        // const getUsers = () => {
        const getUsersAuthFindId = () =>{
            try { return JSON.parse(localStorage.getItem(KEY_USERS)) || []; }
            catch { return []; }
        };

    // 전화번호 자동 하이픈 삽입

    const addHyphenToPhoneNumber = (input) => {
        let numbers = input.value.replace(/[^0-9]/g, "");
        if (numbers.length >= 9) {
        numbers = numbers.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
        input.value = numbers;
        }
    };

   
document.addEventListener("DOMContentLoaded", () => {
    const phoneInput = document.querySelector("#phone");
    const findIdForm = document.querySelector("#findIdForm");
    const findIdResult = document.querySelector("#findIdResult");
    const resultBox = document.querySelector(".findIdResult");
    const resetPwBtn = document.querySelector(".resetpw-Btn");
    const submitBtn = document.querySelector(".submit-Btn");
    const cancelBtn = document.querySelector(".cancle-Btn");

    if (!findIdForm || !phoneInput) return; 
    // 요소가 없을 경우 조기 종료

    // 초기 상태
    resultBox.textContent = "";
    resultBox.classList.remove("visible");
    resetPwBtn.classList.remove("visible");
    submitBtn.classList.remove("invisible");

    // 전화번호 입력 시 자동 하이픈
    phoneInput.addEventListener("input", () => addHyphenToPhoneNumber(phoneInput));

    // 취소 버튼 => 로그인 페이지로 이동
    cancelBtn.addEventListener("click", () => {
      window.location.href = "../../index.html";
    });

    // 사번 찾기 폼 제출 이벤트
    findIdForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.querySelector("#name").value.trim();
      const email = document.querySelector("#email").value.trim();
      const phone = phoneInput.value.trim();

      if (!name || !phone || !email) {
        alert("이름, 이메일, 전화번호를 모두 입력해주세요.");
        return;
      }

      const users = getUsersAuthFindId();
      const matches = users.filter((u) => u.name === name && u.phone === phone && u.email === email);

      resultBox.classList.add("visible");

      if (matches.length === 0) {
        findIdResult.textContent = "일치하는 사번이 없습니다.";
        resetPwBtn.classList.remove("visible");
      } else {
        const ids = matches.map((u) => u.employeeNum).join(", ");
        findIdResult.textContent = `${name} 님의 사번은 ${ids} 입니다.`;
        resetPwBtn.classList.add("visible");
      }
    });
  });

})();