import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  
    const pipeline = [];
    //first create a search index using atlas
    //then use $search to search the videos
    //search index is created on title and description fields
    //here i have created "search-videos" index on "videos" collection
    if (query) {
      pipeline.push({
        $search: {
          index: "search-videos",
          text: {
            query: query,
            path: ["title", "description"],
          },
        },
      });
    }
    if (userId) {
      if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
      }
  
      pipeline.push({
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      });
    }
    // fetch videos only that are set isPublished as true
    pipeline.push({ $match: { isPublished: true } });
  
    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
      pipeline.push({
        $sort: {
          [sortBy]: sortType === "asc" ? 1 : -1,
        },
      });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }
  
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
          pipeline: [
            {
              $project: {
                username: 1,
                "avatar.url": 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$ownerDetails",
      }
    );
  
    const videoAggregate = Video.aggregate(pipeline);
  
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  
    const videos = await Video.aggregatePaginate(videoAggregate, options);
  
    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched successfully"));
  });
  

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished } = req.body;

 
    if (
        [title, description, isPublished].some(
            (field) => field === undefined || field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

   
    console.log("Received files:", req.files);


    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    console.log("Video local path:", videoLocalPath);

    if (!videoLocalPath) throw new ApiError(401, "Video is required to publish");

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    console.log("Thumbnail local path:", thumbnailLocalPath);

    if (!thumbnailLocalPath) throw new ApiError(401, "Thumbnail is required to publish");

    try {
      
        const videoFile = await uploadOnCloudinary(videoLocalPath);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (videoFile) {
            console.log("Uploaded video URL:", videoFile.url);
        }

        const video = await Video.create({
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            duration: videoFile.duration,
            title,
            description,
            isPublished,
            owner: req.user._id,
          });

   
        res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"));
    } catch (error) {
        console.error("Error uploading video or creating video document:", error);
        throw new ApiError(500, "An error occurred while uploading the video");
    }
});





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
