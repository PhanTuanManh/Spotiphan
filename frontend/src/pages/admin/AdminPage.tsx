import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { Album, ChartBarIcon, ListVideo, Music } from "lucide-react";
import { useEffect } from "react";
import AlbumsTabContent from "./components/Album/AlbumsTabContent";
import CategoriesTabContent from "./components/Category/CategoriesTabContent";
import DashboardStats from "./components/DashboardStats";
import Header from "./components/Header";
import PlaylistsTabContent from "./components/Playlist/PlaylistsTabContent";
import SinglesTabContent from "./components/Single/SinglesTabContent";


const AdminPage = () => {
	const { isAdmin, isLoading } = useAuthStore();

	const { fetchAlbums, fetchSongs, fetchStats } = useMusicStore();

	useEffect(() => {
		fetchAlbums();
		fetchSongs();
		fetchStats();
	}, [fetchAlbums, fetchSongs, fetchStats]);

	if (!isAdmin && !isLoading) return <div>Unauthorized</div>;

	return (
		<div
			className='min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900
   to-black text-zinc-100 p-8'
		>
			<Header />

			<DashboardStats />

			<Tabs defaultValue='songs' className='space-y-6'>
				<TabsList className='p-1 bg-zinc-800/50'>
					<TabsTrigger value='songs' className='data-[state=active]:bg-zinc-700'>
						<Music className='mr-2 size-4' />
						Singles
					</TabsTrigger>
					<TabsTrigger value='albums' className='data-[state=active]:bg-zinc-700'>
						<Album className='mr-2 size-4' />
						Albums
					</TabsTrigger>
					<TabsTrigger value='categories' className='data-[state=active]:bg-zinc-700'>
						<ChartBarIcon className='mr-2 size-4' />
						Categories
					</TabsTrigger>
					<TabsTrigger value='playlists' className='data-[state=active]:bg-zinc-700'>
						<ListVideo className='mr-2 size-4' />
						Playlists
					</TabsTrigger>
				</TabsList>

				<TabsContent value='songs'>
					<SinglesTabContent />
				</TabsContent>
				<TabsContent value='albums'>
					<AlbumsTabContent />
				</TabsContent>
				<TabsContent value='categories'>
					<CategoriesTabContent />
				</TabsContent>
				<TabsContent value='playlists'>
					<PlaylistsTabContent />
				</TabsContent>
			</Tabs>
		</div>
	);
};
export default AdminPage;
