// importing classes
import Scraper from "./Scraper";
import WPCLI from "./WP-CLI";

class Index {
    constructor() {
        this.main();
    }

    async main() {
        let scrapedData = await Scraper.main();

        let wpcli = new WPCLI();
    }
}

new Index(); // start the Index process