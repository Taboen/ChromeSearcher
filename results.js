/*
 * Displays results of search.
 *
 * 1. Takes search results from local storage.
 * 2. Appends them to the DOM.
 * 
 **/

$(document).ready(function () {
    console.log("document ready");
    var view = new resultsView();
    view.show();
})

var resultsView = function (args) {
    this.template = $('.searchResultsTemplate').html();
};

resultsView.prototype = {
    show: function () {
       // console.log(Mustache.render(this.template,this.message()));
        $('.row').append(Mustache.render(this.template,this.message()));
    },
    message: function () {
        return JSON.parse(localStorage.getItem('searchResults'));
    }
}

