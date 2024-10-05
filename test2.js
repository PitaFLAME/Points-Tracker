const { shipEventID, getKnownEvents, getKnownEmails } = require('./mongodb');
const { chromium } = require('playwright');
const login = require('./login');
const processEvent = require('./processEvent');
const findNewEvents = require('./findNewEvents');
    

(async () => {

    await getKnownEmails();

})();
