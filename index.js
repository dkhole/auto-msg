const puppeteer = require('puppeteer');
const helper = require('./helper');

const resetIndex = (index, length) => {
    if(index >= length ) {
        index = 0;
    }
    return index;
}

const launch = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const [page] = await browser.pages();
    
    //tricks gumtree
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false
        });
    });

    //get data from txt files
    const [userRows, listings, messages] = helper.readFiles();


    //await helper.login(page, 'notabot419@outlook.com', 'notabot419');    
    //await helper.sendMessage(page, 'https://www.gumtree.com.au/s-ad/randwick/beds/target-double-bed-with-firm-foam-mattress/1274373005', 'Please let me know as i can pick it up tomorrow');
    //await browser.close();


//loop through users, loop through messages, send to all listings, wait 3 minutes between listings.
    let usersIndex = 0;
    let messagesIndex = 0;
    const usersLength = userRows.length
    const messagesLength = messages.length

    for(listing of listings) {
        //login with user
        usersIndex = resetIndex(usersIndex, usersLength);
        messagesIndex = resetIndex(messagesIndex, messagesLength);

        await helper.login(page, userRows[usersIndex].username, userRows[usersIndex].password);    
        //console.log('logging in with ' + userRows[usersIndex].username + ' and ' + userRows[usersIndex].password);
        await helper.sendMessage(page, listing, messages[messagesIndex]);
        //console.log('sending message ' + messages[messagesIndex] + ' to listing ' + listing);
        //console.log(messagesIndex);
        usersIndex++;
        messagesIndex++;
    }
    //console.log(userRows);
    //console.log(listings);
    //console.log(count);
}

launch();