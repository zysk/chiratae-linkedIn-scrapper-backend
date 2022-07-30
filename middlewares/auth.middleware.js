import jwt from "jsonwebtoken";
import User from "../models/user.model";

export const authorizeJwt = async(req, res, next) => {
    // console.log(req.headers)
    let authorization = req.headers["authorization"];
    let token = authorization && authorization.split("Bearer ")[1];
    if (!token) return res.status(401).json({ message: "Invalid Token" });
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.jwt_access_token_secret);
        // Add user from payload
        req.user = decoded;

        req.user.userObj = await User.findById(decoded.userId).exec();

        next();
    } catch (e) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

export const setUserAndUserObj = async(req, res, next) => {
    // console.log(req.headers)
    let authorization = req.headers["authorization"];
    if (authorization) {
        let token = authorization && authorization.split("Bearer ")[1];
        if (token) {
            try {
                // Verify token
                const decoded = jwt.verify(token, process.env.jwt_access_token_secret);
                // Add user from payload
                req.user = decoded;
                if (decoded.userId) req.user.userObj = await User.findById(decoded.userId).exec();
            } catch (e) {
                return res.status(401).json({ message: "Invalid Token" });
            }
        }
    }
    next();
};