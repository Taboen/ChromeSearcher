/*
 * Content Script.
 *
 * Has access to all http pages browsed by user.
 * 
 * 1. Receives a message (JSON object) from extension search box. Message contains query text.
 * 2. Performs a search as determined by this query. 
 * 3. Responds to search_box.js with results of its operation.
 *
 *** DOES NOT store anything in local storage. 
 *** Due to peculiarity of extension runtime content scripts
 *** don't have access to the same localStorage as search_box.js and results.js.
 */

 $(document).ready(function () {   
    console.log("content script loaded!");
    chrome.runtime.onMessage.addListener(
        function (message,sender,sendResponse) {
            console.log(message,sender);
            var result = parsePage(message.query);
            if (message.To == "content_script") {
                sendResponse({"result":result});
            }
    });
});

function parsePage (query) {
 /* Searches for a match to query and stores the results.
  * 
  * Takes a string as input.
  * 
  * Returns a JSON object with the following keys:
  *   
  *      "query": original query
  *      "timestamp": when search was performed
  *      "url": url of page being searched
  *      "results": array of strings
  */
    query = prepareQuery(query); 
    var sentences = $('body').text().split(".").filter(function (sentence) {
        return sentence.indexOf(query) != -1;
    }).map(function (sentence) { 
        sentence = sentence.replace(query,"<strong>"+query+"</strong>");
        return sentence.replace(/\n/g," ").trim() + "." }); 
    var url = location.href;
    var timestamp = +new Date();
    var result = {"query":query, "timestamp":timestamp, "url":url,
        "results":sentences};
    console.log(result, "result prepared");
    return JSON.stringify(result);
}

function prepareQuery (query) {
    // Accepts an object with following keys:
    //      text, string, string searched for
    //      ignoreCase, Boolean
    //      separator, string, either 'p' for paragraph or . for sentence
    // TODO
    
    return query;
}
