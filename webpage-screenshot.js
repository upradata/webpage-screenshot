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
    .option('-W, --wait <ms>', 'extra time to wait after scrolling to let image load');

program.parse(process.argv);

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


async function getBody(browser) {
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

    return page.$eval('body', element => {
        return element.innerHTML
    });
}

async function capture2(browser) {
    const bodyHtml = await getBody(browser)

    const page = await browser.newPage();
    await page.setContent(htmlForScreenshot(bodyHtml));
    // const elementHandle = await page.$(selector);

    const bodyHandle = await page.$('body');
    const { height } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    window.scrollTo(0, height);

    return await page.screenshot({ path: program.output, fullPage: true, type: 'png' });
}


function htmlForScreenshot(body) {
    return `
        <html>
        <head>
            <style>${process.env.globalCss}</style>
            <style>
                *,
                *::after,
                *::before {
                    /* transition-delay: 0s !important;
                    transition-duration: 0s !important;
                    animation-delay: -0.0001s !important;
                    animation-duration: 0s !important;
                    animation-play-state: paused !important;
                    caret-color: transparent !important; */
                    transition: none !important;
                }
                * {
                    padding: 0;
                    margin: 0;
                }
                body, html {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
                        "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
            </style>
        </head>
        <body>
            ${body}
        </body>
        </html>
    `;
}



async function capture(browser) {

    // Load the specified page
    const page = await browser.newPage();

    /* page.on('console', msg => {
        for (let i = 0; i < msg.args.length; ++i)
            console.log(`${i}: ${msg.args[i]}`);
    });
 */

    page.on('console', consoleObj => console.log(consoleObj.text()));


    /* await page.evaluate(() => {
        window.setInterval = (handler, timeout) => { console.log(2); handler() };
        window.setTimeout = (handler, timeout) => { console.log(3); handler() };
        window.requestAnimationFrame = (handler) => { console.log(4); handler() };
    }); */

    await page.goto(program.url, { waitUntil: 'load' });

    /* await page.evaluate(() => {
        window.setInterval = (handler, timeout) => { console.log(2, timeout); handler() };
        window.setTimeout = (handler, timeout) => { console.log(3, timeout); handler() };
        window.requestAnimationFrame = (handler) => { console.log(4, timeout); handler() };
    }); */
    // await page._client.send('Animation.setPlaybackRate', { playbackRate: 100.0 });

    const width = 1920;
    const height = 1080;
    page.setViewport({ width, height, deviceScaleFactor: 2 }); // for high dpi

    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType === 'Script') {
            request.abort();
        } else {
            request.continue();
        }
    });


    /* await page.$eval('head', element => {
        const style = document.createElement('style');
        style.innerHTML = `
                *,
                *::after,
                *::before {
                    transition-delay: 0s !important;
                    transition-duration: 0s !important;
                    animation-delay: -0.0001s !important;
                    animation-duration: 0s !important;
                }`;
        element.appendChild(style);
    }); */

    // Get the height of the rendered page
    const bodyHandle = await page.$('body');
    const { height: totalHeight, width: totalWidth } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    /*  await page.evaluate(height => {
         // window.scrollTo(0, height);
         window.setInterval = (handler, timeout) => handler();
         window.setTimeout = (handler, timeout) => handler();
     }, height); */

    // await wait(program.wait || 500);

    // Scroll one viewport at a time, pausing to let content load
    await page.evaluate(totalHeight => {
        window.scrollTo(0, totalHeight);
    }, totalHeight);

    /* const viewportHeight = page.viewport().height;

    let viewportIncr = 0;
    // + viewportHeight  
    while (viewportIncr  < totalHeight) {
        await page.evaluate((_viewportHeight, viewportIncr, totalHeight) => {
            window.scrollBy(0, _viewportHeight);
            // console.log(_viewportHeight);
            // window.addEventListener('scrollInRaf', () => console.log(viewportIncr, totalHeight, 'caca'))
            console.log(viewportIncr, totalHeight, 'caca')
            // window.dispatchEvent(new Event('scroll'));

        }, viewportHeight, viewportIncr, totalHeight);
        // await wait(20);
        await wait(20);

        viewportIncr += viewportHeight;
    } */

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
    await wait(program.wait || 500);
    // return await page.screenshot({ path: program.output, type: 'png' });
    return await page.screenshot({
        path: program.output, clip: {
            x: 0,
            y: 0,
            width: totalWidth,
            height: totalHeight
        },/* fullPage: true,  */type: 'png'
    });
}
