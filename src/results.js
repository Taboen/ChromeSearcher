/*
 * Displays results of search.
 *
 * 1. Takes search results from local storage.
 * 2. Appends them to the DOM.
 * 
 **/

$(document).ready(function () {
    
    var view = new resultsView();
    view.show();
})

var resultsView = function (args) {
    this.template = $('.searchResultsTemplate').html();
};

resultsView.prototype = {
    show: function () {
        // 
        var content = this.message();
        
        if (content == undefined) return false;
        $('.row').append(Mustache.render(this.template,content));
        this.listen(content);
    },
    message: function () {
        // check if message is there
        var item = localStorage.getItem('searchResults');
        
        return JSON.parse(item);
    },
    listen: function (content) {
        var linkToTab = $('#linkToTab');
        linkToTab.click(function (e) {
            e.preventDefault();
            var href = linkToTab.attr('href');
            chrome.tabs.get(content.tabId, function (tab) {
               if (tab.url == href) {  
                   chrome.tabs.update(content.tabId,{active:true});
               } else {
                   chrome.tabs.create({url:href});
               }
            })
        })
    }
}

