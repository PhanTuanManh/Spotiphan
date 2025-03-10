import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ModalConfirm from "@/components/ui/modalConfirm";
import { RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

// Custom Hook for Debouncing
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

interface AdminTableProps<T> {
  data: T[];
  fetchData: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  columns: { key: keyof T; label: string }[];
  renderActions?: (item: T) => JSX.Element;
  title: string;
}

const AdminTable = <T extends { _id: string; name: string }>({
  data,
  fetchData,
  deleteItem,
  columns,
  renderActions,
  title,
}: AdminTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedItemDelete, setSelectedItemDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = Array.isArray(data)
    ? data.filter((item) => {
        const normalizedSearchTerm = removeDiacritics(debouncedSearchTerm.toLowerCase());
        const normalizedName = removeDiacritics(item.name.toLowerCase());
        return normalizedName.includes(normalizedSearchTerm);
      })
    : [];

  return (
    <>
      {selectedItemDelete && (
        <ModalConfirm
          title={`Delete ${title}`}
          message={`Are you sure you want to delete this ${title.toLowerCase()}? This action cannot be undone.`}
          onConfirm={() => {
            deleteItem(selectedItemDelete);
            setSelectedItemDelete(null);
          }}
          onCancel={() => setSelectedItemDelete(null)}
        />
      )}

      {/* Search & Refresh */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
        <Button variant="outline" className="ml-4" onClick={fetchData}>
          <RefreshCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Data Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key as string}>{col.label}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item) => (
            <TableRow key={item._id}>
              {columns.map((col) => (
                <TableCell key={col.key as string}>{String(item[col.key])}</TableCell>
              ))}
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {renderActions && renderActions(item)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItemDelete(item._id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
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

export default AdminTable;
