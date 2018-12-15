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
        headless: false,
        ignoreHTTPSErrors: true,
        timeout: 1000
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType === 'Script') {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(program.url /*, { waitUntil: 'networkidle0', timout: 6000}*/);

    await autoScroll(page);

    await page.screenshot({ path: program.output, fullPage: true });
    /*await page.screenshot({path: program.output,
        clip: {x: 0, y:0, width: 1024, height: 800}
    });*/
    // await page.screenshot({path: 'screenshot-full.png', fullPage: true});

    // browser.close();

})();



async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
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
    });
}
