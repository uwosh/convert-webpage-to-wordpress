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
  await page.goto(url);

  const articleData = await page.evaluate(() => {
    let title;

    // get title
    title = document.querySelector("#page-title > span").innerText;

    return {
      title
    };
  });

  return articleData;
};

let main = async () => {
  // setup
  const browser = await puppeteer.launch({
    headless: true
  });

  let fdlSiteURL = "http://fdl.uwc.edu/";
  let foxSiteURL = "http://uwfox.uwc.edu/";

  let foxNewsURLs = await fetchNewsURLs(browser, foxSiteURL);
  let fdlNewsURLs = await fetchNewsURLs(browser, fdlSiteURL);

  let foxStories = [];
  for (let i = 0; i < foxNewsURLs.length; i++) {
    let story = await scrapeNewsArticleData(browser, foxNewsURLs[i]);
    foxStories.push(story);
  }

  let fdlStories = [];
  for (let i = 0; i < fdlNewsURLs.length; i++) {
    let story = await scrapeNewsArticleData(browser, fdlNewsURLs[i]);
    fdlStories.push(story);
  }

  console.log("fox[0] story:" + JSON.stringify(foxStories[0]));
  console.log("fdl[0] story: " + JSON.stringify(fdlStories[0]));

  browser.close();
};

main();
