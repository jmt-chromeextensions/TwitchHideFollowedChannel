const TWITCH_PURPLE_TETRADIC_COLORS = ["#e8b02c", "#9de82c", "#e82c9d"]

$(document).ready(function () {

	var hiddenChannels = [];

	// Inbox 📫
	chrome.extension.onMessage.addListener(function (msg) {

		// Added hidden channel (context menu option clicked)
		if (msg.action == 'hideChannel') {
			
			hiddenChannels.push(msg.channelName);
			hiddenChannels.sort(function (c1, c2) {
				return c1.localeCompare(c2, 'en', {'sensitivity': 'base'});
			});

			addChannelToDiv(msg.channelName, false);
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
			$(".channel_name_list").hover
			(function () {
				$(this).css("color", TWITCH_PURPLE_TETRADIC_COLORS[Math.floor(Math.random() * 3)]);
			},function() {
				$(this).css("color", "white");
			});

		} else {
			$(no_hidden_channels).show();
		}

	});

	// Add channel button
	$("#btn_add_channel").click(function()
	{
		
	});

	// Set add button animations
	$("#add_new_channel").hover
	(function () {
		// $(this).stop().animate({width: "190%"}, 500);
		// $("#channel_name").stop().show('slide', 300);
		$("#channel_name").show();
		$("#channel_name").stop().animate({width: '85%'}, 400);
		// $("#btn_add_channel").animate({left: '5px'});
	},
	function() {
		if (!$("#channel_name").is(":focus")) {
			$("#channel_name").stop().animate({width: '0%'}, 200, function() {
				$("#channel_name").hide();
			});
			// $("#channel_name").stop().hide('slide', 250);
			// $("#btn_add_channel").animate({left: '0px'});
			// $(this).stop().animate({width: "100%"}, 500);
		}
	});

	$("#channel_name").focusout(function() {
		$("#channel_name").stop().animate({width: '0%'}, 200, function() {
			$("#channel_name").hide();
		});
	})


	// Add new hidden channel to pop-up
	function addChannelToDiv(channelName, initial_load = true) {
		$(no_hidden_channels).hide();

		let new_channel_position_in_list = hiddenChannels.indexOf(channelName);

		if (new_channel_position_in_list == 0)
			$("#hidden_channels_list").prepend(`<p id='${channelName}' class='channel_name_list' ${!initial_load ? 'style="display:none"' : ''} title="Show ${channelName} again.">${channelName}</p>`);
		else
			$("#hidden_channels_list > .channel_name_list").eq(new_channel_position_in_list - 1)
			.after(`<p id='${channelName}' class='channel_name_list' ${!initial_load ? 'style="display:none"' : ''}  title="Show ${channelName} again.">${channelName}</p>`);

		// On click: remove channel from the pop-up and show it again in the followed channels section
		$("#" + channelName).click({clicked_channel: this}, removeHiddenChannel);

		if (!initial_load)
			// Slide show animation
			$("#" + channelName).show('slide', 200);

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
			$('#no_hidden_channels').show();

		chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channel_name} will be shown again in your followed channels list.`) }) // Update storage
		showChannelAgain(channel_name);
	}

	function checkIfUsernameExists() {


	}

});