import mongoose from "mongoose";

let conversion = mongoose.Schema(
    {
        languageId: { type: mongoose.Types.ObjectId },
        languageName: String,

        /////////new Fields
        managerforhandlingsalesleads: String,
        contactPersonDetailsForCeressy: String,
        accountAccessDesctiption: String,
        pleaseenterdetailsofyourcustomers: String,
        pleasementionotherrelevantcrops: String,
        ifyesIstrainingfreeofcost: String,
        protectedcropsgreenhousesnethouses: String,





        addnewProduct: String,
        /////Company Overview
        companyOverview: String,
        companyName: String,
        companyEMailID: String,
        website: String,
        companyFoundingDate: String,
        companyHqLocation: String,
        companyDescription: String,
        /////////Company Representatives
        companyRepresentatives: String,
        detailsofproductlisting: String,
        name: String,
        eMailID: String,
        phonenumber: String,




        ///////// countryArr
        country: String,
        india: String,
        germany: String,
        austria: String,
        switzerland: String,
        ///////////Product Portfolio
        companyProductPortfolio: String,
        productType: String,
        productCount: String,
        productPortfolio: String,
        product: String,
        productName: String,
        farmmanagementsoftware: String,
        others: String,
        product: String,
        ///////language arr
        languageSupported: String,
        english: String,
        hindi: String,
        german: String,
        french: String,
        chinese: String,
        spanish: String,
        arabic: String,
        bengali: String,
        portuguese: String,
        russian: String,
        japanese: String,
        javanese: String,
        lahnda: String,
        telugu: String,
        vietnamese: String,
        marathi: String,
        french: String,
        korean: String,
        tamil: String,
        italian: String,
        urdu: String,
        ////////////
        shortDescription: String,
        longDescription: String,

        ////////////Feature Checklist
        featureChecklist: String,
        featureSectionDescription: String,
        ////// softwareDescriptionArr
        whatdescribesyoursoftwarethebest: String,
        fieldcropmanagement: String,
        laborManagement: String,
        equipmentmachinerymanagement: String,
        inputmanagement: String,
        waterManagement: String,
        accountingfinanceregulationcompliance: String,
        cropSalesRetail: String,
        precisionApplication: String,
        climateMonitoringAnalysis: String,
        soilsensinganalysis: String,
        diseasepestmanagement: String,


        /////////softwareTypeArr
        whattypeofsoftwaredoyouprovide: String,
        standardizedOnly: String,
        partiallyCustomized: String,
        fullyCustomized: String,

        /////////softwareDataArr
        howdoesyoursoftwaregatherdata: String,
        satellitebasedinsights: String,
        imaginganalyticsviadrones: String,
        ioTSesnors: String,
        manualinputbyusers: String,
        viathirdpartysoftware: String,
        Otherpleasespecify: String,


        /////////farmAdminArr
        farmadmin: String,
        operationsPlanning: String,
        itinerariesplanningandscheduling: String,
        realtimeoperationtracking: String,
        exporttaskstomaterialsandworkers: String,
        generateautomateddocumentation: String,
        reportoftasksandoccupancyrates: String,


        ////////////Account access*(Hierarchy based access (Owner, advisor, worker,…)
        accountaccess: String,
        yes: String,
        no: String,

        /////////usersPerAccountArr
        usersperaccount: String,
        oneuserperaccount: String,
        multipleusersperaccount: String,
        /////////modeOfUseArr
        modeofuse: String,
        onlinemodeonly: String,
        offlinemode: String,
        /////////yieldAnalysisArr
        yieldanalysiscropplanning: String,
        fieldmapping: String,
        geomappingcropscouting: String,
        fieldcropplanningbudgeting: String,
        yieldpredictionforecast: String,
        profitpredictionmaps: String,
        /////////operationalPlanningArr
        operationalplanning: String,
        inputinventorymanagement: String,
        harvestcrewequipmentdeployment: String,
        /////////precisionAgricultureArr
        precisionagriculture: String,
        variablerateapplicationmaps: String,
        variablerateapplicationVRAautomationcontrol: String,
        seedapplicationmonitoring: String,
        /////////weatherForecastArr
        weatherforecast: String,
        satelliteweatherinsights: String,
        weatherstationcompatibility: String,
        /////////soilAndCropHealthArr
        soilCrophealth: String,
        soilsampling: String,
        soildataanalysis: String,
        scouting: String,
        pestdiseasealert: String,
        growthstageanalysis: String,
        /////////farmAnalyticsArr
        infieldanalytics: String,
        cropzones: String,
        topographyanalysis: String,
        realtimefieldmonitoring: String,
        realtimefleettrackingutilization: String,
        /////////fieldAndEquipmentRecordsArr
        fieldequipmentrecords: String,
        fieldrecordkeeping: String,
        equipmentrecords: String,
        /////////harvestAnalysisArr
        harvestanalysissales: String,
        skutaggingtraceabilitytothesource: String,
        harvestreportsinsights: String,
        directsalestocustomers: String,
        orderprocessingtagging: String,
        commoditypricetracking: String,
        realTimedeliverystatusmonitoring: String,
        /////////hardwareAndConnectivityArr
        compatibility: String,
        meteoStationsandsoilsensors: String,
        eRPintegration: String,
        cropAdvisor: String,
        agribusinesssoftwareintegration: String,
        iSOBUScompliance: String,
        /////////accountingArr
        accountingFinanceCompliance: String,
        bookkeeping: String,
        regulationcompliance: String,
        ///////Other features
        otherfeatures: String,



        //////Target Customer
        targetCustomer: String,

        //// marketsServed arr
        marketsserved: String,
        northAmerica: String,
        latam: String,
        europe: String,
        emea: String,
        asia: String,
        subSaharan: String,
        africa: String,
        australiaOceania: String,
        /////////typesOfFarmsServedArr
        whichtypesoffarmscanyouservewiththisproduct: String,
        fieldcrops: String,
        vegetables: String,
        orchards: String,
        vineyards: String,
        nuts: String,
        fruits: String,
        flowers: String,
        urbanfarms: String,
        nurseries: String,
        groves: String,
        plantations: String,
        livestock: String,
        mixedFarmCropLivestock: String,
        /////////customersArr
        whoareyourcustomers: String,
        agribusinesses: String,
        contractors: String,
        cooperatives: String,
        farmers: String,
        /////////farmSizeArr
        whichfarmsizegrouparebestservedbyyoursolution: String,
        lessthan: String,
        ha: String,
        noteFarmSize: String,
        ///////What types of leads are you most interested in?
        whattypesofleadsareyoumostinterestedin: String,
        relevantcrops: String,
        notecropsserving: String,
        whichsystemisyourFMScompatiblewithListallthatapplies: String,
        whichsystemisyourFMSisnotcompatiblewithListallthatapplies: String,


        //////////Customer Support
        customerSupport: String,
        doyouofferfreetrial: String,
        /////////typeOfCustomerSupportArr
        whattypeofcustomersupportdoyouoffer: String,
        emailhelpdesk: String,
        onlinechat: String,
        phone: String,
        inperson: String,
        doyouprovidetrainingtouseyourproduct: String,
        /////////typeOfTrainingsArr
        whattypeoftrainingsdoyouoffer: String,

        liveonline: String,
        webinars: String,
        documentation: String,
        videos: String,
        viatelephone: String,
        /////////countryWiseCrops
        foragecrops: String,
        cereal: String,
        grasses: String,
        hops: String,
        potatoes: String,
        herbs: String,
        legumes: String,
        corn: String,
        fruit: String,
        rapeseed: String,
        vine: String,
        rice: String,
        turnips: String,
        soybeans: String,
        tobacco: String,
        ornamentals: String,
        oilseeds: String,
        treesandshrubsoutsideforest: String,
        freshherbs: String,
        fodderandsugarbeet: String,
        meadowsandpastures: String,
        growers: String,

        ///////////////////Installation, Set-up & Pricing
        pricingDetails: String,
        installationSetupPricing: String,
        howcanyoursoftwarebeused: String,
        appleIOSappmobile: String,
        androidappmobile: String,
        desktopwebbased: String,

        //////  what is your pricing model?
        whatisyourpricingmodel: String,
        free: String,
        subscription: String,
        onetimelicense: String,
        custompricing: String,

        ////////////Please provide details for pricing
        pleaseprovidedetailsforpricing: String,

        ///
        ifyoucannotsharetheexactpricePleasesharethelogicbehindit: String,
        ////
        averagesetuptimeandinstallationforsoftwareandanewaccount: String,
        ////
        baseproductpricingonetimeandreoccurringfees: String,
        ////
        differentsubscriptionlevelsnamepricingadditionalfeatures: String,
        ////
        additionaladdonstoyourproduct: String,
        ////
        keyvaluepropositionorExpectedROIorusecasestudy: String,
        ////
        whoareyourbiggestcompetitorsCompaniesandproductnames: String,


        //////Media
        media: String,
        doyouhavethefollowingmediaavailableIfyescouldyoupleaseshareitviaemail: String,
        productvideoandphotoupload: String,
        companylogoupload: String,
        linkstoproductvideosorphotos: String,
        pleaseEnterlinksformedia: String,
        linkstoproductreviewsthatwecanuseonourplatform: String,


        termsConditions: String,
        igivepermissiontolistmycompanysproductonCeressyplatformusingtheinformationprovidedinthislistingform: String,
        ihavereadandagreedtoCeressystermsandconditionsfortheuseoftheceressyplatform: String,
        iwouldliketobeaddedtoCeressynewslettersmarketingpromotionalactivities: String,

        save: String,
    },
    { timestamps: String, }
);

export default mongoose.model("conversion", conversion);
