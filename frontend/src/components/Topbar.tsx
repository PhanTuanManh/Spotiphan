// frontend/src/components/Topbar.tsx
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { SignedOut, UserButton } from "@clerk/clerk-react";
import { LayoutDashboardIcon, SearchIcon, XIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SignInRegisterModal from "./SignInOAuthButtons";
import { buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useState, useRef } from "react";

const Topbar = () => {
  const { role } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim()) {
      debounceTimer.current = setTimeout(() => {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }, 500);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75 backdrop-blur-md z-10">
      {/* Nhóm bên trái - 2 phần tử đầu tiên */}
      <div className="flex items-center gap-4 flex-1">
        {/* Phần tử 1: Logo */}
        <div className="flex-shrink-0">
          <img src="/spotify.png" className="size-8" alt="Spotify logo" />
        </div>

        {/* Phần tử 2: Search bar */}
        <div
          className={`flex-1 max-w-md transition-all duration-200 ${
            isSearchFocused ? "bg-zinc-800 rounded-md" : ""
          }`}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="What do you want to listen to?"
              className="pl-10 pr-8 py-2 rounded-full w-full bg-zinc-800 border-none focus-visible:ring-2 focus-visible:ring-green-500 focus:bg-zinc-700 hover:bg-zinc-700 transition-all"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nhóm bên phải - phần tử thứ 3 */}
      <div className="flex items-center gap-4 ml-4">
        {role === "admin" && (
          <Link
            to={"/admin"}
            className={cn(buttonVariants({ variant: "outline" }))}>
            <LayoutDashboardIcon className="size-4 mr-2" />
            Admin Dashboard
          </Link>
        )}
        {role === "artist" && (
          <Link
            to={"/artists"}
            className={cn(buttonVariants({ variant: "outline" }))}>
            <LayoutDashboardIcon className="size-4 mr-2" />
            Artist Dashboard
          </Link>
        )}

        <SignedOut>
          <SignInRegisterModal />
        </SignedOut>

        <UserButton />
      </div>
    </div>
  );
};
export default Topbar;
