import HomepageBanner from "../models/homepageBanner.model";
import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
export const AddHomePageBanner = async (req, res, next) => {
    try {

        if (req.body.imageUrl) {
            req.body.imageUrl = await storeFileAndReturnNameBase64(req.body.imageUrl)
        }
        // console.log(req.body)
        // console.log(new RegExp(`^${req.body.name}$`))
        // let LanguageObj = await HomepageBanner.findOne({ name: new RegExp(`^${req.body.name}$`) }).exec();
        await new HomepageBanner(req.body).save();
        res.status(200).json({ message: "Added Successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getHomePageBanner = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.visibleOnHomePage) {
            query = { visibleOnHomePage: req.query.visibleOnHomePage }
        }

        let HomepageBannerArr = await HomepageBanner.find(query).exec();
        res.status(200).json({ message: "HomepageBanners found", data: HomepageBannerArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteHomePageBanner = async (req, res, next) => {
    try {
        let HomepageBannerObj = await HomepageBanner.findById(req.params.id).exec();
        if (!HomepageBannerObj) {
            throw new Error("No banner found please reload the page and check again")
        }
        await HomepageBanner.findByIdAndDelete(req.params.id).exec();
        res.status(200).json({ message: "HomepageBanners found", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const updateHomePageBanner = async (req, res, next) => {
    try {
        let HomepageBannerObj = await HomepageBanner.findById(req.params.id).exec();
        if (!HomepageBannerObj) {
            throw new Error("No banner found please reload the page and check again")
        }
        await HomepageBanner.findByIdAndUpdate(req.params.id, { visibleOnHomePage: req.body.visibleOnHomePage }).exec();
        res.status(200).json({ message: "Homepage Banner Updated", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
