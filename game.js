/* =====================================================
   game.js — вся логика игры.
   Разделы:  1. НАСТРОЙКИ   2. ФИЛЬМЫ   3. ИГРА (трогать не обязательно)
   ===================================================== */


/* ---------- 1. НАСТРОЙКИ (можно менять числа) ---------- */

const ROUNDS = 5;     // сколько фильмов в одной игре
const MAX_TRIES = 3;  // сколько попыток на один фильм (и столько же подсказок)
                      // очки за фильм = MAX_TRIES - сделанные ошибки
                      // (с 1-й попытки = 3 очка, со 2-й = 2, с 3-й = 1)


/* ---------- 2. ФИЛЬМЫ ----------
   Каждый фильм — это блок { ... } со своими полями:
     title  — правильный ответ (так его и надо ввести)
     emoji  — эмодзи-загадка
     img    — (необязательно) путь к картинке, например "images/titanic.jpg".
              Если img указан, показывается картинка вместо эмодзи.
     hints  — подсказки: от самой сложной к самой простой.
              Сколько подсказок, столько должно быть и попыток (MAX_TRIES).

   Чтобы ДОБАВИТЬ фильм: скопируй любой блок, вставь ниже и поменяй текст.
   Не забудь запятую после } между блоками.

   Для базы данных: когда в Django сделают API, этот список можно будет
   загружать с сервера — см. комментарий в самом конце файла. */

let MOVIES = [
  { title: "Титаник", emoji: "🚢🧊💔",
    hints: ["Вышел в 1997 году", "Режиссёр — Джеймс Кэмерон", "Корабль, айсберг и «Я — король мира!»"] },

  { title: "Король Лев", emoji: "🦁👑🌅",
    hints: ["Мультфильм студии Disney", "Главного героя зовут Симба", "Песня «Hakuna Matata»"] },

  { title: "Матрица", emoji: "💊🕶️💻",
    hints: ["Вышел в 1999 году", "Главного героя зовут Нео", "Красная или синяя таблетка?"] },

  { title: "Парк Юрского периода", emoji: "🦖🧬🏝️",
    hints: ["Режиссёр — Стивен Спилберг", "Действие на острове Нублар", "Динозавров вырастили из ДНК"] },

  { title: "Один дома", emoji: "🏠👦🎄",
    hints: ["Рождественская комедия", "Мальчика зовут Кевин", "Он защищает дом от грабителей"] },

  { title: "Шрек", emoji: "👹🫏🏰",
    hints: ["Мультфильм 2001 года", "Главный герой — зелёный огр", "Его друг — говорящий осёл"] },

  { title: "Холодное сердце", emoji: "❄️👸⛄",
    hints: ["Мультфильм Disney 2013 года", "Сёстры Эльза и Анна", "Песня «Let It Go»"] },

  { title: "Гарри Поттер", emoji: "⚡🧙‍♂️🦉",
    hints: ["Основан на книгах Дж. К. Роулинг", "Школа Хогвартс", "Мальчик со шрамом-молнией"] },

  { title: "Начало", emoji: "🌀💤🏙️",
    hints: ["Режиссёр — Кристофер Нолан", "В главной роли Леонардо Ди Каприо", "Сон внутри сна внутри сна"] },

  { title: "Властелин колец", emoji: "💍🌋🧙",
    hints: ["Основан на книгах Толкина", "Хоббит Фродо несёт кольцо", "Его нужно уничтожить в Роковой горе"] },
];


/* ---------- 3. ИГРА (дальше можно не менять) ---------- */

// Короткая запись: $("id") вместо document.getElementById("id")
const $ = id => document.getElementById(id);

// Состояние игры:
let queue;   // фильмы этой игры (случайные ROUNDS штук)
let index;   // номер текущего фильма
let points;  // набранные очки
let tries;   // сколько ошибок сделано в текущем фильме
let locked;  // true — фильм закончен, ответы больше не принимаются

// Приводит текст к простому виду, чтобы «ШРЕК», «шрек!» и «Шрек» считались одинаковыми
// (убирает регистр, знаки препинания; «ё» = «е»)
function simplify(text) {
  return text.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]/g, "");
}

// Начать новую игру
function startGame() {
  // перемешиваем фильмы и берём первые ROUNDS
  queue = [...MOVIES].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
  index = 0;
  points = 0;

  $("total").textContent = queue.length;
  $("maxScore").textContent = queue.length * MAX_TRIES;

  // список названий для подсказок в поле ввода
  $("titles").innerHTML = "";
  MOVIES.map(m => m.title).sort().forEach(title => {
    const option = document.createElement("option");
    option.value = title;
    $("titles").appendChild(option);
  });

  $("end").classList.add("hidden");   // прячем итоги
  $("play").classList.remove("hidden"); // показываем игру
  showMovie();
}

// Показать текущий фильм
function showMovie() {
  const movie = queue[index];
  tries = 0;
  locked = false;

  $("round").textContent = index + 1;
  $("score").textContent = points;
  $("msg").textContent = "";
  $("answer").value = "";
  $("answer").disabled = false;
  $("submitBtn").disabled = false;
  $("next").classList.add("hidden");

  // картинка, если указана, иначе эмодзи
  if (movie.img) {
    $("frame").innerHTML = `<img src="${movie.img}" alt="Кадр из фильма">`;
  } else {
    $("frame").textContent = movie.emoji;
  }

  showHints();
  $("answer").focus();
}

// Показать подсказки: открытые — текстом, остальные — закрыты
function showHints() {
  const movie = queue[index];
  $("hints").innerHTML = "";

  movie.hints.forEach((hint, i) => {
    const li = document.createElement("li");
    if (i <= tries) {
      li.textContent = hint;                          // открытая
    } else {
      li.textContent = "Откроется после ошибки";      // закрытая (можно поменять текст)
      li.className = "locked";
    }
    $("hints").appendChild(li);
  });
}

// Закончить фильм (угадал или нет)
function finishMovie(won) {
  const movie = queue[index];
  locked = true;

  if (won) {
    const gained = MAX_TRIES - tries;
    points += gained;
    $("msg").textContent = `Верно! Это «${movie.title}». +${gained}`;
    $("msg").className = "msg good";
  } else {
    $("msg").textContent = `Не угадал. Это «${movie.title}».`;
    $("msg").className = "msg bad";
  }

  $("score").textContent = points;
  $("answer").disabled = true;
  $("submitBtn").disabled = true;
  $("next").textContent = (index === queue.length - 1) ? "Результат" : "Дальше";
  $("next").classList.remove("hidden");
  $("next").focus();
}

// Нажатие «Ответить»
$("answerForm").addEventListener("submit", event => {
  event.preventDefault();   // не перезагружать страницу
  if (locked) return;

  const movie = queue[index];

  if (simplify($("answer").value) === simplify(movie.title)) {
    finishMovie(true);                       // угадал
  } else {
    tries++;
    if (tries >= MAX_TRIES) {
      finishMovie(false);                    // попытки закончились
    } else {
      $("msg").textContent = `Неверно. Осталось попыток: ${MAX_TRIES - tries}`;
      $("msg").className = "msg bad";
      $("answer").value = "";
      showHints();                           // открываем новую подсказку
    }
  }
});

// Нажатие «Дальше»
$("next").addEventListener("click", () => {
  index++;
  if (index >= queue.length) {
    showEnd();
  } else {
    showMovie();
  }
});

// Показать итоговый экран
function showEnd() {
  $("play").classList.add("hidden");
  $("end").classList.remove("hidden");
  $("finalScore").textContent = points;

  const max = queue.length * MAX_TRIES;
  // Фразы и пороги (80% и 50%) можно менять:
  if (points >= max * 0.8)      $("verdict").textContent = "Настоящий киноман!";
  else if (points >= max * 0.5) $("verdict").textContent = "Неплохо, но можно лучше.";
  else                          $("verdict").textContent = "Пора пересмотреть классику.";
}

$("again").addEventListener("click", startGame);


/* ---------- ЗАПУСК ---------- */

startGame();

/* КОГДА ГОТОВО API ОТ DJANGO:
   Замени строку startGame(); выше на код ниже.
   Адрес "/api/movies/" уточни у того, кто делает Django.
   Сервер должен вернуть список в том же формате, что и MOVIES выше
   (поля title, emoji или img, hints).

   fetch("/api/movies/")
     .then(response => response.json())
     .then(data => { MOVIES = data; startGame(); });
*/
