import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"; // Import the User model

// Function to get channel statistics
const getChannelStats = asyncHandler(async (req, res) => {
    const { username } = req.user; // Get username from the JWT payload

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const userId = user._id;

    // Total videos
    const totalVideos = await Video.countDocuments({ owner: userId });

    // Total views (assuming Video schema has a 'views' field)
    const totalViewsResult = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = totalViewsResult[0]?.totalViews || 0;

    // Total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // Total likes (assuming Like schema has a 'video' field)
    const totalLikesResult = await Like.aggregate([
        { $match: { video: { $in: await Video.find({ owner: userId }).select('_id') } } },
        { $group: { _id: null, totalLikes: { $sum: 1 } } }
    ]);
    const totalLikes = totalLikesResult[0]?.totalLikes || 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews,
                totalSubscribers,
                totalLikes
            },
            "Channel statistics retrieved successfully"
        )
    );
});

// Function to get all videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const { username } = req.user; // Get username from the JWT payload

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const userId = user._id;

    const videos = await Video.find({ owner: userId });

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            `${videos.length} video(s) found for the channel`
        )
    );
});

export {
    getChannelStats,
    getChannelVideos
};
