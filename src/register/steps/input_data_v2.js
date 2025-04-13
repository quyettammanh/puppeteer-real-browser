const {clickButtonContinue}=require('../helper/click_continue')
const {waitForLoadingComplete} = require('../helper/wait_for_loading')

// Helper function for waiting since page.waitForTimeout is not available
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simpler function to wait for a short period and network stability
// This works with older versions of Puppeteer that don't support event listeners
async function waitForNetworkIdle(page, timeout = 1000) {
    try {
        // For older Puppeteer versions, we'll use a simpler approach
        // Just wait a reasonable amount of time for network to settle
        await wait(timeout);
        
        // Try to wait for the page to become idle using a known trick
        try {
            // This will wait until network is somewhat idle
            await page.evaluate(() => {
                return new Promise(resolve => {
                    // If page is already loaded, resolve immediately
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        // Otherwise wait for load event
                        window.addEventListener('load', resolve);
                    }
                });
            });
        } catch (e) {
            // Ignore errors, just use the timeout approach
        }
    } catch (error) {
        console.log("Error waiting for network idle:", error);
    }
}

async function stepInputData(page, user, exam) {
    try {
        // Đợi cho trang loading biến mất
        await waitForLoadingComplete(page);
        console.log("Đang xử lý input data cho", user.email);
        if (page.url().includes('oska-acc')) {
            console.log("acc thiếu thông tin")
            await inputData(page, user, exam);
        }
        return page;
    } catch (error) {
        console.error(`Error in stepInputData for ${user.email}:`, error);
        throw error;
    }
}

async function inputData(page, user, exam) {
    if (page.url().includes('oska-acc')) {
        try {
            // First check if name fields exist on the page
            const firstNameField = await page.$('input[name="accountPanel:basicData:body:firstName:inputContainer:input"]');
            const lastNameField = await page.$('input[name="accountPanel:basicData:body:lastName:inputContainer:input"]');
            const datePickerButton = await page.$('button[type="button"][title="Ngày"]');
            
            if (firstNameField || lastNameField || datePickerButton) {
                console.log(`${user.email} - Trang có trường nhập thông tin tên, tiến hành điền`);
                await inputDataName(page, user);
            } else {
                console.log(`${user.email} - Không có trường nhập thông tin tên, bỏ qua`);
            }
        } catch (error) {
            console.log(user.email, "Không điền được thông tin name\n");
        }
    }

    if (page.url().includes('oska-acc')) {
        try {
            // Check if any address fields exist on the page
            const postalCodeField = await page.$('input[autocomplete="postal-code"]');
            const cityField = await page.$('input[autocomplete="locality"]');
            const streetField = await page.$('input[autocomplete="street-address"]');
            const phoneField = await page.$('input[name="accountPanel:furtherData:body:mobilePhone:input2Container:input2"]');
            
            if (postalCodeField || cityField || streetField || phoneField) {
                console.log(`${user.email} - Trang có trường nhập thông tin địa chỉ, tiến hành điền`);
                page = await inputDataAddress(page, user, exam);
            } else {
                // Check if postal code element exists using XPath
                const postalCodeElem = await page.$x("//div[text()='Mã bưu chính']");
                if (postalCodeElem && postalCodeElem.length > 0) {
                    console.log(`${user.email} - Tìm thấy trường mã bưu chính, tiến hành điền`);
                    page = await inputDataAddress(page, user, exam);
                } else {
                    console.log(`${user.email} - Không có trường nhập thông tin địa chỉ, bỏ qua`);
                    await clickButtonContinue(page);
                }
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
                // Check if element is visible in the DOM
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, inputElement);
                
                if (!isVisible) {
                    console.log(`${email} - Trường ${fieldName} không hiển thị, bỏ qua`);
                    return;
                }
                
                // Click on the element
                await inputElement.click();
                // Wait for any network activity to settle
                await wait(500);
                
                // Clear existing text
                await page.evaluate((el) => { el.value = ''; }, inputElement);
                
                // Type the value
                await inputElement.type(String(value));
                // Wait for network activity to settle
                await waitForNetworkIdle(page);
                
                console.log(`${email} - Đã điền ${fieldName}`);
            } else {
                console.log(`${email} - Không tìm thấy trường ${fieldName}, bỏ qua`);
            }
        }
    } catch (error) {
        console.log(`${email} - Không điền được ${fieldName}: ${error.message}`);
    }
}

async function inputDataAddress(page, user, exam) {
    // Đợi cho trang loading biến mất trước khi bắt đầu nhập dữ liệu
    await waitForLoadingComplete(page, {
        logEnabled: false
    });
    
    // Nhập postal code
    if (page.url().includes('oska-acc')) {
        const postalField = await page.$('input[autocomplete="postal-code"]');
        if (postalField) {
            await fillInputFieldAdress(page, 'input[autocomplete="postal-code"]', user.postal_code, 'postal_code', user.email);
        } else {
            console.log(`${user.email} - Không tìm thấy trường postal code, bỏ qua`);
        }
    }
    
    // Nhập location
    if (page.url().includes('oska-acc')) {
        const locationField = await page.$('input[autocomplete="locality"]');
        if (locationField) {
            await fillInputFieldAdress(page, 'input[autocomplete="locality"]', user.location, 'location', user.email);
        } else {
            console.log(`${user.email} - Không tìm thấy trường location, bỏ qua`);
        }
    }
    
    // Nhập street name
    if (page.url().includes('oska-acc')) {
        const streetField = await page.$('input[autocomplete="street-address"]');
        if (streetField) {
            await fillInputFieldAdress(page, 'input[autocomplete="street-address"]', user.street_name, 'street_name', user.email);
        } else {
            console.log(`${user.email} - Không tìm thấy trường street name, bỏ qua`);
        }
    }
    
    // Nhập phone number
    if (page.url().includes('oska-acc')) {
        const phoneField = await page.$('input[name="accountPanel:furtherData:body:mobilePhone:input2Container:input2"]');
        if (phoneField) {
            await fillInputFieldAdress(page, 'input[name="accountPanel:furtherData:body:mobilePhone:input2Container:input2"]', user.number_phone, 'số điện thoại', user.email);
        } else {
            console.log(`${user.email} - Không tìm thấy trường số điện thoại, bỏ qua`);
        }
    }
    
    // Nhập birthplace (có kiểm tra hiển thị)
    if (page.url().includes('oska-acc')) {
        try {
            // Check if birthplace input exists and is visible
            const birthplaceInput = await page.$('input[data-field-name="birth-place"]');
            if (birthplaceInput) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, birthplaceInput);

                if (isVisible) {
                    await page.evaluate((el) => { el.value = ''; }, birthplaceInput);
                    await birthplaceInput.type(user.place_of_birth);
                    console.log(user.email, "Đã điền place of birth");
                } else {
                    console.log(user.email, "Trường nhập nơi sinh không hiển thị - bỏ qua");
                }
            } else {
                console.log(user.email, "Không tìm thấy trường nhập nơi sinh - bỏ qua");
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
                    const isVisible = await page.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                    }, dropdownBtn);
                    
                    if (isVisible) {
                        await dropdownBtn.click();
                        // Wait for dropdown menu to appear
                        await waitForNetworkIdle(page);
                        
                        // Tìm và chọn tùy chọn "Đoàn tụ gia đình" từ dropdown
                        const optionSelector = "a span:not([class]):not([id]):not([role]):not([name]):not([title]):not([type]):not([value]):not([placeholder]):not([for]):not([href]):not([src]):not([alt]):not([aria-label]):not([aria-labelledby]):not([aria-describedby]):not([aria-details]):not([aria-controls]):not([aria-owns]):not([aria-flowto]):not([aria-activedescendant]):not([data-*])";
                        const options = await page.$$(optionSelector);
                        
                        let foundOption = false;
                        for (const option of options) {
                            const text = await page.evaluate(el => el.textContent.trim(), option);
                            if (text === 'Đoàn tụ gia đình') {
                                await option.click();
                                await waitForNetworkIdle(page);
                                console.log(`${user.email} - Đã chọn động lực: Đoàn tụ gia đình`);
                                foundOption = true;
                                break;
                            }
                        }
                        
                        if (!foundOption) {
                            console.log(`${user.email} - Không tìm thấy tùy chọn "Đoàn tụ gia đình", bỏ qua`);
                        }
                    } else {
                        console.log(`${user.email} - Nút dropdown động lực không hiển thị, bỏ qua`);
                    }
                } else {
                    console.log(`${user.email} - Không tìm thấy nút dropdown động lực, bỏ qua`);
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
                // Check if element is visible in the DOM
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, inputElement);
                
                if (!isVisible) {
                    console.log(`${email} - Trường ${fieldName} không hiển thị, bỏ qua`);
                    return;
                }
                
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
                console.log(`${email} - Không tìm thấy trường ${fieldName}, bỏ qua`);
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
                // Check if button is visible
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, dateButton);
                
                if (!isVisible) {
                    console.log(`${email} - Nút chọn ${fieldName} không hiển thị, bỏ qua`);
                    return;
                }
                
                await dateButton.click();
                // Wait for dropdown to appear
                await waitForNetworkIdle(page);
                
                // Find and click the date option
                const linkElements = await page.$$('a');
                
                if (title === 'Tháng') {
                    // Special handling for months based on the pattern observed in 2.txt
                    let monthFound = false;
                    
                    for (const link of linkElements) {
                        const isLinkVisible = await page.evaluate(el => {
                            const style = window.getComputedStyle(el);
                            return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                        }, link);
                        
                        if (!isLinkVisible) continue;
                        
                        const linkText = await page.evaluate(el => el.textContent.trim(), link);
                        
                        // For month 1, we need to use a regex pattern
                        if (formatted_date_part === '1') {
                            const regex = new RegExp(`^tháng ${formatted_date_part}$`);
                            if (regex.test(linkText)) {
                                await link.click();
                                await waitForNetworkIdle(page);
                                console.log(`${email} - Điền tháng 1 hoàn tất (regex match)`);
                                monthFound = true;
                                break;
                            }
                        } 
                        // For other months, direct string matching
                        else if (linkText === `tháng ${formatted_date_part}`) {
                            await link.click();
                            await waitForNetworkIdle(page);
                            console.log(`${email} - Điền ${fieldName} hoàn tất (direct match)`);
                            monthFound = true;
                            break;
                        }
                    }
                    
                    if (!monthFound) {
                        console.log(`${email} - Không tìm thấy tháng ${formatted_date_part}`);
                    }
                } else {
                    // Standard handling for day and year
                    let valueFound = false;
                    
                    for (const link of linkElements) {
                        const isLinkVisible = await page.evaluate(el => {
                            const style = window.getComputedStyle(el);
                            return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                        }, link);
                        
                        if (!isLinkVisible) continue;
                        
                        const linkText = await page.evaluate(el => el.textContent.trim(), link);
                        
                        if (linkText === formatted_date_part) {
                            await link.click();
                            await waitForNetworkIdle(page);
                            console.log(`${email} - Điền ${fieldName} hoàn tất`);
                            valueFound = true;
                            break;
                        }
                    }
                    
                    if (!valueFound) {
                        console.log(`${email} - Không tìm thấy giá trị ${formatted_date_part} cho ${fieldName}`);
                    }
                }
            } else {
                console.log(`${email} - Không tìm thấy nút chọn ${fieldName}, bỏ qua`);
            }
        }
    } catch (error) {
        console.log(`${email} - Không điền được ${fieldName}: ${error.message}`);
    }
}


async function inputDataName(page, user) {
    // Check if First Name field exists
    if (page.url().includes('oska-acc')) {
        const firstNameField = await page.$('input[name="accountPanel:basicData:body:firstName:inputContainer:input"]');
        if (firstNameField) {
            await fillInputFieldName(
                page,
                'input[name="accountPanel:basicData:body:firstName:inputContainer:input"]',
                user.last_name,
                'tên',
                user.email,
                { pressEnter: true }
            );
        } else {
            console.log(`${user.email} - Không tìm thấy trường nhập tên, bỏ qua`);
        }
    }

    // Check if Last Name field exists
    if (page.url().includes('oska-acc')) {
        const lastNameField = await page.$('input[name="accountPanel:basicData:body:lastName:inputContainer:input"]');
        if (lastNameField) {
            await fillInputFieldName(
                page,
                'input[name="accountPanel:basicData:body:lastName:inputContainer:input"]',
                user.family_name,
                'họ',
                user.email,
                { pressEnter: true }
            );
        } else {
            console.log(`${user.email} - Không tìm thấy trường nhập họ, bỏ qua`);
        }
    }

    // Check if Day picker exists
    if (page.url().includes('oska-acc')) {
        const dayButton = await page.$('button[type="button"][title="Ngày"]');
        if (dayButton) {
            await clickDatePicker(page, 'Ngày', user.date_birth, 'ngày sinh', user.email);
        } else {
            console.log(`${user.email} - Không tìm thấy nút chọn ngày sinh, bỏ qua`);
        }
    }

    // Check if Month picker exists
    if (page.url().includes('oska-acc')) {
        const monthButton = await page.$('button[type="button"][title="Tháng"]');
        if (monthButton) {
            await clickDatePicker(page, 'Tháng', user.month_birth, 'tháng sinh', user.email);
        } else {
            console.log(`${user.email} - Không tìm thấy nút chọn tháng sinh, bỏ qua`);
        }
    }

    // Check if Year picker exists
    if (page.url().includes('oska-acc')) {
        const yearButton = await page.$('button[type="button"][title="Năm"]');
        if (yearButton) {
            await clickDatePicker(page, 'Năm', user.year_birth, 'năm sinh', user.email);
        } else {
            console.log(`${user.email} - Không tìm thấy nút chọn năm sinh, bỏ qua`);
        }
    }
    
    await clickButtonContinue(page);
    return page;
}

module.exports = {
    stepInputData,
}