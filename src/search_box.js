/**
 * Main controller (runs after clicking extension icon)
 *
 * 1. Fetches input from search box with class ".search".
 * 2. Sends this input to content_script as JSON message.
 * 3. Receives search results (as JSON object, sent via chrome message)
 * 4. Opens new tab where results are going to be displayed.
 * 
 **/

function Controller () {
}

Controller.prototype = {
    listen: function () {
        self = this;
        $('.search_box').submit(function (e) {
           e.preventDefault();
           var query, ignoreCase, sentences, startSearch, message;
           query = $('input[name=query]').val();
           if (query.trim().length < 3) return false;
           ignoreCase = $('input[name="ignoreCase"]').attr('checked');
           $('#sentencesYes').attr('checked') ? sentences = true : sentences = false;
           startSearch = +new Date(); 
           message = {query:query,sentences:sentences,ignoreCase:ignoreCase, startSearch:startSearch};
           self.run(message);
           
       });
    }, 
    run: function (message) {
        var response = this.notifyContentScript(message);
    },
    notifyContentScript: function (message) {
        // Sends message to content script
        var extension = this; 
        chrome.tabs.query({active:true, currentWindow:true}, function (tabs) {
            message.tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabs[0].id, message, function (response)  {
                if (response != undefined) {
                    extension.storeLocal(response);
                    extension.openResultsPage();
                } else {
                    
                }
            });
        });
    },
    openResultsPage: function () {
        // Opens a new in-browser page where search results will be displayed.
        var url = chrome.extension.getURL('results.html');
        chrome.tabs.create({"url":url}, function (tab) {});
    },
    validate: function (message) {
    }, 
    storeLocal: function (response) {
        // stores item in local storage
        
        localStorage.setItem("searchResults",response);
    },
};

// document here refers to extension popup - search_box.html
$(document).ready(function () {
    
    var controller = new Controller();
    controller.listen();
});
