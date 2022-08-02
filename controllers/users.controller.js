import { UserList } from "../Builders/user.builder";
import { comparePassword, encryptPassword } from "../helpers/Bcrypt";
import { ErrorMessages, rolesObj } from "../helpers/Constants";
import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import { generateAccessJwt } from "../helpers/Jwt";
// import { generateUid } from "../helpers/utils";
import { ValidateEmail } from "../helpers/Validators";
import Users from "../models/user.model";
// import { upload } from "../helpers/fileUpload";

export const registerUser = async(req, res, next) => {
    try {
        let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] });
        console.log(req.body);
        // let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }] });
        if (UserExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS} or ${ErrorMessages.PHONE_EXISTS}`);
        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        // req.body.phone = toString(req.body.phone)
        if (!/^\(?([1-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(req.body.phone)) throw { status: false, message: `Please fill a valid phone number` };

        req.body.password = await encryptPassword(req.body.password);

        let newUser = await new Users(req.body).save().exec();
        // res.status(200).json({ message: "User Created", data: _id, success: true });
        res.status(200).json({ message: "User Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const login = async(req, res, next) => {
    try {
        console.log(req.body);
        const userObj = await Users.findOne({ email: req.body.email }).lean().exec();
        if (userObj) {
            const passwordCheck = await comparePassword(userObj.password, req.body.password);
            if (passwordCheck) {
                let accessToken = await generateAccessJwt({
                    userId: userObj._id,
                    role: rolesObj.USER,
                    name: userObj.name,
                    phone: userObj.phone,
                    email: userObj.email,
                });
                res.status(200).json({ message: "LogIn Successfull", token: accessToken, success: true });
            } else {
                throw { status: 401, message: "Invalid Password" };
            }
        } else {
            throw { status: 401, message: "user Not Found" };
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export const userKyc = async(req, res, next) => {
    try {
        let getUser = await Users.findById(req.params.id).exec();
        console.log(getUser, "oo1p");

        if (!getUser.penCardImage) {
            if (!req.body.penCardImage) throw { status: 400, message: "pencard image must have upload for next step" };
        }
        if (!getUser.aadharImage) {
            if (!req.body.aadharImage) throw { status: 400, message: "aadhar image must have upload for next step" };
        }
        // if(!getUser.aadharImage) {
        //     if (req.body.aadharImage) {
        //         req.body.penCardImage = await storeFileAndReturnNameBase64(req.body.penCardImage);
        //     }
        //     getUser.$set({ "": "" })
        // }

        if (getUser.aadharImage) {
            if (req.body.aadharImage) {
                await Users.findByIdAndUpdate({ _id: req.params.id }, { $set: { aadharImage: req.body.aadharImage } });
            }
        }
        if (getUser.penCardImage) {
            if (req.body.penCardImage) {
                await Users.findByIdAndUpdate(req.params.id, { $set: { penCardImage: req.body.penCardImage } });
            }
        }
        if (req.body.penCardImage) {
            req.body.penCardImage = await storeFileAndReturnNameBase64(req.body.penCardImage);
        }
        if (req.body.aadharImage) {
            req.body.aadharImage = await storeFileAndReturnNameBase64(req.body.aadharImage);
        }

        // let ab;

        // ab = await Users.findOneAndUpdate({ userId: req.params.id, "getUser.penCardImage": req.body.penCardImage, "getUser.aadharImage": req.body.aadharImage, "getUser.penNo": req.body.penNo, "getUser.aadharNo": req.body.aadharNo }, { $set: { "kycVerified": true } })
        // ab = await Users
        // .findOneAndUpdate({ $and: [{ penCardImage: req.body.penCardImage },
        //      { aadharImage: req.body.aadharImage }, { penNo: req.body.penNo },
        //       { aadharNo: req.body.aadharNo }] }, { $set: { "kycVerified": true } })
        // await getUser.findOneAndUpdate({ _id: req.params.id }, { "getUser.penCardImage": req.body.penCardImage, "getUser.aadharImage": req.body.aadharImage });
        await Users.findByIdAndUpdate(req.params.id, req.body).exec();
        //change here req.body to getUser to chekc db , all details present or not   
        if ((req.body.penCardImage !== undefined && req.body.aadharImage !== undefined && req.body.penNo !== undefined && req.body.aadharNo !== undefined)) {
            await Users.findByIdAndUpdate(req.params.id, { kycVerified: true }).exec()
            console.log("jhhjdjgked")
        }
        // console.log(ab, "oop")

        res.status(201).json({ message: "images added succesfully", success: true });
    } catch (err) {
        next(err);
    }
};

export const getUsers = async(req, res, next) => {
    try {
        console.log(req.query);
        const UsersPipeline = UserList(req.query);
        console.log(UsersPipeline);
        const UsersArr = await Users.aggregate(UsersPipeline);
        // let UserObj = await Users.find();

        // console.log(UsersArr);
        res.status(200).json({ message: "Users", data: UsersArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateUser = async(req, res, next) => {
    try {
        if (req.body.password) {
            req.body.password = await encryptPassword(req.body.password);
        }
        if (req.body.penCardImage) {
            req.body.penCardImage = await storeFileAndReturnNameBase64(req.body.penCardImage);
        }
        if (req.body.aadharImage) {
            req.body.aadharImage = await storeFileAndReturnNameBase64(req.body.aadharImage);
        }
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
        if (!userObj) throw { status: 400, message: "user not found or deleted already" };

        res.status(200).json({ msg: "user deleted successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getUserData = async(req, res, next) => {
    //get users data according kyc status  //admin only can see
    try {
        let kycStatus = req.query.kycStatus;

        let UserObj = await Users.find({ kycStatus: req.query.kycStatus }).exec();
        console.log(UserObj)

        res.status(200).json({ message: "Users-data", data: UserObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const changeUserKyc = async(req, res, next) => {
    //change kyc-status manually from admin side
    try {
        let kycStatus = req.body.kycStatus;
        if (!["verified", "denied"].includes(kycStatus)) {
            throw {
                status: 400,
                message: "status should be 'verified'or'denied' "
            }
        };
        let UserObj = await Users.findOneAndUpdate({ _id: req.body.userId }, { $set: { "kycStatus": kycStatus } }).exec();
        // console.log(UserObj);
        res.status(200).json({ message: "change user kyc status successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
//ADMIN============

export const registerAdmin = async(req, res, next) => {
    try {
        let adminExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }] })
            .lean()
            .exec();
        if (adminExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS} or ${ErrorMessages.PHONE_EXISTS}`);
        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        if (!/^\(?([1-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(req.body.phone)) throw { status: false, message: `Please fill a valid phone number` };

        req.body.password = await encryptPassword(req.body.password);

        let newUser = await new Users(req.body).save();

        res.status(200).json({ message: "admin Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const loginAdmin = async(req, res, next) => {
    try {
        console.log(req.body);
        const adminObj = await Users.findOne({ $or: [{ email: new RegExp(`^${req.body.email}$`) }, { phone: req.body.phone }], role: rolesObj.ADMIN })
            .lean()
            .exec();
        if (adminObj) {
            const passwordCheck = await comparePassword(adminObj.password, req.body.password);
            if (passwordCheck) {
                let accessToken = await generateAccessJwt({ userId: adminObj._id, role: rolesObj.ADMIN, user: { name: adminObj.name, email: adminObj.email, phone: adminObj.phone, _id: adminObj._id } });
                res.status(200).json({ message: "LogIn Successfull", token: accessToken, success: true });
            } else {
                throw { status: 401, message: "Invalid Password" };
            }
        } else {
            throw { status: 401, message: "Admin Not Found" };
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};