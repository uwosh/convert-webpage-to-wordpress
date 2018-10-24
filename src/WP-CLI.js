// importing npm packages
const execSync = require("child_process").execSync;

// Defining global variables
const _WP_CLI = "/usr/local/bin/wp ";
const _WP_TEST_SSH = "@test ";
const _WP_DEV_SSH = "@dev ";
const _WP_TEST_SITE = "https://wwwtest.uwosh.edu/";
const _WP_DEV_SITE = "https://wwwdev.uwosh.edu/";
const _SITE = "today";
let siteID = null;

class WPCLI {
  constructor(scrapedData) {
    let targetSSH = _WP_TEST_SSH;
    let targetSite = _WP_TEST_SITE + _SITE;

    // let siteID = this.getSiteID(targetSSH, targetSite);

    this.convertAllImages(targetSSH, targetSite, scrapedData);
  }

  convertAllImages(env, site, scrapedData) {
    let fdlArticles = scrapedData.fdlArticles;
    let foxArticles = scrapedData.foxArticles;

    fdlArticles = this.convertSitesImages(env, site, fdlArticles);
    foxArticles = this.convertSitesImages(env, site, foxArticles);

    return {
      fdlArticles,
      foxArticles
    };
  }

  // by site, import all media to the WP media library and store the new URL
  convertSitesImages(env, site, siteArticles) {
    for (let i = 0; i < siteArticles.length; i++) {
      let article = siteArticles[i];
      let articleOriginalImages = article.originalImageSources;
      let newImageURLs = [];
      for (let j = 0; j < articleOriginalImages.length; j++) {
        let newImageURL = this.importMedia(env, site, articleOriginalImages[j]);
        newImageURLs.push(newImageURL);
      }
      siteArticles[i]["newImageURLs"] = newImageURLs;
    }

    // TODO: update all image sources in stories from old links to new links

    return siteArticles;
  }

  // imports media to the site you set
  importMedia(env, site, mediaURL) {
    let importMediaCommand =
      _WP_CLI + env + "--url=" + site + " media import " + mediaURL;
    let responseMediaCommand = execSync(importMediaCommand).toString();

    // parse out attachment ID
    let regex = /(?<=attachment\sID\s)([0-9]*)/;
    let mediaID = responseMediaCommand.match(regex)[0];

    // TODO: fetch URL of new media
    let fetchMediaURL =
      _WP_CLI +
      env +
      "--url=" +
      site +
      " post get " +
      mediaID +
      " --field=guid";
    let responseMediaURL = execSync(fetchMediaURL).toString();
    responseMediaURL = responseMediaURL.substring(
      0,
      responseMediaURL.length - 1
    ); // removes the \n character at the end of the string
    return responseMediaURL;
  }

  getSiteID(env, site) {
    let command =
      _WP_CLI + env + "--url=" + site + " eval 'echo get_current_blog_id();'";
    let response = execSync(command).toString();
    return response;
  }
}

module.exports = WPCLI;
