#!/usr/bin/env node
var fs = require('fs');

function main() {
    let data = fs.readFileSync(0, 'utf-8');
    const json = JSON.parse(data);
    const pages = json?.mediawiki?.page;

    // a song is any page that has lyrics
    const songs = pages.map(page => fromPage(page))
        .filter(song => song.lyricsText.length)
        .map(song => processLyrics(song));

    // maps many releases -> broader categories
    // template defines most categories 
    // with new releases uncategorized by default
    let albumMap = JSON.parse(fs.readFileSync('album_map_template.json', 'utf-8'));

    let albums = {};
    songs.forEach(song => {
        let album = song.album;
        if (albumMap[album]) {
            album = albumMap[album][0];
        }
        albumMap[album] = [album];

        albums[album] = albums[album] || {};

        albums[album][song.title] = song.lyrics;
    });

    // for the list of albums to filter by
    // must match album_map.json
    let albumList = Object.keys(albums).sort();

    console.log(`${songs.length} songs across ${albumList.length} collections`);

    writeFiles(albums, songs, albumMap, albumList);
}

function writeFiles(albums, songs, albumMap, albumList) {
    // used by the app for searching & displaying lyrics
    console.log('writing out/lyrics.json');
    try {
        fs.writeFileSync('out/lyrics.json', JSON.stringify(albums, null, 2));
    } catch (err) {
        console.error(err);
    }

    console.log('writing out/album_map.json');
    try {
        fs.writeFileSync('out/album_map.json', JSON.stringify(albumMap, null, 2));
    } catch (err) {
        console.error(err);
    }

    console.log('writing out/album_list.js');
    try {
        fs.writeFileSync('out/album_list.js',
            'export const ALBUMS = ' + JSON.stringify(albumList, null, 2));
    } catch (err) {
        console.error(err);
    }

    // for debugging purposes
    console.log('writing out/lyrics.txt');
    let lyricsText = songs.map(song => {
        return `${'='.repeat(60)}
${song.title}
${'='.repeat(60)}
${song.lyricsText}`;
    }).join('\n');
    try {
        fs.writeFileSync('out/lyrics.txt', lyricsText);
    } catch (err) {
        console.error(err);
    }
}

// this is pretty brittle and could use some improvements
String.prototype.cleanup = function () {
    const replacements = [
        [/<br>/g, '\n'],
        [/<.+?>/g, ''], // html tags
        [/\[\[.+?\|/g, ''], // wikilinks
        [/(\[|\]){2}/g, ''],
        ["''", ''],
        ['&mdash;', '—'], // the only html char code that appears
        [/\[(http\S+?\s)/g, ''],  // links
        [']', '']
    ];

    let text = this;
    for (let i = 0; i < replacements.length; i++) {
        const [pattern, sub] = replacements[i];
        text = text.replaceAll(pattern, sub);
    }

    return text;
}

function fromPage(page) {
    let song = {
        title: page.title,
        lyricsText: "",
        album: "",
    };

    const text = page.revision.text['#text'].cleanup();
    const lines = text.split('\n');
    let onLyrics = false;
    let onAlbum = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // extract album names from infoboxes
        // we only use the first album a song was released on,
        // so some albums will be unexpectedly sparse
        if (line.startsWith('|') && line.includes('=') && !song.album) {
            let [_key, value] = line.split('=');
            value = value.trim();

            if (value == 'Album') {
                onAlbum = true;
            } else if (onAlbum && value.length) {
                song.album = value;

                onAlbum = false;
            }
        }

        // indicates we've hit the next section or end of page
        if (line.startsWith('==') || line.startsWith('{{') || line.startsWith('[[')) {
            if (/==\s*Lyrics\s*==/.test(line)) {
                onLyrics = true;
            } else {
                onLyrics = false;
            }
            continue;
        }

        if (onLyrics) {
            song.lyricsText += line + '\n';
        }
    }

    song.lyricsText = song.lyricsText.trim();

    return song;
}

function processLyrics(song) {
    song.lyrics = [];

    let mult = {};
    let prev = '';
    let next = '';

    const lines = song.lyricsText.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.length) {
            prev = line;
            continue
        }

        if (lines[i + 1]) {
            next = lines[i + 1];
        } else {
            next = '';
        }

        // definitely a bad idea, but it's fast enough
        let lyric = JSON.stringify({
            "prev": prev,
            "lyric": line,
            "next": next,
        });
        mult[lyric] = (mult[lyric] || 0) + 1;

        prev = line;
    }

    Object.entries(mult).forEach(([key, value]) => {
        let lyric = JSON.parse(key);
        lyric.multiplicity = value;
        song.lyrics.push(lyric);
    });

    return song
}

main();