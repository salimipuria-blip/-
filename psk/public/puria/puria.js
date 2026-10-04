const copy = {
  en: {
    nav: ["Work", "Services", "About", "Contact"], eyebrow: "International creative partner",
    line1: "Crafting", line2: "meaning.", line3: "Moving people.",
    intro: "Strategy-led stories for premium lifestyle brands — from first idea to final frame.",
    explore: "Scroll to explore", cta: "Start a project", services: "Expertise",
    servicesLead: "One creative direction. Every frame connected.", work: "Selected work",
    workLead: "Fashion, fragrance, hospitality and culture — built to be remembered.", about: "About Puria",
    aboutCopy: "I combine strategic thinking, cinematic production and fast-moving culture to create content that earns attention and trust.",
    roles: ["Content strategy", "Cinematography", "Editing", "Photography", "Social direction"],
    close: "Let’s make your brand impossible to ignore.", availability: "Available worldwide", whatsapp: "WhatsApp",
    message: "Hi Puria, I'd like to discuss a content project.",
  },
  fa: {
    nav: ["نمونه‌کار", "خدمات", "درباره من", "ارتباط"], eyebrow: "همراه خلاق برندهای بین‌المللی",
    line1: "ساختن", line2: "معنا.", line3: "حرکت دادن آدم‌ها.",
    intro: "روایت‌های استراتژیک برای برندهای ممتاز؛ از اولین ایده تا آخرین فریم.",
    explore: "برای دیدن اسکرول کن", cta: "شروع همکاری", services: "تخصص‌ها",
    servicesLead: "یک مسیر خلاق؛ تمام فریم‌ها هماهنگ.", work: "نمونه‌کارهای منتخب",
    workLead: "مد، عطر، مهمان‌نوازی و فرهنگ؛ محتوایی که در ذهن می‌ماند.", about: "درباره پوریا",
    aboutCopy: "تفکر استراتژیک، تولید سینمایی و شناخت فرهنگ روز را ترکیب می‌کنم تا محتوایی بسازم که توجه و اعتماد می‌گیرد.",
    roles: ["استراتژی محتوا", "فیلم‌برداری", "تدوین", "عکاسی", "مدیریت محتوا"],
    close: "برندت را به چیزی تبدیل کنیم که نشود نادیده‌اش گرفت.", availability: "آماده همکاری بین‌المللی", whatsapp: "واتساپ",
    message: "سلام پوریا، برای همکاری در تولید محتوا پیام می‌دهم.",
  },
};
const WA_ICON = '<svg class="icon" viewBox="0 0 448 512" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>';
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const site = document.getElementById("site"), photo = document.getElementById("photo");
const chapters = [...document.querySelectorAll(".chapter[data-center]")], finalChapter = document.getElementById("finalChapter");
const jumps = [.48, .25, .7, .92];
let lang = "en", progress = 0, raf = 0;

const jumpTo = (position) => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: max * position, behavior: "smooth" });
};

function renderLang() {
  const t = copy[lang], isFa = lang === "fa";
  site.className = isFa ? "site fa" : "site";
  site.dir = isFa ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t[el.dataset.t]; });
  document.getElementById("nav").replaceChildren(...t.nav.map((item, i) => {
    const b = document.createElement("button"); b.textContent = item; b.onclick = () => jumpTo(jumps[i]); return b;
  }));
  document.getElementById("roles").innerHTML = t.roles.map((r, i) => `<li><span>0${i + 1}</span><strong>${r}</strong></li>`).join("");
  const href = `https://wa.me/989127038177?text=${encodeURIComponent(t.message)}`;
  document.querySelectorAll("a.wa").forEach((a) => { a.href = href; });
  document.getElementById("langEn").classList.toggle("active", !isFa);
  document.getElementById("langFa").classList.toggle("active", isFa);
}

function renderProgress() {
  const scale = 1 + progress * 4.35;
  const rotateY = Math.sin(progress * Math.PI * 1.65) * 5.5;
  const rotateX = Math.sin(progress * Math.PI) * -1.4;
  const x = Math.sin(progress * Math.PI * 2) * 2.2;
  const y = progress * -3;
  photo.style.transform = `perspective(1500px) translate3d(${x}vw, ${y}vh, 0) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`;
  photo.style.transformOrigin = "52% 40%";
  for (const el of chapters) {
    const center = +el.dataset.center, width = +el.dataset.width;
    const opacity = clamp(1 - Math.abs(progress - center) / width);
    el.style.opacity = opacity;
    el.style.transform = `translate3d(0, ${(progress - center) * -120}px, 0)`;
    el.style.pointerEvents = opacity > .72 ? "auto" : "none";
  }
  finalChapter.style.opacity = clamp((progress - .8) / .1);
  finalChapter.style.transform = `translate3d(0, ${Math.max(0, .9 - progress) * 120}px, 0)`;
  finalChapter.style.pointerEvents = progress > .87 ? "auto" : "none";
  document.getElementById("railFill").style.transform = `scaleY(${progress})`;
  document.getElementById("railNum").textContent = String(Math.round(progress * 100)).padStart(2, "0");
}

function update() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress = max > 0 ? clamp(window.scrollY / max) : 0;
    renderProgress();
  });
}

document.querySelectorAll(".wa-icon").forEach((el) => { el.outerHTML = WA_ICON; });
document.getElementById("toTop").onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
document.getElementById("scrollCue").onclick = () => jumpTo(.25);
document.getElementById("langEn").onclick = () => { lang = "en"; renderLang(); };
document.getElementById("langFa").onclick = () => { lang = "fa"; renderLang(); };
window.addEventListener("scroll", update, { passive: true });
window.addEventListener("resize", update);
renderLang();
update();
