const fs = require('fs');

module.exports = {
    readFiles: () => {
        const users = fs.readFileSync('./users.txt', 'utf8').split('\n');
        const listings = fs.readFileSync('./listings.txt', 'utf8').split('\n');
        const messages = fs.readFileSync('./messages.txt', 'utf8').split('\n');
    
        const userRows = users.map((row) => {
            const userInfo = row.split(' ');
            return { username: userInfo[0], password: userInfo[1]};
        });

        return [userRows, listings, messages];
    },

    login: async(page, email, password) => {
        await page.goto('https://www.gumtree.com.au/t-login-form.html', {waitUntil: 'domcontentloaded'});
        //https://www.gumtree.com.au/t-login-form.html?sl=true
        console.log('🚀   Entering email   🚀');
        await page.waitForSelector('#login-email');
        await page.type('#login-email', email);
      
        console.log('🚀   Entering password   🚀');
        await page.type('#login-password', password);
      
        console.log('🚀   Logging in   🚀');
      
        await Promise.all([
            page.click('#btn-submit-login'),
            page.waitForNavigation(),
        ]);
        console.log(`🚀   Logged In to gumtree as ${email}   🚀`);
    },

    sendMessage: async(page, listing, message) => {
        console.log(`🚀   Navigating to listing   🚀`);
        await page.goto(listing, {waitUntil: 'domcontentloaded'});
        const text = await page.waitForSelector('#input-reply-widget-form-message');
        await text.click({ clickCount: 3 })
        await page.type('#input-reply-widget-form-message', message);
        /*await Promise.all([
            page.click('#contact-seller-button'),
            page.waitForNavigation(),
            page.click('.icon-close'),
            page.waitForNavigation(),
            page.click('#MY_GUMTREE_MENU_BUTTON'),
        ]);
        console.log(`🚀       Sent message        🚀`);*/
    }
}