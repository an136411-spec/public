    (()=>{ 
    const KEY_USERS = "users";
    const getUsersAuthSignup = () => {
      try {
        return JSON.parse(localStorage.getItem(KEY_USERS)) || [];
      } catch {
        return [];
      }
    };

    const saveUsersAuthSignup = (list) => {
      localStorage.setItem(KEY_USERS, JSON.stringify(list));
    };

    const addHyphenToPhoneNumber = (input) => {
      let numbers = input.value.replace(/[^0-9]/g, "");
      if (numbers.length >= 9) {
        numbers = numbers.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
        input.value = numbers;
      }
    };

    document.addEventListener("DOMContentLoaded", () => {
      const signupForm = document.querySelector("#signupForm");
      const phoneInput = document.querySelector("#phone");
      const checkPhoneBtn = document.querySelector("#checkPhoneBtn");
      const cancelBtn = document.querySelector("#cancelBtn");

    if (!signupForm || !phoneInput) return;

    // 전화번호 자동 하이픈
    phoneInput.addEventListener("input", () => addHyphenToPhoneNumber(phoneInput));

    // 전화번호 중복 확인
    checkPhoneBtn.addEventListener("click", () => {
      const phone = phoneInput.value.trim();
      if (!phone) {
        alert("전화번호를 입력해주세요.");
        return;
      }
      if (!/^\d{3}-\d{3,4}-\d{4}$/.test(phone)) {
        alert("전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678");
        return;
      }

      const users = getUsersAuthSignup();
      if (users.some((u) => u.phone === phone)) {
        alert("이미 등록된 전화번호입니다.");
      } else {
        alert("사용 가능한 전화번호입니다.");
      }
    });

    // 취소 버튼 → 메인 페이지로 이동
    cancelBtn.addEventListener("click", () => {
      location.href = "../../index.html";
    });

    // 회원가입 처리
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.querySelector("#name").value.trim();
      const employeeNum = document.querySelector("#employeeNum").value.trim();
      const phone = phoneInput.value.trim();
      const email = document.querySelector("#email").value.trim();
      const password = document.querySelector("#password").value.trim();
      const passwordCheck = document.querySelector("#password_check").value.trim();
      const team = document.querySelector("#team").value.trim();

      // 필수 입력 확인
      if (!name || !employeeNum || !phone || !email || !password || !passwordCheck || !team) {
        alert("모든 필수 항목을 입력해주세요.");
        return;
      }
      // 부서 선택
      if(team==='all'){
        alert('부서를 선택해주세요')
        return;
      }

      // 전화번호 형식 확인
      if (!/^\d{3}-\d{3,4}-\d{4}$/.test(phone)) {
        alert("전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678");
        return;
      }

      // 이메일 형식 확인
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(email)) {
        alert("이메일 형식이 올바르지 않습니다.");
        return;
      }

      // 비밀번호 확인
      if (password !== passwordCheck) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      // 비밀번호 길이 제한
      if (password.length < 8 || password.length > 16) {
        alert("비밀번호는 8~16자로 입력해주세요.");
        return;
      }

      const users = getUsersAuthSignup();

      // 중복 사번 / 전화번호 검사
      if (users.some((u) => u.employeeNum === employeeNum)) {
        alert("이미 등록된 사번입니다.");
        return;
      }
      if (users.some((u) => u.phone === phone)) {
        alert("이미 등록된 전화번호입니다.");
        return;
      }

      // 신규 사용자 추가
      const newUser = {
        name,
        employeeNum,
        password,
        phone,
        email,
        team,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsersAuthSignup(users);

      alert(`${name}님, 회원가입이 완료되었습니다!\n로그인 페이지로 이동합니다.`);
      location.href = "../../index.html";
    });
  });

})();