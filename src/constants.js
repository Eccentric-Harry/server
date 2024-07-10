export const DB_NAME = "videotube";

export const coverImg_upOptions = {
  folder: "YT/cover-image",
  resource_type: "image",
};

export const avatar_upOptions = {
  folder: "YT/avatar",
  resource_type: "image",
};
export const thumbnail_upOptions = {
  folder: "YT/thumbnail",
  resource_type: "image",
};

export const video_upOptions = {
  folder: "YT/video",
  resource_type: "video",
  eager: [{ streaming_profile: "full_hd", format: "m3u8" }],
  eager_async: true,
  eager_notification_url: "http://localhost:8000/",
};
