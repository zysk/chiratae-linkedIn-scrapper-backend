import Language from "../models/language.model";
import Product from "../models/product.model";
import ProductGroups from "../models/productGroups.model";
import ProductWithLanguage from "../models/productWithLanguage.model";
import leadsModel from "../models/leads.model";
import { CountryLsit, LanguageList } from "../helpers/Constants";


export const getDashBoard = async (req, res, next) => {
    try {

        let totalCompany = await ProductGroups.countDocuments().exec();
        let totalProducts = await Product.countDocuments().exec();
        let totalLead = await leadsModel.countDocuments().exec();
        let countryProducts = CountryLsit;
        for (let index = 0; index < countryProducts.length; index++) {
            let country = countryProducts[index];
             let ProductsCount = await ProductGroups.countDocuments({"companyCountryArr.value":country.value}).exec();
             countryProducts[index].count  = ProductsCount;
        }

        let languageProducts = LanguageList;
        for (let index = 0; index < languageProducts.length; index++) {
            let country = languageProducts[index];
             let ProductsCount = await Product.countDocuments({"languageSupported.value":country.value}).exec();
             languageProducts[index].count  = ProductsCount;
        }

        let producArr = await Product.find({}).lean().exec();
        for (let index = 0; index < producArr.length; index++) {
            let element = producArr[index];
             let leadCount  = await leadsModel.countDocuments({productId:element?._id}).exec();
             element.leadCount = leadCount;
        }

       let data = {
        totalCompany,
        totalProducts,
        totalLead,
        countryProducts,
        languageProducts,
        producArr
       }
       
        res.status(200).json({ message: "Contacts found",data:data,  success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
