import Proxies from "../models/Proxies.model";

export const createNewProxy = async (req, res, next) => {
    try {
        let existsCheck = await Proxies.findOne({ value: req.body.value }).exec();
        if (existsCheck) {
            throw new Error("Proxy Already Exists!");
        }
        let newProxy = await new Proxies(req.body).save();
        res.status(200).json({ message: "User Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getProxies = async (req, res, next) => {
    try {
        let ProxiesArr = await Proxies.find().exec();
        res.status(200).json({ message: "Proxies found", data: ProxiesArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const deleteProxy = async (req, res, next) => {
    try {
        let ProxyObj = await Proxies.findByIdAndDelete(req.params.id).exec();
        if (!ProxyObj) throw { status: 400, message: "Proxy not found or deleted already" };
        res.status(200).json({ message: "Proxy deleted successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
