
console.log("Extracting the data");

function extractData() {
    let table$ = document.querySelector(".most-numbers");
    let rows$ = table$.querySelectorAll("tr");
    let result = [];

    let companyName$ = document.querySelector(".classic tbody tr td:nth-child(2)");
    let companyName = companyName$.textContent;

    for (let row$ of rows$) {
        let columns$ = row$.querySelectorAll("td");
        if (columns$.length === 3) {
            result.push({
                name:    normalizeName(columns$[0].textContent),
                amount:  normalizeAmount(columns$[1].textContent),
                precent: normalizePrecent(columns$[2].textContent),
            });
        }
    }
    return {
        name: companyName,
        rows: result,
    };
}

function normalizeName(name) {
    return name.toLowerCase().trim();
}

function normalizeAmount(amount) {
    return parseInt(amount.replace(/\s/ig, "").trim(), 10);
}

function normalizePrecent(precent) {
    return parseFloat(precent.replace(" %", "").replace(",", "."));
}

chrome.runtime.sendMessage({
    type: "extract",
    created: Date.now(),
    data: extractData(),
});
