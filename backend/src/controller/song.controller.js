import { parseFile } from "music-metadata";
import { uploadToCloudinary } from "../lib/cloudinary.js";
import { Album } from "../models/album.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

export const getAllSongs = async (req, res, next) => {
  const { limit, page } = req.query;
  const skip = (page - 1) * limit;

  try {
    const songs = await Song.find({
      $or: [
        { isSingle: true, status: "approved" }, // Lấy Single đã duyệt
        { albumId: { $ne: null } }, // Lấy bài hát có album
      ],
    })
      .populate({
        path: "albumId",
        match: { status: "approved" }, // Chỉ lấy album đã duyệt
      })
      .populate("artist", "fullName imageUrl") // Lấy thông tin người bài hát
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Lọc bài hát hợp lệ
    const filteredSongs = songs.filter((song) => song.isSingle || song.albumId);

    res.status(200).json({
      success: true,
      data: filteredSongs,
    });
  } catch (error) {
    next(error);
  }
};

export const getLatestSingles = async (req, res, next) => {
  try {
    // Fetch 6 latest singles
    const latestSingles = await Song.find({ album: null }) // Chỉ lấy những bài không thuộc album
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
      .limit(6)
      .populate("artist", "fullName imageUrl")
      .select("_id title artist imageUrl audioUrl createdAt"); // Lọc các trường cần thiết

    res.json(latestSingles);
  } catch (error) {
    next(error);
  }
};

export const getSongsByArtist = async (req, res, next) => {
  const { artistId } = req.params;
  const { limit = 10, page = 1, type } = req.query;
  const skip = (page - 1) * limit;

  try {
    // 🔹 Kiểm tra xem artistId có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(artistId)) {
      return res.status(400).json({ message: "Invalid artistId" });
    }

    // 🔹 Tạo bộ lọc động
    let filter = { artist: new mongoose.Types.ObjectId(artistId) };

    if (type === "album") {
      filter.albumId = { $ne: null }; // ✅ Lọc bài hát có album
    } else if (type === "single") {
      filter.isSingle = true; // ✅ Lọc bài hát có `isSingle: true`
    }

    console.log("🔎 MongoDB Filter:", JSON.stringify(filter, null, 2));

    // 🔹 Aggregation pipeline để sắp xếp `pending` trước
    const songs = await Song.aggregate([
      { $match: filter }, // Lọc theo artist & type
      {
        $addFields: {
          statusPriority: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "pending"] }, then: 1 }, // 🟡 pending trước
                { case: { $eq: ["$status", "approved"] }, then: 2 }, // ✅ approved sau
                { case: { $eq: ["$status", "rejected"] }, then: 3 }, // ❌ rejected cuối
              ],
              default: 4,
            },
          },
        },
      },
      { $sort: { statusPriority: 1, createdAt: -1 } }, // Sắp xếp: pending > approved > rejected, sau đó theo createdAt mới nhất
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "albums",
          localField: "albumId",
          foreignField: "_id",
          as: "albumId",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "artist",
          foreignField: "_id",
          as: "artist",
        },
      },
      { $unwind: "$artist" },
    ]);

    console.log("🎵 Songs Found:", songs.length);

    // 🔹 Kiểm tra nếu không có bài hát nào
    if (!songs.length) {
      console.warn("⚠️ Không có bài hát nào.");
      return res
        .status(200)
        .json({ success: true, data: [], message: "Không có bài hát nào." });
    }

    res.status(200).json({ success: true, data: songs });
  } catch (error) {
    console.error("❌ Lỗi khi lấy bài hát:", error);
    next(error);
  }
};

export const createSong = async (req, res, next) => {
  try {
    // Kiểm tra xem có đủ file không
    if (!req.files || !req.files.audioFile || !req.files.imageFile) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên đầy đủ tệp âm thanh và ảnh bìa" });
    }

    const { title, albumId, isSingle } = req.body;
    const clerkUserId = req.auth.userId; // Clerk ID từ Clerk

    // 🔹 Tìm user trong MongoDB dựa trên Clerk ID
    const artist = await User.findOne({ clerkId: clerkUserId });
    if (!artist || artist.role !== "artist") {
      return res
        .status(403)
        .json({ message: "Chỉ artist mới có quyền thêm bài hát" });
    }

    // ✅ Chuyển đổi `isSingle` sang boolean đúng cách
    const isSingleBool = isSingle === "true" || isSingle === true; // Chuyển đổi cả string và boolean
    const albumIdValid =
      albumId &&
      typeof albumId === "string" &&
      albumId !== "null" &&
      albumId !== ""; // Đảm bảo `albumId` là string hợp lệ

    // ✅ Chỉ một trong hai có thể được chọn, không được đồng thời có cả `isSingle: true` và `albumId`
    if (isSingleBool && albumIdValid) {
      return res.status(400).json({
        message: "Bài hát không thể vừa là Single/EP vừa thuộc một Album.",
      });
    }

    if (!isSingleBool && !albumIdValid) {
      return res.status(400).json({
        message: "Bạn phải chọn một trong hai: Single/EP hoặc Album.",
      });
    }

    // Nếu có albumId, kiểm tra album có tồn tại không
    let album = null;
    if (albumId) {
      album = await Album.findById(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album không tồn tại" });
      }

      // Kiểm tra quyền sở hữu album
      if (album.artist.toString() !== artist._id.toString()) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền thêm bài hát vào album này" });
      }

      // Kiểm tra bài hát có bị trùng trong album không
      const existingSong = await Song.findOne({ title, albumId });
      if (existingSong) {
        return res
          .status(400)
          .json({ message: "Bài hát này đã tồn tại trong album." });
      }
    }

    // ✅ Upload file ảnh lên Cloudinary
    const imageFile = req.files.imageFile;
    const imageUrl = await uploadToCloudinary(imageFile, "image");

    // ✅ Lấy file audio
    const audioFile = req.files.audioFile;

    // ✅ Tính `duration` từ file audio
    const metadata = await parseFile(audioFile.tempFilePath);
    const duration = Math.round(metadata.format.duration) || 0; // Đơn vị: giây

    // ✅ Upload file audio lên Cloudinary
    const audioUrl = await uploadToCloudinary(audioFile, "auto");

    // ✅ Tạo bài hát mới trong MongoDB
    const song = new Song({
      title,
      artist: artist._id,
      audioUrl,
      imageUrl,
      duration,
      albumId: album ? album._id : null,
      isSingle: album ? false : true, // ✅ Nếu có album, `isSingle` phải `false`
    });

    await song.save();

    // Nếu bài hát thuộc album, cập nhật album
    if (album) {
      album.songs.push(song._id);
      await album.save();
    }

    res.status(201).json({ message: "Bài hát đã được tạo thành công", song });
  } catch (error) {
    console.error("❌ Lỗi khi tạo bài hát:", error);
    res.status(500).json({ message: "Lỗi server khi tạo bài hát." });
  }
};

export const toggleArchiveSong = async (req, res, next) => {
  try {
    const { songId } = req.params;
    const clerkUserId = req.auth.userId;

    // 🔹 Xác thực Artist
    const artist = await User.findOne({ clerkId: clerkUserId });
    if (!artist || artist.role !== "artist") {
      return res.status(403).json({
        message: "Chỉ artist mới có quyền thay đổi trạng thái bài hát",
      });
    }

    // 🔹 Tìm bài hát
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Bài hát không tồn tại" });
    }

    // 🔹 Kiểm tra quyền sở hữu
    if (song.artist.toString() !== artist._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền thay đổi trạng thái bài hát này",
      });
    }

    // ✅ Toggle trạng thái giữa "archived" ↔ "active"
    song.status = song.status === "archived" ? "pending" : "archived";
    await song.save();

    res.status(200).json({
      message: `Bài hát đã chuyển sang trạng thái ${song.status}`,
      song,
    });
  } catch (error) {
    console.error("❌ Lỗi khi thay đổi trạng thái bài hát:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi thay đổi trạng thái bài hát." });
  }
};

export const updateSong = async (req, res, next) => {
  try {
    const { songId } = req.params; // Lấy ID bài hát từ URL
    const { title, albumId, isSingle } = req.body;
    const clerkUserId = req.auth.userId; // Clerk ID từ Clerk

    // 🔹 Tìm user trong MongoDB dựa trên Clerk ID
    const artist = await User.findOne({ clerkId: clerkUserId });
    if (!artist || artist.role !== "artist") {
      return res
        .status(403)
        .json({ message: "Chỉ artist mới có quyền cập nhật bài hát" });
    }

    // 🔹 Kiểm tra bài hát có tồn tại không
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Bài hát không tồn tại" });
    }

    // 🔹 Kiểm tra quyền sở hữu bài hát
    if (song.artist.toString() !== artist._id.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chỉnh sửa bài hát này" });
    }

    // 🔹 Kiểm tra logic Album / Single
    let album = null;
    if ((!isSingle && !albumId) || (isSingle && albumId)) {
      return res
        .status(400)
        .json({ message: "Bạn phải chọn một trong hai: Single/EP hoặc Album" });
    }

    // 🔹 Nếu có albumId, kiểm tra album hợp lệ
    if (albumId) {
      album = await Album.findById(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album không tồn tại" });
      }

      // Kiểm tra quyền sở hữu album
      if (album.artist.toString() !== artist._id.toString()) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền thêm bài hát vào album này" });
      }

      // Kiểm tra bài hát có bị trùng trong album không
      const existingSong = await Song.findOne({ title, albumId });
      if (existingSong && existingSong._id.toString() !== songId) {
        return res
          .status(400)
          .json({ message: "Bài hát này đã tồn tại trong album." });
      }
    }

    // 🔹 Cập nhật tiêu đề bài hát nếu có
    if (title) {
      song.title = title;
    }

    // 🔹 Cập nhật album nếu có
    song.albumId = album ? album._id : null;
    song.isSingle = !!isSingle;

    // ✅ Upload ảnh mới nếu có
    if (req.files && req.files.imageFile) {
      const imageFile = req.files.imageFile;
      const imageUrl = await uploadToCloudinary(imageFile, "image");
      song.imageUrl = imageUrl;
    }

    // ✅ Upload file audio mới nếu có
    if (req.files && req.files.audioFile) {
      const audioFile = req.files.audioFile;

      // ✅ Tính `duration` từ file audio mới
      const metadata = await parseFile(audioFile.tempFilePath);
      song.duration = Math.round(metadata.format.duration) || song.duration; // Nếu không có duration mới, giữ nguyên

      // ✅ Upload file audio mới lên Cloudinary
      const audioUrl = await uploadToCloudinary(audioFile, "auto");
      song.audioUrl = audioUrl;
    }

    // ✅ Lưu thay đổi vào MongoDB
    await song.save();

    res
      .status(200)
      .json({ message: "Bài hát đã được cập nhật thành công", song });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật bài hát:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật bài hát." });
  }
};

export const getSinglesByArtist = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    const { artistId } = req.params; // ✅ Lấy ID artist từ request params

    // Chuyển đổi kiểu dữ liệu
    page = parseInt(page);
    limit = parseInt(limit);

    // Kiểm tra nếu không có artistId
    if (!artistId) {
      return res.status(400).json({ message: "Missing artistId parameter" });
    }

    // Tính số lượng bài hát bỏ qua (skip)
    const skip = (page - 1) * limit;

    // Lấy danh sách Single/EP của artist
    const singles = await Song.find({ isSingle: true, artist: artistId })
      .populate("artist")
      .sort({
        status: 1, // "pending" trước (pending < approved < rejected)
        createdAt: -1, // Mới nhất trước
      })
      .skip(skip)
      .limit(limit);

    // Đếm tổng số bài hát Single/EP của artist
    const totalSingles = await Song.countDocuments({
      isSingle: true,
      artist: artistId,
    });
    const totalPages = Math.ceil(totalSingles / limit);

    res.status(200).json({
      page,
      totalPages,
      totalSingles,
      limit,
      singles,
    });
  } catch (error) {
    console.error("❌ Error retrieving artist singles/EPs:", error);
    res.status(500).json({ message: "Error retrieving artist singles/EPs" });
  }
};

export const deleteSong = async (req, res, next) => {
  try {
    const { songId } = req.params;
    const clerkUserId = req.auth.userId;

    // 🔹 Xác thực Artist
    const artist = await User.findOne({ clerkId: clerkUserId });
    if (!artist || artist.role !== "artist") {
      return res
        .status(403)
        .json({ message: "Chỉ artist mới có quyền xóa bài hát" });
    }

    // 🔹 Tìm bài hát
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Bài hát không tồn tại" });
    }

    // 🔹 Kiểm tra quyền sở hữu
    if (song.artist.toString() !== artist._id.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài hát này" });
    }

    // ✅ Xóa bài hát
    await song.deleteOne();
    res.status(200).json({ message: "Bài hát đã được xóa" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa bài hát:", error);
    res.status(500).json({ message: "Lỗi server khi xóa bài hát." });
  }
};

export const getFeaturedSongs = async (req, res, next) => {
  try {
    // fetch 6 random songs using mongodb's aggregation pipeline
    const songs = await Song.aggregate([
      {
        $match: { status: "approved" }, // Chỉ lấy bài hát có status là "approved"
      },
      {
        $sample: { size: 6 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getMadeForYouSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      {
        $match: { status: "approved" }, // Chỉ lấy bài hát có status là "approved"
      },
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getTrendingSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      {
        $match: { status: "approved" }, // Chỉ lấy bài hát có status là "approved"
      },
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getSingleSong = async (req, res, next) => {
  try {
    const songId = req.params.songId;
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Bài hát không tìm thấy" });
    }
    res.json(song);
  } catch (error) {
    next(error);
  }
};
