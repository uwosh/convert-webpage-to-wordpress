// importing npm packages
const exec = require('child_process').exec;

export default class WPCLI {
    constructor() {
        exec("ls -la", this.log); // sample shell command
    }

    // function that logs output from shell execution
    log(error, stdout, stderr) {
        console.log(stdout)
    }
}