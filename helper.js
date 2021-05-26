const fs = require('fs');

module.exports = {
	readFiles: () => {
		const users = fs.readFileSync('./src/users.txt', 'utf8').split('\n');
		const listings = fs.readFileSync('./src/listings.txt', 'utf8').split('\n');
		const messages = fs.readFileSync('./src/messages.txt', 'utf8').split('~\n');

		const userRows = users.map((row) => {
			const userInfo = row.split(' ');
			return { username: userInfo[0], password: userInfo[1] };
		});

		const listingsRow = listings.map((listing) => {
			const listingInfo = listing.split(' ');
			return { url: listingInfo[1], category: listingInfo[0] };
		});

		return [userRows, listingsRow, messages];
	},

	login: async (page, email, password) => {
		await page.goto('https://www.gumtree.com.au/t-login-form.html', { waitUntil: 'domcontentloaded' });
		console.log('🚀   Entering email   🚀');
		await page.waitForSelector('#login-email');
		await page.type('#login-email', email);

		console.log('🚀   Entering password   🚀');
		await page.type('#login-password', password);

		console.log('🚀   Logging in   🚀');

		await Promise.all([page.click('#btn-submit-login'), page.waitForNavigation()]);
		console.log(`🚀   Logged In to gumtree as ${email}   🚀`);
	},

	sendMessage: async (page, listing, message) => {
		console.log(`🚀   Navigating to listing   🚀`);
		await page.goto(listing.url, { waitUntil: 'domcontentloaded' });
		await page.setDefaultNavigationTimeout(300000);
		const text = await page.waitForSelector('#input-reply-widget-form-message');
		await text.click({ clickCount: 3 });
		const send = message.replace('$', listing.category);
		await page.type('#input-reply-widget-form-message', send);
		//await Promise.all([page.click('#contact-seller-button'), page.waitForNavigation()]);
		//console.log(`🚀       Sent message        🚀`);
	},

	sleep: async (ms) => {
		console.log(`🚀     sleeping for ${ms} ms     🚀`);
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	},

	resetIndex: (index, length) => {
		if (index >= length) {
			index = 0;
		}
		return index;
	},
};
