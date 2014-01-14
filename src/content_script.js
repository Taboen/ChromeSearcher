/**
 * @file content_script.js
 *
 * @desc
 * Has access to all http pages browsed by user.
 * 
 * 1. Receives a message (JSON object) from extension search box.
 * 2. Performs a search as determined by this query. 
 * 3. Responds to search_box.js with results of its operation.
 * 
 * @constructor PageParser
 * @param {integer} tabId id of chrome tab from which script is called
 * @param {integer} startSearch when search started
 * @param {string} query search term
 * @param {Boolean} sentences whether we're looking for sentences of paragraphs
 * @param {Boolean} ignoreCase should we ignore case
 * @return 
 ***/

function PageParser (tabId,startSearch,query,sentences,ignoreCase) {
    this.tabId = tabId;
    this.startSearch = startSearch;
    this.query = query; 
    this.sentences = sentences;
    this.ignoreCase = ignoreCase; 
}

PageParser.prototype = {
    /**
     * @method parse
	 * @memberof PageParser
     * @return parsedResult
     **/
    parse: function () {
        var whereSearch,result,parsedResult;
        if (this.sentences) {
            whereSearch = this.getSentences(this.getRawText());
        } else {
            whereSearch = this.getParagraphs();
        }
        result = this.findMatches(whereSearch);
        result = this.highlightQuery(result);
        parsedResult = this.addSearchDetails(result);
        
        return parsedResult;
    },
    /**
     * @method getRawText
	 * @memberof PageParser
     * @return {string} all text on page without regard for html elements
     **/
    getRawText: function () {
        return document.body.textContent;
    },
    /**
     * @method getStructuredText
	 * @memberof PageParser
     * @return {string} text on page obtained by parsing paragraphs, headings,listitems
     **/
    getStructuredText: function () {
        var textPieces = [];
        var paragraphs = this.getParagraphs();
        var headings = this.getHeadings();
        var listItems = this.getListItems();
        [paragraphs,headings,listItems].forEach(function (arr) {
            textPieces = textPieces.concat(arr);
        });
        return textPieces.join(" ");
    },
    /**
     * @method getParagraphs
	 * @memberof PageParser
     * @return {array} array of strings 
     **/
       getParagraphs: function () {
        var paragraphs = document.getElementsByTagName('p');
        
        return this.getNodesTextContent(paragraphs); 
    }, 
    /**
     * @method getSentences
	 * @memberof PageParser
     * @desc Assumes that a sentence is a string starting with 
     * capital letter, followed by anhy number of characters,
     * and ending with either "." or "?" or "!". 
     * At the moment does not handle edges cases, such as version 
     * numbers.
     * @param {string} textChunk
     * @return {array} sentences
     **/
       getSentences: function (textChunk) {
        var regex = new RegExp("([A-Z].+?[.?!])","g");
        var sentences = textChunk.match(regex);
        return sentences;
    },
    /**
     * @method getHeadings
	 * @memberof PageParser
     * @return {array} headings array of strings contaning text of nodes
     **/
    getHeadings: function () {
        var headings = [];
        [1,2,3,4,5].forEach(function (num) {
            var hnum = document.getElementsByTagName('h'+num);
            hnum = this.getNodesTextContent(hnum);
            headings = Array.prototype.concat.call(headings,hnum);
        },this);
        return headings;
    },
    /**
     * @method getListItems
	 * @memberof PageParser
     * @return {array} array of strings
     **/
    getListItems: function () {
        var listItems = document.getElementsByTagName('li');
        return this.getNodesTextContent(listItems);
    },
    /**
     * @method getNodesTextContent
	 * @memberof PageParser
     * @param {nodeList} nodeList
     * @return {array} array of strings
     **/
      getNodesTextContent: function (nodeList) {
        // nodeList - array of node elements.
        // Returns their textual content. 
        var result = Array.prototype.map.call(nodeList, function (node) { 
            return node.textContent;
        });
        return result
    },
    /**
     * @method findMatches
	 * @memberof PageParser
     * @param {array} whereSearch - array of strings
     * @return {array} found
     **/
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
            return textChunk.search(regex) != -1;
        });

        return found;
    },
    /**
     * @method highlightQuery
	 * @memberof PageParser
     * @param {array} result
     * @return {array} CallExpression
     **/
     highlightQuery: function (result) {
        return result.map(function (textPiece) {
            var query = new RegExp(this.query,"gi");
            textPiece = textPiece.replace(query,function (match) {
                return "<strong class='found'>"+match+"</strong>"} );
            return textPiece.replace(/\n/g," ").trim();
        },this); 
    }, 
    /**
     * @method addSearchDetails
	 * @memberof PageParser
     * @param {array} result
     * @return {JSON} CallExpression
     ***/
    addSearchDetails: function (result) {
        var url = location.href;
        var timestamp = new Date();
        timeReadable = timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds();
        searchTime = (+timestamp - this.startSearch)/1000; 
        var parsedResult = {"query":this.query, "timestamp":timeReadable, "url":url,
            "result":result, "sentences":this.sentences, "resultsLength":result.length, 
            "ignoreCase":this.ignoreCase, "searchTime":searchTime, "tabId":this.tabId};
        return JSON.stringify(parsedResult);
    } 
};

function runTests(optionalInput) { 
    var parser = new PageParser(100,+new Date(),"document",true, true);
    if (optionalInput == undefined) {
        optionalInput = parser.getParagraphs();
    }
    result = parser.parse();
}

/**
 *
 * Initialize content script, tie 
 * it to DOM ready event, wait for 
 * messages from chrome runtime. 
 *
 **/

DEVELOPER_MODE = true;
TESTING = true;


$(document).ready(function () {   
    
    if (TESTING && DEVELOPER_MODE) runTests();
    chrome.runtime.onMessage.addListener(
        function (message,sender,sendResponse) {
            
            var parser = new PageParser(message.tabId, message.startSearch,
                            message.query, message.sentences, message.ignoreCase);
            var result = parser.parse();
            sendResponse(result);
    });
});
