import Language from "../models/language.model";
import Product from "../models/product.model";
import ProductGroups from "../models/productGroups.model";
import ProductWithLanguage from "../models/productWithLanguage.model";
import leadsModel from "../models/leads.model";
import { CountryLsit, coustmersList, farmSizeList, farmTypeList, LanguageList, marketsServedList } from "../helpers/Constants";


export const getDashBoard = async (req, res, next) => {
    try {

        let totalCompany = await ProductGroups.countDocuments().exec();
        let totalProducts = await Product.countDocuments().exec();
        let totalLead = await leadsModel.countDocuments().exec();
        let leadArr  = await leadsModel.find({}).exec();
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

        let marketsServedProducts = marketsServedList;
        for (let index = 0; index < marketsServedProducts.length; index++) {
            let country = marketsServedProducts[index];
             let ProductsCount = await Product.countDocuments({"targetCustomer.marketsServed.value":country.value}).exec();
             marketsServedProducts[index].count  = ProductsCount;
        }

        let farmTypeProducts = farmTypeList;
        for (let index = 0; index < farmTypeProducts.length; index++) {
            let country = farmTypeProducts[index];
             let ProductsCount = await Product.countDocuments({"targetCustomer.typesOfFarmsServed.value":country.value}).exec();
             farmTypeProducts[index].count  = ProductsCount;
        }


        let customerProducts = coustmersList;
        for (let index = 0; index < customerProducts.length; index++) {
            let country = customerProducts[index];
             let ProductsCount = await Product.countDocuments({"targetCustomer.customers.value":country.value}).exec();
             customerProducts[index].count  = ProductsCount;
        }

        let farmSizeProducts = farmSizeList;
        for (let index = 0; index < farmSizeProducts.length; index++) {
            let country = farmSizeProducts[index];
             let ProductsCount = await Product.countDocuments({"targetCustomer.farmSize.value":country.value}).exec();
             farmSizeProducts[index].count  = ProductsCount;
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
        marketsServedProducts,
        farmTypeProducts,
        farmSizeProducts,
        customerProducts,
        producArr,
        leadArr
       }
       
        res.status(200).json({ message: "Dashboards List",data:data,  success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
