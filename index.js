const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const cron = require('node-cron');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const pager = require("./pager");
const secrets = require("./secrets.json");

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const videoConfig = {
    videoFrame: {
        width: 1024,
        height: 1536
    },
    aspectRatio: '1:2'
}

// click #addToCart
// wait .cartBanner is visible(display: !none)
                                    // click #CartCost
                                    // wait .cartModal has class .open
                                    // click <span>Checkout</span>
// navigate to https://store.ui.com/checkout

// SPLIT

// IF url include ?step=contact_information
// wait, then click #ct__radio-box
// click #continue_button

// IF url include ?step=shipping_method
// click #continue_button

// IF url include ?step=payment_method
// wait, then click #continue_button

let page;

const checkStock = async () => {
    await page.reload();
    await page.waitForSelector("#bundleApp");
    const inStock = await page.evaluate(() => document.getElementById("addToCart"));
    console.log(`Status at ${Date().toString()}: ${inStock ? "true" : "false"}`);
    return inStock;
}

const buyItem = async () => {
    const time = new Date();

    // Product Page
    await page.click("#addToCart");
    await page.waitForSelector(".cartBanner", { visible: true })

    // Checkout
    await page.goto("https://store.ui.com/checkout");
    await page.waitForSelector(".main__content");

    const contactPage = "step=contact_information";
    const shippingPage = "step=shipping_method";
    const paymentPage = "step=payment_method";

    do {
        console.log(page.url());
        await page.waitForSelector("#continue_button:not([disabled])");

        // Handle contact page
        if(page.url().endsWith(contactPage) || !page.url().includes("step")) {
            // Click the "Residential" button
            await page.click('#ct__radio-btn-residential');
        }

        // Handle payment page
        if(page.url().endsWith(paymentPage)) {
            await page.waitForSelector("iframe");
            
            console.log("Entering payment info...");

            // Insert card info within iFrames
            const ccNumberElement = await page.$('iframe[title="Field container for: Card number"]');
            const ccNumberFrame = await ccNumberElement.contentFrame();
            await ccNumberFrame.waitForSelector('input[placeholder="Card number"]');
            await ccNumberFrame.type('input[placeholder="Card number"]', secrets.cc.number);
            
            const ccNameElement = await page.$('iframe[title="Field container for: Name on card"]');
            const ccNameFrame = await ccNameElement.contentFrame();
            await ccNameFrame.waitForSelector('input[placeholder="Name on card"]');
            await ccNameFrame.type('[placeholder="Name on card"]', secrets.cc.name);

            const ccExpElement = await page.$('iframe[title="Field container for: Expiration date (MM / YY)"]');
            const ccExpFrame = await ccExpElement.contentFrame();
            await ccExpFrame.waitForSelector('input[placeholder="Expiration date (MM / YY)"]');
            await ccExpFrame.type('input[placeholder="Expiration date (MM / YY)"]', secrets.cc.exp);
            
            const ccCVCElement = await page.$('iframe[title="Field container for: Security code"]');
            const ccCVCFrame = await ccCVCElement.contentFrame();
            await ccCVCFrame.waitForSelector('input[placeholder="Security code');
            await ccCVCFrame.type('input[placeholder="Security code"]', secrets.cc.cvc);
        }

        await page.click("#continue_button");
    } while(page.url().endsWith(contactPage)
        || page.url().endsWith(shippingPage)
        || page.url().endsWith(paymentPage)
        || !page.url().includes("step=")
    );

    if(page.url().endsWith("processing")) {
        console.log(page.url());
        await page.waitForNavigation();
    }

    if(page.url().endsWith("thank_you")) {
        console.log(page.url());
        console.log(`SUCCESSFULLY COMPLETED PURCHASE IN ${((new Date()) - time) / 1000}s`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        process.exit(0);
    }

    console.log("Stopped somewhere...");
}

const login = async () => {
    await page.goto("https://store.ui.com/");
    const loggedOut = await page.evaluate(() =>
        document.getElementById("headerLoginLink")
    )
    if(loggedOut) {
        await page.click("#headerLoginLink");
        await page.waitForSelector('[name="username"]');
        await page.type('[name="username"]', secrets.ui.user);
        await page.type('[name="password"]', secrets.ui.pass);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
    }
}

// Setup
let ready = false;
let recorder;
(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
        headless: false
    });
    page = await browser.newPage();
    await page.setViewport({
        width: 1024,
        height: 1536
    });

    recorder = new PuppeteerScreenRecorder(page, videoConfig);

    await login();
    await page.goto("https://store.ui.com/collections/unifi-protect/products/g4-doorbell-pro");
    ready = true;
})();

let running = false;
const run = async () => {
    running = true;
    const time = new Date();
    try {
        const stock = await checkStock();
        console.log(`Stock check Time: ${((new Date()) - time) / 1000}s`);
        if(stock) {
            await recorder.start(`./videos/${(new Date()).getTime()}.mp4`);
            pager.sendPage();
            await buyItem();
        }
    } catch(e) {
        recorder.stop();
        console.log("An error has occurred: ", e);
    }
    running = false;
}

cron.schedule('*/2 0-30 6 * * *', () => ready && !running && run());
