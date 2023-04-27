
export const escapeRegExp = (text) => { // https://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript  
    if (text && text != "" && typeof (text) == "string")
        return text.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&');
    else {
        return text
    }
}




export const matchWithSpecialCharacters = (text) => {
    return text.split(' ').join(`[\ -[\\]{}()*+?.,\\/^$|#\,\-_\'\"]*`)
}

