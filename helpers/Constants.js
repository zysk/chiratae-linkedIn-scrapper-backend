export const rolesObj = {
    ADMIN: "ADMIN",
    USER: "USER",
};

export const ErrorMessages = {
    EMAIL_EXISTS: "Email already exists",
    PHONE_EXISTS: "Phone number already exists",
    INVALID_EMAIL: "Invalid email",
    INVALID_PASSWORD: "Invalid password",
    INVALID_PHONE: "Invalid phone number",
    INVALID_USER: "Invalid user",
    INVALID_TOKEN: "Invalid token",
};

export const generalModelStatuses = {
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    PENDING: "PENDING",
};

 const generalTerms = {
    /////////new Fields
    managerforhandlingsalesleads: "Manager for handling sales leads",
    contactPersonDetailsForCeressy: "Please mention details of the person who would be contact for Ceressy for managing sales leads (if different from company representative)",
    accountAccessDesctiption: "(Hierarchy based access (Owner, advisor, worker,…)",
    pleaseenterdetailsofyourcustomers: "Please enter details of your customers",
    pleasementionotherrelevantcrops: "Please mention other relevant crops",
    ifyesIstrainingfreeofcost: "If yes, Is training free of cost?",
    protectedcropsgreenhousesnethouses: "Protected crops (greenhouses / nethouses)",
    other: "Other",
    any: "Any",
    startingAt: "Starting At",
    selectAll: "Select All",
    seeds: "Seeds",
    spices: "Spices",
    feedandForageCrops: "Feed and Forage Crops",
    fiber: "Fiber",
    industrial: "Industrial",
    addnewProduct: "Add New Product",
    /////Company Overview
    companyOverview: "Company Overview",
    companyName: "Company Name",
    companyEMailID: "Company E-Mail ID",
    website: "Website",
    companyFoundingDate: "Company Founding Date",
    companyHqLocation: "Company Hq Location",
    companyDescription: "Company Description",
    /////////Company Representatives
    companyRepresentatives: "Company Representatives",
    detailsofproductlisting: "Please mention the details of the person who would be single point of contact for Ceressy for product listing",
    name: "Name",
    eMailID: "E-Mail ID",
    phonenumber: "Phone number",
    sameAsCompany: "Same as Company",
    useCaseStudies: "Use Case Studies",
    link: "Link",
    review: "Review",
    ///////// countryArr
    country: "Country",
    austria: "Austria",
    belgium: "Belgium",
    bulgaria: "Bulgaria",
    cyprus: "Cyprus",
    denmark: "Denmark",
    spain: "Spain",
    finland: "Finland",
    france: "France",
    greece: "Greece",
    hungary: "Hungary",
    ireland: "Ireland",
    italy: "Italy",
    luxembourg: "Luxembourg",
    malta: "Malta",
    netherlands: "Netherlands",
    poland: "Poland",
    portugal: "Portugal",
    germany: "Germany",
    rumanía: "Rumanía",
    sweden: "Sweden",
    latvia: "Latvia",
    estonia: "Estonia",
    lithuania: "Lithuania",
    czechrepublic: "Czech Republic",
    slovakrepublic: "Slovak Republic",
    croatia: "Croatia",
    slovenia: "Slovenia",
    albania: "Albania",
    iceland: "Iceland",
    liechtenstein: "Liechtenstein",
    monaco: "Monaco",
    norway: "Norway",
    andorra: "Andorra",
    unitedkingdom: "United Kingdom",
    sanmarino: "San Marino",
    holysee: "Holy See",
    switzerland: "Switzerland",
    ukraine: "Ukraine",
    moldova: "Moldova",
    belarus: "Belarus",
    georgia: "Georgia",
    bosniaandherzegovina: "Bosnia and Herzegovina",
    armenia: "Armenia",
    russia: "Russia",
    macedonia: "Macedonia ",
    serbia: "Serbia",
    montenegro: "Montenegro",
    turkey: "Turkey",
    othercountriesofeurope: "Other Countries of Europe",
    burkinafaso: "Burkina Faso",
    angola: "Angola",
    algeria: "Algeria",
    benin: "Benin",
    botswana: "Botswana",
    burundi: "Burundi",
    capeverde: "Cape Verde",
    cameroon: "Cameroon",
    unionofcomoros: "Union of Comoros",
    congo: "Congo",
    ivorycoast: "Ivory Coast",
    djibouti: "Djibouti",
    egytp: "Egytp",
    ethiopia: "Ethiopia",
    gabon: "Gabon",
    gambia: "Gambia",
    ghana: "Ghana",
    guinea: "Guinea",
    guineabissau: "Guinea-Bissau",
    equatorialguinea: "Equatorial Guinea ",
    kenya: "Kenya",
    lesotho: "Lesotho",
    liberia: "Liberia",
    libya: "Libya",
    madagascar: "Madagascar",
    malawi: "Malawi",
    mali: "Mali",
    morocco: "Morocco",
    mauritius: "Mauritius",
    mauritania: "Mauritania",
    mozambique: "Mozambique",
    namibia: "Namibia",
    níger: "Níger",
    nigeria: "Nigeria",
    centralafricanrepublic: "Central African Republic",
    southafrica: "South Africa",
    rwanda: "Rwanda",
    saotoméandpríncipe: "Sao Tomé and Príncipe",
    senegal: "Senegal",
    seychelles: "Seychelles",
    sierraleone: "Sierra Leone",
    somalia: "Somalia",
    sudan: "Sudan",
    swaziland: "Swaziland",
    tanzania: "Tanzania",
    chad: "Chad",
    togo: "Togo",
    tunisia: "Tunisia",
    uganda: "Uganda",
    democraticrepublicofthecongo: "Democratic Republic of the Congo",
    zambia: "Zambia",
    zimbabwe: "Zimbabwe",
    eritrea: "Eritrea",
    southsudan: "South Sudan",
    othercountriesofafrica: "Other Countries of Africa",
    canada: "Canada",
    theunitedstatesofamerica: "The United States of America",
    mexico: "Mexico",
    antiguaybarbuda: "Antigua y Barbuda",
    bahamas: "Bahamas",
    barbados: "Barbados",
    belize: "Belize",
    costarica: "Costa Rica",
    cuba: "Cuba",
    dominique: "Dominique",
    elsalvador: "El Salvador",
    grenada: "Grenada",
    guatemala: "Guatemala",
    haiti: "Haiti",
    honduras: "Honduras",
    jamaica: "Jamaica",
    nicaragua: "Nicaragua",
    panama: "Panama",
    saintvincentandthegrenadines: "Saint Vincent and the Grenadines",
    dominicanrepublic: "Dominican Republic",
    trinidadandtobago: "Trinidad and Tobago",
    saintlucia: "Saint Lucia",
    saintkittsandneviss: "Saint Kitts and Neviss",
    argentina: "Argentina",
    bolivia: "Bolivia",
    brazil: "Brazil",
    colombia: "Colombia",
    chile: "Chile",
    ecuador: "Ecuador",
    guyana: "Guyana",
    paraguay: "Paraguay",
    peru: "Peru",
    surinam: "Surinam",
    uruguay: "Uruguay",
    venezuela: "Venezuela",
    othercountriesofamerica: "Other Countries of America",
    afghanistan: "Afghanistan",
    saudiarabia: "Saudi Arabia",
    bahrain: "Bahrain",
    bangladesh: "Bangladesh",
    myanmar: "Myanmar",
    china: "China",
    unitedarabemirates: "United Arab Emirates",
    philippines: "Philippines",
    india: "India",
    indonesia: "Indonesia",
    iraq: "Iraq",
    iran: "Iran",
    israel: "Israel",
    japan: "Japan",
    jordan: "Jordan",
    cambodia: "Cambodia",
    kuwait: "Kuwait",
    laos: "Laos",
    lebanon: "Lebanon",
    malaysia: "Malaysia",
    maldives: "Maldives",
    mongolia: "Mongolia",
    nepal: "Nepal",
    oman: "Oman",
    pakistan: "Pakistan",
    qatar: "Qatar",
    korea: "Korea",
    northkorea: "North Korea",
    singapore: "Singapore",
    syria: "Syria",
    srilanka: "Sri Lanka",
    thailand: "Thailand",
    vietnam: "Vietnam",
    brunei: "Brunei",
    marshallislands: "Marshall Islands",
    yemen: "Yemen",
    azerbaijan: "Azerbaijan",
    kazakhstán: "Kazakhstán",
    kirgyzstan: "Kirgyzstan",
    tajikistan: "Tajikistan",
    turkmeinetan: "Turkmeinetan",
    uzbekistan: "Uzbekistan",
    bhutan: "Bhutan",
    palestineobserverstatenonmemberoftheunitednations: "Palestine. Observer State, non-member of the United Nations",
    othercountriesofasia: "Other Countries of Asia",
    australia: "Australia",
    fiji: "Fiji",
    newzeland: "New Zeland",
    papuanewguinea: "Papua New Guinea",
    solomonislands: "Solomon Islands",
    samoa: "Samoa",
    tonga: "Tonga",
    vanuatu: "Vanuatu",
    micronesia: "Micronesia",
    tuvalu: "Tuvalu",
    cookislands: "Cook Islands",
    kiribati: "Kiribati",
    nauru: "Nauru",
    palau: "Palau",
    easttimor: "East Timor",
    othercountriesofoceania: "Other Countries of Oceania",
    ///////////Product Portfolio
    companyProductPortfolio: "Company Product Portfolio",
    productType: "Product Type",
    productCount: "Product Count",
    productPortfolio: "Product Portfolio",
    product: "Product",
    productName: "ProductName",
    farmmanagementsoftware: "Software",
    others: "Others",
    product: "Product",
    ///////language arr
    languageSupported: "Language Supported",
    languageagnostic: "Language Agnostic",
    amharic: "Amharic",
    arabic: "Arabic",
    bahasaindonesia: "Bahasa Indonesia",
    bulgarian: "Bulgarian",
    burmese: "Burmese",
    chinese: "Chinese",
    croatian: "Croatian",
    czech: "Czech",
    danish: "Danish",
    dutch: "Dutch",
    english: "English",
    finnsih: "Finnsih",
    french: "French",
    german: "German",
    hindi: "Hindi",
    hungarian: "Hungarian",
    italian: "Italian",
    khmer: "Khmer",
    latvian: "Latvian",
    lithuanian: "Lithuanian",
    malagasy: "Malagasy",
    malay: "Malay",
    polish: "Polish",
    portuguese: "Portuguese",
    romanian: "Romanian",
    russian: "Russian",
    serbian: "Serbian",
    slovak: "Slovak",
    spanish: "Spanish",
    swahili: "Swahili",
    swedish: "Swedish",
    thai: "Thai",
    turkish: "Turkish",
    ukranian: "Ukranian",
    uzbekistanian: "Uzbekistanian",
    vietnamese: "Vietnamese",
    ////////////
    shortDescription: "Short Description (Describe your product in 150-200 characters)",
    longDescription: "Long Description (Describe your product in 500-2000 characters)",
    ////////////Feature Checklist
    featureChecklist: "Feature Checklist",
    featureSectionDescription: "In this section, please select all of the features that apply to your FMS",
    ////// softwareDescriptionArr
    whatdescribesyoursoftwarethebest: "What describes your software the best?",
    fieldcropmanagement: "Field & crop management",
    laborManagement: "Labor management",
    equipmentmachinerymanagement: "Equipment & machinery management",
    inputmanagement: "Input management (seeds, fetilizers…)",
    waterManagement: "Water management",
    accountingfinanceregulationcompliance: "Accounting finance & regulation compliance",
    cropSalesRetail: "Crop sales & retail",
    precisionApplication: "Precision application",
    climateMonitoringAnalysis: "Climate monitoring & analysis",
    soilsensinganalysis: "Soil sensing & analysis",
    diseasepestmanagement: "Disease & pest management",
    /////////softwareTypeArr
    whattypeofsoftwaredoyouprovide: "What type of software do you provide?",
    standardizedOnly: "Standardized",
    partiallyCustomized: "Partially customized",
    fullyCustomized: "Fully customized",
    /////////softwareDataArr
    howdoesyoursoftwaregatherdata: "How does your software gather data?",
    satellitebasedinsights: "Satellite based insights",
    imaginganalyticsviadrones: "Imaging analytics via drones",
    ioTSesnors: "IoT sesnors",
    manualinputbyusers: "Manual input by users",
    viathirdpartysoftware: "Via third party software",
    Otherpleasespecify: "Other (please specify)",
    /////////farmAdminArr
    farmadmin: "Farm admin & operations planning",
    operationsPlanning: "Operations planning, scheduling & tracking",
    itinerariesplanningandscheduling: "Itineraries planning and scheduling",
    realtimeoperationtracking: "Realtime operation tracking",
    exporttaskstomaterialsandworkers: "Export tasks to materials and workers",
    generateautomateddocumentation: "Generate automated documentation (worktime, itinerary)",
    reportoftasksandoccupancyrates: "Report of tasks and occupancy rates",
    ////////////Account access*(Hierarchy based access (Owner, advisor, worker,…)
    accountaccess: "Account access",
    yes: "Yes",
    no: "No",
    /////////usersPerAccountArr
    usersperaccount: "Users per account",
    oneuserperaccount: "One user per account",
    multipleusersperaccount: "Multiple users per account",
    /////////modeOfUseArr
    modeofuse: "Mode of use",
    onlinemodeonly: "Online mode only",
    offlinemode: "Offline mode",
    /////////yieldAnalysisArr
    yieldanalysiscropplanning: "Yield analysis & crop planning",
    fieldmapping: "Field mapping",
    geomappingcropscouting: "Geo mapping & crops couting",
    fieldcropplanningbudgeting: "Field & crop planning & budgeting",
    yieldpredictionforecast: "Yield & profit prediction maps",
    profitpredictionmaps: "Profit prediction maps",
    /////////operationalPlanningArr
    operationalplanning: "Operational planning",
    inputinventorymanagement: "Input & inventory management",
    harvestcrewequipmentdeployment: "Harvest crew & equipment deployment",
    /////////precisionAgricultureArr
    precisionagriculture: "Precision agriculture",
    variablerateapplicationmaps: "Variable rate application (VRA) maps",
    variablerateapplicationVRAautomationcontrol: "Variable rate application (VRA) automation control",
    seedapplicationmonitoring: "Seed application & monitoring",
    /////////weatherForecastArr
    weatherforecast: "Weather forecast",
    satelliteweatherinsights: "Satellite weather insights",
    weatherstationcompatibility: "Weather station compatibility",
    /////////soilAndCropHealthArr
    soilCrophealth: "Soil & Crop health",
    soilsampling: "Soil sampling",
    soildataanalysis: "Soil data analysis",
    scouting: "Scouting",
    pestdiseasealert: "Pest & disease alert",
    growthstageanalysis: "Growth stage analysis",
    /////////farmAnalyticsArr
    infieldanalytics: "In field analytics",
    cropzones: "Crop zones",
    topographyanalysis: "Topography analysis",
    realtimefieldmonitoring: "Real-time field monitoring",
    realtimefleettrackingutilization: "Real-time fleet tracking & utilization",
    /////////fieldAndEquipmentRecordsArr
    fieldequipmentrecords: "Field & equipment records",
    fieldrecordkeeping: "Field record keeping",
    equipmentrecords: "Equipment records",
    /////////harvestAnalysisArr
    harvestanalysissales: "Harvest analysis & sales",
    skutaggingtraceabilitytothesource: "SKU tagging & traceability to the source",
    harvestreportsinsights: "Harvest reports & insights",
    directsalestocustomers: "Direct sales to customers",
    orderprocessingtagging: "Order processing & tagging",
    commoditypricetracking: "Commodity price tracking",
    realTimedeliverystatusmonitoring: "Real-Time delivery status monitoring",
    /////////CompatibilityArr
    compatibility: "Compatibility",
    meteoStationsandsoilsensors: "Meteo Stations and soil sensors",
    eRPintegration: "ERP integration",
    agribusinesssoftwareintegration: "Agribusiness software (third-party bookkeeping, POS, invoicing software…) integration",
    iSOBUScompliance: "ISOBUS compliance",
    /////////accountingArr
    accountingFinanceCompliance: "Accounting, Finance & Compliance",
    bookkeeping: "Book keeping",
    regulationcompliance: "Regulation compliance",
    ///////Other features
    otherfeatures: "Other features",
    multipleSelections: "Multiple Selections",
    //////Target Customer
    targetCustomer: "Target Customer",
    //// marketsServed arr
    marketsserved: "Markets served",
    europeanunion: "European Union",
    restofeurope: "Rest of Europe",
    africa: "África",
    northamerica: "North America",
    centralamericaandcaribbean: "Central America and Caribbean",
    southamerica: "South America",
    asia: "Asia",
    oceania: "Oceania",
    /////////typesOfFarmsServedArr
    whichtypesoffarmscanyouservewiththisproduct: "Which types of farms can you serve with this product? (select all that apply)",
    fieldcrops: "Field crops",
    vegetables: "Vegetables",
    orchards: "Orchards",
    vineyards: "Vineyards",
    nuts: "Nuts",
    fruits: "Fruits",
    flowers: "Flowers",
    urbanfarms: "Urban farms (vertical,rooftop,indoor,community farms)",
    nurseries: "Nurseries",
    groves: "Groves",
    plantations: "Plantations",
    livestock: "Livestock",
    mixedFarmCropLivestock: "Mixed Farm (Crop + Livestock)",
    /////////customersArr
    whoareyourcustomers: "Who are your customers?",
    agribusinesses: "Agribusinesses",
    contractors: "Contractors",
    cropAdvisor: "Crop advisor",
    cooperatives: "Cooperatives",
    growers: "Growers",
    /////////farmSizeArr
    whichfarmsizegrouparebestservedbyyoursolution: "Which farm size group(s) are best served by your solution? (select all that apply)",
    lessthan: "Less than",
    ha: "ha",
    noteFarmSize: "Note: we understand that farm type & size heavily depend on markets being served. We would be using this information to allow farmers to filter out relevant solutions for them and to find high quality leads for your company.",
    ///////What types of leads are you most interested in?
    whattypesofleadsareyoumostinterestedin: "What types of leads are you most interested in?",
    relevantcrops: "Relevant crops",
    notecropsserving: "Note: If the crops you are serving are more than 5 to 10, either you could provide us a list (if it already exist) or simply mention, variety of crops",
    whichsystemisyourFMScompatiblewithListallthatapplies: "Which system(s) is(are) your FMS compatible with ? List all that applies",
    whichsystemisyourFMSisnotcompatiblewithListallthatapplies: "Is there a system that your FMS is not compatible with? If yes, please list them.",
    //////////Customer Support
    customerSupport: "Customer Support",
    doyouofferfreetrial: "Do you offer free trial?",
    /////////typeOfCustomerSupportArr
    whattypeofcustomersupportdoyouoffer: "What type of customer support do you offer?",
    emailhelpdesk: "Email / helpdesk",
    onlinechat: "online chat",
    phone: "Phone",
    inperson: "In person",
    doyouprovidetrainingtouseyourproduct: "Do you provide training to use your product?",
    /////////typeOfTrainingsArr
    whattypeoftrainingsdoyouoffer: "What type of trainings do you offer?",
    liveonline: "Live online",
    webinars: "Webinars",
    documentation: "Documentation",
    videos: "Videos",
    viatelephone: "via telephone",
    /////////countryWiseCrops
    foragecrops: "Forage crops",
    cereal: "Cereal",
    grasses: "Grasses",
    hops: "Hops",
    potatoes: "Potatoes",
    herbs: "Herbs",
    legumes: "Legumes",
    corn: "Corn",
    fruit: "Fruit",
    rapeseed: "Rapeseed",
    vine: "Vine",
    rice: "Rice",
    turnips: "Turnips",
    soybeans: "Soybeans",
    tobacco: "Tobacco",
    ornamentals: "Ornamentals",
    oilseeds: "Oilseeds",
    treesandshrubsoutsideforest: "Trees and shrubs (outside forest)",
    freshherbs: "Fresh herbs",
    fodderandsugarbeet: "Fodder and sugar beet",
    meadowsandpastures: "Meadows and pastures",
    ///////////////////Installation, Set-up & Pricing
    installationSetupPricing: "Installation, Set-up & Pricing",
    howcanyoursoftwarebeused: "How can your software be used?",
    appleIOSappmobile: "Apple IOS app (mobile)",
    androidappmobile: "Android app (mobile)",
    desktopwebbased: "Desktop (web-based)",
    //////  what is your pricing model?
    whatisyourpricingmodel: "what is your pricing model?",
    free: "Free",
    subscription: "Subscription",
    onetimelicense: "One-time license",
    custompricing: "Custom pricing",
    ////////////Please provide details for pricing
    pricingDetails: "Pricing Details",
    pleaseprovidedetailsforpricing: "Please provide detailed pricing details. E.g. Different subscription levels or one time licence fees  (name, pricing, additional features)",
    ///
    ifyoucannotsharetheexactpricePleasesharethelogicbehindit: "If you cannot share the exact price. Please share the logic behind it, e.g., Price is charged per hectare, yearly maintenance fee, License per user. If there are different pricing/subscrption levels you can indicate that",
    ////
    averagesetuptimeandinstallationforsoftwareandanewaccount: "Average set-up time and installation for software and a new account?",
    ////
    baseproductpricingonetimeandreoccurringfees: "Base product pricing (one-time and reoccurring fees) If you can not share the exact pricing, please share the logic behind it, i.e.price charged per ha, yearly fee, charge per user/licence… If there are different pricing levels, please input the information in the field below.",
    ////
    differentsubscriptionlevelsnamepricingadditionalfeatures: "Different subscription levels (name, pricing, additional features) ex. Executive Account - 150€/y, additional mapping features and unlimited storage",
    ////
    additionaladdonstoyourproduct: "Additional add-ons to your product (Do you produce any of your own additional software modules/devices or is there additional software/hardware that can be purchased by the end user? If yes, please describe how the pricing and performance will change.)",
    ////
    ////
    whoareyourbiggestcompetitorsCompaniesandproductnames: "Who are your biggest competitors? (Companies and product names)",
    //////Media
    media: "Media",
    doyouhavethefollowingmediaavailableIfyescouldyoupleaseshareitviaemail: "Do you have the following media available? If yes, could you please share it via email? All this information would be displayed on your product page Testimonials/use case/product sheet upload",
    productvideoandphotoupload: "Product video and photo upload",
    companylogoupload: "Company logo upload",
    linkstoproductvideosorphotos: "Links to product videos or photos",
    pleaseEnterlinksformedia: "Please Enter links for media",
    linkstoproductreviewsthatwecanuseonourplatform: "Links to product reviews that we can use on our platform?",
    global: "Global",
    termsConditions: "Terms & Conditions",
    igivepermissiontolistmycompanysproductonCeressyplatformusingtheinformationprovidedinthislistingform: `I give permission to list my company's product on Ceressy platform using the information provided in this listing form. Ceressy can also publish the data which is available on public sources. Ceressy reserves the right to make adjustments in the product listing (e.g., make it concise, paraphrase) to make it more suitable for users`,
    ihavereadandagreedtoCeressystermsandconditionsfortheuseoftheceressyplatform: "I have read and agreed to Ceressy’s Terms and Conditions for the use of the Ceressy platform",
    iwouldliketobeaddedtoCeressynewslettersmarketingpromotionalactivities: `I would like to be added to Ceressy's newsletters, marketing & promotional activities`,
    save: "Save",
    trialLink: "Trial Link",
    greenHouses: "Green Houses",
    verticalIndoorFarm: "Vertical & Indoor Farms"
}   


export  const CountryLsit = [
    {
      label: `${generalTerms?.austria}`,
      value: `${generalTerms?.austria}`
    },
    {
      label: `${generalTerms?.belgium}`,
      value: `${generalTerms?.belgium}`
    },
    {
      label: `${generalTerms?.bulgaria}`,
      value: `${generalTerms?.bulgaria}`
    },
    {
      label: `${generalTerms?.cyprus}`,
      value: `${generalTerms?.cyprus}`
    },
    {
      label: `${generalTerms?.denmark}`,
      value: `${generalTerms?.denmark}`
    },
    {
      label: `${generalTerms?.spain}`,
      value: `${generalTerms?.spain}`
    },
    {
      label: `${generalTerms?.finland}`,
      value: `${generalTerms?.finland}`
    },
    {
      label: `${generalTerms?.france}`,
      value: `${generalTerms?.france}`
    },
    {
      label: `${generalTerms?.greece}`,
      value: `${generalTerms?.greece}`
    },
    {
      label: `${generalTerms?.hungary}`,
      value: `${generalTerms?.hungary}`
    },
    {
      label: `${generalTerms?.ireland}`,
      value: `${generalTerms?.ireland}`
    },
    {
      label: `${generalTerms?.italy}`,
      value: `${generalTerms?.italy}`
    },
    {
      label: `${generalTerms?.luxembourg}`,
      value: `${generalTerms?.luxembourg}`
    },
    {
      label: `${generalTerms?.malta}`,
      value: `${generalTerms?.malta}`
    },
    {
      label: `${generalTerms?.netherlands}`,
      value: `${generalTerms?.netherlands}`
    },
    {
      label: `${generalTerms?.poland}`,
      value: `${generalTerms?.poland}`
    },
    {
      label: `${generalTerms?.portugal}`,
      value: `${generalTerms?.portugal}`
    },
    {
      label: `${generalTerms?.germany}`,
      value: `${generalTerms?.germany}`
    },
    {
      label: `${generalTerms?.rumanía}`,
      value: `${generalTerms?.rumanía}`
    },
    {
      label: `${generalTerms?.sweden}`,
      value: `${generalTerms?.sweden}`
    },
    {
      label: `${generalTerms?.latvia}`,
      value: `${generalTerms?.latvia}`
    },
    {
      label: `${generalTerms?.estonia}`,
      value: `${generalTerms?.estonia}`
    },
    {
      label: `${generalTerms?.lithuania}`,
      value: `${generalTerms?.lithuania}`
    },
    {
      label: `${generalTerms?.czechrepublic}`,
      value: `${generalTerms?.czechrepublic}`
    },
    {
      label: `${generalTerms?.slovakrepublic}`,
      value: `${generalTerms?.slovakrepublic}`
    },
    {
      label: `${generalTerms?.croatia}`,
      value: `${generalTerms?.croatia}`
    },
    {
      label: `${generalTerms?.slovenia}`,
      value: `${generalTerms?.slovenia}`
    },
    {
      label: `${generalTerms?.albania}`,
      value: `${generalTerms?.albania}`
    },
    {
      label: `${generalTerms?.iceland}`,
      value: `${generalTerms?.iceland}`
    },
    {
      label: `${generalTerms?.liechtenstein}`,
      value: `${generalTerms?.liechtenstein}`
    },
    {
      label: `${generalTerms?.monaco}`,
      value: `${generalTerms?.monaco}`
    },
    {
      label: `${generalTerms?.norway}`,
      value: `${generalTerms?.norway}`
    },
    {
      label: `${generalTerms?.andorra}`,
      value: `${generalTerms?.andorra}`
    },
    {
      label: `${generalTerms?.unitedkingdom}`,
      value: `${generalTerms?.unitedkingdom}`
    },
    {
      label: `${generalTerms?.sanmarino}`,
      value: `${generalTerms?.sanmarino}`
    },
    {
      label: `${generalTerms?.holysee}`,
      value: `${generalTerms?.holysee}`
    },
    {
      label: `${generalTerms?.switzerland}`,
      value: `${generalTerms?.switzerland}`
    },
    {
      label: `${generalTerms?.ukraine}`,
      value: `${generalTerms?.ukraine}`
    },
    {
      label: `${generalTerms?.moldova}`,
      value: `${generalTerms?.moldova}`
    },
    {
      label: `${generalTerms?.belarus}`,
      value: `${generalTerms?.belarus}`
    },
    {
      label: `${generalTerms?.georgia}`,
      value: `${generalTerms?.georgia}`
    },
    {
      label: `${generalTerms?.bosniaandherzegovina}`,
      value: `${generalTerms?.bosniaandherzegovina}`
    },
    {
      label: `${generalTerms?.armenia}`,
      value: `${generalTerms?.armenia}`
    },
    {
      label: `${generalTerms?.russia}`,
      value: `${generalTerms?.russia}`
    },
    {
      label: `${generalTerms?.macedonia}`,
      value: `${generalTerms?.macedonia}`
    },
    {
      label: `${generalTerms?.serbia}`,
      value: `${generalTerms?.serbia}`
    },
    {
      label: `${generalTerms?.montenegro}`,
      value: `${generalTerms?.montenegro}`
    },
    {
      label: `${generalTerms?.turkey}`,
      value: `${generalTerms?.turkey}`
    },
    {
      label: `${generalTerms?.othercountriesofeurope}`,
      value: `${generalTerms?.othercountriesofeurope}`
    },
    {
      label: `${generalTerms?.burkinafaso}`,
      value: `${generalTerms?.burkinafaso}`
    },
    {
      label: `${generalTerms?.angola}`,
      value: `${generalTerms?.angola}`
    },
    {
      label: `${generalTerms?.algeria}`,
      value: `${generalTerms?.algeria}`
    },
    {
      label: `${generalTerms?.benin}`,
      value: `${generalTerms?.benin}`
    },
    {
      label: `${generalTerms?.botswana}`,
      value: `${generalTerms?.botswana}`
    },
    {
      label: `${generalTerms?.burundi}`,
      value: `${generalTerms?.burundi}`
    },
    {
      label: `${generalTerms?.capeverde}`,
      value: `${generalTerms?.capeverde}`
    },
    {
      label: `${generalTerms?.cameroon}`,
      value: `${generalTerms?.cameroon}`
    },
    {
      label: `${generalTerms?.unionofcomoros}`,
      value: `${generalTerms?.unionofcomoros}`
    },
    {
      label: `${generalTerms?.congo}`,
      value: `${generalTerms?.congo}`
    },
    {
      label: `${generalTerms?.ivorycoast}`,
      value: `${generalTerms?.ivorycoast}`
    },
    {
      label: `${generalTerms?.djibouti}`,
      value: `${generalTerms?.djibouti}`
    },
    {
      label: `${generalTerms?.egytp}`,
      value: `${generalTerms?.egytp}`
    },
    {
      label: `${generalTerms?.ethiopia}`,
      value: `${generalTerms?.ethiopia}`
    },
    {
      label: `${generalTerms?.gabon}`,
      value: `${generalTerms?.gabon}`
    },
    {
      label: `${generalTerms?.gambia}`,
      value: `${generalTerms?.gambia}`
    },
    {
      label: `${generalTerms?.ghana}`,
      value: `${generalTerms?.ghana}`
    },
    {
      label: `${generalTerms?.guinea}`,
      value: `${generalTerms?.guinea}`
    },
    {
      label: `${generalTerms?.guineabissau}`,
      value: `${generalTerms?.guineabissau}`
    },
    {
      label: `${generalTerms?.equatorialguinea}`,
      value: `${generalTerms?.equatorialguinea}`
    },
    {
      label: `${generalTerms?.kenya}`,
      value: `${generalTerms?.kenya}`
    },
    {
      label: `${generalTerms?.lesotho}`,
      value: `${generalTerms?.lesotho}`
    },
    {
      label: `${generalTerms?.liberia}`,
      value: `${generalTerms?.liberia}`
    },
    {
      label: `${generalTerms?.libya}`,
      value: `${generalTerms?.libya}`
    },
    {
      label: `${generalTerms?.madagascar}`,
      value: `${generalTerms?.madagascar}`
    },
    {
      label: `${generalTerms?.malawi}`,
      value: `${generalTerms?.malawi}`
    },
    {
      label: `${generalTerms?.mali}`,
      value: `${generalTerms?.mali}`
    },
    {
      label: `${generalTerms?.morocco}`,
      value: `${generalTerms?.morocco}`
    },
    {
      label: `${generalTerms?.mauritius}`,
      value: `${generalTerms?.mauritius}`
    },
    {
      label: `${generalTerms?.mauritania}`,
      value: `${generalTerms?.mauritania}`
    },
    {
      label: `${generalTerms?.mozambique}`,
      value: `${generalTerms?.mozambique}`
    },
    {
      label: `${generalTerms?.namibia}`,
      value: `${generalTerms?.namibia}`
    },
    {
      label: `${generalTerms?.níger}`,
      value: `${generalTerms?.níger}`
    },
    {
      label: `${generalTerms?.nigeria}`,
      value: `${generalTerms?.nigeria}`
    },
    {
      label: `${generalTerms?.centralafricanrepublic}`,
      value: `${generalTerms?.centralafricanrepublic}`
    },
    {
      label: `${generalTerms?.southafrica}`,
      value: `${generalTerms?.southafrica}`
    },
    {
      label: `${generalTerms?.rwanda}`,
      value: `${generalTerms?.rwanda}`
    },
    {
      label: `${generalTerms?.saotoméandpríncipe}`,
      value: `${generalTerms?.saotoméandpríncipe}`
    },
    {
      label: `${generalTerms?.senegal}`,
      value: `${generalTerms?.senegal}`
    },
    {
      label: `${generalTerms?.seychelles}`,
      value: `${generalTerms?.seychelles}`
    },
    {
      label: `${generalTerms?.sierraleone}`,
      value: `${generalTerms?.sierraleone}`
    },
    {
      label: `${generalTerms?.somalia}`,
      value: `${generalTerms?.somalia}`
    },
    {
      label: `${generalTerms?.sudan}`,
      value: `${generalTerms?.sudan}`
    },
    {
      label: `${generalTerms?.swaziland}`,
      value: `${generalTerms?.swaziland}`
    },
    {
      label: `${generalTerms?.tanzania}`,
      value: `${generalTerms?.tanzania}`
    },
    {
      label: `${generalTerms?.chad}`,
      value: `${generalTerms?.chad}`
    },
    {
      label: `${generalTerms?.togo}`,
      value: `${generalTerms?.togo}`
    },
    {
      label: `${generalTerms?.tunisia}`,
      value: `${generalTerms?.tunisia}`
    },
    {
      label: `${generalTerms?.uganda}`,
      value: `${generalTerms?.uganda}`
    },
    {
      label: `${generalTerms?.democraticrepublicofthecongo}`,
      value: `${generalTerms?.democraticrepublicofthecongo}`
    },
    {
      label: `${generalTerms?.zambia}`,
      value: `${generalTerms?.zambia}`
    },
    {
      label: `${generalTerms?.zimbabwe}`,
      value: `${generalTerms?.zimbabwe}`
    },
    {
      label: `${generalTerms?.eritrea}`,
      value: `${generalTerms?.eritrea}`
    },
    {
      label: `${generalTerms?.southsudan}`,
      value: `${generalTerms?.southsudan}`
    },
    {
      label: `${generalTerms?.othercountriesofafrica}`,
      value: `${generalTerms?.othercountriesofafrica}`
    },
    {
      label: `${generalTerms?.canada}`,
      value: `${generalTerms?.canada}`
    },
    {
      label: `${generalTerms?.theunitedstatesofamerica}`,
      value: `${generalTerms?.theunitedstatesofamerica}`
    },
    {
      label: `${generalTerms?.mexico}`,
      value: `${generalTerms?.mexico}`
    },
    {
      label: `${generalTerms?.antiguaybarbuda}`,
      value: `${generalTerms?.antiguaybarbuda}`
    },
    {
      label: `${generalTerms?.bahamas}`,
      value: `${generalTerms?.bahamas}`
    },
    {
      label: `${generalTerms?.barbados}`,
      value: `${generalTerms?.barbados}`
    },
    {
      label: `${generalTerms?.belize}`,
      value: `${generalTerms?.belize}`
    },
    {
      label: `${generalTerms?.costarica}`,
      value: `${generalTerms?.costarica}`
    },
    {
      label: `${generalTerms?.cuba}`,
      value: `${generalTerms?.cuba}`
    },
    {
      label: `${generalTerms?.dominique}`,
      value: `${generalTerms?.dominique}`
    },
    {
      label: `${generalTerms?.elsalvador}`,
      value: `${generalTerms?.elsalvador}`
    },
    {
      label: `${generalTerms?.grenada}`,
      value: `${generalTerms?.grenada}`
    },
    {
      label: `${generalTerms?.guatemala}`,
      value: `${generalTerms?.guatemala}`
    },
    {
      label: `${generalTerms?.haiti}`,
      value: `${generalTerms?.haiti}`
    },
    {
      label: `${generalTerms?.honduras}`,
      value: `${generalTerms?.honduras}`
    },
    {
      label: `${generalTerms?.jamaica}`,
      value: `${generalTerms?.jamaica}`
    },
    {
      label: `${generalTerms?.nicaragua}`,
      value: `${generalTerms?.nicaragua}`
    },
    {
      label: `${generalTerms?.panama}`,
      value: `${generalTerms?.panama}`
    },
    {
      label: `${generalTerms?.saintvincentandthegrenadines}`,
      value: `${generalTerms?.saintvincentandthegrenadines}`
    },
    {
      label: `${generalTerms?.dominicanrepublic}`,
      value: `${generalTerms?.dominicanrepublic}`
    },
    {
      label: `${generalTerms?.trinidadandtobago}`,
      value: `${generalTerms?.trinidadandtobago}`
    },
    {
      label: `${generalTerms?.saintlucia}`,
      value: `${generalTerms?.saintlucia}`
    },
    {
      label: `${generalTerms?.saintkittsandneviss}`,
      value: `${generalTerms?.saintkittsandneviss}`
    },
    {
      label: `${generalTerms?.argentina}`,
      value: `${generalTerms?.argentina}`
    },
    {
      label: `${generalTerms?.bolivia}`,
      value: `${generalTerms?.bolivia}`
    },
    {
      label: `${generalTerms?.brazil}`,
      value: `${generalTerms?.brazil}`
    },
    {
      label: `${generalTerms?.colombia}`,
      value: `${generalTerms?.colombia}`
    },
    {
      label: `${generalTerms?.chile}`,
      value: `${generalTerms?.chile}`
    },
    {
      label: `${generalTerms?.ecuador}`,
      value: `${generalTerms?.ecuador}`
    },
    {
      label: `${generalTerms?.guyana}`,
      value: `${generalTerms?.guyana}`
    },
    {
      label: `${generalTerms?.paraguay}`,
      value: `${generalTerms?.paraguay}`
    },
    {
      label: `${generalTerms?.peru}`,
      value: `${generalTerms?.peru}`
    },
    {
      label: `${generalTerms?.surinam}`,
      value: `${generalTerms?.surinam}`
    },
    {
      label: `${generalTerms?.uruguay}`,
      value: `${generalTerms?.uruguay}`
    },
    {
      label: `${generalTerms?.venezuela}`,
      value: `${generalTerms?.venezuela}`
    },
    {
      label: `${generalTerms?.othercountriesofamerica}`,
      value: `${generalTerms?.othercountriesofamerica}`
    },
    {
      label: `${generalTerms?.afghanistan}`,
      value: `${generalTerms?.afghanistan}`
    },
    {
      label: `${generalTerms?.saudiarabia}`,
      value: `${generalTerms?.saudiarabia}`
    },
    {
      label: `${generalTerms?.bahrain}`,
      value: `${generalTerms?.bahrain}`
    },
    {
      label: `${generalTerms?.bangladesh}`,
      value: `${generalTerms?.bangladesh}`
    },
    {
      label: `${generalTerms?.myanmar}`,
      value: `${generalTerms?.myanmar}`
    },
    {
      label: `${generalTerms?.china}`,
      value: `${generalTerms?.china}`
    },
    {
      label: `${generalTerms?.unitedarabemirates}`,
      value: `${generalTerms?.unitedarabemirates}`
    },
    {
      label: `${generalTerms?.philippines}`,
      value: `${generalTerms?.philippines}`
    },
    {
      label: `${generalTerms?.india}`,
      value: `${generalTerms?.india}`
    },
    {
      label: `${generalTerms?.indonesia}`,
      value: `${generalTerms?.indonesia}`
    },
    {
      label: `${generalTerms?.iraq}`,
      value: `${generalTerms?.iraq}`
    },
    {
      label: `${generalTerms?.iran}`,
      value: `${generalTerms?.iran}`
    },
    {
      label: `${generalTerms?.israel}`,
      value: `${generalTerms?.israel}`
    },
    {
      label: `${generalTerms?.japan}`,
      value: `${generalTerms?.japan}`
    },
    {
      label: `${generalTerms?.jordan}`,
      value: `${generalTerms?.jordan}`
    },
    {
      label: `${generalTerms?.cambodia}`,
      value: `${generalTerms?.cambodia}`
    },
    {
      label: `${generalTerms?.kuwait}`,
      value: `${generalTerms?.kuwait}`
    },
    {
      label: `${generalTerms?.laos}`,
      value: `${generalTerms?.laos}`
    },
    {
      label: `${generalTerms?.lebanon}`,
      value: `${generalTerms?.lebanon}`
    },
    {
      label: `${generalTerms?.malaysia}`,
      value: `${generalTerms?.malaysia}`
    },
    {
      label: `${generalTerms?.maldives}`,
      value: `${generalTerms?.maldives}`
    },
    {
      label: `${generalTerms?.mongolia}`,
      value: `${generalTerms?.mongolia}`
    },
    {
      label: `${generalTerms?.nepal}`,
      value: `${generalTerms?.nepal}`
    },
    {
      label: `${generalTerms?.oman}`,
      value: `${generalTerms?.oman}`
    },
    {
      label: `${generalTerms?.pakistan}`,
      value: `${generalTerms?.pakistan}`
    },
    {
      label: `${generalTerms?.qatar}`,
      value: `${generalTerms?.qatar}`
    },
    {
      label: `${generalTerms?.korea}`,
      value: `${generalTerms?.korea}`
    },
    {
      label: `${generalTerms?.northkorea}`,
      value: `${generalTerms?.northkorea}`
    },
    {
      label: `${generalTerms?.singapore}`,
      value: `${generalTerms?.singapore}`
    },
    {
      label: `${generalTerms?.syria}`,
      value: `${generalTerms?.syria}`
    },
    {
      label: `${generalTerms?.srilanka}`,
      value: `${generalTerms?.srilanka}`
    },
    {
      label: `${generalTerms?.thailand}`,
      value: `${generalTerms?.thailand}`
    },
    {
      label: `${generalTerms?.vietnam}`,
      value: `${generalTerms?.vietnam}`
    },
    {
      label: `${generalTerms?.brunei}`,
      value: `${generalTerms?.brunei}`
    },
    {
      label: `${generalTerms?.marshallislands}`,
      value: `${generalTerms?.marshallislands}`
    },
    {
      label: `${generalTerms?.yemen}`,
      value: `${generalTerms?.yemen}`
    },
    {
      label: `${generalTerms?.azerbaijan}`,
      value: `${generalTerms?.azerbaijan}`
    },
    {
      label: `${generalTerms?.kazakhstán}`,
      value: `${generalTerms?.kazakhstán}`
    },
    {
      label: `${generalTerms?.kirgyzstan}`,
      value: `${generalTerms?.kirgyzstan}`
    },
    {
      label: `${generalTerms?.tajikistan}`,
      value: `${generalTerms?.tajikistan}`
    },
    {
      label: `${generalTerms?.turkmeinetan}`,
      value: `${generalTerms?.turkmeinetan}`
    },
    {
      label: `${generalTerms?.uzbekistan}`,
      value: `${generalTerms?.uzbekistan}`
    },
    {
      label: `${generalTerms?.bhutan}`,
      value: `${generalTerms?.bhutan}`
    },
    {
      label: `${generalTerms?.palestineobserverstatenonmemberoftheunitednations}`,
      value: `${generalTerms?.palestineobserverstatenonmemberoftheunitednations}`
    },
    {
      label: `${generalTerms?.othercountriesofasia}`,
      value: `${generalTerms?.othercountriesofasia}`
    },
    {
      label: `${generalTerms?.australia}`,
      value: `${generalTerms?.australia}`
    },
    {
      label: `${generalTerms?.fiji}`,
      value: `${generalTerms?.fiji}`
    },
    {
      label: `${generalTerms?.newzeland}`,
      value: `${generalTerms?.newzeland}`
    },
    {
      label: `${generalTerms?.papuanewguinea}`,
      value: `${generalTerms?.papuanewguinea}`
    },
    {
      label: `${generalTerms?.solomonislands}`,
      value: `${generalTerms?.solomonislands}`
    },
    {
      label: `${generalTerms?.samoa}`,
      value: `${generalTerms?.samoa}`
    },
    {
      label: `${generalTerms?.tonga}`,
      value: `${generalTerms?.tonga}`
    },
    {
      label: `${generalTerms?.vanuatu}`,
      value: `${generalTerms?.vanuatu}`
    },
    {
      label: `${generalTerms?.micronesia}`,
      value: `${generalTerms?.micronesia}`
    },
    {
      label: `${generalTerms?.tuvalu}`,
      value: `${generalTerms?.tuvalu}`
    },
    {
      label: `${generalTerms?.cookislands}`,
      value: `${generalTerms?.cookislands}`
    },
    {
      label: `${generalTerms?.kiribati}`,
      value: `${generalTerms?.kiribati}`
    },
    {
      label: `${generalTerms?.nauru}`,
      value: `${generalTerms?.nauru}`
    },
    {
      label: `${generalTerms?.palau}`,
      value: `${generalTerms?.palau}`
    },
    {
      label: `${generalTerms?.easttimor}`,
      value: `${generalTerms?.easttimor}`
    },
    {
      label: `${generalTerms?.othercountriesofoceania}`,
      value: `${generalTerms?.othercountriesofoceania}`
    },


  ]

export const LanguageList = [
    {
      label: `${generalTerms?.languageagnostic}`,
      value: `${generalTerms?.languageagnostic}`,
    },
    {
      label: `${generalTerms?.amharic}`,
      value: `${generalTerms?.amharic}`,
    },
    {
      label: `${generalTerms?.arabic}`,
      value: `${generalTerms?.arabic}`,
    },
    {
      label: `${generalTerms?.bahasaindonesia}`,
      value: `${generalTerms?.bahasaindonesia}`,
    },
    {
      label: `${generalTerms?.bulgarian}`,
      value: `${generalTerms?.bulgarian}`,
    },
    {
      label: `${generalTerms?.burmese}`,
      value: `${generalTerms?.burmese}`,
    },
    {
      label: `${generalTerms?.chinese}`,
      value: `${generalTerms?.chinese}`,
    },
    {
      label: `${generalTerms?.croatian}`,
      value: `${generalTerms?.croatian}`,
    },
    {
      label: `${generalTerms?.czech}`,
      value: `${generalTerms?.czech}`,
    },
    {
      label: `${generalTerms?.danish}`,
      value: `${generalTerms?.danish}`,
    },
    {
      label: `${generalTerms?.dutch}`,
      value: `${generalTerms?.dutch}`,
    },
    {
      label: `${generalTerms?.english}`,
      value: `${generalTerms?.english}`,
    },
    {
      label: `${generalTerms?.finnsih}`,
      value: `${generalTerms?.finnsih}`,
    },
    {
      label: `${generalTerms?.french}`,
      value: `${generalTerms?.french}`,
    },
    {
      label: `${generalTerms?.german}`,
      value: `${generalTerms?.german}`,
    },
    {
      label: `${generalTerms?.hindi}`,
      value: `${generalTerms?.hindi}`,
    },
    {
      label: `${generalTerms?.hungarian}`,
      value: `${generalTerms?.hungarian}`,
    },
    {
      label: `${generalTerms?.italian}`,
      value: `${generalTerms?.italian}`,
    },
    {
      label: `${generalTerms?.khmer}`,
      value: `${generalTerms?.khmer}`,
    },
    {
      label: `${generalTerms?.latvian}`,
      value: `${generalTerms?.latvian}`,
    },
    {
      label: `${generalTerms?.lithuanian}`,
      value: `${generalTerms?.lithuanian}`,
    },
    {
      label: `${generalTerms?.malagasy}`,
      value: `${generalTerms?.malagasy}`,
    },
    {
      label: `${generalTerms?.malay}`,
      value: `${generalTerms?.malay}`,
    },
    {
      label: `${generalTerms?.polish}`,
      value: `${generalTerms?.polish}`,
    },
    {
      label: `${generalTerms?.portuguese}`,
      value: `${generalTerms?.portuguese}`,
    },
    {
      label: `${generalTerms?.romanian}`,
      value: `${generalTerms?.romanian}`,
    },
    {
      label: `${generalTerms?.russian}`,
      value: `${generalTerms?.russian}`,
    },
    {
      label: `${generalTerms?.serbian}`,
      value: `${generalTerms?.serbian}`,
    },
    {
      label: `${generalTerms?.slovak}`,
      value: `${generalTerms?.slovak}`,
    },
    {
      label: `${generalTerms?.spanish}`,
      value: `${generalTerms?.spanish}`,
    },
    {
      label: `${generalTerms?.swahili}`,
      value: `${generalTerms?.swahili}`,
    },
    {
      label: `${generalTerms?.swedish}`,
      value: `${generalTerms?.swedish}`,
    },
    {
      label: `${generalTerms?.thai}`,
      value: `${generalTerms?.thai}`,
    },
    {
      label: `${generalTerms?.turkish}`,
      value: `${generalTerms?.turkish}`,
    },
    {
      label: `${generalTerms?.ukranian}`,
      value: `${generalTerms?.ukranian}`,
    },
    {
      label: `${generalTerms?.uzbekistanian}`,
      value: `${generalTerms?.uzbekistanian}`,
    },
    {
      label: `${generalTerms?.vietnamese}`,
      value: `${generalTerms?.vietnamese}`,
    },


  ]
