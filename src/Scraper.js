const puppeteer = require("puppeteer");
const fs = require("fs");

export default class Scraper {
    // goes to the site specified and grabs an array of news URLs that matches "campus/news/releases"
    static async fetchArticleURLs(browser, site) {
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

    // takes a browser and url and returns an object containing the article title, subtitle, date, story, and contact.
    static async scrapeNewsArticleData(browser, url) {
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

            if (
                document.querySelector(
                    "div.field.field-name-field-news-contact.field-type-text.field-label-hidden > div > div"
                ) != null
            ) {
                contactName = document.querySelector(
                    "div.field.field-name-field-news-contact.field-type-text.field-label-hidden > div > div"
                ).innerText;
            }
            if (
                document.querySelector(
                    "div.field.field-name-field-news-contact-ph.field-type-text.field-label-hidden > div > div"
                ) != null
            ) {
                contactPhone = document.querySelector(
                    "div.field.field-name-field-news-contact-ph.field-type-text.field-label-hidden > div > div"
                ).innerText;
            }
            if (
                document.querySelector(
                    "div.field.field-name-field-news-contact-em.field-type-email.field-label-hidden > div > div > a"
                ) != null
            ) {
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

    // takes a browser and an array of urls. Iterates thru the array of urls and parses them with `scrapeNewsArticleData`
    static async scrapeArticlesURLArray(browser, urls) {
        let articles = [];
        for (let i = 0; i < urls.length; i++) {
            try {
                let story = await this.scrapeNewsArticleData(browser, urls[i]);
                articles.push(story);
            } catch (error) {
                if (error == "Status of page is 403!") {
                    console.log(urls[i] + " has a status of 403.");
                } else {
                    console.log(error);
                }
            }
        }
        return articles;
    };

    // takes a browser and articles array, downloads all article images into local assets folder
    static async scrapeImagesSources(browser, articles, site) {
        site = site.substring(0, site.length - 1);
        const parserPage = await browser.newPage();
        let imagesByPost = [];
        for (let i = 0; i < articles.length; i++) {
            let story = articles[i].story;
            parserPage.setContent(story); // sets parserPage to the HTML that is in the `story` string

            // grabs the images from the HTML doc
            const getImages = await parserPage.$$eval("img[src]", images =>
                images.map(img => img.getAttribute("src"))
            );

            // parses the images into the selected image array pre-pending the site to the src attribute so we can go to it as a URL
            let selectedImages = [];
            for (let i = 0; i < getImages.length; i++) {
                if (getImages[i] != null) {
                    selectedImages.push(site + getImages[i]);
                } else {
                    selectedImages.push(getImages[i]);
                }
            }
            imagesByPost.push(selectedImages);
        }

        return imagesByPost;
    };

    // actually goes the the URL of the images and downloads them to the assets folder
    static async downloadImages(browser, imageSources, path) {
        // TODO: build image downloading functionality
        for (let i = 0; i < imageSources.length; i++) {
            let postImagePath = path + "/" + i;

            // create a new folder for each post
            if (!fs.existsSync(postImagePath)) {
                fs.mkdirSync(postImagePath);
            }

            // if the blog post has an image in it, download the images
            if (imageSources[i].length != 0) {
                for (let j = 0; j < imageSources[i].length; j++) {
                    let imageURL = imageSources[i][j].toString();
                    let filename = imageURL.match(/[\w-]+\.(jpg|png|txt|jpeg)/g)[0];
                    let imagePathWithFilename = postImagePath + "/" + filename;

                    // go to image in browser
                    const page = await browser.newPage();
                    let imagePage = await page.goto(imageURL);

                    // save the image to the proper directory
                    fs.writeFileSync("./" + imagePathWithFilename, await imagePage.buffer(), function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("The " + imagePathWithFilename + " was saved!");
                    });
                }
            }
        }
        return true;
    };

    // purges the image assets folder
    static async cleanSiteImageAssets(site) {
        site = "assets/" + site;
        // removing the site folder if it exists
        let deleteFolderRecursive = function (site) {
            if (fs.existsSync(site)) {
                fs.readdirSync(site).forEach(function (file, index) {
                    var curPath = site + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) {
                        // recurse
                        deleteFolderRecursive(curPath);
                    } else {
                        // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(site);
            }
        };
        deleteFolderRecursive(site);

        // make directory if it exists
        if (!fs.existsSync(site)) {
            fs.mkdirSync(site);
        }
    };

    // worker for scraping the images
    static async scrapeImages(browser, articles, site, siteDir) {
        let imageSources = await this.scrapeImagesSources(browser, articles, site);
        await this.cleanSiteImageAssets(siteDir);
        let downloadImagesStatus = await this.downloadImages(
            browser,
            imageSources,
            "assets/" + siteDir
        );
        return downloadImagesStatus ?
            "Images successfully downloaded" :
            "Error on image download";
    };

    // checks to see if there is saved data on the local file system, if not, rerun the web scraping
    static async loadArticleData(browser, path, urls) {
        let articles = null;
        if (!fs.existsSync(path)) {
            articles = await this.scrapeArticlesURLArray(browser, urls);
            fs.writeFileSync(path, JSON.stringify(articles));
        } else {
            articles = JSON.parse(fs.readFileSync(path));
        }
        return articles;
    };

    // runs all of the functions needed to scrape news stories for UW-Fox and UW-FDL
    static async scrapingWorker() {
        // setup
        const browser = await puppeteer.launch({
            headless: true
        });

        let foxSiteURL = "http://uwfox.uwc.edu/";
        let foxSiteDir = "uwfox.uwc.edu";
        let fdlSiteURL = "http://fdl.uwc.edu/";
        let fdlSiteDir = "fdl.uwc.edu";

        // fetch URLs for each campus' news stories
        let foxArticleURLs = await this.fetchArticleURLs(browser, foxSiteURL);
        let fdlArticleURLs = await this.fetchArticleURLs(browser, fdlSiteURL);

        // scrape each campus' news stories
        let foxArticles = await this.loadArticleData(browser, "assets/foxData.json", foxArticleURLs);
        let fdlArticles = await this.loadArticleData(browser, "assets/fdlData.json", fdlArticleURLs);

        // download images for each campus news story
        await this.scrapeImages(
            browser,
            foxArticles,
            foxSiteURL,
            foxSiteDir
        );
        await this.scrapeImages(
            browser,
            fdlArticles,
            fdlSiteURL,
            fdlSiteDir
        );

        browser.close();
        return {
            foxArticles,
            fdlArticles
        }
    };

    static async main() {
        console.log("Begin scraping worker...");
        let scrappedData = await this.scrapingWorker();
        console.log("End scraping worker.");
        return scrappedData;
    }
}