import { OrderStatus } from "../helpers/OrderStatus";
import Fabric from "../models/FabricOrder.model";
import FabricStock from "../models/FabricStock.model";
export const newFabricOrder = async (req, res, next) => {
    try {
        await new Fabric(req.body).save();
        res.status(200).json({ message: "Fabric Ordered Successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getAllFabricsOrders = async (req, res, next) => {
    try {
        let fabrics = await Fabric.find().exec();
        res.status(200).json({ data: fabrics, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateFabricOrder = async (req, res, next) => {
    try {
        let fabric = await Fabric.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        res.status(200).json({ data: fabric, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const dispatchFabricOrder = async (req, res, next) => {
    try {
        await Fabric.findByIdAndUpdate(req.params.id, { status: OrderStatus.DISPATCHED }, { new: true }).exec();
        res.status(200).json({ message: "DISPATCHED", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const deliverFabricOrder = async (req, res, next) => {
    try {
        let fabricOrder = await Fabric.findById(req.params.id).exec();
        if (!fabricOrder) throw new Error("Order Not Found");
        await Fabric.findByIdAndUpdate(req.params.id, { status: OrderStatus.DELIVERED }, { new: true }).exec();
        for (let el of fabricOrder.fabricArr) {
            let fabricStockExist = await FabricStock.findOne({ fabricId: el.fabricId }).exec();
            if (fabricStockExist) {
                await FabricStock.findByIdAndUpdate(fabricStockExist._id, { Stock: { $inc: el.quantity } }).exec();
            } else {
                await new FabricStock({ fabricId: el.fabricId, Stock: el.quantity }).save();
            }
        }
        res.status(200).json({ message: "Delivered", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
