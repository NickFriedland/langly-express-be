require('./config');

const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const htmlToText = require('html-to-text');

// enable cors on all routes
app.use(cors());

// middleware for parsing req.body and json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('browser'));

// format content with GET request to the Mercury API
async function formatContent(url) {
  // Mercury API requires API key from config file
  let config = {
    headers: {
      // 'Access-Control-Allow-Origin':'http://localhost:3001',
      'Content-Type': 'application/json',
      'x-api-key': process.env.MercuryAPIKey
    }
  };

  let result = await axios.get(
    `https://mercury.postlight.com/parser?url=${url}`,
    config
  );

  // Can html to text be further customized to ensure clean content?
  // What are main fail cases for html > text?
  let content = htmlToText.fromString(result.data.content, {
    ignoreImage: true,
    ignoreHref: true
  });

  result.data['content'] = content;

  return result.data;
}

// translate content with POST req to Google Translate API
// async function translateText(content) {
//   const translate = new Translate({
//     projectId: process.env.TranslateProjectId
//   });

//   const target = 'en';
//   const translation = await translate.translate(content, target);
//   console.log(translation[0]);

//   return translation;
// }

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

// POST to get raw readability score from readability.py microservice
async function getRawReadability(content) {
  return await axios.post('http://localhost:5000/readability', { content });
}

function calculateAvgReadability(results) {
  let total = 0;
  let readabilityScores = results.data['readability grades'];

  // Standardize each raw alg score to format out of 14 grade levels
  for (let test in readabilityScores) {
    let rawScore = Math.floor((Number(readabilityScores[test])));
    if (test === 'FleschReadingEase') {
      if (rawScore < 39) {
        total += (6 / 84) * 14;
      } else {
        total += ((rawScore - 30) / 84) * 14;
      }
    } else if (test === 'RIX') {
      total += (rawScore / 6.5) * 14;
    } else if (test === 'LIX') {
      total += (rawScore / 60) * 14;
    } else {
      total += rawScore;
    }
  }

  let avg = Math.floor(total / 7);

  if (avg <= 2) return 'A1';
  if (avg <= 4) return 'A2';
  if (avg <= 6) return 'B1';
  if (avg <= 8) return 'B2';
  if (avg <= 10) return 'C1';
  if (avg <= 12) return 'C2';
  if (avg <= 14) return 'D1';
}

// POST route accepts url, runs helper methods, returns content + readability
app.post('/', /* cors(corsOptions), */ async function(req, res, next) {
  try {
    let articleObj;
    
    if (req.body.url) {
      articleObj = await formatContent(req.body.url);
    }

    if (articleObj.content === undefined) {
      articleObj.content = req.body.text;
    }

    let tokenized = tokenizeText(articleObj.content, ['.', '?', '!']);

    let rawScores = await getRawReadability(tokenized);

    let adjustedScore = calculateAvgReadability(rawScores);

    articleObj['readability'] = adjustedScore;

    return res.json(articleObj);
  } catch (error) {
    console.log('ERROR', error);
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
