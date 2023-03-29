import { UserList, UserListWithCampaigns } from "../Builders/user.builder";
import { comparePassword, encryptPassword } from "../helpers/Bcrypt";
import { ErrorMessages, rolesObj } from "../helpers/Constants";
import { generateAccessJwt } from "../helpers/Jwt";

import { ValidateEmail } from "../helpers/Validators";
import Users from "../models/user.model";
// import { upload } from "../helpers/fileUpload";

export const registerUser = async (req, res, next) => {
    try {
        let UserExistCheck = await Users.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }] }).exec();
        if (UserExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS} or ${ErrorMessages.PHONE_EXISTS}`);
        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        if (req.body.password) {
            req.body.password = await encryptPassword(req.body.password);
        }
        else {
            throw new Error("Password is mandatory")
        }


        let newUser = await new Users(req.body).save();

        res.status(200).json({ message: "User Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        console.log(req.body);
        const userObj = await Users.findOne({ email: new RegExp(`^${req.body.email}$`) })
            .lean()
            .exec();
        if (userObj) {
            const passwordCheck = await comparePassword(userObj.password, req.body.password);
            if (passwordCheck) {
                let accessToken = await generateAccessJwt({
                    userId: userObj._id,
                    role: rolesObj?.USER,
                    name: userObj?.name,
                    phone: userObj?.phone,
                    email: userObj?.email,
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




export const getUserById = async (req, res, next) => {
    try {
        let userObj = await Users.findById(req.params.id).exec();
        if (!userObj) {
            throw new Error("User Not found");
        }



        res.status(201).json({ message: "found User", data: userObj, success: true });
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        let userObj = await Users.findById(req.params.id).exec();
        if (!userObj) {
            throw new Error("User Not found");
        }
        if (!req.body.password || req.body.password == "") {
            delete req.body.password
        }
        else {
            req.body.password = await encryptPassword(req.body.password);
        }


        console.log(req.body, "192.168.0.23:3000/", "req.params.id", req.params.id)
        await Users.findByIdAndUpdate(req.params.id, req.body).exec();

        res.status(201).json({ message: "Updated Successfully", success: true });
    } catch (err) {
        next(err);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.role) {
            query = { ...query, role: req.query.role }
        }
        let UsersArr = await Users.find(query).exec()
        console.log(UsersArr, "UsersArr")
        res.status(200).json({ message: "Users", data: UsersArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};




export const getUserDetailsWithCampaignsData = async (req, res, next) => {
    try {
        let userObj = await Users.aggregate([UserListWithCampaigns(req.params.id)]).exec();
        if (!userObj) throw { status: 400, message: "users not found or deleted already" };
        res.status(200).json({ message: "user deleted successfully", data: userObj[0], success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteUser = async (req, res, next) => {
    try {
        let userObj = await Users.findByIdAndRemove(req.params.id).exec();
        if (!userObj) throw { status: 400, message: "user not found or deleted already" };
        res.status(200).json({ message: "user deleted successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


//ADMIN============
export const registerAdmin = async (req, res, next) => {
    try {
        // let adminExistCheck = await Users.findOne({ $or: [{ email: new RegExp(`^${req.body.email}$`) }, req?.body?.phone && { phone: req.body.phone }] })
        //     .lean()
        //     .exec();
        // console.log(adminExistCheck)
        // if (adminExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS}`);
        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        req.body.password = await encryptPassword(req.body.password);

        let newUser = await new Users(req.body).save();

        res.status(200).json({ message: "admin Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const loginAdmin = async (req, res, next) => {
    try {
        console.log(req.body, "Asd");
        const adminObj = await Users.findOne({ email: new RegExp(`^${req.body.email}$`) }).exec();
        if (adminObj) {
            console.log(adminObj, "adminObj")
            const passwordCheck = await comparePassword(adminObj.password, req.body.password);
            if (passwordCheck) {
                let accessToken = await generateAccessJwt({ userId: adminObj._id, role: adminObj.role, user: { name: adminObj.name, email: adminObj.email, phone: adminObj.phone, _id: adminObj._id } });
                res.status(200).json({ message: "LogIn Successfull", token: accessToken, success: true });
            } else {
                throw { status: 401, message: "Invalid Password" };
            }
        } else {
            throw { status: 401, message: "User Not Found" };
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};

