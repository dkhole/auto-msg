const puppeteer = require('puppeteer');
const readline = require('readline');
const helper = require('./helper');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const recursiveAsyncReadLineBrowser = (userRows, listings, messages) => {
	rl.question('Are you ready to start? (yes/no)', (browser) => {
		if (browser === 'yes') {
			startMessaging(userRows, listings, messages, false);
			rl.close();
		} else if (browser === 'no') {
			console.log('Ctrl + C to quit / restart');
			recursiveAsyncReadLineBrowser(userRows, listings, messages);
		} else {
			recursiveAsyncReadLineBrowser(userRows, listings, messages);
		}
	});
};

const recursiveAsyncReadLineData = (userRows, listings, messages) => {
	rl.question('Do you want to view the data? (yes/no)', (view) => {
		if (view === 'yes') {
			console.log(userRows);
			console.log(listings);
			console.table(messages);
			recursiveAsyncReadLineBrowser(userRows, listings, messages);
		} else if (view === 'no') {
			recursiveAsyncReadLineBrowser(userRows, listings, messages);
		} else {
			recursiveAsyncReadLineData(userRows, listings, messages);
		}
	});
};

const startMessaging = async (userRows, listings, messages, isHeadless) => {
	const browser = await puppeteer.launch({ headless: isHeadless });
	const [page] = await browser.pages();

	//tricks gumtree
	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'webdriver', {
			get: () => false,
		});
	});

	//await helper.login(page, 'notabot419@outlook.com', 'notabot419');
	//await helper.sendMessage(page, 'https://www.gumtree.com.au/s-ad/randwick/beds/target-double-bed-with-firm-foam-mattress/1274373005', 'Please let me know as i can pick it up tomorrow');

	//loop through users, loop through messages, send to all listings, wait 3 minutes between listings.

	let usersIndex = 0;
	let messagesIndex = 0;
	const usersLength = userRows.length;
	const messagesLength = messages.length;

	for (let listingsInd = 0; listingsInd < listings.length; listingsInd++) {
		//login with user
		usersIndex = helper.resetIndex(usersIndex, usersLength);
		messagesIndex = helper.resetIndex(messagesIndex, messagesLength);

		await helper.login(page, userRows[usersIndex].username, userRows[usersIndex].password);
		//console.log('logging in with ' + userRows[usersIndex].username + ' and ' + userRows[usersIndex].password);
		await helper.sendMessage(page, listings[listingsInd], messages[messagesIndex]);
		messagesIndex++;
		listingsInd++;
		//wait a minute
		await helper.sleep(10000);
		await helper.sendMessage(page, listings[listingsInd], messages[messagesIndex]);
		messagesIndex++;
		usersIndex++;
	}
	await browser.close();
};

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

	recursiveAsyncReadLineData(userRows, listings, messages);
};

launch();
