import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Send } from "lucide-react";
import { useState } from "react";

type EmojiObject = {
  native: string;
};

interface MessageInputProps {
  onSend: () => void;
}

const MessageInput = ({ onSend }: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { user } = useUser();
  const { selectedUser, sendMessage } = useChatStore();

  const handleSend = async () => {
    if (!selectedUser || !user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(selectedUser.clerkId, user.id, newMessage.trim());
      setNewMessage("");
      onSend(); // Gọi callback sau khi gửi thành công
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji: EmojiObject) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  return (
    <div className="p-4 mt-auto border-t border-zinc-800 relative">
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          😀
        </Button>

        {showEmojiPicker && (
          <div className="absolute bottom-14 left-0 z-50">
            <Picker data={data} onEmojiSelect={addEmoji} theme="dark" />
          </div>
        )}

        <Input
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="bg-zinc-800 border-none"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
