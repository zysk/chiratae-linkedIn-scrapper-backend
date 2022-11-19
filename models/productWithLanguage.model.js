import mongoose from "mongoose";

let productWithLanguage = mongoose.Schema(
    {
        productId: String,
        languageId: String,
        ///////////////////
        name: String,
        languageSupported: [{
            value: String
        }],
        shortDescription: String,
        longDescripton: String,
        featureChecklist: {
            softwareDescription: [{
                value: String
            }],
            softwareType: [{
                value: String
            }],
            softwareData: [{
                value: String
            }],
            farmAdmin: [{
                value: String
            }],
            accountAccess: {
                value: String,
            },
            usersPerAccount: [{
                value: String
            }],
            modeOfUse: [{
                value: String
            }],
            cropPlanning: [{
                value: String
            }],
            operationalPlanning: [{
                value: String
            }],
            precisionAgriculture: [{
                value: String
            }],
            weatherForecast: [{
                value: String
            }],
            soilHealth: [{
                value: String
            }],
            farmAnalytics: [{
                value: String
            }],
            fieldAndEquipmentRecords: [{
                value: String
            }],
            harvestAnalysis: [{
                value: String
            }],
            hardwareAndConnectivity: [{
                value: String
            }],
            accounting: [{
                value: String
            }],
            others: String,
        },
        targetCustomer: {
            marketsServed: [{
                value: String
            }],
            typesOfFarmsServed: [{
                value: String
            }],
            customers: {
                value: String,
            },
            farmSize: [{
                value: String
            }],
            typeOfLeads: String,
            relevantCrops: [{
                value: String
            }],
            otherRelevantCrops: String,
            capatibleWith: String,
            inCompatibeWith: String,
        },
        customerSupport: {
            isFreeTrialAvailable: {
                value: String,
            },
            typeOfCustomerSupport: [{
                value: String
            }],
            trainingAvailable: {
                value: String,
            },
            isTrainingFree: String,
            typeOfTrainings: [{
                value: String
            }],
        },
        installation: {
            sofwareUse: [{
                value: String
            }],
            averageTime: String,
            averageFees: String,
            pricingModel: [{
                value: String
            }],
            pricingDetails: String,
            differentSubscription: String,
            additionalAddOn: String,
            valuePropositions: String,
            competitors: String,
        },
        media: [
            { mediaLinks: String, name: String, description: String }
        ],
    },
    { timestamps: true }
);
export default mongoose.model("productWithLanguage", productWithLanguage);