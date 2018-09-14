"use strict";

// Importing the frameworks we need
var rp = require('request-promise');
var cheerio = require('cheerio');

// Import the files we need
var SiteMap = require("./SiteMap");

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
        var siteTitle = $('.site-title h1 a').text().trim();
        var siteMap = new SiteMap();
        var sitemapTxt = siteMap.getSiteMap(siteTitle);
        console.log("Sitemap: " + sitemapTxt);
    })
    .catch(function (err) {
        // Crawling failed or Cheerio choked...
        console.log("Error: " + err);
    });