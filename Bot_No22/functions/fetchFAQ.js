const fs = require("fs")

async function fetchFAQ() {
    return new Promise((resolve, reject) => {
        fs.readFile("./faq.json", "utf8", (err, raw) => {
            if (err) reject(err) // Reject the promise if there is an error
            let data = JSON.parse(raw);
            resolve(data); // Resolve the promise with the data
        })
    })
}

module.exports = { fetchFAQ }