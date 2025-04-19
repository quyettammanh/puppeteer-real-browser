const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');


// Tải các biến môi trường từ file `.env` 
require('dotenv').config()
// Sử dụng import() động để import node-fetch
const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args))

// Lấy `BOT_TOKEN` và `CHAT_ID` từ biến môi trường
const BOT_TOKEN = process.env.BOT_TOKEN
const CHAT_ID = process.env.CHAT_ID
const base_url = "https://api.telegram.org/bot" + BOT_TOKEN

async function sendTelegramMessage(message) {
    console.log(message)
    // const url = base_url + `/sendMessage`

    // const response = await fetch(url, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         chat_id: CHAT_ID,
    //         text: message
    //     })
    // })

    // await response.json()
}

// Function to send image to Telegram
async function sendImageToTelegram(imagePath) {
    console.log('Image path:', imagePath);
    // const url = `${base_url}/sendPhoto`; // Sử dụng template literal cho rõ ràng

    // // Kiểm tra xem imagePath có phải là string không
    // if (typeof imagePath !== 'string') {
    //     console.error('Invalid imagePath: must be a string.', imagePath);
    //     return;
    // }

    // // Kiểm tra xem file có tồn tại không
    // if (!fs.existsSync(imagePath)) {
    //     console.error('File does not exist:', imagePath);
    //     return;
    // }

    // let fileStream;
    // try {
    //     fileStream = fs.createReadStream(imagePath);
    // } catch (error) {
    //     console.error('Error creating read stream for image:', imagePath, error);
    //     return; // Dừng hàm nếu không tạo được stream
    // }

    // const form = new FormData();
    // form.append('chat_id', CHAT_ID);
    // form.append('photo', fileStream, {
    //     filename: path.basename(imagePath), // Thêm tên file vào stream
    // });

    // try {
    //     const response = await axios.post(url, form, {
    //         headers: {
    //             ...form.getHeaders(), // Thêm headers của form-data
    //         },
    //     });
    //     console.log('Image sent to Telegram Success');
    // } catch (error) {
    //     console.error('Failed to send image to Telegram:', error);
    //     if (error.response) {
    //         // In thêm thông tin lỗi từ response nếu có
    //         console.error('Telegram API response status:', error.response.status);
    //         console.error('Telegram API response data:', error.response.data);
    //     }
    // } finally {
    //     // Đảm bảo đóng stream sau khi sử dụng để tránh leak tài nguyên, đặc biệt quan trọng khi xử lý file lớn
    //     if (fileStream) {
    //         fileStream.destroy(); // Giải phóng stream
    //     }
    // }
}


module.exports = {
    sendTelegramMessage,
    sendImageToTelegram
}
