#!/bin/bash
set -euxo pipefail

mkdir -p out

if [ -z ${1+z} ];
then
    ./listpages.js >out/pagelist.txt

    set +x
    echo "wrote a list of pages to out/pagelist.txt"
    echo "please copy the contents of out/pagelist.txt"
    echo "then go the the follwing website and export the pages"
    echo "https://themountaingoats.fandom.com/wiki/Special:Export"
    echo "finally, save the xml dump rerun this command:"
    echo "$0 path-to-export.xml"
else
    xq '.' "$1" > out/pages.json
    ./main.js <out/pages.json
fi