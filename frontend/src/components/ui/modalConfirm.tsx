import React from "react";
import ReactDOM from "react-dom";

interface ModalConfirmProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ModalConfirm: React.FC<ModalConfirmProps> = ({
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
}) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black/70
       rounded-lg shadow-lg p-6 relative w-96">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-white hover:text-gray-700"
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold mb-4 text-center">{title}</h2>

        {/* Message */}
        <p className="text-white mb-6 text-center">{message}</p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-secondary hover:bg-secondary/60 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/50 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("root") as HTMLElement // Ensure `#root` exists in `index.html`
  );
};

export default ModalConfirm;
