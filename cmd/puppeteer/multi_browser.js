const { connect } = require("puppeteer-real-browser");
// const pluginProxy = require('puppeteer-extra-plugin-proxy');
const {proxyRoating,setProxyOnPage} = require('../helper/proxy.js');


// async function initBrowserWithRealBrowser(proxy) {
//     console.log("initBrowserWithRealBrowser",proxy);
//     let hiddenChrome = process.env.open_chrome?.toLowerCase() === "false" ? false : true;
//     hiddenChrome=false
//     console.log(`hiddenChrome: ${hiddenChrome}`);
//     // Create configuration object without proxy initially
//     const connectOptions = {
//         headless: hiddenChrome,
//         // args: [],
//         // customConfig: {},
//         // turnstile: true,
//         // connectOption: {},
//         // disableXvfb: false,
//         // ignoreAllFlags: false,
//     };
    
//     // Only add proxy configuration if a valid proxy object is provided
//     if (proxy && proxy.proxy && proxy.port) {
//         connectOptions.proxy = {
//             host: proxy.proxy,
//             port: proxy.port,
//             username: proxy.username || '',  // Make username optional
//             password: proxy.password || '',  // Make password optional
//         };
//     }
//     // console.log(connectOptions);
//      // Connect using the prepared options
//      const { browser, page } = await connect(connectOptions);
    
//      return { browser, page };
// }

async function initBrowserWithRealBrowser(proxy) {
    console.log("initBrowserWithRealBrowser", proxy);
    let hiddenChrome = process.env.open_chrome?.toLowerCase() === "false" ? false : true;
    hiddenChrome = false;
    console.log(`hiddenChrome: ${hiddenChrome}`);

    // Create configuration object without proxy initially
    const connectOptions = {
        headless: hiddenChrome,
        args: [], // Khởi tạo mảng args
    };
    // Connect using the prepared options
    const { browser, page } = await connect(connectOptions);
    // await setProxyOnPage(page, proxy);
    await setProxyOnPage(page);

    return { browser, page };
}


module.exports = {
    initBrowserWithRealBrowser,
};