// import authorizeJwt from "../middlewares/auth.middleware";

import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import { escapeRegExp } from "../helpers/regexHelpers";
import Language from "../models/language.model";
import Conversion from "../models/conversion.model";
import Product from "../models/product.model";
import ProductGroups from "../models/productGroups.model";
import ProductWithLanguage from "../models/productWithLanguage.model";

export const addProduct = async (req, res, next) => {
    try {
        if (req.body.companyLogo) {
            req.body.companyLogo = await storeFileAndReturnNameBase64(req.body.companyLogo);
        }

        console.log(req.body.productArr[0].media, "req.body.productArr");
        let arr = [];

        for (const el of req.body.productArr) {
            let obj = {
                ...req.body,
                ...el,
            };

            for (const ele of el.fileArr) {
                ele.url = await storeFileAndReturnNameBase64(ele.url);
            }

            arr.push(obj);
        }
        let addedProductsArr = await Product.insertMany([...arr]);

        await ProductGroups({ ...req.body, productsArr: addedProductsArr.map((el) => ({ productId: el._id })) }).save();

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
        let addedProductsArr = await ProductGroups.find().lean().exec();

        if (req.query.returnProductData) {
            for (const el of addedProductsArr) {
                if (el.productsArr) {
                    for (const ele of el.productsArr) {
                        let productObj = await Product.findById(ele.productId).exec();
                        if (productObj) {
                            ele.productObj = productObj;
                        } else {
                            ele.productObj = {};
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
        console.log(req.params.id);
        let productGroupsObj = await ProductGroups.findOne({ _id: req.params.id }).lean().exec();
        if (!productGroupsObj) {
            throw new Error("Product Not Found !!");
        }
        // console.log(productGroupsObj, "productGroupsObj")

        // console.log(req.query.languageId, "req.query.languageId")

        let languageObj = {};

        if (req.query.languageId) {
            languageObj = await Language.findById(req.query.languageId).exec();
        }

        if (productGroupsObj.productsArr) {
            for (const ele of productGroupsObj.productsArr) {
                console.log({ productId: ele.productId, languageId: req.query.languageId }, "{ productId: ele.productId, languageId: req.query.languageId }");
                if (req.query.languageId && languageObj && `${languageObj.name}`.toLowerCase() != "english") {
                    let productObj = await ProductWithLanguage.findOne({ productId: ele.productId, languageId: req.query.languageId }).exec();
                    console.log(productObj, productObj?.languageId, productObj?.name, "product");
                    if (productObj) {
                        ele.productObj = productObj;
                    }
                    // productId: '637daf7591736bf30f30565a',
                    //     languageId: '6378a7e07b80cc71f69007af',
                    else {
                        let productObj = await Product.findById(ele.productId).exec();
                        console.log(productObj?.fileArr, "productObj", ele.productId);
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
                                    country: productObj?.targetCustomer.country,
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
                                    isTrainingFree: productObj?.customerSupport?.isTrainingFree,
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
                                fileArr: productObj?.fileArr,
                                mediaLinksArr: productObj?.mediaLinksArr,
                                caseStudies: productObj?.caseStudies,
                            };
                        } else {
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
                                    country: [],
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
                                fileArr: [],
                                mediaLinksArr: [],
                                caseStudies: [],
                            };
                        }
                    }
                } else {
                    let productObj = await Product.findById(ele.productId).exec();
                    // console.log(productObj, "productObj");
                    if (productObj) {
                        ele.productObj = productObj;
                    } else {
                        ele.productObj = {
                            name: "",
                            languageSupported: [
                                {
                                    value: "",
                                },
                            ],
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
                                country: [],
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
                            fileArr: [],
                            mediaLinksArr: [],
                            caseStudies: [],
                        };
                    }
                }
            }
        }
        // console.log(JSON.stringify(productGroupsObj, null, 2), "productGroupsObj")

        res.status(200).json({ message: "Products Found", data: productGroupsObj, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const getComparisionProductsProducts = async (req, res, next) => {
    try {
        console.log(req.query, "req.query");
        let tempArr = req.query.productArr;
        tempArr = tempArr.split(",");

        let productArr = await Product.find({ _id: { $in: [...tempArr] } })
            .lean()
            .exec();
        if (!productArr) {
            throw new Error("Product Not found ");
        }
        for (const el of productArr) {
            let productGroupsObj = await ProductGroups.findOne({ "productsArr.productId": el._id }).exec();
            console.log(productGroupsObj, "productGroupsObj");
            if (productGroupsObj) {
                el.productGroupsObj = productGroupsObj;
            }
        }

        res.status(200).json({ message: "Products Found", data: productArr, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const getProductByProductId = async (req, res, next) => {
    try {
        let languageObj = {};
        if (req.params.languageId) {
            languageObj = await Language.findById(req.params.languageId).exec();
        }
        let productObj = {};

        console.log(languageObj, "languageObj");

        if (`${languageObj?.name}`.toLowerCase() == "english") {
            productObj = await Product.findById(req.params.id).lean().exec();
            if (!productObj) {
                throw new Error("Product Not found ");
            }
            let productGroupsObj = await ProductGroups.findOne({ "productsArr.productId": productObj._id }).exec();
            if (productGroupsObj) {
                productObj.productGroupsObj = productGroupsObj;
            }

            let relatedProductsArr = await Product.find({ "targetCustomer.customers.value": { $in: [...productObj?.targetCustomer?.customers.map((el) => el?.value)] } })
                .lean()
                .exec();
            if (relatedProductsArr) {
                for (const el of relatedProductsArr) {
                    let productGroupsObj = await ProductGroups.findOne({ "productsArr.productId": el._id }).exec();
                    if (productGroupsObj) {
                        el.productGroupsObj = productGroupsObj;
                    }
                }
                // productObj.relatedProductsArr = relatedProductsArr
            }
        } else {
            productObj = await ProductWithLanguage.findById(req.params.id).lean().exec();
            if (!productObj) {
                throw new Error("Product Not found ");
            }
            let productGroupsObj = await ProductGroups.findOne({ "productsArr.productId": productObj.productId }).exec();
            if (productGroupsObj) {
                productObj.productGroupsObj = productGroupsObj;
            }

            let relatedProductsArr = await ProductWithLanguage.find({ "targetCustomer.customers.value": { $in: [...productObj?.targetCustomer?.customers.map((el) => el?.value)] } })
                .lean()
                .exec();
            if (relatedProductsArr) {
                // productObj.relatedProductsArr = relatedProductsArr
            }
        }

        console.log(JSON.stringify(productObj, null, 2));

        res.status(200).json({ message: "Products Found", data: productObj, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

//////////////////this api returns array of products which are displayed on category page in website (the array is filtered using the filters given on category page)
export const getFilteredProducts = async (req, res, next) => {
    try {
        let page = 0;
        let itemsPerPage = 0;
        let query = {};
        if (req.query.page) {
            page = req.query.page;
        }
        if (req.query.itemsPerPage) {
            itemsPerPage = req.query.itemsPerPage;
        }
        if (req.query.properties && req.query.properties != "[]" && JSON.parse(req.query.properties).length > 0) {
            let propertiesArr = JSON.parse(req.query.properties);
            let softwareDescriptionObj = propertiesArr.find((el) => el.name == "Farming Needs");
            let pricingObj = propertiesArr.find((el) => el.name == "Pricing");
            let farmTypeObj = propertiesArr.find((el) => el.name == "Farm Type");
            let targetUserObj = propertiesArr.find((el) => el.name == "Target User");
            let languageObj = propertiesArr.find((el) => el.name == "Language");
            let technologyObj = propertiesArr.find((el) => el.name == "Technology");
            if (softwareDescriptionObj) {
                query = {
                    ...query,
                    $and: [
                        ...softwareDescriptionObj?.values.map((el) => ({
                            "featureChecklist.softwareDescription.value": el?.value,
                        })),
                    ],
                };
            }
            if (pricingObj) {
                query = {
                    ...query,
                    $and: [
                        ...pricingObj?.values.map((el) => ({
                            "installation.pricingModel.value": el?.value,
                        })),
                    ],
                };
            }
            if (farmTypeObj) {
                query = {
                    ...query,
                    $and: [
                        ...farmTypeObj?.values.map((el) => ({
                            "targetCustomer.typesOfFarmsServed.value": el?.value,
                        })),
                    ],
                };
            }
            if (targetUserObj) {
                query = {
                    ...query,
                    $and: [
                        ...targetUserObj?.values.map((el) => ({
                            "targetCustomer.customers.value": el?.value,
                        })),
                    ],
                };
            }
            if (languageObj) {
                query = {
                    ...query,
                    $and: [
                        ...languageObj?.values.map((el) => ({
                            "languageSupported.value": el?.value,
                        })),
                    ],
                };
            }
            if (technologyObj) {
                query = {
                    ...query,
                    $and: [
                        ...technologyObj?.values.map((el) => ({
                            "featureChecklist.softwareData.value": el?.value,
                        })),
                    ],
                };
            }
        }
        console.log(typeof req.query.farmSize, "@@@@@@@@@@FARM");
        if (req.query.farmSize != "undefined" && req.query.farmSize && req.query.farmSize != "{}" && req.query.farmSize != undefined && req.query.farmSize != null) {
            if (req.query.farmSize) {
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                let value = JSON.parse(req.query.farmSize).value;
                if (value) {
                    if (value == "500  ha") {
                        query = { ...query, "targetCustomer.farmSize.value": "500+ ha" };
                    } else {
                        query = { ...query, "targetCustomer.farmSize.value": value };
                    }
                }
            }
        }
        let languageObj = await Language.findById(req.query.languageId).exec();

        let productsArr = [];
        let productsCount = 0;

        console.log(languageObj, "languageObj");

        if (!languageObj || `${languageObj.name}`.toLowerCase() == "english") {
            productsArr = await Product.find(query)
                .skip(itemsPerPage * page)
                .limit(itemsPerPage)
                .sort({ name: req.query.sort })
                .lean()
                .exec();
            console.log(productsArr[0], "productsArr");
            for (const el of productsArr) {
                let productGroupObj = await ProductGroups.findOne({ "productsArr.productId": el._id }).exec();
                el.productGroupObj = productGroupObj;
            }

            productsCount = await Product.find(query).count().exec();
        } else {
            query = { ...query, languageId: req.query.languageId };
            console.log(query, "ProductWithLanguage");

            productsArr = await ProductWithLanguage.find(query)
                .skip(itemsPerPage * page)
                .limit(itemsPerPage)
                .sort({ name: req.query.sort })
                .exec();
            for (const el of productsArr) {
                let productGroupObj = await ProductGroups.findOne({ "productsArr.productId": el._id }).exec();
                el.productGroupObj = productGroupObj;
            }
            productsCount = await ProductWithLanguage.find(query).count().exec();
        }

        res.status(200).json({ message: "Filtered Products Found", data: productsArr, maxCount: productsCount, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const updateProductById = async (req, res, next) => {
    try {
        // console.log(req.body, "req.body")
        let languageObj = {};
        if (req.body.languageId) {
            languageObj = await Language.findById(req.body.languageId).exec();
        }

        let englishObj = await Language.findOne({ name: new RegExp(`^English$`) }).exec();
        if (!englishObj) {
            throw new Error("English language not found please contact admin");
        }
        let englishConversionObj = await Conversion.findOne({ languageId: englishObj._id }).lean().exec();

        let englishConversionArr = [];

        for (const key in englishConversionObj) {
            if (Object.hasOwnProperty.call(englishConversionObj, key)) {
                englishConversionArr.push({ key: key, value: englishConversionObj[key] });
            }
        }

        let tempProductsArr = [];

        if (languageObj && `${languageObj.name}`.toLowerCase() == "english") {
            for (const el of req.body.productArr) {
                if (el.fileArr && el.fileArr.length > 0) {
                    for (const ele of el.fileArr) {
                        if (ele.url != "" && ele.url.includes("base64")) {
                            ele.url = await storeFileAndReturnNameBase64(ele.url);
                        }
                    }
                } else {
                    delete el.fileArr;
                }

                let productWithoutLanguageObj = await Product.findOne({ _id: el.productId }).exec();
                if (productWithoutLanguageObj) {
                    await Product.findByIdAndUpdate(productWithoutLanguageObj._id, el).exec();
                    let productWithLanguageArr = await ProductWithLanguage.find({ productId: productWithoutLanguageObj._id }).exec();

                    for (const elx of productWithLanguageArr) {
                        let conversionObj = await Conversion.findOne({ languageId: elx.languageId }).exec();

                        let obj = {
                            languageSupported: el?.languageSupported?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.softwareDescription": el?.featureChecklist?.softwareDescription?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.softwareType": el?.featureChecklist?.softwareType?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.softwareData": el?.featureChecklist?.softwareData?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.farmAdmin": el?.featureChecklist?.farmAdmin?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.accountAccess.value": el?.featureChecklist?.accountAccess?.value,
                            "featureChecklist.usersPerAccount": el?.featureChecklist?.usersPerAccount?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.modeOfUse": el?.featureChecklist?.modeOfUse?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.cropPlanning": el?.featureChecklist?.cropPlanning?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.operationalPlanning": el?.featureChecklist?.operationalPlanning?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.precisionAgriculture": el?.featureChecklist?.precisionAgriculture?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.weatherForecast": el?.featureChecklist?.weatherForecast?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.soilHealth": el?.featureChecklist?.soilHealth?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.farmAnalytics": el?.featureChecklist?.farmAnalytics?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.fieldAndEquipmentRecords": el?.featureChecklist?.fieldAndEquipmentRecords?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.harvestAnalysis": el?.featureChecklist?.harvestAnalysis?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.hardwareAndConnectivity": el?.featureChecklist?.hardwareAndConnectivity?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "featureChecklist.accounting": el?.featureChecklist?.accounting?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "targetCustomer.marketsServed": el?.targetCustomer?.marketsServed?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "targetCustomer.country": el?.targetCustomer?.country?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "targetCustomer.typesOfFarmsServed": el?.targetCustomer?.typesOfFarmsServed?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "targetCustomer.customers": el?.targetCustomer?.customers?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "targetCustomer.farmSize": el?.targetCustomer?.farmSize?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "targetCustomer.relevantCrops": el?.targetCustomer?.relevantCrops?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "customerSupport.isFreeTrialAvailable.value": el?.customerSupport?.isFreeTrialAvailable?.value,
                            "customerSupport.typeOfCustomerSupport": el?.customerSupport?.typeOfCustomerSupport?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "customerSupport.trainingAvailable.value": el?.customerSupport?.trainingAvailable?.value,
                            "customerSupport.isTrainingFree.value": el?.customerSupport?.isTrainingFree?.value,
                            "customerSupport.typeOfTrainings": el?.customerSupport?.typeOfTrainings?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "installation.sofwareUse": el?.installation?.sofwareUse?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            "installation.pricingModel": el?.installation?.pricingModel?.map((el) => {
                                if (englishConversionArr.find((elx) => elx.value == el?.value)) {
                                    let obj = {
                                        value: el?.value,
                                    };
                                    let tempValue = conversionObj[englishConversionArr.find((elx) => elx.value == el?.value)?.value];
                                    obj.label = tempValue;
                                    return obj;
                                }
                            }),
                            mediaLinksArr: el.mediaLinksArr,
                            caseStudies: el.caseStudies,
                        };
                        if (el.fileArr && el.fileArr.length > 0) {
                            obj.fileArr = el.fileArr;
                        }
                        await ProductWithLanguage.findByIdAndUpdate(elx._id, { $set: obj }).exec();
                    }
                } else {
                    let productObj = await new Product(el).save();
                    tempProductsArr.push(productObj);
                }
            }
        } else {
            for (const el of req.body.productArr) {
                let productWithLanguageObj = await ProductWithLanguage.findOne({ productId: el.productId, languageId: req.body.languageId }).exec();
                if (el.fileArr && el.fileArr.length > 0) {
                    // el.fileArr = el.fileArr.filter(elx => elx.url != "" && elx.url.includes("base64"))
                    for (const ele of el.fileArr) {
                        if (ele.url != "" && ele.url.includes("base64")) {
                            ele.url = await storeFileAndReturnNameBase64(ele.url);
                        } else {
                            ele.url = ele.url;
                        }
                    }
                } else {
                    delete el.fileArr;
                }
                el.languageId = req.body.languageId;
                if (productWithLanguageObj) {
                    await ProductWithLanguage.findByIdAndUpdate(productWithLanguageObj._id, el).exec();
                } else {
                    await new ProductWithLanguage(el).save();
                }

                let obj = {
                    languageSupported: el?.languageSupported?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.softwareDescription": el?.featureChecklist?.softwareDescription?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.softwareType": el?.featureChecklist?.softwareType?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.softwareData": el?.featureChecklist?.softwareData?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.farmAdmin": el?.featureChecklist?.farmAdmin?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.accountAccess.value": el?.featureChecklist?.accountAccess?.value,
                    "featureChecklist.usersPerAccount": el?.featureChecklist?.usersPerAccount?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.modeOfUse": el?.featureChecklist?.modeOfUse?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.cropPlanning": el?.featureChecklist?.cropPlanning?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.operationalPlanning": el?.featureChecklist?.operationalPlanning?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.precisionAgriculture": el?.featureChecklist?.precisionAgriculture?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.weatherForecast": el?.featureChecklist?.weatherForecast?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.soilHealth": el?.featureChecklist?.soilHealth?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.farmAnalytics": el?.featureChecklist?.farmAnalytics?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.fieldAndEquipmentRecords": el?.featureChecklist?.fieldAndEquipmentRecords?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.harvestAnalysis": el?.featureChecklist?.harvestAnalysis?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.hardwareAndConnectivity": el?.featureChecklist?.hardwareAndConnectivity?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "featureChecklist.accounting": el?.featureChecklist?.accounting?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "targetCustomer.marketsServed": el?.targetCustomer?.marketsServed?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "targetCustomer.country": el?.targetCustomer?.country?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "targetCustomer.typesOfFarmsServed": el?.targetCustomer?.typesOfFarmsServed?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "targetCustomer.customers": el?.targetCustomer?.customers?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "targetCustomer.farmSize": el?.targetCustomer?.farmSize?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "targetCustomer.relevantCrops": el?.targetCustomer?.relevantCrops?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "customerSupport.isFreeTrialAvailable.value": el?.customerSupport?.isFreeTrialAvailable?.value,
                    "customerSupport.typeOfCustomerSupport": el?.customerSupport?.typeOfCustomerSupport?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "customerSupport.trainingAvailable.value": el?.customerSupport?.trainingAvailable?.value,
                    "customerSupport.isTrainingFree.value": el?.customerSupport?.isTrainingFree?.value,
                    "customerSupport.typeOfTrainings": el?.customerSupport?.typeOfTrainings?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "installation.sofwareUse": el?.installation?.sofwareUse?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    "installation.pricingModel": el?.installation?.pricingModel?.map((el) => {
                        if (englishConversionArr.find((elm) => elm.value == el?.value)?.value) {
                            let obj = {
                                value: el?.value,
                            };
                            obj.label = englishConversionArr.find((elm) => elm.value == el?.value)?.value;
                            return obj;
                        }
                    }),
                    mediaLinksArr: el.mediaLinksArr,
                    caseStudies: el.caseStudies,
                };
                if (el.fileArr && el.fileArr.length > 0) {
                    obj.fileArr = el.fileArr;
                }
                console.log(JSON.stringify(obj, null, 2), "hardwareAndConnectivity", el.productId);

                let productWithoutLanguageObj = await Product.findByIdAndUpdate(el.productId, { $set: obj }, { new: true }).exec();
                console.log(JSON.stringify(productWithoutLanguageObj, null, 2), "productWithoutLanguageObj");
                console.log(productWithoutLanguageObj._id, "productWithoutLanguageObj", el.productId);
            }
        }

        // tempProductsArr = tempProductsArr.map(el => ({ productId: el._id }))
        // await ProductGroups.findByIdAndUpdate(req.body.productGroupId, { ...req.body, $push: { productsArr: { $each: tempProductsArr } } }).exec()

        res.status(200).json({ message: "Products Updated", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const DeleteProductById = async (req, res, next) => {
    try {
        let groupObj = await ProductGroups.findById(req.params.id).exec();
        console.log(groupObj, "groupObj");
        if (!groupObj) {
            throw new Error("Could not find or already delete please reload the page once");
        }

        await Product.deleteMany({ _id: [...groupObj.productsArr.map((el) => el.productId)] }).exec();
        await ProductWithLanguage.deleteMany({ productId: [...groupObj.productsArr.map((el) => el.productId)] }).exec();
        await ProductGroups.findByIdAndDelete(req.params.id).exec();

        res.status(200).json({ message: "Products Deleted", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const searchProductByName = async (req, res, next) => {
    try {
        console.log(req.query.productName, "req.query.productName");
        console.log(req.query, "req.query.productName");

        let languageObj = {};
        let productArr = [];
        if (req.query.languageId) {
            languageObj = await Language.findById(req.query.languageId).exec();
        }
        let searchQuery = {
            $or: [
                {
                    name: { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "languageSupported.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "languageSupported.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    shortDescription: { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    longDescripton: { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.softwareDescription.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.softwareDescription.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "featureChecklist.softwareType.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.softwareType.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.softwareData.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.softwareData.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.otherSoftwareData": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.farmAdmin.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.farmAdmin.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.accountAccess.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.accountAccess.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "featureChecklist.usersPerAccount.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.usersPerAccount.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.modeOfUse.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.modeOfUse.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.cropPlanning.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.cropPlanning.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.operationalPlanning.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.operationalPlanning.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "featureChecklist.precisionAgriculture.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.precisionAgriculture.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.weatherForecast.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.weatherForecast.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.soilHealth.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.soilHealth.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.farmAnalytics.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.farmAnalytics.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "featureChecklist.fieldAndEquipmentRecords.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.fieldAndEquipmentRecords.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.harvestAnalysis.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.harvestAnalysis.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.hardwareAndConnectivity.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.hardwareAndConnectivity.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "featureChecklist.accounting.label": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.accounting.value": { $regex: `${req.query.productName}`, $options: "i" },
                },
                {
                    "featureChecklist.others": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.marketsServed.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.marketsServed.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.country.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.country.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.typesOfFarmsServed.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.typesOfFarmsServed.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.customers.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.customers.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.otherCustomers": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.farmSize.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.farmSize.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.typeOfLeads": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.relevantCrops.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.relevantCrops.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.otherText": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.otherRelevantCrops": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.capatibleWith": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "targetCustomer.inCompatibeWith": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.isFreeTrialAvailable.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.isFreeTrialAvailable.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.trialLink": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.typeOfCustomerSupport.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.typeOfCustomerSupport.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.trainingAvailable.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.trainingAvailable.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.isTrainingFree.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.isTrainingFree.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.typeOfTrainings.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "customerSupport.typeOfTrainings.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.sofwareUse.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.sofwareUse.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.averageTime": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.startingAt": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.averageFees": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.pricingModel.label": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.pricingModel.value": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.pricingDetails": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.differentSubscription": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.additionalAddOn": { $regex: `${req.query.productName}`, $options: "i" },
                },

                {
                    "installation.competitors": { $regex: `${req.query.productName}`, $options: "i" },
                },
            ],
        };
        if (languageObj && `${languageObj.name}`.toLowerCase() != "english") {
            productArr = await ProductWithLanguage.find(searchQuery)
                .lean()
                .exec();
        } else {
           

            productArr = await Product.find(searchQuery).lean().exec();
        }
        for (const el of productArr) {
            let productGroupObj = await ProductGroups.findOne({ "productsArr.productId": el._id }).exec();
            el.productGroupObj = productGroupObj;
        }
        console.log(productArr && productArr.length);

        productArr = productArr.map((el) => ({ name: el.name, _id: el._id, shortDescription: el.shortDescription, productImage: el.productGroupObj.companyLogo }));

        res.status(200).json({ message: "Found Products", data: productArr, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};
