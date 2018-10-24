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
        console.log("siteID: " + siteID);
    }

    getSiteID(env, site) {
        let command = _WP_CLI + env + "--url=" + site + " eval 'echo get_current_blog_id();'";
        let response = execSync(command).toString();
        return response;
    }
}

module.exports = WPCLI;