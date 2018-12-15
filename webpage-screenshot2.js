#!/usr/bin/env node

'use strict';

/*process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});*/


const program = require('commander');


program
    .version('0.1.0')
    .option('-U, --url <uri>', 'url of the webpage to screenshot')
    .option('-O, --output <path>', 'ouput filename for the screenshot without extension')


program.parse(process.argv);

// console.log(program.url, program.output);


if (program.url === undefined) {
    console.warn('The url page has to be specified as unique argument');
    process.exit();
}

program.output = program.output + '.png' || 'screenshot.png';


const puppeteer = require('puppeteer');

(async () => {

    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        timeout: 1000
    });
    // const page = await browser.newPage();



    // await page.goto(program.url /*, { waitUntil: 'networkidle0', timout: 6000}*/);


    // await page.screenshot({ path: program.output, fullPage: true });
    await capture(browser);

    /*await page.screenshot({path: program.output,
        clip: {x: 0, y:0, width: 1024, height: 800}
    });*/
    // await page.screenshot({path: 'screenshot-full.png', fullPage: true});

    browser.close();

})();





function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function capture(browser) {
    // Load the specified page
    const page = await browser.newPage();
    await page.goto(program.url, { waitUntil: 'load' });

    page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 }); // for high dpi

    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType === 'Script') {
            request.abort();
        } else {
            request.continue();
        }
    });

    // Get the height of the rendered page
    const bodyHandle = await page.$('body');
    const { height } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    // Scroll one viewport at a time, pausing to let content load
    const viewportHeight = page.viewport().height;

    let viewportIncr = 0;
    while (viewportIncr + viewportHeight < height) {
        await page.evaluate(_viewportHeight => {
            window.scrollBy(0, _viewportHeight);
            console.log(_viewportHeight);
        }, viewportHeight);
        await wait(20);
        viewportIncr = viewportIncr + viewportHeight;
    }

    /* await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            console.log('caca', height, viewportHeight);

            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }); */

    // Scroll back to top
    await page.evaluate(_ => {
        window.scrollTo(0, 0);
    });

    // Some extra delay to let images load
    await wait(500);

    return await page.screenshot({ path: program.output, fullPage: true, type: 'png' });
    // return await page.screenshot({ type: 'png' });
}
