/* Gaia's daily practice, shared by gaia/, gaia-division/ and gaia-test/ (same origin, shared storage):
   - today's mission: 2 levels a day, chosen from her results (unfinished first, then the weakest level, then new ones)
   - a 40-minute timer each time she opens a site (time counts only while a page is on screen;
     back within 30 minutes = same session). If time runs out before the mission is done, she keeps going.
   - a day-by-day log for Avi.
   Load it in <head> (not deferred): the pages call window.GaiaDaily while they render. */
(function () {
  "use strict";
  var TKEY = "gaia-practice-timer", DKEY = "gaia-daily-v1";
  var TOTAL = 40 * 60, NEW_SESSION_AFTER = 30 * 60e3, MAX_STEP = 3e3, GOAL = 2;
  var SITES = {
    fractions: { name: "שברים", path: "../gaia/", key: "fractions-journey-v1",
      levels: ["מה החלק הצבוע?", "מונה ומכנה", "מי גדול יותר?", "שברים שקולים", "צמצום שברים", "חיבור וחיסור, מכנה זהה", "מספרים מעורבים", "מכנים שונים", "כפל שברים", "חילוק ואתגרים"] },
    division: { name: "חילוק ארוך", path: "../gaia-division/", key: "division-journey-v1",
      levels: ["חילוק בלוח הכפל", "חילוק עם שארית", "דו־ספרתי, צעד אחרי צעד", "כשנשאר משהו באמצע", "שארית בסוף", "תלת־ספרתי", "כשהספרה הראשונה קטנה", "זהירות, אפסים!", "ארבע ספרות", "מחלק דו־ספרתי"] }
  };

  function get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- her level, from what she has done in each site ---------- */
  function levelInfo(site) {
    var prog = get(SITES[site].key) || {};
    return SITES[site].levels.map(function (_, l) {
      var answered = 0, first = 0;
      for (var i = 0; i < 10; i++) { var v = prog[l + "-" + i]; if (v) answered++; if (v === 1) first++; }
      return { answered: answered, first: first, done: answered === 10 };
    });
  }

  // Today's levels: one she left in the middle, then her weakest finished level, then new levels
  function plan() {
    var info = { fractions: levelInfo("fractions"), division: levelInfo("division") };
    var items = [];
    function add(s, l, kind, why) {
      if (items.length >= GOAL) return;
      if (items.some(function (x) { return x.site === s && x.level === l; })) return;
      items.push({ site: s, level: l, kind: kind, first: info[s][l].first, why: why || "" });
    }
    Object.keys(info).forEach(function (s) {
      info[s].forEach(function (x, l) { if (x.answered > 0 && !x.done) add(s, l, "continue"); });
    });
    var weak = [];
    Object.keys(info).forEach(function (s) {
      info[s].forEach(function (x, l) { if (x.done && x.first < 7) weak.push({ s: s, l: l, f: x.first }); });
    });
    weak.sort(function (a, b) { return a.f - b.f; });
    if (weak.length) add(weak[0].s, weak[0].l, "review");
    var doneCount = function (s) { return info[s].filter(function (x) { return x.done; }).length; };
    var inPlan = function (s) { return items.some(function (x) { return x.site === s; }) ? 1 : 0; };
    var order = Object.keys(info).sort(function (a, b) { return doneCount(a) - doneCount(b) || inPlan(a) - inPlan(b); });
    var frontier = function (s) { return info[s].findIndex(function (x) { return !x.done; }); };
    order.forEach(function (s) { var f = frontier(s); if (f >= 0 && info[s][f].answered === 0) add(s, f, "new"); });
    order.forEach(function (s) { var f = frontier(s); if (f >= 0 && f + 1 < 10 && info[s][f + 1].answered === 0) add(s, f + 1, "new"); });
    if (items.length < GOAL) { // everything is done: practice where she can still improve
      var all = [];
      Object.keys(info).forEach(function (s) { info[s].forEach(function (x, l) { all.push({ s: s, l: l, f: x.first }); }); });
      all.sort(function (a, b) { return a.f - b.f; });
      all.forEach(function (x) { add(x.s, x.l, "review"); });
    }
    return items;
  }

  /* ---------- the day record ---------- */
  function data() {
    var d = get(DKEY) || { days: {} };
    var t = dayKey();
    if (!d.days[t]) {
      d.days[t] = { mission: plan(), done: [], secs: 0, missionAt: null };
      var keys = Object.keys(d.days).sort();
      while (keys.length > 60) delete d.days[keys.shift()];
      put(DKEY, d);
    }
    return d;
  }
  function today() { return data().days[dayKey()]; }
  function itemDone(day, it) { return day.done.some(function (x) { return x.site === it.site && x.level === it.level; }); }
  function doneCount(day) { return day.mission.filter(function (it) { return itemDone(day, it); }).length; }
  function missionDone(day) { return doneCount(day) >= day.mission.length; }
  function nextItem(day) { return day.mission.filter(function (it) { return !itemDone(day, it); })[0]; }
  function itemName(it) { return SITES[it.site].name + " · שלב " + (it.level + 1) + ": " + SITES[it.site].levels[it.level]; }
  function itemHref(it) { return SITES[it.site].path + "#L" + (it.level + 1); }
  function mins(secs) { return Math.max(0, Math.round(secs / 60)); }

  var KIND = { "continue": "להמשיך", review: "חיזוק", "new": "חדש" };
  function why(it) {
    if (it.kind === "continue") return "התחלת אותו ועוד לא סיימת.";
    if (it.kind === "review") return "בפעם הקודמת היו " + it.first + " מתוך 10 נכונות בניסיון הראשון. נחזק אותו עד שיהיה קל.";
    return "שלב חדש, הצעד הבא שלך.";
  }

  /* ---------- styles for the cards, pill and overlays (from each page's own color tokens) ---------- */
  var css = "" +
    ".gd-mission{background:var(--surface,#fff);border:2px solid var(--accent,#06c);border-radius:20px;padding:18px 20px;display:flex;flex-direction:column;gap:12px}" +
    ".gd-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}" +
    ".gd-head h2{margin:0}.gd-count{color:var(--muted,#666);font-variant-numeric:tabular-nums}" +
    ".gd-items{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}" +
    ".gd-items li{display:grid;grid-template-columns:auto 1fr auto;gap:4px 12px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--bg,#f4f4f4)}" +
    ".gd-items li.done{opacity:.75}" +
    ".gd-tag{grid-row:span 2;font-size:.8rem;padding:3px 10px;border-radius:99px;white-space:nowrap}" +
    ".gd-tag.new{background:rgba(23,143,130,.2)}.gd-tag.review{background:rgba(224,138,30,.25)}.gd-tag.continue{background:rgba(110,120,140,.22)}" +
    ".gd-name{font-weight:700;line-height:1.35;min-width:0}.gd-why{grid-column:2;font-size:.85rem;color:var(--muted,#666);line-height:1.4}" +
    ".gd-go{grid-row:span 2;grid-column:3;grid-row-start:1;background:var(--accent,#06c);color:var(--accent-ink,#fff);text-decoration:none;border-radius:10px;padding:8px 14px;font-family:var(--display,inherit);white-space:nowrap}" +
    ".gd-later,.gd-ok{grid-row:span 2;grid-column:3;grid-row-start:1;font-size:.85rem;color:var(--muted,#666);white-space:nowrap}.gd-ok{color:var(--accent,#06c);font-weight:700}" +
    ".gd-win{margin:0;padding:10px 14px;border-radius:12px;background:rgba(23,143,130,.15)}" +
    ".gd-log summary{cursor:pointer}.gd-log table{border-collapse:collapse;width:100%;font-size:.88rem;margin-top:8px}" +
    ".gd-log th,.gd-log td{text-align:right;padding:6px 8px;border-bottom:1px solid var(--line,#ddd);vertical-align:top}" +
    ".gd-log td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.gd-logwrap{overflow-x:auto}" +
    "@media (max-width:440px){.gd-items li{grid-template-columns:auto 1fr}.gd-go,.gd-later,.gd-ok{grid-column:1 / -1;grid-row:auto;justify-self:start}}" +
    "html body{padding-bottom:calc(max(48px,env(safe-area-inset-bottom,0px)) + 76px)}" +
    "#gt-pill{position:fixed;z-index:50;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));" +
    "display:flex;align-items:center;gap:10px;padding:8px 16px 8px 10px;border-radius:99px;border:2px solid var(--line,#ccc);" +
    "background:var(--surface,#fff);color:var(--ink,#111);font:inherit;font-size:1rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15);max-width:calc(100vw - 24px)}" +
    "#gt-pill:focus-visible{outline:3px solid var(--accent,#06c);outline-offset:2px}" +
    "#gt-pill svg{flex:none}#gt-pill .gt-track{stroke:var(--surface2,#e5e5e5)}#gt-pill .gt-arc{stroke:var(--accent,#06c);transition:stroke-dashoffset .9s linear}" +
    "#gt-pill .gt-time{font-variant-numeric:tabular-nums;font-weight:700;font-size:1.15rem;direction:ltr;unicode-bidi:isolate}" +
    "#gt-pill .gt-lbl{font-size:.8rem;color:var(--muted,#666);line-height:1.2;text-align:right}" +
    "#gt-pill.paused .gt-arc{stroke:var(--muted,#888)}#gt-pill.over .gt-time{color:var(--berry,#C93A60)}#gt-pill.over .gt-arc{stroke:var(--berry,#C93A60)}" +
    "#gt-toast{position:fixed;z-index:51;left:calc(12px + env(safe-area-inset-left,0px));right:calc(12px + env(safe-area-inset-right,0px));" +
    "bottom:calc(76px + env(safe-area-inset-bottom,0px));margin:0 auto;max-width:420px;padding:12px 16px;border-radius:14px;" +
    "background:var(--ink,#111);color:var(--bg,#fff);font-size:1rem;line-height:1.5;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:opacity .3s,transform .3s}" +
    "#gt-toast[hidden]{display:block!important;opacity:0;transform:translateY(10px);pointer-events:none}" +
    ".gt-over{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(0,0,0,.45);" +
    "padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}" +
    ".gt-card{background:var(--surface,#fff);color:var(--ink,#111);border-radius:20px;padding:24px;max-width:420px;width:100%;display:flex;flex-direction:column;gap:14px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3)}" +
    ".gt-card h2{margin:0;font-family:var(--display,inherit);font-weight:400;font-size:1.55rem;line-height:1.25}" +
    ".gt-card p{margin:0}.gt-card ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px;font-weight:700}" +
    ".gt-big{font-family:var(--display,inherit);font-size:3rem;line-height:1;color:var(--accent,#06c)}" +
    ".gt-btns{display:flex;flex-direction:column;gap:10px}" +
    ".gt-btns button,.gt-btns a{font:inherit;cursor:pointer;border-radius:12px;padding:12px 18px;font-size:1.05rem;text-decoration:none;display:block}" +
    ".gt-main{background:var(--accent,#06c);color:var(--accent-ink,#fff);border:none;font-family:var(--display,inherit)}" +
    ".gt-ghost{background:transparent;color:var(--ink,#111);border:2px solid var(--line,#ccc)}" +
    "@media (prefers-reduced-motion:reduce){#gt-pill .gt-arc,#gt-toast{transition:none}}";
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- cards the pages show ---------- */
  function missionHTML() {
    var day = today(), n = doneCount(day), nx = nextItem(day);
    var rows = day.mission.map(function (it) {
      var done = itemDone(day, it);
      var right = done ? '<span class="gd-ok">בוצע ✓</span>'
        : it === nx ? '<a class="gd-go" href="' + itemHref(it) + '">' + (it.kind === "continue" ? "להמשיך" : "להתחיל") + " ←</a>"
        : '<span class="gd-later">אחר כך</span>';
      return '<li class="' + (done ? "done" : "") + '"><span class="gd-tag ' + it.kind + '">' + KIND[it.kind] + "</span>" +
        '<span class="gd-name">' + esc(itemName(it)) + "</span>" + right + '<span class="gd-why">' + why(it) + "</span></li>";
    }).join("");
    return '<section class="gd-mission" aria-label="המשימה של היום"><div class="gd-head"><h2>המשימה של היום</h2>' +
      '<span class="gd-count">' + n + " מתוך " + day.mission.length + " שלבים</span></div>" +
      (missionDone(day)
        ? '<p class="gd-win">כל הכבוד גאיה! סיימת את המשימה של היום' + (day.missionAt != null ? " ב־" + mins(day.missionAt) + " דקות" : "") + ". כל תרגול נוסף הוא בונוס.</p>"
        : "<p>בחרתי לך להיום " + day.mission.length + " שלבים לפי מה שכבר עשית. מסיימים את שניהם, גם אם הטיימר נגמר.</p>") +
      '<ol class="gd-items">' + rows + "</ol></section>";
  }

  function logHTML() {
    var d = data(), keys = Object.keys(d.days).sort().reverse().slice(0, 14);
    var rows = keys.map(function (k) {
      var day = d.days[k], p = k.split("-");
      var status = day.missionAt != null
        ? (day.missionAt <= TOTAL ? "הושלמה בזמן (" + mins(day.missionAt) + " דק׳)" : "הושלמה אחרי " + mins(day.missionAt) + " דק׳")
        : k === dayKey() ? "בתהליך (" + doneCount(day) + "/" + day.mission.length + ")" : "לא הושלמה (" + doneCount(day) + "/" + day.mission.length + ")";
      var levels = day.done.map(function (x) { return SITES[x.site].name + " " + (x.level + 1) + " (" + x.first + "/10)"; }).join(", ") || "—";
      return "<tr><td class=n>" + (+p[2]) + "/" + (+p[1]) + "</td><td class=n>" + mins(day.secs) + "</td><td>" + status + "</td><td>" + esc(levels) + "</td></tr>";
    }).join("");
    return '<details class="gd-log"><summary>היומן של גאיה (לאבי)</summary><div class="gd-logwrap"><table>' +
      "<thead><tr><th>יום</th><th>דקות</th><th>המשימה</th><th>שלבים שהושלמו (נכונות בניסיון ראשון)</th></tr></thead><tbody>" + rows + "</tbody></table></div></details>";
  }

  /* ---------- timer session ---------- */
  function fresh() { return { left: TOTAL, seen: Date.now(), paused: false, done: false, over: 0, said: {} }; }
  function expired(x) { return !x || !x.seen || Date.now() - x.seen > NEW_SESSION_AFTER; }
  var s = get(TKEY), isNew = expired(s);
  if (isNew) s = fresh();
  s.paused = false; s.over = s.over || 0; s.seen = Date.now();
  put(TKEY, s);
  var lastTick = Date.now();

  var pill, toast, timeEl, lblEl, arc, R = 15, C = 2 * Math.PI * R, toastTimer = null;
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), x = sec % 60; return m + ":" + (x < 10 ? "0" : "") + x; }
  function say(text, ms) {
    if (!toast) return;
    toast.textContent = text; toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.hidden = true; }, ms || 6000);
  }
  function render() {
    if (!pill) return;
    var day = today(), mDone = missionDone(day), n = doneCount(day), m = day.mission.length;
    pill.classList.toggle("paused", s.paused);
    pill.classList.toggle("over", s.done && !mDone);
    if (s.done && !mDone) {
      timeEl.textContent = "+" + mmss(s.over);
      lblEl.textContent = s.paused ? "בהפסקה. לחצי להמשך" : "הזמן עבר · נשאר לסיים " + (m - n) + (m - n === 1 ? " שלב" : " שלבים");
      arc.style.strokeDashoffset = "0";
    } else if (s.done) {
      timeEl.textContent = "40:00"; lblEl.textContent = "סיימת להיום!"; arc.style.strokeDashoffset = "0";
    } else {
      timeEl.textContent = mmss(s.left);
      lblEl.textContent = s.paused ? "בהפסקה. לחצי להמשך" : mDone ? "נשארו · המשימה הושלמה!" : "נשארו · משימה " + n + "/" + m;
      arc.style.strokeDashoffset = (C * (1 - s.left / TOTAL)).toFixed(2); // full ring = all 40 minutes left
    }
    pill.setAttribute("aria-label", timeEl.textContent + " " + lblEl.textContent);
  }

  function overlay(html, wire) {
    var o = document.createElement("div");
    o.className = "gt-over";
    o.innerHTML = '<div class="gt-card" role="dialog" aria-modal="true">' + html + "</div>";
    document.body.appendChild(o);
    var close = function () { o.remove(); if (pill) pill.focus({ preventScroll: true }); };
    wire(o, close);
    var f = o.querySelector("button,a"); if (f) f.focus({ preventScroll: true });
  }
  function remainingList(day) {
    return "<ul>" + day.mission.filter(function (it) { return !itemDone(day, it); }).map(function (it) { return "<li>" + esc(itemName(it)) + "</li>"; }).join("") + "</ul>";
  }

  function timeUp() {
    s.done = true; s.left = 0; put(TKEY, s); render();
    var day = today();
    if (missionDone(day)) {
      overlay('<div class="gt-big">40:00</div><h2>כל הכבוד גאיה! סיימת 40 דקות של תרגול</h2>' +
        "<p>וגם את המשימה של היום. אבי ממש גאה בך. אפשר לנוח עכשיו, או להמשיך עוד קצת אם בא לך.</p>" +
        '<div class="gt-btns"><button class="gt-main" data-a="rest">סיימתי להיום</button><button class="gt-ghost" data-a="more">להמשיך לתרגל</button>' +
        '<button class="gt-ghost" data-a="again">להתחיל עוד 40 דקות</button></div>', function (o, close) {
          o.querySelector('[data-a="rest"]').onclick = function () { close(); say("נתראה מחר, גאיה! אבי שולח חיבוק.", 7000); };
          o.querySelector('[data-a="more"]').onclick = close;
          o.querySelector('[data-a="again"]').onclick = function () { s = fresh(); put(TKEY, s); render(); close(); say("יאללה, עוד 40 דקות! בהצלחה גאיה.", 5000); };
        });
    } else {
      var nx = nextItem(day);
      overlay('<div class="gt-big">40:00</div><h2>עברו 40 דקות, גאיה</h2>' +
        "<p>המשימה של היום עוד לא הושלמה. נשאר לך:</p>" + remainingList(day) +
        "<p>זה בסדר, כל אחת לומדת בקצב שלה. בואי נסיים את המשימה, ואז תוכלי לנוח. אבי מאמין בך!</p>" +
        '<div class="gt-btns">' + (nx ? '<a class="gt-main" href="' + itemHref(nx) + '" data-a="go">להמשיך למשימה ←</a>' : "") +
        '<button class="gt-ghost" data-a="stay">להמשיך במה שאני עושה עכשיו</button></div>', function (o, close) {
          var go = o.querySelector('[data-a="go"]'); if (go) go.addEventListener("click", function () { o.remove(); });
          o.querySelector('[data-a="stay"]').onclick = close;
        });
    }
  }

  function celebrateMission(day) {
    var t = day.missionAt, inTime = t <= TOTAL;
    overlay('<div class="gt-big">✓</div><h2>יש! סיימת את המשימה של היום!</h2>' +
      "<p>זה לקח לך " + mins(t) + " דקות. " + (inTime ? "ובזמן! אבי גאה בך בטירוף." : "קצת יותר מ־40 דקות, אבל לא ויתרת, וזה מה שחשוב. אבי גאה בך.") + "</p>" +
      '<div class="gt-btns"><button class="gt-main" data-a="rest">סיימתי להיום</button><button class="gt-ghost" data-a="more">להמשיך לתרגל</button></div>', function (o, close) {
        o.querySelector('[data-a="rest"]').onclick = function () { close(); say("נתראה מחר, גאיה! אבי שולח חיבוק.", 7000); };
        o.querySelector('[data-a="more"]').onclick = close;
      });
  }

  function tick() {
    var now = Date.now(), step = Math.min(MAX_STEP, now - lastTick);
    lastTick = now;
    if (document.visibilityState !== "visible") return; // only time on screen counts
    s.seen = now;
    if (!s.paused && step > 0) {
      var d = data(), day = d.days[dayKey()];
      day.secs += step / 1000; put(DKEY, d);
      if (!s.done) {
        s.left -= step / 1000;
        var said = s.said || (s.said = {});
        if (s.left <= TOTAL / 2 && !said.half) { said.half = 1; say("עברו 20 דקות, נשארו עוד 20. את מעולה, גאיה!", 7000); }
        if (s.left <= 5 * 60 && !said.five) { said.five = 1; say(missionDone(day) ? "עוד 5 דקות! והמשימה כבר הושלמה. כל הכבוד!" : "עוד 5 דקות. תמשיכי במשימה, את בדרך הנכונה!", 7000); }
        if (s.left <= 0) { timeUp(); return; }
      } else if (!missionDone(day)) {
        s.over += step / 1000;
      }
    }
    put(TKEY, s);
    render();
  }

  function setupUI() {
    pill = document.createElement("button");
    pill.id = "gt-pill"; pill.type = "button";
    pill.innerHTML = '<svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">' +
      '<circle class="gt-track" cx="19" cy="19" r="' + R + '" fill="none" stroke-width="5"/>' +
      '<circle class="gt-arc" cx="19" cy="19" r="' + R + '" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" transform="rotate(-90 19 19)"/></svg>' +
      '<span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0"><span class="gt-time"></span><span class="gt-lbl"></span></span>';
    toast = document.createElement("div");
    toast.id = "gt-toast"; toast.setAttribute("role", "status"); toast.hidden = true;
    document.body.appendChild(toast);
    document.body.appendChild(pill);
    timeEl = pill.querySelector(".gt-time"); lblEl = pill.querySelector(".gt-lbl"); arc = pill.querySelector(".gt-arc");

    pill.onclick = function () {
      var day = today();
      if (s.done && missionDone(day)) { say("סיימת היום גם את המשימה וגם 40 דקות. כל הכבוד, גאיה!", 5000); return; }
      s.paused = !s.paused; s.seen = Date.now(); put(TKEY, s); render();
      say(s.paused ? "הטיימר בהפסקה. כשתחזרי, לחצי עליו כדי להמשיך." : "ממשיכים! בהצלחה גאיה.", 4000);
    };
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        var shared = get(TKEY);
        if (expired(shared)) { s = fresh(); say("ברוכה השבה, גאיה! טיימר חדש: 40 דקות של תרגול.", 6000); }
        else { var p = s.paused; s = shared; s.paused = p; }
        s.seen = Date.now(); lastTick = Date.now(); put(TKEY, s); render();
      } else { s.seen = Date.now(); put(TKEY, s); }
    });

    render();
    var day = today();
    if (missionDone(day)) say("כבר סיימת את המשימה של היום. כל מה שתעשי עכשיו זה בונוס!", 6000);
    else if (isNew) say("הטיימר התחיל: 40 דקות. המשימה של היום: " + day.mission.length + " שלבים. בהצלחה גאיה!", 7000);
    else say("ממשיכים מאיפה שעצרת. נשארו " + mmss(s.left) + " דקות.", 5000);
    setInterval(tick, 1000);
  }
  if (document.body) setupUI(); else document.addEventListener("DOMContentLoaded", setupUI);

  /* ---------- what the pages call ---------- */
  window.GaiaDaily = {
    missionHTML: missionHTML,
    logHTML: logHTML,
    // a page finished a level: record it, and celebrate when it completes today's mission
    levelDone: function (site, level, first) {
      var d = data(), day = d.days[dayKey()], was = missionDone(day);
      day.done.push({ site: site, level: level, first: first, secs: Math.round(day.secs) });
      var now = missionDone(day);
      if (!was && now) day.missionAt = Math.round(day.secs);
      put(DKEY, d); render();
      if (!was && now) setTimeout(function () { celebrateMission(day); }, 1500);
      return { missionDone: now, inMission: day.mission.some(function (it) { return it.site === site && it.level === level; }) };
    }
  };
})();
