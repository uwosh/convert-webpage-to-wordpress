// importing npm packages
const exec = require('child_process').exec;
const _WP_CLI = "php lib/wp-cli.phar ";
export default class WPCLI {
    constructor() {
        exec(_WP_CLI + "--info", this.log); // sample shell command
    }

    // function that logs output from shell execution
    log(error, stdout, stderr) {
        console.log(stdout)
    }
}