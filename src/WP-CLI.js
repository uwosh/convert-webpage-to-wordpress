// importing npm packages
const execSync = require("child_process").execSync;
const fs = require('fs');

// Defining global variables
const _WP_CLI = "/usr/local/bin/wp ";
const _WP_TEST_SSH = "@test ";
const _WP_TEST_ENV = "awstest";
const _WP_DEV_SSH = "@dev ";
const _WP_TEST_SITE = "https://wwwtest.uwosh.edu/";
const _WP_DEV_SITE = "https://wwwdev.uwosh.edu/";
const _WP_DEV_ENV = "awsdev";
const _SITE = "today";
let siteID = null;

class WPCLI {
    constructor(scrapedData) {
        let targetSSH = _WP_TEST_SSH;
        let targetSite = _WP_TEST_SITE + _SITE;
        let targetEnv = _WP_TEST_ENV;

        console.log("Begin processing images...");
        let updatedPosts = this.convertAllImages(
            targetSSH,
            targetSite,
            scrapedData
        );
        console.log("Processing images complete.")

        console.log("Begin processing articles...");
        this.writeAllPosts(targetSSH, targetSite, targetEnv, scrapedData);
        console.log("Processing articles complete.");
    }

    writeAllPosts(envSSH, site, targetEnv, articles) {
        // writing uw fond du lac's posts
        try {
            this.writePostsByCategory(
                envSSH,
                site,
                targetEnv,
                articles.fdlArticles,
                "uw-fond-du-lac"
            );
        } catch (e) {
            console.log(e);
        }

        // writing uw fox valley's posts
        try {
            this.writePostsByCategory(
                envSSH,
                site,
                targetEnv,
                articles.foxArticles,
                "uw-fox-valley"
            );
        } catch (e) {
            console.log(e);
        }
    }

    // validates a category exists and sends each article to a function to write them to the appropriate WP site
    writePostsByCategory(envSSH, site, targetEnv, articles, category) {
        let checkCategoryExistsCommand =
            _WP_CLI +
            envSSH +
            "--url=" +
            site +
            " eval 'echo term_exists(\"" +
            category +
            '", "category");\'';
        let responseCheckCategoryExists = execSync(
            checkCategoryExistsCommand
        ).toString();
        if (responseCheckCategoryExists.length > 1) {
            // valid category, now create each article in the given category
            for (let i = 0; i < articles.length; i++) {
                this.writePost(envSSH, site, targetEnv, articles[i], category);
            }
        } else {
            throw category + " category doesn't exist";
        }
    }

    // parses and writes the post to the given WP site
    writePost(envSSH, site, targetEnv, article, category) {
        let title = article.title;
        let date = article.date;
        let filePath = "./assets/temp.txt";

        let body = "";
        if (article.subtitle != null) {
            body += "<h3>" + article.subtitle + "</h3>";
        }
        body += article.story;
        if (article.contact != null) {
            body +=
                "<h4><strong>Contact</strong></h4><p>" +
                article.contact.contactName +
                "<br />" +
                article.contact.contactPhone +
                '<br /><a href="mailto:' +
                article.contact.contactEmail +
                '">' +
                article.contact.contactEmail +
                "</a></p>";
        }

        // writes body to temp file
        fs.writeFileSync(filePath, body); // create temp file
        // transfers the file to the server
        execSync("scp " + filePath + " " + targetEnv + ":/var/www/html");

        // fetches the user ID for the proper contributor
        let userID = execSync(_WP_CLI + envSSH + "user get contributor --url=" + site + " --field=ID").toString();
        userID = userID.substring(0, userID.length - 1); // removes the \n character

        let command =
            _WP_CLI +
            envSSH +
            "--url=" +
            site +
            " post create temp.txt --post_date='" +
            date +
            "' --post_title=\"" +
            this.addSlashes(title) +
            "\" --post_category='" +
            category +
            "' --post_author=" + userID + " --post_status=published";
        let response = execSync(command).toString();

        fs.unlinkSync(filePath); // delete temp file

        return response;
    }

    addSlashes(string) {
        return string.replace(/\\/g, '\\\\').
        replace(/\u0008/g, '\\b').
        replace(/\t/g, '\\t').
        replace(/\n/g, '\\n').
        replace(/\f/g, '\\f').
        replace(/\r/g, '\\r').
        replace(/'/g, '\\\'').
        replace(/"/g, '\\"');
    }

    // filters scraped data by site and sends articles to have image source attributes update to the new URLs
    convertAllImages(env, site, scrapedData) {
        let fdlArticles = scrapedData.fdlArticles;
        let foxArticles = scrapedData.foxArticles;

        fdlArticles = this.convertSitesImages(env, site, fdlArticles, "fdl");
        foxArticles = this.convertSitesImages(env, site, foxArticles, "fox");

        return {
            fdlArticles,
            foxArticles
        };
    }

    // by site, import all media to the WP media library and store the new URL
    convertSitesImages(env, site, siteArticles, siteShortname) {
        for (let i = 0; i < siteArticles.length; i++) {
            let article = siteArticles[i];
            let articleOriginalImages = article.originalImageSources;
            let newImageURLs = [];
            for (let j = 0; j < articleOriginalImages.length; j++) {
                let newImageURL = this.importMedia(env, site, articleOriginalImages[j]);
                siteArticles[i]["story"] = this.convertStoryImages(
                    articleOriginalImages[j],
                    newImageURL,
                    siteArticles[i]["story"],
                    siteShortname
                ); // update links
                newImageURLs.push(newImageURL);
            }
            siteArticles[i]["newImageURLs"] = newImageURLs;
        }

        return siteArticles;
    }

    convertStoryImages(oldImageSrc, newImageSrc, story, siteShortname) {
        let regex = null;
        if (siteShortname === "fox") {
            regex = /(?<=https?:\/\/uwfox.uwc.edu)(.*)/;
        } else if (siteShortname === "fdl") {
            regex = /(?<=https?:\/\/fdl.uwc.edu)(.*)/;
        } else {
            throw "siteShortname not set properly.";
        }
        let oldImage = oldImageSrc.match(regex)[0];
        return story.replace(oldImage, newImageSrc);
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