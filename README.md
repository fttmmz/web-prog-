# The Forgotten Shelf: Project Proposal&#32;

## The idea in brief

**The Forgotten Shelf** is a small website that looks like a quiet, old-fashioned library catalog. Hidden inside it are five secrets. Visitors have to click, hover, type and look closely to find them. Each secret shows a short message, gives a clue, and adds a stamp to a checkout card.

**Goal:** find all five secrets to unlock the locked Special Collections room.

The site should feel like a game, not an ordinary webpage. Progress is saved in the browser (localStorage), so it carries across pages. The tagline is *"Some books were never returned."*&#32;

## How the game works

The player follows one loop, from the first visit to the final room:

1. **Arrive.** The Front Desk says "Something is missing from this library. Look closer." A counter reads `BOOKS FOUND: 0 of 5`.
2. **Explore.** The player visits the four open pages and clicks, hovers and types to look for anything odd.
3. **Discover.** Each secret found plays a stamp animation and a sound, shows a short message, and reveals one letter on a slip of paper.
4. **Collect.** Every letter is saved on the Checkout Card, which gets a date stamp for that secret.
5. **Combine.** On the Checkout Card the player puts the four letters together and types the four-letter shelf mark. This is secret 5.
6. **Unlock.** Special Collections opens with a celebration screen and a "Return all books" button that restarts the game.

A player who is stuck can press "Ask the librarian" on any page for a hint about the next secret they haven't found.

## Look and feel

The site should look like a library catalog from decades ago: paper, ink, index cards and rubber stamps. It should not look like a modern template.

| Role | Colour | Used for |
| --- | --- | --- |
| Paper | `#F3EBDD` | Page background |
| Ink | `#2B2622` | Body text |
| Library green | `#2F4A3A` | Headings, navigation, buttons |
| Stamp blue | `#31407A` | Stamps, links, the counter |
| Tan | `#B9AD98` | Borders and rules |
| Lights-out | `#16211C` | Night-mode background, with cream text `#E9E0CC` |

- **Fonts:** Georgia for headings and text. Courier New for the counter, labels and the checkout card. Both are built into browsers, so there is nothing to download.
- **Index cards:** content sits on cards with a thin tan border, square corners and a ruled line under the title.
- **Navigation:** five links styled as drawer-label tabs. The Special Collections tab says `LOCKED` until it is unlocked.
- **Book spines:** plain CSS rectangles in muted colours with a text label, so no images are needed.
- **Found effect:** a blue `FOUND` stamp, tilted about 6 degrees, that scales down onto the page using CSS keyframes, with a short stamp sound.
- **Lights-out mode (after secret 4):** add a `night` class to `<body>`. The same CSS variables switch to the dark values.
- **Avoid:** gradients, glows, neon, glass-style cards, pill-shaped buttons, purple and emoji. Use flat colours, square corners and real borders.

## The five pages

Every page has the same navigation bar, the `BOOKS FOUND` counter, an "Ask the librarian" button, and the same `style.css` and `script.js`. Each page has a `data-page` name on `<body>`, so the shared script knows which page code to run.

### 1. The Front Desk (`index.html`)

- **Purpose:** introduce the library and start the hunt.
- **On the page:** the library crest (logo), the title and tagline, two index cards ("Explore" and "Unlock") that explain the rules, and the counter. The footer says "Silence, please.", which is the clue for secret 4.
- **Secret 1, the crest:** the crest has five small stars and one is a slightly different colour. Clicking the crest five times shows a slip of paper: "Look closer. The first letter is L."
- **JavaScript:** a click counter on the crest. At 5 clicks, call `unlockSecret(0)`.

### 2. The Stacks (`stacks.html`)

- **Purpose:** the browsable collection.
- **On the page:** three shelves with about 12 book spines made from CSS rectangles. Spines lift slightly on hover and show a title.
- **Secret 2, the bookplate:** one book has a tiny symbol in the corner of its cover that is almost invisible. Hovering over that book fades it in with the message: "A bookplate was hiding here. The second letter is O."
- **JavaScript:** `mouseenter` on that book, plus `click` so it also works on touch screens. Call `unlockSecret(1)`.

### 3. The Reading Room (`reading-room.html`)

- **Purpose:** the two thinking puzzles.
- **On the page:** a table with three books, a note on the wall, and an "Ask the librarian" text box.
- **Secret 3, the shelf order:** the books are titled "Morning Tea", "Midday Walk" and "Evening Lamp", which hints at the order of the day. Clicking them in that order shows: "Shelved correctly. The third letter is S." A wrong order makes the books shake and resets the clicks.
- **Secret 4, the forgotten word:** the wall note says: "The librarian answers to one word, printed on every library wall." Typing `SILENCE`, in the text box or anywhere on the page, switches to lights-out mode and shows: "The lights go out. The fourth letter is T."
- **JavaScript:** an array of clicked books compared with a `correctOrder` array. For the word, a `keydown` listener keeps the last 7 typed characters and compares them with `silence`.

### 4. The Checkout Card (`checkout-card.html`)

This is the Secret Journal.

- **Purpose:** the notebook and progress page.
- **On the page:** a checkout card in Courier with five rows, one per secret. Each row shows the secret's name, `LOCKED` or a blue date stamp, and its letter. Below are four letter slots (`_ _ _ _`), a shelf-mark text box with a Check button, a "Return all books" button and the hint button.
- **Secret 5, the shelf mark:** the player types the four letters in order (`LOST`). A correct answer shows a stamp and a link to Special Collections, and unlocks its tab. A wrong answer shows "That is not on the shelf." and shakes the box. If fewer than four letters are found, it says "Find the other letters first."
- **JavaScript:** draw the card from the saved state. Compare the text box (made uppercase) with `FINAL_CODE`.

### 5. Special Collections (`special-collections.html`)

- **Purpose:** the reward screen.
- **On the page:** a large `ALL BOOKS FOUND` stamp that animates in, a list of the five secrets with their messages, the line "Some books were never returned. You found them all.", and a "Play again" button.
- **Access rule:** if secret 5 is not found, the page sends the player to the Checkout Card.
- **JavaScript:** call `checkPageAccess()` first, then play the stamp animation and the unlock sound.

## The five secrets

Secrets 1 to 4 each give one letter. Together the letters spell the shelf mark `LOST`, which the player types in secret 5. The team can change the word, as long as the reward letters match it.

| # | Secret | Page | Visual hint | Interaction | Reward |
| --- | --- | --- | --- | --- | --- |
| 1 | The Crest | Front Desk | One of the five stars on the crest is a different colour | Click the crest 5 times | Message + letter **L** |
| 2 | The Bookplate | The Stacks | One book has a faint mark in its corner | Hover over that book | Symbol, message + letter **O** |
| 3 | The Shelf Order | Reading Room | Book titles follow the day: Morning, Midday, Evening | Click the three books in that order | Message + letter **S** |
| 4 | The Forgotten Word | Reading Room | Wall note: the librarian answers to one word printed on every library wall | Type `SILENCE` | Lights-out mode, message + letter **T** |
| 5 | The Shelf Mark | Checkout Card | The card has four empty letter slots | Type `LOST` and press Check | Unlocks Special Collections |

**Hints.** "Ask the librarian" shows the hint for the first secret that is not yet found. Suggested wording:

1. "Some crests are worth more than a glance. Try pressing the one at the front desk."
2. "Not every book wants to be opened. Some only want to be noticed. Check the shelves."
3. "The librarian shelves books by the hours of the day."
4. "Look at the bottom of the front desk page. Then say it quietly to the librarian."
5. "Four letters make one word. Where do they go?"

## 
