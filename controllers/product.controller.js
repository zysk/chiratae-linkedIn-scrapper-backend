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
                                    infieldanalytics: productObj?.featureChecklist?.infieldanalytics,
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


export const getProductByProductId = async (req, res, next) => {
    try {


        let productObj = await Product.findById(req.params.id).lean().exec()
        if (!productObj) {
            throw new Error("Product Not found ")
        }

        let productGroupsObj = await ProductGroups.findOne({ "productsArr.productId": productObj._id }).exec();
        console.log(productGroupsObj, "productGroupsObj")
        if (productGroupsObj) {
            productObj.productGroupsObj = productGroupsObj
        }

        res.status(200).json({ message: "Products Found", data: productObj, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


//////////////////this api returns array of products which are displayed on category page in website (the array is filtered using the filters given on category page)
export const getFilteredProducts = async (req, res, next) => {
    try {


        let query = {}
        console.log(req.query, "asds")
        if (req.query.page) {
            console.log(req.query.page)
        }
        if (req.query.properties && JSON.parse(req.query.properties).length > 0) {
            let propertiesArr = JSON.parse(req.query.properties)
            let softwareDescriptionObj = propertiesArr.find(el => el.name == "Farming Needs");
            let pricingObj = propertiesArr.find(el => el.name == "Pricing");
            let farmTypeObj = propertiesArr.find(el => el.name == "Farm Type");
            let targetUserObj = propertiesArr.find(el => el.name == "Target User");
            let languageObj = propertiesArr.find(el => el.name == "Language");
            let technologyObj = propertiesArr.find(el => el.name == "Technology");
            let marketsServedObj = propertiesArr.find(el => el.name == "Markets Served");
            let featuresObj = propertiesArr.find(el => el.name == "Features");
            console.log(pricingObj, "pricingObj")

            if (softwareDescriptionObj) {
                query = {
                    ...query,
                    $and: [
                        ...softwareDescriptionObj?.values.map(
                            el => ({
                                "featureChecklist.softwareDescription.value": el.value
                            })
                        ),
                    ]
                }
            }
            if (pricingObj) {
                query = {
                    ...query,
                    $and: [
                        ...pricingObj?.values.map(
                            el => ({
                                "installation.pricingModel.value": el.value
                            })
                        )
                    ]
                }
            }
            if (farmTypeObj) {
                query = {
                    ...query,
                    $and: [
                        ...farmTypeObj?.values.map(
                            el => ({
                                "targetCustomer.typesOfFarmsServed.value": el.value
                            })
                        )
                    ]
                }
            }
            if (targetUserObj) {
                query = {
                    ...query,
                    $and: [
                        ...targetUserObj?.values.map(
                            el => ({
                                "targetCustomer.customers.value": el.value
                            })
                        )
                    ]
                }
            }
            if (languageObj) {
                query = {
                    ...query,
                    $and: [
                        ...languageObj?.values.map(
                            el => ({
                                "languageSupported.value": el.value
                            })
                        )
                    ]
                }
            }
            if (technologyObj) {
                query = {
                    ...query,
                    $and: [
                        ...technologyObj?.values.map(
                            el => ({
                                "featureChecklist.softwareData.value": el.value
                            })
                        )
                    ]
                }
            }
            if (marketsServedObj) {
                query = {
                    ...query,
                    $and: [
                        ...marketsServedObj?.values.map(
                            el => ({
                                "targetCustomer.marketsServed.value": el.value
                            })
                        )
                    ]
                }
            }
            if (featuresObj) {
                query = {
                    ...query,
                    $or: [
                        {
                            $and: [
                                ...featuresObj?.values.map(
                                    el => ({
                                        "featureChecklist.farmAdmin.value": el.value
                                    })
                                )
                            ]
                        },
                        {
                            $and: [
                                ...featuresObj?.values.map(
                                    el => ({
                                        "featureChecklist.cropPlanning.value": el.value
                                    })
                                )
                            ]
                        },
                        {
                            $and: [
                                ...featuresObj?.values.map(
                                    el => ({
                                        "featureChecklist.precisionAgriculture.value": el.value
                                    })
                                )
                            ]
                        },
                        {
                            $and: [
                                ...featuresObj?.values.map(
                                    el => ({
                                        "featureChecklist.weatherForecast.value": el.value
                                    })
                                )
                            ]
                        },
                        {
                            $and: [
                                ...featuresObj?.values.map(
                                    el => ({
                                        "featureChecklist.harvestAnalysis.value": el.value
                                    })
                                )
                            ]
                        },
                        {
                            $and: [
                                ...featuresObj?.values.map(
                                    el => ({
                                        "featureChecklist.soilHealth.value": el.value
                                    })
                                )
                            ]
                        },
                        {
                            $and: [
                                ...featuresObj?.values.map(
                                    el => ({
                                        "featureChecklist.farmAnalytics.value": el.value
                                    })
                                )
                            ]
                        },

                    ]

                }
            }
            console.log(JSON.stringify(propertiesArr, null, 2), "Asd")
        }

        if (req.query.farmSize && JSON.parse(req.query.farmSize).value) {
            let value = JSON.parse(req.query.farmSize).value
            if (value) {

                if (value == "500  ha") {
                    query = { ...query, "targetCustomer.farmSize.value": "500+ ha" }
                }
                else {
                    query = { ...query, "targetCustomer.farmSize.value": value }
                }
            }
        }


        console.log(query, "query")
        let productsArr = await Product.find(query).exec()



        res.status(200).json({ message: "Filtered Products Found", data: productsArr, maxCount: productsArr.length, success: true });
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
                    // await Product.findByIdAndUpdate(el.productI, el).exec()
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

export const DeleteProductById = async (req, res, next) => {
    try {
        let groupObj = await ProductGroups.findById(req.params.id).exec()
        console.log(groupObj, "groupObj")
        if (!groupObj) {
            throw new Error("Could not find or already delete please reload the page once")
        }

        await Product.deleteMany({ _id: [...groupObj.productsArr.map(el => el.productId)] }).exec()
        await ProductWithLanguage.deleteMany({ productId: [...groupObj.productsArr.map(el => el.productId)] }).exec()
        await ProductGroups.findByIdAndDelete(req.params.id).exec()

        res.status(200).json({ message: "Products Deleted", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




