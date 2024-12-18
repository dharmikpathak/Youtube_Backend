import {asyncHandler} from "../utils/asyncHandler.js"
import {APIerror} from "../utils/APIerroe.js"
import {user} from "../models/user.models.js"
import {uploadonCloudinary} from "../utils/cloudinary.js"
import {APIresponse} from "../utils/APIresponse.js"
// import { log } from "console"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const  generateAccesAndrefreshToken = async (userID) =>{
   try {
    const user = await user.findById(userID)
    if(!user){
         throw new APIerror(404, "user not found")
    }
    
    const accesToken = user.generateAccessTokens()
    const refreshToken = user.generaterefreshTokens()
 
    user.refreshToken= refreshToken
    await user.save({validateBeforeSave: false})   // ?????
    return {accesToken , refreshToken}
   } catch (error) {
     throw new APIerror(500, "Something Went wrong while generating access and refresh token")
   }
} // is is just helper function idk what it means


const registerUser = asyncHandler(async (req , res) => {
    const {fullname, email , username , password } = req.body
    

    // console.log(req.files);
    // console.log(req.files.avatar);
    // console.log(req.files.coverImage);
    
    
    // add validation
    if (
        [ fullname , email, username, password ].some((field) => field?.trim()==="")// why '?' in this javascript concept
    ){  
        throw new APIerror(400 , "ALL field are required ")
    }

    const existedUSer = await user.findOne({
        $or: [{username},{email}]
    })

    if(existedUSer){
        // console.log(request.field);
        throw new APIerror(409 , "User is already exist ")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path  // didnt get it revice it later
    const CoverLocalPath = req.files?.coverImage?.[0]?.path  // didnt get it revice it later
    
    

    if (!avatarLocalPath){
        throw new APIerror(401 , "Avatar file is missing")

    }

    // const avatar = await uploadonCloudinary(avatarLocalPath)
    // // const CoverImage = await uploadonCloudinary(CoverLocalPath)
    // let CoverImage = ""
    // if(CoverLocalPath){
    //     CoverImage= await uploadonCloudinary(CoverLocalPath) 
    // }


    let avatar;
    try {
        avatar = await uploadonCloudinary(avatarLocalPath)
        // console.log("uploaded Avatar", avatar);
        
    } catch (error) {
        // console.log("Errors uploading avatar ", error)
        throw new APIerror(500 , "Failed to upload Avatar")

    }



    let coverImage;
    try {
        coverImage = await uploadonCloudinary(CoverLocalPath)
        // console.log("uploaded cover Image", coverImage);
        
    } catch (error) {
        console.log("Errors uploading CoverImage ", error)
        throw new APIerror(500 , "Failed to upload cover Image")

    }




    const User = await user.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage.url || "" , // why not this.CoverImage = coverImage.url
        email,
        password,
        username: username.toLowerCase()
    })

    console.log(User)

    const createdUser = await user.findById(User._id).select( // user select to unselect it is just a syntex 
        "-password -refreshToken"
    )  // extra query may  
    
    if(!createdUser){
        throw new APIerror(500, "something went wrong while registring user")

    }

    return res
    .status(201)
    .json(new APIresponse(200,createdUser, "User Registered Successfully " ))


})

const loginUser = asyncHandler( async (req , res) => {

    const {username , password} = req.body

    if(!username || !password){
        throw new APIerror(400, "username or password is missing ")
    }

    const user = await user.findOne({
        $or: [{username}]
    })

    if(!user){
        throw new APIerror(404,"User not Found");
        
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new Error(401,"Invalid Password try again");
        
    }
 
    const {accesToken, refreshToken} = await generateAccesAndrefreshToken(user._id)

    const loggedInUser = await user.findById(user._id)
    .select(  "-password -refreshToken")

    if(!loggedInUser){
        throw new APIerror(402,"user isn't logged in")
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV ==='production',
    }

    return res
    .status(200)
    .cookie("accessToken",accesToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(new APIresponse
        (200, 
        {user: loggedInUser,accesToken,refreshToken}, // what it do?
        "User logged in successfully"))

})

const logoutUser = asyncHandler(async (req, res) =>{
    await user.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined,
            }
        },
        {new: true}

    )

    const options = {
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json( new APIresponse(200, {} ,"User logged out successfully    "))

})

const refreshAccessToken = asyncHandler (async(req , res) =>
{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw APIerror(401,"Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET,
        )

        const user = await user.findById(decodedToken?._id)

        if(!user){
            throw APIerror(401,"invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new  APIerror(401, "refresh token is not valid  or expired ")
        }

        const options ={
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",  // what it means idk
        }

        const {accesToken , refreshToken: newRefreshToken} =  await generateAccesAndrefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken"),accesToken , options
        .cookie("refreshToken"),newRefreshToken ,options
        .json(new APIresponse(
            200,
            {accesToken,
                refreshToken:newRefreshToken
            },
            "Access token refreshed succssfully"
        ));

    } catch (error) {
        throw APIerror(500,"Something went wrong while refreshing refresh token")
    }


})


const changeCurrentPassword = asyncHandler(async (req,res) => {

    const {oldPassword, newPassword} = req.body

    const user = await user.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new APIerror(401,"old password is invalid, try again")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false}) // what it do?

    return res
    .status(200)
    .json( new APIresponse(200, {} ,"Password changed successfully"))



 })

const getCurrentUser = asyncHandler(async (req,res) => {

    return res
    .status(200)
    .json( new APIresponse(200, req.user , "Current user details"))
 })

const updateAccountDetails = asyncHandler(async (req,res) => { 

    const {fullname , email } = req.body

    const user = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email: email  
            }
        },{new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json( new APIresponse (200, user , "Account details updated successfully"))


})

const updateUserAvatar = asyncHandler(async (req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new APIerror(400,"File is required")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new APIerror(500, "Something went wrong while uploading avatar")
    }
    
    const user = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")
    return res
    .status(200)
    .json( new APIresponse (200, user , "Avatar updated successfully"))

 })

const updateUserCoverImage = asyncHandler(async (req,res) => { 

    const coverImageLocalPatha = req.file?.path
    
    if(!coverImageLocalPatha){
        throw new APIerror(401,"File is required")
    }

    const coverImage = await uploadonCloudinary(coverImageLocalPatha)

    if(!coverImage.url){
        throw new APIerror(500,"Something went wrong while uploading cover image")
    }

    const user = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url 
            }
        },
        {new:true}
    ).select( "-password -refreshToken")
    return res
    .status(200)
    .json( new APIresponse (200, user , "Cover image updated successfully"))
})



const getUserChannelProfile = asyncHandler(async (req,res) => {

    const {username} = req.params

    if(!username?.trim()){
        throw new APIerror(400 , "User is required")

    } 

    const channel = await user.aggregate(
        [
            {
                $match:{
                    username: username?.toLowerCase()
                }   
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size: "$subscribers"
                    },
                    channelIsSubscribedToCount:{
                        $size: "$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in: [req.user?._id,"$"]}
                        }
                    }
                }
            },
            {
                //project only the necessary data

                $project:{
                    fullname:1,
                    username:1,
                    avatar:1,
                    subscribersCount:1,
                    channelIsSubscribedToCount:1,
                    isSubscribed:1,
                    coverImage:1,
                    
                }
            }
        ]
    )

    if (!channel?.length){
        throw new APIerror(404,"Channel not Found")
    }

    return res
    .status(200)
    .json(new APIresponse(200,
        channel[0], 
        "Channel profile Fatched successfully"))





})




const getWatchHistory = asyncHandler(async (req,res) => {

    const user = await user.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId.createFromTime(req.user?.id) // req.user?._id (just syntex for mongoose)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                   {
                    $addFields:{
                        owner:{
                            $first: "$owner"
                        }
                    }

                   }
                ]
            }
        }
    ])

    return res.status(200).json( new APIresponse(200, user[0]?.getWatchHistory,"watch history fetched successfully"))

})





export{
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}