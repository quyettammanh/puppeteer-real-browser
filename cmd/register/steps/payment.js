const { userInputLoop } = require('../../helper/func');
const {clickButtonContinue} = require('../helper/click_continue');

async function stepPayment(page) {
    try {
        console.log("Payment");
        // await userInputLoop();
        await clickButtonContinue(page);
    } catch (error) {
        if (!error.message.includes('Target page, context or browser has been closed')) {
            console.error("Error in stepPayment:", error);
        }
    }
}

module.exports = {
    stepPayment,
}