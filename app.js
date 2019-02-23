require('./config');

const express = require('express');
const axios = require('axios');
const htmlToText = require('html-to-text');
const { Translate } = require('@google-cloud/translate');
// const tokenizer = require('string-tokenizer')

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('browser'));

// Load homepage
// app.get('/', (req, res) => {
//   return res.render('index');
// });

// format content with GET request to the Mercury API
async function formatContent(url) {
  // configure headers for Mercury API
  let config = {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.MercuryAPIKey
    }
  };

  // GET request to Mercury API
  let result = await axios.get(
    `https://mercury.postlight.com/parser?url=${url}`,
    config
  );

  console.log('RESULT', result);

  // Convert res data content from HTML to text
  let content = htmlToText.fromString(result.data.content, {
    ignoreImage: true,
    ignoreHref: true
  });

  return content;
}

// translate content with POST req to Google Translate API
async function translateText(content) {
  const translate = new Translate({
    projectId: process.env.TranslateProjectId
  });

  const target = 'en';
  const translation = await translate.translate(content, target);
  console.log(translation[0]);

  return translation;
}

// Tokenize content to format for python readability package
function tokenizeText(str, tokens) {
  str = str.replace(/\r?\n|\r/g, ' ');
  // first token is temp stand in to be split on later
  const tempChar = tokens[0];
  for (let i = 1; i < tokens.length; i++) {
    str = str.split(tokens[i]).join(tempChar);
  }
  str = str.split(tempChar);
  return str;
}

// POST res data from google translate API to readability.py microservice
async function getReadability(content) {
  return await axios.post('http://localhost:5000/readability', { content });
}

// POST route to accept request from front end, manipulate, return response
app.post('/', async function(req, res, next) {
  try {
    let content;
    
    if (req.body.url) {
      content = await formatContent(req.body.url);
    }

    if (content === undefined) {
      content = req.body.text;
    }

    let tokenized = tokenizeText(content, ['.', '?', '!']);

    let results = await getReadability(tokenized);

    // format res data by storing relevant content to vars
    //    helper function to manipulate the data as needed before storing?
    // return res.json for relevant vars

    return res.json(results.data['readability grades']);
  } catch (error) {
    return next(error);
  }
});

// 404 error handler function
app.use(function(req, res, next) {
  const err = new Error('Not found');
  err.status = 404;

  return next(err);
});

// general error handler
app.use(function(err, req, res, next) {
  let status = err.status || 500;

  return res.status(status).json({ status, message: err.message });
});

app.listen(3001, () => console.log('App on port 3001'));
