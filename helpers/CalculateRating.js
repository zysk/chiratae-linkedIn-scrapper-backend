import { matchWithSpecialCharacters } from "./regexHelpers"

export const CalculateRating = (obj) => {

    if (
        // `${el.schoolName}`.toLowerCase().includes("bits".toLowerCase()) ||
        // `${el.schoolName}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.schoolName}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.schoolName}`.toLowerCase().includes("srcc".toLowerCase()) ||
        // `${el.schoolName}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.schoolName}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.schoolName}`.toLowerCase().includes("LSR".toLowerCase()) ||
        // `${el.schoolName}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.schoolName}`.toLowerCase().includes("".toLowerCase())
        // &&
        // `${el.company}`.toLowerCase().includes("stealth startup".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("stealth company".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("stealth".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("stealth startup".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("stealth company".toLowerCase())
        // ||
        // `${el.company}`.toLowerCase().includes("Mckinsey".toLowerCase())
        // `${el.company}`.toLowerCase().includes("stealth startup".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("stealth company".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("BCG".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("B C G".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("Freshworks".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("Zoho".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("Flipkart".toLowerCase()) ||
        // `${el.company}`.toLowerCase().includes("Bain".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("".toLowerCase()) ||
        // `${el.companyDetail}`.toLowerCase().includes("ny".toLowerCase())
        (
            obj.educationArr.some(el => new RegExp(matchWithSpecialCharacters('IIT', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('indian institue of technology', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('bits', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('Birla Institute of Technology and Science', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('Shri Ram College of Commerce', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('srcc', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('Lady Shri Ram College', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('Lady Shri Ram', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('LSR', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('Indian Institute of Management Ahmedabad', 'i')).test(el.schoolName) ||
                new RegExp(matchWithSpecialCharacters('Indian Institute of Management Bangalore', 'i')).test(el.schoolName)
            )
        )
        &&
        (

            (

                obj.experienceArr.some(el => new RegExp(matchWithSpecialCharacters('stealth', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth startup', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth company', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('stealth company', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('stealth company', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Mckinsey', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Boston Consulting Group', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('BCG', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('B C G', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Freshworks', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Zoho', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Flipkart', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Bain', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth startup', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth company', 'i')).test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Mckinsey', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Boston Consulting Group', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('BCG', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('B C G', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Freshworks', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Zoho', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Flipkart', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Bain', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('stealth', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('stealth startup', 'i')).test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('stealth company', 'i')).test(el.companyDetail)
                )
            )
            // ||
            // (
            //     obj.experienceArr.some(el => 
            //     )
            // )
        )

    ) {
        return "HIGH"
    }
    // else if (
    //     (
    //         obj.educationArr.some(el => `${el.schoolName}`.toLowerCase().includes("IIT".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("indian institue of technology".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("bits".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("Birla Institute of Technology and Science".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("IIM Calcutta".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("IIM Ahmedabad".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("IIM Bangalore".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("Indian Institute of Management Calcutta".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("Indian Institute of Management Ahmedabad".toLowerCase()) ||
    //             `${el.schoolName}`.toLowerCase().includes("Indian Institute of Management Bangalore".toLowerCase())
    //         )
    //     )
    //     ||
    //     (
    //         obj.experienceArr.some(el => `${el.company}`.toLowerCase().includes("Mckinsey".toLowerCase()) ||
    //             `${el.company}`.toLowerCase().includes("Boston Consulting Group".toLowerCase()) ||
    //             `${el.company}`.toLowerCase().includes("BCG".toLowerCase()) ||
    //             `${el.company}`.toLowerCase().includes("B C G".toLowerCase()) ||
    //             `${el.company}`.toLowerCase().includes("Freshworks".toLowerCase()) ||
    //             `${el.company}`.toLowerCase().includes("Zoho".toLowerCase()) ||
    //             `${el.company}`.toLowerCase().includes("Flipkart".toLowerCase()) ||
    //             `${el.company}`.toLowerCase().includes("Bain".toLowerCase()) ||
    //             `${el.companyDetail}`.toLowerCase().includes("Mckinsey".toLowerCase()) ||
    //             `${el.companyDetail}`.toLowerCase().includes("Boston Consulting Group".toLowerCase()) ||
    //             `${el.companyDetail}`.toLowerCase().includes("BCG".toLowerCase()) ||
    //             `${el.companyDetail}`.toLowerCase().includes("B C G".toLowerCase()) ||
    //             `${el.companyDetail}`.toLowerCase().includes("Zoho".toLowerCase()) ||
    //             `${el.companyDetail}`.toLowerCase().includes("Freshworks".toLowerCase()) ||
    //             `${el.companyDetail}`.toLowerCase().includes("Flipkart".toLowerCase()) ||
    //             `${el.companyDetail}`.toLowerCase().includes("Bain".toLowerCase()) ||
    //             (!`${el.company}`.toLowerCase().includes("stealth startup".toLowerCase())) ||
    //             (!`${el.company}`.toLowerCase().includes("stealth company".toLowerCase())) ||
    //             (!`${el.companyDetail}`.toLowerCase().includes("stealth".toLowerCase())) ||
    //             (!`${el.companyDetail}`.toLowerCase().includes("stealth startup".toLowerCase())) ||
    //             (!`${el.companyDetail}`.toLowerCase().includes("stealth company".toLowerCase()))
    //         )
    //     )
    // ) {
    //     if (obj?.experienceArr && obj?.experienceArr.length > 0 && obj?.experienceArr[0]?.year) {
    //         let yearArr = `${obj?.experienceArr[0]?.year}`.split("·")[1].trim().split(" ")
    //         console.log(yearArr, "yearArr")
    //         console.log((yearArr[1].includes("mo")))
    //         if (yearArr.length > 0 && yearArr.length == 4) {
    //             if (((obj.experienceArr[0].company.toLowerCase().includes("founder") || obj.experienceArr[0].companyDetail.toLowerCase().includes("founder")) && ((yearArr[1].includes("mo")) || (yearArr[1].includes("yr") && parseInt(yearArr[0]) <= 1 && parseInt(yearArr[2]) <= 6)))) {
    //                 return "MEDIUM"
    //             }

    //             else {
    //                 return "LOW"
    //             }
    //         }
    //         else if ((yearArr[1].includes("mo"))) {
    //             return "MEDIUM"
    //         }
    //         else if ((yearArr[1].includes("yr") && parseInt(yearArr[1]) <= 1)) {
    //             return "MEDIUM"
    //         }
    //         else {
    //             return "LOW"
    //         }
    //     }
    //     else {
    //         return "LOW"
    //     }
    // }
    else {
        return "LOW"
    }
}