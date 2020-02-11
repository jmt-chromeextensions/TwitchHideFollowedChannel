$(document).ready(function () {
	
	var hiddenChannels = [];
	
	// Inbox 📫
	chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

		// Added hidden channel (context menu option clicked)
		if (msg.action == 'hideChannel') {
			addChannelToDiv(msg.channelName);
		}
		
	});
	
    // Show the names of the channels that are being hidden
    chrome.storage.sync.get('hiddenChannels', function (result) {

        if (result.hiddenChannels && result.hiddenChannels.length > 0) {
			
			hiddenChannels = result.hiddenChannels;
			
            hiddenChannels.forEach(function (value) {
				addChannelToDiv(value);
            });

        } else {
            $(noHiddenChannels).show();
        }

    });
	
	// When one of the listed channels is clicked, a message with its name is sent.
	function addChannelToDiv(channelName) {
		$(noHiddenChannels).hide();
		$(hiddenChannelsList).append(`<p id='${channelName}' title="Show ${channelName} again.">${channelName}</p>`);
		$("#" + channelName).click(function() {
			
			hiddenChannels = hiddenChannels.filter(channel => channel !== channelName);
			$(this).remove();
			
			if (hiddenChannels.length == 0) // There aren't any hidden channels right now.
				$('#noHiddenChannels').show();
				
			chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channelName} will be shown again in your followed channels list.`) }) // Update storage
			showChannelAgain($(this).text());
		});
	}
		
	// Send message to content script to show the channel's div again
	function showChannelAgain (channelName) {
		chrome.tabs.query({url: "https://*.twitch.tv/*"}, function(tabs){
			for (var i = 0, length = tabs.length; i < length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, {action: "showChannelAgain", channelName: channelName}, function(response) {});  
			}
		});
	}

});