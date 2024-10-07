const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Sets the cache location for Puppeteer to Render's expected cache path
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),

  // Ensure Chromium is downloaded to the correct directory
  browserRevision: '129.0.6668.89', // specific version Puppeteer expects
  chrome: {
    skipDownload: false, // Ensure Chrome is downloaded
  },
};
