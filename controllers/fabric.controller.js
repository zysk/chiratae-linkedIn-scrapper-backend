import Fabric from "../models/Fabric.model";
export const addFabric = async (req, res, next) => {
    try {
        await new Fabric(req.body).save();
        res.status(200).json({ message: "Fabric Created Successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getAllFabrics = async (req, res, next) => {
    try {
        let fabrics = await Fabric.find().exec();
        res.status(200).json({ data: fabrics, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateFabric = async (req, res, next) => {
    try {
        let fabric = await Fabric.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        res.status(200).json({ data: fabric, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteFabric = async (req, res, next) => {
    try {
        let fabric = await Fabric.findByIdAndRemove(req.params.id).exec();
        res.status(200).json({ data: fabric, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
