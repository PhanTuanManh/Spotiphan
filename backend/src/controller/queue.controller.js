import { Queue } from "../models/queue.model.js";
import { Album } from "../models/album.model.js";
import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";

/**
 * Clone toàn bộ bài hát từ album vào queue
 */
export const cloneToQueue = async (req, res) => {
    try {
        const { userId, type, id } = req.body; // type: "album" hoặc "playlist", id: albumId hoặc playlistId

        let source;
        if (type === "album") {
            source = await Album.findById(id).populate("songs");
        } else if (type === "playlist") {
            source = await Playlist.findById(id).populate("songs");
        } else {
            return res.status(400).json({ message: "Loại dữ liệu không hợp lệ" });
        }

        if (!source) return res.status(404).json({ message: `${type} không tồn tại` });

        const queueData = {
            userId,
            songs: source.songs.map(song => song._id),
            currentIndex: 0,
            loopMode: "none",
            isShuffled: false
        };

        await Queue.findOneAndUpdate({ userId }, queueData, { upsert: true });

        res.status(200).json({ message: `Queue updated from ${type}`, queue: queueData });
    } catch (error) {
        res.status(500).json({ error: `Lỗi khi clone ${type} vào queue` });
    }
};


/**
 * Thêm bài hát vào queue
 */
export const addSongToQueue = async (req, res) => {
    try {
        const { userId } = req.body;
        const { songId } = req.params;

        const song = await Song.findById(songId);
        if (!song) return res.status(404).json({ message: "Bài hát không tồn tại" });

        const queue = await Queue.findOne({ userId });
        if (!queue) return res.status(404).json({ message: "Queue không tồn tại" });

        queue.songs.push(song._id);
        await queue.save();

        res.status(200).json({ message: "Bài hát đã được thêm vào queue", queue });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi thêm bài hát vào queue" });
    }
};

/**
 * Chuyển bài hát tiếp theo
 */
export const nextSong = async (req, res) => {
    try {
        const { userId } = req.body;

        const queue = await Queue.findOne({ userId });
        if (!queue || queue.songs.length === 0) return res.status(404).json({ message: "Queue trống" });

        let { currentIndex, songs, loopMode, isShuffled } = queue;

        if (loopMode === "loop_song") {
            return res.status(200).json({ message: "Lặp lại bài hát", queue });
        }

        if (isShuffled) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
            } while (randomIndex === currentIndex);
            currentIndex = randomIndex;
        } else {
            currentIndex++;
            if (currentIndex >= songs.length) {
                if (loopMode === "loop_playlist") {
                    currentIndex = 0;
                } else {
                    currentIndex = songs.length - 1; // Giữ nguyên bài cuối
                }
            }
        }

        queue.currentIndex = currentIndex;
        await queue.save();

        res.status(200).json({ message: "Bài hát tiếp theo", queue });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi chuyển bài hát tiếp theo" });
    }
};

/**
 * Quay lại bài hát trước
 */
export const prevSong = async (req, res) => {
    try {
        const { userId } = req.body;

        const queue = await Queue.findOne({ userId });
        if (!queue || queue.songs.length === 0) return res.status(404).json({ message: "Queue trống" });

        let { currentIndex, loopMode } = queue;

        if (loopMode === "loop_song") {
            return res.status(200).json({ message: "Lặp lại bài hát", queue });
        }

        if (currentIndex > 0) {
            currentIndex--;
        } else {
            if (loopMode === "loop_playlist") {
                currentIndex = queue.songs.length - 1;
            }
        }

        queue.currentIndex = currentIndex;
        await queue.save();

        res.status(200).json({ message: "Quay lại bài hát trước", queue });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi quay lại bài hát trước" });
    }
};

/**
 * Lấy queue từ MongoDB
 */
export const getQueue = async (req, res) => {
    try {
        const { userId } = req.params;

        const queue = await Queue.findOne({ userId }).populate("songs");
        if (!queue) return res.status(404).json({ message: "Queue không tồn tại" });

        res.status(200).json(queue);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy queue" });
    }
};
