// src/components/SignInOAuthButtons.tsx

import ReactDOM from "react-dom";
import { useState, ReactNode } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Toaster } from "react-hot-toast";

type ModalMode = "login" | "register";

const SignInRegisterModal: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>("login");

  const ModalContent: ReactNode = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setModalOpen(false)} // Close modal on overlay click
    >
      <div
        className="relative bg-card p-6 rounded-lg shadow-lg w-[95%] max-w-md z-10"
        onClick={(e) => e.stopPropagation()} // Stop propagation of clicks inside the modal
      >
        {modalMode === "login" ? (
          <SignIn
            afterSignInUrl={null} // No redirection
            redirectUrl={null} // Handle email links or codes internally
          />
        ) : (
          <SignUp
            afterSignUpUrl={null} // No redirection
            redirectUrl={null} // Handle email verification internally
          />
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Toaster />
      <div className="flex gap-4">
        <Button
          onClick={() => {
            setModalMode("login");
            setModalOpen(true);
          }}
          variant="default"
          className="w-full bg-primary text-primary-foreground h-11 rounded-lg shadow-md hover:bg-primary/90">
          Login
        </Button>
        <Button
          onClick={() => {
            setModalMode("register");
            setModalOpen(true);
          }}
          variant="secondary"
          className="w-full bg-secondary text-secondary-foreground h-11 rounded-lg shadow-md hover:bg-secondary/90">
          Register
        </Button>
      </div>
      {isModalOpen && ReactDOM.createPortal(ModalContent, document.body)}
    </div>
  );
};

export default SignInRegisterModal;
