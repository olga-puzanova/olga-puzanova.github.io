// Эффекты при прокрутке: фраза проявляется по словам, блоки всплывают,
// цифры считаются, фото на первом экране медленно уезжает.
// Если в системе включено «уменьшить движение», всё показывается сразу.
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. Блоки плавно всплывают
const io = new IntersectionObserver(
  (es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(
  ".sec-head, .gallery figure, .amen, .card-img, .price, .extras, .rules > div, .reviews blockquote, .road > *, .faq"
).forEach((el, i) => {
  el.classList.add("rv");
  el.style.transitionDelay = (i % 4) * 80 + "ms";
  if (reduce) el.classList.add("in"); else io.observe(el);
});

// 2. Фраза проявляется слово за словом
const rev = document.getElementById("reveal");
const HL = ["камина,", "чаном", "светиться."]; // слова с подсветкой
// Делим только по обычным пробелам: «над чаном», склеенные неразрывным пробелом,
// остаются одним куском, а подсвечивается только нужное слово внутри.
rev.innerHTML = rev.textContent.trim().split(/[ \t\r\n]+/)
  .map((w) => `<span class="w">${w.split("\u00a0").map((p) => (HL.includes(p) ? `<span class="hl">${p}</span>` : p)).join("&nbsp;")}</span>`)
  .join(" ");
const words = [...rev.querySelectorAll(".w")];

// 3. Фото первого экрана уезжает медленнее страницы
const heroImg = document.querySelector(".hero > img");

function onScroll() {
  const vh = innerHeight;
  const r = rev.getBoundingClientRect();
  const p = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
  const n = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle("on", i < n));
  if (!reduce && scrollY < vh * 1.2) heroImg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.06)`;
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// 4. Счётчики в полосе цифр
const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const el = e.target, to = +el.dataset.to, dec = el.dataset.dec ? +el.dataset.dec : 0;
  const pre = el.dataset.pre || "", suf = el.dataset.suf || "";
  // все пробелы в цифрах неразрывные: «от 14 000 ₽» не разорвётся
  const show = (v) => (el.textContent = (pre + (dec ? v.toFixed(dec).replace(".", ",") : Math.round(v).toLocaleString("ru-RU")) + suf).replace(/[ \u202f]/g, "\u00a0"));
  cio.unobserve(el);
  if (reduce) return show(to);
  const t0 = performance.now(), dur = 1100;
  (function step(t) {
    const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
    show(to * ease);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}), { threshold: 0.6 });
document.querySelectorAll("[data-to]").forEach((el) => cio.observe(el));
