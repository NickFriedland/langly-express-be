## About Langly

Langly is a tool intended for language learners and more generally online readers. The app allows users to submit the url for an article or text based web page, and then returns the formatted title and content of the text along with a cumulative readability score. The score is based on several known readability algorithms, listed in the [Flask Microservice README doc](https://github.com/NickFriedland/langly-flask-ms/blob/master/README.md).

## Planned Future Functionality

The app is a work in progress, and functionality that is being built or is planned includes:
* Allowing users to submit foreign language articles
* Allowing users to click on a word in the formatted article to highlight it and pull up a tool tip containing the definition of the word
* Allowing users to then save highlighted words to a vocab list at the bottom of the article
* Allowing users to turn words from their saved list into flashcards to be reviewed later
* Allowing users to categorize flash cards with category tags
* Allowing users to create accounts to save history of articles submitted, words saved, and flashcards created

## Getting Started

The app is split into three separate repos on Github: 
1. [React Front End](https://github.com/NickFriedland/langly-react-fe)
2. **Node/Express Back End**
3. [Flask Microservice](https://github.com/NickFriedland/langly-flask-ms)

To run the express server, in the project directory you can use one of two commands:
1. `node app.js`
2. `nodemon`

