import { Button } from "@/components/ui/button";
import ModalConfirm from "@/components/ui/modalConfirm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdvertisementStore } from "@/stores/useAdvertisementStore";
import { RefreshCcw, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import UpdateAdsDialog from "./UpdateAdsDialog";

// Custom Hook for Debouncing Input
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const removeDiacritics = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const AdsTable = () => {
  const {
    allAdvertisements,
    getAllAdvertisements,
    deleteAdvertisement,
    toggleAdvertisementActive,
    loading,
  } = useAdvertisementStore();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  useEffect(() => {
    getAllAdvertisements();
  }, [getAllAdvertisements]);

  const handleDeleteAd = async () => {
    if (selectedAd) {
      await deleteAdvertisement(selectedAd);
      setSelectedAd(null); // ✅ Close modal after deletion
      getAllAdvertisements(); // ✅ Refresh list
    }
  };

  const handleToggleActive = async (adId: string) => {
    await toggleAdvertisementActive(adId);
    toast.success("Updated ad successfully");
    getAllAdvertisements(); // ✅ Refresh list
  };

  const filteredAds = Array.isArray(allAdvertisements)
    ? allAdvertisements.filter((ad) => {
        const normalizedSearchTerm = removeDiacritics(
          debouncedSearchTerm.toLowerCase()
        );
        const normalizedTitle = removeDiacritics(ad.title.toLowerCase());
        return normalizedTitle.includes(normalizedSearchTerm);
      })
    : [];

  return (
    <>
      {/* Modal Confirm Delete */}
      {selectedAd && (
        <ModalConfirm
          title="Delete Advertisement"
          message="Are you sure you want to delete this advertisement? This action cannot be undone."
          onConfirm={handleDeleteAd}
          onCancel={() => setSelectedAd(null)}
        />
      )}

      {/* Search */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search advertisements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => getAllAdvertisements()}
          disabled={loading}>
          <RefreshCcw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Advertisements Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]">Media</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAds.map((ad) => (
            <TableRow key={ad._id} className="hover:bg-zinc-800/50">
              <TableCell>
                <img
                  src={ad.mediaUrl}
                  alt={ad.title}
                  className="w-10 h-10 rounded object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{ad.title}</TableCell>
              <TableCell>{ad.duration} sec</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    ad.isActive
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}>
                  {ad.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(ad._id)}
                    className={`${
                      ad.isActive ? "text-green-400" : "text-gray-400"
                    }`}>
                    {ad.isActive ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </Button>
                  <UpdateAdsDialog
                    adId={ad._id}
                    title={ad.title}
                    redirectUrl={ad.redirectUrl}
                    duration={ad.duration}
                    startDate={ad.startDate}
                    endDate={ad.endDate}
                    mediaUrl={ad.mediaUrl}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAd(ad._id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default AdsTable;
