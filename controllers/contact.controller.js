import Contact from "../models/contact.model";

export const AddContact = async (req, res, next) => {
    try {
        // console.log(req.body)
        // console.log(new RegExp(`^${req.body.name}$`))
        // let LanguageObj = await Contact.findOne({ name: new RegExp(`^${req.body.name}$`) }).exec();
        await new Contact(req.body).save();
        res.status(200).json({ message: "Thank you for contacting us. We have received your request, we will reach out to you soon !", success: true });
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
export const updateContact = async (req, res, next) => {
    try {
        console.log(req.body, "leadddddd")
        let LanguageExistsObj = await Contact.findById(req.params.id).exec();
        if (!LanguageExistsObj) {
            throw new Error("Contact not found , you might have already deleted it please reload the page once.");
        }
        await Contact.findByIdAndUpdate(req.params.id, { status: req.body.status }).exec();

        res.status(200).json({ message: `Contact Updated`, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
