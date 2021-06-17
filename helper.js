const fs = require('fs');
const puppeteer = require('puppeteer');
const readline = require('readline');
const cheerio = require('cheerio');
const MapCategories = require('./mapCategories');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

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

const sendMessage = async (page, listing, message) => {
	console.log(`🚀   Navigating to listing   🚀`);
	await page.goto(listing.url, { waitUntil: 'domcontentloaded' });
	await page.setDefaultNavigationTimeout(300000);
	const text = await page.waitForSelector('#input-reply-widget-form-message');
	await text.click({ clickCount: 3 });

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
	//add mapped category into message
	console.log(`🚀   Typing and sending   🚀`);
	const send = message.replace('$', mappedCat);
	await page.type('#input-reply-widget-form-message', send);
	await Promise.all([page.click('#contact-seller-button'), page.waitForNavigation()]);
	console.log(`🚀       Sent message        🚀`);
};

const sleep = async (ms) => {
	console.log(`🚀     sleeping for ${ms} ms     🚀`);
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
};

const resetIndex = (index, length) => {
	if (index >= length) {
		index = 0;
	}
	return index;
};

const recursiveAsyncReadLineBrowser = (userRows, listings, messages) => {
	rl.question('Are you ready to start? (yes/no)', (browser) => {
		if (browser === 'yes') {
			startMessaging(userRows, listings, messages);
			rl.close();
		} else if (browser === 'no') {
			console.log('Ctrl + C to quit / restart');
			recursiveAsyncReadLineBrowser(userRows, listings, messages);
		} else {
			recursiveAsyncReadLineBrowser(userRows, listings, messages);
		}
	});
};

const startMessaging = async (userRows, listings, messages) => {
	//launch puppeteer
	const browser = await puppeteer.launch({ headless: false });
	const [page] = await browser.pages();

	//gets past gumtrees antiscrape
	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'webdriver', {
			get: () => false,
		});
	});

	//loop through users, loop through messages, send to all listings, wait 3 minutes between listings.

	let usersIndex = 0;
	let messagesIndex = 0;
	const usersLength = userRows.length;
	const messagesLength = messages.length;
	//loop through listings
	for (let listingsInd = 0; listingsInd < listings.length; listingsInd++) {
		//reset index for users/messages to repeat them if we've reached the end
		usersIndex = resetIndex(usersIndex, usersLength);
		messagesIndex = resetIndex(messagesIndex, messagesLength);

		await login(page, userRows[usersIndex].username, userRows[usersIndex].password);
		console.log('logging in with ' + userRows[usersIndex].username + ' and ' + userRows[usersIndex].password);
		await sendMessage(page, listings[listingsInd], messages[messagesIndex]);
		messagesIndex++;
		listingsInd++;
		//wait two minutes
		await sleep(20000);
		await sendMessage(page, listings[listingsInd], messages[messagesIndex]);
		messagesIndex++;
		usersIndex++;
	}
	await browser.close();
};

module.exports = {
	recursiveAsyncReadLineData: (userRows, listings, messages) => {
		rl.question('Do you want to view the input data? (yes/no)', (view) => {
			if (view === 'yes') {
				console.log(`~ Users (${userRows.length})`);
				console.log(userRows);
				console.log(`~ Listings (${listings.length})`);
				console.log(listings);
				console.log(`~ Messages (${messages.length})`);
				console.table(messages);
				recursiveAsyncReadLineBrowser(userRows, listings, messages);
			} else if (view === 'no') {
				recursiveAsyncReadLineBrowser(userRows, listings, messages);
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
