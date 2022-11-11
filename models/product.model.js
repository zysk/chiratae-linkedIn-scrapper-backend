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
                    softwareDescription: Array,
                    softwareType: Array,
                    softwareData: Array,
                    farmAdmin: Array,
                    accountAccess: Object,
                    usersPerAccount: Array,
                    modeOfUse: Array,
                    cropPlanning: Array,
                    operationalPlanning: Array,
                    precisionAgriculture: Array,
                    weatherForecast: Array,
                    soilHealth: Array,
                    farmAnalytics: Array,
                    fieldAndEquipmentRecords: Array,
                    harvestAnalysis: Array,
                    hardwareAndConnectivity: Array,
                    accounting: Array,
                    others: String,
                },
                targetCustomer: {
                    marketsServed: Array,
                    typesOfFarmsServed: Array,
                    customers: Object,
                    farmSize: Array,
                    typeOfLeads: String,
                    relevantCrops: Array,
                    otherRelevantCrops: String,
                    capatibleWith: String,
                    inCompatibeWith: String,
                },
                customerSupport: {
                    isFreeTrialAvailable: Object,
                    typeOfCustomerSupport: Array,
                    trainingAvailable: Object,
                    isTrainingFree: String,
                    typeOfTrainings: Array,
                },
                installation: {
                    sofwareUse: Array,
                    averageTime: String,
                    averageFees: String,
                    pricingModel: Array,
                    pricingDetails: String,
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
