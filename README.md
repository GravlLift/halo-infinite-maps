# @gravllift/halo-infinite-maps

Halo Infinite map data, self-contained.

- `images/` — top-down map background images (WebP).
- `data/objectives.json` — objective placements (flags, hills, zones…) and the quantization bounds film positions are normalized to.
- `data/backgrounds.json` — image calibration (`entries`) and a map module/name → entry `index`.
- `data/film-layouts.json` — hand-measured film position layouts for maps that detection can't recover.

```ts
import { mapBackgroundFor, mapObjectivesFor } from '@gravllift/halo-infinite-maps';
```

`mapBackgroundFor` returns an image file name; serve `images/` however your app prefers.

The `data/` and `images/` contents are currently a one-off import. Generation from game data is
not implemented yet (`npm run build:catalog` throws).
