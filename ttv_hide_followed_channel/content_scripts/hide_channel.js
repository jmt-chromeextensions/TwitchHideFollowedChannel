// Followed channels div
const followedChannelsListDivSelector = '.side-nav-section:first-child .tw-relative.tw-transition-group';
const followedChannelsListDivSelector_JQuery = '.side-nav-section:first .tw-relative.tw-transition-group';
const channelDivClass = ".tw-transition.tw-transition--enter-done.tw-transition__scale-over.tw-transition__scale-over--enter-done"
const channelDivClass2 = ".tw-transition.tw-transition--enter-active.tw-transition__scale-over.tw-transition__scale-over--enter-active"

var followedChannelsListDiv;

// List of channels to be hidden
var hiddenChannels = [];
var allFollowedChannelsDivs = [];

// Right clicked channel
var channelName;
var channelDiv;

// Context menu option
var optionInMenu = false;

// Inbox 📫
chrome.extension.onMessage.addListener(function (msg) {

	// 'Hide this channel' option clicked (message received from background script)
	if (msg.action == 'hideChannelFromBackground') {

		$(channelDiv).attr('style', 'display:none !important');
		addHiddenChannel();

		chrome.runtime.sendMessage(
			{ action: "sendMessageToOtherTabsAndPopup", channelName: channelName, channelDiv: channelDiv },
			function () {
				optionInMenu = false;
			}
		);

	// In some other Twitch tab or in the pop-up, a channel has been hidden (the storage has been updated already)
	} else if (msg.action == 'hideChannelFromContent') {

		hiddenChannels.push(msg.channelName);
		$(allFollowedChannelsDivs.find(channelDiv => channelDiv.name.toUpperCase() === msg.channelName.toUpperCase()).div).hide('slide', 200);

	} else { // Removed channel from pop-up

		if (msg.action == 'showChannelAgain') {
			removeHiddenChannel(msg.channelName);
		}

	}

});

$(document).ready(function () {

	followedChannelsListDiv = $(followedChannelsListDivSelector_JQuery);

	// Get the list that contains the currently hidden channels
	chrome.storage.sync.get('hiddenChannels', function (result) {

		if (result.hiddenChannels) {
			hiddenChannels = result.hiddenChannels;

			// If a null value has been saved by accident, it is removed from the storaged list.
			if (hiddenChannels) {
				hiddenChannels = hiddenChannels.filter(c => c != null);
				chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function(){});
			}

		} 
		checkFollowedChannelsDivIsLoaded();

	});

});

// Followed channels' divs aren't initially loaded, so while they are being loaded, the ones containing the names 
// of the channels that are wanted to be hidden won't be shown.
function checkFollowedChannelsDivIsLoaded() {

	// Mutation Observer instantiation
	var mutationObs = new MutationObserver(callbackChannelAdded);

	/* Observe initialization: once the followed channels div appears, the channels that may have been already added to it are hidden, MutationObserver's instance starts working
	and mouseover/focus and right click handlers are binded. */
	let init_observe_interval = setInterval(() => {
		if ($('.tw-relative.tw-transition-group').length > 0) {

			clearInterval(init_observe_interval);
			mutationObs.observe(document.querySelector(followedChannelsListDivSelector), { childList: true, subtree: true });
			removeHiddenChannels_AddContextMenuOptions();

			var init_remove_channels_checks = 0;

			// This interval is used to check every second during 15 seconds that none of the chosen-to-be-hidden channels is visible in the div (and also to add mouse handlers to channels).
			let init_remove_channels_interval = setInterval(() => {
				init_remove_channels_checks ++;
				removeHiddenChannels_AddContextMenuOptions();

				if (init_remove_channels_checks == 15) {
					clearInterval(init_remove_channels_interval);
					console.log("pal lobby");
				}

			}, 1000);
		}

	}, 100);

}

function removeHiddenChannels_AddContextMenuOptions() {

	// Remove channels the div may already contain
	let channels = $(followedChannelsListDivSelector_JQuery).find(`${channelDivClass},${channelDivClass2}`);
	$(channels).each(function () {
		let channelName = $(this).find("figure").attr("aria-label");
		if (!(allFollowedChannelsDivs.some(channel => channel.name === channelName)))
			allFollowedChannelsDivs.push({ "name": channelName, "div": this });
		if (hiddenChannels.includes(channelName))
			$(this).attr('style', 'display:none !important');
	});

	// Set context menu dynamically and store pointed channels.
	$(followedChannelsListDivSelector_JQuery)

		// Focus in: add 'Hide this channel' option to context menu
		.mouseover(sendAddContextMenuRequest)
		.mouseout(sendRemoveContextMenuRequest)

		// Right click
		.contextmenu(
			function (e) {
				channelDiv = $(e.target).closest(channelDivClass)[0];
				channelName = $(channelDiv).find("figure").attr("aria-label"); // The names are gotten this way so the extension can work when the channels are not expanded.
			}
		);

}

function callbackChannelAdded(mutations) {

	for (var i = 0, length = mutations.length; i < length; i++) {

		if (mutations[i].addedNodes[0]) {

			var addedChannelDiv = mutations[i].addedNodes[0];
			var addedChannelName = $(addedChannelDiv).find("figure").attr("aria-label");

			if (addedChannelName) {
				allFollowedChannelsDivs.push({ "name": addedChannelName, "div": addedChannelDiv });

				if (hiddenChannels.includes(addedChannelName))
					$(addedChannelDiv).attr('style', 'display:none !important');
			}

		}
	}
}

function sendAddContextMenuRequest() {
	if (!$(this).data("thfc-handler")) {
		$(this).data('thfc-handler', 'true');	
		chrome.runtime.sendMessage(
			{ action: "addContextMenuOption" },
			function () {
				optionInMenu = true;
			}
		);
	}
}

function sendRemoveContextMenuRequest() {
	if ($(this).data("thfc-handler")) {
		$(this).removeData('thfc-handler');
		chrome.runtime.sendMessage(
			{ action: "removeContextMenuOption" },
			function () {
				optionInMenu = false;
			}
		);

	}
}

function addHiddenChannel() {
	hiddenChannels.push(channelName);
	chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channelName} won't be shown anymore in your followed channels list.`) })
	// Note for the future: hidden channels are added here because the pop-up may not be opened, so its JavaScript can't be runned anytime.
}

function removeHiddenChannel(channelName) {
	hiddenChannels = hiddenChannels.filter(channel => channel !== channelName);
	$(allFollowedChannelsDivs.find(channelDiv => channelDiv.name.toUpperCase() === channelName.toUpperCase()).div).show('slide', 200);
}

