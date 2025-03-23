const {acceptCookies} = require('../helper/click_cookies');
const {clickButtonContinue} = require('../helper/click_continue');
const { randomTime } = require('../../helper/func');

async function stepChooseModule(page, user) {
    try {
        await chooseModule(page, user);
    } catch (error) {
        console.error("Error in stepChooseModule:", error);
    }
}

async function chooseModule(page, user) {
    // await randomTime(4,5);
    console.log("Choose module");
    await acceptCookies(page)
    await clickButtonContinue(page);
    // await acceptCookies(page, context);
    // if (user.sum && user.sum == 4) {
    //     await clickButtonContinue(page);
    //     return;
    // }

    // let modules = [];

    // if (user.reading === '1') {
    //     modules.push('reading');
    // }
    // if (user.listening === '1') {
    //     modules.push('listening');
    // }
    // if (user.writing === '1') {
    //     modules.push('writing');
    // }
    // if (user.speaking === '1') {
    //     modules.push("speaking");
    // }

    // const moduleIds = {
    //     "reading": " reading ",
    //     "listening": " listening ",
    //     "writing": " writing ",
    //     "speaking": " speaking "
    // };
    // // Loop through each module and click if the module is not in the list
    // for (const [module, elementId] of Object.entries(moduleIds)) {
    //     if (!modules.includes(module)) {
    //         const isCheckboxPresent = await page.evaluate(
    //             (elementId) => document.getElementById(elementId) !== null,
    //             elementId
    //         );
    //         console.log(`Module ${module} isCheckboxPresent: ${isCheckboxPresent}`);
    //         if (isCheckboxPresent) {
    //             await page.evaluate(
    //                 (elementId) => document.getElementById(elementId).click(),
    //                 elementId
    //             );
    //             console.log(`Đã huỷ module ${module}`);
    //         }
    //     }
    // }
    // await clickButtonContinue(page);
}

module.exports = {
    stepChooseModule,
}