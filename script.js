/* =========================================================
   The Unreturned - shared script for every page
   Each page has <body data-page="...">, and only the code
   for that page runs (see the bottom of this file).
   ========================================================= */

// ---------- Game data ----------
const STORAGE_KEY = 'theUnreturned';
const FINAL_CODE = 'LOST';

const SECRETS = [
  {
    name: 'The Crest',
    letter: 'L',
    message: 'Look closer. The first letter is L.',
    hint: 'Some crests are worth more than a glance. Try pressing the one at the front desk.'
  },
  {
    name: 'The Bookplate',
    letter: 'O',
    message: 'A bookplate was hiding here. The second letter is O.',
    hint: 'Not every book wants to be opened. Some only want to be noticed. Check the shelves.'
  },
  {
    name: 'The Shelf Order',
    letter: 'S',
    message: 'Shelved correctly. The third letter is S.',
    hint: 'The librarian shelves books by the hours of the day.'
  },
  {
    name: 'The Forgotten Word',
    letter: 'T',
    message: 'The lights go out. The fourth letter is T.',
    hint: 'Look at the bottom of the front desk page. Then say it quietly to the librarian.'
  },
  {
    name: 'The Shelf Mark',
    letter: '',
    message: 'The Special Collections room is open.',
    hint: 'Four letters make one word. Where do they go?'
  }
];

// Every page of the library.
// "unlockedBy" is the secret that opens it (null means it is always open).
// "secrets" lists the secrets hidden on that page (used for the librarian's hints).
const PAGES = [
  { id: 'front-desk',          file: 'index.html',               name: 'Front Desk',          unlockedBy: null, secrets: [0] },
  { id: 'main-hall',           file: 'library.html',             name: 'Main Hall',           unlockedBy: 0,    secrets: [] },
  { id: 'stacks',              file: 'stacks.html',              name: 'The Stacks',          unlockedBy: 0,    secrets: [1] },
  { id: 'reading-room',        file: 'reading-room.html',        name: 'Reading Room',        unlockedBy: 1,    secrets: [2, 3] },
  { id: 'checkout-card',       file: 'checkout-card.html',       name: 'Checkout Card',       unlockedBy: 3,    secrets: [4] },
  { id: 'special-collections', file: 'special-collections.html', name: 'Special Collections', unlockedBy: 4,    secrets: [] }
];

function findPage(id) {
  return PAGES.find(function (p) { return p.id === id; });
}

// ---------- Saved progress (localStorage) ----------
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    found: [false, false, false, false, false],
    dates: [null, null, null, null, null],
    visited: []          // rooms the player has been inside
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function countFound() {
  let count = 0;
  for (let i = 0; i < state.found.length; i++) {
    if (state.found[i]) count++;
  }
  return count;
}

function isPageOpen(page) {
  return page.unlockedBy === null || state.found[page.unlockedBy];
}

function markVisited(pageId) {
  if (!state.visited.includes(pageId)) {
    state.visited.push(pageId);
    saveState();
  }
}

// Today's date in stamp style, e.g. "31 OCT 2026"
function todayStamp() {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = new Date();
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// ---------- Sounds ----------
const sounds = {
  stamp: new Audio('sounds/stamp.mp3'),
  unlock: new Audio('sounds/unlock.mp3')
};

function playSound(name) {
  const sound = sounds[name];
  sound.currentTime = 0;
  // some browsers block sound until the visitor has clicked something
  sound.play().catch(function () {});
}

// ---------- Locked pages ----------
// If someone opens a page they have not unlocked yet, send them back.
function checkPageAccess() {
  const page = findPage(document.body.dataset.page);
  if (page && !isPageOpen(page)) {
    if (page.id === 'special-collections') {
      location.replace('checkout-card.html');
    } else {
      location.replace('index.html');
    }
    return false;
  }
  return true;
}

// ---------- Top bar: counter and small shelf ----------
function updateHeader() {
  document.getElementById('count').textContent = countFound();

  const books = document.querySelectorAll('#miniShelf span');
  for (let i = 0; i < books.length; i++) {
    books[i].classList.toggle('got', state.found[i]);
  }
}

// ---------- Finding a secret ----------
function unlockSecret(i) {
  if (state.found[i]) return;   // already found, nothing to do

  state.found[i] = true;
  state.dates[i] = todayStamp();
  saveState();

  updateHeader();
  document.querySelectorAll('#miniShelf span')[i].classList.add('new');

  playSound('stamp');
  showFound(i);
}

function showFound(i) {
  document.getElementById('slipText').textContent = SECRETS[i].message;

  const letter = document.getElementById('slipLetter');
  letter.textContent = SECRETS[i].letter;
  letter.hidden = SECRETS[i].letter === '';

  // Does this secret open a new page? Then offer a way to it.
  const goNext = document.getElementById('goNext');
  const note = document.getElementById('slipNote');
  const nextPage = PAGES.find(function (p) { return p.unlockedBy === i; });
  note.hidden = true;

  if (!nextPage) {
    goNext.hidden = true;
  } else if (nextPage.id === 'main-hall') {
    goNext.href = 'library.html';
    goNext.textContent = 'Enter the library';
    goNext.hidden = false;
  } else if (nextPage.id === 'special-collections') {
    goNext.href = 'special-collections.html';
    goNext.textContent = 'Go to Special Collections';
    goNext.hidden = false;
  } else {
    // new rooms show up in the Main Hall with a NEW stamp
    note.textContent = 'A room has opened: ' + nextPage.name + '.';
    note.hidden = false;
    goNext.href = 'library.html';
    goNext.textContent = 'Back to the Main Hall';
    goNext.hidden = false;
  }

  document.getElementById('foundOverlay').hidden = false;

  // restart the stamp animation (reading offsetWidth makes the browser notice the change)
  const stamp = document.getElementById('stamp');
  stamp.classList.remove('play');
  void stamp.offsetWidth;
  stamp.classList.add('play');
}

function setupFoundSlip() {
  document.getElementById('stayHere').addEventListener('click', function () {
    document.getElementById('foundOverlay').hidden = true;
  });
}

// ---------- Ask the librarian ----------
function showWhisper(text) {
  document.getElementById('hintText').textContent = text;
  document.getElementById('hintPop').hidden = false;
  document.getElementById('askBtn').setAttribute('aria-expanded', 'true');
}

function hideWhisper() {
  document.getElementById('hintPop').hidden = true;
  document.getElementById('askBtn').setAttribute('aria-expanded', 'false');
}

// The hint depends on the page you are on
function hintForThisPage() {
  const page = findPage(document.body.dataset.page);

  // A page with secrets: the hint for its first unsolved secret,
  // or its first secret if they are all solved already
  if (page.secrets.length > 0) {
    for (const i of page.secrets) {
      if (!state.found[i]) return SECRETS[i].hint;
    }
    return SECRETS[page.secrets[0]].hint;
  }

  // A page without secrets (Main Hall, Special Collections):
  // point to the next secret that is not found yet
  const next = state.found.indexOf(false);
  if (next === -1) {
    return 'Every book is back on its shelf. Thank you.';
  }
  return SECRETS[next].hint;
}

function setupLibrarian() {
  document.getElementById('askBtn').addEventListener('click', function () {
    if (!document.getElementById('hintPop').hidden) {
      hideWhisper();
      return;
    }
    showWhisper(hintForThisPage());
  });

  document.getElementById('hintClose').addEventListener('click', hideWhisper);
}

// =========================================================
// Page 1: Front Desk (the start)
// =========================================================
function setupFrontDesk() {
  const enterLink = document.getElementById('enterLink');
  enterLink.hidden = !state.found[0];

  // Secret 1: click the crest five times
  const crest = document.getElementById('crest');
  let crestClicks = 0;

  crest.addEventListener('click', function () {
    crestClicks++;
    crest.classList.remove('bump');
    void crest.offsetWidth;
    crest.classList.add('bump');

    if (crestClicks === 5) {
      unlockSecret(0);
      enterLink.hidden = false;
    }
  });

  // the small "i" button that explains the game
  const infoBtn = document.getElementById('infoBtn');
  const infoPop = document.getElementById('infoPop');

  infoBtn.addEventListener('click', function () {
    infoPop.hidden = !infoPop.hidden;
    infoBtn.setAttribute('aria-expanded', !infoPop.hidden);
  });
  document.getElementById('infoClose').addEventListener('click', function () {
    infoPop.hidden = true;
    infoBtn.setAttribute('aria-expanded', 'false');
  });
}

// =========================================================
// The Main Hall: one catalog card per room
// =========================================================
function setupMainHall() {
  const cards = document.querySelectorAll('.room-card');

  cards.forEach(function (card) {
    const page = findPage(card.dataset.page);
    const status = card.querySelector('.status');

    if (!isPageOpen(page)) {
      card.classList.add('closed');
      status.textContent = 'CLOSED';
    } else if (!state.visited.includes(page.id)) {
      card.classList.add('is-new');
      status.textContent = 'NEW';
    } else {
      status.textContent = 'OPEN';
    }

    // a closed room cannot be entered
    card.addEventListener('click', function (event) {
      if (!isPageOpen(page)) {
        event.preventDefault();
        showWhisper(page.name + ' is closed for now. Keep looking in the rooms that are open.');
      }
    });
  });
}

// =========================================================
// Page 2: The Stacks
// =========================================================
function setupStacks() {
  // Secret 2: rest the mouse on the bookplate book (or tap it on a phone)
  const book = document.getElementById('bookplateBook');
  let hoverTimer = null;

  if (state.found[1]) {
    book.classList.add('revealed');
  }

  book.addEventListener('mouseenter', function () {
    // wait a moment so the mark can fade in first
    hoverTimer = setTimeout(function () {
      book.classList.add('revealed');
      unlockSecret(1);
    }, 800);
  });

  book.addEventListener('mouseleave', function () {
    clearTimeout(hoverTimer);
  });

  book.addEventListener('click', function () {
    book.classList.add('revealed');
    unlockSecret(1);
  });
}

// =========================================================
// Start: shared parts first, then the code for this page
// =========================================================
if (checkPageAccess()) {
  const page = document.body.dataset.page;

  if (state.found[3]) {
    document.body.classList.add('night');
  }

  updateHeader();
  setupLibrarian();
  setupFoundSlip();

  if (page === 'front-desk') setupFrontDesk();
  if (page === 'main-hall') setupMainHall();
  if (page === 'stacks') setupStacks();

  // the hall reads "visited" first, so it is marked after setup
  markVisited(page);
}
