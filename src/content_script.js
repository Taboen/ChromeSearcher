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
            if (typeof arg == "object") {
                console.log.call(console,arg);
            } else {
                mess += " " + arguments[arg];   
            }
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
        this.sentences ? whereSearch = this.getSentences(this.getRawText()) : whereSearch = this.getParagraphs();
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
        var regex,found;
        
        if (this.ignoreCase) {
            regex = new RegExp(this.query,"gi");
        } else {
            regex = new RegExp(this.query,"g");
        }
        
        return whereSearch.filter(function (textChunk) {
            return regex.test(textChunk);
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

function runTests(optionalInput) { 
    logger("running tests");
    var parser = new PageParser({query:"Farewell",sentences:true, ignoreCase:true});
    if (optionalInput == undefined) {
        optionalInput = parser.getParagraphs();
    }
    result = parser.parse();
    console.log(result);
}

/*
 * We want to run some tests from command line without
 * browser and its document (e.g. parsing sentences 
 * with regexes), so we need 
 * some hack to accomplish this. 
 */

try {
    weAreInBrowser(); 
} catch (e) {
    // ensure we're not hiding some 
    // import errors
    if (e instanceof ReferenceError && e.message == 'document is not defined') {
        noBrowserAround();
        return false
    } else {
        throw e
    }
}

function noBrowserAround() {
    // Node is around so let's deal with it, parse those sentences
    // supplied via command line!
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', function (chunk) {
        runTests(chunk);
    });
 }
/*
 *
 * Initialize content script, tie 
 * it to DOM ready event, wait for 
 * messages from chrome runtime. 
 *
 */

function weAreInBrowser () {
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
}
