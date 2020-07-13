const INVALID_INPUT = "Usernames must contain between 4 and 25 characters (only letters, numbers and underscores are allowed)."
const USERNAME_NOT_EXIST = "This channel does not exist."
const TWITCH_PURPLE_TETRADIC_COLORS = ["#e8b02c", "#9de82c", "#e82c9d"]
const TWITCH_USERNAME_PATTERN = /^[a-zA-Z0-9_]{4,25}$/

$(document).ready(function () {

	var hiddenChannels = [];
	var valid_input;

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

	// Validate input on key up
	$("#channel_name").bind ('input', (delay(checkChannelNameIsValid, 500)));
	$("#channel_name").bind ('input', function () {valid_input = false; });

	// Enter pressed: submit input's value
	$("#channel_name").keyup(function (e) {
		if (!$(this).val())
			$("#invalid_username").hide();

		if (e.which == 13 && !	$("#btn_add_channel").hasClass("inactive")) {
			addNewChannelFromInput();
		}
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

	function addNewChannel (channel_name, initial_load = true) {
		hiddenChannels.push(channel_name);
			hiddenChannels.sort(function (c1, c2) {
				return c1.localeCompare(c2, 'en', {'sensitivity': 'base'});
			});

			addChannelToDiv(channel_name, initial_load);
	}

	// Add new hidden channel to pop-up
	function addChannelToDiv(channel_name, initial_load = true) {
		$(no_hidden_channels).hide();

		let new_channel_position_in_list = hiddenChannels.indexOf(channel_name);

		if (new_channel_position_in_list == 0)
			$("#hidden_channels_list").prepend(`<p id='${channel_name}' class='channel_name_list' ${!initial_load ? 'style="display:none"' : ''} title="Show ${channel_name} again.">${channel_name}</p>`);
		else
			$("#hidden_channels_list > .channel_name_list").eq(new_channel_position_in_list - 1)
			.after(`<p id='${channel_name}' class='channel_name_list' ${!initial_load ? 'style="display:none"' : ''}  title="Show ${channel_name} again.">${channel_name}</p>`);

		// On click: remove channel from the pop-up and show it again in the followed channels section
		$("#" + channel_name)
			.click({clicked_channel: this}, removeHiddenChannel)
			.hover // Text color change on hover
			(function () {
				$(this).css("color", TWITCH_PURPLE_TETRADIC_COLORS[Math.floor(Math.random() * 3)]);
			},function() {
				$(this).css("color", "white");
			});

		if (!initial_load)
			// Slide show animation
			$("#" + channel_name).show('slide', 200);

	}

	async function checkChannelNameIsValid() {
		if (!$(this).val())
			return

		if ((this).checkValidity()) {
			let channel_name = $("#channel_name").val();
			$('*').addClass('cursor_wait');
			$("#btn_add_channel").addClass("inactive");

			let username_exists = await checkIfUsernameExists(channel_name);
			debugger;
			if (username_exists) {
				valid_input = true;
				$("#invalid_username").hide( {effect: "slide", direction: 'up'} );
			}
			else 
			{
				$("#invalid_username").text(USERNAME_NOT_EXIST);
				$("#invalid_username").show( {effect: "slide", direction: 'up'} );
				// setTimeout(() => {
				// }, 100); 
			}

			$('*').removeClass('cursor_wait');
			$("#btn_add_channel").removeClass("inactive");
		}
		else {
			$("#invalid_username").text(INVALID_INPUT);
			$("#invalid_username").show( {effect: "slide", direction: 'up'} );
		}
	}

	function addNewChannelFromInput() {
		debugger;
		let channel_name = $("#channel_name").val();
		if (!channel_name || !valid_input)
			$("#channel_name").stop().effect("shake", { distance: 5, times: 2 });
		else {

			addNewChannel(channel_name, false);
			chrome.storage.sync.set({ 'hiddenChannels': hiddenChannels }, function () { console.log(`${channel_name} won't be shown anymore in your followed channels list.`) })
			sendMessageToContentScripts(channel_name, "hideChannelFromContent");

			// Clear input
			$("#channel_name").val('');
			$("#invalid_username").hide();
		}
		
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

	function sendMessageToContentScripts(channel_name, action) {
		chrome.tabs.query({ url: "https://*.twitch.tv/*" }, function (tabs) {
			for (var i = 0, length = tabs.length; i < length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, { action: action, channelName: channel_name }, function () { });
			}
		});
	}

	// cactus.tools
	function checkIfUsernameExists(channel_name) {
		return new Promise(resolve => {
			$.ajax(
				{
					type: "GET",
					url: `https://cactus.tools/twitch/username?username=${channel_name}`,
					async: true,
					success: function (page_html) {
						if (page_html.includes(`<div class="alert alert-danger">The username <strong>${channel_name}</strong> is <strong>NOT</strong> available!</div>`)) {
							resolve(true);
						} else {
							resolve(false);
						}
					},
					error: function () { // If there is an error or cactus.tools is not available the channel is added and we don't ask any questions.
						resolve(true);
				}
	
			});
		  });
	}

	// https://stackoverflow.com/a/1909508/9252531
	function delay (callback, ms) {
		var timer = 0;
		return function () {
			var context = this, args = arguments;
			clearTimeout(timer);
			timer = setTimeout(function () {
				callback.apply(context, args);
			}, ms || 0);
		};
	}

})