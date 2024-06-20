import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', 
    api_key: 'process.env.CLOUDINARY_API_KEY', 
    api_secret: 'provess.env.CLOUDINARY_API_SECRET'
});

const uploadOnCloudinary = async (localFIlePath) =>{
    try {
        if (!localFIlePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFIlePath, {resource_type : "auto"})
        // flie has been uploaded on cloudinary Successfully!
        console.log("flie has been uploaded on cloudinary Successfully!", response.url);
        console.log(response);
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFIlePath); // removes the locally uploaded file that is temporarily stored on the server
    }
}


export {uploadOnCloudinary}


// multer ko use karke user -> local Storage -> cloudinary