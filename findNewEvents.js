const { getKnownEvents } = require('./mongodb');

async function findNewEvents(page) {

    var links = []
    await page.goto('https://asu.campuslabs.com/engage/manage/organization/codedevils/events/events?orderByField=StartDateTime&orderByDirection=1')

    await page.waitForTimeout(8000);

    // read db
    const knownEvents = await getKnownEvents();

    let pageHasNext = true

    while (pageHasNext) {
        
        const elements = await page.$$('a.css-9kta58');
        console.log(`Mapped selectors to array.  Found ${elements.length} selectors.`);


        for (const element of elements) {
            const date = await element.$('p.MuiListItemText-secondary');
            //console.log(date, ' << dates');
            
            var valid = true

            // get event id and link to event page
            const href = await element.evaluate(a => a.getAttribute('href'));
            console.log('href: ', href);
            const eventIDMatch = href.match(/(\d+)$/);
            const eventID = eventIDMatch[0];
            //console.log('Event ID: ', eventID);
            
            // if we've already counted this event, disqualify it
            for (const event of knownEvents) { if (eventID == event) { valid = false; 
                console.log('isKnown Invalidation.')
            } }

            if (date) {  // disqualify event if it is in the future
                var trimmedDate = await date.innerText();
                // console.log("Inner Text: ", trimmedDate);
                trimmedDate = trimmedDate.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\w+ \d{1,2}, \d{4})/);
                // console.log('Trimmed date after regex: ', trimmedDate);
                const dateFinal = trimmedDate[2];
                console.log("Final Date: ", dateFinal);
                
                const eventDate = new Date(dateFinal);

                // add a day to the event so we count attendance after the event actually happens
                eventDate.setDate(eventDate.getDate() + 1);  

                const currentDate = new Date();


                // console.log(`Comparing ${eventDate} to ${currentDate}...`)

                if (eventDate > currentDate) { valid = false; 
                    console.log('Date Invalidation.');
                }

            }
            
            if (valid) { links.push(eventID); }

        }


        page.waitForTimeout(4000);

        // scrape next page.
        const foundNext = await page.$('text="Next "')
        // console.log('pageHasNext: ', foundNext);
        if (foundNext) { 
            console.log('Found new page.');
            await page.getByText("Next ").click();
            pageHasNext = true;
        }
        else { pageHasNext = false; }

        await page.waitForTimeout(10000);
        

    }


    console.log('Finished scraping events.  Returning to program...');
    await page.waitForTimeout(20000);
    
    return links

}

module.exports = findNewEvents;