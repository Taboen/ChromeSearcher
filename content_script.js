/*
 * Content Script.
 *
 * Has access to all http pages browsed by user.
 * 
 * 1. Receives a message (JSON object) from extension search box.
 * 2. Performs a search as determined by this query. 
 * 3. Responds to search_box.js with results of its operation.
 *
 *** Does not store anything in local storage. 
 *** Due to peculiarity of extension runtime content scripts
 *** don't have access to the same localStorage as search_box.js and results.js.
 */

DEVELOPER_MODE = true;
TESTING = false; 

var logger  = function () {
    // Small logging function 
    // we don't want to pollute console
    // with logs when content script 
    // runs for users.
    var when = new Date();
    var mess = "";
    mess += [when.getHours(),when.getMinutes(), when.getSeconds()].join(":");
    mess += "  ";
    if (DEVELOPER_MODE) {
        for (var arg in arguments) {
            mess += " " + arguments[arg];   
        }
    console.log(mess);
    }
}; 

function PageParser (queryObject) {
    // Accepts a query object, with following keys:
    //      query, string
    //      sentences, Boolean
    //      ignoreCase, Boolean
    this.tabId = queryObject['tabId'];
    this.startSearch = queryObject["startSearch"];
    this.query = queryObject["query"];
    this.sentences = queryObject["sentences"];
    this.ignoreCase = queryObject["ignoreCase"]; 
}

PageParser.prototype = {
    parse: function () {
        // returns parsedResult, a JSON object.
        var whereSearch,result,parsedResult;
        this.sentences ? whereSearch = this.getSentences(this.getParagraphs().join(" ")) : whereSearch = this.getParagraphs();
        // TODO refactor into chaining? 
        result = this.findMatches(whereSearch);
        result = this.highlightQuery(result);
        parsedResult = this.addSearchDetails(result);
        logger(parsedResult);
        return parsedResult;
    }, 
    getRawText: function () {
        return document.body.textContent;
    },
    getParagraphs: function () {
        // returns an array of text contents of paragraphs in parsed page
        var paragraphs = document.getElementsByTagName('p');
        return this.getNodesTextContent(paragraphs); 
    }, 
    getSentences: function (textPiece) {
        // Accepts a string, 
        // returns all sentences in that string.
        // Assumes that a sentence is a string separated by ".", "?" or "!"
        // TODO hone our regex, it needs to parse cases like:
        //     "1.2" --> do not split version number
        //     "string.replace" --> do not split methods
        //     "(something something.)ola" --> should split on brackets not on dot
        var separators = [];
        var sentences = textPiece.replace(/\?|\!|\./g, function (item) { 
                separators.push(item); return ".";
            })
            .split(".")
            .map(function (item,index) {
                if (separators[index] != undefined) return item.trim() + separators[index];
                return item.trim();
            });
        return sentences;
    },
    getHeadings: function () {
        var headings = [];
        [1,2,3,4,5].forEach(function (num) {
            var hnum = document.getElementsByTagName('h'+num);
            hnum = this.getNodesTextContent(hnum);
            headings = Array.prototype.concat.call(headings,hnum);
        },this);
        console.log(headings);
        return headings;
    },
    getListItems: function () {
        var listItems = document.getElementsByTagName('li');
        return this.getNodesTextContent(listItems);
    },
    getNodesTextContent: function (nodeList) {
        // nodeList - array of node elements.
        // Returns their textual content. 
        var result = Array.prototype.map.call(nodeList, function (node) { 
            return node.textContent;
        });
        return result
    },
    findMatches: function (whereSearch) {
        // whereSearch, an array of strings
        // returns an array where query string appears
        if (this.ignoreCase) {
            return this.findMatchesIgnoreCase(whereSearch); 
        }
        var found =  whereSearch.filter(function (textPiece) {
                return textPiece.indexOf(this.query) != -1; 
        },this);
        //logger("I've found", found)
        return found;
    },
    findMatchesIgnoreCase: function (whereSearch) {
        // We want to ignore case while searching, 
        // but we want to display results the way they 
        // appear on page. We don't want to display 
        // all results lowercase. 
        var whereSearchCopy = whereSearch.slice();
        this.query = this.query.toLowerCase();
        return whereSearch
                .map(function (textPiece,ind) {
                    return [textPiece.toLowerCase(),ind];
                })
                .filter(function(textPieceAndInd) { 
                    return textPieceAndInd[0].indexOf(this.query) != -1;
                },this)
                .map(function(foundPiece) {
                    return whereSearch[foundPiece[1]];
                });
 
    }, 
    highlightQuery: function (result) {
        return result.map(function (textPiece) {
            var query = new RegExp(this.query,"gi");
            textPiece = textPiece.replace(query,function (match) {
                return "<strong class='found'>"+match+"</strong>"} );
            return textPiece.replace(/\n/g," ").trim();
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
        timeReadable = timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds();
        searchTime = (+timestamp - this.startSearch)/1000; 
        var parsedResult = {"query":this.query, "timestamp":timeReadable, "url":url,
            "result":result, "sentences":this.sentences, 
            "resultsLength":result.length, "ignoreCase":this.ignoreCase, 
            "searchTime":searchTime, "tabId":this.tabId};
        return JSON.stringify(parsedResult);
    } 
};

function runTests() { 
    logger("running tests");
    var parser = new PageParser({query:"Tartar",sentences:false, ignoreCase:false});
    parser.parse();
}
 
/*
 *
 * Initialize content script, tie 
 * it to DOM ready event, wait for 
 * messages from chrome runtime. 
 *
 */

$(document).ready(function () {   
    logger("content script loaded!");
    if (TESTING && DEVELOPER_MODE) runTests();
    chrome.runtime.onMessage.addListener(
        function (message,sender,sendResponse) {
            console.log("got message",message,"from sender",sender);
            logger(message,sender);
            var parser = new PageParser(message);
            var result = parser.parse();
            sendResponse(result);
    });
});
