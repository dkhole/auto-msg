const helpers = require('./helpers');
const input = require('./input');

const launch = async () => {
	//get data from txt files
	const [userRows, listings, messages] = helpers.readFiles();
	//handle edge cases
	if (userRows.length < 1) {
		console.log('🚀     minimum 1 user. Please update users.txt.     🚀');
		return;
	}
	if (messages.length < 1) {
		console.log('🚀     minimum 1 message. Please update messages.txt.     🚀');
		return;
	}
	if (listings.length < 1) {
		console.log('🚀     minimum of 2 listings. Please update listings.txt.     🚀');
		return;
	}

	console.log(`Loaded ${userRows.length} user(s) from users.txt`);
	console.log(`Loaded ${messages.length} message(s) from messages.txt`);
	console.log(`Loaded ${listings.length} listings from listings.txt`);

	input.start(userRows, listings, messages);
};

launch();
