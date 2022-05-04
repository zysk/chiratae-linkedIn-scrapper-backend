import fs from "fs";

export const storeFileAndReturnNameBase64 = async (base64) => {
    let tempBase64 = base64.split(",");
    let extension = tempBase64[0].split("/")[1];
    let filename = new Date().getTime() + `.${extension}`;

    fs.writeFile(filename, tempBase64[1], "base64", (err) => {
        if (err) {
            console.log("unable to save file");
        }
    });
    return filename;
};
