import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import Order from "../models/Order.model";
import Users from "../models/users.model";
import Fabric from "../models/Fabric.model";
import CustomerMeasurements from "../models/CustomerMeasurement.model";
import Tailor from "../models/Tailor.model";
import MeasurementProduct from "../models/MeasurementProduct.model";
import QualityControlChecks from "../models/QualityControlChecks.model";
import TailorOrders from "../models/tailorOrders";
import QcOrders from "../models/QcOrders";
import InhouseOrders from "../models/InhouseOrders";
import { rolesObj } from "../helpers/Constants";
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
                let qualityCheckArr = await QualityControlChecks.find({ "productArr.productId": elx.measurementProductId }).exec();
                if (!qualityCheckArr || qualityCheckArr.length == 0) throw new Error(`Please add quality check for ${elx.name}`);
                // console.log(qualityCheckArr, "qualityCheckArr");
                elx.qualityChecksArr = qualityCheckArr.map((el) => {
                    return {
                        qualityCheckId: el._id,
                        qualityCheckName: el.name,
                    };
                });
            }
        }
        // console.log(JSON.stringify(req.body.finalOrderProductArr, null, 2));

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

export const getById = async (req, res, next) => {
    try {
        let orderObj = await Order.findById(req.params.id).lean().exec();
        if (orderObj) {
            let tempFabricArr = [];
            let tempObj = await Users.findById(orderObj.customerId).lean().exec();
            if (tempObj) {
                orderObj.customer = tempObj.name;
            }
            if (orderObj.salesId) {
                let tempSalesObj = await Users.findById(orderObj.salesId).lean().exec();
                if (tempObj) {
                    orderObj.sales = tempSalesObj.name;
                }
            } else {
                orderObj.sales = "mft";
            }
            for (let elz of orderObj.finalOrderProductArr) {
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
                console.log(orderObj.tailorIdArr, "@@@");
                if (orderObj.tailorIdArr) {
                    console.log("INSIDE 1");
                    for (let elx of orderObj.tailorIdArr) {
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
            orderObj.fabricArr = tempFabricArr;
        }
        res.status(200).json({ data: orderObj, success: true });
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
        })
            .lean()
            .exec();

        await TailorOrders.insertMany(req.body.tailorArr);
        res.status(200).json({ message: "Order Status Updated", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const allocateOrderToQC = async (req, res, next) => {
    try {
        console.log(req.body, "QC");
        let orderObj = await Order.findById(req.body.orderId).lean().exec();
        if (!orderObj) throw new Error("Order Not found");

        if (orderObj.orderStatusArr.some((el) => el.status === req.body.orderStatus)) throw new Error("You have already updated this status");

        await Order.findByIdAndUpdate(req.body.orderId, {
            $push: { orderStatusArr: { status: req.body.orderStatus, statusChangedByRole: req.body.role, statusChangedBy: req.body.statusUpdatedBy } },
            orderStatus: req.body.orderStatus,
        })
            .lean()
            .exec();
        let qcObj = {
            orderId: req.body.orderId,
            productObj: req.body.productObj,
            tailorId: req.body.tailorId,
            qcId: req.body.qcId,
        };
        console.log(qcObj, "QCOBJ");
        await new QcOrders(qcObj).save();
        res.status(200).json({ message: "Order Status Updated", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getTailorOrdersByOrderId = async (req, res, next) => {
    try {
        let orderArr = await TailorOrders.find({ orderId: req.params.id }).lean().exec();

        res.status(200).json({ message: "orderArr", data: orderArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getQcOrders = async (req, res, next) => {
    try {
        let orderArr = await QcOrders.find({ qcId: req.params.id }).lean().exec();

        res.status(200).json({ message: "orderArr", data: orderArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const TransferOrderInhouse = async (req, res, next) => {
    try {
        console.log(req.body);
        let orderObj = await Order.findById(req.body.orderId).lean().exec();
        if (!orderObj) throw new Error("Order Not found");

        if (orderObj.orderStatusArr.some((el) => el.status === req.body.orderStatus)) throw new Error("You have already updated this status");

        await Order.findByIdAndUpdate(req.body.orderId, {
            $push: { orderStatusArr: { status: req.body.orderStatus, statusChangedByRole: req.body.role, statusChangedBy: req.body.statusUpdatedBy } },
            orderStatus: req.body.orderStatus,
        })
            .lean()
            .exec();
        let qcObj = {
            orderId: req.body.orderId,
            productObj: req.body.productObj,
            tailorId: req.body.tailorId,
            qcId: req.body.qcId,
        };
        await new InhouseOrders(qcObj).save();
        res.status(200).json({ message: "Order transfered to qc", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getInhouseOrders = async (req, res, next) => {
    try {
        let orderArr = await InhouseOrders.find().lean().exec();

        res.status(200).json({ message: "orderArr", data: orderArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getTailorsAvialabilityByDate = async (req, res, next) => {
    try {
        console.log(req.query);
        let searchDate = new Date(req.query.search);
        let searchDateStartTime = searchDate.setHours(0, 0, 0, 0);
        let searchDateEndTime = searchDate.setHours(23, 59, 59);

        let tailorsArr = await Tailor.find().lean().exec();

        for (const el of tailorsArr) {
            let tailorOrdersCount = await TailorOrders.find({ tailorId: el._id, completionDate: { $gte: searchDateStartTime, $lte: searchDateEndTime } })
                .count()
                .exec();
            // console.log(tailorOrdersCount)
            el.ordersCount = tailorOrdersCount;
            console.log(el.perDayCapacity, tailorOrdersCount, el.perDayCapacity < tailorOrdersCount);

            if (el.perDayCapacity > tailorOrdersCount) {
                el.isAvialable = "Available";
            } else {
                el.isAvialable = "Not Available";
            }
        }
        // let tailorObj = await Tailor.find({ $or: [{ phone: req.query.search }, { uid: req.query.search }] }).exec();
        res.status(200).json({ message: "Tailor", data: tailorsArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getCustomerOrderByDate = async (req, res, next) => {
    try {
        console.log(req.query);
        let searchDate = new Date(req.query.search);
        let searchDateStartTime = searchDate.setHours(0, 0, 0, 0);
        let searchDateEndTime = searchDate.setHours(23, 59, 59);

        let customerArr = await Users.find({ role: rolesObj.CUSTOMER }).lean().exec();

        for (const el of customerArr) {
            let customerOrdersArr = await Order.find({ customerId: el._id, createdAt: { $gte: searchDateStartTime, $lte: searchDateEndTime } }).exec();
            // console.log(tailorOrdersCount)
            el.ordersCount = customerOrdersArr.length;
            el.totalPrice = customerOrdersArr.reduce((acc, el) => acc + el.price, 0);
            el.customerOrderArr = customerOrdersArr;
            console.log(el.perDayCapacity, customerOrdersArr, el.perDayCapacity < customerOrdersArr);
        }
        // let tailorObj = await Tailor.find({ $or: [{ phone: req.query.search }, { uid: req.query.search }] }).exec();
        res.status(200).json({ message: "Customer order", data: customerArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
