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
import { useAdvertisementStore } from "@/stores/useAdvertisementStore";
import { Upload, Edit } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";

interface UpdateAdsDialogProps {
  adId: string;
  title: string;
  redirectUrl: string;
  duration: number;
  startDate: string;
  endDate: string;
  mediaUrl: string;
}

const UpdateAdsDialog: React.FC<UpdateAdsDialogProps> = ({
  adId,
  title,
  redirectUrl,
  duration,
  startDate,
  endDate,
  mediaUrl,
}) => {
  const { getAllAdvertisements, updateAdvertisement } = useAdvertisementStore();
  const [adsDialogOpen, setAdsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [updatedAd, setUpdatedAd] = useState({
    title: "",
    redirectUrl: "",
    duration: 0,
    startDate: "",
    endDate: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(mediaUrl);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ✅ Cập nhật dữ liệu khi mở dialog
  useEffect(() => {
    if (adsDialogOpen) {
      setUpdatedAd({ title, redirectUrl, duration, startDate, endDate });
      setPreviewImage(mediaUrl);
    }
  }, [
    adsDialogOpen,
    title,
    redirectUrl,
    duration,
    startDate,
    endDate,
    mediaUrl,
  ]);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", updatedAd.title);
      formData.append("redirectUrl", updatedAd.redirectUrl);
      formData.append("duration", updatedAd.duration.toString());
      formData.append("startDate", updatedAd.startDate);
      formData.append("endDate", updatedAd.endDate);

      if (image) {
        formData.append("mediaFile", image);
      }

      await updateAdvertisement(adId, Object.fromEntries(formData.entries()));

      toast.success("Advertisement updated successfully");
      getAllAdvertisements();
      setAdsDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to update advertisement: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={adsDialogOpen} onOpenChange={setAdsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Update Advertisement</DialogTitle>
          <DialogDescription>
            Modify the advertisement details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files![0];
              setImage(file);
              setPreviewImage(URL.createObjectURL(file)); // ✅ Hiển thị ảnh preview khi chọn ảnh mới
            }}
          />

          {/* Image Upload Area */}
          <div
            className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
            onClick={() => imageInputRef.current?.click()}>
            <div className="text-center">
              {previewImage ? (
                <>
                  <img
                    src={previewImage}
                    alt="Current Ad"
                    className="w-20 h-20 rounded mb-2"
                  />
                  <div className="text-sm text-emerald-500">
                    Click to change image
                  </div>
                </>
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
              value={updatedAd.title}
              onChange={(e) =>
                setUpdatedAd({ ...updatedAd, title: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Redirect URL</label>
            <Input
              value={updatedAd.redirectUrl}
              onChange={(e) =>
                setUpdatedAd({ ...updatedAd, redirectUrl: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (seconds)</label>
            <Input
              type="number"
              value={updatedAd.duration}
              onChange={(e) =>
                setUpdatedAd({
                  ...updatedAd,
                  duration: parseInt(e.target.value),
                })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={updatedAd.startDate}
              onChange={(e) =>
                setUpdatedAd({ ...updatedAd, startDate: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={updatedAd.endDate}
              onChange={(e) =>
                setUpdatedAd({ ...updatedAd, endDate: e.target.value })
              }
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
            {isLoading ? "Updating..." : "Update Advertisement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateAdsDialog;
