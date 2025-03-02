import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import UpdateCategoryDialog from "./UpdateCategoryDialog";
import ModalConfirm from "@/components/ui/modalConfirm";


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

const CategoriesTable = () => {
  const { categories, deleteCategory, getCategories } = useCategoryStore();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    getCategories();
  }, [getCategories]);

  console.log("categories", categories);

  const handleDeleteCategory = async () => {
    if (selectedCategory) {
      await deleteCategory(selectedCategory); // ✅ Gọi hàm xóa
      setSelectedCategory(null); // ✅ Đóng modal sau khi xóa
      getCategories(); // ✅ Refresh danh sách sau khi xóa
    }
  };

  const filteredCategories = categories.filter((category) => {
    const normalizedSearchTerm = removeDiacritics(
      debouncedSearchTerm.toLowerCase()
    );
    const normalizedName = removeDiacritics(category.name.toLowerCase());
    return normalizedName.includes(normalizedSearchTerm);
  });

  return (
    <>
      {/* Modal Confirm Delete */}
      {selectedCategory && (
        <ModalConfirm
          title="Delete Category"
          message="Are you sure you want to delete this category? This action cannot be undone."
          onConfirm={handleDeleteCategory} // ✅ Gọi hàm xóa khi nhấn Confirm
          onCancel={() => setSelectedCategory(null)}
        />
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
      </div>

      {/* Categories Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCategories.map((category) => (
            <TableRow key={category._id} className="hover:bg-zinc-800/50">
              <TableCell>
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-10 h-10 rounded object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{category.description}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <UpdateCategoryDialog categoryId={category._id} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory(category._id)} // ✅ Set category khi nhấn Delete
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

export default CategoriesTable;
