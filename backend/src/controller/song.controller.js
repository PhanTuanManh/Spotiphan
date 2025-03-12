import { Song } from "../models/song.model.js";
import { UserListeningHistory } from "../models/userListeningHistory.model.js";
import mongoose from "mongoose";

// Lấy tất cả bài hát đã được duyệt có phân trang
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

export const createSong = async (req, res, next) => {
  try {
    // Kiểm tra xem có đủ file không
    if (!req.files || !req.files.audioFile || !req.files.imageFile) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên đầy đủ tệp âm thanh và ảnh bìa" });
    }

    const { title, albumId, isSingle } = req.body;
    const artistId = req.auth.userId;

    // Kiểm tra user có phải artist không
    const artist = await User.findById(artistId);
    if (!artist || artist.role !== "artist") {
      return res
        .status(403)
        .json({ message: "Chỉ artist mới có quyền thêm bài hát" });
    }

    // Kiểm tra chỉ được chọn một trong hai: isSingle hoặc albumId
    if ((!isSingle && !albumId) || (isSingle && albumId)) {
      return res
        .status(400)
        .json({ message: "Bạn phải chọn một trong hai: Single/EP hoặc Album" });
    }

    // Nếu có albumId, kiểm tra album có tồn tại không
    let album = null;
    if (albumId) {
      album = await Album.findById(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album không tồn tại" });
      }

      // Kiểm tra quyền sở hữu album
      if (album.artist.toString() !== artistId) {
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

    // Upload file ảnh lên Cloudinary
    const imageFile = req.files.imageFile;
    const imageUrl = await uploadToCloudinary(imageFile);

    // ✅ Lưu file audio vào `public/uploads/` tạm thời trước khi upload lên Cloudinary
    const audioFile = req.files.audioFile;
    const tempFilePath = path.join(
      process.cwd(),
      "public/uploads",
      audioFile.name
    );
    await audioFile.mv(tempFilePath); // Di chuyển file vào thư mục tạm

    // ✅ Tính `duration` từ file audio
    const metadata = await parseFile(tempFilePath);
    const duration = Math.round(metadata.format.duration); // Đơn vị: giây

    // ✅ Upload file audio lên Cloudinary
    const audioUrl = await uploadToCloudinary(audioFile, "audio"); // Tải lên Cloudinary

    // Xóa file tạm sau khi upload
    await fs.unlink(tempFilePath);

    // ✅ Tạo bài hát mới trong MongoDB
    const song = new Song({
      title,
      artist: artist._id,
      audioUrl,
      imageUrl,
      duration, // 🕒 Tự động tính duration
      albumId: album ? album._id : null,
      isSingle: !!isSingle,
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
    next(error);
  }
};

export const archiveSong = async (req, res) => {
  try {
    const { songId } = req.params;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    // Kiểm tra quyền của artist
    if (song.artist.toString() !== artistId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền archive bài hát này." });
    }

    song.status = "archived";
    await song.save();

    res.status(200).json({ message: "Song archived successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error archiving song" });
  }
};

export const updateSong = async (req, res, next) => {
  try {
    const { songId } = req.params;
    const { title } = req.body;
    const artistId = req.auth.userId;

    // 🔍 Tìm bài hát
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Bài hát không tồn tại" });
    }

    // 🔐 Kiểm tra quyền sở hữu
    if (song.artist.toString() !== artistId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chỉnh sửa bài hát này" });
    }

    // ✅ Kiểm tra nếu cần update ảnh bìa hoặc file nhạc
    let imageUrl = song.imageUrl;
    let audioUrl = song.audioUrl;
    let duration = song.duration; // 🕒 Nếu không update file nhạc, giữ nguyên duration

    if (req.files) {
      // ✅ Nếu có cập nhật ảnh bìa
      if (req.files.imageFile) {
        imageUrl = await uploadToCloudinary(req.files.imageFile);
      }

      // ✅ Nếu có cập nhật file nhạc
      if (req.files.audioFile) {
        const audioFile = req.files.audioFile;
        const tempFilePath = path.join(
          process.cwd(),
          "public/uploads",
          audioFile.name
        );

        // ✅ Lưu file tạm
        await audioFile.mv(tempFilePath);

        // ✅ Tính `duration` của file mới
        const metadata = await parseFile(tempFilePath);
        duration = Math.round(metadata.format.duration); // 🕒 Lấy thời lượng chính xác

        // ✅ Upload file nhạc mới lên Cloudinary
        audioUrl = await uploadToCloudinary(audioFile, "audio");

        // ✅ Xóa file tạm sau khi upload
        await fs.unlink(tempFilePath);
      }
    }

    // ✅ Cập nhật bài hát
    song.title = title || song.title;
    song.duration = duration;
    song.imageUrl = imageUrl;
    song.audioUrl = audioUrl;

    await song.save();

    res.status(200).json({ message: "Cập nhật bài hát thành công", song });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật bài hát:", error);
    next(error);
  }
};
