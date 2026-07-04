# ShazRics — Theme Palettes

Ready-to-use palettes for the **user-selectable themes** feature (ROADMAP Phase 6).
This file is the **authoritative source** for the token values — a fresh Claude
Code session can implement the whole feature from here without re-deriving colours.

Each palette fills the app's nine design-token slots. Because every screen reads
through those tokens (see `css/base.css` `:root` and the `css/dark.css` override
layer), **a theme is just one `[data-theme="…"] { … }` block** — no component
edits. `dark.css` (Midnight & Gold) is the working proof of this pattern.

Visual reference (rendered on the real play card): the palette-comparison
Artifact from the design session — <https://claude.ai/code/artifact/41bf3321-5dc3-480c-b266-1e21d4d41dc5>
(a new session can `WebFetch` it, but the hex values below are authoritative).

## Status

| Theme | Kind | Wired up? | Where |
|---|---|---|---|
| **Plum & Cream** | light | ✅ live | `css/base.css` `:root` (the light baseline) |
| **Midnight & Gold** | dark | ✅ live — **current default** | `css/dark.css` (`[data-theme="dark"]`) |
| Emerald & Cream | light | designed, not wired | this file |
| Teal & Sand | light | designed, not wired | this file |
| Sunset Terracotta | light | designed, not wired | this file |
| Cobalt & Cream | light | designed, not wired | this file |

## Token slots

| Token | Role |
|---|---|
| `--plum` | primary brand / accent (buttons, timer, active states) |
| `--plum-deep` | deep accent (headers, gradients, hero) |
| `--plum-soft` | soft accent tint on the surface |
| `--cream` | primary surface / card base |
| `--cream-deep` | page background |
| `--ink` | body text |
| `--muted` | muted / secondary text |
| `--gold` | winner gold (crown, podium, reveal button) |
| `--mauve` | secondary accent |

`--color-primary` aliases `--plum` in light themes, so a light theme only needs
to set the nine tokens above. (Dark themes like Midnight & Gold additionally
override `--color-primary`, `--color-charcoal`, etc. — see `dark.css`.)

## The four light alternatives (values)

| Slot | Plum & Cream (live) | Emerald & Cream | Teal & Sand | Sunset Terracotta | Cobalt & Cream |
|---|---|---|---|---|---|
| `--plum` (primary) | `#6D4C7D` | `#2E6B4E` | `#1E7A8C` | `#C05A38` | `#34558B` |
| `--plum-deep` | `#43304F` | `#1C4433` | `#0E4B5A` | `#7C3620` | `#21375A` |
| `--plum-soft` | `#EBE1EF` | `#DDEBE3` | `#DBEAEE` | `#F6E1D7` | `#E0E7F1` |
| `--cream` | `#FAF5EE` | `#FAF7F0` | `#FBF7F0` | `#FBF6EE` | `#FAF7F1` |
| `--cream-deep` | `#F0E8DC` | `#EEE8DA` | `#EFE7D7` | `#F2E7D8` | `#EDE7D9` |
| `--ink` | `#2C2430` | `#1E2A24` | `#1D2A2E` | `#2E201A` | `#1E2733` |
| `--muted` | `#8A7E8F` | `#7B8A82` | `#7C8A8E` | `#8F7C71` | `#7D8794` |
| `--gold` | `#C6A15B` | `#C6A15B` | `#E0A34F` | `#E3A93C` | `#D2A24C` |
| `--mauve` (secondary) | `#A67BA0` | `#6FB49A` | `#E07A5F` | `#4E8D86` | `#E07A5F` |

Ready-to-paste blocks (a new light theme is this small):

```css
[data-theme="emerald"] {
  --plum:#2E6B4E; --plum-deep:#1C4433; --plum-soft:#DDEBE3;
  --cream:#FAF7F0; --cream-deep:#EEE8DA; --ink:#1E2A24;
  --muted:#7B8A82; --gold:#C6A15B; --mauve:#6FB49A;
}
[data-theme="teal"] {
  --plum:#1E7A8C; --plum-deep:#0E4B5A; --plum-soft:#DBEAEE;
  --cream:#FBF7F0; --cream-deep:#EFE7D7; --ink:#1D2A2E;
  --muted:#7C8A8E; --gold:#E0A34F; --mauve:#E07A5F;
}
[data-theme="sunset"] {
  --plum:#C05A38; --plum-deep:#7C3620; --plum-soft:#F6E1D7;
  --cream:#FBF6EE; --cream-deep:#F2E7D8; --ink:#2E201A;
  --muted:#8F7C71; --gold:#E3A93C; --mauve:#4E8D86;
}
[data-theme="cobalt"] {
  --plum:#34558B; --plum-deep:#21375A; --plum-soft:#E0E7F1;
  --cream:#FAF7F1; --cream-deep:#EDE7D9; --ink:#1E2733;
  --muted:#7D8794; --gold:#D2A24C; --mauve:#E07A5F;
}
```

## Midnight & Gold (the live dark default) — resolved values

Already implemented in `css/dark.css`; listed here for reference. It repurposes
the slots for a dark surface + gold primary, so it also overrides the
`--color-*` aliases (see the file).

```
gold (primary)   #C9A24E     midnight page      #14111C
gold (winner)    #E0BE6A     card surface       #221C31
gold (deep)      #8A6C33     raised surface     #2C2540
plum (secondary) #8F72AB     cream text         #F1EADD     muted #9B9086
```

## How a new session implements Phase 6 from this file

1. **Tokenize the holdouts first.** Grep for hardcoded plum rgba / hexes that
   aren't reading a token (`rgba(109,76,125,…)`, the timer track in `timer.js`,
   the `celebrate()` confetti colours in `anim.js`, `.confetti` in `screens.css`)
   and point them at tokens so every palette looks intentional.
2. **Add the theme blocks.** Drop the four CSS blocks above into a `css/themes.css`
   (or extend `dark.css`), add it to `index.html` + the `PRECACHE` list, bump
   `CACHE`. Light alternatives only need the nine tokens; a *dark* alternative
   would follow the fuller `dark.css` recipe (override `--color-*` too).
3. **Generalize the switcher.** Extend `preferences.theme` from `system|light|dark`
   to any theme id; in `js/theme.js`, `apply()` sets `data-theme` to the id
   (explicit themes) or resolves `system` → a chosen light/dark pair. Update the
   pre-paint boot script in `index.html` to read the same value.
4. **Theme picker in Settings** (`js/screens/settings.js`): a grid of tappable
   swatches, reusing the swatch style from the comparison Artifact. Persist on tap.
5. **Dynamic `theme-color`.** On theme change, set `<meta name="theme-color">` (and
   optionally re-tint `manifest`-driven chrome) from the active `--cream-deep`.
6. **Each theme declares light vs dark** (a small map in `theme.js`) so the topbar
   icon and the `system` mapping stay correct.

Keep the golden rule: recolour through tokens; never edit the light palette in
the base stylesheets to make another theme work.
