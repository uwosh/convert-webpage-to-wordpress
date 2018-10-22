// importing npm packages
const exec = require('child_process').exec;

// importing classes
import Scraper from "./Scraper";

class Index {
    constructor() {
        this.main();
    }

    // function that logs output from shell execution
    log(error, stdout, stderr) {
        console.log(stdout)
    }

    async main() {
        // let scraper = await Scraper.main();

        exec("ls -la", this.log); // sample shell command
    }
}

new Index(); // start the Index process