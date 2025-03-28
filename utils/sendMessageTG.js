const axios = require("axios");
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});


const catchAsync = require("./catchAsync");

const sendMessageTG = catchAsync(async function (message) {
    console.log("Telegram message send: ", message);
    const encodedMessage = encodeURI(message);
    let {data} = await axios.get(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage?chat_id=${process.env.TG_CHANNEL_ID}&text=${encodedMessage}`);
    return data;

})

module.exports = sendMessageTG;