const Nightmare = require('nightmare');

const url = "https://store.ui.com/collections/unifi-protect/products/g4-doorbell-pro";

const checkPage = async () => {
    const nightmare = new Nightmare({show: true});
    await nightmare
        .goto(url)
        .wait("#bundleApp")
        .evaluate(() => document.getElementById("addToCart"))
        .then(data => {
            if(data) {
                console.log("CHANGE DETECTED!!!");
                sendPage().then(() => process.exit(0));
            } else {
                console.log("No change at ", Date().toString());
            }
        })
        .catch(err => {
            console.error(err);
        });
    nightmare.end();
}

console.log("Running...")
setInterval(checkPage, 120000);
checkPage()
