export interface Song {
	_id: string;
	title: string;
	artist: User; // Tham chiếu đến đối tượng User
	albumId?: string | null; // Album có thể không tồn tại nếu là Single
	imageUrl: string;
	audioUrl: string;
	duration: number;
	listenCount: number;
	isFeatured: boolean;
	lastListenedAt?: string;
	likes: string[]; // Danh sách ID người dùng đã thích bài hát
	category: Category; // Thể loại bài hát
	status: "pending" | "approved" | "rejected" | "archived"; // Trạng thái duyệt
	isSingle: boolean; // Xác định nếu bài hát là Single
	createdAt: string;
	updatedAt: string;
  }
  
  export interface Album {
	_id: string;
	title: string;
	artist: User; // Liên kết với Artist (User)
	imageUrl: string;
	releaseYear: number;
	songs: Song[]; // Danh sách bài hát trong album
	status: "pending" | "approved" | "rejected" | "archived"; // Trạng thái duyệt
	createdAt: string;
	updatedAt: string;
  }
  
  export interface Playlist {
	_id: string;
	name: string;
	userId: string; // ID của người tạo playlist
	songs: Song[]; // Danh sách bài hát trong playlist
	isPublic: boolean; // Xác định playlist có công khai không
	followers: string[]; // Danh sách ID người dùng đã theo dõi playlist
	createdAt: string;
	updatedAt: string;
  }
  
  export interface Stats {
	totalSongs: number;
	totalAlbums: number;
	totalUsers: number;
	totalArtists: number;
	totalPlaylists: number;
  }
  
  export interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
  }
  
  export interface User {
	_id: string;
	clerkId: string;
	fullName: string;
	email: string;
	imageUrl: string;
	role: "free" | "premium" | "artist" | "admin";
	premiumExpiration?: string | null;
	isPremium: boolean;
	subscriptionPlan?: SubscriptionPlan | null;
	paymentHistory: Payment[]; // Danh sách giao dịch thanh toán
	likedSongs: Song[]; // Danh sách bài hát đã thích
	playlists: Playlist[]; // Danh sách playlist do user tạo
	albums?: Album[]; // Chỉ artist có albums
	followers: User[]; // Những người theo dõi
	following: User[]; // Người dùng đang theo dõi
	isBlocked: boolean;
	createdAt: string;
	updatedAt: string;
  }
  
  export interface SubscriptionPlan {
	_id: string;
	name: string; // Tên gói (1 tháng, 3 tháng, 1 năm)
	durationInDays: number; // Số ngày của gói
	price: number; // Giá tiền
	currency: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
  }
  
  export interface Payment {
	_id: string;
	userId: string;
	planId: SubscriptionPlan; // Gói premium đã chọn
	amount: number;
	currency: string;
	paymentMethod: "PayPal" | "MoMo";
	transactionId: string;
	status: "pending" | "completed" | "failed" | "canceled";
	subscriptionStartDate: string;
	subscriptionEndDate: string;
	isAutoRenew: boolean;
	createdAt: string;
	updatedAt: string;
  }
  
  export interface Category {
	_id: string;
	name: string; // Thể loại nhạc (Pop, Rock, K-pop, Podcast...)
	description?: string;
	imageUrl?: string;
	createdAt: string;
	updatedAt: string;
  }
  
  export interface Advertisement {
	_id: string;
	title: string;
	mediaUrl: string; // Hình ảnh hoặc video quảng cáo
	redirectUrl: string; // Link khi nhấn vào quảng cáo
	duration: number; // Thời gian quảng cáo (giây)
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
  }
  
  export interface ListeningHistory {
	_id: string;
	userId: string;
	songId: string;
	listenedAt: string;
	createdAt: string;
	updatedAt: string;
  }
  
  export interface Queue {
	_id: string;
	userId: string;
	songs: Song[];
	currentIndex: number;
	isShuffled: boolean;
	loopMode: "none" | "loop_playlist" | "loop_song";
	createdAt: string;
	updatedAt: string;
  }
  