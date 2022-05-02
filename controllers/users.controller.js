import { comparePassword } from "../helpers/Bcrypt";
import { ErrorMessages } from "../helpers/Constants";
import { generateAccessJwt } from "../helpers/Jwt";
import { ValidateEmail } from "../helpers/Validators";
import Users from "../models/users.model";

export const registerUser = async (req, res, next) => {
    try {
        let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }] });
        if (UserExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS} or ${ErrorMessages.PHONE_EXISTS}`);

        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        await new Users(req.body).save();

        res.status(200).json({ message: "User Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const login = async (req, res, next) => {
    try {
        let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }] });
        if (!UserExistCheck) throw new Error(`${ErrorMessages.INVALID_USER}`);
        let passwordCheck = await comparePassword(UserExistCheck.password, req.body.password);
        if (!passwordCheck) throw new Error(ErrorMessages.INVALID_PASSWORD);

        let token = await generateAccessJwt({ userId: UserExistCheck._id, role: UserExistCheck.role });
        res.status(200).json({ message: "User Logged In", token, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
