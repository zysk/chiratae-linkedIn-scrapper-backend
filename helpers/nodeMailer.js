const nodemailer = require("nodemailer");
import EmailSettings from "../models/EmailSettings.model";
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
        let emailSettingsObj = await EmailSettings.findOne().exec()
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







export const sendCustomMail = async (email, subject, content) => {
    try {

        // email = "alwin54889@gmail.com, jnjasgreen@gmail.com, alwin.ponnan@favcy.in"
        // subject = "test"
        // content = "ttesyt"

        console.log(email)
        // create reusable transporter object using the default SMTP transport
        let emailSettingsObj = await EmailSettings.findOne().exec()
        if (!emailSettingsObj) {
            throw new Error("Please add email setting from admin panel to send custom mails")
        }

        let transporterObject = {
            // host: emailSettingsObj.mailHost ? emailSettingsObj.mailHost : "smtp.yandex.com",
            // port: emailSettingsObj.mailPort ? emailSettingsObj.mailPort : 465,
            // // secure: false, // true for 465, false for other ports
            // service: !emailSettingsObj.mailHost && 'Yandex',
            auth: {
                //     user: emailSettingsObj.mailHost ? emailSettingsObj.mailHost : 'contactus@deliveryladka.com', // generated ethereal user
                //     pass: 'fzxnmovdsjasvgmd', // generated ethereal password
            },
        }

        if (emailSettingsObj.mailHost && emailSettingsObj.mailHost != "") {
            transporterObject.host = emailSettingsObj.mailHost
        }

        if (emailSettingsObj.mailService) {
            transporterObject.service = emailSettingsObj.mailService
        }
        else {
            transporterObject.service = "Yandex"
        }

        if (emailSettingsObj.mailPort && emailSettingsObj.mailPort != "") {
            transporterObject.port = emailSettingsObj.mailPort
            if (emailSettingsObj.mailPort && emailSettingsObj.mailPort != "" && emailSettingsObj.mailPort == 465) {
                transporterObject.secure = false
            }
        }
        if (emailSettingsObj.mailUserName && emailSettingsObj.mailUserName != "") {
            transporterObject.auth.user = emailSettingsObj.mailUserName
        }
        if (emailSettingsObj.mailUserName && emailSettingsObj.mailUserName != "") {
            transporterObject.auth.pass = emailSettingsObj.mailUserPassword
        }



        console.log(transporterObject)
        let customTransporter = nodemailer.createTransport(transporterObject);

        console.log(emailSettingsObj, "emailSettingsObj")


        // send mail with defined transport object
        let temp = await customTransporter.sendMail({
            from: emailSettingsObj?.mailFromAddress ? emailSettingsObj?.mailFromAddress : "contactus@deliveryladka.com", // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: content, // plain text body
            // html: `LinkedIn account is not logged in please login now <a href="${linkedLoginUrl}">${linkedLoginUrl}</a>`, // plain text body
        });
        console.log(temp)




        return true

    } catch (error) {
        throw new Error(error);
    }
}







