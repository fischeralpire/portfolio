// ── CLOCK ──
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2,'0');
  const m = now.getMinutes().toString().padStart(2,'0');
  document.getElementById('clock').textContent = h + ':' + m;
}
updateClock();
setInterval(updateClock, 10000);

// ── WINDOWS ──
const wins = {
  computer:  { el: null, title: 'My Computer',        zIndex: 100 },
  about:     { el: null, title: 'About Me',            zIndex: 100 },
  projects:  { el: null, title: 'Projects',            zIndex: 100 },
  blog:      { el: null, title: 'Contact',             zIndex: 100 },
  delightex: { el: null, title: 'Delightex-Lernräume', zIndex: 100 },
};
let topZ = 200;

function initWins() {
  wins.computer.el  = document.getElementById('win-computer');
  wins.about.el     = document.getElementById('win-about');
  wins.projects.el  = document.getElementById('win-projects');
  wins.blog.el      = document.getElementById('win-blog');
  wins.delightex.el = document.getElementById('win-delightex');
}

function openWin(name) {
  if (!wins[name]) return;
  wins[name].el.classList.add('visible');
  bringToFront(name);
  updateTaskbar();
  hideStart();
}

function closeWin(name) {
  wins[name].el.classList.remove('visible');
  updateTaskbar();
}

function bringToFront(name) {
  topZ++;
  wins[name].el.style.zIndex = topZ;
  wins[name].zIndex = topZ;
}

function updateTaskbar() {
  const bar = document.getElementById('taskbar-items');
  bar.innerHTML = '';
  for (const [name, w] of Object.entries(wins)) {
    if (w.el && w.el.classList.contains('visible')) {
      const btn = document.createElement('button');
      btn.className = 'taskbar-btn';
      btn.textContent = w.title;
      btn.onclick = () => bringToFront(name);
      bar.appendChild(btn);
    }
  }
}

// ── DRAG ──
let drag = null;
function dragStart(e, id) {
  const el = document.getElementById('win-' + id);
  bringToFront(id);
  const rect = el.getBoundingClientRect();
  drag = { el, ox: e.clientX - rect.left, oy: e.clientY - rect.top };
  e.preventDefault();
}
document.addEventListener('mousemove', e => {
  if (!drag) return;
  drag.el.style.left = (e.clientX - drag.ox) + 'px';
  drag.el.style.top  = Math.max(0, e.clientY - drag.oy) + 'px';
});
document.addEventListener('mouseup', () => drag = null);

// ── CONTEXT MENU ──
function showCtxMenu(e) {
  e.preventDefault();
  const m = document.getElementById('ctx-menu');
  m.style.left = e.clientX + 'px';
  m.style.top  = Math.min(e.clientY, window.innerHeight - 180) + 'px';
  m.classList.add('visible');
}
function hideCtx() {
  document.getElementById('ctx-menu').classList.remove('visible');
}
document.addEventListener('click', hideCtx);

// ── START MENU ──
function toggleStart() {
  document.getElementById('start-menu').classList.toggle('visible');
}
function hideStart() {
  document.getElementById('start-menu').classList.remove('visible');
}

// ── ICON SELECT ──
function selectIcon(el) {
  document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
}

// ── WIZARD (AI) ──
async function wizardNext() {
  const selected = document.querySelector('input[name="wiz"]:checked');
  if (!selected) return;
  const val = selected.value;

  if (val === 'explore') { closeWizard(); return; }

  const aiArea  = document.getElementById('wizard-ai-area');
  const nextBtn = document.getElementById('wiz-next-btn');

  aiArea.classList.add('visible');
  aiArea.innerHTML = '<span class="typing-dot">_</span>';
  nextBtn.disabled = true;

  const prompts = {
    about:    "Du bist Joanna Fischer Alpire, eine UX/UI Designerin und Frontendentwicklerin aus Düsseldorf. Jemand möchte mehr über dich erfahren. Antworte in 2-3 Sätzen auf Deutsch, persönlich und freundlich, in der ersten Person. Erwähne deinen bolivianischen Hintergrund, dein Masterstudium Medieninformatik an der HSD, und deine Leidenschaft für Design das wirklich für Menschen funktioniert.",
    skills:   "Du bist Joanna Fischer Alpire, UX/UI Designerin und Frontendentwicklerin. Jemand fragt nach deinen Skills. Antworte in 2-3 Sätzen auf Deutsch, selbstbewusst aber nicht arrogant. Erwähne Figma, HTML/CSS, JavaScript, React, PHP und dass du sowohl Design als auch Code beherrschst.",
    projects: "Du bist Joanna Fischer Alpire, Frontendentwicklerin. Jemand fragt nach deinen Projekten. Nenne kurz 2-3 deiner echten Projekte: ein PHP-Anmeldeportal für ein Tanzturnier, eine TYPO3-Extension, und ein 3D-Websiteprojekt mit Three.js und Schulklassen. Antworte in 2-3 Sätzen auf Deutsch, enthusiastisch.",
    hire:     "Du bist Joanna Fischer Alpire und jemand möchte dich einstellen! Reagiere sehr positiv und freundlich auf Deutsch in 2 Sätzen. Sag dass du dich sehr freust und am besten per Email erreichbar bist: fischer.alpire@gmail.com"
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompts[val] }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || 'Fehler beim Laden.';

    aiArea.innerHTML = '';
    let i = 0;
    function type() {
      if (i < text.length) {
        aiArea.innerHTML += text[i] === '\n' ? '<br>' : text[i];
        i++;
        setTimeout(type, 18);
      } else {
        nextBtn.disabled = false;
        nextBtn.textContent = val === 'hire' ? 'Kontakt öffnen >' : 'Desktop erkunden >';
        nextBtn.onclick = () => {
          if (val === 'hire')     { openWin('blog'); }
          else if (val === 'projects') { openWin('projects'); }
          else if (val === 'skills')   { openWin('computer'); }
          closeWizard();
        };
      }
    }
    type();

  } catch(e) {
    aiArea.innerHTML = 'Hoppla, keine Verbindung. Erkunde gerne selbst!';
    nextBtn.disabled = false;
  }
}

function closeWizard() {
  document.getElementById('wizard-overlay').classList.add('hidden');
  openWin('about');
}

// ── INIT ──
window.onload = () => {
  initWins();
  openWin('about');
};
