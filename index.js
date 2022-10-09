const puppeteer = require("puppeteer");
const pager = require("./pager");
const secrets = require("./secrets.json");

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
    console.log(`Status at ${Date().toString()}: ${inStock}`);
    return inStock;
}

const buyItem = async (page) => {
    // Product Page
    await page.click("#addToCart");
    await page.waitForSelector(".cartBanner", { visible: true })

    // Checkout
    await page.goto("https://store.ui.com/checkout");
    await page.waitForSelector(".main__content");

    while(page.url().endsWith("step=contact_information")
        || page.url().endsWith("step=shipping_method")
        || page.url().endsWith("step=payment_method")
    ) {
        await page.waitForSelector("#continue_button");

        if(page.url().endsWith("step=contact_information")) {
            await page.click('[for="ct__radio-btn-residential"]');
        }

        await page.click("#continue_button");
        await page.waitForNavigation();
        process.exit(0);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log("SUCCESSFULLY COMPLETED PURCHASE!!!")
    process.exit(0);
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
