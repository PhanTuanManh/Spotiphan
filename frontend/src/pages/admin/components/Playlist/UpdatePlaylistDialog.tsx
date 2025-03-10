import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axios";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { PencilOff, Upload } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";

interface UpdatePlaylistProps {
	playlistId: string;
}

const UpdatePlaylistDialog = ({ playlistId }: UpdatePlaylistProps) => {
	const { fetchMyPlaylists } = usePlaylistStore();
	const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [playlist, setPlaylist] = useState({ name: "", imageUrl: "" });
	const [image, setImage] = useState<File | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	// Fetch Playlist data when dialog opens
    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                const res = await axiosInstance.get(`/playlists/${playlistId}`);
                setPlaylist(res.data.playlist || res.data);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                toast.error("Failed to fetch Playlist");
            }
        };

        if (playlistDialogOpen && playlistId) {
            fetchPlaylist();
        }
    }, [playlistId, playlistDialogOpen]);
    

	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			const formData = new FormData();
			formData.append("name", playlist.name);
			if (image) {
				formData.append("imageFile", image);
			}

			await axiosInstance.put(`/playlists/${playlistId}`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			toast.success("Playlist updated successfully");
			fetchMyPlaylists();
			setPlaylistDialogOpen(false);
		} catch (error: any) {
			toast.error("Failed to update Playlist: " + error.message);
		} finally {
			setIsLoading(false);
		}
	};


	return (
		<Dialog
			open={playlistDialogOpen}
			onOpenChange={(isOpen) => {
				setPlaylistDialogOpen(isOpen);
				if (!isOpen) {
					setPlaylist({ name: "", imageUrl: "" }); // Reset data when closing
				}
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
				>
					<PencilOff className="h-4 w-4" />
				</Button>
			</DialogTrigger>

			<DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>Update Playlist</DialogTitle>
					<DialogDescription>Modify Playlist details</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<input
						type="file"
						ref={imageInputRef}
						className="hidden"
						accept="image/*"
						onChange={(e) => setImage(e.target.files![0])}
					/>

					<div
						className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
						onClick={() => imageInputRef.current?.click()}
					>
						<div className="text-center">
							{image ? (
								<div className="space-y-2">
									<div className="text-sm text-emerald-500">Image selected:</div>
									<div className="text-xs text-zinc-400">{image.name.slice(0, 20)}</div>
								</div>
							) : (
								<>
									<div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
										<Upload className="h-6 w-6 text-zinc-400" />
									</div>
									<div className="text-sm text-zinc-400 mb-2">Upload new Playlist image</div>
									<Button variant="outline" size="sm" className="text-xs">Choose File</Button>
								</>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Playlist Name</label>
						<Input
							value={playlist.name}
							onChange={(e) => setPlaylist({ ...playlist, name: e.target.value })}
							className="bg-zinc-800 border-zinc-700"
						/>
					</div>

				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setPlaylistDialogOpen(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isLoading}>
						{isLoading ? "Updating..." : "Update Playlist"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default UpdatePlaylistDialog;
