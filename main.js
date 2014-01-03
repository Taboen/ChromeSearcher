/*
 * Content Script which accesses all browsed pages.
 * Searches for an item matching some pattern and 
 * stores results somewhere.
 *
 * Communicates with extension code in popup.js
 * 
 * 1. Make content script communicate with other extension files. 
 *
 * */
 $(document).ready(function () {   
    console.log("content script loaded!");
    chrome.runtime.onMessage.addListener(
        function (message,sender,sendResponse) {
            console.log(message,sender);
            sendResponse({"content":"got it!"});
    });
});
