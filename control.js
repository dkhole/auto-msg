const bot = require('./bot');
const helpers = require('./helpers');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const iterateWithOneUser = async(messages, userRows, page, listings, timeouts) => {
	let messagesIndex = 0;
	const messagesLength = messages.length;

	//loop through listings
	for (let listingsInd = 0; listingsInd < listings.length; listingsInd++, messagesIndex++) {
		//reset index for messages to repeat them if we've reached the end
		
		messagesIndex = helpers.resetIndex(messagesIndex, messagesLength);
		await bot.sendMessage(page, listings[listingsInd], messages[messagesIndex], userRows);
		listingsInd++;
		messagesIndex++;
		messagesIndex = helpers.resetIndex(messagesIndex, messagesLength);
		//wait two minutes
		if(listingsInd < listings.length) {
			await helpers.sleep(timeouts[0]);
			await bot.sendMessage(page, listings[listingsInd], messages[messagesIndex], userRows);		
			await helpers.sleep(timeouts[1]);
		}
	}
}

const iterateWithUsers = async(messages, userRows, page, listings, timeouts) => {
	let usersIndex = 0;
	let messagesIndex = 0;
	const usersLength = userRows.length;
	const messagesLength = messages.length;
	//loop through listings
	for (let listingsInd = 0; listingsInd < listings.length; listingsInd++, messagesIndex++, usersIndex++) {
		//reset index for users/messages to repeat them if we've reached the end
		usersIndex = helpers.resetIndex(usersIndex, usersLength);
		messagesIndex = helpers.resetIndex(messagesIndex, messagesLength);

		await bot.login(page, userRows[usersIndex].username, userRows[usersIndex].password);
		await bot.sendMessage(page, listings[listingsInd], messages[messagesIndex]);
		listingsInd++;
		messagesIndex++;
		messagesIndex = helpers.resetIndex(messagesIndex, messagesLength);
		//wait two minutes
		if(listingsInd < listings.length) {
			await helpers.sleep(timeouts[0]);
			await bot.sendMessage(page, listings[listingsInd], messages[messagesIndex]);		
			await helpers.sleep(timeouts[1]);
		}
	}
}

module.exports = {
	startMessaging: async (userRows, listings, messages, timeouts) => {
		//launch puppeteer
		const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
		const [page] = await browser.pages();
	
		//gets past gumtrees antiscrape
		/*await page.evaluateOnNewDocument(() => {
			Object.defineProperty(navigator, 'webdriver', {
				get: () => false,
			});
		});*/
	
		//loop through users, loop through messages, send to all listings, wait 3 minutes between listings.
		//if one user dont relogout/login
		if(userRows.length === 1) {
			await bot.login(page, userRows[0].username, userRows[0].password);
			await iterateWithOneUser(messages, userRows, page, listings, timeouts);
		} else {
			await iterateWithUsers(messages, userRows, page, listings, timeouts);
		}
	
		console.log(`🚀       Finished sending to ${listings.length} listings        🚀`);
		await browser.close();
	}
};
