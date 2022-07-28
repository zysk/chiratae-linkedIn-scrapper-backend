import { UserList } from "../Builders/user.builder";
import { comparePassword, encryptPassword } from "../helpers/Bcrypt";
import { ErrorMessages, rolesObj } from "../helpers/Constants";
import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import { generateAccessJwt } from "../helpers/Jwt";
import { generateUid } from "../helpers/utils";
import { ValidateEmail } from "../helpers/Validators";
import Users from "../models/users.model";

export const registerUser = async (req, res, next) => {
    try {
        let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }, { uid: new RegExp(`^${req.body.uid}`) }] });
        if (UserExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS} or ${ErrorMessages.PHONE_EXISTS}`);

        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        req.body.password = await encryptPassword(req.body.password);
        if (req.body.profilePicture) {
            try {
                req.body.profilePicture = await storeFileAndReturnNameBase64(req.body.profilePicture);
            } catch (error) {
                console.error(error);
                req.body.profilePicture = "";
            }
        }
        if (req.body.frontPicture) {
            try {
                req.body.frontPicture = await storeFileAndReturnNameBase64(req.body.frontPicture);
            } catch (error) {
                console.error(error);
                req.body.frontPicture = "";
            }
        }
        if (req.body.backPicture) {
            try {
                req.body.backPicture = await storeFileAndReturnNameBase64(req.body.backPicture);
            } catch (error) {
                console.error(error);
                req.body.backPicture = "";
            }
        }

        // req.body.uid = await generateUid();

        await new Users(req.body).save();

        res.status(200).json({ message: "User Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const login = async (req, res, next) => {
    try {
        let UserExistCheck = await Users.findOne({ $or: [{ email: new RegExp(`^${req.body.email}$`) }] });
        if (!UserExistCheck) throw new Error(`${ErrorMessages.INVALID_USER}`);
        // console.log(UserExistCheck);
        // console.log(req.body);
        let passwordCheck = await comparePassword(UserExistCheck.password, req.body.password);
        if (!passwordCheck) throw new Error(ErrorMessages.INVALID_PASSWORD);

        let token = await generateAccessJwt({ userId: UserExistCheck._id, role: UserExistCheck.role, user: { name: UserExistCheck.name, email: UserExistCheck.email, phone: UserExistCheck.phone, _id: UserExistCheck._id } });
        res.status(200).json({ message: "User Logged In", token, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        // console.log(req.query);
        const UsersPipeline = UserList(req.query);
        // console.log(UsersPipeline);
        const UsersArr = await Users.aggregate(UsersPipeline);
        // console.log(UsersArr);
        res.status(200).json({ data: UsersArr, message: "Users", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const updateUser = async (req, res, next) => {
    try {
        await Users.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteUser = async (req, res, next) => {
    try {
        let productObj = await Users.findByIdAndRemove(req.params.id).exec();
        res.status(200).json({ data: productObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const getById = async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id).exec();
        res.status(200).json({ message: "User", data: user, success: true });
    } catch (error) {
        console.error(error);
    }
};
