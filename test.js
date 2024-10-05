const { shipEventID, getKnownEvents } = require('./mongodb');
const { chromium } = require('playwright');
const login = require('./login');
const processEvent = require('./processEvent');
const findNewEvents = require('./findNewEvents');
    

(async () => {

    const browser = await chromium.launch({headless: false,
                                           //logger: {
                                            //isEnabled: (name, severity) => true,
                                            //log: (name, severity, message) => console.log(`${name} [${severity}]: ${message}`),
                                           //}
    })
    const context = await browser.newContext();
    const page    = await context.newPage();

    await page.goto('https://asu.campuslabs.com/engage/account/login?returnUrl=/engage')
    await page.waitForTimeout(5000);
    var loggedIn = await page.$('.engage-application');

    while (!loggedIn) {
        await page.goto('https://asu.campuslabs.com/engage/account/login?returnUrl=/engage')
        await login(page);
        loggedIn = await page.$('.engage-application');
    }

    console.log('Login Successful.  Proceed.')
    await page.waitForTimeout(3000);

    await processEvent(page, '10453338');
})();
