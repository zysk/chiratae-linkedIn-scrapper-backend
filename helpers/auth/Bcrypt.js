import bcrypt from "bcryptjs";

export const encryptPassword = async (password) => {
    password = Buffer.from(password, "base64").toString("ascii");
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (hashedPassword, password) => {
    password = Buffer.from(password, "base64").toString("ascii");
    return await bcrypt.compare(password, hashedPassword);
};
