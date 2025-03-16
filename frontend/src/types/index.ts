// src/types/index.ts

//remove comments
export interface BaseModel {
  _id: string;
  createdAt: string; // ISO string hoặc Date
  updatedAt: string;
}

// ===== User Listening History =====
export interface IUserListeningHistory extends BaseModel {
  userId: string;
  songId: string;
  listenedAt: string; // ISO date string
}

// ===== Advertisement =====
export interface IAdvertisement extends BaseModel {
  title: string;
  mediaUrl: string;
  redirectUrl: string;
  duration: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  isActive: boolean;
}

// ===== Album =====
export type AlbumStatus = "pending" | "approved" | "rejected" | "archived";

export interface IAlbum extends BaseModel {
  title: string;
  artist: string; // user id của nghệ sĩ
  imageUrl: string;
  releaseYear: number;
  songs: string[]; // mảng song id
  status: AlbumStatus;
  category: string[]; // mảng category id
}

// ===== Category =====
export interface ICategory extends BaseModel {
  name: string;
  description?: string;
  imageUrl?: string;
  albums: string[]; // mảng album id
  playlists: string[]; // mảng playlist id
}

// ===== Message =====
export interface IMessage extends BaseModel {
  senderId: string;
  receiverId: string;
  content: string;
}

// ===== Payment =====
export type PaymentStatus = "pending" | "completed" | "failed" | "canceled";
export type PaymentMethod = "PayPal" | "MoMo";

export interface IPayment extends BaseModel {
  userId: IUser;
  planId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  subscriptionStartDate: string; // ISO string
  subscriptionEndDate: string; // ISO string
  isAutoRenew: boolean;
}

// ===== Playlist =====
export interface IPlaylist extends BaseModel {
  name: string;
  userId: string;
  imageUrl: string;
  songs: { _id: string; title: string }[]; // mảng song id
  isPublic: boolean;
  followers: string[]; // mảng user id
  category: string[]; // mảng category id
}

// ===== Queue =====
export type LoopMode = "none" | "loop_playlist" | "loop_song";

export interface IQueue extends BaseModel {
  userId: string;
  songs: string[]; // mảng song id
  currentIndex: number;
  isShuffled: boolean;
  loopMode: LoopMode;
}

// ===== Song =====
export type SongStatus = "pending" | "approved" | "rejected" | "archived";

export interface IArtistInfo {
  fullName: string;
  imageUrl: string;
}

export interface ISong extends BaseModel {
  title: string;
  artist: string;
  imageUrl: string;
  audioUrl: string;
  duration: number;
  albumId?: IAlbum;
  listenCount: number;
  isFeatured: boolean;
  lastListenedAt?: string;
  likes: string[];
  status: SongStatus;
  isSingle: boolean;
}

// ===== Subscription Plan =====
export interface ISubscriptionPlan extends BaseModel {
  name: string;
  durationInDays: number;
  price: number;
  currency: string;
  isActive: boolean;
}

// ===== User =====
export type UserRole = "free" | "premium" | "artist" | "admin";

export interface IUser extends BaseModel {
  fullName: string;
  email: string;
  imageUrl: string;
  clerkId: string;
  role: UserRole;
  premiumExpiration?: string | null; // ISO string hoặc null
  isPremium: boolean;
  subscriptionPlan?: string | null; // ✅ Phù hợp hơn với MongoDB khi không có gói nào
  paymentHistory: string[];
  likedSongs: string[];
  playlists: string[];
  albums: string[]; // mảng album id (chỉ dành cho artist)
  followers: string[];
  following: string[];
  isBlocked: boolean;
}

export interface IStats {
  totalSongs: number;
  totalAlbums: number;
  totalUsers: number;
  totalArtists: number;
  totalPlaylists: number;
}

export interface IArtistStats {
  artistId: string;
  artistName: string;
  totalSongs: number;
  totalAlbums: number;
  totalSingles: number;
  loading: boolean;
  error: string | null;
}
