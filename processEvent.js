const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const { shipEvent, addAttendance } = require('./mongodb')


async function processEvent(page, eventID) {

    const downloadPath = path.join(__dirname, 'dataDownloads');

    page.on('download', async (download) => {
        const suggestedFilename = download.suggestedFilename();
        console.log('Downloading Event: ', eventID);
    
        await download.saveAs(path.join(downloadPath, 'attendees.csv'));
    });

    // export to downloads page
    const attendanceLink = 'https://asu.campuslabs.com/engage/actioncenter/organization/codedevils/events/events/exporteventattendance?eventId=' + eventID;
    console.log(attendanceLink);
    await page.goto(attendanceLink, { waitUntil: 'networkidle' });

    // go to downloads page
    await page.goto('https://asu.campuslabs.com/engage/actioncenter/downloads');


    // trigger download
    const items = await page.$$('.gridrow');
    //console.log(items[0]);
    const downloadButton = await items[0].$('.icon-download');
    // console.log(downloadButton);
    if (downloadButton) { await downloadButton.click(); }
    else { console.log('failed to download'); }
    await page.waitForTimeout(10000);


    // remove all other downloads
    let hasDownloads = true;
    
    while (hasDownloads) {
        const items = await page.$$('.gridrow');
        if (items.length > 1 ) { hasDownloads = true; }
        else { hasDownloads = false; }

        const deleteButton = await items[0].$('.icon-delete');
        // console.log(deleteButton);
        if (deleteButton) { await deleteButton.click(); }
        else { console.log('failed to delete'); }

        await page.waitForTimeout(2000);

        // confirm
        const confirmDelete = await page.$('span.ui-button-text:has-text("Delete")');
        if (confirmDelete) { await confirmDelete.click(); }
        await page.waitForTimeout(5000);

    }

    
    
    // file is downloaded.  Time to read it.
    const fileData = [];
    let eventName;

    
    fs.createReadStream('dataDownloads/attendees.csv')
        .pipe(csv({ skipLines: 2}))
        .on('data', (data) => { if (!eventName) { eventName = Object.keys(data)[0]; }})
        .on('end', () => {
            console.log("Event Name: ", eventName);
        });


    fs.createReadStream('dataDownloads/attendees.csv')
        .pipe(csv({ skipLines: 5}))
        .on('data', (data) => fileData.push(data))
        .on('end', () => {
            console.log('Data read successfully.');
            console.log(fileData);
            console.log(fileData.length, " number of attendees.")
        });

    await page.waitForTimeout(5000);


    // transfer everything to db.
    //
    // send event to db.
    await shipEvent(eventID, eventName, fileData.length);

    // send first/last name and email to db.
    for (const attendee of fileData) {
        addAttendance(eventID, 
                    attendee['First Name'].trim(), 
                    attendee['Last Name'].trim(), 
                    attendee['Campus Email'].trim(),
                );
        await page.waitForTimeout(2000);
    }



    return

}

module.exports = processEvent;