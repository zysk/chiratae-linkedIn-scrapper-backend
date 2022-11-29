import mongoose from "mongoose";

let productWithLanguage = mongoose.Schema(
    {
        name: String,
        productId: String,
        languageId: String,
        languageSupported: [{
            label: String,
            value: String
        }],
        shortDescription: String,
        longDescripton: String,
        featureChecklist: {
            softwareDescription: [{
                label: String,
                value: String
            }],
            softwareType: [{
                label: String,
                value: String
            }],
            softwareData: [{
                label: String,
                value: String
            }],
            otherSoftwareData: String,
            farmAdmin: [{
                label: String,
                value: String
            }],
            accountAccess: {
                label: String,
                value: String,
            },
            usersPerAccount: [{
                label: String,
                value: String
            }],
            modeOfUse: [{
                label: String,
                value: String
            }],
            cropPlanning: [{
                label: String,
                value: String
            }],
            operationalPlanning: [{
                label: String,
                value: String
            }],
            precisionAgriculture: [{
                label: String,
                value: String
            }],
            weatherForecast: [{
                label: String,
                value: String
            }],
            soilHealth: [{
                label: String,
                value: String
            }],
            farmAnalytics: [{
                label: String,
                value: String
            }],
            fieldAndEquipmentRecords: [{
                label: String,
                value: String
            }],
            harvestAnalysis: [{
                label: String,
                value: String
            }],
            hardwareAndConnectivity: [{
                label: String,
                value: String
            }],
            accounting: [{
                label: String,
                value: String
            }],
            others: String,
        },
        targetCustomer: {
            marketsServed: [{
                label: String,
                value: String
            }],
            country: [{
                label: String,
                value: String,
            }],
            typesOfFarmsServed: [{
                label: String,
                value: String
            }],
            customers: [{
                label: String,
                value: String,
            }],
            otherCustomers: String,
            farmSize: [{
                label: String,
                value: String
            }],
            typeOfLeads: String,
            relevantCrops: [{
                label: String,
                value: String
            }],
            otherText: String,
            otherRelevantCrops: String,
            capatibleWith: String,
            inCompatibeWith: String,
        },
        customerSupport: {
            isFreeTrialAvailable: {
                label: String,
                value: String,
            },
            typeOfCustomerSupport: [{
                label: String,
                value: String
            }],
            trainingAvailable: {
                label: String,
                value: String,
            },
            isTrainingFree: {
                label: String,
                value: String,
            },
            typeOfTrainings: [{
                label: String,
                value: String
            }],
        },
        installation: {
            sofwareUse: [{
                label: String,
                value: String
            }],
            averageTime: String,
            startingAt: String,
            averageFees: String,
            pricingModel: [{
                label: String,
                value: String
            }],
            pricingDetails: String,
            differentSubscription: String,
            additionalAddOn: String,
            valuePropositions: String,
            competitors: String,
        },
        fileArr: [
            { url: String, fileType: String },
        ],
        mediaLinksArr: [
            {
                url: String
            }
        ],
        caseStudies: [
            {
                url: String,
                name: String,
            }
        ]
    },
    { timestamps: true }
);
export default mongoose.model("productWithLanguage", productWithLanguage);