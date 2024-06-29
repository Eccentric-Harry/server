import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

 
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (userId.toHexString() === channelId) {
        throw new ApiError(401, "Self-Subscription is prohibited");
    }

    const channelExists = await User.findById(channelId);
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    if (channelId === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: userId
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200, null, "Successfully unsubscribed"));
    } else {
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        });
        return res.status(200).json(new ApiResponse(200, null, "Successfully subscribed"));
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", "username email");
    // iska matlab hai ki Subscription model me jo channel id hai uske against jo subscriber id hai usko populate karna hai
    // matlab Subscription.subscriber me we have to add username and email from User model
    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;


    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const channelsSubscribed = await Subscription.find({ subscriber: subscriberId }).populate("channel", "username email");

    return res.status(200).json(new ApiResponse(200, channelsSubscribed, "Subscribed channels fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
