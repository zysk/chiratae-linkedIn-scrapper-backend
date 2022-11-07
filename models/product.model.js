import mongoose from "mongoose";

let product = mongoose.Schema(
    {
        companyName: String,
        companyMail: String,
        companyPhone: String,
        website: String,
        companyFoundingDate: String,
        companyHqLocation: String,
        companyDescription: String,
        companyRepName: String,
        companyRepMail: String,
        companyRepPhone: String,
        leadManagerName: String,
        leadManagerMail: String,
        leadManagerPhone: String,
        productType: String,
        productCount: String,
        productArr: [
            {
                name: String,
                languageSupported: String,
                shortDescription: String,
                longDescripton: String,
                featureChecklist: {
                    softwareDescription: Object,
                    softwareType: Object,
                    softwareData: Object,
                    farmAdmin: Object,
                    accountAccess: Object,
                    usersPerAccount: Object,
                    modeOfUse: Object,
                    cropPlanning: Object,
                    operationalPlanning: Object,
                    precisionAgriculture: Object,
                    weatherForecast: Object,
                    soilHealth: Object,
                    farmAnalytics: Object,
                    fieldAndEquipmentRecords: Object,
                    harvestAnalysis: Object,
                    hardwareAndConnectivity: Object,
                    accounting: Object,
                    others: Object,
                },
                targetCustomer: {
                    marketsServed: Object,
                    typesOfFarmsServed: Object,
                    customers: Object,
                    farmSize: Object,
                    typeOfLeads: Object,
                    relevantCrops: Object,
                },
                customerSupport: {
                    isFreeTrialAvailable: Object,
                    typeOfCustomerSupport: Object,
                    trainingAvailable: Object,
                    isTrainingFree: String,
                    typeOfTrainings: Object,
                },
                installation: {
                    sofwareUse: Object,
                    averageTime: Object,
                    averageFees: Object,
                    differentSubscription: Object,
                    additionalAddOn: Object,
                    valuePropositions: Object,
                    competitors: Object,
                },
                media: {
                    mediaLinks: Object
                }
            }
        ]
    },
    { timestamps: true }
);
export default mongoose.model("product", product);
