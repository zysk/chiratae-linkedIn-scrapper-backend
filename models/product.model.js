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
                languageSupported: Array,
                shortDescription: String,
                longDescripton: String,
                featureChecklist: {
                    softwareDescription: Object,
                    softwareType: Object,
                    softwareData: Object,
                    farmAdmin: Object,
                    accountAccess: String,
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
                    others: String,
                },
                targetCustomer: {
                    marketsServed: String,
                    typesOfFarmsServed: Array,
                    customers: Object,
                    farmSize: Array,
                    typeOfLeads: String,
                    relevantCrops: String,
                },
                customerSupport: {
                    isFreeTrialAvailable: Object,
                    typeOfCustomerSupport: Object,
                    trainingAvailable: Object,
                    isTrainingFree: String,
                    typeOfTrainings: Array,
                },
                installation: {
                    sofwareUse: String,
                    averageTime: String,
                    averageFees: String,
                    differentSubscription: String,
                    additionalAddOn: String,
                    valuePropositions: String,
                    competitors: String,
                },
                media: {
                    mediaLinks: String
                }
            }
        ]
    },
    { timestamps: true }
);
export default mongoose.model("product", product);
