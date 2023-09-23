const userData = require('../model/userModel').userCollection
const productData = require('../model/ProductsModule').ProductCollection
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const { response } = require('../app');
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')
const categoryData = require('../model/CategoryModel');
const wishlistData = require('../model/wishlistModel').UserwishlistData
const session = require('express-session');
const CartData = require('../model/CartModel').UserCartDatas
const UserAddress = require('../model/UserAddressModel').UserAddress
const userorders = require('../model/OrdersModel').userordersCollection
const banners = require('../model/BannerModel').bannersCollection
const Coupons = require('../model/adminCouponModel').CouponsCollection
const Razorpay = require('razorpay');
const async = require('hbs/lib/async');
const { log } = require('console');

require('dotenv').config()
console.log(process.env.KEY_ID);
var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

var handlebars = require('handlebars/runtime');
handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});



const vv = async (req, res) => {

    res.render('signupForm', { layout: 'layout' })
}


let otpa
let error
let ShowSingleproduct
let mencategory

let categoryDetail
let errorlogin
let errmessage
let errorloginPassword
let userEmail
let AccountBlocked
let navCategory

let errorCoupons
let username

let navloop
// let userProfiledatas
let singleproductId
let user
let addresfounded
let subTotal
let usercartAllProducts
let getCheckedOneddress
var Save = false; // initialize the global variable

// !--================Start User Home Page =================--//
const getUserHome = async function (req, res, next) {
    try {

 
        let offerSmartPhones = await productData.find({ $and: [{ ProductCategory: 'SmartPhones' }, { status: { $nin: false } }] }).limit(5).lean()
        //Eiser Home page  laptops //
        let offerLaptops = await productData.findOne({ $and: [{ ProductCategory: 'Laptops' }, { status: { $nin: false } }] }).lean()

        let someProducts = await productData.find({ status: { $nin: false } }).limit(4).lean()


        console.log(req.session.username);

        console.log('ummmaaaaa');
        if (req.session.username == null) {

            req.session.homeName = null
        }
        let bannerCarouselSlider = await banners.find({ status: { $nin: false } }).skip(1).lean()

        let defaultImg = await banners.find({ status: { $nin: false } }).lean()

        let MainBanner = defaultImg[0]


        let homeName = req.session.homeName

        res.render('user_Home', { MainBanner, bannerCarouselSlider, offerSmartPhones, offerLaptops, someProducts, homeName, layout: 'layout' });
        req.session.check = false;


    } catch (error) {
      next()
    }

}





// !--================End UserHome Page =================--//
const search = async (req, res, next) => {
    try {
          let payload = req.body.payload.trim();


    let search = await productData.find({ ProductName: { $regex: new RegExp('^' + payload + '.*') } }).exec()
    //Limit search results to 10//
    search = search.slice(0, 10);
    res.send({ payload: search })
    } catch (error) {
        next()
    }
  
}



// !--================Start Signup Page Page =================--//

const signupPage = function (req, res, next) {
    try {
        user = req.session.username
        if (user) {
            res.redirect('/')
        } else {
            res.render('user_Signup', { error, username, layout: 'layout' })

            error = null;


        }
    } catch (error) {
        next()
    }


}

const postSignup = async (req, res, next) => {

    try {
        signupData = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            wallet: 0,
            status: true,

        }



        let already = await userData.findOne({ username: signupData.username }).lean()

        let alreadyEmail = await userData.findOne({ email: signupData.email }).lean()


        if (already == null && alreadyEmail == null) {
            // req.session.user = true

            req.session.username = signupData.username



            req.session.homeName = signupData.username


            req.session.userProfiledatas = signupData


            // let cc = await CartData.findOne({ username: signupData.username })


            signupData.password = await bcrypt.hash(signupData.password, 10)

            await userData.insertMany([signupData])

            res.redirect('/')

        }


        if (already && alreadyEmail) {
            if (already.username && alreadyEmail.email) {
                error = 'Account is Already existed '
                res.redirect('/userSignup')
            }
        } else {


            if (already) {



                console.log('username');
                console.log(already.username);
                error = 'UserName Already existed '
                res.redirect('/userSignup')
                console.log(already.username);

            }
            if (alreadyEmail) {
                console.log('sssssssssssssssssssssss');
                console.log(alreadyEmail.email);
                error = 'Email Already existed '
                res.redirect('/userSignup')

            }

        }


    } catch (error) {

        next()
    }

}

// !--================End Signup Page Page =================--//

const signUpLogInButton = (req, res, next) => {
    try {
        res.redirect('/Shop')
    } catch (error) {
        next()
    }

}




// !--================Start Login Page =================--//





const Loginpage = async (req, res, next) => {
    try {
        user = req.session.username

        if (user) {

            res.redirect('/')
        } else {

            res.render('user_Login', { errorlogin, errorloginPassword, AccountBlocked, layout: 'layout' })
            errorlogin = null
            errorloginPassword = null
            AccountBlocked = null

        }
    } catch (error) {
        next()
    }


}

const postLogin = (req, res, next) => {

    try {
        async function alreadyexist() {

            let userlogin = {
                username: req.body.username,
                password: req.body.password
            }
            const already = await userData.findOne({ username: userlogin.username }).lean()



            if (already == null) {
                errorlogin = 'invalid userName '
                res.redirect('/userLogin')
            } else {
                if (already.status == true) {

                    const passwordCheck = await bcrypt.compare(userlogin.password, already.password)


                    if (passwordCheck == true) {


                        req.session.userProfiledatas = already
                        // req.session.user = true


                        req.session.username = userlogin.username,


                            req.session.username = already.username


                        req.session.homeName = userlogin.username
                        res.redirect('/')
                    }
                    else {
                        errorloginPassword = 'invalid password'
                        res.redirect('/userLogin')
                    }
                }
                else {
                    AccountBlocked = 'The Account Was Blocked '
                    res.redirect('/userLogin')
                }
            }
        } alreadyexist()
    } catch (error) {
        next()
    }

}


// !--================End Login Page =================--//




//!--================ start shopping Area =================--//


const shop = async (req, res, next) => {
    try {
        let shopproduct = await productData.find({ status: { $nin: false } }).lean()
        navCategory = await categoryData.find().lean()
        navloop = navCategory

        user = req.session.username
        if (user) {

            let homeName = req.session.homeName
            res.render('user_ShopProduct', { shopproduct, navCategory, navloop, homeName, layout: 'layout' })




        } else {
            res.redirect('/userLogin')
        }
    } catch (error) {
        next()
    }

}

const allproduct = (req, res, next) => {
    try {
        res.redirect('/Shop')
    } catch (error) {
        next()
    }

}

const Navbarcategory = async (req, res, next) => {
    try {
        categoryDetail = req.params.categoryName

        res.redirect('/Showcategory')
    } catch (error) {
        next()
    }

}


const ShowProductCategory = async (req, res, next) => {
    try {
        mencategory = await productData.find({ $and: [{ ProductCategory: categoryDetail }, { status: true }] }).lean()

        let shopproduct = mencategory

        user = req.session.username
        if (user) {
            res.render('user_ShopProduct', { shopproduct, navCategory, navloop, layout: 'layout' })
        } else {
            res.redirect('/userLogin')
        }
    } catch (error) {
        next()
    }

}




const ShowProduct = (req, res, next) => {
    try {
        ShowSingleproduct = req.params.id

        res.redirect('/ShowSingleProduct')
    } catch (error) {
        next()
    }

}

const SingleProduct = async (req, res, next) => {

    try {
        await productData.find({ _id: new ObjectId(ShowSingleproduct) }).lean().then((data) => {

            let shopproduct = []
            shopproduct = data[0]




            let ReqBodyData = data

            user = req.session.username
            if (user) {

                let homeName = req.session.homeName
                res.render('user-ProductShow', { shopproduct, ReqBodyData, homeName, layout: 'layout' })
            } else {
                res.redirect('/userLogin')
            }



        })
    } catch (error) {
        next()
    }


}



//!--================ End shopping Area =================--//


const OTPSendChangePassword = (req, res, next) => {
    try {
        res.render('OTPChangePassword', { OTPerrmessage, layout: 'layout' })
        OTPerrmessage = null
    } catch (error) {
        next()
    }


}


//!--================ START Email OTP CHECKING =================--//


const Emailchangepassword = async (req, res, next) => {

    try {
        let email = req.body.email

        userEmail = await userData.findOne({ email: email }).lean()

        if (userEmail == null) {
            errmessage = 'invalid Email address'
            res.redirect('/Forgotpassword')
        } else {

            otpEmail = userEmail.email




            let OtpCode = Math.floor(100000 + Math.random() * 900000)
            otpa = OtpCode
            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'shahinshalocal@gmail.com',
                    pass: 'xqhmeaoypfdinasq'
                }
            })

            let details = {
                from: 'shahinshamsb79@gmail.com',
                to: otpEmail,
                subject: 'Eiser Verification ',
                text: OtpCode + 'Eiser Verification Code,Do not share with others'
            }
            mailTransporter.sendMail(details, (err) => {
                if (err) {
                    console.log(err);
                }
            })


            res.redirect('/OTPSendChangePassword')
        }
    } catch (error) {
        next()
    }

}




const OTPPost = async (req, res, next) => {
    try {

        if (req.body.otp == otpa) {

            userEmail = await userData.findOne({ password: userEmail.password }).lean()

            //  await userData.updateOne({password:userEmail.password},{$set:{password:}})
            res.redirect('/PasswordChange')
        } else {

            OTPerrmessage = 'Invalid OTP'

            res.redirect('/OTPSendChangePassword')
        }
    } catch (error) {
        next()
    }


}






//!--================ChangePassword  New Session  =================--//  

const ChangePassword = (req, res, next) => {
    try {
        res.render('PasswordChange')
    } catch (error) {
        next()
    }

}


const changepasswordPOST = async (req, res, next) => {
    try {
        let Newpassword = req.body.password
        Newpassword = await bcrypt.hash(Newpassword, 10)

        let passwordUpdated = await userData.updateOne({ password: userEmail.password }, { $set: { password: Newpassword } })
        if (passwordUpdated) {

            res.redirect('/userLogin')
        }
        else {
            res.redirect('/PasswordChange')
        }
    } catch (error) {
        next()
    }


}


const EmailOTPChangepassword = (req, res, next) => {
    try {
        res.render('EmailOTPChangepasswordEmailOTP', { errmessage, layout: 'layout' })
        errmessage = null
    } catch (error) {
        next()
    }

}


//!--================End Email OTP CHECKING =================--//  



const OTPChangepassword = (req, res, next) => {
    try {
        res.redirect('/ChangepasswordEmailOTP')
    } catch (error) {
        next()
    }

}

const OTPcheck = (req, res, next) => {
    try {
        res.redirect('/OTPSend')
    } catch (error) {
        next()
    }

}

const LogoutButton = (req, res, next) => {
    try {
        req.session.username = null
        res.redirect('/userLogin')
    } catch (error) {
        next()
    }

}











//!--================Start Cart Section =================--//  //!--================Start Cart Section =================--//  






const AddToCart = async (req, res, next) => {

    try {
        singleproductId = req.params.id
        quantity = req.body.quantity


        let productObjectId = {
            CartProductId: singleproductId,
            quantity: 1
        }

        user = req.session.username

        let UserAddCart = await CartData.findOne({ user: user }).lean()



        if (UserAddCart == null) {
            let CartObjectId = {
                user: user,
                Products: [productObjectId]

            }



            await CartData.insertMany([CartObjectId])

        } else {



            let Productcart = await CartData.find({ $and: [{ user: user }, { "Products.CartProductId": singleproductId }] }).lean()

            if (Productcart != null && Productcart != '') {
                console.log('already  created');
                res.redirect('/User-CartPage')

            } else {

                await CartData.updateOne({ user: user }, { $push: { Products: productObjectId } })

                res.redirect('/User-CartPage')
            }
        }
    } catch (error) {
        next()
    }




}


const addToCart = async (req, res, next) => {
    try {
        user = req.session.username
        console.log('ddddddddddddddddddd');
        singleproductId = req.params.Productid
        quantity = req.body.quantity
        console.log(singleproductId);
        console.log(singleproductId); console.log(singleproductId);

        let CartArry = await CartData.aggregate([
            {
                $match: {
                    user: user

                },
            },
            {
                $unwind: '$Products'
            }])
        if (CartArry.length >= 1) {
            console.log('ggg');

            console.log(CartArry);
            let w = CartArry[0].Products.CartProductId
            console.log(w);
            console.log(CartArry);
            console.log(CartArry.length);

            let CartProduct = true
            for (let i = 0; i < CartArry.length; i++) {
                console.log('true true cart true');
                if (CartArry[i].Products.CartProductId == singleproductId) {
                    CartProduct = false
                    console.log('false false false cart false');
                    break;
                }

            }

            if (CartProduct == true) {

                let productObjectId = {
                    CartProductId: singleproductId,
                    quantity: 1
                }

                user = req.session.username

                let UserAddCart = await CartData.findOne({ user: user }).lean()
                if (UserAddCart == null) {
                    let CartObjectId = {
                        user: user,
                        Products: [productObjectId]
                    }
                    await CartData.insertMany([CartObjectId])

                } else {



                    let Productcart = await CartData.find({ $and: [{ user: user }, { "Products.CartProductId": singleproductId }] }).lean()

                    if (Productcart != null && Productcart != '') {
                        console.log('already  created');
                        res.redirect('/User-CartPage')

                    } else {

                        await CartData.updateOne({ user: user }, { $push: { Products: productObjectId } })


                    }

                }

                res.json({ status: true })
            } else {

                res.json({ status: true })
            }


        } else {
            console.log('creee');
            let productObjectId = {
                CartProductId: singleproductId,
                quantity: 1
            }

            let CartObjectId = {
                user: user,
                Products: [productObjectId]
            }
            await CartData.insertMany([CartObjectId])
            res.json({ status: true })
        }
    } catch (error) {
        next()
    }

}





let discount
let StockError

const UserCartPage = async (req, res, next) => {

    try {
        user = req.session.username

        if (user) {
            user = req.session.username




            let s = await CartData.findOne({ user: user }).lean()

            usercartAllProducts = await CartData.aggregate([
                {
                    $match: {
                        user: user
                    },

                },
                {
                    $unwind: '$Products'
                },
                { $project: { CartProductId: "$Products.CartProductId", quantity: "$Products.quantity" } },

                {
                    $lookup: {
                        from: 'products',
                        localField: 'CartProductId',
                        foreignField: 'Productid',
                        as: 'Products'

                    }
                },
                {
                    $project: { CartProductId: 1, quantity: 1, stocks: '$stocks', OutOfStocks: 'OutOfStocks', Products: { $arrayElemAt: ['$Products', 0] } }
                }
            ])

            // console.log(usercartAllProducts);
            console.log('ddddd   shahhhhhhhhhhhhhhhhh');




            let totalPrice

            for (var i = 0; i < usercartAllProducts.length; i++) {

                totalPrice = usercartAllProducts[i].quantity * usercartAllProducts[i].Products.ProductPrice
                usercartAllProducts[i].totalPrice = totalPrice

            }




            let allproductTotal = 0
            let StockOut = true


            for (var i = 0; i < usercartAllProducts.length; i++) {
                allproductTotal += usercartAllProducts[i].totalPrice

                if (usercartAllProducts[i].Products.OutOfStocks == 'Out Of Stocks') {

                    req.session.OutOfStocks = usercartAllProducts[i].Products.OutOfStocks
                    StockOut = false

                }
            }



            let getCoponId = req.session.coupon

            subTotal = allproductTotal

            if (getCoponId) {


                let getCouponcode = await Coupons.find({ CouponCode: getCoponId }).lean()

                let minimum = getCouponcode[0].MinimumPurchase
                if (subTotal < minimum) {


                    errorCoupons = 'By Up Upto ' + minimum


                } else {



                    subTotal -= getCouponcode[0].DiscountAmount



                }



            }

            if (StockOut == true) {
                req.session.OutOfStocks = null
            }


            let OutOfStocks = req.session.OutOfStocks

            let homeName = req.session.homeName

            res.render('user-CartPage', { usercartAllProducts, homeName, subTotal, errorCoupons, OutOfStocks, StockError, layout: 'layout' })
            errorCoupons = null;
            req.session.coupon = null

            StockError = null



        } else {

            res.redirect('/userLogin')


        }

    } catch (error) {
        next()
    }


}



const CartPageIdRedirect = async (req, res, next) => {
    try {
        res.redirect('/User-CartPage')
    } catch (error) {
        next()
    }

}



const ChangequantityProduct = async (req, res, next) => {
    try {
        console.log('ChangequantityProduct'); console.log('ChangequantityProduct'); console.log('ChangequantityProduct'); console.log('ChangequantityProduct');
        let bodyGetData = req.body


        let getCount = parseInt(req.body.count)




        let quantityUpdate
        for (var i = 0; i < usercartAllProducts.length; i++) {

            totalPrice = usercartAllProducts[i].quantity * usercartAllProducts[i].Products.ProductPrice
            usercartAllProducts[i].totalPrice = totalPrice
            if (usercartAllProducts[i].Products.Productid == bodyGetData.products) {
                if ((usercartAllProducts[i].quantity + getCount) <= usercartAllProducts[i].Products.stocks) {
                    quantityUpdate = true
                    await productData.updateOne({ Productid: bodyGetData.products }, { $set: { OutOfStocks: '' } });

                } else {

                    quantityUpdate = false

                    await productData.updateOne({ Productid: bodyGetData.products }, { $set: { OutOfStocks: 'Out Of Stocks' } });
                }
            }
        }




        if (quantityUpdate == true) {

            await CartData.updateOne({ $and: [{ user: user }, { 'Products.CartProductId': bodyGetData.products }] }, { $inc: { 'Products.$.quantity': getCount } });

        }

        res.json({ statusresponse: true })

    } catch (error) {
        next()
    }

}


//!--================ Start Remove User Cart CHECKING =================--//

const RemoveCartDocument = async (req, res, next) => {

    try {
        let geRemoveCartId = req.params.id
        let GetRemoveproductid = req.params.CartProductId

        await CartData.updateOne({ _id: geRemoveCartId }, { $pull: { Products: { CartProductId: GetRemoveproductid } } })


        res.json({ status: true })
    } catch (error) {
        next()
    }


}




//!--================ End Remove User Cart CHECKING =================--//
const userProfile = async (req, res, next) => {

    try {
        user = req.session.username
        if (user) {

            addresfounded = await UserAddress.findOne({ user: user }).lean()


            if (addresfounded == null) {



                Save = true;

                let UserWallet = await userData.findOne({ username: user }).lean()
                let userProfiledatas = req.session.userProfiledatas
                let homeName = req.session.homeName
                res.render('user-Profile', { userProfiledatas, homeName, Save, UserWallet, layout: 'layout' })



            } else {

                arrayAddress = addresfounded.address[0]


                let UserWallet = await userData.findOne({ username: user }).lean()

                let userAddress = await UserAddress.findOne({ user: user }).lean()

                let AllAddress = userAddress.address
                let userProfiledatas = req.session.userProfiledatas
                let homeName = req.session.homeName
                res.render('user-Profile', { userProfiledatas, homeName, arrayAddress, UserWallet, AllAddress, layout: 'layout' })
            }
        } else {
            res.redirect('/userLogin')
        }

    } catch (error) {
        next()
    }

}

const Addressuser = async (req, res, next) => {

    try {
        let addresDetails
        user = req.session.username
        let updateAddres = await UserAddress.findOne({ user: user }).lean()

        if (updateAddres == null) {

            addresDetails = {}
            addresDetails.user = user
            addresDetails.address = req.body
            await UserAddress.insertMany([addresDetails])


            res.redirect('/userProfile')

        } else {

            addresDetails = {}
            addresDetails.user = user
            addresDetails.address = req.body
            address = req.body
            await UserAddress.updateOne({ user: user }, { $set: { address: address } })

            res.redirect('/userProfile')


        }
    } catch (error) {
        next()
    }

}

let currentWallet

const UserCheckout = async (req, res, next) => {



    try {
        user = req.session.username

        if (user) {

            req.session.userWalletamount = await userData.findOne({ username: user }).lean()

            walletPass = req.session.userWalletamount.wallet

            let addressCheckout = await UserAddress.findOne({ user: user }).lean()

            let quantityValue
            let prodId = usercartAllProducts[0].CartProductId

            let findStocks = await productData.findOne({ Productid: prodId }).lean()
            console.log(findStocks);
            let productName = findStocks.ProductName
            let checkStocks = findStocks.stocks
            quantityValue = usercartAllProducts[0].quantity;

            if (quantityValue <= checkStocks) {

                if (addressCheckout == null) {

                    let addsUser = true
                    let grandTotal = subTotal + 100
                    let homeName = req.session.homeName
                    res.render('User_Checkout', { walletPass, usercartAllProducts, subTotal, grandTotal, usercartAllProducts, homeName, addsUser, layout: 'layout' })
                } else {


                    let checkoutAddress = addressCheckout.address[0]

                    let grandTotal = subTotal + 100

                    let AllAddress = addressCheckout.address


                    if (getCheckedOneddress == null) {

                        let findAddress = checkoutAddress

                        user = req.session.username
                        let dataCartSuccess = await CartData.findOne({ user: user }).lean()


                        if (dataCartSuccess == null) {

                            res.redirect('/Shop')
                        }

                        let UserWallet = await userData.findOne({ username: user }).lean()

                        if (UserWallet.wallet > grandTotal) {

                            walletPass = UserWallet.wallet

                        } else {
                            walletPass = 0
                        }

                        let dataCartSucces = await CartData.findOne({ user: user }).lean()

                        console.log(dataCartSucces);console.log('yyyyyyyyyyyyyyyyyyyyy');
                                                if (dataCartSucces == null) {
                        
                                                    res.redirect('/Shop')
                                                }



                        let homeName = req.session.homeName

                        console.log('fffffffffffffffffff');
                        res.render('User_Checkout', { findAddress, usercartAllProducts, subTotal, grandTotal, homeName, AllAddress, addressCheckout, getCheckedOneddress, UserWallet, walletPass, layout: 'layout' })
                    } else {
                        findAddress = getCheckedOneddress


                        console.log('shahhhhhhhhh');

                        user = req.session.username
                        let dataCartSuccess = await CartData.findOne({ user: user }).lean()

console.log(dataCartSuccess);console.log('yyyyyyyyyyyyyyyyyyyyy');
                        if (dataCartSuccess == null) {

                            res.redirect('/Shop')
                        }



                        let UserWallet = await userData.findOne({ username: user }).lean()

                        let walletPass


                        if (UserWallet.wallet > grandTotal) {
                            walletPass = 0

                        } else {
                            walletPass = UserWallet.wallet
                        }
                        let homeName = req.session.homeName
                        res.render('User_Checkout', { findAddress, usercartAllProducts, subTotal, grandTotal, homeName, AllAddress, addressCheckout, UserWallet, walletPass, layout: 'layout' })
                    }

                }

            } else {
                StockError = 'Out Of Stocks ' + productName
                res.redirect('/user-CartPage')
            }



        } else {
            res.redirect('/userLogin')
        }

    } catch (error) {
        next()
    }


}



const AddNewAddress = async (req, res, next) => {
    try {
        user = req.session.username

        let gottedaddress = req.body


        await UserAddress.updateOne({ user: user }, { $push: { address: gottedaddress } })


        res.redirect('/UserCheckout')
    } catch (error) {
        next()
    }

}


const addressChoosedAddBtn = async (req, res, next) => {
    try {
        let GetIndexAddress = req.params.indexof

        let gettedAlladdress = await UserAddress.findOne().lean()

        getCheckedOneddress = gettedAlladdress.address[GetIndexAddress]

        res.redirect('/UserCheckout')
    } catch (error) {
        next()
    }

}







let CurrentpasswordErrormsg

const UserPasswordManage = (req, res) => {
    try {
        user = req.session.username
        if (user) {

            let homeName = req.session.homeName
            res.render('UserPasswordManage', { CurrentpasswordErrormsg, homeName, layout: 'layout' })
            CurrentpasswordErrormsg = null;
        } else {
            res.redirect('/userLogin')
        }
    } catch (error) {
        next()
    }

}



const UserProfilePasswordChange = async (req, res, next) => {
    try {
        let checkCurrenpassword = req.body.Currenpassword
        let gotNewPasswor = req.body.Newpassword


        user = req.session.username



        let Checkeduserid = await userData.findOne({ username: user }).lean()


        if (Checkeduserid) {
            const passwordCheck = await bcrypt.compare(checkCurrenpassword, Checkeduserid.password)

            if (passwordCheck == true) {

                NewUpdatePassword = await bcrypt.hash(gotNewPasswor, 10)


                await userData.updateOne({ username: user }, { $set: { password: NewUpdatePassword } })

                res.redirect('/userProfile')

            } else {

                CurrentpasswordErrormsg = "Invalid Password !!! \n Please Enter Correct Password.";



                res.redirect('/PasswordManage')

            }

        } else {


            res.redirect('/userProfile')

            console.log('Update Issue');


        }
    } catch (error) {
        next()
    }

}




let status

let insertorders
let grandTotal
let orderId

let methodPayment
const allorder = async (req, res, next) => {

    try {
        user = req.session.username

        insertorders = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            phone: req.body.phonenumber,
            useremail: req.body.useremail,
            pincode: req.body.pincode,
            Date: req.body.Date,
            state: req.body.state,
            district: req.body.district,
            country: req.body.country,
        }





        status = req.body.paymentmethod === "COD" ? "Placed" : "pending"


        req.session.orders = insertorders

        req.session.grandTotal= parseFloat(req.body.grandTotal)

       let grandTotal=  req.session.grandTotal
        insertorders.Date = new Date().toLocaleString();
        //  new Date()


        orderId = uuidv4()

        if (req.body.paymentmethod == 'Online') {

            console.log('Online');
            methodPayment = req.body.paymentmethod

            var options = {

                amount: grandTotal * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: orderId

            };
            console.log(options);
            console.log(grandTotal); console.log(grandTotal);
            console.log('goo');
            instance.orders.create(options, function (err, order) {
                console.log(err);
                console.log('New order', order);
                console.log(order);
                res.json({ status: true, order: order })

            });


        } else if (req.body.paymentmethod == 'COD') {
            console.log('rr'); console.log('ffffrrrrf'); console.log('rr'); console.log('ffffrrrrf');

            ordereddate = new Date().toLocaleString()

            let dt = new Date()
            deliverydate = new Date(dt.setDate(dt.getDate() + 7))
            deliverydate = deliverydate.toLocaleString()

            console.log('zaheer');

            await userorders.insertMany([{ deliveryAddress: insertorders, returnStatus: true, deliverydate: deliverydate, ordereddate: ordereddate, orderduser: user, Orderproducts: usercartAllProducts, paymentmethod: req.body.paymentmethod, status: status, grandTotal: grandTotal }])
            console.log('shahinsh');


            console.log('shahinsh'); 

            res.json({ status: false })

            console.log('eeee'); console.log('eeee');

            await CartData.deleteOne({ user: user })

        } else {


            ordereddate = new Date().toLocaleString()

            let dt = new Date()
            deliverydate = new Date(dt.setDate(dt.getDate() + 7))
            deliverydate = deliverydate.toLocaleString()


            // res.redirect('/OrderSuccessful
            await userorders.insertMany([{ deliveryAddress: insertorders, returnStatus: true, deliverydate: deliverydate, ordereddate: ordereddate, orderduser: user, Orderproducts: usercartAllProducts, paymentmethod: req.body.paymentmethod, status: status, grandTotal: grandTotal }])



        

            grandTotal = -grandTotal
            console.log(grandTotal); console.log(grandTotal); console.log(grandTotal); console.log(grandTotal);
            await userData.updateOne({ username: user }, { $inc: { wallet: grandTotal } })


            await CartData.deleteOne({ user: user })
         
            res.json({ status: false })
        }


        user = req.session.username

    } catch (error) {
        next()
    }
}





const OrderSuccessfull = async (req, res, next) => {
    try {

        console.log(usercartAllProducts[0].CartProductId);

        let prodId = usercartAllProducts[0].CartProductId
        let quantitycheck = usercartAllProducts[0].quantity


        let findStocks = await productData.findOne({ Productid: prodId }).lean()
        console.log(findStocks.stocks);
        let checkStocks = findStocks.stocks
        let quantityValue

        quantityValue = usercartAllProducts[0].quantity;




        if (quantityValue <= checkStocks) {


            for (let i = 0; i < usercartAllProducts.length; i++) {


                let prodId = usercartAllProducts[i].CartProductId;
                let quantitycheck = -usercartAllProducts[i].quantity;
                await productData.updateOne({ Productid: prodId }, { $inc: { stocks: quantitycheck } });
            }


        } else {
            console.log('Out Of Stocks'); console.log('Out Of Stocks'); console.log('Out Of Stocks');
        }




        res.render('OrderSuccessfull', { layout: 'layout' })



    } catch (error) {
        next()
    }

}



const verifyPayment = async (req, res, next) => {
    try {
        user = req.session.username

        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', '7rvINxqCNikMbRaJLik2pvfm');
        hmac.update(req.body['payment[razorpay_order_id]'] + '|' + req.body['payment[razorpay_payment_id]']);
        hmac = hmac.digest('hex')

        if (hmac == req.body['payment[razorpay_signature]']) {


            const orders = req.session.orders

            ordereddate = new Date().toLocaleString()

            let dt = new Date()
            deliverydate = new Date(dt.setDate(dt.getDate() + 7))
            deliverydate = deliverydate.toLocaleString()


            insertorders.paymentid = uuidv4()



            insertorders.details = orders


            await userorders.insertMany([{ deliveryAddress: insertorders, returnStatus: true, deliverydate: deliverydate, ordereddate: ordereddate, orderduser: user, Orderproducts: usercartAllProducts, usercartAllProducts: orders, paymentmethod: methodPayment, status: status, grandTotal: grandTotal }])



            await CartData.deleteOne({ user: user })

            res.json({ PaymentSuccess: true })



        }
        else {
            console.log("hiiiiiiiiiiiiiiiii");
        }

    } catch (error) {
        next()
    }
}





const applyCoupn = async (req, res, next) => {
    try {
        user = req.session.username

        let CouponCode = req.body.CouponCode
        console.log(CouponCode); console.log(CouponCode); console.log(CouponCode);
        let ss = await userData.findOne({ username: req.session.username, usedCoupon: { $elemMatch: { CouponCode } } }).lean()



        let foundCoupons = await Coupons.findOne({ CouponCode: CouponCode }).lean()

        if (foundCoupons != null) {
            let userdate = new Date().toLocaleString
            if (userdate > foundCoupons.ExpiryDate && foundCoupons.CouponStatus == true) {

                req.session.coupon = CouponCode
                res.redirect('/user-CartPage')
            } else {
                errorCoupons = 'Invalid CouponCode'
                res.redirect('/user-CartPage')

            }

        } else {

            errorCoupons = 'Invalid CouponCode'
            res.redirect('/user-CartPage')

        }
    } catch (error) {
        next()
    }

}







//!--================OTP Login START Email OTP Login login =================--//

const OTPLogin = async (req, res, next) => {
    try {
        res.render('LoginEmailOTP', { errmessage, layout: 'layout' })
        errmessage = null
    } catch (error) {
        next()
    }

}



const EmailOTPLogin = async (req, res, next) => {
    try {

        let email = req.body.email


        console.log('/EmailOTPLogin');
        console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk');
        userEmail = await userData.findOne({ email: email }).lean()

        if (userEmail == null) {
            errmessage = 'invalid Email address'
            res.redirect('/OTPLogin')
        } else {

            otpEmail = userEmail.email


            let OtpCode = Math.floor(100000 + Math.random() * 900000)
            otpa = OtpCode
            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_ADDRESS,
                    pass: process.env.PASSWORD
                }
            })

            let details = {
                from: 'shahinshamsb79@gmail.com',
                to: otpEmail,
                subject: 'Eiser Verification ',
                text: OtpCode + 'Eiser Verification Code,Do not share with others'
            }
            mailTransporter.sendMail(details, (err) => {
                if (err) {
                    console.log(err);
                }
            })


            res.redirect('/LoginOTPCheck')
        }

    } catch (error) {

        next()

    }



}


let OTPerrmessage

const LoginOTPCheck = (req, res, next) => {

    try {
        console.log(errmessage); console.log('ggg');
        res.render('LoginOTPCheck', { OTPerrmessage })
        OTPerrmessage = null
    } catch (error) {
        next()
    }

}



const LoginOTPPost = async (req, res, next) => {

    try {
        if (req.body.otp == otpa) {

            req.session.username = userEmail.username

            req.session.homeName = userEmail.username

            let profileAddress = await userData.findOne({ username: req.session.username }).lean()

            req.session.userProfiledatas = profileAddress



            res.redirect('/')
        } else {


            OTPerrmessage = 'Invalid OTP'
            res.redirect('/LoginOTPCheck')



        }

    } catch (error) {
        next()
    }

}

//!--================OTP Login End  Email OTP Login login =================--//







const userorderspage = async (req, res, next) => {
    try {
        user = req.session.username
        let findOrdereds = await userorders.find({ orderduser: user }).lean()

        req.session.returnStatus = false
     

        let Returned = findOrdereds.Returned
        console.log(Returned);
        console.log('shah'); console.log('shah'); console.log('shah'); console.log('shah'); console.log('shah');
        let homeName = req.session.homeName
        res.render('user_orderPage', { findOrdereds, homeName, Returned, layout: 'layout' })
    } catch (error) {
        next()
    }
}



let userOrderedProduct
const userordersdetails = async (req, res, next) => {
    try {
        userOrderedProduct = req.params.id

        res.redirect('/userordersdetails')
    } catch (error) {
        next()
    }


}


const userordersdetailsPage = async (req, res, next) => {


    try {
        let userOrderProducts = await userorders.aggregate([{ $match: { _id: new ObjectId(userOrderedProduct) } }, { $unwind: '$Orderproducts' }, { $project: { CartProductId: '$Orderproducts.CartProductId', Orderproducts: '$Orderproducts.Products', deliveryAddress: '$deliveryAddress', returnStatus: '$Orderproducts.returnStatus', Productid: '$Productid', returnStatus: '$returnStatus', Delivered: '$Delivered', status: '$status', _id: '$_id' } }])
        let homeName = req.session.homeName
        res.render("user-ordersdetails", { userOrderProducts, homeName, layout: 'layout' })

    } catch (error) {
        next()
    }




}




//!--================Sorting Product =================--////!--================Sorting Product =================--//

const sortTwothousand = async (req, res) => {
    let sortProductTwothousand = await productData.find({ $and: [{ ProductPrice: { $gt: 0, $lte: 20000 } }, { status: { $nin: false } }] }).lean()
    console.log(sortProductTwothousand);
    let shopproduct = sortProductTwothousand
    let homeName = req.session.homeName
    res.render('user_ShopProduct', { shopproduct, navCategory, navloop, homeName })

}

const sortFiftynThousand = async (req, res) => {
    let sortProductFiftynThousand = await productData.find({ $and: [{ ProductPrice: { $gt: 20000, $lte: 50000 } }, { status: { $nin: false } }] }).lean()
    let shopproduct = sortProductFiftynThousand
    let homeName = req.session.homeName
    res.render('user_ShopProduct', { shopproduct, navCategory, navloop, homeName })

}

const sortOneLakh = async (req, res) => {
    let homeName = req.session.homeName
    let sortProductOneLakh = await productData.find({ $and: [{ ProductPrice: { $gt: 50000, $lte: 100000 } }, { status: { $nin: false } }] }).lean()
    let shopproduct = sortProductOneLakh

    res.render('user_ShopProduct', { shopproduct, navCategory, navloop, homeName })
}

const SortOneLakhAbove = async (req, res) => {
    let homeName = req.session.homeName
    let sortProductOneLakhAbove = await productData.find({ $and: [{ ProductPrice: { $gt: 100000 } }, { status: { $nin: false } }] }).lean()
    let shopproduct = sortProductOneLakhAbove
    res.render('user_ShopProduct', { shopproduct, navCategory, navloop, homeName })
}

//!--================ Sorting Product =================--//




const userwishlist = async (req, res, next) => {


    try {
        user = req.session.username


        let allUserWishlist = await wishlistData.aggregate([
            {
                $match: {
                    user: user
                }
            },
            {
                $unwind: '$wishlist'
            },

            {
                $lookup: {
                    from: 'products',
                    localField: 'wishlist.Productid',
                    foreignField: 'Productid',
                    as: 'wishlist'

                }
            },
            {
                $project: { Productid: '$wishlist.Productid', Products: { $arrayElemAt: ['$wishlist', 0] } }
            }



        ])

        let homeName = req.session.homeName
        let UserWishlist = allUserWishlist

        if (UserWishlist.length > 0) {

            res.render('user_wishlist', { homeName, UserWishlist, layout: 'layout' })
        } else {
            let Notwishlist = 11
            res.render('user_wishlist', { homeName, Notwishlist, layout: 'layout' })
        }

    } catch (error) {
        next()
    }

}


const addwishlist = async (req, res, next) => {
    try {
        let wishlist = req.params.Productid

        user = req.session.username

        let alreadyHaveUser = await wishlistData.findOne({ user: user }).lean()
        if (alreadyHaveUser == null) {

            let addUser = {
                user: user,
            };
            await wishlistData.insertMany([addUser]);
        }

        let UserWishlist = await wishlistData.aggregate([{ $match: { user: user } }, { $unwind: '$wishlist' }, { $project: { Productid: '$wishlist.Productid', _id: 0 } }])
        let Productid
        let NoAddToWishlist = false
        for (let i = 0; i < UserWishlist.length; i++) {
            Productid = UserWishlist[i].Productid

            if (Productid == wishlist) {
                NoAddToWishlist = true
                break;
            }
        }

        if (NoAddToWishlist == false) {
            await wishlistData.updateOne({ user: req.session.username }, { $push: { wishlist: { Productid: wishlist } } })
        }

        res.json({ status: true })

    } catch (error) {
        next()
    }

}




const deleteWhishlist = async (req, res, next) => {
    try {
        user = req.session.username
        let whishListId = req.params.Productid

        let gotted = await wishlistData.updateOne(
            { user: user },
            { $pull: { wishlist: { Productid: whishListId } } }
        );
        res.json({ status: true })
    } catch (error) {
        next()
    }

}





const ReturnProduct = async (req, res, next) => {

    try {

        user = req.session.username

        returnStatus = null

        let ReturnProductId = req.params._id
        console.log(ReturnProductId);

        let rr = req.params.objId

        console.log(rr);





        await userorders.updateOne({ _id: new ObjectId(ReturnProductId) }, { $set: { Delivered: 'Returned Requested' } })

        console.log('sssss'); console.log('sssss'); console.log('sssss');
        await userorders.updateOne({ _id: new ObjectId(ReturnProductId) }, { $set: { status: 'Returned' } })

        res.json({ returnStatus: true })
        // res.redirect('/userorders')
    } catch (error) {
        next()
    }


}

const UserProfileAddress = async (req, res, next) => {
    try {
        let gottedaddress = req.body


        await UserAddress.updateOne({ user: user }, { $push: { address: gottedaddress } })
        res.redirect('/userProfile')
    } catch (error) {
        next()
    }

}

const useraddressProfile = async (req, res, next) => {

    try {

        let userProfiledatas = req.session.userProfiledatas

        let homeName = req.session.homeName
        res.render('user-AddressProfile', { userProfiledatas, homeName, layout: 'layout' })
    } catch (error) {
        next()
    }

}


module.exports = {

    ChangequantityProduct,
    UserProfilePasswordChange,
    getUserHome,
    signupPage,
    Loginpage,
    postSignup,
    postLogin,
    shop,
    signUpLogInButton,
    allproduct,
    Navbarcategory,
    ShowProductCategory,
    ShowProduct,
    SingleProduct,
    Emailchangepassword,
    OTPSendChangePassword,
    EmailOTPChangepassword,
    OTPChangepassword,
    OTPcheck,
    LogoutButton,
    OTPPost,
    ChangePassword,
    changepasswordPOST,
    userProfile,
    UserCartPage, AddToCart, CartPageIdRedirect,
    UserCheckout,
    search,
    RemoveCartDocument, Addressuser,
    UserPasswordManage,
    AddNewAddress, addressChoosedAddBtn,
    allorder, OrderSuccessfull, Razorpay, verifyPayment,
    applyCoupn, OTPLogin, EmailOTPLogin, LoginOTPCheck, LoginOTPPost,
    userorderspage, userordersdetails, userordersdetailsPage,
    sortTwothousand, sortFiftynThousand, sortOneLakh, SortOneLakhAbove,
    userwishlist, addwishlist, deleteWhishlist,
    ReturnProduct, UserProfileAddress, useraddressProfile, addToCart,
    vv
}
