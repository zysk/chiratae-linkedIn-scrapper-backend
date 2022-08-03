import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import Category from "../models/category.model";

export const addCategory = async (req, res, next) => {
    try {
        console.log(req.body);
        const CategoryNameCheck = await Category.findOne({ $or: [{ name: new RegExp(`^${req.body.name}$`, "i") }, { url: new RegExp(`^${req.body.url}$`) }] }).exec();
        if (CategoryNameCheck) throw new Error("Entry Already exist please change brand name or url");
        let obj = {};
        if (req.body.imageStr) {
            req.body.imageStr = await storeFileAndReturnNameBase64(req.body.imageStr);
        }
        if (req.body.parentCategoryId) {
            let categoryObj = await Category.findById(req.body.parentCategoryId).lean().exec();
            let parentCategoryArr = [...categoryObj.parentCategoryArr];
            parentCategoryArr.push({ parentId: categoryObj._id });
            obj = {
                ...req.body,
                order: categoryObj.order + 1,
                level: categoryObj.level + 1,
                parentCategoryArr,
            };
        } else {
            const categoryCount = await Category.countDocuments({ level: 1 }).exec();
            obj = { ...req.body, order: categoryCount + 1, level: 1 };
        }
        let newEntry = new Category(obj).save();
        if (!newEntry) throw new Error("Unable to create Category");
        res.status(200).json({ message: "Category Successfully Created", success: true });
    } catch (err) {
        next(err);
    }
};
export const getCategory = async (req, res, next) => {
    try {
        const getCategory = await Category.find().exec();
        // console.log(getCategory, "efnwfnewfo")
        res.status(200).json({ message: "getCategory", data: getCategory, success: true });
    } catch (err) {
        next(err);
    }
};

export const updateById = async (req, res, next) => {
    try {
        console.log(req.body, "pyuio");
        if (await Category.findOne({ name: req.body.name }).exec()) throw { status: 400, message: `this ${req.body.name} category exist` };
        const categoryObj = await Category.findByIdAndUpdate(req.params.id, req.body).exec();
        if (!categoryObj) throw { status: 400, message: "category  Not Found" };
        res.status(200).json({ message: "category Updated", success: true });
    } catch (err) {
        next(err);
    }
};
export const deleteById = async (req, res, next) => {
    try {
        const categoryObj = await Category.findByIdAndDelete(req.params.id).exec();
        if (!categoryObj) throw { status: 400, message: "category Not Found" };
        res.status(200).json({ message: "category Deleted", success: true });
    } catch (err) {
        next(err);
    }
};
