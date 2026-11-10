/* =========================================================
   The Unreturned - shared script for every page
   Each page has <body data-page="...">, and only the code
   for that page runs (see the bottom of this file).
   ========================================================= */

// ---------- Game data ----------
const STORAGE_KEY = 'theUnreturned';
const FINAL_CODE = 'LOST';

// Secrets 1-4 each return a lost book. Each book's title is one letter,
// and the four titles put back on the shelf in order spell FINAL_CODE.
// "colour" is the book's cover (it matches its book on the small shelf).
const SECRETS = [
  {
    name: 'The Crest',
    title: 'L',
    colour: '#2F4A3A',
    message: 'Look closer. A book that was never returned was hiding behind the crest. Its title is a single letter: L.',
    hint: 'Some crests are worth more than a glance. Try pressing the one at the front desk.'
  },
  {
    name: 'The Bookplate',
    title: 'O',
    colour: '#6B2430',
    message: 'A bookplate was hiding here. It belongs to a missing book titled O.',
    hint: 'Not every book wants to be opened. Some only want to be noticed. Check the shelves.'
  },
  {
    name: 'The Shelf Order',
    title: 'S',
    colour: '#A07A2E',
    message: 'Shelved correctly. A thin book slides out from between them, titled S.',
    hint: 'The librarian shelves books by the hours of the day.'
  },
  {
    name: 'The Forgotten Word',
    title: 'T',
    colour: '#31407A',
    message: 'The lights go out. In the dark you find one more lost book, titled T.',
    hint: 'Look at the bottom of the front desk page. Then say it quietly to the librarian.'
  },
  {
    name: 'The Shelf Mark',
    title: '',
    colour: '#5A3A22',
    message: 'The four books are back on the shelf, and their titles spell LOST. The Special Collections room is open.',
    hint: 'Four lost books, four one-letter titles. Put them back on the shelf in the right order.'
  }
];

// A small book cover with the book's one-letter title on it
function makeBook(secret) {
  const book = document.createElement('span');
  book.className = 'book';
  book.style.setProperty('--c', secret.colour);
  book.textContent = secret.title;
  return book;
}

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

  // Secrets 1-4 hand the player a recovered book
  const slipBook = document.getElementById('slipBook');
  slipBook.replaceChildren();
  slipBook.hidden = SECRETS[i].title === '';
  if (SECRETS[i].title) {
    const caption = document.createElement('span');
    caption.className = 'slip-book-caption';
    caption.textContent = 'Book recovered: "' + SECRETS[i].title + '"';
    slipBook.append(makeBook(SECRETS[i]), caption);
  }

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
// Page 3: The Reading Room
// =========================================================
function setupReadingRoom() {
  // -------------------------------------------------------
  // Secret 3: click the books in order:
  // Morning Tea -> Midday Walk -> Evening Lamp
  // -------------------------------------------------------
  const correctOrder = ['morning', 'midday', 'evening'];
  const clickedOrder = [];
  const books = document.querySelectorAll('.table-book');
  const bookGroup = document.getElementById('orderBooks');

  books.forEach(function (book) {
    book.addEventListener('click', function () {
      // Secret already solved: do not start the puzzle again.
      if (state.found[2]) return;

      const choice = book.dataset.order;
      const expected = correctOrder[clickedOrder.length];

      // If this click is not the next correct book, shake and reset.
      if (choice !== expected) {
        clickedOrder.length = 0;

        books.forEach(function (item) {
          item.classList.remove('chosen');
        });

        bookGroup.classList.remove('shake');
        void bookGroup.offsetWidth;
        bookGroup.classList.add('shake');
        return;
      }

      clickedOrder.push(choice);
      book.classList.add('chosen');

      // All three were clicked correctly.
      if (clickedOrder.length === correctOrder.length) {
        clickedOrder.length = 0;

        books.forEach(function (item) {
          item.classList.remove('chosen');
        });

        unlockSecret(2);
      }
    });
  });

  // -------------------------------------------------------
  // Secret 4: type SILENCE.
  // It works in the text box and anywhere else on the page.
  // -------------------------------------------------------
  const librarianInput = document.getElementById('librarianInput');
  let typedLetters = '';

  function findSilence() {
    if (state.found[3]) return;

    unlockSecret(3);
  }

  // If the player types in the visible text box.
  librarianInput.addEventListener('input', function () {
    if (librarianInput.value.toLowerCase().includes('silence')) {
      findSilence();
    }
  });

  // If the player types anywhere else on the page.
  document.addEventListener('keydown', function (event) {
    if (document.activeElement === librarianInput) return;
    if (event.key.length !== 1) return;

    typedLetters += event.key.toLowerCase();
    typedLetters = typedLetters.slice(-7);

    if (typedLetters === 'silence') {
      findSilence();
      typedLetters = '';
    }
  });
}

// =========================================================
// Page 4: Checkout Card — five stamped secrets and shelf mark
// =========================================================
function setupCheckoutCard() {
  const rows = document.getElementById('checkoutRows');

  // Display the five secrets with their names, stamps, and recovered books.
  function renderCard() {
    rows.replaceChildren();

    SECRETS.forEach(function (secret, i) {
      const row = document.createElement('div');
      row.className = 'checkout-entry';

      const name = document.createElement('span');
      name.textContent = secret.name;

      const status = document.createElement('span');
      status.className = state.found[i] ? 'checkout-stamped' : 'checkout-locked';
      status.textContent = state.found[i] ? 'STAMPED · ' + state.dates[i] : 'LOCKED';

      // Secrets 1-4 show their recovered book, or an empty space until it is found.
      let book;
      if (i < 4 && state.found[i]) {
        book = makeBook(secret);
      } else {
        book = document.createElement('span');
        book.className = 'book empty';
      }
      if (i === 4) book.classList.add('none');

      row.append(name, status, book);
      rows.appendChild(row);
    });
  }

  renderCard();

  // Show the Special Collections link only after Secret 5 is solved.
  const specialLink = document.getElementById('specialCollectionsLink');

  function updateSpecialLink() {
    specialLink.hidden = !state.found[4];
  }

  updateSpecialLink();

  // Give the player a hint for the next unsolved secret.
  document.getElementById('checkoutHintBtn').addEventListener('click', function () {
    const next = state.found.findIndex(function (found) {
      return !found;
    });

    showWhisper(
      next === -1
        ? 'Every book is back on its shelf. Thank you.'
        : SECRETS[next].hint
    );
  });

  // Each box is a space on the shelf for one book (one letter title).
  // Typing a title moves to the next space. Backspace, arrow keys and
  // pasting also work.
  const inputs = Array.from(document.querySelectorAll('.shelf-letter'));
  const boxes = document.querySelector('.shelf-letter-boxes');

  // If the typed title matches a recovered book, the box takes that book's cover
  function paintBox(input) {
    const book = SECRETS.find(function (secret, i) {
      return i < 4 && state.found[i] && secret.title === input.value;
    });
    input.classList.toggle('filled', Boolean(book));
    input.style.setProperty('--c', book ? book.colour : '');
  }

  inputs.forEach(function (input, index) {
    input.addEventListener('input', function () {
      const clean = input.value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase();
      input.value = clean;
      paintBox(input);

      if (clean && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Backspace' && !input.value && index > 0) {
        inputs[index - 1].focus();
      }

      if (event.key === 'ArrowLeft' && index > 0) {
        inputs[index - 1].focus();
      }

      if (event.key === 'ArrowRight' && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('paste', function (event) {
      event.preventDefault();

      const pasted = (event.clipboardData.getData('text') || '')
        .replace(/[^a-z]/gi, '')
        .toUpperCase();

      for (let offset = 0; offset < pasted.length && index + offset < inputs.length; offset++) {
        inputs[index + offset].value = pasted[offset];
        paintBox(inputs[index + offset]);
      }

      inputs[Math.min(index + pasted.length, inputs.length - 1)].focus();
    });
  });

  // Secret 5: check the four book titles on the shelf.
  // A correct answer unlocks Special Collections.
  // A wrong answer shakes the shelf.
  const feedback = document.getElementById('shelfFeedback');

  function checkShelfMark() {
    const answer = inputs.map(function (input) {
      return input.value.trim().toUpperCase();
    }).join('');

    if (!state.found.slice(0, 4).every(Boolean)) {
      feedback.textContent = 'Some books are still missing. Find them first.';
    } else if (answer === FINAL_CODE) {
      feedback.textContent = 'STAMPED! The books are back in order. Special Collections unlocked.';
      unlockSecret(4);
      renderCard();
      updateSpecialLink();
    } else {
      feedback.textContent = 'Those books do not go there. Try another order.';

      boxes.classList.remove('shake');
      void boxes.offsetWidth;
      boxes.classList.add('shake');
    }
  }

  // Clicking CHECK and pressing Enter use the exact same validation.
  document.getElementById('checkShelfButton').addEventListener('click', checkShelfMark);

  document.getElementById('shelfForm').addEventListener('submit', function (event) {
    event.preventDefault();
    checkShelfMark();
  });

  inputs.forEach(function (input) {
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        checkShelfMark();
      }
    });
  });

  // Clear saved progress and return to the Front Desk.
  document.getElementById('returnBooksBtn').addEventListener('click', function () {
    if (confirm('Return all books and erase your saved progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      location.href = 'index.html';
    }
  });
}

// =========================================================
// Page 5: Special Collections
// =========================================================
function setupSpecialCollections() {
  const list = document.getElementById('finalSecretList');

  // Display all five recovered secrets.
  SECRETS.forEach(function (secret, i) {
    const row = document.createElement('div');
    row.className = 'final-secret-row';

    const number = document.createElement('span');
    number.className = 'secret-number';
    number.textContent = String(i + 1).padStart(2, '0');

    const details = document.createElement('div');
    details.className = 'secret-details';

    const name = document.createElement('h2');
    name.textContent = secret.name;

    const message = document.createElement('p');
    message.textContent = secret.message;

    details.appendChild(name);
    details.appendChild(message);

    const date = document.createElement('span');
    date.className = 'secret-date';
    date.textContent = state.dates[i] || 'FOUND';

    row.appendChild(number);
    row.appendChild(details);
    row.appendChild(date);

    list.appendChild(row);
  });

  // Final reward sound and stamp animation.
  playSound('unlock');

  const finalStamp = document.getElementById('finalStamp');
  finalStamp.classList.remove('play');
  void finalStamp.offsetWidth;
  finalStamp.classList.add('play');

  // Clear saved progress and restart the game.
  document.getElementById('playAgainBtn').addEventListener('click', function () {
    const restart = confirm(
      'Return all books and erase your saved progress?'
    );

    if (!restart) return;

    localStorage.removeItem(STORAGE_KEY);
    location.href = 'index.html';
  });
}

// =========================================================
// Start: shared parts first, then the code for this page
// =========================================================
if (checkPageAccess()) {
  const page = document.body.dataset.page;

  if (state.found[4]) {
    document.body.classList.add('night');
  }

  updateHeader();
  setupLibrarian();
  setupFoundSlip();

  if (page === 'front-desk') setupFrontDesk();
  if (page === 'main-hall') setupMainHall();
  if (page === 'stacks') setupStacks();
  if (page === 'reading-room') setupReadingRoom();
  if (page === 'checkout-card') setupCheckoutCard();
  if (page === 'special-collections') setupSpecialCollections();

  // the hall reads "visited" first, so it is marked after setup
  markVisited(page);
}