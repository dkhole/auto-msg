const MapCategories = require('./mapCategories');
const stealth = require('./stealth');
const cheerio = require('cheerio');

const startLogin = async(page, email, password) => {
    await page.goto('https://www.gumtree.com.au/t-login-form.html', { waitUntil: 'domcontentloaded' });
    console.log('🚀   Entering email   🚀');
    await page.waitForSelector('#login-email');
    await page.type('#login-email', email);

    console.log('🚀   Entering password   🚀');
    await page.type('#login-password', password);

    console.log('🚀   Logging in   🚀');

    //page somtimes freezes after logging in so catch statement and try again if it does
    //can potentially create infinite loop
    try {
        await Promise.all([page.click('#btn-submit-login'), page.waitForNavigation()]);
    } catch {
        await startLogin(page, email, password);
    }
    
    console.log(`🚀   Logged In to gumtree as ${email}   🚀`);
}

module.exports = {
	login: async (page, email, password) => {
        await startLogin(page, email, password);
    },

	sendMessage: async (page, listing, message, userRows = 0) => {
        console.log(`🚀   Navigating to listing   🚀`);
        //apply stealth settings
        await stealth.apply(page);
        await page.goto(listing.url, { waitUntil: 'domcontentloaded' });
        await page.setDefaultNavigationTimeout(300000);
        
        //get category
        console.log(`🚀   Getting and mapping category   🚀`);
        await page.waitForSelector('.breadcrumbs__separator');
        const content = await page.content();
        const $ = cheerio.load(content);
        const breadcrumbs = $('.breadcrumbs__separator');
        const category = breadcrumbs.last().prev();
        //map category
        const mappedCat = MapCategories.mapCategories(category.text());
        if(!mappedCat) {
            console.log('Cant find listing');
            return;
        }
        //get and add username
        const scrapedName = $('.my-gumtree-menu-button__text');
        let username = scrapedName[0].children[0].data;
        
        //add mapped category into message
        console.log(`🚀   Typing and sending   🚀`);
        const addCat = message.replace('$', mappedCat);
        let addUsername;

        let text = await page.waitForSelector('#input-reply-widget-form-message');

        if(!username) {
            console.log('Error with getting username');
            addUsername = addCat.replace('@', 'furniture');
        } else {
            //if username is my gumtree need to log back in
            if(username === 'My Gumtree') {
                await startLogin(page, userRows[0].username, userRows[0].password);
                await page.goto(listing.url, { waitUntil: 'domcontentloaded' });
                const $ = cheerio.load(await page.content());
                const scrapedName = $('.my-gumtree-menu-button__text');
                username = scrapedName[0].children[0].data;
                text = await page.waitForSelector('#input-reply-widget-form-message');
            }
            addUsername = addCat.replace('@', username);
        }
        
        try {
            await text.click({ clickCount: 3 });
            await page.type('#input-reply-widget-form-message', addUsername);
            //await page.click('#contact-seller-button');
            console.log(`🚀       Sent message        🚀`);
            return;
        } catch {
            console.log('cant find listing');
            return;
        }
    }
};