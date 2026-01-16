// Root server entry point for Render deployment
// This file runs the compiled backend from the Backend folder

const path = require('path');

// Change to Backend directory and run the compiled server
process.chdir(path.join(__dirname, 'Backend'));
require('./dist/index.js');

