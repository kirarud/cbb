# Avito banners (fast PNG export)

This folder contains simple HTML banner templates sized for Avito.

## Export to PNG (macOS, Google Chrome)

From repo root:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --hide-scrollbars --disable-gpu \
  --window-size=1080,1080 \
  --screenshot="tools/avito-banners/out/banner-1.png" \
  "file:///Users/kirarud/Projects/codex/tools/avito-banners/banner-1.html"
```

Repeat for `banner-2.html` and `banner-3.html` (update output/input filenames).

If you want a rectangular image, use `--window-size=1200,900` and pick a matching HTML file or adjust CSS.

