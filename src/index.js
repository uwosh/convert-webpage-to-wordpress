const puppeteer = require("puppeteer");

// goes to the site specified and grabs an array of news URLs that matches "campus/news/releases"
let fetchArticleURLs = async (browser, site) => {
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
  return articles;
};

// takes a browser and articles array, downloads all article images into local assets folder
let scrapeImagesSources = async (browser, articles, site) => {
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

let downloadImages = async (browser, imageSources, site) => {
  // TODO: build image downloading functionality
  return true;
};

let scrapeImages = async (browser, articles, site) => {
  let imageSources = await scrapeImagesSources(browser, articles, site);
  let downloadImagesStatus = await downloadImages(browser, imageSources, site);
  return downloadImagesStatus
    ? "Images successfully downloaded"
    : "Error on image download";
};

let main = async () => {
  // setup
  const browser = await puppeteer.launch({
    headless: true
  });

  let foxSiteURL = "http://uwfox.uwc.edu/";
  let fdlSiteURL = "http://fdl.uwc.edu/";

  let foxArticleURLs = await fetchArticleURLs(browser, foxSiteURL);
  let fdlArticleURLs = await fetchArticleURLs(browser, fdlSiteURL);

  let foxArticles = await scrapeArticlesURLArray(browser, foxArticleURLs);
  let fdlArticles = await scrapeArticlesURLArray(browser, fdlArticleURLs);

  let foxImageDownloadStatus = await scrapeImages(
    browser,
    foxArticles,
    foxSiteURL
  );
  let fdlImageDownloadStatus = await scrapeImages(
    browser,
    fdlArticles,
    fdlSiteURL
  );

  console.log("fox images status: " + foxImageDownloadStatus);
  console.log("fdl images status: " + fdlImageDownloadStatus);

  browser.close();
};

main();
