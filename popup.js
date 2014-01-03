/*
 * 
 *
 */
$(document).ready( function () {
    $('.say').click(function (e) {
        var query = $('.query').val();
        chrome.tabs.query({active:true,currentWindow:true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {'query':query}, function (response)  {
                console.log(response);
                $('.row').append(response.content);    
            });
        });
    });
});


