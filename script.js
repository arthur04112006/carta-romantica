(function () {
  const NEW_BADGE_DAYS = 7; // quantos dias uma anotação fica marcada como "nova"

  const book = document.getElementById('book');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const counter = document.getElementById('pageCounter');
  let animating = false;

  const entries = [...DIARY_ENTRIES].sort((a, b) => a.date.localeCompare(b.date));

  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function isRecent(iso) {
    const d = new Date(iso + 'T00:00:00');
    const diffDays = (Date.now() - d.getTime()) / 86400000;
    return diffDays >= 0 && diffDays <= NEW_BADGE_DAYS;
  }

  // ---- build page list: cover, toc, one per entry, epilogue ----
  const pages = [];
  pages.push(buildCoverPage());
  pages.push(buildTocPage());
  entries.forEach((entry, i) => pages.push(buildEntryPage(entry, i)));
  pages.push(buildEpiloguePage());

  const total = pages.length;
  pages.forEach((el, i) => {
    el.style.zIndex = total - i;
    book.appendChild(el);
  });

  const shadow = document.createElement('div');
  shadow.className = 'book-shadow';
  book.appendChild(shadow);

  let current = 0;
  const FAST_MS = 210; // duração de cada página ao "folhear" várias de uma vez

  function updateControls() {
    prevBtn.disabled = animating || current === 0;
    nextBtn.disabled = animating || current === total - 1;
    counter.textContent = `página ${current + 1} de ${total}`;
  }

  // zIndex final de uma página em repouso: virada fica sempre atrás da pilha,
  // não-virada segue a ordem natural (a atual é sempre a mais alta das não-viradas)
  function settleZ(idx) {
    const el = pages[idx];
    el.style.zIndex = el.classList.contains('flipped') ? -(idx + 1) : (total - idx);
  }

  function doNext() {
    if (current >= total - 1) return;
    const el = pages[current];
    el.style.zIndex = total + 100; // sobe por cima durante a virada
    el.classList.add('flipped');
    current++;
    updateControls();
  }

  function doPrev() {
    if (current <= 0) return;
    current--;
    const el = pages[current];
    el.style.zIndex = total + 100;
    el.classList.remove('flipped');
    updateControls();
  }

  function next() { if (!animating) doNext(); }
  function prev() { if (!animating) doPrev(); }

  // folheia página por página, rápido, até chegar na página alvo
  function animateJumpTo(target) {
    target = Math.max(0, Math.min(target, total - 1));
    if (target === current || animating) return;
    animating = true;
    pages.forEach((p) => p.classList.add('quick'));
    updateControls();
    const dir = target > current ? 1 : -1;

    function step() {
      if (current === target) {
        pages.forEach((p) => p.classList.remove('quick'));
        animating = false;
        updateControls();
        return;
      }
      dir === 1 ? doNext() : doPrev();
      setTimeout(step, FAST_MS + 30);
    }
    step();
  }

  // corrige o zIndex definitivo assim que a virada (rápida ou normal) termina
  book.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    const idx = pages.indexOf(e.target);
    if (idx === -1) return;
    settleZ(idx);
  });

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // nas páginas de leitura (anotações longas), só as bordas viram a página,
  // pra não atrapalhar o toque/scroll no meio do texto. Na capa, sumário e
  // página final, toque em qualquer lugar já folheia.
  book.addEventListener('click', (e) => {
    if (e.target.closest('[data-no-flip]')) return;
    const rect = book.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const curEl = pages[current];
    const edgesOnly = curEl && curEl.classList.contains('entry');
    if (edgesOnly) {
      if (x > rect.width * 0.8) next();
      else if (x < rect.width * 0.2) prev();
    } else {
      if (x > rect.width / 2) next(); else prev();
    }
  });

  // swipe no touch — funciona em qualquer ponto do livro (exceto áreas marcadas como data-no-flip)
  let touchStartX = null;
  let touchStartY = null;
  book.addEventListener('touchstart', (e) => {
    if (e.target.closest('[data-no-flip]')) { touchStartX = null; return; }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  book.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
    touchStartX = null;
  });

  updateControls();

  // ================= builders =================

  function makePage(className) {
    const page = document.createElement('div');
    page.className = 'page ' + className;
    const inner = document.createElement('div');
    inner.className = 'page-inner';
    page.appendChild(inner);
    return { page, inner };
  }

  function buildCoverPage() {
    const { page, inner } = makePage('cover');
    inner.innerHTML = `
      <span class="corner c-tl"></span>
      <span class="corner c-tr"></span>
      <span class="corner c-bl"></span>
      <span class="corner c-br"></span>
      <svg class="cover-seal" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#b8863b" stroke-width="2"/>
        <circle cx="50" cy="50" r="38" fill="none" stroke="#b8863b" stroke-width="1"/>
        <text x="50" y="60" text-anchor="middle" font-family="Great Vibes, cursive" font-size="42" fill="#b8863b">&amp;</text>
      </svg>
      <h1 class="cover-title">Nosso Diário</h1>
      <p class="cover-sub">para Tatiane, dia após dia</p>
      <p class="cover-hint">toque para abrir</p>
    `;
    return page;
  }

  function buildTocPage() {
    const { page, inner } = makePage('toc');
    const title = document.createElement('h2');
    title.className = 'toc-title';
    title.textContent = 'Sumário';
    const sub = document.createElement('p');
    sub.className = 'toc-sub';
    sub.textContent = 'cada anotação, um dia nosso';
    inner.appendChild(title);
    inner.appendChild(sub);

    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'toc-empty';
      empty.textContent = 'ainda não há anotações — a primeira página em branco espera por você.';
      inner.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'toc-list';
      list.setAttribute('data-no-flip', '');
      entries.forEach((entry, i) => {
        const li = document.createElement('li');
        const recent = isRecent(entry.date);
        li.className = 'toc-item' + (recent ? ' is-new' : '');
        li.innerHTML = `
          <span class="t-title"><span class="tt">${escapeHtml(entry.title)}</span>${recent ? '<span class="badge-new">novo</span>' : ''}</span>
          <span class="t-date">${formatDate(entry.date)}</span>
        `;
        li.addEventListener('click', () => animateJumpTo(2 + i)); // 2 = cover + toc offset
        list.appendChild(li);
      });
      inner.appendChild(list);
    }
    return page;
  }

  function buildEntryPage(entry, i) {
    const { page, inner } = makePage('entry');
    const date = document.createElement('p');
    date.className = 'entry-date';
    date.textContent = formatDate(entry.date);
    const title = document.createElement('h2');
    title.className = 'entry-title';
    title.textContent = entry.title;
    const body = document.createElement('div');
    body.className = 'entry-body';
    body.innerHTML = entry.content.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
    inner.appendChild(date);
    inner.appendChild(title);
    inner.appendChild(body);

    const idx = document.createElement('div');
    idx.className = 'page-index';
    idx.textContent = `${i + 1} / ${entries.length}`;
    page.appendChild(idx);
    return page;
  }

  function buildEpiloguePage() {
    const { page, inner } = makePage('epilogue');
    inner.classList.add('epi-wrap');
    inner.innerHTML = `
      <h2 class="epi-title">Uma última página</h2>
      <p class="epi-hint">toque no lacre para revelar um segredo</p>
      <button class="wax-seal" id="waxSeal" data-no-flip aria-label="Quebrar o lacre para revelar a surpresa">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 20 C55 30 70 30 70 45 C70 60 55 65 50 78 C45 65 30 60 30 45 C30 30 45 30 50 20 Z"
                fill="none" stroke="#f0e2c0" stroke-width="3" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="game" id="game" data-no-flip>
        <div class="game-caption">passe o gloss pelos lábios…</div>
        <div class="lips-area" id="lipsArea">
          <svg viewBox="0 0 300 140" aria-hidden="true">
            <defs>
              <clipPath id="lipClip">
                <path d="M20,70 C55,35 95,25 150,42 C205,25 245,35 280,70 C245,90 220,100 150,86 C80,100 55,90 20,70 Z"/>
              </clipPath>
              <linearGradient id="glossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ff8fa3"/>
                <stop offset="55%" stop-color="#d94f6a"/>
                <stop offset="100%" stop-color="#9c2a45"/>
              </linearGradient>
            </defs>
            <path d="M20,70 C55,35 95,25 150,42 C205,25 245,35 280,70 C245,90 220,100 150,86 C80,100 55,90 20,70 Z"
                  fill="#e7c9a0" stroke="#3b2a1a" stroke-width="3" stroke-linejoin="round"/>
            <path d="M20,70 C55,90 80,100 150,86 C220,100 245,90 280,70" fill="none" stroke="#3b2a1a" stroke-width="2.5" opacity="0.5"/>
            <g clip-path="url(#lipClip)"><rect id="glossRect" x="0" y="0" width="0" height="140" fill="url(#glossGrad)"/></g>
            <g clip-path="url(#lipClip)"><ellipse id="shineDot" cx="0" cy="55" rx="12" ry="5" fill="#ffffff" opacity="0.55"/></g>
          </svg>
          <div class="gloss-wand" id="glossWand" data-no-flip tabindex="0" role="slider"
               aria-label="Arraste o gloss pelos lábios" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <svg viewBox="0 0 60 60" aria-hidden="true">
              <rect x="24" y="6" width="12" height="26" rx="6" fill="#f3e3c4" stroke="#3b2a1a" stroke-width="2"/>
              <rect x="20" y="28" width="20" height="24" rx="8" fill="#d94f6a" stroke="#3b2a1a" stroke-width="2"/>
              <ellipse cx="30" cy="52" rx="7" ry="5" fill="#ff8fa3"/>
            </svg>
          </div>
        </div>
        <div class="reveal-message" id="revealMessage">quer namorar comigo?</div>
        <div class="answer-row" id="answerRow" data-no-flip>
          <button class="yes-btn" id="yesBtn" data-no-flip>sim, eu quero! 🤎</button>
          <button class="no-btn" id="noBtn" data-no-flip type="button">não</button>
        </div>
      </div>
    `;
    setTimeout(() => wireEpilogue(inner), 0);
    return page;
  }

  function wireEpilogue(root) {
    const waxSeal = root.querySelector('#waxSeal');
    const game = root.querySelector('#game');
    waxSeal.addEventListener('click', () => {
      waxSeal.classList.add('opened');
      setTimeout(() => {
        game.classList.add('open');
        // depois da animação de abrir, tira o teto de altura pra nunca cortar nada
        setTimeout(() => { game.style.maxHeight = 'none'; }, 750);
      }, 200);
    });

    const lipsArea = root.querySelector('#lipsArea');
    const wand = root.querySelector('#glossWand');
    const glossRect = root.querySelector('#glossRect');
    const shineDot = root.querySelector('#shineDot');
    const revealMessage = root.querySelector('#revealMessage');
    const yesBtn = root.querySelector('#yesBtn');
    const noBtn = root.querySelector('#noBtn');
    const answerRow = root.querySelector('#answerRow');

    let dragging = false;
    let revealed = false;
    const wandWidth = 44;

    function setProgress(px) {
      const areaWidth = lipsArea.getBoundingClientRect().width;
      const maxLeft = areaWidth - wandWidth;
      const clamped = Math.max(0, Math.min(px, maxLeft));
      const pct = maxLeft > 0 ? clamped / maxLeft : 0;
      wand.style.left = clamped + 'px';
      wand.setAttribute('aria-valuenow', Math.round(pct * 100));
      const svgX = (clamped + wandWidth / 2) / areaWidth * 300;
      glossRect.setAttribute('width', Math.max(0, svgX));
      shineDot.setAttribute('cx', Math.max(0, svgX - 14));
      if (pct >= 0.9 && !revealed) {
        revealed = true;
        revealMessage.classList.add('show');
        yesBtn.classList.add('show');
        noBtn.classList.add('show');
        placeNoBtnInitial();
      }
    }
    function pointerX(e) {
      const rect = lipsArea.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return clientX - rect.left - wandWidth / 2;
    }
    function startDrag(e) { dragging = true; e.preventDefault(); e.stopPropagation(); }
    function moveDrag(e) { if (dragging) setProgress(pointerX(e)); }
    function endDrag() { dragging = false; }

    wand.addEventListener('mousedown', startDrag);
    wand.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    wand.addEventListener('keydown', (e) => {
      const areaWidth = lipsArea.getBoundingClientRect().width;
      const step = areaWidth * 0.08;
      const currentLeft = parseFloat(wand.style.left || '0');
      if (e.key === 'ArrowRight') { setProgress(currentLeft + step); e.preventDefault(); e.stopPropagation(); }
      if (e.key === 'ArrowLeft') { setProgress(currentLeft - step); e.preventDefault(); e.stopPropagation(); }
    });

    // o botão "não" nunca deixa clicar nele — foge antes do toque terminar
    function placeNoBtnInitial() {
      const rowW = answerRow.getBoundingClientRect().width;
      const btnW = noBtn.offsetWidth || 74;
      const left = Math.min(rowW - btnW - 4, rowW / 2 + 46);
      noBtn.style.left = Math.max(4, left) + 'px';
      noBtn.style.top = '6px';
    }
    function dodgeNoBtn() {
      const rowRect = answerRow.getBoundingClientRect();
      const btnW = noBtn.offsetWidth;
      const btnH = noBtn.offsetHeight;
      const maxX = Math.max(0, rowRect.width - btnW);
      const maxY = Math.max(0, rowRect.height - btnH);
      noBtn.style.left = Math.random() * maxX + 'px';
      noBtn.style.top = Math.random() * maxY + 'px';
    }
    noBtn.addEventListener('pointerenter', dodgeNoBtn);
    noBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); dodgeNoBtn(); });
    noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); dodgeNoBtn(); }, { passive: false });
    noBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); dodgeNoBtn(); });

    const heartsBox = document.getElementById('hearts');
    yesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      for (let i = 0; i < 24; i++) {
        setTimeout(() => {
          const h = document.createElement('div');
          h.className = 'heart-piece';
          h.textContent = ['🤎', '💛', '✨', '🕊️'][Math.floor(Math.random() * 4)];
          h.style.left = Math.random() * 100 + 'vw';
          h.style.bottom = '-20px';
          h.style.fontSize = (16 + Math.random() * 20) + 'px';
          heartsBox.appendChild(h);
          setTimeout(() => h.remove(), 2700);
        }, i * 60);
      }
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
