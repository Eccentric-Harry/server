import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User} from '../models/user.model.js'
import { uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        
        const user =await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken =  user.generateAccessToken();

        user.refreshToken = refreshToken;
        user.save({
            validateBeforeSave: false
        });

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens")
    }
}

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

const loginUser = asyncHandler( async(req, res) => {
    // get details from frontend
    // validate details (password / username must not be empty)
    //  check if the user exists (in db)
    // check if the passwoed is correct 
    // generate access and refresh tokens
    // send cookies

     // get details from frontend
    const { email, username, password } = req.body;
    if(!username || !email) {
        throw new ApiError(400, "Username or Email is required")
    }
    const user = await User.findOne({
        $or: [
            {username},
            {email}
        ]
    })

    if(!user){
        throw new ApiError(404, "User is Not Registered! please Register Now.")
    }

    // password validation
    const isValidPassword = await user.isPasswordCorrect(password);
    if(!isValidPassword){
        throw new ApiError(401, "Invalid Password")
    }

    // generate Access_Token and Refresh_Token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // send cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure: true  // by Default kya hota hai ki aapke cookies  frontEnd se directly access karke koi bhi change karsakta hai, 
        // par iss options ko use karke we can fix this! and now, only the server is able to modif the cookies. this is a more secure way of storing cookies!
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler( async(req, res) => {

    await User.findByIdAndUpdate(req.user._id, 
        {
            refreshToken: undefined
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200, 
            {},
            "User logged Out Successfully"
        )
    )
})

export { 
            registerUser,
            loginUser,
            logoutUser
 }