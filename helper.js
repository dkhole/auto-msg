const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const readline = require('readline');
const cheerio = require('cheerio');
const MapCategories = require('./mapCategories');
const UserAgent = require('user-agents');
const randomUserAgent = require('random-useragent');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const stealthSettings = async(page) => {
	const userAgent = randomUserAgent.getRandom();
	//const UA = userAgent || USER_AGENT;

	//Randomize viewport size
	await page.setViewport({
		width: 1920 + Math.floor(Math.random() * 100),
		height: 3000 + Math.floor(Math.random() * 100),
		deviceScaleFactor: 1,
		hasTouch: false,
		isLandscape: false,
		isMobile: false,
	});
	console.log(userAgent);
	await page.setUserAgent(userAgent);
	await page.setJavaScriptEnabled(true);
	await page.setDefaultNavigationTimeout(0);

	//Skip images/styles/fonts loading for performance
	/*await page.setRequestInterception(true);
	page.on('request', (req) => {
		if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
			req.abort();
		} else {
			req.continue();
		}
	});*/

	await page.evaluateOnNewDocument(() => {
		// Pass webdriver check
		Object.defineProperty(navigator, 'webdriver', {
			get: () => false,
		});
	});

	await page.evaluateOnNewDocument(() => {
		// Pass chrome check
		window.chrome = {
			runtime: {},
			// etc.
		};
	});

	await page.evaluateOnNewDocument(() => {
		//Pass notifications check
		const originalQuery = window.navigator.permissions.query;
		return window.navigator.permissions.query = (parameters) => (
			parameters.name === 'notifications' ?
				Promise.resolve({ state: Notification.permission }) :
				originalQuery(parameters)
		);
	});

	await page.evaluateOnNewDocument(() => {
		// Overwrite the `plugins` property to use a custom getter.
		Object.defineProperty(navigator, 'plugins', {
			// This just needs to have `length > 0` for the current test,
			// but we could mock the plugins too if necessary.
			get: () => [1, 2, 3, 4, 5],
		});
	});

	await page.evaluateOnNewDocument(() => {
		// Overwrite the `languages` property to use a custom getter.
		Object.defineProperty(navigator, 'languages', {
			get: () => ['en-US', 'en'],
		});
	});

	return page;
}

const login = async (page, email, password) => {
	await page.goto('https://www.gumtree.com.au/t-login-form.html', { waitUntil: 'domcontentloaded' });
	console.log('🚀   Entering email   🚀');
	await page.waitForSelector('#login-email');
	await page.type('#login-email', email);

	console.log('🚀   Entering password   🚀');
	await page.type('#login-password', password);

	console.log('🚀   Logging in   🚀');

	await Promise.all([page.click('#btn-submit-login'), page.waitForNavigation()]);
	console.log(`🚀   Logged In to gumtree as ${email}   🚀`);
};

const sendMessage = async (page, listing, message, userRows = 0) => {
	console.log(`🚀   Navigating to listing   🚀`);
	//generate and set a new user agent
	//const userAgent = new UserAgent();
	await stealthSettings(page);
	await page.goto(listing.url, { waitUntil: 'domcontentloaded' });
	await page.setDefaultNavigationTimeout(300000);
	let text = await page.waitForSelector('#input-reply-widget-form-message');
	

	//get and map category
	console.log(`🚀   Getting and mapping category   🚀`);
	await page.waitForSelector('.breadcrumbs__separator');
	const content = await page.content();
	const $ = cheerio.load(content);
	const breadcrumbs = $('.breadcrumbs__separator');
	const category = breadcrumbs.last().prev();
	const mappedCat = MapCategories.mapCategories(category.text());
	if(!mappedCat) {
		console.log('Error with mapping category');
		return;
	}
	//get and add username
	const scrapedName = $('.my-gumtree-menu-button__text');
	let username = scrapedName[0].children[0].data;
	
	//add mapped category into message
	console.log(`🚀   Typing and sending   🚀`);
	const addCat = message.replace('$', mappedCat);
	let addUsername;
	if(!username) {
		console.log('Error with getting username');
		addUsername = addCat.replace('@', 'furniture');
	} else {
		//if username is my gumtree need to log back in
		if(username === 'My Gumtree') {
			await login(page, userRows[0].username, userRows[0].password);
			await page.goto(listing.url, { waitUntil: 'domcontentloaded' });
			const $ = cheerio.load(await page.content());
			const scrapedName = $('.my-gumtree-menu-button__text');
			username = scrapedName[0].children[0].data;
			text = await page.waitForSelector('#input-reply-widget-form-message');
		}
		addUsername = addCat.replace('@', username);
	}
	await text.click({ clickCount: 3 });
	await page.type('#input-reply-widget-form-message', addUsername);
	//await page.click('#contact-seller-button');
	console.log(`🚀       Sent message        🚀`);
};

const sleep = async (ms) => {
	console.log(`🚀     sleeping for ${ms} mins     🚀`);
	return new Promise((resolve) => {
		setTimeout(resolve, ms * 60000);
	});
};

const resetIndex = (index, length) => {
	if (index >= length) {
		index = 0;
	}
	return index;
};

const iterateWithOneUser = async(messages, userRows, page, listings, timeouts) => {
	let messagesIndex = 0;
	const messagesLength = messages.length;
	console.log('logging in with ' + userRows[0].username + ' and ' + userRows[0].password);

	//loop through listings
	for (let listingsInd = 0; listingsInd < listings.length; listingsInd++, messagesIndex++) {
		//reset index for messages to repeat them if we've reached the end
		
		messagesIndex = resetIndex(messagesIndex, messagesLength);
		await sendMessage(page, listings[listingsInd], messages[messagesIndex], userRows);
		listingsInd++;
		messagesIndex++;
		messagesIndex = resetIndex(messagesIndex, messagesLength);
		//wait two minutes
		if(listingsInd < listings.length) {
			await sleep(timeouts[0]);
			await sendMessage(page, listings[listingsInd], messages[messagesIndex], userRows);		
			await sleep(timeouts[1]);
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
		usersIndex = resetIndex(usersIndex, usersLength);
		messagesIndex = resetIndex(messagesIndex, messagesLength);

		await login(page, userRows[usersIndex].username, userRows[usersIndex].password);
		console.log('logging in with ' + userRows[usersIndex].username + ' and ' + userRows[usersIndex].password);
		await sendMessage(page, listings[listingsInd], messages[messagesIndex]);
		listingsInd++;
		messagesIndex++;
		messagesIndex = resetIndex(messagesIndex, messagesLength);
		//wait two minutes
		if(listingsInd < listings.length) {
			await sleep(timeouts[0]);
			await sendMessage(page, listings[listingsInd], messages[messagesIndex]);		
			await sleep(timeouts[1]);
		}
	}
}

const startMessaging = async (userRows, listings, messages, timeouts) => {
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
		await login(page, userRows[0].username, userRows[0].password);
		await iterateWithOneUser(messages, userRows, page, listings, timeouts);
	} else {
		await iterateWithUsers(messages, userRows, page, listings, timeouts);
	}

	console.log(`🚀       Finished sending to ${listings.length} listings        🚀`);
	await browser.close();
};

const recursiveAsyncReadLineTimeout = (userRows, listings, messages) => {
	rl.question('Enter sleep times in the format t1 t2 eg. \'1.4 3\':\n', (input) => {
		const times = input.split(' ');
		if(times.length === 2 && !isNaN(parseFloat(times[0])) && !isNaN(parseFloat(times[1]))) {
			console.log(`Entered t1 = ${times[0]} and t2 = ${times[1]}`);
			const timeouts = times.map(time => { return parseFloat(time)});
			recursiveAsyncReadLineBrowser(userRows, listings, messages, timeouts);
		} else {
			console.log('Incorrect format, try again');
			recursiveAsyncReadLineTimeout(userRows, listings, messages);
		}
	});
};

const recursiveAsyncReadLineBrowser = (userRows, listings, messages, timeouts) => {
	rl.question('Are you ready to start? (yes/no)\n', (browser) => {
		if (browser === 'yes') {
			startMessaging(userRows, listings, messages, timeouts);
			rl.close();
		} else if (browser === 'no') {
			console.log('Ctrl + C to quit / restart');
			recursiveAsyncReadLineBrowser(userRows, listings, messages, timeouts);
		} else {
			recursiveAsyncReadLineBrowser(userRows, listings, messages, timeouts);
		}
	});
};

module.exports = {
	recursiveAsyncReadLineData: (userRows, listings, messages) => {
		rl.question('Do you want to view the input data? (yes/no)\n', (view) => {
			if (view === 'yes') {
				console.log(`~ Users (${userRows.length})`);
				console.log(userRows);
				console.log(`~ Listings (${listings.length})`);
				console.log(listings);
				console.log(`~ Messages (${messages.length})`);
				console.table(messages);
				recursiveAsyncReadLineTimeout(userRows, listings, messages);
			} else if (view === 'no') {
				recursiveAsyncReadLineTimeout(userRows, listings, messages);
			} else {
				recursiveAsyncReadLineData(userRows, listings, messages);
			}
		});
	},

	readFiles: () => {
		const users = fs.readFileSync('./src/users.txt', 'utf8').split('\n');
		const listings = fs.readFileSync('./src/listings.txt', 'utf8').split('\n');
		const messages = fs.readFileSync('./src/messages.txt', 'utf8').split('~\n');

		const userRows = users.map((row) => {
			const userInfo = row.split(' ');
			return { username: userInfo[0], password: userInfo[1] };
		});

		const listingsRow = listings.map((listing) => {
			return { url: listing };
		});

		return [userRows, listingsRow, messages];
	},
};
