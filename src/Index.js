// importing classes
const Scraper = require("./Scraper");
const WPCLI = require("./WP-CLI");

class Index {
    constructor() {
        this.main();
    }

    async main() {
        // let scrapedData = await Scraper.main();
        let wpcli = new WPCLI();
    }
}

new Index(); // start the Index process