import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from  "../models/User.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse} from  "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"




const generateAccessAndRefreshToken = async(userId) =>{

    const user = await User.findById(userId)

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false});

    return {accessToken, refreshToken}
}


const registerUser = asyncHandler( async(req, res) => {
 
/*
    //get user detaiil from frontend
    //validation  - not empty

    //check if user already exists : username, email
    // check for images, check for avater
    //upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove passowrd and refresh token field from response
    //check for user creation
        // return res
*/

     const{username,email, fullname, password}=req.body
    //console.log("email", email);

   
    


   if([fullname, email, username,password].some((fileds) => fileds?.trim() ==="" )){
    throw new ApiError(400, "All Filed is required");

   }
   

  const existUser = await User.findOne({
    $or: [{email}, {username}]
})

if(existUser){
    throw new ApiError(400, "User with email or username already exists")
}
    

  const avatarLocalPath =  req.files?.avatar[0]?.path;
   //const coverImageLocalpath = req.files?.coverImage[0]?.path;

   let coverImageLocalpath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
    coverImageLocalpath= req.files.coverImage[0].path
   }
   //console.log(avatarLocalPath);

   if(!avatarLocalPath){

    throw new ApiError(400, "Avatar file is required")
}

  const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalpath)
     

  //console.log( await uploadOnCloudinary(avatarLocalPath));
  
    if(!avatar)
        {
     throw new ApiError(400, "avatar file is required")
    }

   const user = await User.create({
    fullname,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    username:username.toLowerCase()

   })
    
   const createdUser= await User.findById(user._id).select("-password -refreshToken")
   if(!createdUser){
    throw new ApiError(500,"Someting went  wrong while register the  user")
   }

   return res.status(201).json(
    new ApiResponse(200, createdUser,"User register successfully")
   )
})


const loginUser = asyncHandler(async(req,res) =>{

    const {email, username, password} = req.body;

    if(!username && !email && !password) {
        throw new ApiError(400, "username , email and password is required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError (404, "User doesnot exist")
    }

    //const ispasswordValid = await bcrypt.compare(password, user.password)

    const ispasswordValid = await user.isPasswordCorrect(password);
     console.log("ispasswordvalid",ispasswordValid)
    
    if(!ispasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken},
            "User logged in Successfully"
        )
    )


})


const logoutUser = asyncHandler(async(req, res) =>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
             $unset: {
                refreshToken: 1 // this is removes the field from docuent
             }
        },
        {
            new: true
        }
    )

    const options ={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))

})


const refreshAccessToken = asyncHandler(async(req, res) =>{

    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incommingRefreshToken){
        throw new ApiError(401, "Unauthorized request");
    }

    try {

        const decodedToken = jwt.verify(
            incommingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET 

        )

        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }

        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }
        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);

        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,
                {accessToken, refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
        
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh Token ")
        
    }
})


const changeCurrentPassword = asyncHandler(async(req, res) =>{
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user._id);

    const ispasswordcorrect = await user.isPasswordCorrect(oldPassword);

    if(!ispasswordcorrect){
        throw new ApiError(400, "incorrect password");
    }


    req.password = newPassword;

    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json( new ApiResponse(200, {}, "Password is change"))


})


export{ 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,





}