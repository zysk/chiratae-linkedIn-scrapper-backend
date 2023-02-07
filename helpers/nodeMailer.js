const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    // host: "smtp.yandex.com",
    // port: 465,
    // secure: false, // true for 465, false for other ports
    service: 'Yandex',
    auth: {
        user: 'contactus@deliveryladka.com', // generated ethereal user
        pass: 'fzxnmovdsjasvgmd', // generated ethereal password
    },
});

const url = process.env.FRONTEND_BASE_URL


// const fs = require('fs')
export const sendMail = async (email, endDate) => {
    try {
        console.log(email)
        // create reusable transporter object using the default SMTP transport

        let linkedLoginUrl = url + `/scheduleCampaignLogin?endDate=${endDate}`

        // send mail with defined transport object
        let temp = await transporter.sendMail({
            from: 'contactus@deliveryladka.com', // sender address
            to: email, // list of receivers
            subject: "LinkedIn account is not logged in please login now", // Subject line
            text: `LinkedIn account is not logged in please login now ${linkedLoginUrl}`, // plain text body
            html: `LinkedIn account is not logged in please login now <a href="${linkedLoginUrl}">${linkedLoginUrl}</a>`, // plain text body
        });
        console.log(temp)




        return true

    } catch (error) {
        console.error(error)
        return false
    }
}


