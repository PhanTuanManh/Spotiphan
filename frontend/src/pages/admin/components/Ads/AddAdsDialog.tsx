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
import { useAdvertisementStore } from "@/stores/useAdvertisementStore";
import { Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

interface NewAd {
  title: string;
  redirectUrl: string;
  duration: number;
  startDate: string;
  endDate: string;
}

const AddAdsDialog = () => {
  const { getAllAdvertisements, createAdvertisement } = useAdvertisementStore();
  const [adsDialogOpen, setAdsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newAd, setNewAd] = useState<NewAd>({
    title: "",
    redirectUrl: "",
    duration: 30, // Default duration 30s
    startDate: "",
    endDate: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (!image) {
        return toast.error("Please upload an image file");
      }

      const formData = new FormData();
      formData.append("title", newAd.title);
      formData.append("redirectUrl", newAd.redirectUrl);
      formData.append("duration", newAd.duration.toString());
      formData.append("startDate", newAd.startDate);
      formData.append("endDate", newAd.endDate);
      formData.append("mediaFile", image); // ✅ Đúng tên field theo backend

      await axiosInstance.post("/admin/advertisements", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setNewAd({
        title: "",
        redirectUrl: "",
        duration: 30,
        startDate: "",
        endDate: "",
      });

      setImage(null);
      toast.success("Advertisement added successfully");
      getAllAdvertisements();
      setAdsDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to add advertisement: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={adsDialogOpen} onOpenChange={setAdsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
          <Plus className="mr-2 h-4 w-4" />
          Add Advertisement
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add New Advertisement</DialogTitle>
          <DialogDescription>
            Upload a new advertisement for your platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => setImage(e.target.files![0])}
          />

          {/* Image Upload Area */}
          <div
            className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
            onClick={() => imageInputRef.current?.click()}>
            <div className="text-center">
              {image ? (
                <div className="space-y-2">
                  <div className="text-sm text-emerald-500">
                    Image selected:
                  </div>
                  <div className="text-xs text-zinc-400">
                    {image.name.slice(0, 20)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">
                    Upload advertisement image
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Choose File
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Advertisement Fields */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={newAd.title}
              onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Redirect URL</label>
            <Input
              value={newAd.redirectUrl}
              onChange={(e) =>
                setNewAd({ ...newAd, redirectUrl: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (seconds)</label>
            <Input
              type="number"
              value={newAd.duration}
              onChange={(e) =>
                setNewAd({ ...newAd, duration: parseInt(e.target.value) })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={newAd.startDate}
              onChange={(e) =>
                setNewAd({ ...newAd, startDate: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={newAd.endDate}
              onChange={(e) => setNewAd({ ...newAd, endDate: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setAdsDialogOpen(false)}
            disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Add Advertisement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default AddAdsDialog;
