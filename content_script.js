/*
 * Content Script.
 *
 * Has access to all http pages browsed by user.
 * 
 * 1. Receives a message (JSON object) from extension search box.
 * 2. Performs a search as determined by this message. 
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
            var results = parsePage(message.query);
            if (message.To == "content_script") {
                sendResponse({"results":results});
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
  *      "icon": may be useful to identify results when displayed later
  *      "results": array of strings
  */
    return "Page about to be parsed";
}
