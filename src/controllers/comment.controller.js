import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 1,
                content: 1,
                owner: {
                    _id: 1,
                    username: 1
                }
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ]);

    if (!comments || comments.length === 0) {
        throw new ApiError(404, "No comments found");
    }

    return res.status(200).json(new ApiResponse(200, comments, `${comments.length} comment(s) found`));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.create({
        content,
        owner: userId,
        video: videoId
    });

    if (!comment) {
        throw new ApiError(500, "Failed to add comment");
    }

    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content } },
        { new: true }
    );

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const commentDelete = await Comment.findByIdAndDelete(commentId);

    if (!commentDelete) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
