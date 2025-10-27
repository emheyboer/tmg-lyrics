#!/usr/bin/env node
const api = "https://themountaingoats.fandom.com/api.php";

function paramsToSearch(params) {
    return Object.keys(params).map((key) => {
        return `${key}=${params[key]}`
    }).join('&')
}

async function listPages() {
    let pages = [];
    let params = {
        action: "query",
        format: "json",
        list: "allpages",
        aplimit: "500",
        apcontinue: ""
    }

    while (true) {
        let url = `${api}?origin=*&${paramsToSearch(params)}`;
        console.error(`fetching ${url}`);

        let newPages = await fetch(url)
            .then((response) => {
                return response.json()
            })
            .then((response) => {
                return response.query.allpages
            })
            .catch((error) => {
                console.log(error)
            });


        pages = pages.concat(newPages);
        if (newPages.length <= 1) {
            return pages
        }

        params.apcontinue = newPages.pop().title;
    }
}

let allpages = await listPages();
allpages.forEach(page => {
    console.log(page.title);
})
