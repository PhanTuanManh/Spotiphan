import { } from "../models/ .model.js";
import { Album } from "../models/album.model.js";
import { Playlist } from "../models/playList.model.js";
import { Queue } from "../models/queue.model.js";
import { Song } from "../models/song.model.js";
import { UserListeningHistory } from "../models/userListeningHistory.model.js";

/**
 * Clone toàn bộ bài hát từ album vào queue
 */
export const cloneToQueue = async (req, res) => {
    try {
        const { userId, type, id } = req.body;

        let source;
        if (type === "single") {
            source = await Song.findById(id);
            if (!source) return res.status(404).json({ message: "Bài hát không tồn tại" });

            await Queue.findOneAndDelete({ userId });

            const queue = new Queue({
                userId,
                songs: [source._id],
                currentIndex: 0,
                loopMode: "none",
                isShuffled: false,
                originalOrder: [source._id],
            });

            await queue.save();
            return res.status(200).json({ message: `Queue đã được tạo với Single/EP`, queue });
        } 

        else if (type === "album") {
            source = await Album.findById(id).populate("songs");
        } else if (type === "playlist") {
            source = await Playlist.findById(id).populate("songs");

            if (!source.isPublic && source.userId.toString() !== userId) {
                return res.status(403).json({ message: "Bạn không có quyền truy cập playlist này" });
            }
        } else {
            return res.status(400).json({ message: "Loại dữ liệu không hợp lệ" });
        }

        if (!source || source.songs.length === 0) {
            return res.status(404).json({ message: `${type} không tồn tại hoặc không có bài hát nào` });
        }

        await Queue.findOneAndDelete({ userId });

        const queue = new Queue({
            userId,
            songs: source.songs.map(song => song._id),
            currentIndex: 0,
            loopMode: "none",
            isShuffled: false,
            originalOrder: source.songs.map(song => song._id),
        });

        await queue.save();
        return res.status(200).json({ message: `Queue đã được reset với ${type}`, queue });
    } catch (error) {
        res.status(500).json({ error: `Lỗi khi tạo queue từ ${type}` });
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

        let queue = await Queue.findOne({ userId });
        if (!queue) return res.status(404).json({ message: "Queue không tồn tại" });

        if (!queue.songs.includes(song._id)) {
            queue.songs.push(song._id);
            queue.originalOrder.push(song._id);
        }

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
        let queue = await Queue.findOne({ userId });

        if (!queue || queue.songs.length === 0) {
            return res.status(400).json({ message: "Queue trống. Vui lòng chọn một album hoặc playlist mới." });
        }

        let { currentIndex, loopMode } = queue;

        // Nếu chỉ có 1 bài hát (Single/EP), reset lại bài hát thay vì chuyển bài
        if (queue.songs.length === 1) {
            return res.status(200).json({ message: "Lặp lại Single/EP", queue });
        }

        if (loopMode === "loop_song") {
            return res.status(200).json({ message: "Lặp lại bài hát", queue });
        }

        currentIndex++;

        if (currentIndex >= queue.songs.length) {
            if (loopMode === "loop_playlist") {
                currentIndex = 0;
            } else {
                return res.status(200).json({ message: "Playlist kết thúc. Chọn playlist mới.", queue });
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
        let queue = await Queue.findOne({ userId });

        if (!queue || queue.songs.length === 0) {
            return res.status(404).json({ message: "Queue trống" });
        }

        let { currentIndex } = queue;

        // Nếu chỉ có 1 bài hát (Single/EP), reset lại bài hát thay vì chuyển bài
        if (queue.songs.length === 1) {
            return res.status(200).json({ message: "Lặp lại Single/EP", queue });
        }

        // Nếu đang ở bài hát đầu tiên trong queue, không cho phép quay lại
        if (currentIndex === 0) {
            return res.status(400).json({ message: "Đang ở bài hát đầu tiên trong queue. Không thể quay lại." });
        }

        currentIndex--;

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

export const toggleLoopMode = async (req, res) => {
    try {
        const { userId } = req.body;

        const queue = await Queue.findOne({ userId });
        if (!queue) return res.status(404).json({ message: "Queue không tồn tại" });

        // Chuyển đổi trạng thái loop theo vòng tuần hoàn
        const loopModes = ["none", "loop_playlist", "loop_song"];
        const currentModeIndex = loopModes.indexOf(queue.loopMode);
        queue.loopMode = loopModes[(currentModeIndex + 1) % loopModes.length];

        await queue.save();

        res.status(200).json({ message: `Loop mode set to ${queue.loopMode}`, queue });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi thay đổi loop mode" });
    }
};


export const toggleShuffle = async (req, res) => {
    try {
        const { userId } = req.body;
        let queue = await Queue.findOne({ userId });

        if (!queue) return res.status(404).json({ message: "Queue không tồn tại" });

        queue.isShuffled = !queue.isShuffled;

        if (queue.isShuffled) {
            queue.originalOrder = queue.songs.slice(); // Lưu thứ tự gốc

            // Lấy danh sách bài hát đã nghe gần đây để tránh trùng lặp
            const recentSongs = await UserListeningHistory.find({ userId })
                .sort({ listenedAt: -1 })
                .limit(queue.songs.length / 2);

            const recentSongIds = recentSongs.map(entry => entry.songId.toString());

            // Xáo trộn danh sách nhưng tránh bài đã nghe gần đây
            let shuffledSongs = queue.songs.slice();
            shuffledSongs.sort(() => Math.random() - 0.5);
            shuffledSongs = shuffledSongs.filter(song => !recentSongIds.includes(song.toString()));

            queue.songs = [...shuffledSongs, ...queue.songs.filter(song => recentSongIds.includes(song.toString()))];
        } else {
            queue.songs = queue.originalOrder || queue.songs;
        }

        await queue.save();
        res.status(200).json({ message: `Shuffle mode ${queue.isShuffled ? "ON" : "OFF"}`, queue });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi thay đổi chế độ shuffle" });
    }
};


