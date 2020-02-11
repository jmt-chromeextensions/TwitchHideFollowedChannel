$( document ).ready(function() {
	
	// Global variables
	
	// Followed channels div
	var followedChannelsListDivSelector = '#root > div > div.tw-flex.tw-flex-column.tw-flex-nowrap.tw-full-height > div > div.side-nav.tw-c-background-alt.tw-flex-shrink-0.tw-full-height.tw-z-above > div >' +  
	' div.side-nav__overlay-wrapper.tw-flex.tw-full-height.tw-overflow-hidden.tw-relative > div > div.simplebar-scroll-content > div > div > div.side-bar-contents > div >' +  
	' div.tw-flex-grow-1 > div:nth-child(1) > div.tw-relative.tw-transition-group';
	var followedChannelsListDivNode = document.querySelector(followedChannelsListDivSelector);
	var followedChannelsListDiv = $(followedChannelsListDivSelector);
	
	var hiddenChannels = '';
	var allFollowedChannelsDivs = [];
	
	// Context menu option
	var optionInMenu = false;	
	
	var channelName;
	var channelDiv;
	
	// Followed channels' divs aren't initially loaded, so while they are being loaded, the ones containing the names 
	// of the channels that are wanted to be hidden won't be shown.
	function checkFollowedChannelsDivIsLoaded() {
		
		// Mutation Observer instantiation
		var mutationObs = new MutationObserver(callbackChannelAdded);

		// Observe initialization
		mutationObs.observe(followedChannelsListDivNode, { childList: true });
	  
	}

	function callbackChannelAdded(mutations, mutationObs) {
		
		for (var i = 0, length = mutations.length; i < length; i++) {

			if (mutations[i].addedNodes[0]) {
				
				var addedChannelDiv = mutations[i].addedNodes[0];
				var addedChannelName = $(addedChannelDiv).find("figure").attr("aria-label");
				
				allFollowedChannelsDivs.push({"name": addedChannelName, "div": addedChannelDiv});
				
				if (hiddenChannels.includes(addedChannelName)) 
					$(addedChannelDiv).hide();
			
			}
		}
	}
	
	// Inbox 📫
	chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

		debugger;
		// 'Hide this channel' option clicked (message received from background script)
		if (msg.action == 'hideChannelFromBackground') {

			$(channelDiv).attr('style','display:none !important');
			addHiddenChannel();
			
			chrome.runtime.sendMessage(
					{action: "sendMessageToOtherTabsAndPopup", channelName: channelName, channelDiv: channelDiv},
					function (response) {
						optionInMenu = false;
					}
				);

		// In some other Twitch tab, a channel has been hidden (the storage has been updated already)
		} else if (msg.action == 'hideChannelFromContent') {
			
			hiddenChannels.push(msg.channelName);
			if ($(allFollowedChannelsDivs.find(channelDiv => channelDiv.name === msg.channelName)))
				$(allFollowedChannelsDivs.find(channelDiv => channelDiv.name === msg.channelName).div).attr('style','display:none !important');
			
		
		} else { // Removed channel from popup
			
			if (msg.action == 'showChannelAgain') {
				removeHiddenChannel(msg.channelName);
			} 
			
		}
		
	});
	
	// Get the list that contains the currently hidden channels
    chrome.storage.sync.get('hiddenChannels', function (result) {

        if (result.hiddenChannels) {
            hiddenChannels = result.hiddenChannels;
        } else {
            hiddenChannels = [];
        }
		
		checkFollowedChannelsDivIsLoaded();

    });
	
	// Set context menu dynamically and store pointed channels.
	$(followedChannelsListDiv)
	
	.hover(
	// Hover: add 'Hide this channel' option to context menu
		function() {
			
			if (!optionInMenu)
			{
				chrome.runtime.sendMessage(
					{action: "addContextMenuOption"},
					function (response) {
						optionInMenu = true;
					}
				);
			}
			
		},
		function() {
			if (optionInMenu)
			{
			
				chrome.runtime.sendMessage(
					{action: "removeContextMenuOption"},
					function (response) {
						optionInMenu = false;
					}
				);
			
			}
		}
	)
	
	// Focus in: add 'Hide this channel' option to context menu
	.focusin(
		function(e) {
			if (!optionInMenu)
			{
				chrome.runtime.sendMessage(
					{action: "addContextMenuOption"},
					function (response) {
						optionInMenu = true;
					}
				);
			}
		}
	)
	.focusout(
		function(e) {
			if (optionInMenu)
			{
			
				chrome.runtime.sendMessage(
					{action: "removeContextMenuOption"},
					function (response) {
						optionInMenu = false;
					}
				);
			
			}
		}
	// Right click
	).contextmenu(
		function(e) {
			channelDiv = $(e.target).closest(".tw-transition.tw-transition--duration-medium.tw-transition--enter-done.tw-transition__scale-over.tw-transition__scale-over--enter-done")[0];
			channelName = $(channelDiv).find("figure").attr("aria-label"); // The names are gotten this way so the extension can work when the channels are not expanded.
		}
	);
	
	function addHiddenChannel () {
		hiddenChannels.push(channelName);
		chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channelName} won't be shown anymore in your followed channels list.`) })
	}
	
	function removeHiddenChannel (channelName) {
		hiddenChannels = hiddenChannels.filter(channel => channel !== channelName);
		$(allFollowedChannelsDivs.find(channelDiv => channelDiv.name === channelName).div).show();
	}

	
});





