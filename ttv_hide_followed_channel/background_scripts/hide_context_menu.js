var tabId; // ID of the tab where the option has been clicked

// Inbox 📫
chrome.runtime.onMessage.addListener(
    function(request, sendResponse) {
		
		if (request.action === "addContextMenuOption")
			chrome.contextMenus.create(
			{"title": "Hide this channel",
			"id": 'ctxMenuHideChannel',
			"contexts": ["all"],
			"documentUrlPatterns":["https://*.twitch.tv/*"],
			"onclick": hideChannelClick
			});
			
		else if (request.action === "removeContextMenuOption") 
			chrome.contextMenus.remove('ctxMenuHideChannel');
		
		else if (request.action == 'sendMessageToOtherTabsAndPopup') { // Send a message to every Twitch tab to inform that a channel must be hidden.

			debugger;

			chrome.runtime.sendMessage({action: "hideChannel", channelName: request.channelName}); // Send message to popup script
			
			chrome.tabs.query({url: "https://*.twitch.tv/*"}, function(tabs){
			
				for (var i = 0, length = tabs.length; i < length; i++) {
					
					if (tabs[i].id != tabId)
						chrome.tabs.sendMessage(tabs[i].id, {action: "hideChannelFromContent", channelName: request.channelName, channelDiv: request.channelDiv}, function(response) {});  
				}
			
			});
			
		}
		
		sendResponse("bar");
		
    }
);

function hideChannelClick() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){ // Send message to the tab where the option has been clicked
		tabId = tabs[0].id;
		chrome.tabs.sendMessage(tabs[0].id, {action: "hideChannelFromBackground"}, function(response) {});  
	});
}

