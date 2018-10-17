const puppeteer = require('puppeteer');

let scrape = async () => {
    // setup
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.goto('http://books.toscrape.com/');
    await page.waitFor(1000);

    // begin scraping
    await page.click('#default > div > div > div > div > section > div:nth-child(2) > ol > li:nth-child(1) > article > div.image_container > a > img');

    const result = await page.evaluate(() => {
        let title = document.querySelector('#content_inner > article > div.row > div.col-sm-6.product_main > h1').innerText;
        let price = document.querySelector('#content_inner > article > div.row > div.col-sm-6.product_main > p.price_color').innerText;
        return {
            title,
            price
        }
    });

    // return scrape
    browser.close();
    return result;
}

scrape().then((value) => {
    console.log(value);
});