import { OrderStatus } from "../helpers/OrderStatus";
import Fabric from "../models/FabricOrder.model";
import Fabrics from "../models/Fabric.model";
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


export const getAllFabricsOrdersByDate = async (req, res, next) => {
    try {
        console.log(req.query);
        let searchDate = new Date(req.query.search)
        let searchDateStartTime = searchDate.setHours(0, 0, 0, 0)
        let searchDateEndTime = searchDate.setHours(23, 59, 59)

        console.log(req.query.search)
        let fabrics = await Fabric.find({ createdAt: { $gte: searchDateStartTime, $lte: searchDateEndTime } }).lean().exec();
        for (const el of fabrics) {

            for (const ele of el.fabricArr) {
                console.log(ele.fabricId, "fabric id")
                let fabricObj = await Fabrics.findOne({ _id: `${ele.fabricId}` }).exec()
                ele.fabricObj = fabricObj;
            }
        }


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
                await FabricStock.findByIdAndUpdate(fabricStockExist._id, { $inc: { Stock: el.quantity } }).exec();
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
