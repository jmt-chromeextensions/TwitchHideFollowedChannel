const TWITCH_PURPLE_TETRADIC_COLORS = ["#e8b02c", "#9de82c", "#e82c9d"]

$(document).ready(function () {

	var hiddenChannels = [];

	// Inbox 📫
	chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {

		// Added hidden channel (context menu option clicked)
		if (msg.action == 'hideChannel') {
			
			hiddenChannels.push(msg.channelName);
			hiddenChannels.sort(function (c1, c2) {
				return c1.localeCompare(c2, 'en', {'sensitivity': 'base'});
			});

			addChannelToDiv(msg.channelName);
		}

	});

	// Show the names of the channels that are being hidden
	chrome.storage.sync.get('hiddenChannels', function (result) {

		if (result.hiddenChannels && result.hiddenChannels.length > 0) {

			hiddenChannels = result.hiddenChannels;

			// Sort channels' names alphabetically (case-insensitive)
			hiddenChannels.sort(function (c1, c2) {
				return c1.localeCompare(c2, 'en', {'sensitivity': 'base'});
			});

			hiddenChannels.forEach(function (value) {
				addChannelToDiv(value);
			});

			// Text of channel's names change its color on hover
			$(".channel_name").hover
			(function () {
				$(this).css("color", TWITCH_PURPLE_TETRADIC_COLORS[Math.floor(Math.random() * 3)]);
			},function() {
				$(this).css("color", "white");
			});

		} else {
			$(noHiddenChannels).show();
		}

	});

	// Add new hidden channel to pop-up
	function addChannelToDiv(channelName) {
		$(noHiddenChannels).hide();

		let new_channel_position_in_list = hiddenChannels.indexOf(channelName);

		if (new_channel_position_in_list == 0)
			$("#hiddenChannelsList").prepend(`<p id='${channelName}' class='channel_name' title="Show ${channelName} again.">${channelName}</p>`);
		else
			$("#hiddenChannelsList > .channel_name").eq(new_channel_position_in_list - 1)
			.after(`<p id='${channelName}' class='channel_name' title="Show ${channelName} again.">${channelName}</p>`);

		// On click: remove channel from the pop-up and show it again in the followed channels section
		$("#" + channelName).click({clicked_channel: this}, removeHiddenChannel);
	}

	// Send message to content script to show the channel's div again
	function showChannelAgain(channelName) {
		chrome.tabs.query({ url: "https://*.twitch.tv/*" }, function (tabs) {
			for (var i = 0, length = tabs.length; i < length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, { action: "showChannelAgain", channelName: channelName }, function (response) { });
			}
		});
	}

	function removeHiddenChannel (clicked_channel) {
		let channel_name = clicked_channel.currentTarget.id;

		hiddenChannels = hiddenChannels.filter(channel => channel !== channel_name);
		$(clicked_channel.currentTarget).remove();

		if (hiddenChannels.length == 0) // There aren't any hidden channels right now.
			$('#noHiddenChannels').show();

		chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channel_name} will be shown again in your followed channels list.`) }) // Update storage
		showChannelAgain(channel_name);
	}

});