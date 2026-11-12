// Окно брони: календарь со свободными датами и ценой на каждый день.
// Цена ночи зависит от дня заезда: будни дешевле, пятница и суббота дороже, праздники ещё дороже.

// ===== Настройки (меняются здесь) =====
const PRICE = { weekday: 14000, sunday: 16000, friday: 18000, saturday: 20000, holiday: 24000, newYear: 30000 };
const BASE_GUESTS = 8;        // сколько гостей входит в цену
const MAX_GUESTS = 10;
const EXTRA_GUEST = 1500;     // за 9-го и 10-го гостя в сутки
const CHAN = 3000;            // чан за вечер
const LONG_STAY = { nights: 3, discount: 0.1 }; // от 3 ночей скидка 10%
const MONTHS_AHEAD = 6;
const PHONE_WA = "79000000000"; // номер владельца для WhatsApp (вымышленный)
// Праздники (месяц-день). 31 декабря — отдельная цена.
const HOLIDAYS = ["12-30", "12-31", "01-01", "01-02", "01-03", "01-04", "01-05", "01-06", "01-07", "02-22", "03-07", "05-01", "05-08", "06-11", "11-03"];

const MONTH_NAMES = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const MONTH_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const $ = (id) => document.getElementById(id);
const NB = "\u00a0"; // неразрывный пробел
const fmt = (n) => n.toLocaleString("ru-RU").replace(/[\s\u202f]/g, NB) + NB + "₽";
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const md = (d) => key(d).slice(5);
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

// Тип и цена ночи
function nightType(d) {
  if (md(d) === "12-31") return "newYear";
  if (HOLIDAYS.includes(md(d))) return "holiday";
  return ["sunday", "weekday", "weekday", "weekday", "weekday", "friday", "saturday"][d.getDay()];
}
function nightPrice(d) { return PRICE[nightType(d)]; }
function dayClass(d) {
  const t = nightType(d);
  if (t === "holiday" || t === "newYear") return "hol";
  if (t === "friday" || t === "saturday") return "we";
  return "wd";
}

// Занятые даты. На настоящем сайте их берут из таблицы владельца,
// здесь — примерные: выходные заняты чаще, чем будни.
function isBusy(d) {
  const s = key(d);
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const weekend = d.getDay() === 5 || d.getDay() === 6;
  return h % 100 < (weekend ? 45 : 14);
}

// ===== Состояние =====
let offset = 0;          // сдвиг месяцев от текущего
let checkIn = null;
let checkOut = null;

function monthsPerView() { return window.matchMedia("(max-width: 640px)").matches ? 1 : 2; }

function render() {
  const box = $("months");
  box.innerHTML = "";
  const per = monthsPerView();
  for (let m = 0; m < per; m++) {
    const first = new Date(today.getFullYear(), today.getMonth() + offset + m, 1);
    const wrap = document.createElement("div");
    wrap.className = "month";
    wrap.innerHTML = `<h4>${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}</h4>`;
    const grid = document.createElement("div");
    grid.className = "grid7";
    WD.forEach((w) => (grid.innerHTML += `<span class="wdn">${w}</span>`));
    const pad = (first.getDay() + 6) % 7;
    for (let i = 0; i < pad; i++) grid.innerHTML += `<span class="day empty"></span>`;
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= days; i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), i);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "day " + dayClass(d);
      const past = d < today;
      // день выезда может быть «занят» для заезда, но выехать в него можно
      const canCheckout = checkIn && !checkOut && d > checkIn && rangeFree(checkIn, d);
      b.disabled = past || (isBusy(d) && !canCheckout);
      b.innerHTML = `${i}<small>${fmt(nightPrice(d)).replace(NB + "₽", "")}</small>`;
      b.title = b.disabled ? "Занято" : `${i} ${MONTH_GEN[d.getMonth()]}: ${fmt(nightPrice(d))} за ночь`;
      if (checkIn && key(d) === key(checkIn)) b.classList.add("edge");
      if (checkOut && key(d) === key(checkOut)) b.classList.add("edge");
      if (checkIn && checkOut && d > checkIn && d < checkOut) b.classList.add("in-range");
      b.addEventListener("click", () => pick(d));
      grid.appendChild(b);
    }
    wrap.appendChild(grid);
    box.appendChild(wrap);
  }
  $("prev").disabled = offset === 0;
  $("next").disabled = offset + per > MONTHS_AHEAD;
  summary();
}

// Все ночи между заездом и выездом свободны?
function rangeFree(a, b) {
  for (let d = a; d < b; d = addDays(d, 1)) if (isBusy(d)) return false;
  return true;
}

function pick(d) {
  if (!checkIn || checkOut || d <= checkIn) {
    checkIn = d; checkOut = null;
    $("hint").textContent = `Теперь нажмите на${NB}день выезда`;
  } else if (rangeFree(checkIn, d)) {
    checkOut = d;
    $("hint").textContent = `Готово. Проверьте сумму и${NB}отправьте заявку`;
  } else {
    checkIn = d; checkOut = null;
    $("hint").textContent = "Между датами есть занятые дни. Выберите заезд заново";
  }
  render();
}

function calc() {
  if (!checkIn || !checkOut) return null;
  const guests = +$("guests").value;
  const rows = {};
  let nights = 0, sum = 0;
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    const p = nightPrice(d);
    rows[p] = (rows[p] || 0) + 1;
    sum += p; nights++;
  }
  const extraG = Math.max(0, guests - BASE_GUESTS) * EXTRA_GUEST * nights;
  const chan = $("chan").checked ? CHAN * nights : 0;
  const disc = nights >= LONG_STAY.nights ? Math.round(sum * LONG_STAY.discount) : 0;
  return { guests, rows, nights, sum, extraG, chan, disc, total: sum + extraG + chan - disc };
}

const dateText = (d) => `${d.getDate()}${NB}${MONTH_GEN[d.getMonth()]}`;
const guestsWord = (n) => (n % 10 === 1 && n % 100 !== 11 ? "гость" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "гостя" : "гостей");
const nightsWord = (n) => (n % 10 === 1 && n % 100 !== 11 ? "ночь" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "ночи" : "ночей");

function summary() {
  const s = $("summary");
  const c = calc();
  const tg = $("tg"), wa = $("wa");
  if (!c) {
    s.innerHTML = `<span class="empty-sum">Выберите даты${NB}— здесь появится цена.</span>`;
    [tg, wa].forEach((a) => { a.setAttribute("aria-disabled", "true"); a.removeAttribute("href"); });
    return;
  }
  let html = `<div class="row"><span>${dateText(checkIn)}${NB}— ${dateText(checkOut)}</span><span>${c.nights}${NB}${nightsWord(c.nights)}, ${c.guests}${NB}${guestsWord(c.guests)}</span></div>`;
  Object.keys(c.rows).sort((a, b) => a - b).forEach((p) => {
    html += `<div class="row"><span>${fmt(+p)}${NB}×${NB}${c.rows[p]}</span><span>${fmt(p * c.rows[p])}</span></div>`;
  });
  if (c.extraG) html += `<div class="row"><span>Гости сверх${NB}${BASE_GUESTS}</span><span>${fmt(c.extraG)}</span></div>`;
  if (c.chan) html += `<div class="row"><span>Чан</span><span>${fmt(c.chan)}</span></div>`;
  if (c.disc) html += `<div class="row"><span>Скидка от${NB}${LONG_STAY.nights}${NB}ночей</span><span>−${fmt(c.disc)}</span></div>`;
  html += `<div class="row total"><span>Итого</span><span>${fmt(c.total)}</span></div>`;
  s.innerHTML = html;

  const text =
    `Здравствуйте! Хочу забронировать дом «Северное сияние».\n` +
    `Даты: ${dateText(checkIn)}${NB}— ${dateText(checkOut)} (${c.nights}${NB}${nightsWord(c.nights)})\n` +
    `Гостей: ${c.guests}\nЧан: ${c.chan ? "да" : "нет"}\nСумма по сайту: ${fmt(c.total)}`;
  tg.href = `https://t.me/share/url?url=${encodeURIComponent(" ")}&text=${encodeURIComponent(text)}`;
  wa.href = `https://wa.me/${PHONE_WA}?text=${encodeURIComponent(text)}`;
  [tg, wa].forEach((a) => a.removeAttribute("aria-disabled"));
}

// ===== Открыть / закрыть =====
const modal = $("modal");
let lastFocus = null;
// Экран «Спасибо» после нажатия на Telegram или WhatsApp
function showThanks(where) {
  const c = calc();
  $("thanks-text").textContent =
    `Отправьте сообщение в${NB}открывшемся ${where}. Мы${NB}ответим в${NB}течение 15${NB}минут, подтвердим даты и${NB}пришлём реквизиты для${NB}предоплаты.`;
  $("thanks-sum").textContent = c
    ? `${dateText(checkIn)}${NB}— ${dateText(checkOut)}, ${c.guests}${NB}${guestsWord(c.guests)}, ${fmt(c.total)}`
    : "";
  document.querySelector(".modal-box").classList.add("sent");
  $("thanks").hidden = false;
  $("thanks-close").focus();
}
function hideThanks() {
  document.querySelector(".modal-box").classList.remove("sent");
  $("thanks").hidden = true;
}

function open() {
  lastFocus = document.activeElement;
  hideThanks();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  render();
  $("close").focus();
}
function close() {
  modal.hidden = true;
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

for (let i = 1; i <= MAX_GUESTS; i++) $("guests").innerHTML += `<option ${i === 6 ? "selected" : ""}>${i}</option>`;
document.querySelectorAll("[data-book]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(); }));
$("close").addEventListener("click", close);
modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });
$("prev").addEventListener("click", () => { offset = Math.max(0, offset - monthsPerView()); render(); });
$("next").addEventListener("click", () => { offset += monthsPerView(); render(); });
$("tg").addEventListener("click", () => { if ($("tg").href) setTimeout(() => showThanks("чате Telegram"), 300); });
$("wa").addEventListener("click", () => { if ($("wa").href) setTimeout(() => showThanks("чате WhatsApp"), 300); });
$("thanks-close").addEventListener("click", close);
$("thanks-back").addEventListener("click", () => { hideThanks(); $("close").focus(); });
$("guests").addEventListener("change", summary);
$("chan").addEventListener("change", summary);
window.addEventListener("resize", () => { if (!modal.hidden) render(); });

// Шапка становится плотной при прокрутке
const header = document.querySelector(".top");
const sticky = document.querySelector(".sticky");
window.addEventListener("scroll", () => {
  header.classList.toggle("solid", window.scrollY > 60);
  sticky.classList.toggle("show", window.scrollY > window.innerHeight * 0.8);
}, { passive: true });
