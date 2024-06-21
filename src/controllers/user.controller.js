import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User} from '../models/user.model.js'
import { uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async(req, res) => {
    // get user details from frontend 
    // validate user details 
    // check if user already exists
    // check for images , check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from repsonse
    // check for user creation
    // return response to frontend



    // get user details from frontend 
    const {username, fullName, email, password} = req.body
    console.log("email :", email);

    // validate user details 
    if(
        [fullName, email, password, username].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

     // check if user already exists
     const existedUser = await User.findOne({
        $or: [
            {email},
            {username}
        ]
     })

     if(existedUser){
         throw new ApiError(400, "User with same username or email already exists!")
     }

     // check for images , check for avatar
    // middleware add additional fields to trhe req.body
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

     // upload them to cloudinary
     const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from repsonse
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500, "Failed to create user")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
} )

export { registerUser }