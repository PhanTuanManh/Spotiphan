import dotenv from "dotenv";
import mongoose from "mongoose";
import { parseFile } from "music-metadata";
import path from "path";
import { Album } from "../models/album.model.js";
import { Category } from "../models/category.model.js";
import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";

dotenv.config();

console.log("🔍 MONGODB_URI:", process.env.MONGODB_URI);

// ✅ Kiểm tra đường dẫn file nhạc
const filePath = path.join(process.cwd(), "public/uploads/1.mp3");
console.log("📁 Đường dẫn file:", filePath);

const getAudioDuration = async (filePath) => {
    try {
        const metadata = await parseFile(filePath);
        return Math.round(metadata.format.duration);
    } catch (error) {
        console.error(`❌ Lỗi khi lấy duration của file ${filePath}:`, error);
        return 0;
    }
};

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // ❌ Xóa dữ liệu cũ trước khi seed
        await Category.deleteMany({});
        await Album.deleteMany({});
        await Playlist.deleteMany({});
        await Song.deleteMany({});

        // ✅ Lấy thông tin người dùng từ Clerk
        const artist = await User.findOne({ clerkId: "user_2tBTVlfaeiXIcOjRSnaa1UoV2ck" });
        const admin = await User.findOne({ clerkId: "user_2r1Czkujkl4tUoJu5Lpw2kPxsX8" });

        if (!artist || !admin) {
            console.error("❌ Không tìm thấy artist hoặc admin trong database!");
            return;
        }

        // ✅ Tạo các danh mục (Categories)
        const categories = await Category.insertMany([
            { name: "Pop", description: "Nhạc Pop thịnh hành", imageUrl: "https://www.diamondart.com.au/cdn/shop/products/Popart-Wow.jpg?v=1716987052" },
            { name: "Rock", description: "Nhạc Rock đỉnh cao", imageUrl: "https://images.unsplash.com/photo-1663436296764-266c211c2360?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
            { name: "Hip-Hop", description: "Nhạc Hip-Hop chất lượng", imageUrl: "https://admin.musiconline.co/uploads/images/blog/header/hip-hop-muzik-tarihi.jpg" },
            { name: "Jazz", description: "Nhạc Jazz nhẹ nhàng", imageUrl: "https://img.freepik.com/premium-vector/abstract-jazz-art-music-instrument_40345-9.jpg" },
        ]);
        console.log("✅ Categories seeded!");

        // ✅ Tạo album của artist
        const albums = await Album.insertMany([
            {
                title: "Greatest Hits",
                artist: artist._id,
                imageUrl: "https://photo-resize-zmp3.zadn.vn/w600_r1x1_jpeg/cover/3/3/a/4/33a4ee2a3b97a446b1c3f6592a7cc912.jpg",
                releaseYear: 2022,
                songs: [],
                status: "approved",
                category: [categories[0]._id, categories[1]._id],
            },
            {
                title: "Rock Legends",
                artist: artist._id,
                imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1_KqZeo_tkqxO4eG7U9t095ho4MRbyqDwdQ&s",
                releaseYear: 2021,
                songs: [],
                status: "approved",
                category: [categories[1]._id],
            },
        ]);
        console.log("✅ Albums seeded!");

        // ✅ Lấy `duration` của file nhạc
        const duration = await getAudioDuration(filePath);

        // ✅ Tạo bài hát
        const songs = await Song.insertMany([
            {
                title: "Song One",
                artist: artist._id,
                imageUrl: "https://example.com/song-one.jpg",
                audioUrl: "/uploads/1.mp3",
                duration,
                albumId: albums[0]._id,
                listenCount: 100,
                isFeatured: true,
                status: "approved",
                isSingle: false,
            },
            {
                title: "Song Two",
                artist: artist._id,
                imageUrl: "https://example.com/song-two.jpg",
                audioUrl: "/uploads/1.mp3",
                duration,
                albumId: albums[0]._id,
                listenCount: 200,
                isFeatured: false,
                status: "approved",
                isSingle: false,
            },
            {
                title: "Single Hit",
                artist: artist._id,
                imageUrl: "https://example.com/single-hit.jpg",
                audioUrl: "/uploads/1.mp3",
                duration,
                listenCount: 350,
                isFeatured: true,
                status: "approved",
                isSingle: true,
            },
        ]);
        console.log("✅ Songs & Singles seeded!");

        // ✅ Cập nhật album với bài hát
        for (let album of albums) {
            album.songs = songs.filter(song => song.albumId?.equals(album._id)).map(song => song._id);
            await album.save();
        }
        console.log("✅ Albums updated with songs!");

        // ✅ Cập nhật category với albums
        for (let category of categories) {
            category.albums = albums.filter(album => album.category.includes(category._id)).map(album => album._id);
            await category.save();
        }
        console.log("✅ Categories updated with albums!");

        // ✅ Tạo playlist của admin
        const playlists = await Playlist.insertMany([
            {
                name: "Admin's Pop Picks",
                imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEzYkx8QeiFD0IhGVUkkPIg5mGfQI8U4WvGQ&s",
                userId: admin._id,
                songs: [songs[0]._id, songs[2]._id],
                isPublic: true,
                followers: [],
                category: [categories[0]._id],
            },
            {
                name: "Rock Essentials",
                imageUrl: null,
                userId: admin._id,
                songs: [songs[1]._id],
                isPublic: true,
                followers: [],
                category: [categories[1]._id],
            },
        ]);
        console.log("✅ Playlists seeded!");

        // ✅ Cập nhật category với playlists
        for (let category of categories) {
            category.playlists = playlists.filter(playlist => playlist.category.includes(category._id)).map(playlist => playlist._id);
            await category.save();
        }
        console.log("✅ Categories updated with playlists!");

        mongoose.connection.close();
        console.log("✅ Seed hoàn tất và đóng kết nối MongoDB!");
    } catch (error) {
        console.error("❌ Lỗi khi seed dữ liệu:", error);
        mongoose.connection.close();
    }
};

// ✅ Chạy seed script
seedDatabase();
