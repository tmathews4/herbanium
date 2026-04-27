# Icon Options

Three drafts of a stylized H mark for Herbanium, all 1024×1024 SVG
on the `#F3ECDC` ivory background that matches the app's main bg.

| File | Voice | Palette |
| --- | --- | --- |
| `h-clean.svg` | Modernist apothecary monoline | sageDeep on ivory |
| `h-botanical.svg` | Herbalist twig + leaf register | sage strokes, ochre leaf |
| `h-stamp.svg` | Hand-pressed apothecary seal | terra strokes, wax-bead corners |

## Previewing

Open any of the SVGs in a browser to view at full size. They're
plain SVG so you can also drop them into Figma, Affinity, or
Inkscape if you want to riff on one.

## Picking one and committing

Once you've chosen, rename the chosen file (or a derivative) to
`assets/icon.png` after exporting at 1024×1024. Then:

```sh
npm run cap:assets
```

That regenerates every required size for both iOS and Android.

## Exporting SVG → PNG without installing anything

A few quick paths:

- **Browser**: open the SVG in Chrome/Firefox, right-click the
  rendered image, "Save image as…" (this gives you a 1024×1024 PNG).
- **macOS Preview**: open the SVG, File → Export, set format PNG.
- **CLI** (if you have `rsvg-convert` or ImageMagick): `rsvg-convert
  -w 1024 -h 1024 h-clean.svg -o ../icon.png`.

## Tweaks I can make per variant

- Stroke weight (chunkier = more app-icon legible at 48×48)
- Color swaps (any of the theme palette: `#4A573A`, `#6D7E55`,
  `#B0542F`, `#A57836`, `#7B4A5A`)
- Diagonal angle / thickness
- Background — currently ivory; could go cream `#FAF4E4` or a
  filled green/terra panel with a light H on top
- Add a serif "h" inside or alongside the geometric mark

Tell me which variant resonates and what to push and I'll iterate.
