const nodemailer = require("nodemailer");

// const fs = require('fs')
const sendMail = async (email) => {
    try {
        console.log(email)
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            // host: "smtp.yandex.com",
            // port: 465,
            // secure: false, // true for 465, false for other ports
            service: 'Yandex',
            auth: {
                user: 'contactus@deliveryladka.com', // generated ethereal user
                pass: 'fzxnmovdsjasvgmd', // generated ethereal password
            },
        });

        // send mail with defined transport object
        let temp = await transporter.sendMail({
            from: 'contactus@deliveryladka.com', // sender address
            to: email, // list of receivers
            subject: "LinkedIn account is not logged in please login now", // Subject line
            text: `LinkedIn account is not logged in please login now`, // plain text body
        });
        console.log(temp)




        return true

    } catch (error) {
        console.error(error)
        return false
    }
}

module.exports = { sendMail }

