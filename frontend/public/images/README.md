# Photography slots

The frontend loads these files if present and shows a designed honeycomb fallback otherwise.
Use landscape JPGs around 2000px wide (portrait for `auth.jpg`), compressed to ~200–400 KB.

| File | Used in | Suggested subject |
| --- | --- | --- |
| `hero-bee.jpg` | Landing · story section | Close-up of a honey bee on comb |
| `apiary.jpg` | Landing · gallery (wide) | Row of hives in a field |
| `frame.jpg` | Landing · gallery | Beekeeper holding a brood frame |
| `flower.jpg` | Landing · gallery | Bee foraging on a flower |
| `comb.jpg` | Landing · features card | Capped honeycomb macro |
| `auth.jpg` | Login / sign-up side panel (portrait) | Bees at the hive entrance |

After adding or replacing photos, rebuild: `cd frontend && npm run build`.
Make sure you have the rights to every photo you use (e.g. your own, Unsplash licence, CC0).
