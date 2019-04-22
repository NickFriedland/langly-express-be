require('./config');

const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');

// enable cors on all routes
app.use(cors());

// middleware for parsing req.body and json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('browser'));

// Parse article data from url using Newspaper API
async function parseArticle(url) {
  return await axios.post('https://langly-ms.herokuapp.com/parse', { url });
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
  return await axios.post('https://langly-ms.herokuapp.com/readability', { content });
}

function calculateAvgReadability(rawScores) {
  let total = 0;
  let readabilityScores = rawScores.data['readability grades'];

  // Standardize each raw alg score to format out of 14 grade levels
  for (let test in readabilityScores) {
    let rawScore = Math.floor((Number(readabilityScores[test])));
    // This logic is likely backward. FRE is only DESC scale.
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
  
  return 'D1';
}

// POST route accepts url, runs helper methods, returns content + readability
app.post('/', async function(req, res, next) {
  try {
    let articleObj;
    let parsed;
    
    if (req.body.url) {
      parsed = await parseArticle(req.body.url);
      articleObj = parsed.data;
    }
    
    let { text } = articleObj

    if (text === undefined) {
      text = req.body.text;
    }

    let tokenized = tokenizeText(text, ['.', '?', '!']);

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

// app.listen(process.env.PORT || 3001, () => console.log('App on port 3001'));

app.listen(process.env.PORT || 3001, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
