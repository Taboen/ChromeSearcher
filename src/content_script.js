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
TESTING = true;

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
        this.sentences ? whereSearch = this.getSentences(this.getStructuredText()) : whereSearch = this.getParagraphs();
        result = this.findMatches(whereSearch);
        result = this.highlightQuery(result);
        parsedResult = this.addSearchDetails(result);
        console.log(parsedResult);
        return parsedResult;
    }, 
    getRawText: function () {
        return document.body.textContent;
    },
    getStructuredText: function () {
        // Returns an array of strings
        var textPieces = [];
        var paragraphs = this.getParagraphs();
        var headings = this.getHeadings();
        var listItems = this.getListItems();
        [paragraphs,headings,listItems].forEach(function (arr) {
            textPieces = textPieces.concat(arr);
        });
        return textPieces.join(" ");
    },
    getParagraphs: function () {
        // returns an array of text contents of paragraphs in parsed page
        var paragraphs = document.getElementsByTagName('p');
        
        return this.getNodesTextContent(paragraphs); 
    }, 
    getSentences: function (textChunk) {
        var regex = new RegExp("([A-Z].+?[.?!])","g");
        var sentences = textChunk.match(regex);
        return sentences;
    },
    getHeadings: function () {
        var headings = [];
        [1,2,3,4,5].forEach(function (num) {
            var hnum = document.getElementsByTagName('h'+num);
            hnum = this.getNodesTextContent(hnum);
            headings = Array.prototype.concat.call(headings,hnum);
        },this);
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
        var regex,found;
        
        if (this.ignoreCase) {
            regex = new RegExp(this.query,"gi");
        } else {
            regex = new RegExp(this.query,"g");
        }
        
        var found = whereSearch.filter(function (textChunk) {
           // var testResult = regex.test(textChunk);  
            return textChunk.search(regex) != -1;
        });

        var found2 = [];
        whereSearch.forEach(function (textPiece) {
       //     console.log(textPiece.search(regex),textPiece);
        });
        return found;
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

function runTests(optionalInput) { 
    var parser = new PageParser({query:"document",sentences:true, ignoreCase:true});
    if (optionalInput == undefined) {
        optionalInput = parser.getParagraphs();
    }
    result = parser.parse();
}

/*
 *
 * Initialize content script, tie 
 * it to DOM ready event, wait for 
 * messages from chrome runtime. 
 *
 */

$(document).ready(function () {   
    console.log("content script loaded!");
    if (TESTING && DEVELOPER_MODE) runTests();
    chrome.runtime.onMessage.addListener(
        function (message,sender,sendResponse) {
            console.log("got message",message,"from sender",sender);
            var parser = new PageParser(message);
            var result = parser.parse();
            sendResponse(result);
    });
});
