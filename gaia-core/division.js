/* Long-division content shared by Gaia's sites: 10 levels (lesson, example, 10 exercises each),
   a generator of similar exercises, and the animated step-by-step demo.
   Taken from gaia-division/index.html; the combined practice site (gaia-practice/) uses it as window.DV. */
window.DV=(function(){
/* ---------- the 100 exercises: [dividend, divisor] or an object for word problems ---------- */
const LEVELS = [
{name:"חילוק בלוח הכפל", ex:[28,4],
 lesson:"חילוק הוא ההפך של כפל. התרגיל <bdi class=m>42 ÷ 6</bdi> שואל: כמה פעמים 6 נכנס ב־42? כי <bdi class=m>7 × 6 = 42</bdi>, התשובה היא 7. בחילוק ארוך כותבים את <b>המחולק</b> (42) בתוך ה\"בית\", את <b>המחלק</b> (6) משמאל, ואת התשובה, <b>המנה</b>, למעלה.",
 qs:[[42,6],[56,8],[63,7],[36,4],[81,9],[48,6],[72,8],[54,9],[35,5],[64,8]]},
{name:"חילוק עם שארית", ex:[26,4],
 lesson:"לא תמיד החלוקה יוצאת בדיוק. ב־<bdi class=m>17 ÷ 5</bdi>, 5 נכנס 3 פעמים (זה 15), ונשארים 2. זאת <b>השארית</b>. התשובה: 3, שארית 2. השארית תמיד קטנה מהמחלק. אם היא יצאה גדולה, אפשר לחלק עוד פעם.",
 qs:[[17,5],[23,4],[38,6],[45,7],[29,3],[52,8],[31,9],[44,5],[60,7],[19,2]]},
{name:"דו־ספרתי, צעד אחרי צעד", ex:[68,2],
 lesson:"במספר דו־ספרתי עובדים ספרה אחרי ספרה, משמאל לימין. כל סיבוב הוא 4 צעדים: <b>חלק, כפול, חסר, הורד</b>. אחרי שהורדנו ספרה, מתחילים סיבוב חדש עם המספר החדש.",
 qs:[[84,4],[96,3],[69,3],[48,2],[88,4],[66,2],[77,7],[93,3],[86,2],[39,3]]},
{name:"כשנשאר משהו באמצע", ex:[54,3],
 lesson:"לפעמים אחרי החיסור נשאר משהו. זה בסדר! מורידים את הספרה הבאה לידו ומקבלים מספר חדש. למשל ב־<bdi class=m>72 ÷ 4</bdi>: 4 נכנס ב־7 פעם אחת, נשארים 3, מורידים את ה־2 ומקבלים 32.",
 qs:[[72,4],[96,8],[84,6],[91,7],[75,5],[92,4],[78,6],[85,5],[98,7],[87,3]]},
{name:"שארית בסוף", ex:[79,6],
 lesson:"כשאין עוד ספרות להוריד ועדיין נשאר משהו, זאת השארית. תמיד אפשר לבדוק: <b>מנה × מחלק + שארית</b> צריך לצאת בדיוק המחולק.",
 qs:[[47,3],[59,4],[83,6],[77,5],[94,8],[65,4],[89,7],[71,3],[58,5],
     {D:97,d:6,tpl:(D,d)=>`יש ${D} סוכריות, ומחלקים אותן שווה בשווה בין ${d} ילדים. כמה סוכריות מקבל כל ילד, וכמה נשארות?`}]},
{name:"תלת־ספרתי", ex:[538,2],
 lesson:"מספר תלת־ספרתי עובד בדיוק אותו דבר: חלק, כפול, חסר, הורד, ושוב מההתחלה. פשוט יש יותר סיבובים. כשהמחלק נכנס כבר בספרה הראשונה, גם בתשובה יהיו 3 ספרות.",
 qs:[[486,2],[645,5],[852,4],[936,3],[774,6],[896,7],[984,8],[765,5],[714,6],
     {D:856,d:4,tpl:(D,d)=>`בספרייה יש ${D} ספרים, ומסדרים אותם שווה בשווה על ${d} מדפים. כמה ספרים יהיו על כל מדף?`}]},
{name:"כשהספרה הראשונה קטנה", ex:[216,6],
 lesson:"ב־<bdi class=m>156 ÷ 4</bdi> הספרה הראשונה היא 1, ו־4 לא נכנס ב־1. אז לוקחים שתי ספרות: 15. במקרה כזה בתשובה יהיו רק 2 ספרות.",
 qs:[[156,4],[245,7],[312,8],[198,6],[432,9],[215,5],[364,7],[279,9],[157,6],
     {D:184,d:4,tpl:(D,d)=>`${D} ילדים מתחלקים לקבוצות של ${d}. כמה קבוצות יהיו?`}]},
{name:"זהירות, אפסים!", ex:[624,3],
 lesson:"אם אחרי שהורדנו ספרה המחלק לא נכנס במספר, כותבים <b>0</b> בתשובה ומורידים עוד ספרה. אסור לדלג על ה־0! ב־<bdi class=m>618 ÷ 3</bdi> התשובה היא 206, ולא 26.",
 qs:[[618,3],[824,4],[535,5],[912,3],[840,4],[721,7],[437,4],[803,8],[925,9],
     {D:650,d:6,tpl:(D,d)=>`אופה הכינה ${D} עוגיות ואורזת אותן בקופסאות של ${d}. כמה קופסאות מלאות יהיו, וכמה עוגיות יישארו בחוץ?`}]},
{name:"ארבע ספרות", ex:[2468,4],
 lesson:"אין כאן שום דבר חדש, רק עוד סיבובים של חלק, כפול, חסר, הורד. עבדי לאט ובסדר, ושימי לב לאפסים.",
 qs:[[1236,3],[4872,6],[2345,5],[7524,4],[3528,7],[6125,8],[9081,9],[5632,8],[8765,4],
     {D:1458,d:6,tpl:(D,d)=>`במשך ${d} ימים נמכרו ${D} כרטיסים להופעה, אותו מספר בכל יום. כמה כרטיסים נמכרו בכל יום?`}]},
{name:"מחלק דו־ספרתי", ex:[336,14],
 lesson:"כשהמחלק דו־ספרתי, בצעד \"חלק\" צריך להעריך. כמה פעמים 14 נכנס ב־33? מנסים: <bdi class=m>2 × 14 = 28</bdi>, ו־<bdi class=m>3 × 14 = 42</bdi> כבר גדול מדי, אז 2. כדאי לכתוב בצד דף את הכפולות של המחלק.",
 qs:[[144,12],[252,12],[375,15],[432,24],[598,13],[925,25],[784,16],[500,12],
     {D:456,d:19,tpl:(D,d)=>`בבית ספר יש ${D} תלמידים ב־${d} כיתות שוות. כמה תלמידים יש בכל כיתה?`},
     {D:230,d:50,bus:true,label:"כמה אוטובוסים?",tpl:(D,d)=>`${D} ילדים יוצאים לטיול, ובכל אוטובוס יש ${d} מקומות. כמה אוטובוסים צריך להזמין כדי שכולם ייסעו?`}]}
];
// fill in the story text, and the answer + explanation for the bus question
function prepare(q){
  if(q.tpl)q.t=q.tpl(q.D,q.d);
  if(q.bus){const Q=Math.floor(q.D/q.d),R=q.D%q.d;q.ans=Q+1;
    q.note=`<bdi class=m>${q.D} ÷ ${q.d} = ${Q}</bdi> ושארית ${R}. ${Q} אוטובוסים מתמלאים, אבל ${R} ילדים עדיין בלי מקום, אז צריך עוד אוטובוס אחד: <b>${Q+1} אוטובוסים</b>.`}
  return q;
}
LEVELS.forEach(L=>L.qs=L.qs.map(q=>prepare(Array.isArray(q)?{D:q[0],d:q[1]}:q)));

/* ---------- similar exercise (same kind, new numbers) after a miss ---------- */
function kindOf(D,d){
  const s=String(D);let end=0,cur=+s[0];
  while(cur<d&&end<s.length-1){end++;cur=cur*10+ +s[end]}
  const takeFirst=end;
  let clean=true;
  while(end<s.length-1){if(cur%d)clean=false;end++;cur=(cur%d)*10+ +s[end]}
  return [s.length,String(d).length,takeFirst,D%d>0,String(Math.floor(D/d)).includes("0"),clean].join("|");
}
const rand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function similar(orig,used){
  const base={tpl:orig.tpl,bus:orig.bus,label:orig.label};
  if(orig.bus){
    for(let i=0;i<5000;i++){const d=[30,35,40,45,50,55,60][rand(0,6)],D=rand(110,420);
      if(D%d&&!used.has(D+"/"+d))return prepare({...base,D,d})}
  }
  const want=kindOf(orig.D,orig.d),n=String(orig.D).length;
  for(let i=0;i<40000;i++){
    const d=orig.d<10?rand(2,9):rand(Math.max(11,orig.d-8),Math.min(29,orig.d+8));
    const D=rand(10**(n-1),10**n-1);
    if(used.has(D+"/"+d)||kindOf(D,d)!==want)continue;
    return prepare({...base,D,d});
  }
  return prepare({...base,D:orig.D,d:orig.d});
}

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* ---------- long division: build the step-by-step demo ---------- */
const m=x=>`<bdi class="m">${x}</bdi>`;
const times=q=>q===1?"פעם אחת":q===2?"פעמיים":`${m(q)} פעמים`;
const TAGS={start:"מתחילים",div:"חלק",mul:"כפול",sub:"חסר",down:"הורד",end:"סיום",check:"בדיקה"};

function buildDemo(D,d){
  const s=String(D).split("").map(Number), n=s.length;
  const els=[], frames=[];
  const add=e=>(els.push(e),e);
  const frame=(tag,cap,hl=[])=>(frames.push({tag,cap,hl}),frames.length-1);
  const Q=Math.floor(D/d), R=D%d;

  frame("start",`התרגיל: ${m(`${D} ÷ ${d}`)}. את המחולק ${m(D)} כותבים בתוך ה"בית", את המחלק ${m(d)} משמאל, ואת התשובה נכתוב למעלה.`);
  s.forEach((x,i)=>add({r:1,c:i,t:x,from:0}));

  let end=0, cur=s[0];
  const tooSmall=[];
  while(cur<d&&end<n-1){tooSmall.push(cur);end++;cur=cur*10+s[end]}
  let curCells=[];for(let i=0;i<=end;i++)curCells.push([1,i]);
  frame("start",tooSmall.length
    ?`${m(d)} לא נכנס ב־${tooSmall.map(m).join(" וגם לא ב־")}, כי ${tooSmall.length>1?"הם קטנים":"הוא קטן"} מ־${m(d)}. אז לוקחים ${end+1} ספרות: ${m(cur)}.`
    :`מתחילים מהספרה הראשונה משמאל: ${m(cur)}. ${m(d)} נכנס ב־${m(cur)}, אז אפשר להתחיל.`,curCells);

  let pr=2, finalRem=null;
  const finish=rem=>{
    finalRem=rem;
    const qc=[];for(let i=0;i<n;i++)if(els.some(e=>e.r===0&&e.c===i))qc.push([0,i]);
    frame("end",`אין עוד ספרות להוריד, אז סיימנו. התשובה (המנה): ${m(Q)}${rem?`, ושארית ${m(rem)}`:", בלי שארית"}.`,qc);
    frame("check",`בדיקה: ${m(`${Q} × ${d}${rem?` + ${rem}`:""} = ${D}`)}. יצא בדיוק המחולק, אז הפתרון נכון!`,qc);
  };

  while(true){
    const q=Math.floor(cur/d), p=q*d, r=cur-p;
    const kd=frame("div",`חלק: כמה פעמים ${m(d)} נכנס ב־${m(cur)}? `+(p===cur
      ?`בדיוק ${times(q)}, כי ${m(`${q} × ${d} = ${p}`)}.`
      :`${times(q)}, כי ${m(`${q} × ${d} = ${p}`)}, ו־${m(`${q+1} × ${d} = ${(q+1)*d}`)} כבר יותר מ־${m(cur)}.`)+` כותבים ${m(q)} למעלה.`,curCells);
    add({r:0,c:end,t:q,from:kd,cls:"q"});

    const ps=String(p), start=end-ps.length+1;
    const km=frame("mul",`כפול: ${m(`${q} × ${d} = ${p}`)}. כותבים ${m(p)} מתחת ל־${m(cur)}, כך שהספרה האחרונה מיושרת.`,[[0,end]]);
    ps.split("").forEach((x,i)=>add({r:pr,c:start+i,t:x,from:km}));
    add({r:pr,c:start-1,t:"−",from:km,cls:"op"});

    const rs=String(r);
    const remCells=rs.split("").map((_,i)=>[pr+1,end-rs.length+1+i]);
    const ks=frame("sub",`חסר: ${m(`${cur} − ${p} = ${r}`)}. בודקים: ${m(r)} קטן מ־${m(d)}? כן, אז ${m(q)} היה המספר הנכון.`,remCells);
    add({line:true,r:pr,c0:start-1,c1:end,from:ks});
    const remEls=rs.split("").map((x,i)=>add({r:pr+1,c:end-rs.length+1+i,t:x,from:ks}));

    if(end===n-1){finish(r);break}

    end++;const dig=s[end];cur=r*10+dig;
    const kb=frame("down",r===0
      ?`הורד: לא נשאר כלום, אז מורידים את הספרה הבאה, ${m(dig)}. המספר החדש הוא ${m(cur)}.`
      :`הורד: מורידים את הספרה הבאה, ${m(dig)}, ושמים אותה ליד ה־${m(r)}. עכשיו יש לנו ${m(cur)}.`);
    if(r===0)remEls.forEach(e=>e.to=kb);
    add({r:pr+1,c:end,t:dig,from:kb,cls:"down",dy:pr});
    curCells=(r===0?[]:remCells).concat([[pr+1,end]]);
    frames[kb].hl=curCells.concat([[1,end]]);

    let done=false;
    while(cur<d){
      const more=end<n-1;
      const kz=frame("div",`חלק: ${m(d)} לא נכנס ב־${m(cur)}, כי ${m(cur)} קטן מ־${m(d)}. כותבים <b>0</b> למעלה${more?", ומורידים עוד ספרה":""}. אסור לדלג על ה־0!`,curCells);
      add({r:0,c:end,t:0,from:kz,cls:"q"});
      if(!more){finish(cur);done=true;break}
      end++;const dg=s[end],old=cur;cur=cur*10+dg;
      const kb2=frame("down",`הורד: מורידים את ${m(dg)}. עכשיו יש לנו ${m(cur)}${old===0?" (ה־0 שלפניו לא משנה)":""}.`);
      add({r:pr+1,c:end,t:dg,from:kb2,cls:"down",dy:pr});
      curCells=curCells.concat([[pr+1,end]]);
      frames[kb2].hl=curCells.concat([[1,end]]);
    }
    if(done)break;
    pr+=2;
  }
  const rows=Math.max(...els.map(e=>e.r))+1;
  return {D,d,n,rows,els,frames,Q,R:finalRem};
}

function renderBoard(demo,k,animate){
  const {n,rows,els,frames,d}=demo, hl=new Set(frames[k].hl.map(([r,c])=>r+":"+c));
  let h=`<div class="board" role="img" aria-label="חילוק ארוך של ${demo.D} ב־${d}" style="grid-template-columns:auto var(--bw) repeat(${n},var(--cw));grid-template-rows:repeat(${rows},var(--ch))">`;
  h+=`<div class="dv" style="grid-row:2;grid-column:1">${d}</div><div class="brk" style="grid-row:2;grid-column:2"></div><div class="roof" style="grid-row:2;grid-column:2 / span ${n+1}"></div>`;
  for(const e of els){
    if(e.from>k||(e.to!=null&&k>=e.to))continue;
    const nw=animate&&e.from===k&&k>0?" new":"";
    if(e.line){h+=`<div class="uline${nw}" style="grid-row:${e.r+1};grid-column:${e.c0+3} / ${e.c1+4}"></div>`;continue}
    h+=`<div class="cell ${e.cls||""}${nw}${hl.has(e.r+":"+e.c)?" hl":""}" style="grid-row:${e.r+1};grid-column:${e.c+3}${e.dy?`;--dy:${e.dy}`:""}">${e.t}</div>`;
  }
  return h+"</div>";
}

const players=new Set();
function stopAll(){players.forEach(p=>p.stop());players.clear()}
function makePlayer(host,demo,{autoplay=false,written=true}={}){
  const last=demo.frames.length-1;let k=0,timer=null;
  host.innerHTML=`<div class="player">
    <div class="boardwrap"></div>
    <div class="cycle" aria-hidden="true"><span data-t="div">1 חלק</span><span data-t="mul">2 כפול</span><span data-t="sub">3 חסר</span><span data-t="down">4 הורד</span></div>
    <p class="cap" aria-live="polite"></p>
    <div class="pctl">
      <button class="pbtn" data-a="prev">→ הקודם</button>
      <button class="pbtn main" data-a="play">▶ הפעילי</button>
      <button class="pbtn" data-a="next">הבא ←</button>
      <span class="pcount"></span>
      <button class="pbtn" data-a="restart">מההתחלה</button>
    </div>
    ${written?`<details class="written"><summary>כל השלבים בכתב</summary><ol class="steps">${demo.frames.map(f=>`<li>${f.cap}</li>`).join("")}</ol></details>`:""}
  </div>`;
  const $$=s=>host.querySelector(s), board=$$(".boardwrap"), cap=$$(".cap"), playB=$$('[data-a="play"]');
  function show(i,animate){
    k=Math.max(0,Math.min(last,i));
    board.innerHTML=renderBoard(demo,k,animate);
    cap.innerHTML=demo.frames[k].cap;
    host.querySelectorAll(".cycle span").forEach(sp=>sp.classList.toggle("on",sp.dataset.t===demo.frames[k].tag));
    host.querySelectorAll(".steps li").forEach((li,j)=>li.classList.toggle("cur",j===k));
    $$(".pcount").textContent=`${k+1} / ${last+1}`;
    $$('[data-a="prev"]').disabled=k===0;$$('[data-a="next"]').disabled=k===last;
  }
  const delay=()=>Math.min(8000,1800+cap.textContent.length*45);
  function tick(){if(k>=last){stop();return}show(k+1,true);timer=setTimeout(tick,delay())}
  function play(){if(timer)return;if(k>=last)show(0,false);playB.textContent="⏸ עצירה";timer=setTimeout(tick,k===0?1500:delay())}
  function stop(){clearTimeout(timer);timer=null;playB.textContent=k>=last?"↻ שוב":"▶ הפעילי"}
  playB.onclick=()=>timer?stop():play();
  $$('[data-a="prev"]').onclick=()=>{stop();show(k-1,false)};
  $$('[data-a="next"]').onclick=()=>{stop();show(k+1,true)};
  $$('[data-a="restart"]').onclick=()=>{stop();show(0,false);play()};
  const api={stop};players.add(api);
  show(0,false);stop();
  if(autoplay)play();
  return api;
}

return {LEVELS,similar,kindOf,buildDemo,renderBoard,makePlayer,stopAll,m};
})();
