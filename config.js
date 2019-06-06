// Shared config for application
const path = require('path');

process.env.TranslateProjectId = 'hackathon-langly-1546470577089';
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(
  __dirname,
  './hackathon-langly-3622ab821581.json'
);

// When posting to google API, Google says daily limit exceeded. May have to do with environment state
// Does Google provide any info in the dashboard around requests?

process.env.NODE_ENV = 'development';
