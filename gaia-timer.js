/* Gaia's practice timer: 40 minutes each time she opens one of her practice sites.
   Shared by gaia/, gaia-division/ and gaia-test/ (same origin, same storage key).
   Time counts only while a page is open and visible. If she comes back within
   30 minutes the session continues; after a longer break a new session starts. */
(function () {
  "use strict";
  var KEY = "gaia-practice-timer";
  var TOTAL = 40 * 60;               // seconds of practice per session
  var NEW_SESSION_AFTER = 30 * 60e3; // ms away from the sites that starts a new session
  var MAX_STEP = 3e3;                // ignore longer gaps (phone asleep, tab in background)

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function fresh() { return { left: TOTAL, seen: Date.now(), paused: false, done: false, said: {} }; }
  // a new session after a long time without the sites on screen
  function expired(x) { return !x || !x.seen || Date.now() - x.seen > NEW_SESSION_AFTER; }

  var s = load();
  var isNew = expired(s);
  if (isNew) s = fresh();
  s.paused = false;
  s.seen = Date.now();
  save();
  var lastTick = Date.now(); // per page: when this page last counted time

  var css = "" +
    "html body{padding-bottom:calc(max(48px,env(safe-area-inset-bottom,0px)) + 76px)}" +
    "#gt-pill{position:fixed;z-index:50;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));" +
    "display:flex;align-items:center;gap:10px;padding:8px 16px 8px 10px;border-radius:99px;border:2px solid var(--line,#ccc);" +
    "background:var(--surface,#fff);color:var(--ink,#111);font:inherit;font-size:1rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}" +
    "#gt-pill:focus-visible{outline:3px solid var(--accent,#06c);outline-offset:2px}" +
    "#gt-pill svg{flex:none}#gt-pill .gt-track{stroke:var(--surface2,#e5e5e5)}#gt-pill .gt-arc{stroke:var(--accent,#06c);transition:stroke-dashoffset .9s linear}" +
    "#gt-pill .gt-time{font-variant-numeric:tabular-nums;font-weight:700;font-size:1.15rem;direction:ltr;unicode-bidi:isolate}" +
    "#gt-pill .gt-lbl{font-size:.8rem;color:var(--muted,#666);line-height:1.2;text-align:right}" +
    "#gt-pill.paused .gt-arc{stroke:var(--muted,#888)}" +
    "#gt-toast{position:fixed;z-index:51;left:calc(12px + env(safe-area-inset-left,0px));right:calc(12px + env(safe-area-inset-right,0px));" +
    "bottom:calc(76px + env(safe-area-inset-bottom,0px));margin:0 auto;max-width:420px;padding:12px 16px;border-radius:14px;" +
    "background:var(--ink,#111);color:var(--bg,#fff);font-size:1rem;line-height:1.5;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.25);" +
    "transition:opacity .3s,transform .3s}" +
    "#gt-toast[hidden]{display:block!important;opacity:0;transform:translateY(10px);pointer-events:none}" +
    "#gt-done{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(0,0,0,.45);" +
    "padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}" +
    "#gt-done .gt-card{background:var(--surface,#fff);color:var(--ink,#111);border-radius:20px;padding:24px;max-width:420px;width:100%;" +
    "display:flex;flex-direction:column;gap:14px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3)}" +
    "#gt-done h2{margin:0;font-family:var(--display,inherit);font-weight:400;font-size:1.6rem;line-height:1.25}" +
    "#gt-done .gt-big{font-family:var(--display,inherit);font-size:3rem;line-height:1;color:var(--accent,#06c)}" +
    "#gt-done .gt-btns{display:flex;flex-direction:column;gap:10px}" +
    "#gt-done button{font:inherit;cursor:pointer;border-radius:12px;padding:12px 18px;font-size:1.05rem}" +
    "#gt-done .gt-main{background:var(--accent,#06c);color:var(--accent-ink,#fff);border:none;font-family:var(--display,inherit)}" +
    "#gt-done .gt-ghost{background:transparent;color:var(--ink,#111);border:2px solid var(--line,#ccc)}" +
    "@media (prefers-reduced-motion:reduce){#gt-pill .gt-arc,#gt-toast{transition:none}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var R = 15, C = 2 * Math.PI * R;
  var pill = document.createElement("button");
  pill.id = "gt-pill";
  pill.type = "button";
  pill.innerHTML =
    '<svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">' +
    '<circle class="gt-track" cx="19" cy="19" r="' + R + '" fill="none" stroke-width="5"/>' +
    '<circle class="gt-arc" cx="19" cy="19" r="' + R + '" fill="none" stroke-width="5" stroke-linecap="round"' +
    ' stroke-dasharray="' + C.toFixed(2) + '" transform="rotate(-90 19 19)"/></svg>' +
    '<span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px"><span class="gt-time"></span><span class="gt-lbl"></span></span>';
  var toast = document.createElement("div");
  toast.id = "gt-toast";
  toast.setAttribute("role", "status");
  toast.hidden = true;
  document.body.appendChild(toast);
  document.body.appendChild(pill);

  var timeEl = pill.querySelector(".gt-time"), lblEl = pill.querySelector(".gt-lbl"), arc = pill.querySelector(".gt-arc");
  function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); var m = Math.floor(sec / 60), x = sec % 60; return m + ":" + (x < 10 ? "0" : "") + x; }

  var toastTimer = null;
  function say(text, ms) {
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, ms || 6000);
  }

  function render() {
    if (s.done) {
      timeEl.textContent = "40:00";
      lblEl.textContent = "סיימת להיום!";
      arc.style.strokeDashoffset = "0";
      pill.classList.remove("paused");
      pill.setAttribute("aria-label", "סיימת 40 דקות של תרגול");
      return;
    }
    timeEl.textContent = mmss(s.left);
    lblEl.textContent = s.paused ? "בהפסקה. לחצי להמשך" : "נשארו לתרגול";
    arc.style.strokeDashoffset = (C * (1 - s.left / TOTAL)).toFixed(2); // full ring = all 40 minutes left
    pill.classList.toggle("paused", s.paused);
    pill.setAttribute("aria-label", s.paused ? "הטיימר בהפסקה, נשארו " + mmss(s.left) + ". לחצי כדי להמשיך" : "נשארו " + mmss(s.left) + " דקות לתרגול. לחצי להפסקה");
  }

  function finish() {
    s.done = true; s.left = 0; save(); render();
    var o = document.createElement("div");
    o.id = "gt-done";
    o.innerHTML = '<div class="gt-card" role="dialog" aria-modal="true" aria-labelledby="gt-h">' +
      '<div class="gt-big">40:00</div>' +
      '<h2 id="gt-h">כל הכבוד גאיה! סיימת 40 דקות של תרגול</h2>' +
      '<p style="margin:0">אבי ממש גאה בך. אפשר לנוח עכשיו, או להמשיך עוד קצת אם בא לך.</p>' +
      '<div class="gt-btns"><button class="gt-main" id="gt-rest">סיימתי להיום</button>' +
      '<button class="gt-ghost" id="gt-more">להמשיך לתרגל</button>' +
      '<button class="gt-ghost" id="gt-again">להתחיל עוד 40 דקות</button></div></div>';
    document.body.appendChild(o);
    var close = function () { o.remove(); pill.focus({ preventScroll: true }); };
    o.querySelector("#gt-rest").onclick = function () { close(); say("נתראה בפעם הבאה, גאיה! אבי שולח חיבוק.", 7000); };
    o.querySelector("#gt-more").onclick = close;
    o.querySelector("#gt-again").onclick = function () { s = fresh(); save(); render(); close(); say("יאללה, עוד 40 דקות! בהצלחה גאיה.", 5000); };
    o.querySelector("#gt-rest").focus({ preventScroll: true });
  }

  pill.onclick = function () {
    if (s.done) { say("סיימת 40 דקות היום. כל הכבוד, גאיה!", 5000); return; }
    s.paused = !s.paused; s.seen = Date.now(); save(); render();
    say(s.paused ? "הטיימר בהפסקה. כשתחזרי, לחצי עליו כדי להמשיך." : "ממשיכים! בהצלחה גאיה.", 4000);
  };

  function tick() {
    var now = Date.now();
    var step = Math.min(MAX_STEP, now - lastTick);
    lastTick = now;
    if (document.visibilityState !== "visible") return; // only time on screen counts
    s.seen = now;
    if (!s.done && !s.paused && step > 0) {
      s.left -= step / 1000;
      var said = s.said || (s.said = {});
      if (s.left <= TOTAL / 2 && !said.half) { said.half = 1; say("עברו 20 דקות, נשארו עוד 20. את מעולה, גאיה!", 7000); }
      if (s.left <= 5 * 60 && !said.five) { said.five = 1; say("עוד 5 דקות וסיימת! אבי מעודד מהצד.", 7000); }
      if (s.left <= 0) { finish(); return; }
    }
    save();
    render();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      // pick up time used in her other practice sites; after a long break, start a new session
      var shared = load();
      if (expired(shared)) { s = fresh(); say("ברוכה השבה, גאיה! טיימר חדש: 40 דקות של תרגול.", 6000); }
      else { var p = s.paused; s = shared; s.paused = p; }
      s.seen = Date.now(); lastTick = Date.now(); save(); render();
    } else { s.seen = Date.now(); save(); }
  });

  render();
  if (s.done) say("כבר סיימת 40 דקות היום. כל מה שתעשי עכשיו זה בונוס!", 6000);
  else if (isNew) say("הטיימר התחיל: 40 דקות של תרגול. בהצלחה גאיה!", 6000);
  else say("ממשיכים מאיפה שעצרת. נשארו " + mmss(s.left) + " דקות.", 5000);
  setInterval(tick, 1000);
})();
