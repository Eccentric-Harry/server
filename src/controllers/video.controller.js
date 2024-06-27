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
    const { title, description } = req.body;

    // Check if video file and thumbnail are uploaded
    let videoPath;
    if (req.file && req.file.path) {
        videoPath = req.file.path;
    }
    if (!videoPath) {
        throw new ApiError(400, "Video file is required! Please upload.");
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
        throw new ApiError(400, "Thumbnail is required! Please upload.");
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
