import { matchWithSpecialCharacters } from "./regexHelpers"

export const CalculateRating = (obj) => {
    // if (obj.name == "Aman Raj") {
    //     console.log("##############################################################################################################################################################")
    //     obj.educationArr.forEach(el => {
    //         let regexp = new RegExp(matchWithSpecialCharacters('indian institute of technology'), 'i')
    //         console.log(el.schoolName, regexp, regexp.test(el.schoolName))

    //     })
    //     console.log(obj.name, "name")
    //     console.log("##############################################################################################################################################################")
    // }
    if (
        (
            (
                obj.educationArr.some(el => new RegExp(matchWithSpecialCharacters('IIT'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('indian institute of technology'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('bits'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Birla Institute of Technology and Science'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Shri Ram College of Commerce'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('srcc'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Lady Shri Ram College'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Lady Shri Ram'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('LSR'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Indian Institute of Management Ahmedabad'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Indian Institute of Management Bangalore'), 'i').test(el.schoolName)
                )
            )
            &&
            (
                obj.experienceArr.some(el => new RegExp(matchWithSpecialCharacters('stealth'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth startup'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth company'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Mckinsey'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Boston Consulting Group'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('BCG'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('B C G'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Freshworks'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Zoho'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Flipkart'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('Bain'), 'i').test(el.company) ||
                    new RegExp(matchWithSpecialCharacters('stealth'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('stealth company'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('stealth company'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Mckinsey'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Boston Consulting Group'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('BCG'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('B C G'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Freshworks'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Zoho'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Flipkart'), 'i').test(el.companyDetail) ||
                    new RegExp(matchWithSpecialCharacters('Bain'), 'i').test(el.companyDetail)
                )
            )
        )
    ) {
        return "HIGH"
    }
    else if (
        (
            (
                obj.educationArr.some(el => new RegExp(matchWithSpecialCharacters('IIT'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('indian institute of technology'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('bits'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Birla Institute of Technology and Science'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('IIM Calcutta'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('IIM Ahmedabad'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('IIM Bangalore'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Indian Institute of Management Calcutta'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Indian Institute of Management Ahmedabad'), 'i').test(el.schoolName) ||
                    new RegExp(matchWithSpecialCharacters('Indian Institute of Management Bangalore'), 'i').test(el.schoolName)
                )
            )
            ||
            (
                (
                    obj.experienceArr.some(el => new RegExp(matchWithSpecialCharacters('Mckinsey'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('Boston Consulting Group'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('BCG'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('B C G'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('Freshworks'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('Zoho'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('Flipkart'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('Bain'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('Mckinsey'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('Boston Consulting Group'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('BCG'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('B C G'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('Freshworks'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('Zoho'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('Flipkart'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('Bain'), 'i').test(el.companyDetail)
                    )
                    &&
                    !obj.experienceArr.some(el => (new RegExp(matchWithSpecialCharacters('stealth'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('stealth startup'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('stealth company'), 'i').test(el.company) ||
                        new RegExp(matchWithSpecialCharacters('stealth'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('stealth company'), 'i').test(el.companyDetail) ||
                        new RegExp(matchWithSpecialCharacters('stealth company'), 'i').test(el.companyDetail)))
                )
            )
        )
    ) {
        if (obj?.experienceArr && obj?.experienceArr.length > 0 && obj?.experienceArr[0]?.year) {
            let yearArr = `${obj?.experienceArr[0]?.year}`.split("·")[1].trim().split(" ")
            // console.log(yearArr, "yearArr")
            // console.log((yearArr[1].includes("mo")), "boolean")
            if (yearArr.length > 0 && yearArr.length == 4) {
                if (((new RegExp(matchWithSpecialCharacters('founder'), 'i').test(obj.experienceArr[0].company) || new RegExp(matchWithSpecialCharacters('founder'), 'i').test(obj.experienceArr[0].companyDetail)) && ((yearArr.some(elx => new RegExp(matchWithSpecialCharacters('mo'), 'i').test(elx))) || ((yearArr.some(elx => new RegExp(matchWithSpecialCharacters('yr'), 'i').test(elx))) && parseInt(yearArr[0]) <= 1 && parseInt(yearArr[2]) <= 6)))) {
                    return "MEDIUM"
                }
                else {
                    return "LOW"
                }
            }
            else if ((yearArr[1].includes("mo"))) {
                return "MEDIUM"
            }
            else if ((yearArr[1].includes("yr") && parseInt(yearArr[1]) <= 1)) {
                return "MEDIUM"
            }
            else {
                return "LOW"
            }
        }
        else {
            return "LOW"
        }
    }
    else {
        return "LOW"
    }
}