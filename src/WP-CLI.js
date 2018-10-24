// importing npm packages
const execSync = require('child_process').execSync;

// Defining Class variables
const _WP_CLI = "/usr/local/bin/wp ";
const _WP_TEST_SSH = "@test ";
const _WP_DEV_SSH = "@dev ";
const _WP_TEST_SITE = "https://wwwtest.uwosh.edu/";
const _WP_DEV_SITE = "https://wwwdev.uwosh.edu/";
const _SITE = "today"
let siteID = null;


class WPCLI {
    constructor() {
        // exec(_WP_TEST_SSH + "--url=" + _WP_TEST_SITE + _SITE + " user list", this.log); // sample shell command
        this.getSiteID(_WP_TEST_SSH, _WP_TEST_SITE + _SITE);
    }

    async getSiteID(env, site) {
        let command = _WP_CLI + env + "--url=" + site + " eval 'echo get_current_blog_id();'";
        let response = execSync(command).toString();
        console.log(response);
    }

    // function that logs output from shell execution
    log(error, stdout, stderr) {
        console.log(stdout)
    }
}

module.exports = WPCLI;