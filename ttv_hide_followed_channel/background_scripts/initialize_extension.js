chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        console.log("First installation. Executing content script in every corresponding tab.");
        executeScriptsInSpecificTabs(["https://*.twitch.tv/*"], ["jquery/jquery-3.4.1.min.js", "content_scripts/utils/utils.js", "content_scripts/hide_channel.js"]);
    }
});


function executeScriptsInSpecificTabs (urlPatterns, scripts) {
    chrome.tabs.query({ url: urlPatterns }, function (tabs) {
        console.log(tabs);
        for (var i = 0, length = tabs.length; i < length; i++) {
            executeOrderedScriptsInTab(tabs[i].id, scripts);
        }
    });
}

function executeOrderedScriptsInTab(tabId, scripts)
{
    function createCallback(i) {
        if (i < scripts.length -1)
            return chrome.tabs.executeScript(tabId, { file: scripts[i]} , function() { createCallback(i + 1) } );
        
        return chrome.tabs.executeScript(tabId, { file: scripts[i]}, null);
    }

    chrome.tabs.executeScript(tabId, { file: scripts[0]} , function() { createCallback(1) } );
}