
import product from "../models/product.model.";
import userCart from "../models/userCart.model";
import authorizeJwt from "../middlewares/auth.middleware";
import storeFileAndReturnNameBase64 from "../helpers/fileSystem";

// export const addToCart = async (req, res, next) => {
//     try {
//         let { items, } = req.body;
//         var findCart = await userCart.findOne({ userId: req.user.userId });
//         console.log(findCart)
//         if (findCart) {
//             for (let i = 0; i < items.length; i++) {
//                 // let product = await vendorProducts.findOne({ _id: items[i].productId });
//                 let productIndex = findCart.items.findIndex(p => p.productId == items[i].productId);
//                 if (productIndex > -1) {
//                     findCart.items[productIndex].quantity += items[i].quantity;

//                     await findCart.save()

//                 } else {
//                     const cartDetail = await userCartModel
//                         .findOneAndUpdate({ userId: findCart.userId },
//                             { $addToSet: { items: { $each: items } } }, { new: true })
//                 }
//             }
//         }
//         if (!findCart) {
//             const data = await userCartModel.create(req.body)
//         }
//         res.status(201).json({ status: true, message: 'cart created', });
//     }
//     catch (err) {
//         next(err);
//     }
// };
export const getCart = async (req, res, next) => {

    try {
        // const getCart = await userCartModel.findbyId(req.params.id).exec();
        const getCart = await userCart.findOne({ userId: req.params.id }).exec();
        // if (!getCart) throw ({ status: 400, message: ' add product', data: req.params.id });
        if (!getCart) await userCart.create({ userId: req.params.id, item: [] });
        res.status(200).json({ message: "cart details", data: getCart, success: true });

    } catch (err) {
        next(err);
    }
};

export const removeProduct = async (req, res, next) => {
    try {
        let { items, } = req.body;
        const userCartObj = await userCart.findOne({ userId: req.params.id });
        const findCart = await userCart.findOneAndUpdate({ userId: req.params.id, "items.productId": items.productId }, { $inc: { "items.$.quantity": -1 } })
        // console.log(findCart, "34567890");

        // if(findCart.items[])
        // console.log(userCartObj, "a894284209");
        for (let i = 0; i < findCart.items.length; i++) {
            if (findCart.items[i].quantity == 0) {
                userCartObj.items.splice(0);
                await userCartObj.save()
            }
        }
        // for (let i = 0; i < items.length; i++) {
        //     let productIndex = userCartObj.items.findIndex(p => p.productId == items[i].productId);
        //     if (userCartObj.items[0].quantity == 0) {
        //         userCartObj.items.splice(i, 1);
        //         await userCartObj.save()
        //     } else if (productIndex > 0) {
        //         userCartObj.items[productIndex].quantity -= items[i].quantity;
        //         await userCartObj.save()
        //     }
        // }
        // console.log(userCartObj, "92229119")
        if (!userCartObj) throw ({ status: 400, message: "cart  Not Found" });
        res.status(200).json({ message: "product removed from cart", dat: findCart, success: true });
    } catch (err) {
        next(err);
    }
};
// jjjjjjjjj
export const updateCart = async (req, res, next) => {
    try {
        let { items, } = req.body;
        const userCartObj = await userCart.findOne({ userId: req.params.id });
        console.log(userCartObj, "a894284209");
        var ab;
        // const findCart = await userCart.findOneAndUpdate({ items: { $elemMatch: { productId: items[0].productId } }, $inc: { quantity: 1 } })
        // const findCart = await userCart.findOneAndUpdate({ userId: req.params.id, "items.productId": items.productId },{ upsurd: true }, { $inc: { "items.$.quantity": 1 } }) 

        // ddd\\\
        if (userCartObj.items.some( el=> `${el.productId}` ==  req.body.items.productId)) {
            ab = await userCart.findOneAndUpdate({ userId: req.params.id, "items.productId": items.productId }, { $inc: { "items.$.quantity": 1 } })
        } else {
            ab = await userCart.findOneAndUpdate({ userId: req.params.id, }, { $push: { items: items } })
        }

        // for (let i = 0; i < items.length; i++) {
        //     // let product = await vendorProducts.findOne({ _id: items[i].productId });
        //     let productIndex = userCartObj.items.findIndex(p => p.productId == items[i].productId);
        //     if (productIndex > -1) {
        //         userCartObj.items[productIndex].quantity += items[i].quantity;
        //         await userCartObj.save()
        //     } else {
        //         const cartDetail = await userCart
        //             .findOneAndUpdate({ userId: req.params.id },
        //                 { $addToSet: { items: { $each: items } } }, { new: true })
        //     }
        // }
        // console.log(userCartObj, "92229119")
        // if (!userCartObj) throw ({ status: 400, message: "cart  Not Found" });
        res.status(200).json({ message: "cart Updated", dat: ab, success: true });

    } catch (err) {
        next(err);
    }
};
