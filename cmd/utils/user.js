const {readFileJson}=require('../helper/func.js');
// Function to create users
function createUsers(filePath) {
    class User {
        constructor({
            email,
            password,
            family_name,
            last_name,
            number_phone,
            postal_code,
            location,
            street_name,
            place_of_birth,
            reading,
            listening,
            writing,
            speaking,
            sum,
            priority,
            date_birth,
            month_birth,
            year_birth
        }) {
            this.email = email;
            this.password = password;
            this.family_name = family_name;
            this.last_name = last_name;
            this.number_phone = number_phone;
            this.postal_code = postal_code;
            this.location = location;
            this.street_name = street_name;
            this.place_of_birth = place_of_birth;
            this.reading = reading;
            this.listening = listening;
            this.writing = writing;
            this.speaking = speaking;
            this.sum = sum;
            this.priority = priority;
            this.date_birth = date_birth;
            this.month_birth = month_birth;
            this.year_birth = year_birth;
        }
    }

    const userData = readFileJson(filePath);
    if (!userData) {
        return null;
    }
    const users = [];

    // Create user objects from JSON data
    userData.forEach(user => {
        const userObj = new User({
            email: user.email,
            password: user.password,
            family_name: user.family_name,
            last_name: user.last_name,
            number_phone: user.number_phone,
            postal_code: user.postal_code,
            location: user.location,
            street_name: user.street_name,
            place_of_birth: user.place_of_birth,
            reading: user.reading,
            listening: user.listening,
            writing: user.writing,
            speaking: user.speaking,
            sum: user.sum,
            priority: user.priority,
            date_birth: user.date_birth,
            month_birth: user.month_birth,
            year_birth: user.year_birth
        });
        users.push(userObj);
    });

    return users;
}

function checkUserPathByKey(key) {
    let userPath = '';
    if (key.includes("hanoi_a1")) {
        userPath = "./data/user/hn/hn_a1.json";
    } else if (key.includes("hanoi_a2")) {
        userPath = "./data/user/hn/hn_a2.json";
    } else if (key.includes("hanoi_b1")) {
        userPath = "./data/user/hn/hn_b1.json";
    } else if (key.includes("hanoi_b2")) {
        userPath = "./data/user/hn/hn_b2.json";
    } else if (key.includes("hcm_a1")) {
        userPath = "./data/user/hcm/hcm_a1.json";
    } else if (key.includes("hcm_a2")) {
        userPath = "./data/user/hcm/hcm_a2.json";
    } else if (key.includes("hcm_b1")) {
        userPath = "./data/user/hcm/hcm_b1.json";
    } else if (key.includes("hcm_b2")) {
        userPath = "./data/user/hcm/hcm_b2.json";
    } else{
        userPath = "./data/test/user.json";
    }
    return userPath;
}

module.exports = {
    createUsers,
    checkUserPathByKey
};