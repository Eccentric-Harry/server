import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Function to fetch all videos with pagination, filtering, and sorting
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'asc', userId } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build MongoDB query
    const mongoQuery = {};
    if (query) {
        mongoQuery.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }
    if (userId) {
        mongoQuery.owner = userId;
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
});

// Function to publish a new video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished } = req.body;

    // Check if required fields are provided
    if (
        [title, description, isPublished].some(
            (field) => field === undefined || field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Log the received files
    console.log("Received files:", req.files);

    // Retrieve video file path
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    console.log("Video local path:", videoLocalPath);

    if (!videoLocalPath) throw new ApiError(401, "Video is required to publish");

    // Retrieve thumbnail file path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    console.log("Thumbnail local path:", thumbnailLocalPath);

    if (!thumbnailLocalPath) throw new ApiError(401, "Thumbnail is required to publish");

    try {
        // Upload video and thumbnail to Cloudinary
        const videoFile = await uploadOnCloudinary(videoLocalPath);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (videoFile) {
            console.log("Uploaded video URL:", videoFile.url);
        }

        // Create new video document in the database
        const video = await Video.create({
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            duration: videoFile.duration,
            title,
            description,
            isPublished,
            owner: req.user._id,
          });

        // Send response
        res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"));
    } catch (error) {
        console.error("Error uploading video or creating video document:", error);
        throw new ApiError(500, "An error occurred while uploading the video");
    }
});




// Function to fetch a video by its ID and increment views count
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

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
});

// Function to update video details (title, description, thumbnail)
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, thumbnail } = req.body;

    // Validate if at least one field is provided to update
    if (!title && !description && !thumbnail) {
        throw new ApiError(400, "Please provide at least one field to update.");
    }

    // Prepare update object based on provided fields
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (thumbnail && req.file && req.file.path) {
        updateFields.thumbnail = req.file.path;
    }

    // Find and update the video
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true } // Return the updated document
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(new ApiResponse(200, updatedVideo, "Video details updated successfully"));
});

// Function to delete a video by its ID
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Find and delete the video by ID
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// Function to toggle publish status of a video
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Find the video by ID
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Toggle the publish status
    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json(new ApiResponse(200, { isPublished: video.isPublished }, "Publish status toggled successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
