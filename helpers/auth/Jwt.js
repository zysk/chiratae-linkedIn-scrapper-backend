import jwt from "jsonwebtoken";
import { appConfig } from "../../config/app.config";

export const generateAccessJwt = async (obj) => {
    return jwt.sign(
        {
            ...obj,
            exp: Math.floor(Date.now() / 1000) + 604800, //valid for 7 days
        },
        appConfig.jwtSecret
    );
};

export const generateRefreshJwt = async (obj) => {
    return jwt.sign(
        {
            ...obj,
            exp: Math.floor(Date.now() / 1000) + 604800, //7 days
        },
        appConfig.jwtSecret
    );
};
