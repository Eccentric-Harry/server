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
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}