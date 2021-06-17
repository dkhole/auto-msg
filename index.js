const helper = require('./helper');

const launch = async () => {
	//get data from txt files
	const [userRows, listings, messages] = helper.readFiles();
	//handle edge cases
	if (userRows.length < 1) {
		console.log('🚀     minimum 1 user. Please update users.txt.     🚀');
		return;
	}
	if (messages.length < 2) {
		console.log('🚀     minimum 2 messages. Please update messages.txt.     🚀');
		return;
	}
	if (listings.length < 1) {
		console.log('🚀     minimum of 2 listings. Please update listings.txt.     🚀+--------------++++++++++++++++++++++++++++');
		return;
	}

	console.log(`Loaded ${userRows.length} users from users.txt`);
	console.log(`Loaded ${messages.length} messages from messages.txt`);
	console.log(`Loaded ${listings.length} listings from listings.txt`);

	helper.recursiveAsyncReadLineData(userRows, listings, messages);
};

launch();
