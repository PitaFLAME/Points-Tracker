const { chromium } = require('playwright');
require('dotenv').config();

async function login(page) {

    await page.waitForSelector('#username')
    await page.fill('#username', process.env.ASU_USERNAME)
    await page.waitForSelector('#password')
    await page.fill('#password', process.env.ASU_PASSWORD)
    await page.click('.btn-submit')
    
    await page.waitForTimeout(15000);
    const mfaNeeded = await page.$('#trust-browser-button');

    if (mfaNeeded) {
        console.log('MFA spotted');
        await page.waitForSelector('#trust-browser-button')
        await page.click('#trust-browser-button')
    }

    console.log('MFA passed')
    await page.waitForTimeout(10000)

    return

}

module.exports = login;