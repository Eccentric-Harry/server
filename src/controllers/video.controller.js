import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'asc', userId } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build MongoDB query
    // CONCEPT: If query is provided, it uses a regular expression ($regex) to search for the query string in the title, description, or tags fields of the video documents.
    // The $options: 'i' makes the search case-insensitive.
    // The $or operator ensures that if the query matches any one of the fields (title, description, tags), the document is included.
    const mongoQuery = {};
    if (query) {
        mongoQuery.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { owner: { $regex: query, $options: 'i' } }
        ];
    }
    if (userId) {
        mongoQuery.user = userId;
    }

    // Build sorting options
    const sortOptions = {};
    sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;

    // Fetch videos from the database
    const videos = await Video.find(mongoQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber);

    // Get total count for pagination
    const totalVideos = await Video.countDocuments(mongoQuery);

    // Send the response
    res.status(200).json(new ApiResponse(200, {
        total: totalVideos,
        page: pageNumber,
        limit: limitNumber,
        videos
    }, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    // Check if video file and thumbnail are uploaded
    let videoPath;
    if (req.file && Array.isArray(req.file.videoFile) && req.file.videoFile.length > 0) {
        videoPath = req.file.videoFile[0].path;
    }
    if (!videoPath) {
        throw new ApiError(400, "VideoFile is Required! Please Upload.");
    }
    
    // Upload video to Cloudinary and retrieve URL and duration
    const videoUploadResult = await uploadOnCloudinary(videoPath);
    if (!videoUploadResult) {
        throw new ApiError(500, "Failed to upload video on Cloudinary");
    }
    const videoUrl = videoUploadResult.secure_url;
    const videoDuration = videoUploadResult.duration;

    // Check if thumbnail is uploaded
    let thumbnailPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailPath = req.files.thumbnail[0].path;
    }
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail is Required! Please Upload.");
    }

    // Upload thumbnail to Cloudinary and retrieve URL
    const thumbnailUploadResult = await uploadOnCloudinary(thumbnailPath);
    if (!thumbnailUploadResult) {
        throw new ApiError(500, "Failed to upload thumbnail on Cloudinary");
    }
    const thumbnailUrl = thumbnailUploadResult.secure_url;

    // Create video in database with required fields
    const video = await Video.create({
        videoFile: videoUrl,
        thumbnail: thumbnailUrl,
        title,
        description,
        duration: videoDuration // Save the video duration
    });

    res.status(201).json({ message: 'Video uploaded successfully', video });
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params


    // Find the video by ID and increment the views count
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } }, // Increment views by 1
        { new: true } // Return the updated document
    );

    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    res.status(200).json(video);
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    const { title, description, thumbnail } = req.body;
    
    if((!title && !description && !thumbnail)){
        throw new ApiError(401, "Please Enter the values in the fields that you want to update.");
    }

    let thumbnailPath;
    if (req.file && req.file.path) {
        thumbnailPath = req.file.path;
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                title : title || undefined,
                thumbnail : thumbnailPath || undefined,
                description : description || undefined

            }
        },
        {
            new : true
        }
    )

    res.status(200)
    .json(
        new ApiResponse(200, video, "Video Details Updated Successfully!")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const video = await Video.findByIdAndDelete(videoId)
    if(!video){
        throw new ApiError(404, "Video Not Found!")
    }
    res.status(200).json(new ApiResponse(200, {}, "Video Deleted Successfully!"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }
    video.isPublished = !video.isPublished;
    await video.save();
    res.status(200).json(new ApiResponse(200, { isPublished: video.isPublished }, "Publish status toggled successfully!"));
});



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}