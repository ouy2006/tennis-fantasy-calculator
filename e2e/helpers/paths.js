const { pathToFileURL } = require('url');
const path = require('path');

const PRODUCT_ROOT = path.resolve(__dirname, '..', '..');
const fileUrl = (name) => pathToFileURL(path.join(PRODUCT_ROOT, name)).href;

module.exports = { PRODUCT_ROOT, fileUrl };
