const Apify = require('apify');
const _ = require('lodash');
const {
    infiniteScroll,
    requestCounter,
    minMaxDates,
    createAddEvent,
    createAddProfile,
    createAddSearch,
    createAddThread,
    createAddTopic,
    extendFunction,
    categorizeUrl,
    tweetToUrl,
    deferred,
    getEntities,
    proxyConfiguration,
    blockPatterns,
    filterCookies,
    getTimelineInstructions,
} = require('./helpers');
const { LABELS, USER_OMIT_FIELDS } = require('./constants');

const { log } = Apify.utils;

Apify.main(async () => {
    /** @type {any} */
    const input = await Apify.getValue('INPUT');

    const proxyConfig = await proxyConfiguration({
        proxyConfig: input.proxyConfig,
    });

    const {
        tweetsDesired = 100,
        mode = 'replies',
        addUserInfo = true,
        maxRequestRetries = 3,
        maxIdleTimeoutSecs = 30,
        debugLog = false,
    } = input;

    if (debugLog) {
        log.setLevel(log.LEVELS.DEBUG);
    }

    log.info(`Limiting tweet counts to ${tweetsDesired}...`);

    const requestQueue = await Apify.openRequestQueue();
    const requestCounts = await requestCounter(tweetsDesired);
    const pushedItems = new Set(await Apify.getValue('PUSHED'));

    Apify.events.on('migrating', async () => {
        await Apify.setValue('PUSHED', [...pushedItems.values()]);
    });

    const addProfile = createAddProfile(requestQueue);
    const addSearch = createAddSearch(requestQueue);
    const addEvent = createAddEvent(requestQueue);
    const addThread = createAddThread(requestQueue);
    const addTopic = createAddTopic(requestQueue);

    const dates = minMaxDates({
        min: input.toDate,
        max: input.fromDate,
    });

    if (dates.maxDate) {
        log.info(`\n\nGetting tweets older than ${dates.maxDate.toLocaleString()}\n`);
    }

    if (dates.minDate) {
        log.info(`\n\nGetting tweets newer than ${dates.minDate.toLocaleString()}\n`);
    }

    const extendOutputFunction = await extendFunction(input.extendOutputFunction);

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            await handleRequestFunction();
            break;  // Exit loop if successful
        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error}`);
            if (i === maxRetries - 1) throw error;
        }
    }

    page.on('framenavigated', async () => {
        console.log('Page navigated, handling...');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('div.some-class');  // Adjust this to the correct selector

        // Your scraping logic

    } catch (error) {
        console.error(`Error occurred: ${error.message}`, error);
        throw error;  // Re-throw after logging
    }
});
