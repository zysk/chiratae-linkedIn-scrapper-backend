import Contact from "../models/contact.model";

export const AddContact = async (req, res, next) => {
    try {
        // console.log(req.body)
        // console.log(new RegExp(`^${req.body.name}$`))
        // let LanguageObj = await Contact.findOne({ name: new RegExp(`^${req.body.name}$`) }).exec();
        await new Contact(req.body).save();
        res.status(200).json({ message: "Thank you for contacting us, we will reach out to you soon !", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const getContacts = async (req, res, next) => {
    try {

        let contactArr = await Contact.find().exec();

        res.status(200).json({ message: "Contacts found", data: contactArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
