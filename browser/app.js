const $resultsArea = $('#results-area');
const $urlInput = $('#article-url');

// Use AJAX result to add readability rating results

function showResults(res) {
  // console.log('I AM JQUERY RES DATA HOPEFULLY', res);
  let test = res;
  let test1 = Object.values(test);
  console.log('HELLO', test1);
  if (test1.length > 0) {
    for (let k in res) {
      $resultsArea.append(`${k}: ${res[k]}<br>`);
    }
  }
}

$('form').on('submit', function(e) {
  e.preventDefault();

  $resultsArea.empty();

  let url = $urlInput.val();
  $urlInput.val('');

  $.post('https://langly-readability.herokuapp.com/', { url }, showResults);
});
