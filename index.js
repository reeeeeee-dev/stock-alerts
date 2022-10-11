const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const pager = require("./pager");
const secrets = require("./secrets.json");

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

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

const checkStock = async (page) => {
    await page.reload();
    await page.waitForSelector("#bundleApp");
    const inStock = await page.evaluate(() => document.getElementById("addToCart"));
    console.log(`Status at ${Date().toString()}: ${inStock && true}`);
    return inStock;
}

const buyItem = async (page, browser) => {
    const time = new Date();

    // Product Page
    await page.click("#addToCart");
    await page.click("#addToCart");
    await page.waitForSelector(".cartBanner", { visible: true })

    // Checkout
    await page.goto("https://store.ui.com/checkout");
    await page.waitForSelector(".main__content");

    const contactPage = "step=contact_information";
    const shippingPage = "step=shipping_method";
    const paymentPage = "step=payment_method";

    do {
        await page.waitForSelector("#continue_button:not([disabled])");
        console.log(page.url());

        // Handle contact page
        if(page.url().endsWith(contactPage) || !page.url().includes("step")) {
            // Click the "Residential" button
            await page.click('#ct__radio-btn-residential');
        }

        // Handle payment page
        if(page.url().endsWith(paymentPage)) {
            await page.waitForSelector("iframe");
            
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
}

const login = async (page) => {
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

const run = async () => {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
        headless: false
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 1366, height: 768});
    await page.goto("https://store.ui.com/collections/unifi-network-switching/products/usw-flex-mini");
    const loop = async () => {
        await login(page);
        checkStock(page).then(stock => {
            if(stock) {
                buyItem(page);
            } else {
                setTimeout(loop, 500)
            }
        });
    }

    loop();
}

run();
