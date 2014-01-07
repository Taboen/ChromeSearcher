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

function PageParser (queryObject) {
    // Accepts a query object, with following keys:
    //      query, string
    //      sentences, Boolean
    //      ignoreCase, Boolean
    this.query = queryObject["query"];
    this.sentences = queryObject["sentences"];
    this.ignoreCase = queryObject["ignoreCase"]; 
};

PageParser.prototype = {
    parse: function () {
        var whereSearch,result,parsedResult;
        this.sentences ? whereSearch = this.getSentences() : whereSearch = this.getParagraphs();
        result = this.findMatches(whereSearch);
        result = this.highlightQuery(result)
        parsedResult = this.addSearchDetails(result);
        console.log(parsedResult);
        return parsedResult;
    }, 
    getParagraphs: function () {
        // returns an array of text contents of paragraphs in parsed page
        var paragraphs = document.getElementsByTagName('p');
        return Array.prototype.map.call(paragraphs, function (node) { return node.textContent;})
    }, 
    getSentences: function () {
        // returns all sentences on a page,
        // assumes that a sentence is a string separated by dot.
        return $('body').text().split(".");
    }, 
    findMatches: function (whereSearch) {
        // whereSearch, an array of strings
        // returns an array where query string appears
        whereSearchCopy = whereSearch.slice();
        if (this.ignoreCase) {
            this.query = this.query.toLowerCase();
            return whereSearch
                .map(function (textPiece,ind) {
                    return [textPiece.toLowerCase(),ind];
                })
                .filter(function(textPieceAndInd) { 
                    return textPieceAndInd[0].indexOf(this.query) != -1
                },this)
                .map(function(foundPiece) {
                    return whereSearch[foundPiece[1]]
                })
                //console.log(whereSearchCopy);
        } else {
            return whereSearchCopy.filter(function (textPiece) {
                return textPiece.indexOf(this.query) != -1; 
            },this);
        }
    },
    highlightQuery: function (result) {
        return result.map(function (textPiece) {
            var query = new RegExp(this.query,"gi");
            textPiece = textPiece.replace(query,"<strong class='found'>"+this.query+"</strong>");
            if (!this.sentences) {
                return textPiece.replace(/\n/g," ").trim();;
            } else {
                return textPiece.replace(/\n/g," ").trim() + ".";
            }
        },this); 
    }, 
    addSearchDetails: function (result) {
        // Accepts an array of strings.
        // Returns a JSON object with following keys:
        //    url, a string
        //    timestamp, Date object
        //    result, an array of strings
        //    ignoreCase, Boolean
        //    sentences, Boolean
        //    query, string
        var url = location.href;
        var timestamp = new Date();
        var parsedResult = {"query":this.query, "timestamp":timestamp, "url":url,
            "result":result, "sentences":this.sentences, "resultsLength":result.length, "ignoreCase":this.ignoreCase};
        return JSON.stringify(parsedResult);
    } 
}

$(document).ready(function () {   
    console.log("content script loaded!");
    //parser = new PageParser({"query":"Think", "sentences":false,"ignoreCase":true});
    //parser.parse();
    chrome.runtime.onMessage.addListener(
        function (message,sender,sendResponse) {
            console.log(message,sender);
            parser = new PageParser(message);
            result = parser.parse();
            sendResponse(result);
    });
});

