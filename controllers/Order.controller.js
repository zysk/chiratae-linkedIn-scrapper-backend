import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import Order from "../models/Order.model";
import Users from "../models/users.model";
import Fabric from "../models/Fabric.model";
export const addOrder = async (req, res, next) => {
    try {
        if (!req.body.customerId) {
            throw new Error("Customer Id is required");
        }
        // if (!req.body.salesId) {
        //     throw new Error("Sales Id is required");
        // }
        if (req.body.patternImage) {
            try {
                req.body.patternImage = await storeFileAndReturnNameBase64(req.body.patternImage);
            } catch (error) {
                console.error(error);
                req.body.patternImage = "";
            }
        }
        if (req.body.jobCardImage) {
            try {
                req.body.jobCardImage = await storeFileAndReturnNameBase64(req.body.jobCardImage);
            } catch (error) {
                console.error(error);
                req.body.jobCardImage = "";
            }
        }
        await new Order(req.body).save();
        res.status(200).json({ message: "Ordered Successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getAllOrders = async (req, res, next) => {
    try {
        let orders = await Order.find().lean().exec();
        for (let el of orders) {
            let tempFabricArr = [];
            let tempObj = await Users.findById(el.customerId).lean().exec();
            if (tempObj) {
                el.customer = tempObj.name;
            }
            if (el.salesId) {
                let tempSalesObj = await Users.findById(el.salesId).lean().exec();
                if (tempObj) {
                    el.sales = tempSalesObj.name;
                }
            } else {
                el.sales = "mft";
            }
            for (let el of el.finalOrderProductArr) {
                for (let elx of el.productIdArr) {
                    let tempfabricObj = await Fabric.findById(elx.fabricId).lean().exec();
                    if (tempfabricObj) {
                        let productFabricIndex = tempFabricArr.findIndex((ely) => `${ely._id}` == `${tempfabricObj._id}`);
                        if (productFabricIndex != -1) {
                            tempFabricArr[productFabricIndex].fabricLength += elx.fabricLength;
                        } else {
                            tempFabricArr.push({ ...tempfabricObj, fabricLength: elx.fabricLength });
                        }
                    }
                }
            }
            console.log(tempFabricArr);
            el.fabricArr = tempFabricArr;
        }

        res.status(200).json({ data: orders, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateOrderStatusToFabricCollector = async (req, res, next) => {
    try {
        console.log(req.body);
        let orderObj = await Order.findById(req.body.orderId).lean().exec();
        if (!orderObj) throw new Error("Order Not Found");
        if (orderObj.orderStatusArr.some((el) => el.status === req.body.orderStatus || el.statusChangedByRole === req.body.role)) throw new Error("You have already updated this status");

        let temp = await Order.findByIdAndUpdate(req.body.orderId, {
            $push: { orderStatusArr: { status: req.body.orderStatus, statusChangedByRole: req.body.role, statusChangedBy: req.body.statusUpdatedBy } },
            orderStatus: req.body.orderStatus,
        })
            .lean()
            .exec();
        res.status(200).json({ message: `${req.body.orderStatus}`, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateOrderImages = async (req, res, next) => {
    try {
        let orderObj = await Order.findById(req.body.orderId).lean().exec();
        if (!orderObj) throw new Error("Order Not found");
        if (req.body.patternImage) {
            try {
                req.body.patternImage = await storeFileAndReturnNameBase64(req.body.patternImage);
            } catch (error) {
                console.error(error);
                req.body.patternImage = "";
            }
        }
        if (req.body.jobCardImage) {
            try {
                req.body.jobCardImage = await storeFileAndReturnNameBase64(req.body.jobCardImage);
            } catch (error) {
                console.error(error);
                req.body.jobCardImage = "";
            }
        }
        await Order.findByIdAndUpdate(req.body.orderId, req.body);
        res.status(200).json({ message: "Uploaded", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const allocateOrderToPatternCutter = async (req, res, next) => {
    try {
        let orderObj = await Order.findById(req.body.orderId).lean().exec();
        if (!orderObj) throw new Error("Order Not found");

        if (orderObj.orderStatusArr.some((el) => el.status === req.body.orderStatus || el.statusChangedByRole === req.body.role)) throw new Error("You have already updated this status");

        let temp = await Order.findByIdAndUpdate(req.body.orderId, {
            $push: { orderStatusArr: { status: req.body.orderStatus, statusChangedByRole: req.body.role, statusChangedBy: req.body.statusUpdatedBy } },
            orderStatus: req.body.orderStatus,
            finalOrderProductArr: req.body.finalOrderProductArr,
            patternCutterIdArr: req.body.patternCutterIdArr,
        })
            .lean()
            .exec();
        res.status(200).json({ message: "Uploaded", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
