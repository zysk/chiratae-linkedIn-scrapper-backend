import Conversion from "../models/conversion.model";
import ConversionBackup from "../models/conversionBackup.model";
import Language from "../models/language.model";

export const AddConversion = async (req, res, next) => {
    try {
        for (const el of req.body) {
            let conversionObj = await Conversion.findOne({ languageId: el.languageId }).exec()
            if (conversionObj) {
                await Conversion.findOneAndUpdate({ languageId: el.languageId }, el).exec()
            }
            else {
                await new Conversion(el).save()
            }
        }

        res.status(200).json({ message: "Conversions created", success: true });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateConversation = async (req, res, next) => {
    try {
        let obj = {
            "languageId": `${req.params.id}`,
            "Otherpleasespecify": "Andere (bitte angeben)",
            "accountAccessDesctiption": "Hierarchiebezogener Zugang \n(Eigentümer, Berater, Arbeiter,...)",
            "accountaccess": "Kontozugriff",
            "accountingFinanceCompliance": "Buchhaltung, Finanzen und Einhaltung von Vorschriften",
            "accountingfinanceregulationcompliance": "Buchhaltung, Finanzen und Einhaltung von Verordnungen",
            "additionaladdonstoyourproduct": "Zusätzliche Add-ons zu Ihrem Produkt (Produzieren Sie eigene zusätzliche Softwaremodule/Geräte oder gibt es zusätzliche Software/Hardware, die vom Endnutzer erworben werden kann? Wenn ja, beschreiben Sie bitte, wie sich Preis und Leistung ändern werden).",
            "addnewProduct": "Neues Produkt hinzufügen",
            "africa": "Afrika",
            "agribusinesses": "Landwirtschaftliche Unternehmen",
            "agribusinesssoftwareintegration": "Integration von Agrarsoftware (Externe Buchhaltung, POS, Rechnungssoftware,...)",
            "androidappmobile": "Android-App (mobil)",
            "any": "Jede",
            "appleIOSappmobile": "Apple IOS-App (mobil)",
            "arabic": "Arabisch",
            "asia": "Asien",
            "australiaOceania": "Australien und Ozeanien",
            "austria": "Österreich",
            "averagesetuptimeandinstallationforsoftwareandanewaccount": "Durchschnittliche Einrichtungszeit und Installation für Software und ein neues Konto?",
            "baseproductpricingonetimeandreoccurringfees": "Grundpreis des Produkts (einmalige und wiederkehrende Gebühren) Wenn Sie den genauen Preis nicht angeben können, geben Sie bitte die Logik dahinter an, d. h. Preis pro Hektar, Jahresgebühr, Gebühr pro Benutzer/Lizenz... Wenn es verschiedene Preisstufen gibt, geben Sie die Informationen bitte in das unten stehende Feld ein.",
            "bengali": "Begalisch",
            "bookkeeping": "Buchhaltung",
            "cereal": "Getreide",
            "chinese": "Chinesisch",
            "climateMonitoringAnalysis": "Klimaüberwachung und -analyse",
            "commoditypricetracking": "Preisverfolgung von Rohstoffen",
            "companyDescription": "Unternehmensbeschreibung",
            "companyEMailID": "E-mail-Adresse des Unternehmens",
            "companyFoundingDate": "Gründungsdatum des Unternehmens",
            "companyHqLocation": "Standort des Unternehmenssitzes",
            "companyName": "Name des Unternehmens",
            "companyOverview": "Unternehmensübersicht",
            "companyProductPortfolio": "Produktportfolio des Unternehmens",
            "companyRepresentatives": "Unternehmensvertreter",
            "companylogoupload": "Firmenlogo hochladen",
            "compatibility": "Kompatibilität",
            "contactPersonDetailsForCeressy": "Bitter geben Sie die Details der Person an, die als Ansprechpartner dienen soll",
            "contractors": "Lohnunternehmen",
            "cooperatives": "Genossenschaften",
            "corn": "Mais",
            "country": "Land",
            "cropAdvisor": "Pflanzenschutzberater",
            "cropSalesRetail": "Ernteverkauf und Einzelhandel",
            "cropzones": "Anbauzonen",
            "customerSupport": "Kundenservice",
            "custompricing": "Individuelle Preisgestaltung",
            "desktopwebbased": "Desktop (web-based)",
            "detailsofproductlisting": "Bitte geben Sie die Person an, die für Ceressy als einziger Ansprechpartner für die Produktauflistung dient",
            "differentsubscriptionlevelsnamepricingadditionalfeatures": "",
            "directsalestocustomers": "Direktverkauf an die Kunden",
            "diseasepestmanagement": "Krankheits- und Schädlingsbekämpfung",
            "documentation": "Dokumentation",
            "doyouhavethefollowingmediaavailableIfyescouldyoupleaseshareitviaemail": "",
            "doyouofferfreetrial": "Bieten Sie einen kostenlosen Test an?",
            "doyouprovidetrainingtouseyourproduct": "Bieten Sie Schulungen zur Verwendung Ihres Produkts an?",
            "eMailID": "E-mail Adresse",
            "eRPintegration": "ERP Integration",
            "emailhelpdesk": "E-Mail/Helpdesk",
            "emea": "EMEA",
            "english": "Englisch",
            "equipmentmachinerymanagement": "Maschinen- und Geräteverwaltung",
            "equipmentrecords": "Ausrüstungsaufzeichnungen",
            "europe": "Europa",
            "exporttaskstomaterialsandworkers": "Export von Aufgaben an Arbeiter und Materialien",
            "farmadmin": "Betriebsverwaltung und -planung",
            "farmmanagementsoftware": "Landwirtschafts-Management-Software (LMS)",
            "featureChecklist": "Checkliste Merkmale",
            "featureSectionDescription": "Bitte wählen Sie in diesem Abschnitt alle Funktionen aus, die auf Ihren LMS zutreffen",
            "feedandForageCrops": "uttermittel und Futtepflanzen",
            "fiber": "Faserpflanzen",
            "fieldcropmanagement": "Feld- und Erntemanagement",
            "fieldcropplanningbudgeting": "Feld- und Anbauplannung und -finanzierung",
            "fieldcrops": "Feldfrüchte",
            "fieldequipmentrecords": "Feld- und Ausrüstungsaufzeichnungen ",
            "fieldmapping": "Feldkartierung",
            "fieldrecordkeeping": "Aufzeichnungen im Feld",
            "flowers": "Blumen",
            "fodderandsugarbeet": "Futtermittel und Zuckerrüben",
            "foragecrops": "Futterpflanzen",
            "free": "Gratis",
            "french": "Französisch",
            "freshherbs": "Frische Kräuter",
            "fruit": "Früchte",
            "fruits": "Früchte",
            "fullyCustomized": "Vollständig personalisiert",
            "generateautomateddocumentation": "Automatisierte Dokumentation (Arbeitsplan, Tagesordnung)",
            "geomappingcropscouting": "Geo-Mapping und Crop Scouting",
            "german": "Deutsch",
            "germany": "Deutschland",
            "grasses": "Gräser",
            "groves": "Hainen",
            "growers": "Züchter",
            "growthstageanalysis": "Analyse des Wachstumsstadiums",
            "ha": "Hektar",
            "harvestanalysissales": "Ernteanalyse und Verkäufe",
            "harvestcrewequipmentdeployment": "Erntepersonal und Einrichtung der Ausrüstung",
            "harvestreportsinsights": "Ernteberichte und Einblicke",
            "herbs": "Kräuter",
            "hindi": "Hindi",
            "hops": "Hopfen",
            "howcanyoursoftwarebeused": "Wie kann Ihre Software genutzt werden?",
            "howdoesyoursoftwaregatherdata": "Wie erfasst Ihre Software Daten?",
            "iSOBUScompliance": "(ISO)-BUS System Einhaltung",
            "ifyesIstrainingfreeofcost": "Wenn ja, ist die Training kostenlos?",
            "ifyoucannotsharetheexactpricePleasesharethelogicbehindit": "",
            "igivepermissiontolistmycompanysproductonCeressyplatformusingtheinformationprovidedinthislistingform": "Ich erteile die Erlaubnis, das Produkt meines Unternehmens auf der Ceressy-Plattform unter Verwendung der in diesem Formular angegebenen Informationen zu listen. Ceressy kann auch die Daten veröffentlichen, die in öffentlichen Quellen verfügbar sind. Ceressy behält sich das Recht vor, das Produktverzeichnis anzupassen (z.B. zu kürzen, umzuformulieren), um es für die Nutzer besser geeignet zu machen. ",
            "ihavereadandagreedtoCeressystermsandconditionsfortheuseoftheceressyplatform": "Ich habe die Allgemeinen Geschäftsbedingungen von Ceressy für die Nutzung der Ceressy-Plattform gelesen und stimme ihnen zu.",
            "imaginganalyticsviadrones": "Bildanalyse über Drohnen",
            "india": "Indien",
            "industrial": "Industriepflanzen",
            "infieldanalytics": "In-Feld-Analyse",
            "inperson": "in Person",
            "inputinventorymanagement": "Input- und Inventarmanagement",
            "inputmanagement": "Inputverwaltung (Saatgut, Düngemittel,...)",
            "installationSetupPricing": "Installation, Einrichtung und Preisgestaltung",
            "ioTSesnors": "IoT-Sensoren",
            "italian": "Italienisch",
            "itinerariesplanningandscheduling": "Planung der Tagesordnung und Terminierung ",
            "iwouldliketobeaddedtoCeressynewslettersmarketingpromotionalactivities": "Ich möchte in die Newsletter, Marketing- und Werbeaktivitäten von Ceressy aufgenommen werden.",
            "japanese": "Japanisch",
            "javanese": "Javanisch",
            "keyvaluepropositionorExpectedROIorusecasestudy": "",
            "korean": "Koreanisch",
            "laborManagement": "Arbeitsverwaltung",
            "lahnda": "Lahnda",
            "languageName": "German",
            "languageSupported": "Unterstützte Sprachen",
            "latam": "Lateinamerika",
            "legumes": "Hülsenfrüchte",
            "lessthan": "weniger als",
            "linkstoproductreviewsthatwecanuseonourplatform": "Links zu Produktbewertungen, die wir auf unserer Plattform verwenden können?",
            "linkstoproductvideosorphotos": "Links zu Produktvideos oder Fotos",
            "liveonline": "Live online",
            "livestock": "Viehzucht",
            "longDescription": "Detallierte Beschreibung (Beschreiben Sie Ihr Produkt in 150-200 Zeichen)",
            "managerforhandlingsalesleads": "Manager für die Bearbeitung von Leads",
            "manualinputbyusers": "Manuelle Eingabe durch Nutzer",
            "marathi": "Marathi",
            "marketsserved": "Bediente Märkte ",
            "meadowsandpastures": "Wiesen und Weiden",
            "media": "Medien",
            "meteoStationsandsoilsensors": "Wetterstationen und Bodensensoren",
            "mixedFarmCropLivestock": "Gemischter Betrieb (Ackerbau + Viehzucht)",
            "modeofuse": "Nutzungsart",
            "multipleusersperaccount": "mehrere Benutzer pro Konto",
            "name": "Name",
            "no": "Nein",
            "northAmerica": "Nord-Amerika",
            "noteFarmSize": "Note: we understand that farm type & size heavily depend on markets being served. We would be using this information to allow farmers to filter out relevant solutions for them and to find high quality leads for your company.",
            "notecropsserving": "Hinweis: Wenn Sie mehr als 5 bis 10 Kulturen anbieten, können Sie uns entweder eine Liste zur Verfügung stellen (falls sie bereits existiert) oder einfach die Vielfalt der Kulturen erwähnen",
            "nurseries": "Anzucht",
            "nuts": "Nüsse",
            "offlinemode": "Offline-Modus",
            "oilseeds": "Ölsaaten",
            "onetimelicense": "Einmalige Lizenz",
            "oneuserperaccount": "ein Benutzer pro Konto",
            "onlinechat": "Online-Chat",
            "onlinemodeonly": "Online-Modus",
            "operationalplanning": "Betriebsplanung",
            "operationsPlanning": "Operationsplanung, -terminierung und -verfolgung",
            "orchards": "Obstgärten",
            "orderprocessingtagging": "Auftragsbearbeitung und Kennzeichnung",
            "ornamentals": "Zierpflanzen",
            "otherfeatures": "Andere Merkmale",
            "others": "Sonstiges",
            "partiallyCustomized": "Teilweise personalisiert",
            "pestdiseasealert": "Warnung von Schädlingen und Krankheiten",
            "phone": "Telefon",
            "phonenumber": "Telefonnummer",
            "plantations": "Anpflanzungen",
            "pleaseEnterlinksformedia": "Bitte Links für Medien eingeben",
            "pleaseenterdetailsofyourcustomers": "Bitte geben Sie die Details Ihres Kunden ein",
            "pleasementionotherrelevantcrops": "Bitte andere relevante Kulturen nennen",
            "pleaseprovidedetailsforpricing": "Bitte machen Sie detaillierte Angaben zur Preisgestaltung. Z. B. verschiedene Abonnementstufen oder einmalige Lizenzgebühren (Name, Preis, zusätzliche Funktionen)",
            "portuguese": "Portugiesisch",
            "potatoes": "Kartoffeln",
            "precisionApplication": "Präzisionsanwendung",
            "precisionagriculture": "Präzisionslandwirtschaft",
            "pricingDetails": "Details zur Preisgestaltung",
            "product": "Produkt",
            "productCount": "Produktanzahl",
            "productName": "Produktname",
            "productPortfolio": "Produktportfolio",
            "productType": "Produkttyp",
            "productvideoandphotoupload": "Hochladen von Produktvideos und Fotos",
            "profitpredictionmaps": "Ertrags- und Gewinnprognosen",
            "protectedcropsgreenhousesnethouses": "Geschützte Kulturen (Gewächshäuser/Schattenhaus)",
            "rapeseed": "Raps",
            "realTimedeliverystatusmonitoring": "Echtzeit-Überwachung der Lieferstatus",
            "realtimefieldmonitoring": "Echtzeit-Feldüberwachung",
            "realtimefleettrackingutilization": "Flottenverfolgung und -nutzung in Echtzeit",
            "realtimeoperationtracking": "Aufgabenverfolgung in Echtzeit",
            "regulationcompliance": "Einhaltung von Vorschriften",
            "relevantcrops": "Relevante Kulturpflanzen",
            "reportoftasksandoccupancyrates": "Reports über Aufgaben und Belegungsraten",
            "rice": "Reis",
            "russian": "Russisch",
            "satellitebasedinsights": "Satellitengestützte Ermittlung",
            "satelliteweatherinsights": "Satellitenwetter-Einsichten",
            "save": "Speichern",
            "scouting": "Scouting",
            "seedapplicationmonitoring": "Saatgutausbringung und -überwachung",
            "seeds": "Saatgut",
            "shortDescription": "Kurzbeschreibung (Beschreiben Sie Ihr Produkt in 150-200 Zeichen)",
            "skutaggingtraceabilitytothesource": "SKU-Kennzeichnung und Rückverfolgbarkeit bis zur Quelle",
            "soilCrophealth": "Bodenfrucht und Gesundheit",
            "soildataanalysis": "Analyse von Bodendaten",
            "soilsampling": "Bodenprobenahme",
            "soilsensinganalysis": "Bodensensorik und -analyse",
            "soybeans": "Sojabohnen",
            "spanish": "Spanisch",
            "spices": "Gewürze",
            "standardizedOnly": "Standardisiert",
            "subSaharan": "Subsahara",
            "subscription": "Abonnement",
            "switzerland": "Schweiz",
            "tamil": "Tamilisch",
            "targetCustomer": "Zielkunden",
            "telugu": "Telugu",
            "termsConditions": "Bedingungen und Konditionen",
            "tobacco": "tobacco",
            "topographyanalysis": "Topographie-Analyse",
            "treesandshrubsoutsideforest": "Bäume und Sträucher (außerhalb des Waldes)",
            "turnips": "Rüben",
            "urbanfarms": "Städtische Bauernhöfe (vertikal, auf Dächern, in Gebäuden, Gemeinschaftsbetriebe)",
            "urdu": "Urdu",
            "usersperaccount": "Benutzer pro Konto",
            "variablerateapplicationVRAautomationcontrol": "Automatisierte Steuerung der variablen Ausbringungsrate (VRA)",
            "variablerateapplicationmaps": "variableAusbringungsrate (VRA)",
            "vegetables": "Gemüse",
            "viatelephone": "per Telefon",
            "viathirdpartysoftware": "über Software von Drittanbietern",
            "videos": "Videos",
            "vietnamese": "Vietnamesisch",
            "vine": "Wein",
            "vineyards": "Weinberge",
            "waterManagement": "Wasserverwaltung",
            "weatherforecast": "Wetterprognose",
            "weatherstationcompatibility": "Kompatibilität mit Wetterstationen",
            "webinars": "Webinare",
            "website": "Website",
            "whatdescribesyoursoftwarethebest": "Was beschreibt Ihre Software am besten?",
            "whatisyourpricingmodel": "Was ist Ihr Preismodell?",
            "whattypeofcustomersupportdoyouoffer": "Welche Art von Kundensupport bieten Sie an?",
            "whattypeofsoftwaredoyouprovide": "Welche Art von Software bieten Sie?",
            "whattypeoftrainingsdoyouoffer": "Welche Art von Schulungen bieten Sie?",
            "whattypesofleadsareyoumostinterestedin": "An welchen Arten von Leads sind Sie am meisten interessiert?",
            "whichfarmsizegrouparebestservedbyyoursolution": "Für welche Betriebsgrößengruppe(n) ist Ihre Lösung am besten geeignet? (wählen Sie alle zutreffenden Punkte aus)",
            "whichsystemisyourFMScompatiblewithListallthatapplies": "Mit welchem(n) System(en) ist (sind) Ihr FMS kompatibel? Alles auflisten, was zutrifft",
            "whichsystemisyourFMSisnotcompatiblewithListallthatapplies": "Gibt es ein System, mit dem Ihr FMS nicht kompatibel ist? Wenn ja, führen Sie diese bitte auf.",
            "whichtypesoffarmscanyouservewiththisproduct": "Welche Arten von Betrieben können Sie mit diesem Produkt bedienen? (wählen Sie alle zutreffenden aus)",
            "whoareyourbiggestcompetitorsCompaniesandproductnames": "Wer sind Ihre größten Konkurrenten? (Unternehmen und Produktnamen)",
            "whoareyourcustomers": "Wer sind Ihre Kunden?",
            "yes": "Ja",
            "yieldanalysiscropplanning": "Ertragsanalyse und Anbauplannung",
            "yieldpredictionforecast": "Ertrags-und Gewinnprognosen"
        }



        await Conversion.findOneAndUpdate({ languageId: req.params.id }, obj).exec()
        res.status(200).json({ message: 'updates', success: true });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
}




export const getConversions = async (req, res, next) => {
    try {

        let query = {}

        if (req.query.isActive) {
            query = { ...query, isActive: req.query.isActive }
        }


        let LanguageArr = await Language.find(query).exec()

        let ConversionArr = await Conversion.find({ languageId: { $in: [...LanguageArr.map(el => el._id)] } }).exec();

        res.status(200).json({ message: "Conversions found", data: ConversionArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


















































































