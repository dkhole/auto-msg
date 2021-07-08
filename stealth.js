const randomUserAgent = require('random-useragent');

module.exports = {
    apply: async(page) => {
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
        console.log(`Generating and using random user agent: ${userAgent}`);
        await page.setUserAgent(userAgent);
        await page.setJavaScriptEnabled(true);
        await page.setDefaultNavigationTimeout(0);
    
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
    },
}