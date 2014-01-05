/*
 * Main controller (runs after clicking extension icon)
 *
 * 1. Fetches input from search box with class ".search".
 * 2. Sends this input to content_script as JSON message.
 * 3. Receives search results (as JSON object, sent via chrome message)
 * 4. Opens new tab where results are going to be displayed.
 * 
 */

function Controller () {
}

Controller.prototype = {
    listen: function () {
       $('.search_box').submit(function (e) {
           var query = $('.query');
           e.preventDefault();
       });
    }, 
    run: function () {
        listenToMessage
        var message = formMessage();
        if (!validate(message)) return false; 
        var response = notifyContentScript(message);
        storeLocal(response);
        openResultsPage();
    }
    notifyContentScript: function (message) {
        // Sends message to content script
        chrome.tabs.query({active:true, currentWindow:true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, message, function (response)  {
                console.log(response);
            });
        });
    },
    openResultsPage: function () {
        // Opens a new in-browser page where search results will be displayed.
        var url = chrome.extension.getURL('results.html');
        chrome.tabs.create({"url":url}, function (tab) {});
    },
    formMessage: function () {
        // Creates message from input submitted via form.
        // Returns js object with keys:
        //          "query": string
        //          "To": string
        //          "sentences":Boolean
        //          "ignoreCase": Boolean
        var message; 
    },
    validate: function (message) {
    }, 
    storeLocal: function () {
        // stores item in local storage
        localStorage.setItem("searchResults",response);
    },
}

// document here refers to extension popup - search_box.html
$(document).ready(function () {
      var controller = new Controller();
      controller.run();
});


