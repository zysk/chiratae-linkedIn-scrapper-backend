// import authorizeJwt from "../middlewares/auth.middleware";

import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import Language from "../models/language.model";
import Product from "../models/product.model";
import ProductGroups from "../models/productGroups.model";
import ProductWithLanguage from "../models/productWithLanguage.model";

export const addProduct = async (req, res, next) => {
    try {
        if (req.body.companyLogo) {
            req.body.companyLogo = await storeFileAndReturnNameBase64(req.body.companyLogo)
        }

        console.log(req.body.productArr[0].media, "req.body.productArr")
        let arr = []

        for (const el of req.body.productArr) {
            let obj = {
                ...req.body,
                ...el
            }
            arr.push(obj)
        }
        let addedProductsArr = await Product.insertMany([...arr]);

        await ProductGroups({ ...req.body, productsArr: addedProductsArr.map(el => ({ productId: el._id })) }).save();

        //handle stock logs here
        // await new StockLogs({}).save()

        res.status(200).json({ message: "Product Added", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




export const getProducts = async (req, res, next) => {
    try {
        let addedProductsArr = await ProductGroups.find().lean().exec()

        if (req.query.returnProductData) {
            for (const el of addedProductsArr) {
                if (el.productsArr) {
                    for (const ele of el.productsArr) {
                        let productObj = await Product.findById(ele.productId).exec()
                        if (productObj) {
                            ele.productObj = productObj
                        }
                        else {
                            ele.productObj = {}
                        }
                    }
                }
            }
        }

        res.status(200).json({ message: "Products Found", data: addedProductsArr, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const getProductById = async (req, res, next) => {
    try {
        console.log(req.params.id)
        let productGroupsObj = await ProductGroups.findOne({ _id: req.params.id }).lean().exec();
        if (!productGroupsObj) {
            throw new Error("Product Not Found !!");
        }

        console.log(req.query.languageId, "req.query.languageId")


        let languageObj = {}

        if (req.query.languageId) {
            languageObj = await Language.findById(req.query.languageId).exec()
        }

        if (productGroupsObj.productsArr) {
            for (const ele of productGroupsObj.productsArr) {
                if (req.query.languageId && languageObj && `${languageObj.name}`.toLowerCase() != "english") {
                    let productObj = await ProductWithLanguage.findOne({ productId: ele.productId, languageId: req.query.languageId }).exec()
                    if (productObj) {
                        ele.productObj = productObj
                    }
                    else {
                        let productObj = await Product.findById(ele.productId).exec()
                        console.log(productObj, "productObj")
                        if (productObj) {
                            ele.productObj = {
                                _id: productObj._id,
                                name: "",
                                languageSupported: productObj?.languageSupported,
                                shortDescription: "",
                                longDescripton: "",
                                featureChecklist: {
                                    softwareDescription: productObj?.featureChecklist?.softwareDescription,
                                    softwareType: productObj?.featureChecklist?.softwareType,
                                    softwareData: productObj?.featureChecklist?.softwareData,
                                    farmAdmin: productObj?.featureChecklist?.farmAdmin,
                                    accountAccess: productObj?.featureChecklist?.accountAccess,
                                    usersPerAccount: productObj?.featureChecklist?.usersPerAccount,
                                    modeOfUse: productObj?.featureChecklist?.modeOfUse,
                                    cropPlanning: productObj?.featureChecklist?.cropPlanning,
                                    operationalPlanning: productObj?.featureChecklist?.operationalPlanning,
                                    precisionAgriculture: productObj?.featureChecklist?.precisionAgriculture,
                                    weatherForecast: productObj?.featureChecklist?.weatherForecast,
                                    soilHealth: productObj?.featureChecklist?.soilHealth,
                                    farmAnalytics: productObj?.featureChecklist?.farmAnalytics,
                                    fieldAndEquipmentRecords: productObj?.featureChecklist?.fieldAndEquipmentRecords,
                                    harvestAnalysis: productObj?.featureChecklist?.harvestAnalysis,
                                    hardwareAndConnectivity: productObj?.featureChecklist?.hardwareAndConnectivity,
                                    accounting: productObj?.featureChecklist?.accounting,
                                    others: "",
                                },
                                targetCustomer: {
                                    marketsServed: productObj?.targetCustomer?.marketsServed,
                                    typesOfFarmsServed: productObj?.targetCustomer?.typesOfFarmsServed,
                                    customers: productObj?.targetCustomer?.customers,
                                    farmSize: productObj?.targetCustomer?.farmSize,
                                    typeOfLeads: "",
                                    relevantCrops: productObj?.targetCustomer?.relevantCrops,
                                    otherRelevantCrops: "",
                                    capatibleWith: "",
                                    inCompatibeWith: "",
                                },
                                customerSupport: {
                                    isFreeTrialAvailable: productObj?.customerSupport?.isFreeTrialAvailable,
                                    typeOfCustomerSupport: productObj?.customerSupport?.typeOfCustomerSupport,
                                    trainingAvailable: productObj?.customerSupport?.trainingAvailable,
                                    isTrainingFree: "",
                                    typeOfTrainings: productObj?.customerSupport?.typeOfTrainings,
                                },
                                installation: {
                                    sofwareUse: productObj?.installation?.sofwareUse,
                                    averageTime: "",
                                    averageFees: "",
                                    pricingModel: productObj?.installation?.pricingModel,
                                    pricingDetails: "",
                                    differentSubscription: "",
                                    additionalAddOn: "",
                                    valuePropositions: "",
                                    competitors: "",
                                },
                                media: [],
                            }
                        }
                        else {
                            ele.productObj = {
                                name: "",
                                languageSupported: [],
                                shortDescription: "",
                                longDescripton: "",
                                featureChecklist: {
                                    softwareDescription: [],
                                    softwareType: [],
                                    softwareData: [],
                                    farmAdmin: [],
                                    accountAccess: {
                                        value: "",
                                    },
                                    usersPerAccount: [],
                                    modeOfUse: [],
                                    cropPlanning: [],
                                    operationalPlanning: [],
                                    precisionAgriculture: [],
                                    weatherForecast: [],
                                    soilHealth: [],
                                    farmAnalytics: [],
                                    fieldAndEquipmentRecords: [],
                                    harvestAnalysis: [],
                                    hardwareAndConnectivity: [],
                                    accounting: [],
                                    others: "",
                                },
                                targetCustomer: {
                                    marketsServed: [],
                                    typesOfFarmsServed: [],
                                    customers: {
                                        value: "",
                                    },
                                    farmSize: [],
                                    typeOfLeads: "",
                                    relevantCrops: [],
                                    otherRelevantCrops: "",
                                    capatibleWith: "",
                                    inCompatibeWith: "",
                                },
                                customerSupport: {
                                    isFreeTrialAvailable: {
                                        value: "",
                                    },
                                    typeOfCustomerSupport: [],
                                    trainingAvailable: {
                                        value: "",
                                    },
                                    isTrainingFree: "",
                                    typeOfTrainings: [],
                                },
                                installation: {
                                    sofwareUse: [],
                                    averageTime: "",
                                    averageFees: "",
                                    pricingModel: [],
                                    pricingDetails: "",
                                    differentSubscription: "",
                                    additionalAddOn: "",
                                    valuePropositions: "",
                                    competitors: "",
                                },
                                media: [],
                            }
                        }
                    }
                }
                else {
                    let productObj = await Product.findById(ele.productId).exec()
                    if (productObj) {
                        ele.productObj = productObj
                    }
                    else {
                        ele.productObj = {
                            name: "",
                            languageSupported: [{
                                value: ""
                            }],
                            shortDescription: "",
                            longDescripton: "",
                            featureChecklist: {
                                softwareDescription: [],
                                softwareType: [],
                                softwareData: [],
                                farmAdmin: [],
                                accountAccess: {
                                    value: "",
                                },
                                usersPerAccount: [],
                                modeOfUse: [],
                                cropPlanning: [],
                                operationalPlanning: [],
                                precisionAgriculture: [],
                                weatherForecast: [],
                                soilHealth: [],
                                farmAnalytics: [],
                                fieldAndEquipmentRecords: [],
                                harvestAnalysis: [],
                                hardwareAndConnectivity: [],
                                accounting: [],
                                others: "",
                            },
                            targetCustomer: {
                                marketsServed: [],
                                typesOfFarmsServed: [],
                                customers: {
                                    value: "",
                                },
                                farmSize: [],
                                typeOfLeads: "",
                                relevantCrops: [],
                                otherRelevantCrops: "",
                                capatibleWith: "",
                                inCompatibeWith: "",
                            },
                            customerSupport: {
                                isFreeTrialAvailable: {
                                    value: "",
                                },
                                typeOfCustomerSupport: [],
                                trainingAvailable: {
                                    value: "",
                                },
                                isTrainingFree: "",
                                typeOfTrainings: [],
                            },
                            installation: {
                                sofwareUse: [],
                                averageTime: "",
                                averageFees: "",
                                pricingModel: [],
                                pricingDetails: "",
                                differentSubscription: "",
                                additionalAddOn: "",
                                valuePropositions: "",
                                competitors: "",
                            },
                            media: [],
                        }
                    }
                }
            }
        }
        console.log(JSON.stringify(productGroupsObj, null, 2), "productGroupsObj")

        res.status(200).json({ message: "Products Found", data: productGroupsObj, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


export const updateProductById = async (req, res, next) => {
    try {
        // console.log(req.params.id)
        // let productObj = await Product.findOne({ _id: req.params.id }).exec();
        // if (!productObj) {
        //     throw new Error("Product Not Found !!");
        // }
        console.log(req.body)
        let languageObj = {}

        if (req.body.languageId) {
            languageObj = await Language.findById(req.body.languageId).exec()
        }

        console.log(languageObj.name)
        console.log(`${languageObj.name}` == "english", "ad")
        if (languageObj && `${languageObj.name}`.toLowerCase() == "english") {
            for (const el of req.body.productArr) {
                console.log("asd")
                let productWithoutLanguageObj = await Product.findOne({ _id: el.productId }).exec()
                console.log(productWithoutLanguageObj, "productWithoutLanguageObj")
                if (productWithoutLanguageObj) {
                    await Product.findByIdAndUpdate(productWithoutLanguageObj._id, el).exec()
                }
                else {
                    await new Product(el).save()
                }
            }
        }
        else {
            // console.log("productWithLanguage")
            for (const el of req.body.productArr) {
                let productWithLanguageObj = await ProductWithLanguage.findOne({ productId: el.productId, languageId: req.body.languageId }).exec()
                // console.log(productWithLanguageObj, "productWithLanguageObj")
                el.languageId = req.body.languageId
                if (productWithLanguageObj) {
                    await ProductWithLanguage.findByIdAndUpdate(productWithLanguageObj._id, el).exec()
                }
                else {
                    await new ProductWithLanguage(el).save()
                }
            }
        }

        res.status(200).json({ message: "Products Updated", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




