const fs = require("fs")

function localeBackup() {
    var date = new Date().toJSON().slice(0,19).replace(/:/g,'.');
    fs.readFile("./user_locale.json", "utf8", (err, raw) => {
        fs.writeFile(`./backups/user_locale/user_locale-${date}.json`, raw, (err) => {if(err) console.log(err)});
    })
    console.log(`Created user_locale backup: user_locale-${date}`)
}
function FAQBackup() {
    var date = new Date().toJSON().slice(0,19).replace(/:/g,'.');
    fs.readFile("./faq.json", "utf8", (err, raw) => {
        fs.writeFile(`./backups/faq/faq-${date}.json`, raw, (err) => {if(err) console.log(err)});
    })
    console.log(`Created FAQ backup: faq-${date}`)
}

module.exports = {localeBackup,FAQBackup}