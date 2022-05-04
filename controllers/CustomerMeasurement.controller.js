import CustomerMeasurement from "../models/CustomerMeasurement.model";
import MeasurementProduct from "../models/MeasurementProduct.model";
import User from "../models/users.model";
export const addCustomerMeasurement = async (req, res, next) => {
    try {
        const existCheck = await CustomerMeasurement.findOne({ customerId: req.body.customerId, measurementProductId: req.body.measurementProductId });
        if (existCheck) throw new Error("Measurement Already Exists");
        await new CustomerMeasurement(req.body).save();
        res.status(200).json({ message: "CustomerMeasurement Created Successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getAllCustomerMeasurements = async (req, res, next) => {
    try {
        let CustomerMeasurements = await CustomerMeasurement.find({ customerId: req.params.id }).lean().exec();
        for (let el of CustomerMeasurements) {
            let tempObj = await User.findById(el.customerId).exec();
            if (tempObj) {
                el.customer = tempObj.name;
            }
            let tempMeasurementProductObj = await MeasurementProduct.findById(el.measurementProductId).exec();
            if (tempMeasurementProductObj) {
                el.measurementProduct = tempMeasurementProductObj.name;
            }
        }
        res.status(200).json({ data: CustomerMeasurements, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        let CustomerMeasurements = await CustomerMeasurement.findById(req.params.id).lean().exec();
        res.status(200).json({ message: "Customer Measurement", data: CustomerMeasurements, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateCustomerMeasurement = async (req, res, next) => {
    try {
        await CustomerMeasurement.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteCustomerMeasurement = async (req, res, next) => {
    try {
        let CustomerMeasurementObj = await CustomerMeasurement.findByIdAndRemove(req.params.id).exec();
        res.status(200).json({ data: CustomerMeasurementObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
