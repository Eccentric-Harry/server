import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleLike = async (req, res, likeType) => {
    const id = req.params[`${likeType}Id`];
    if (!isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${likeType} ID`);
    }
    const userId = req.user?._id;

    const existingLike = await Like.findOne({
        [likeType]: id,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, null, `Successfully removed like from ${likeType}`));
    } else {
        await Like.create({
            likedBy: userId,
            [likeType]: id,
        });
        return res.status(200).json(new ApiResponse(200, null, `Successfully liked ${likeType}`));
    }
};

const toggleVideoLike = asyncHandler((req, res) => toggleLike(req, res, "video"));
const toggleCommentLike = asyncHandler((req, res) => toggleLike(req, res, "comment"));
const toggleTweetLike = asyncHandler((req, res) => toggleLike(req, res, "tweet"));

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const likedVideos = await Like.find({
        likedBy: userId,
        video: { $exists: true },
    }).populate("video");

    return res.status(200).json(new ApiResponse(200, likedVideos, `${likedVideos.length} video(s) found`));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
};
