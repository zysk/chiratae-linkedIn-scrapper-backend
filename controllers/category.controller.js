import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import Category from "../models/category.model";

export const addCategory = async (req, res, next) => {
    try {
        console.log(req.body);
        const CategoryNameCheck = await Category.findOne({ $or: [{ name: new RegExp(`^${req.body.name}$`, "i") }, { slug: new RegExp(`^${req.body.slug}$`) }] }).exec();
        if (CategoryNameCheck) throw new Error("Entry Already exist please change brand name or url");
        let obj = {};
        if (req.body.imageStr) {
            req.body.categoryImage = await storeFileAndReturnNameBase64(req.body.imageStr);
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
        let categoryArr = await Category.find().lean().exec();
        // console.log(getCategory, "efnwfnewfo")
        for (let el of categoryArr) {
            console.log(el);
            if (el.parentCategoryId) {
                let parentObj = await Category.findById(el.parentCategoryId).lean().exec();
                if (parentObj) {
                    el.parentCategoryName = parentObj.name;
                }
            }
        }
        res.status(200).json({ message: "getCategory", data: categoryArr, success: true });
    } catch (err) {
        next(err);
    }
};

export const updateById = async (req, res, next) => {
    try {
<<<<<<< HEAD
        console.log(req.body, "pyuio")
        const categoryName = await category.findOne({ name: req.body.name }).exec()
        if (categoryName) throw ({ status: 400, message: `this ${req.body.name} category exist` });
        const categoryObj = await category.findByIdAndUpdate(req.params.id, req.body).exec();
        if (!categoryObj) throw ({ status: 400, message: "category  Not Found" });
=======
        console.log(req.body, "pyuio");
        if (await Category.findOne({ name: req.body.name }).exec()) throw { status: 400, message: `this ${req.body.name} category exist` };
        const categoryObj = await Category.findByIdAndUpdate(req.params.id, req.body).exec();
        if (!categoryObj) throw { status: 400, message: "category  Not Found" };
>>>>>>> ace611778bc698f1a6c25f2d894056ed8717d7a5
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
