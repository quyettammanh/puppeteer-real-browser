const checkGoetheErrors = (page, user) => {
    const url = page.url();
    if (url.includes('account-locked-error')) {
        console.log(user.email, "Account locked, exiting...");
        return true;
    } else if (url.includes('underage-error')) {
        console.log(user.email, "Underage, exiting...");
        return true;
    } else if (url.includes('chrome-error://chromewebdata')) {
        console.log(user.email, "Chrome error, reloading...");
        page.reload();
        return false;
    } else if (url.includes('session-expired')) {
        console.log(user.email, "Session expired, exiting...");
        return true;
    } else if (url.includes('error')) {
        console.log(user.email, "Error, exiting...");
        return true;
    } else if (url.includes('account-temp-pairing-error')) {
        console.log(user.email, "Account temp pairing error, exiting...");
        return true;
    } else if (url.includes('warning')) {
        console.log(user.email, "Warning, exiting...");
        return true;
    }
    return false;
};

module.exports = {
    checkGoetheErrors,
};