const puppeteer = require("puppeteer");
const pager = require("./pager");

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
                pager.sendPage();
            } else {
                setTimeout(loop, 500)
            }
        });
    }

    loop();
}

run();
