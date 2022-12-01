import mongoose from "mongoose";

let homepageBanner = mongoose.Schema(
    {
        imageUrl: String,
        visibleOnHomePage: {
            default: false,
            type: Boolean
        }
    },
    { timestamps: true }
);
export default mongoose.model("homepageBanner", homepageBanner);
