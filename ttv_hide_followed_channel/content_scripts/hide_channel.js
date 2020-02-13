$( document ).ready(function() {
	
	// Global variables
	
	// Followed channels div
	var followedChannelsListDivSelector = '#root > div > div.tw-flex.tw-flex-column.tw-flex-nowrap.tw-full-height > div > div.side-nav.tw-c-background-alt.tw-flex-shrink-0.tw-full-height.tw-z-above > div >' +  
	' div.side-nav__overlay-wrapper.tw-flex.tw-full-height.tw-overflow-hidden.tw-relative > div > div.simplebar-scroll-content > div > div > div.side-bar-contents > div >' +  
	' div.tw-flex-grow-1 > div:nth-child(1) > div.tw-relative.tw-transition-group';
	var followedChannelsListDivNode = document.querySelector(followedChannelsListDivSelector);
	var followedChannelsListDiv = $(followedChannelsListDivSelector);
	var channelDivClass = ".tw-transition.tw-transition--duration-medium.tw-transition--enter-done.tw-transition__scale-over.tw-transition__scale-over--enter-done"
	
	// List of channels to be hidden
	var hiddenChannels = '';
	var allFollowedChannelsDivs = [];
	
	// Right clicked channel
	var channelName;
	var channelDiv;

	// Context menu option
	var optionInMenu = false;	

	// Initial interval employed to remove the channels before MutationObserver is operating
	var initialContinuousRemoval;
	var stopInterval = 0;
	
	// Followed channels' divs aren't initially loaded, so while they are being loaded, the ones containing the names 
	// of the channels that are wanted to be hidden won't be shown.
	function checkFollowedChannelsDivIsLoaded() {
		
		// Mutation Observer instantiation
		var mutationObs = new MutationObserver(callbackChannelAdded);

		// Observe initialization
		mutationObs.observe(followedChannelsListDivNode, { childList: true });

		// Once the MutationObserver takes care of all the channels that are added to the div, it isn't necessary to keep executing this function.
		//clearInterval(initialContinuousRemoval);
	  
	}

	function callbackChannelAdded(mutations, mutationObs) {
		
		for (var i = 0, length = mutations.length; i < length; i++) {

			if (mutations[i].addedNodes[0]) {
				
				var addedChannelDiv = mutations[i].addedNodes[0];
				var addedChannelName = $(addedChannelDiv).find("figure").attr("aria-label");
				
				allFollowedChannelsDivs.push({"name": addedChannelName, "div": addedChannelDiv});
				
				if (hiddenChannels.includes(addedChannelName)) 
					$(addedChannelDiv).attr('style','display:none !important');
			
			}
		}
	}

	// Get the list that contains the currently hidden channels
    chrome.storage.sync.get('hiddenChannels', function (result) {

        if (result.hiddenChannels) {
            hiddenChannels = result.hiddenChannels;
        } else {
            hiddenChannels = [];
        }
		
		initialContinuousRemoval = setInterval(removeChannelsOnPageLoad, 50);	
		checkFollowedChannelsDivIsLoaded();

    });
	
	// Inbox 📫
	chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

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
	
	// Set context menu dynamically and store pointed channels.
	$(followedChannelsListDiv)

	// Focus in: add 'Hide this channel' option to context menu
	.mouseover(sendAddContextMenuRequest)
	.mouseout(sendRemoveContextMenuRequest)
	.focusin(sendAddContextMenuRequest)
	.focusout(sendRemoveContextMenuRequest)

	// Right click
	.contextmenu(
		function(e) {
			channelDiv = $(e.target).closest(channelDivClass)[0];
			channelName = $(channelDiv).find("figure").attr("aria-label"); // The names are gotten this way so the extension can work when the channels are not expanded.
		}
	);

	function removeChannelsOnPageLoad () {
		let channels = $(followedChannelsListDiv).find(channelDivClass);
		$(channels).each(function() {
			let channelName = $(this).find("figure").attr("aria-label");
			if (!(allFollowedChannelsDivs.some(channel => channel.name === channelName)))
				allFollowedChannelsDivs.push({"name": channelName, "div": this});
			if (hiddenChannels.includes(channelName))
				$(this).attr('style','display:none !important');
		});
		
		stopInterval += 1;
		if (stopInterval == 50)
			clearInterval(initialContinuousRemoval);

	}

	function sendAddContextMenuRequest () {
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
	
	function sendRemoveContextMenuRequest () {
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
	
	function addHiddenChannel () {
		hiddenChannels.push(channelName);
		chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channelName} won't be shown anymore in your followed channels list.`) })
	}
	
	function removeHiddenChannel (channelName) {
		hiddenChannels = hiddenChannels.filter(channel => channel !== channelName);
		debugger;
		$(allFollowedChannelsDivs.find(channelDiv => channelDiv.name === channelName).div).attr('style','display:block !important');
	}

	
});





