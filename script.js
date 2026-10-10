const MENUS = [
  { id: "ayam",   name: "Ayam Suwir",   price: 12000, cat: "darat",  tag: "Terlaris", desc: "Suwiran ayam bumbu kari, nasi pulen berempah, sambal hijau." },
  { id: "tempe",  name: "Tempe Orek",   price: 10000, cat: "nabati", desc: "Tempe orek manis pedas berpadu nasi gurih berbalut daun pisang." },
  { id: "tongkol",name: "Ikan Tongkol", price: 13000, cat: "laut",   tag: "Pedas", hot: true, desc: "Tongkol bumbu pedas yang meresap, dengan kemangi segar." },
  { id: "kornet", name: "Keju Kornet",  price: 14000, cat: "darat",  desc: "Kornet sapi gurih dan keju meleleh di dalam nasi bakar." },
  { id: "cumi",   name: "Cumi Hitam",   price: 15000, cat: "laut",   desc: "Cumi segar dimasak dengan tintanya, bumbu pesisir yang pekat." },
  { id: "jamur",  name: "Jamur Tiram",  price: 11000, cat: "nabati", desc: "Jamur tiram tumis lada hitam, kenyal dan gurih." }
];

const WA_NUMBER = "6281234567890"; // ganti dengan nomor asli
const KATERING_MIN = 50;
const STORE_KEY = "nasbak-cart-v1";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rp = n => "Rp " + n.toLocaleString("id-ID");

/* ---------- state ---------- */
let cart = {};
try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { cart = {}; }
let orderType = "Satuan";

const totalQty = () => Object.values(cart).reduce((a, b) => a + b, 0);
const totalPrice = () => MENUS.reduce((s, m) => s + (cart[m.id] || 0) * m.price, 0);

function setQty(id, q) {
  q = Math.max(0, Math.min(999, q));
  if (q === 0) delete cart[id]; else cart[id] = q;
  localStorage.setItem(STORE_KEY, JSON.stringify(cart));
  render();
}

/* ---------- board ---------- */
const board = $("#board");
board.innerHTML = MENUS.map(m => `
  <li class="item" data-id="${m.id}" data-cat="${m.cat}">
    <div>
      <h3>${m.name}${m.tag ? `<span class="tag${m.hot ? " hot" : ""}">${m.tag}</span>` : ""}</h3>
      <p>${m.desc}</p>
    </div>
    <span class="price">${rp(m.price)}</span>
    <div class="stepper" aria-label="Jumlah ${m.name}">
      <button class="dec" aria-label="Kurangi ${m.name}" id="dec-${m.id}">−</button>
      <output id="q-${m.id}">0</output>
      <button class="inc" aria-label="Tambah ${m.name}" id="inc-${m.id}">+</button>
    </div>
  </li>`).join("");

board.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.closest(".item").dataset.id;
  const cur = cart[id] || 0;
  if (btn.classList.contains("inc")) {
    setQty(id, cur + 1);
    if (cur === 0) toast(`${MENUS.find(m => m.id === id).name} masuk pesanan`);
  } else setQty(id, cur - 1);
});

/* filters */
$$(".chip").forEach(chip => chip.addEventListener("click", () => {
  $$(".chip").forEach(c => c.classList.toggle("is-on", c === chip));
  const f = chip.dataset.filter;
  $$(".item").forEach(it => it.classList.toggle("hidden", f !== "all" && it.dataset.cat !== f));
}));

/* ---------- render ---------- */
const countEl = $("#cart-count");
let lastQty = -1;

function render() {
  const q = totalQty(), t = totalPrice();

  MENUS.forEach(m => {
    const n = cart[m.id] || 0;
    const li = $(`.item[data-id="${m.id}"]`);
    li.classList.toggle("in-cart", n > 0);
    $(".stepper", li).classList.toggle("zero", n === 0);
    $(`#q-${m.id}`).textContent = n;
  });

  countEl.textContent = q;
  if (lastQty !== -1 && q !== lastQty) { countEl.classList.remove("bump"); void countEl.offsetWidth; countEl.classList.add("bump"); }
  lastQty = q;

  $("#dock-qty").textContent = `${q} bungkus`;
  $("#dock-total").textContent = rp(t);
  $("#dock").classList.toggle("show", q > 0 && !drawer.classList.contains("on"));

  // receipt
  const items = MENUS.filter(m => cart[m.id]);
  $("#r-items").innerHTML = items.map(m => `
    <li>
      <span>${cart[m.id]}× ${m.name}</span><span>${rp(cart[m.id] * m.price)}</span>
      <small>@ ${rp(m.price)}</small><button class="rm" data-rm="${m.id}" type="button">hapus</button>
    </li>`).join("");
  $("#r-empty").style.display = items.length ? "none" : "block";
  $("#r-total").textContent = rp(t);

  // type rules
  const hint = $("#type-hint");
  if (orderType === "Katering" && q < KATERING_MIN) hint.textContent = `Katering minimal ${KATERING_MIN} porsi, kurang ${KATERING_MIN - q} lagi.`;
  else if (orderType === "Satuan" && q >= KATERING_MIN) hint.textContent = `Sudah ${q} porsi, pilih Katering untuk harga khusus.`;
  else hint.textContent = "";

  $("#btn-wa").disabled = q === 0 || (orderType === "Katering" && q < KATERING_MIN);
}

$("#r-items").addEventListener("click", e => {
  const id = e.target.dataset.rm;
  if (id) setQty(id, 0);
});

$$('input[name="otype"]').forEach(r => r.addEventListener("change", () => { orderType = r.value; render(); }));

/* ---------- drawer ---------- */
const drawer = $("#drawer"), scrim = $("#scrim");
function openDrawer() {
  drawer.classList.add("on"); scrim.classList.add("on");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  render();
  setTimeout(() => $("#cart-close").focus(), 300);
}
function closeDrawer() {
  drawer.classList.remove("on"); scrim.classList.remove("on");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  render();
}
$("#cart-open").addEventListener("click", openDrawer);
$("#dock").addEventListener("click", openDrawer);
$("#cart-close").addEventListener("click", closeDrawer);
scrim.addEventListener("click", closeDrawer);
$("#r-empty-link").addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("on")) closeDrawer(); });

$("#catering-btn").addEventListener("click", () => {
  $("#t-katering").checked = true; orderType = "Katering";
  if (totalQty() === 0) {
    toast("Pilih varian dulu, lalu atur jumlahnya");
    $("#menu").scrollIntoView();
  } else openDrawer();
  render();
});

/* ---------- submit ---------- */
const fName = $("#f-name");
fName.addEventListener("input", () => fName.closest(".field").classList.remove("bad"));

$("#order-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = fName.value.trim();
  const note = $("#f-note").value.trim();
  if (!name) {
    const f = fName.closest(".field");
    f.classList.remove("bad"); void f.offsetWidth; f.classList.add("bad");
    fName.focus();
    return;
  }
  const items = MENUS.filter(m => cart[m.id]);
  const pad = s => s.padEnd(8, " ");
  let msg = `Halo Nasbak.Java, saya mau pesan:\n\n`;
  msg += `${pad("Nama")}: ${name}\n${pad("Jenis")}: ${orderType}\n\n`;
  items.forEach(m => { msg += `• ${cart[m.id]}x ${m.name} — ${rp(cart[m.id] * m.price)}\n`; });
  msg += `\nTotal ${totalQty()} bungkus · Estimasi ${rp(totalPrice())}\n`;
  if (note) msg += `Catatan: ${note}\n`;
  msg += `\nMohon dikonfirmasi. Terima kasih.`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});

/* ---------- misc ---------- */
let toastT;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 1800);
}

$("#r-date").textContent = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 10), { passive: true });

// reveal on scroll
const io = new IntersectionObserver(es => es.forEach((en, i) => {
  if (en.isIntersecting) { setTimeout(() => en.target.classList.add("in"), i * 80); io.unobserve(en.target); }
}), { threshold: .15 });
$$(".reveal").forEach(el => io.observe(el));

// marquee strip: auto-scroll + drag/swipe
(() => {
  const strip = $(".strip"), track = $(".strip-track");
  let x = 0, half = track.scrollWidth / 2, drag = false, lastX = 0, vel = 0;
  const speed = 0.5;
  addEventListener("resize", () => half = track.scrollWidth / 2);
  document.fonts?.ready.then(() => half = track.scrollWidth / 2);
  strip.addEventListener("pointerdown", e => { drag = true; lastX = e.clientX; vel = 0; strip.classList.add("dragging"); strip.setPointerCapture(e.pointerId); });
  strip.addEventListener("pointermove", e => { if (!drag) return; const d = e.clientX - lastX; lastX = e.clientX; x += d; vel = d; });
  const end = () => { drag = false; strip.classList.remove("dragging"); };
  strip.addEventListener("pointerup", end);
  strip.addEventListener("pointercancel", end);
  (function tick() {
    if (!drag) { vel *= 0.94; x += vel - speed; }
    if (x <= -half) x += half;
    if (x > 0) x -= half;
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(tick);
  })();
})();

// subtle parallax on the leaf
const leaf = $("#leaf");
if (matchMedia("(pointer:fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  addEventListener("mousemove", e => {
    const x = (e.clientX / innerWidth - .5) * 14, y = (e.clientY / innerHeight - .5) * 14;
    leaf.style.transform = `translate(${x}px, ${y}px) rotate(${x * .3}deg)`;
  }, { passive: true });
}

render();
