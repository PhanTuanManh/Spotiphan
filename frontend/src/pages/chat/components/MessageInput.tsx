import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import data, { BaseEmoji } from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Send } from "lucide-react";
import { useState } from "react";

const MessageInput = () => {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useUser();
  const { selectedUser, sendMessage } = useChatStore();

  const handleSend = () => {
    if (!selectedUser || !user || !newMessage.trim()) return;
    sendMessage(selectedUser.clerkId, user.id, newMessage.trim());
    setNewMessage("");
  };

  const addEmoji = (emoji: BaseEmoji) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  return (
    <div className="p-4 mt-auto border-t border-zinc-800 relative">
      <div className="flex gap-2">
        <Button
          size="icon"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
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
          size={"icon"}
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
