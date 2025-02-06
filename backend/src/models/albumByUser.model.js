import mongoose from "mongoose";

const albumByUser = new mongoose.Schema(
    {
        title: { type: String, required: true },
        artist: { type: String, required: true },
        imageUrl: { type: String, required: true },
        releaseYear: { type: Number, required: true },
        songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
        userId: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}]
    },
    { timestamps: true }
); //  createdAt, updatedAt

export const Album = mongoose.model("AlbumByUser", albumByUser);
