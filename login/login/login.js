    (()=>{
    const KEY_USERS = "users";
    const KEY_SESSION = "currentUser";
    const KEY_SAVED_ID = "savedEmployeeNum";

  const getUsersAuth = () => {
    try { return JSON.parse(localStorage.getItem(KEY_USERS)) || []; }
    catch { return []; }
  };

const handleLogin = (e) => {
    e.preventDefault();

    const employeeNum = document.querySelector("#employeeNum").value.trim();
    const password = document.querySelector("#password").value.trim();
    const saveCheck = document.querySelector('input[name="checkbox"]')
    // => 사번 저장 체크박스

    if (!employeeNum || !password) {
      alert("사번과 비밀번호를 모두 입력해주세요.");
      return;
    }

    const users = getUsersAuth();
    const user = users.find(
      (u) => u.employeeNum === employeeNum && u.password === password
    );

    if (!user) {
      alert("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }


    if (saveCheck?.checked){
      localStorage.setItem(KEY_SAVED_ID, employeeNum);
    }else {
      localStorage.removeItem(KEY_SAVED_ID);
    }
    // => 사번 저장 체크 여부에 따라 저장/삭제하기

    // 로그인 세션 저장
    sessionStorage.setItem(
      KEY_SESSION,
      JSON.stringify({
        employeeNum: user.employeeNum,
        name: user.name,
        phone: user.phone,
        team: user.team,
        email: user.email,
        loginAt: new Date().toISOString(),
      })
    );

    // 페이지 이동
    location.href = "./intranet_main.html";
  };


//  DOM 로드 완료 후 폼 이벤트 등록

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector("#loginForm");
    if (!loginForm) {
      console.warn("로그인 폼을 찾을 수 없습니다.");
      return;
    }

    const emloyeeNumInput = document.querySelector("#employeeNum");
    const passwordInput = document.querySelector("#password");
    const saveCheck = document.querySelector('input[name="checkbox"]');

    // 저장된 사번 불러오기영역

    const savedId = localStorage.getItem(KEY_SAVED_ID);
    if (savedId){
      emloyeeNumInput.value = savedId;
      if (saveCheck) saveCheck.checked = true;

      // 자동포커스를 비밀번호로 이동
      passwordInput.focus();
    }

    loginForm.addEventListener("submit", handleLogin);
  });

})();


