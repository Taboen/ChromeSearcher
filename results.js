/*
 * Displays results of search.
 *
 * 1. Takes search results from local storage.
 * 2. Appends them to the DOM.
 * 
 **/

$(document).ready(function () {
    console.log("document ready");
    var message = localStorage.getItem("searchResults"); 
    $('.row').append("<h1>received:"+message+"</h1>");
})
