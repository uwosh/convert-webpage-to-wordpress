"use strict";

// Importing the frameworks we need
var rp = require('request-promise');
var cheerio = require('cheerio');

// Running code
var options = {
    uri: 'https://uwosh.edu',
    transform: function (body) {
        return cheerio.load(body);
    }
};

rp(options)
    .then(function ($) {
        // Process html like you would with jQuery...
        console.log($('.site-title h1 a').text().trim());
    })
    .catch(function (err) {
        // Crawling failed or Cheerio choked...
        console.log("Error: " + err);
    });