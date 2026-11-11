/* =========================================================
   The Unreturned - shared script for every page
   Each page has <body data-page="...">, and only the code
   for that page runs (see the bottom of this file).
   ========================================================= */

// ---------- Game data ----------
const STORAGE_KEY = 'theUnreturned';
const FINAL_CODE = 'LOST';
const INTRO_DELAY = 1500;    // ms before the welcome note opens on the first visit
const NUDGE_AFTER = 45000;   // ms on a page without finding its secret before the librarian button shakes

// Secrets 1-4 each return one volume of a lost four-volume series.
// Each volume has a one-letter title, but the letters are recovered in
// mixed order. Players rearrange them to discover FINAL_CODE. Secret 5 is putting the series back on the shelf.
// "colour" is the volume's cover (it matches its book on the small shelf).
const SERIES_NAME = 'The Unreturned';
const BOOK_COUNT = 4;

const SECRETS = [
  {
    name: 'The Crest',
    volume: 'I',
    title: 'O',
    colour: '#2F4A3A',
    message: 'Look closer. Volume I of a lost series was hiding behind the crest. Its title is a single letter: O.',
    hint: 'Some crests are worth more than a glance. Try pressing the one at the front desk.'
  },
  {
    name: 'The Bookplate',
    volume: 'II',
    title: 'T',
    colour: '#6B2430',
    message: 'A bookplate was hiding here. It belongs to Volume II of the same series, titled T.',
    hint: 'Not every book wants to be opened. Some only want to be noticed. Check the shelves.'
  },
  {
    name: 'The Shelf Order',
    volume: 'III',
    title: 'L',
    colour: '#A07A2E',
    message: 'Shelved correctly. Volume III slides out from between them, titled L.',
    hint: 'The librarian shelves books by the hours of the day.'
  },
  {
    name: 'The Forgotten Word',
    volume: 'IV',
    title: 'S',
    colour: '#31407A',
    message: 'The forgotten word reveals Volume IV, the last of the series, titled S.',
    hint: 'Look at the bottom of the front desk page. Then say it quietly to the librarian.'
  },
  {
    name: 'The Shelf Mark',
    volume: '',
    title: '',
    colour: '',
    message: 'The shelf mark is correct. All four recovered letters have found their places. Special Collections is open.',
    hint: 'The four recovered titles are mixed up. Rearrange them into a meaningful word.'
  }
];

// A small book cover with the book's one-letter title on it
function makeBook(secret) {
  const book = document.createElement('span');
  book.className = 'book';
  book.title = SERIES_NAME + ', Volume ' + secret.volume;
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
  { id: 'reading-room',        file: 'reading-room.html',        name: 'Reading Room',        unlockedBy: 1,    secrets: [2] },
  { id: 'archives',            file: 'archives.html',            name: 'The Archives',       unlockedBy: 2,    secrets: [3] },
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

// Books found = volumes recovered (secrets 1-4; secret 5 is not a book)
function countFound() {
  let count = 0;
  for (let i = 0; i < BOOK_COUNT; i++) {
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
  unlock: new Audio('sounds/unlock.mp3'),
  paper: new Audio('sounds/paperfold.mp3'),    // the welcome note unfolding
  bell: new Audio('sounds/bell.wav')       // the librarian calling when someone is stuck
};

// played on every book in the Stacks when hovered (a new copy each time, see setupStacks)
const BOOK_SOUND = 'sounds/book.wav';

// Plays a sound. Returns a promise that fails if the browser blocked it
// (browsers block sound until the visitor has clicked something on the page).
function playSound(name) {
  const sound = sounds[name];
  sound.currentTime = 0;
  const playing = sound.play();
  playing.catch(function () {});
  return playing;
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

  stopNudge();   // they found it, no need to point at the librarian
  updateHeader();
  if (i < BOOK_COUNT) {
    document.querySelectorAll('#miniShelf span')[i].classList.add('new');
  }

  playSound('stamp');
  showFound(i);
}

function showFound(i) {
  document.getElementById('slipText').textContent = SECRETS[i].message;

  // Secrets 1-4 hand the player a recovered volume of the series
  const slipBook = document.getElementById('slipBook');
  slipBook.hidden = i >= BOOK_COUNT;
  if (i < BOOK_COUNT) {
    const caption = document.createElement('span');
    caption.className = 'slip-book-caption';
    caption.textContent = SERIES_NAME + ', Volume ' + SECRETS[i].volume + ' of IV: "' + SECRETS[i].title + '"';
    slipBook.replaceChildren(makeBook(SECRETS[i]), caption);
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

// ---------- Nudge: the librarian button shakes when someone seems stuck ----------
// If a page still has a secret to find after NUDGE_AFTER, the "Ask the librarian"
// button starts to shake and shows a small "Stuck?" tag until it is pressed.
let nudgeTimer = null;

function pageHasOpenSecret() {
  const page = findPage(document.body.dataset.page);
  return page.secrets.some(function (i) { return !state.found[i]; });
}

function startNudgeTimer() {
  clearTimeout(nudgeTimer);
  if (!pageHasOpenSecret()) return;
  nudgeTimer = setTimeout(function () {
    document.getElementById('askBtn').classList.add('nudge');
    // one ring of the desk bell, so the shaking button gets noticed
    // (if the browser blocks it because nothing was clicked yet, it simply stays quiet)
    playSound('bell');
  }, NUDGE_AFTER);
}

function stopNudge() {
  clearTimeout(nudgeTimer);
  document.getElementById('askBtn').classList.remove('nudge');
}

function setupLibrarian() {
  const askBtn = document.getElementById('askBtn');
  askBtn.title = 'If you are lost, ask the librarian';

  askBtn.addEventListener('click', function () {
    stopNudge();
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

  // The welcome note that explains the game.
  // It opens by itself a moment after the first visit, and "How to play" opens it again.
  const intro = document.getElementById('intro');
  const infoBtn = document.getElementById('infoBtn');
  const introClose = document.getElementById('infoClose');

  function openIntro() {
    intro.hidden = false;
    introClose.focus();

    // the paper rustles as the note opens. On a first visit the browser may block
    // the sound because nothing has been clicked yet, so it waits for the first click.
    playSound('paper').catch(function () {
      document.addEventListener('pointerdown', function () {
        if (!intro.hidden) playSound('paper');
      }, { once: true });
    });
  }

  function closeIntro() {
    intro.hidden = true;
    infoBtn.focus();
    if (!state.introSeen) {
      state.introSeen = true;
      saveState();
    }
    startNudgeTimer();   // the stuck timer starts once the note is closed
  }

  infoBtn.addEventListener('click', openIntro);
  introClose.addEventListener('click', closeIntro);

  // clicking the dark area around the note, or pressing Escape, also closes it
  intro.addEventListener('click', function (event) {
    if (event.target === intro) closeIntro();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !intro.hidden) closeIntro();
  });

  if (!state.introSeen) {
    setTimeout(openIntro, INTRO_DELAY);
  }
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
  // A soft "book lifted off the shelf" sound when the mouse moves onto a book.
  // Each hover uses its own copy of the sound so quick sweeps across the shelf can overlap,
  // with a slightly different pitch each time so it does not sound repetitive.
  let lastLift = 0;
  document.querySelectorAll('.spine').forEach(function (spine) {
    spine.addEventListener('mouseenter', function () {
      const now = Date.now();
      if (now - lastLift < 70) return;   // not too many at once when sweeping fast
      lastLift = now;

      const lift = new Audio(BOOK_SOUND);
      lift.volume = 0.5;
      lift.playbackRate = 0.9 + Math.random() * 0.25;
      lift.play().catch(function () {});   // stays quiet until the page has been clicked once
    });
  });

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


}

// =========================================================
// The Archives: Secret 4, the forgotten word
// =========================================================
function setupArchives() {
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
// Page 4: Checkout Card — five stamped secrets and the shelf of volumes
// =========================================================
function setupCheckoutCard() {
  const rows = document.getElementById('checkoutRows');

  // Display the four volumes: where each was found, its stamp, and the book.
  // (The shelf mark is not a book, so it has no row; the shelf below shows it.)
  function renderCard() {
    rows.replaceChildren();

    SECRETS.slice(0, BOOK_COUNT).forEach(function (secret, i) {
      const row = document.createElement('div');
      row.className = 'checkout-entry';

      const name = document.createElement('span');
      name.textContent = secret.name;

      const status = document.createElement('span');
      status.className = state.found[i] ? 'checkout-stamped' : 'checkout-locked';
      status.textContent = state.found[i] ? 'STAMPED · ' + state.dates[i] : 'LOCKED';

      // The recovered volume, or an empty space until it is found
      let book;
      if (state.found[i]) {
        book = makeBook(secret);
      } else {
        book = document.createElement('span');
        book.className = 'book empty';
      }

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
      return i < BOOK_COUNT && state.found[i] && secret.title === input.value;
    });
    input.classList.toggle('filled', Boolean(book));
    input.style.setProperty('--c', book ? book.colour : '');
  }

  inputs.forEach(function (input, index) {
    input.addEventListener('input', function () {
      const clean = input.value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase();
      input.value = clean;
      paintBox(input);
      input.classList.remove('position-correct', 'position-wrong', 'position-shake');

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
        inputs[index + offset].classList.remove('position-correct', 'position-wrong', 'position-shake');
      }

      inputs[Math.min(index + pasted.length, inputs.length - 1)].focus();
    });
  });

  // Secret 5: check the four book titles on the shelf.
  // A correct answer unlocks Special Collections.
  // A wrong answer shakes the shelf.
  const feedback = document.getElementById('shelfFeedback');

  function checkShelfMark() {
    if (!state.found.slice(0, BOOK_COUNT).every(Boolean)) {
      feedback.textContent = 'Some volumes are still missing. Find them first.';
      return;
    }

    const answer = inputs.map(function (input) {
      return input.value.trim().toUpperCase();
    }).join('');

    inputs.forEach(function (input, index) {
      const correct = input.value.toUpperCase() === FINAL_CODE[index];
      input.classList.remove('filled', 'position-correct', 'position-wrong', 'position-shake');
      input.classList.add(correct ? 'position-correct' : 'position-wrong');
      if (!correct) {
        void input.offsetWidth;
        input.classList.add('position-shake');
      }
    });

    if (answer === FINAL_CODE) {
      feedback.textContent = 'All four positions are correct! Special Collections unlocked.';
      unlockSecret(4);
      renderCard();
      updateSpecialLink();
    } else {
      feedback.textContent = 'Green = correct position. Red = wrong position. Change the red letters and check again.';
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

  // Display the four recovered volumes and where each one was found.
  SECRETS.slice(0, BOOK_COUNT).forEach(function (secret, i) {
    const row = document.createElement('div');
    row.className = 'final-secret-row';

    // the recovered volume takes the place of the row number
    const number = makeBook(secret);
    number.classList.add('secret-number');

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
  if (page === 'archives') setupArchives();
  if (page === 'checkout-card') setupCheckoutCard();
  if (page === 'special-collections') setupSpecialCollections();

  // the hall reads "visited" first, so it is marked after setup
  markVisited(page);

  // On the first visit the front desk starts the stuck timer when the welcome note closes
  if (page !== 'front-desk' || state.introSeen) {
    startNudgeTimer();
  }
}