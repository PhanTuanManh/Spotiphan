// src/components/Topbar.tsx

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { SignedOut, UserButton } from "@clerk/clerk-react";
import { LayoutDashboardIcon } from "lucide-react";
import { Link } from "react-router-dom";
import SignInRegisterModal from "./SignInOAuthButtons";
import { buttonVariants } from "./ui/button";

const Topbar = () => {
  const { role } = useAuthStore();
  return (
    <div
      className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75 
      backdrop-blur-md z-10
    ">
      <div className="flex gap-2 items-center">
        <img src="/spotify.png" className="size-8" alt="Spotify logo" />
      </div>
      <div className="flex items-center gap-4">
        {role === "admin" && (
          <Link
            to={"/admin"}
            className={cn(buttonVariants({ variant: "outline" }))}>
            <LayoutDashboardIcon className="size-4  mr-2" />
            Admin Dashboard
          </Link>
        )}
        {role === "artist" && (
          <Link
            to={"/artists"}
            className={cn(buttonVariants({ variant: "outline" }))}>
            <LayoutDashboardIcon className="size-4  mr-2" />
            Artisit Dashboard
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
