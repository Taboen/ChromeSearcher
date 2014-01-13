/**
 * @file content_script.js
 ***/


/**
 * @desc
 * Has access to all http pages browsed by user.
 * 
 * 1. Receives a message (JSON object) from extension search box.
 * 2. Performs a search as determined by this query. 
 * 3. Responds to search_box.js with results of its operation.
 *
 * Does not store anything in local storage. 
 * Due to peculiarity of extension runtime content scripts
 * don't have access to the same localStorage as search_box.js and results.js.
 * Creates a new PageParser from a
 * message supplied by extension popup.

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
    this.tabId = tabId; //queryObject['tabId'];
    this.startSearch = startSearch;// queryObject["startSearch"];
    this.query = query; //queryObject["query"];
    this.sentences = sentences; //qsueryObject["sentences"];
    this.ignoreCase = ignoreCase; //queryObject["ignoreCase"]; 
}

PageParser.prototype = {
    /**
     * Description
     * @method parse
     * @memberof PageParser
     * @return parsedResult
     **/
    
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
    /**
     * Description
     * @method getRawText
	* @memberof PageParser
     * @return {string} all text on page without regard for html elements
     **/
    
    getRawText: function () {
        return document.body.textContent;
    },

   
    /**
     * Description
     * @method getStructuredText
	* @memberof PageParser
     * @return {string} text on page obtained by parsing paragraphs, headings,listitems
     **/
   
    getStructuredText: function () {
        /**
         * 
        ***/
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
     * Description
     * @method getParagraphs
	* @memberof PageParser
     * @return {array} array of strings 
     **/
       getParagraphs: function () {
        // returns an array of text contents of paragraphs in parsed page
        var paragraphs = document.getElementsByTagName('p');
        
        return this.getNodesTextContent(paragraphs); 
    }, 
    /**
     * Description
     * @method getSentences
     * @desc Assumes that a sentence is a string starting with 
     * capital letter, followed by anhy number of characters,
     * and ending with either "." or "?" or "!". 
     * At the moment does not handle edges cases, such as version 
     * numbers.
     * @memberof PageParser
     * @param {string} textChunk
     * @return {array} sentences
     **/
       getSentences: function (textChunk) {
        var regex = new RegExp("([A-Z].+?[.?!])","g");
        var sentences = textChunk.match(regex);
        return sentences;
    },
    /**
     * Description
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
     * Description
     * @method getListItems
	* @memberof PageParser
     * @return {array} array of strings
     **/
   
    getListItems: function () {
        var listItems = document.getElementsByTagName('li');
        return this.getNodesTextContent(listItems);
    },
    /**
     * Description
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
     * Description
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
           // var testResult = regex.test(textChunk);  
            return textChunk.search(regex) != -1;
        });

        return found;
    },
    /**
     * Description
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
     * Description
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
 **/

DEVELOPER_MODE = true;
TESTING = true;


$(document).ready(function () {   
    console.log("content script loaded!");
    if (TESTING && DEVELOPER_MODE) runTests();
    chrome.runtime.onMessage.addListener(
        function (message,sender,sendResponse) {
            console.log("got message",message,"from sender",sender);
            var parser = new PageParser(message.tabId,message.startSearch,message.query,message.sentences,message.ignoreCase);
            var result = parser.parse();
            sendResponse(result);
    });
});
