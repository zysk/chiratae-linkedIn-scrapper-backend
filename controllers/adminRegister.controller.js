import { UserList } from "../Builders/user.builder";
import { comparePassword, encryptPassword } from "../helpers/Bcrypt";
import { ErrorMessages, rolesObj } from "../helpers/Constants";
import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import { generateAccessJwt } from "../helpers/Jwt";
// import { generateUid } from "../helpers/utils";
import { ValidateEmail } from "../helpers/Validators";
import Users from "../models/user.model";


export const registerAdmin = async(req, res, next) => {
    try {
        let adminExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] });
        console.log(req.body)
            // let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }] });
        if (adminExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS} or ${ErrorMessages.PHONE_EXISTS}`);
        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        // req.body.phone = toString(req.body.phone)
        if (!(/^\(?([1-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(req.body.phone)))
            throw ({ status: false, message: `Please fill a valid phone number` })

        req.body.password = await encryptPassword(req.body.password);

        let newUser = await new Users(req.body).save();

        res.status(200).json({ message: "admin Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const login = async(req, res, next) => {
    try {
        console.log(req.body)
        const adminObj = await Users.findOne({ email: req.body.email }).lean().exec();
        if (adminObj) {
            const passwordCheck = await comparePassword(adminObj.password, req.body.password);
            if (passwordCheck) {
                let accessToken = await generateAccessJwt({ userId: adminObj._id, role: rolesObj.ADMIN, name: adminObj.name, phone: adminObj.phone, email: adminObj.email });

                // await Users.findByIdAndUpdate(adminObj._id, { token: accessToken }).exec();
                res.status(200).json({ message: 'LogIn Successfull', token: accessToken, success: true });
            } else {
                throw ({ status: 401, message: "Invalid Password" })
            }
        } else {
            throw ({ status: 401, message: "admin Not Found" })
        }
    } catch (err) {
        console.log(err)
        next(err);
    }
};