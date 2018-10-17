const puppeteer = require('puppeteer');

let scrapeSitemap = async (site) => {
    // setup
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    const sitemap = site + 'sitemap.xml'
    await page.goto(sitemap);
    let links = []; // the array we will store all our relevant site links inside

    // begin scraping
    const allLinks = await page.evaluate(() => {
        return document.querySelector('tr td a').innerText;
    });

    // return scrape
    browser.close();
    return allLinks;
}

let fdl_url = "http://fdl.uwc.edu/";
let fox_url = "http://uwfox.uwc.edu/";

scrapeSitemap(fdl_url).then((response) => {
    console.log("fdl: " + response);
});

scrapeSitemap(fox_url).then((response) => {
    console.log("fox: " + response);
});