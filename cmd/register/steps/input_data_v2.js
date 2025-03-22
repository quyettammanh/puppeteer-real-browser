// const { clickButtonContinue, accpectCookiesV2 } = require('../helper/func.js');
// const { randomTime, userInputLoop } = require('../../utils/func.js');
// const { checkWarning } = require('../helper/func_err.js')

const {clickButtonContinue}=require('../helper/click_continue')

// Helper function for waiting since page.waitForTimeout is not available
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function stepInputData(page, user, exam) {
    try {
        console.log("Xử lý bước nhập thông tin cá nhân");
        if (page.url().includes('oska-acc')) {
            console.log("acc thiếu thông tin")
            await inputData(page, user, exam);
        }
    } catch (error) {
        console.error("Error in stepInputData:", error);
    }
}

async function inputData(page, user, exam) {
    // const labels = await page.$$eval('.cs-input--error .cs-input__label', (elements) => {
    //     return elements.map(element => element.textContent.trim());
    // });

    // console.log(labels);

    // await checkWarning(page, user);
    // Add data name of new user
    if (page.url().includes('oska-acc')) {
        try {
            await inputDataName(page, user);
            // await page.pause();
        } catch (error) {
            console.log(user.email, "Không điền được thông tin name\n");
        }
    }

    if (page.url().includes('oska-acc')) {
        // Add data address of user -> Check if address data exists, if not, click next
        try {
            // Check if postal code field exists
            const postalCodeElem = await page.$("//div[text()='Mã bưu chính']");
            if (postalCodeElem) {
                page = await inputDataAddress(page, user, exam);
            } else {
                await clickButtonContinue(page);
                page = await inputDataAddress(page, user, exam);
            }
        } catch (error) {
            console.log(user.email, "Không nhập được thông tin địa chỉ\n");
        }
    }
}

// Hàm tiện ích để nhập dữ liệu vào trường và xử lý lỗi chung
async function fillInputFieldAdress(page, selector, value, fieldName, email) {
    try {
        if (page.url().includes('oska-acc')) {
            // Find the input element
            const inputElement = await page.$(selector);
            if (inputElement) {
                // Click on the element
                await inputElement.click();
                // Wait for any network activity to settle
                await wait(500);
                
                // Clear existing text
                await page.evaluate((el) => { el.value = ''; }, inputElement);
                
                // Type the value
                await inputElement.type(String(value));
                // Wait for network activity again
                await wait(500);
                
                console.log(`${email} - Đã điền ${fieldName}`);
            } else {
                console.log(`${email} - Không tìm thấy trường ${fieldName}`);
            }
        }
    } catch (error) {
        console.log(`${email} - Không điền được ${fieldName}: ${error.message}`);
    }
}

async function inputDataAddress(page, user, exam) {
    // Nhập postal code
    if (page.url().includes('oska-acc')) {
        await fillInputFieldAdress(page, 'input[autocomplete="postal-code"]', user.postal_code, 'postal_code', user.email);
    }
    
    // Nhập location
    if (page.url().includes('oska-acc')) {
        await fillInputFieldAdress(page, 'input[autocomplete="locality"]', user.location, 'location', user.email);
    }
    
    // Nhập street name
    if (page.url().includes('oska-acc')) {
        await fillInputFieldAdress(page, 'input[autocomplete="street-address"]', user.street_name, 'street_name', user.email);
    }
    
    // Nhập phone number
    if (page.url().includes('oska-acc')) {
        await fillInputFieldAdress(page, 'input[name="accountPanel:furtherData:body:mobilePhone:input2Container:input2"]', user.number_phone, 'số điện thoại', user.email);
    }
    
    // Nhập birthplace (có kiểm tra hiển thị)
    if (page.url().includes('oska-acc')) {
        try {
            // Check if birthplace input exists and is visible
            const birthplaceInput = await page.$('input[data-field-name="birth-place"]');
            if (birthplaceInput) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style && style.display !== 'none' && style.visibility !== 'hidden';
                }, birthplaceInput);

                if (isVisible) {
                    await page.evaluate((el) => { el.value = ''; }, birthplaceInput);
                    await birthplaceInput.type(user.place_of_birth);
                    console.log(user.email, "Đã điền place of birth");
                } else {
                    console.log(user.email, "Không tìm thấy ô nhập nơi sinh - bỏ qua");
                }
            }
        } catch (error) {
            console.log(user.email, "Lỗi khi điền nơi sinh:", error.message);
        }
    }

    if (exam.toLowerCase().includes('a1')) {
        try {
            await clickButtonContinue(page);
            if (page.url().includes('oska-acc')) {
                // Tìm và click vào nút dropdown
                const dropdownBtn = await page.$("button[title*='thực hiện kì thi']");
                if (dropdownBtn) {
                    await dropdownBtn.click();
                    await wait(3000);
                    
                    // Tìm và chọn tùy chọn "Đoàn tụ gia đình" từ dropdown
                    const optionSelector = "a span:not([class]):not([id]):not([role]):not([name]):not([title]):not([type]):not([value]):not([placeholder]):not([for]):not([href]):not([src]):not([alt]):not([aria-label]):not([aria-labelledby]):not([aria-describedby]):not([aria-details]):not([aria-controls]):not([aria-owns]):not([aria-flowto]):not([aria-activedescendant]):not([data-*])";
                    const options = await page.$$(optionSelector);
                    
                    for (const option of options) {
                        const text = await page.evaluate(el => el.textContent.trim(), option);
                        if (text === 'Đoàn tụ gia đình') {
                            await option.click();
                            console.log(`${user.email} - Đã chọn động lực: Đoàn tụ gia đình`);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`${user.email} - Lỗi khi chọn động lực với a1: ${error.message}`);
        }
    }
    await clickButtonContinue(page);

    return page;
}


async function fillInputFieldName(page, selector, value, fieldName, email, options = {}) {
    try {
        if (page.url().includes('oska-acc')) {
            const inputElement = await page.$(selector);
            if (inputElement) {
                await inputElement.click();
                
                // Clear existing text
                await page.evaluate((el) => { el.value = ''; }, inputElement);
                
                // Type the value
                await inputElement.type(String(value));
                
                // Press Enter if needed
                if (options.pressEnter) {
                    await page.keyboard.press('Enter');
                }
                
                console.log(`${email} - Đã điền ${fieldName}`);
            } else {
                console.log(`${email} - Không tìm thấy trường ${fieldName}`);
            }
        }
    } catch (error) {
        console.log(`${email} - Không điền được ${fieldName}: ${error.message}`);
    }
}

// Hàm tiện ích để chọn ngày/tháng/năm trong datepicker
async function clickDatePicker(page, title, user_date_part, fieldName, email) {
    try {
        if (page.url().includes('oska-acc')) {
            console.log(`${email} - Điền ${fieldName} bắt đầu`);
            
            // Remove leading zeros from date/month (e.g., "01" -> "1")
            let formatted_date_part = user_date_part;
            if (title === 'Ngày' || title === 'Tháng') {
                // Check if the value starts with '0' and is between '01' and '09'
                if (/^0[1-9]$/.test(user_date_part)) {
                    formatted_date_part = user_date_part.replace(/^0/, '');
                    console.log(`${email} - Đã chuyển đổi ${user_date_part} thành ${formatted_date_part}`);
                }
            }
            
            // Click on date picker button
            const dateButton = await page.$(`button[type="button"][title="${title}"]`);
            if (dateButton) {
                await dateButton.click();
                await wait(3000);
                
                // Find and click the date option
                // We need to find all links and check their text content
                const linkElements = await page.$$('a');
                for (const link of linkElements) {
                    const linkText = await page.evaluate(el => el.textContent.trim(), link);
                    
                    // Check if this is the date we want
                    if (linkText === formatted_date_part || 
                        (title === 'Tháng' && linkText === `tháng ${formatted_date_part}`)) {
                        await link.click();
                        await wait(3000); // Wait for UI to update
                        console.log(`${email} - Điền ${fieldName} hoàn tất`);
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.log(`${email} - Không điền được ${fieldName}: ${error.message}`);
    }
}


async function inputDataName(page, user) {
    // Add Last Name (First Name in the context of the provided code)
    if (page.url().includes('oska-acc')) {
        await fillInputFieldName(
            page,
            'input[name="accountPanel:basicData:body:firstName:inputContainer:input"]',
            user.last_name,
            'tên',
            user.email,
            { pressEnter: true }
        );
    }

    // Add Family Name (Last Name/Family Name in the context of the provided code)
    if (page.url().includes('oska-acc')) {
        await fillInputFieldName(
            page,
            'input[name="accountPanel:basicData:body:lastName:inputContainer:input"]',
            user.family_name,
            'họ',
            user.email,
            { pressEnter: true }
        );
    }

    // Add Date of Birth
    if (page.url().includes('oska-acc')) {
        await clickDatePicker(page, 'Ngày', user.date_birth, 'ngày sinh', user.email);
    }

    // Add Month of Birth
    if (page.url().includes('oska-acc')) {
        await clickDatePicker(page, 'Tháng', user.month_birth, 'tháng sinh', user.email);
    }

    // Add Year of Birth
    if (page.url().includes('oska-acc')) {
        await clickDatePicker(page, 'Năm', user.year_birth, 'năm sinh', user.email);
    }
    await clickButtonContinue(page);
    return page;
}

module.exports = {
    stepInputData,
}