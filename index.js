const puppeteer = require("puppeteer");

const url = "https://store.ui.com/collections/unifi-protect/products/g4-doorbell-pro";
const waitTarget = "#bundleApp";

const sendPage = async () => {
    const pagerUrl = "https://enceledus.xmatters.com/api/integration/1/functions/f2a069d9-46f6-40c2-bfd9-fd4a3a852d15/triggers";

    const headers = {
        "Content-Type": "application/json"
    }

    const body = JSON.stringify({
        priority: "MEDIUM"
    });
    console.log(secrets);
    const options = {
        method: "POST",
        url: pagerUrl,
        headers,
        body,
        auth: {
            user: secrets.user,
            password: secrets.password
        }
    }

    request(options, (err, res) => {
        if(err) console.error(err);
        console.log(res.body);
        return;
    })
}

const checkPage = async () => {
    const nightmare = new Nightmare({show: false});
    await nightmare
        .goto(url)
        .wait(waitTarget)
        .evaluate(() => document.getElementById("addToCart"))
        .end()
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
