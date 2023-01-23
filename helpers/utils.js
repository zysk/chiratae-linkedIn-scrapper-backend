import { customAlphabet } from "nanoid";
import User from "../models/user.model";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export const generateUid = async () => {
    let check = true;
    while (check) {
        let tempUid = nanoid();
        let userObj = await User.findOne({ uid: tempUid }).exec();
        if (!userObj) {
            check = false;
            return tempUid;
        }
        console.log("GENERATING NEW UID,Current", tempUid);
    }
};





export const generateRandomNumbers = (n) => {
    var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.   

    if (n > max) {
        return generate(max) + generate(n - max);
    }

    max = Math.pow(10, n + add);
    var min = max / 10; // Math.pow(10, n) basically
    var number = Math.floor(Math.random() * (max - min + 1)) + min;

    return ("" + number).substring(add);
}
