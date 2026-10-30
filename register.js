/* =====================================================
   register.js — проверка формы регистрации в браузере.
   Проверяет поля ДО отправки. Настоящую проверку и создание
   пользователя всё равно делает Django на сервере.
   ===================================================== */


/* ---------- НАСТРОЙКИ ---------- */

// true  — демо-режим: форма никуда не отправляется, просто показывается «успех».
//         Нужен, пока Django ещё не подключён.
// false — форма реально отправляется на адрес action из register.html.
//         Когда Django будет готов, поставь false.
const DEMO_MODE = true;

const MIN_PASSWORD_LENGTH = 6;   // минимальная длина пароля


/* ---------- ПРОВЕРКА ---------- */

const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");

// Показать сообщение; type = "bad" (ошибка) или "good" (успех)
function showMessage(text, type) {
  msg.textContent = text;
  msg.className = "msg " + type;
}

form.addEventListener("submit", event => {
  const password1 = form.password1.value;
  const password2 = form.password2.value;

  // Проверка 1: длина пароля
  if (password1.length < MIN_PASSWORD_LENGTH) {
    event.preventDefault();   // остановить отправку
    showMessage(`Пароль слишком короткий (минимум ${MIN_PASSWORD_LENGTH} символов)`, "bad");
    return;
  }

  // Проверка 2: пароли совпадают
  if (password1 !== password2) {
    event.preventDefault();
    showMessage("Пароли не совпадают", "bad");
    return;
  }

  // Всё хорошо. В демо-режиме не отправляем форму.
  if (DEMO_MODE) {
    event.preventDefault();
    showMessage(`Готово, ${form.username.value}! (демо: данные никуда не отправлены)`, "good");
    form.reset();
  }
  // Если DEMO_MODE = false, форма уйдёт на сервер сама.
});
