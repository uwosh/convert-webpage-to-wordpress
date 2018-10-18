const puppeteer = require("puppeteer");

// goes to the site specified and grabs an array of news URLs that matches "campus/news/releases"
let fetchNewsURLs = async (browser, site) => {
    // setup
    const page = await browser.newPage();
    const sitemap = site + "sitemap.xml";
    await page.goto(sitemap);

    // begin scraping
    const allLinks = await page.evaluate(site => {
        let all = Array.from(document.querySelectorAll("tr > td > a")).map(
            element => element.href
        );
        let links = []; // the array we will store all our relevant site links inside
        all.forEach(element => {
            if (element.includes(site + "campus/news/releases")) {
                links.push(element);
            }
        });
        return links;
    }, site);

    // return scrape
    return allLinks;
};

let scrapeNewsArticleData = async (browser, url) => {
    const page = await browser.newPage();
    let response = await page.goto(url);

    if (response._status === 403) {
        throw "Status of page is 403!";
    }

    const articleData = await page.evaluate(() => {
        // get title
        let title = document.querySelector("#page-title > span").innerText;

        // get date
        let date = document
            .querySelector(
                "div.content.clearfix > div.field.field-name-field-news-pub-date.field-type-datetime.field-label-hidden > div > div > span"
            )
            .getAttribute("content");

        // get subtitle
        let subtitle = null;
        if (
            document.querySelector(
                "div.content.clearfix > div.field.field-name-field-news-subhead.field-type-text.field-label-hidden > div > div"
            ) != null
        ) {
            subtitle = document.querySelector(
                "div.content.clearfix > div.field.field-name-field-news-subhead.field-type-text.field-label-hidden > div > div"
            ).innerText;
        }

        // get story
        let story = document.querySelector(
            "article > div.content.clearfix > div.field.field-name-body.field-type-text-with-summary.field-label-hidden > div > div"
        ).innerHTML;

        // get the contact
        let contact = null,
            contactName = null,
            contactPhone = null,
            contactEmail = null;

        if (document.querySelector(
                "div.field.field-name-field-news-contact.field-type-text.field-label-hidden > div > div"
            ) != null) {
            contactName = document.querySelector(
                "div.field.field-name-field-news-contact.field-type-text.field-label-hidden > div > div"
            ).innerText;
        }
        if (document.querySelector(
                "div.field.field-name-field-news-contact-ph.field-type-text.field-label-hidden > div > div"
            ) != null) {
            contactPhone = document.querySelector(
                "div.field.field-name-field-news-contact-ph.field-type-text.field-label-hidden > div > div"
            ).innerText;
        }
        if (document.querySelector(
                "div.field.field-name-field-news-contact-em.field-type-email.field-label-hidden > div > div > a"
            ) != null) {
            contactEmail = document.querySelector(
                "div.field.field-name-field-news-contact-em.field-type-email.field-label-hidden > div > div > a"
            ).innerText;
        }
        contact = {
            contactName,
            contactPhone,
            contactEmail
        };

        return {
            title,
            subtitle,
            date,
            story,
            contact
        };
    });

    return articleData;
};

let scrapeArticlesURLArray = async (browser, urls) => {
    let articles = [];
    for (let i = 0; i < urls.length; i++) {
        try {
            let story = await scrapeNewsArticleData(browser, urls[i]);
            articles.push(story);
        } catch (error) {
            if (error == "Status of page is 403!") {
                console.log(urls[i] + " has a status of 403.");
            } else {
                console.log(error);
            }
        }
    }
    return articles
}

let main = async () => {
    // setup
    const browser = await puppeteer.launch({
        headless: true
    });

    let fdlSiteURL = "http://fdl.uwc.edu/";
    let foxSiteURL = "http://uwfox.uwc.edu/";

    let foxNewsURLs = await fetchNewsURLs(browser, foxSiteURL);
    let fdlNewsURLs = await fetchNewsURLs(browser, fdlSiteURL);

    let foxStories = await scrapeArticlesURLArray(browser, foxNewsURLs);
    let fdlStories = await scrapeArticlesURLArray(browser, fdlNewsURLs);

    console.log("fox[0] story:" + JSON.stringify(foxStories[0]));
    console.log("fdl[0] story: " + JSON.stringify(fdlStories[0]));

    browser.close();
};

main();