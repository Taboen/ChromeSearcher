/*
 * Main controller (runs after clicking extension icon)
 *
 * 1. Fetches input from search box with class ".search".
 * 2. Sends this input to content_script as JSON message.
 * 3. Receives search results (as JSON object, sent via chrome message)
 * 4. Opens new tab where results are going to be displayed.
 * 
 */

// document here refers to extension popup - search_box.html
$(document).ready(function () {
    $('.search').click(function (e) {
        var query = $('.query').val();
        // Send message to content script.
        // But remember to identify where this script is running.
        // Query tabs to find active tab from which extension was called.
        chrome.tabs.query({active:true,currentWindow:true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {'query':query, "To":"content_script"}, function (response)  {
                console.log(response);
                // Store search results in local storage.
                localStorage.setItem("searchResults",response.result);
                displayInTab(response);
            });
        });
    });
    
    var displayInTab = function (response) {
        // Opens a new in-browser page where search results will be displayed.
        var url = chrome.extension.getURL('results.html');
        chrome.tabs.create({"url":url}, function (tab) {
            // do something after creating this tab
        });
    };
});


