const TWITCH_PURPLE_TETRADIC_COLORS = ["#e8b02c", "#9de82c", "#e82c9d"]

$(document).ready(function () {

	var hiddenChannels = [];

	// Inbox 📫
	chrome.extension.onMessage.addListener(function (msg) {

		// Added hidden channel (context menu option clicked)
		if (msg.action == 'hideChannel') {
			addNewChannel(msg.channelName, false);
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

		} else {
			$(no_hidden_channels).show();
		}

	});

	// Add channel button
	$("#btn_add_channel").click(addNewChannelFromInput);

	// Enter key pressed on input
	$("#channel_name").keypress(function (e) {
		if (e.which == 13) 
			addNewChannelFromInput();
	});

	// Set add button animations
	$("#add_new_channel").hover
	(function () {
		$("#channel_name").show();
		$("#channel_name").stop().animate({width: '85%'}, 400);
	},
	function() {
		if (!$("#channel_name").is(":focus") && !$("#channel_name").val()) { // Don't hide input if it's focused or has some value
			$("#channel_name").stop().animate({width: '0%'}, 200, function() {
				$("#channel_name").hide();
			});
		}
	});

	$("#channel_name").focusout(function() {
		if (!$("#channel_name").val()) 
			$("#channel_name").stop().animate({width: '0%'}, 200, function() {
				$("#channel_name").hide();
			});
	})

	function addNewChannelFromInput() {
		if (!$("#channel_name").val())
			$("#channel_name").stop().effect( "shake", {distance:5, times:2});
		else {
			addNewChannel($("#channel_name").val(), false, true);
			checkIfUsernameExists($("#channel_name").val());
			$("#channel_name").val('');
		}
	}

	function addNewChannel (channelName, initial_load = true) {
		hiddenChannels.push(channelName);
			hiddenChannels.sort(function (c1, c2) {
				return c1.localeCompare(c2, 'en', {'sensitivity': 'base'});
			});

			addChannelToDiv(channelName, initial_load);
	}

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
		$("#" + channelName)
			.click({clicked_channel: this}, removeHiddenChannel)
			.hover // Text color change on hover
			(function () {
				$(this).css("color", TWITCH_PURPLE_TETRADIC_COLORS[Math.floor(Math.random() * 3)]);
			},function() {
				$(this).css("color", "white");
			});

		if (!initial_load)
			// Slide show animation
			$("#" + channelName).show('slide', 200);

	}

	function removeHiddenChannel (clicked_channel) {
		let channel_name = clicked_channel.currentTarget.id;

		hiddenChannels = hiddenChannels.filter(channel => channel !== channel_name);
		$(clicked_channel.currentTarget).remove();

		if (hiddenChannels.length == 0) // There aren't any hidden channels right now.
			$('#no_hidden_channels').show();

		chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channel_name} will be shown again in your followed channels list.`) }) // Update storage
		sendMessageToContentScripts(channel_name, "showChannelAgain");
	}

	function sendMessageToContentScripts(channelName, action) {
		chrome.tabs.query({ url: "https://*.twitch.tv/*" }, function (tabs) {
			for (var i = 0, length = tabs.length; i < length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, { action: action, channelName: channelName }, function () { });
			}
		});
	}

	function checkIfUsernameExists(channelName) {
		$.ajax(
			{
				type: "GET",
				url: `https://cactus.tools/twitch/username?username=${channelName}`,
				async: true,
				success: function (page_html) {
					if (page_html.includes(`<div class="alert alert-danger">The username <strong>${channelName}</strong> is <strong>NOT</strong> available!</div>`)) {
						chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channelName} won't be shown anymore in your followed channels list.`) })
						sendMessageToContentScripts(channelName, "hideChannelFromContent");
					} else {
						$(`#${channelName}`)
							.css("color", "black")
							.attr("title", "This channel does not exist. It will be removed.")
							.unbind('mouseenter mouseleave');
					}
				},
				error: function () { // If there is an error or cactus.tools is not available the channel is added and we don't ask any questions.
					chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channelName} won't be shown anymore in your followed channels list.`) })
					sendMessageToContentScripts(channelName, "hideChannelFromContent");
				}
				
			});
	}

})