# The game: Big O

A Higher or Lower game about software development. Two cards show two things from one topic,
for example *Python* and *Git*. The first card shows its number, and the player guesses whether
the second card's number is higher or lower. A right guess scores a point, the second card
becomes the first, and a new card is dealt. One wrong guess ends the game.

The name is a working title: Big O as in the notation for how an algorithm's cost grows, and as
in "big or not". Change `GAME_NAME` in [src/app/game/game.page.ts](../src/app/game/game.page.ts).

## How a game runs

- Topics change every 5 right guesses (`ROUNDS_PER_CATEGORY`), in a random order that cycles.
- The game never deals a tie: two cards never show the same number, as displayed.
- Within a game, cards not dealt yet come first; cards repeat only when a topic runs out.
- The game gets harder as the score grows: from a score of 20, only the closest 30% of the
  pairs are dealt ([src/app/game/game-engine.ts](../src/app/game/game-engine.ts)).
- The best score is kept per device, in the browser's local storage
  (`relational-devdays.best-score`). The game asks for no names and sends nothing anywhere: it
  has no server, accounts, cookies or analytics.

## The question pack

The questions live in one JSON file,
[src/app/game/packs/devdays-2026.json](../src/app/game/packs/devdays-2026.json), with one fact per
line so changes are easy to review.

```json
{
  "id": "devdays-2026",
  "categories": [
    {
      "id": "firsts",
      "title": "Which came first?",
      "caption": "Year of first release, launch or founding. Source: Wikipedia.",
      "format": "year",
      "unit": "",
      "question": "Earlier or later than {name}?",
      "higher": "Later",
      "lower": "Earlier",
      "items": [
        { "id": "python", "name": "Python", "detail": "Programming language", "value": 1991, "source": "https://en.wikipedia.org/wiki/Python_(programming_language)", "asOf": "2026-10-15" }
      ]
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `title` | The topic, above the cards and on the start screen. |
| `caption` | Small copy under the cards: what the number means and where it comes from. |
| `format` | How numbers show: `year` (1991), `integer` (27), `compact` (251K), `percent` (57.9%, stored as `57.9`) or `dollars` ($2.94B, US dollars to three digits). |
| `unit` | Shown under a revealed number, such as `stars`; empty for years. |
| `question` | Asked on the second card. `{name}` stands for the first card's name. |
| `higher`, `lower` | The two answer buttons, such as *Later* and *Earlier*. |
| `id` | Lower-case words joined by `-`, unique within the topic. |
| `name`, `detail` | The card's title and its one-line description. |
| `value` | The number. Whole numbers, except for `percent`. |
| `source` | An `https` page that states the number, so a reviewer can check it. |
| `asOf` | When the number held, or was checked: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. |

To change the questions, edit the JSON and run `npm test`. A unit test runs
[`validatePack`](../src/app/game/validate-pack.ts) on the pack and lists every problem: a missing
field or source, an invalid date, a duplicate, or a topic with fewer than 6 different numbers
(too few to play 5 rounds without a tie). The deploy workflow runs the tests first, so a broken
pack never reaches the site. To play another pack, point `QUESTION_PACK` in
[src/app/game/question-pack.ts](../src/app/game/question-pack.ts) at its file.

### Topics in the DevDays 2026 pack

All numbers were collected on 2026-10-15 (video games and box office on 2026-10-16) from public
sources.

| Topic | Facts | Numbers | Source |
| --- | ---: | --- | --- |
| Which came first? | 62 | Year of first release, launch or founding: languages, tools, platforms, famous incidents and fintech milestones | Wikipedia |
| GitHub stars | 33 | Stars of popular open-source repositories, rounded to thousands | GitHub |
| Developer survey | 35 | Share of developers who used a language, database, platform or tool in the past year | Stack Overflow Developer Survey 2025 |
| Video games | 32 | Copies sold on all platforms: from Tetris and Minecraft to Elden Ring and Black Myth: Wukong | Wikipedia, list of best-selling video games |
| Box office | 33 | Worldwide cinema ticket sales in US dollars: from Avatar and Avengers: Endgame to Frozen, Toy Story and A Minecraft Movie | Wikipedia, list of highest-grossing films |

*Which came first?* leaves out things whose first year is disputed or depends on the definition,
such as Rust, SQL, Vim and Emacs. GitHub stars keep changing; the caption states the date they
were counted. Video games count paid copies only, so free-to-play games such as Fortnite and
Roblox are not in the list. Box office figures are not adjusted for inflation, and films still in
cinemas keep earning; A Minecraft Movie is not in the top 50, so its figure comes from its own
article.

The pack has no facts about Relational. Facts about the company go into *Which came first?* only
once Marketing has supplied or approved them, with a public source.

## Booth mode

The booth tablets run the app installed and full screen; visitors' phones open it from the QR
code, in the browser or installed. Booth mode belongs to the device, not to the installed app:
[src/app/booth-mode.ts](../src/app/booth-mode.ts) switches it on when the address has `?booth`,
and the device remembers it (`relational-devdays.booth` in local storage), so the app installed
on a tablet keeps it. `?booth=off` switches it off again. To try it in a browser, open for
example `http://localhost:8080/?booth`. In booth mode the app:

- keeps the screen on (Screen Wake Lock), and takes the lock again when the app comes back to
  the front;
- blocks pinch zoom and the long-press menu, so visitors cannot leave the app zoomed in or open
  a menu;
- returns to the start screen after 60 seconds without a tap, so the next visitor starts a
  fresh game.

Phones that open the QR code never get booth mode, also when the app is installed: they keep
zoom (for accessibility) and their own screen timeout, and never reset a game.

### Setting up a booth tablet

1. Open <https://relational-sa.github.io/relational-devdays/?booth> in Chrome, so the tablet
   remembers booth mode. On Android the installed app shares Chrome's storage, so it has the
   setting too.
2. Install the app (menu > *Install app* or *Add to home screen*).
3. Open it from the home screen icon, so it runs full screen in booth mode.
4. Turn on Android screen pinning (Settings > Security, the exact menu depends on the vendor) and
   pin the app, so visitors cannot leave it.
5. Keep the tablet charging, and turn off battery saver: it can refuse the wake lock, and the
   tablet's own screen timeout then applies.
6. Turn on *Do not disturb*, so no notifications pop up over the game.

Clearing Chrome's data for the site also clears the setting: open the `?booth` address again.
