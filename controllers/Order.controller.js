import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import Order from "../models/Order.model";
import Users from "../models/users.model";
import Fabric from "../models/Fabric.model";
import CustomerMeasurements from "../models/CustomerMeasurement.model";
import Tailor from "../models/Tailor.model";
import MeasurementProduct from "../models/MeasurementProduct.model";
export const addOrder = async (req, res, next) => {
    try {
        if (!req.body.customerId) {
            throw new Error("Customer Id is required");
        }
        // if (!req.body.salesId) {
        //     throw new Error("Sales Id is required");
        // }
        // if (req.body.patternImage) {
        //     try {
        //         req.body.patternImage = await storeFileAndReturnNameBase64(req.body.patternImage);
        //     } catch (error) {
        //         console.error(error);
        //         req.body.patternImage = "";
        //     }
        // }
        // if (req.body.jobCardImage) {
        //     try {
        //         req.body.jobCardImage = await storeFileAndReturnNameBase64(req.body.jobCardImage);
        //     } catch (error) {
        //         console.error(error);
        //         req.body.jobCardImage = "";
        //     }
        // }

        for (let el of req.body.finalOrderProductArr) {
            for (let elx of el.productIdArr) {
                let customerMeasurementObj = await CustomerMeasurements.findOne({ customerId: req.body.customerId, measurementProductId: elx.measurementProductId }).exec();
                if (!customerMeasurementObj) {
                    throw new Error(`Please add measurement for ${elx.name}`);
                }
                elx.detailsArr = customerMeasurementObj.detailsArr;
            }
        }
        console.log(JSON.stringify(req.body.finalOrderProductArr, null, 2));

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
            for (let elz of el.finalOrderProductArr) {
                for (let elx of elz.productIdArr) {
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
                console.log(el.tailorIdArr, "@@@");
                if (el.tailorIdArr) {
                    console.log("INSIDE 1");
                    for (let elx of el.tailorIdArr) {
                        console.log(elx);
                        let tempObj = await Tailor.findById(elx.tailorId).exec();
                        console.log(tempObj, "SMP");
                        if (tempObj) {
                            elx.tailorObj = tempObj;
                        }
                        let tempProductObj = await MeasurementProduct.findById(elx.productId).exec();
                        console.log(tempProductObj);
                        if (tempProductObj) {
                            elx.productObj = tempProductObj;
                        }
                    }
                }
            }

            // console.log(tempFabricArr);
            el.fabricArr = tempFabricArr;
        }
        console.log(JSON.stringify(orders[orders.length - 2], null, 2));
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
        if (orderObj.orderStatusArr.some((el) => el.status === req.body.orderStatus)) throw new Error("You have already updated this status");

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
        let orderObj = await Order.findById(req.body._id).lean().exec();
        if (!orderObj) throw new Error("Order Not found");
        for (let el of req.body.finalOrderProductArr) {
            for (let elx of el.productIdArr) {
                if (elx.patternImage) {
                    try {
                        elx.patternImage = await storeFileAndReturnNameBase64(elx.patternImage);
                    } catch (error) {
                        console.error(error);
                        elx.patternImage = "";
                    }
                }
                if (elx.jobCardImage1) {
                    try {
                        elx.jobCardImage1 = await storeFileAndReturnNameBase64(elx.jobCardImage1);
                    } catch (error) {
                        console.error(error);
                        elx.jobCardImage1 = "";
                    }
                }
            }
        }
        await Order.findByIdAndUpdate(req.body._id, req.body);
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

        if (orderObj.orderStatusArr.some((el) => el.status === req.body.orderStatus)) throw new Error("You have already updated this status");

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

export const allocateOrderToTailor = async (req, res, next) => {
    try {
        let orderObj = await Order.findById(req.body.orderId).lean().exec();
        if (!orderObj) throw new Error("Order Not found");

        if (orderObj.orderStatusArr.some((el) => el.status === req.body.orderStatus)) throw new Error("You have already updated this status");

        let temp = await Order.findByIdAndUpdate(req.body.orderId, {
            $push: { orderStatusArr: { status: req.body.orderStatus, statusChangedByRole: req.body.role, statusChangedBy: req.body.statusUpdatedBy } },
            orderStatus: req.body.orderStatus,
            tailorIdArr: req.body.tailorIdArr,
        })
            .lean()
            .exec();
        res.status(200).json({ message: "Order Status Updated", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const allocateOrderToQC = async (req, res, next) => {
    try {
        let orderObj = await Order.findById(req.body.orderId).lean().exec();
        if (!orderObj) throw new Error("Order Not found");

        if (orderObj.orderStatusArr.some((el) => el.status === req.body.orderStatus)) throw new Error("You have already updated this status");

        let temp = await Order.findByIdAndUpdate(req.body.orderId, {
            $push: { orderStatusArr: { status: req.body.orderStatus, statusChangedByRole: req.body.role, statusChangedBy: req.body.statusUpdatedBy } },
            orderStatus: req.body.orderStatus,
            qcIdArr: req.body.qcIdArr,
        })
            .lean()
            .exec();
        res.status(200).json({ message: "Order Status Updated", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
