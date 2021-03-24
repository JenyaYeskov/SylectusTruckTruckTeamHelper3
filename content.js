'use strict';

// const mongodb = require('mongodb');
// const uri = "mongodb://jeskow:7447030j@ds261648.mlab.com:61648/truck_team_helper"
const dbjson = "http://localhost:3003/TTRecords"
const orderNumbersDB = "http://localhost:3003/orderNumbers"


async function addOrderNumberToDB(number) {

    let data = {Number: number};

    await makeRequestWithData(orderNumbersDB, data, 'POST');
}


async function addNewDateAndTTRecordToDB(record, date) {

    let data = {
        date: date,
        records: [record]
    }

    await makeRequestWithData(dbjson, data, 'POST');
}


async function makeRequestWithData(address, data, method) {

    try {
        let result = await fetch(address, {
            method: method,
            headers: {'Content-Type': 'application/json;charset=utf-8'},
            body: JSON.stringify(data)
        });

        // console.log(result.status);
        alert(result.status);
    } catch (err) {
        alert("ERROR");
        console.log(err);
    }
}


async function addNewTTRecordToExistingDateInDB(record, date) {

    let todayRecords = await fetch(dbjson + "?date=" + date);
    todayRecords = await todayRecords.json();

    let newTTRecordsArray = todayRecords[0].records;
    newTTRecordsArray.push(record);

    let data = {records: newTTRecordsArray};

    await makeRequestWithData(dbjson + "/" + todayRecords[0].id, data, 'PATCH');
}


async function isOrderNumberExist(orderNumber) {

    return await isEntityExist(orderNumbersDB + "?Number=" + orderNumber);
}


async function isDateExist(date) {

    return await isEntityExist(dbjson + "?date=" + date);
}


async function isEntityExist(address) {

    let entity = await fetch(address);

    entity = await entity.json();

    return entity.length > 0
}


function createTTTable(TTElements) {

    let myTr = document.createElement("tr");

    for (let i = 0; i < TTElements.length; i++) {

        let th = document.createElement("th");
        th.textContent = TTElements[i];

        myTr.appendChild(th);
    }

    return myTr;
}


function getRate(tdElements) {
    let rate = tdElements[4].querySelectorAll("span")[1].textContent;
    rate = rate.slice(1, -3);

    if (rate.includes(",")) {
        rate = rate.replace(/,/, "");
    }
    return rate;
}

function getAddresses(tdElements) {
    let fromCity = tdElements[2].querySelectorAll("span")[2].firstChild.textContent;
    let toCity = tdElements[3].querySelectorAll("span")[2].firstChild.textContent;

    return fromCity + " - " + toCity;
}

function getDate(tdElements) {
    let date = tdElements[1].querySelectorAll("span")[1].textContent;
    date = date.slice(0, -7);

    return date;
}

function getOrderNumber(tdElements) {
    return tdElements[0].querySelector("div").querySelector("a").textContent;
}

function getTdElements() {
    let table = document.getElementById("ctl00_bodyPlaceholder_orderInquiry");
    let tr = table.querySelector("tr");

    return tr.querySelectorAll("td");
}

function getTTElements() {
    let elementsContainer = getTdElements();

    let orderNumber = getOrderNumber(elementsContainer);
    let addresses = getAddresses(elementsContainer);
    let rate = getRate(elementsContainer);
    let date = getDate(elementsContainer);

    let TTElements = [];

    TTElements.push(date);
    TTElements.push(orderNumber);
    TTElements.push("Carolina Logistics");
    TTElements.push(addresses);
    TTElements.push(rate);

    return TTElements;
}


async function getDateString() {
    let now = new Date();

    return now.getMonth() + 1 + "." + now.getDate() + "." + now.getFullYear();
}

chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
        if (request.message === "clicked_browser_action") {

            let TTElements = getTTElements();
            document.body.appendChild(createTTTable(TTElements));

            let record = {
                time: TTElements[0],
                orderNumber: TTElements[1],
                company: TTElements[2],
                cities: TTElements[3],
                rate: TTElements[4]
            }

            let today = await getDateString();

            if (!await isOrderNumberExist(record.orderNumber)) {
                console.log("Creating new load");

                if (await isDateExist(today)) {

                    console.log("Adding to existing date");

                    addNewTTRecordToExistingDateInDB(record, today);
                    addOrderNumberToDB(record.orderNumber);

                } else {

                    console.log("Creating new date");

                    addNewDateAndTTRecordToDB(record, today);
                    addOrderNumberToDB(record.orderNumber);

                }
            } else {
                alert("Load is already exsist in DB");
                console.log("Load is already exsist in DB");
            }
        }
    }
);

// json-server -p 3003 db.json
