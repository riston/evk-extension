
// Chrome deps
const { clear, get, set } = chrome.storage.local;

// DOM elements
const selectList$ = document.querySelector(".share-list");
const panel$      = document.querySelector(".panel");

function startExtract () {
    chrome.tabs.executeScript(null, {
        file: "content_script.js"
    });
}

function renderSelectionList (select$, list) {
    const lines = list.map(row => {
        return `<option value="${row.created}">${row.name} - ${row.created}</option>`
    });

    const isLinesEmpty = lines => lines.length <= 0
        ? [`<option value="default">Extract before downloading</option>`]
        : lines;

    select$.innerHTML = isLinesEmpty(lines).join("\n");
}

function renderShareLists () {
    get({ records: {} }, result => {
        const dates = Object.keys(result.records);

        const lines = dates.map(date => {
            const created = parseInt(date, 10);
            return {
                name: result.records[date],
                created,
            };
        });

        renderSelectionList(selectList$, lines);
    });
}

function extractMessage (message) {
    const { created, data } = message;
    const saveEvent = { [created]: data, };

    get({ records: {} }, result => {
        result.records[created] = data.name;

        set(result, d => {
            console.log("Records key", d);
        });
    });

    set(saveEvent, () => {
        console.log("Saved storage");
    });
}

function createCSV ({ get }, createdDate) {
    const header = "Name;Amount;Precent\n";

    return new Promise((resolve) => {
        get([createdDate], data => {
            const { name, rows } = data[createdDate];

            const toStr = rows.map(row =>
                `${row.name};${row.amount};${row.precent}`)
                .join("\n");

            resolve(header + toStr);
        });
    });
}

function downloadCSV (fileName, content) {
    const pom = document.createElement("a");
    const blob = new Blob([content], {
        type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);

    pom.href = url;
    pom.setAttribute("download", fileName);
    pom.click();
}

function clickHandler (ev) {
    const { dataset } = ev.target;
    const { action } = dataset;

    if ("clear-all" === action) {
        clear();
    } else if ("extract" === action) {
        startExtract();
    } else if ("download" === action) {
        const created = selectList$.value;

        createCSV({ get }, created)
        .then(csvContent => downloadCSV(`report_${created}.csv`, csvContent));
    }
}

function onInit () {
    panel$.addEventListener("click", clickHandler);
    selectList$.addEventListener("changed", e => {
        console.log("Changed value", e.value);
    });

    renderShareLists();
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (key in changes) {
        var storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".',
            key,
            namespace,
            storageChange.oldValue,
            storageChange.newValue);
    }
    renderShareLists();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { type } = request;

    if (type === "extract") {
        extractMessage(request);
    }
});

document.addEventListener("DOMContentLoaded", onInit);
