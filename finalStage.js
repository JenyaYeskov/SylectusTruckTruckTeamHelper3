'use strict';

const jsdom = require("jsdom");
const {JSDOM} = jsdom;
let fs = require('mz/fs');
let db = require('./db.json');
let moment = require('moment');

let express = require('express');
let app = express();

let latestDate;


app.listen(5555, () => {
    console.log('Example app listening on port 5555!');
});


app.get('/', async (req, res) => {

    try {
        console.log("in /");

        let file = await readFile("./index.html");

        let document = await getDOMFromFile(file);

        let trElements = await getLatestTTElements(document);

        let table = await makeTable(document, trElements);

        await appendTableToDocument(document, table);

        await writeNewDOMToFife("./index.html", document);

        res.sendFile("C:/Users/Dispatcher/Documents/projects/TruckTeamHelper3/index.html");
    } catch (e) {

        console.log(e);
    }

});


async function readFile(name) {
    let file;

    try {
        await fs.truncate(name);

        file = await fs.readFile(name);
    } catch (e) {
        console.log(e);
    }

    return file;
}

async function getDOMFromFile(file) {

    let DOM;

    try {
        DOM = new JSDOM(file.toString()).window.document;
    } catch (e) {
        console.log(e);
    }

    return DOM;
}


async function getNewestRecordsInDB() {

    let TTRecords = db.TTRecords;

    let newest = TTRecords[0];

    for (let i = 0; i < TTRecords.length; i++) {

        let date = await moment(TTRecords[i].date, "MM-DD-YYYY");

        if (date.isAfter(moment(newest.date, "MM-DD-YYYY"))) {
            newest = TTRecords[i];
        }
    }

    return newest;
}


async function getLatestTTElements(document) {

    let newest = await getNewestRecordsInDB();

    latestDate = newest.date;

    newest = newest.records;

    return makeTTElements(newest, document);
}


async function makeTTElements(elements, document) {

    let trElements = [];

    for (let i = 0; i < elements.length; i++) {

        let trElem = document.createElement("tr");


        for (let key in elements[i]) {
            if (key !== "id") {

                let th = document.createElement("th");

                th.textContent = elements[i][key];


                trElem.appendChild(th);
            }
        }

        trElements.push(trElem);
    }

    console.log(trElements);

    return trElements;
}


async function makeTable(document, trElements) {

    let table = document.createElement("table");


    for (let i = 0; i < trElements.length; i++) {

        table.appendChild(trElements[i]);
    }

    return table;
}

async function makeHeaderWithLatestDate(document) {

    let div = document.createElement("div");

    let date = document.createElement("h1");

    date.textContent = latestDate;

    div.appendChild(date);

    return div;
}


async function appendTableToDocument(document, table) {

    let div = document.createElement("div");

    let counter = document.createElement("h1");

    counter.textContent = table.rows.length;

    div.appendChild(table);

    document.body.appendChild(await makeHeaderWithLatestDate(document));

    document.body.appendChild(div);

    document.body.appendChild(counter);
}

async function writeNewDOMToFife(fileName, document) {

    try {

        await fs.writeFile(fileName, document.documentElement.outerHTML);

    } catch (e) {
        console.log(e);
    }
}

// json-server -p 3003 db.json
//http://localhost:5555/
//node finalStage.js


//  npm run start