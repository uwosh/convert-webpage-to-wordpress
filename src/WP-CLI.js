// importing npm packages
const execSync = require('child_process').execSync;

// Defining global variables
const _WP_CLI = "/usr/local/bin/wp ";
const _WP_TEST_SSH = "@test ";
const _WP_DEV_SSH = "@dev ";
const _WP_TEST_SITE = "https://wwwtest.uwosh.edu/";
const _WP_DEV_SITE = "https://wwwdev.uwosh.edu/";
const _SITE = "today"
let siteID = null;


class WPCLI {
    constructor() {
        let targetSSH = _WP_TEST_SSH
        let targetSite = _WP_TEST_SITE + _SITE;

        let siteID = this.getSiteID(targetSSH, targetSite);

        let newURL = this.importMedia(targetSSH, targetSite, "http://uwfox.uwc.edu/sites/uwfox.uwc.edu/files/resize/imce-uploads/campus/_images/fox-oustanding-alumni-2016-web-297x198.jpg");
        console.log(newURL);
    }

    // imports media to the site you set
    importMedia(env, site, mediaURL) {
        let importMediaCommand = _WP_CLI + env + "--url=" + site + " media import " + mediaURL;
        let responseMediaCommand = execSync(importMediaCommand).toString();

        // parse out attachment ID
        let regex = /(?<=attachment\sID\s)([0-9]*)/;
        let mediaID = responseMediaCommand.match(regex)[0];

        // TODO: fetch URL of new media
        let fetchMediaURL = _WP_CLI + env + "--url=" + site + " post get " + mediaID + " --field=guid";
        let responseMediaURL = execSync(fetchMediaURL).toString();
        return responseMediaURL;
    }

    getSiteID(env, site) {
        let command = _WP_CLI + env + "--url=" + site + " eval 'echo get_current_blog_id();'";
        let response = execSync(command).toString();
        return response;
    }
}

module.exports = WPCLI;