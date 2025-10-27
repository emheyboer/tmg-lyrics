# Requirements
1. `nodejs`
2. `xq`

# Steps
1. Run `main.sh` to get a list of pages
2. Export those pages (from `out/pagelist.txt`)
3. Run `main.sh path-to-export.xml`
4. (optional) Add new singles/EPs/whatever to the appropriate collection in `album_map_template.json` and rerun `main.sh path-to-export.xml`

# Output Files
1. `out/pagelist.txt`: list of pages to export 
2. `out/pages.json`: JSON version of export
3. `out/album_list.js`: list of albums used by UI for filtering
4. `out/album_map.json`: many releases -> broader categories (using `album_map_template.json`)
5. `out/lyrics.json`: used by app for searching & displaying lyrics
6. `out/lyrics.txt`: plain text of all lyrics
