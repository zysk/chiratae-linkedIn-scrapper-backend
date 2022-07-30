import { UserList } from "../Builders/user.builder";
import { comparePassword, encryptPassword } from "../helpers/Bcrypt";
import { ErrorMessages, rolesObj } from "../helpers/Constants";
import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import { generateAccessJwt } from "../helpers/Jwt";
import { generateUid } from "../helpers/utils";
import { ValidateEmail } from "../helpers/Validators";
import Users from "../models/user.model";
import { upload } from "../helpers/fileUpload";

export const registerUser = async(req, res, next) => {
    try {
        let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] });
        console.log(req.body)
            // let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }] });
        if (UserExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS} or ${ErrorMessages.PHONE_EXISTS}`);
        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        req.body.password = await encryptPassword(req.body.password);

        let newUser = await new Users(req.body).save();
        // res.status(200).json({ message: "User Created", data: _id, success: true });
        res.status(200).json({ message: "User Created", data: newUser, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const kycUpload = async(req, res, next) => {
    // router.post('/uploadFile/:id', upload.single('file'), async(req, res, next) => {
    try {
        // if (req.file.profilePicture) {
        //     req.file.profilePicture = await storeFileAndReturnNameBase64(req.body.profilePicture);
        // }
        if (req.body.penCardImage) {
            req.body.penCardImage = await storeFileAndReturnNameBase64(req.body.penCardImage);
        }
        if (req.body.aadharImage) {
            req.body.aadharImage = await storeFileAndReturnNameBase64(req.body.aadharImage);
        }
        let getUser = await Users.findByIdAndUpdate(req.params.id, { penCardImage: req.body.penCardImage, aadharImage: req.body.aadharImage });
        // let getUser = await Users.findById(req.params.id)
        // console.log(getUser, "oo1p");
        // let ab;
        // if ((Users.penCardImage && Users.aadharImage)) {
        //     console.log("jhhjdjgked")
        //     ab = await Users.findByIdAndUpdate(req.params.id, { kycVerified: true }, { new: true })
        // }
        // await vendorAds(req.body).save()
        // console.log(ab, "oop")
        console.log(getUser.penCardImage, "oop")
            // console.log(getUser.aadharImage, "oop")
            // console.log(getUser.isActive, "oop")
        res.status(201).json({ message: 'images added succesfully', success: true });
    } catch (err) {
        next(err);
    }
};

export const getUsers = async(req, res, next) => {
    try {
        // console.log(req.query);
        // const UsersPipeline = UserList(req.query);
        // console.log(UsersPipeline);
        // const UsersArr = await Users.aggregate(UsersPipeline);
        let UserObj = await Users.find();

        // console.log(UsersArr);
        res.status(200).json({ data: UserObj, message: "Users", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateUser = async(req, res, next) => {
    try {
        await Users.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteUser = async(req, res, next) => {
    try {
        let userObj = await Users.findByIdAndRemove(req.params.id).exec();
        res.status(200).json({ data: userObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};