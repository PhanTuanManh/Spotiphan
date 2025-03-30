import Topbar from "@/components/Topbar";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState, useCallback } from "react";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./components/MessageInput";

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ChatPage = () => {
  const { user } = useUser();
  const {
    messages,
    selectedUser,
    fetchUsers,
    fetchMessages,
    loadMoreMessages,
    isLoadingMore,
    hasMore,
  } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<React.ElementRef<typeof ScrollArea>>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Auto scroll to bottom when messages change
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    if (!viewportRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    const isNearTop = scrollTop < 100;

    console.log("Scroll position:", {
      scrollTop,
      scrollHeight,
      clientHeight,
      isNearTop,
    });

    setIsScrolled(scrollTop > 20);

    if (isNearTop && hasMore && !isLoadingMore) {
      console.log("Loading more messages...");
      const previousHeight = scrollHeight;

      loadMoreMessages().then(() => {
        if (!viewportRef.current) return;

        // Maintain scroll position after loading
        const newHeight = viewportRef.current.scrollHeight;
        viewportRef.current.scrollTop = newHeight - previousHeight;
      });
    }
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new MutationObserver(() => {
      handleScroll();
    });

    observer.observe(viewport, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [handleScroll]);

  useEffect(() => {
    console.log("Messages updated:", messages.length);
  }, [messages]);

  useEffect(() => {
    console.log("HasMore updated:", hasMore);
  }, [hasMore]);

  useEffect(() => {
    console.log("SelectedUser updated:", selectedUser?.clerkId);
  }, [selectedUser]);

  useEffect(() => {
    if (!isScrolled) {
      scrollToBottom("auto");
    }
  }, [messages, isScrolled, scrollToBottom]);

  useEffect(() => {
    if (user) fetchUsers();
  }, [fetchUsers, user]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.clerkId).then(() => {
        setTimeout(() => scrollToBottom("auto"), 100);
      });
    }
  }, [selectedUser, fetchMessages, scrollToBottom]);

  return (
    <main className="h-full rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden">
      <Topbar />

      <div className="grid lg:grid-cols-[300px_1fr] grid-cols-[80px_1fr] h-[calc(100vh-180px)]">
        <UsersList />

        <div className="flex flex-col h-full">
          {selectedUser ? (
            <>
              <ChatHeader />

              <ScrollArea
                ref={scrollAreaRef}
                className="h-[calc(100vh-340px)]"
                onScroll={handleScroll}>
                <div ref={viewportRef} className="p-4 space-y-4">
                  {isLoadingMore && (
                    <div className="flex justify-center py-2">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex items-start gap-3 ${
                        message.senderId === user?.id ? "flex-row-reverse" : ""
                      }`}>
                      <Avatar className="size-8">
                        <AvatarImage
                          src={
                            message.senderId === user?.id
                              ? user.imageUrl
                              : selectedUser.imageUrl
                          }
                        />
                      </Avatar>

                      <div
                        className={`rounded-lg p-3 max-w-[70%] ${
                          message.senderId === user?.id
                            ? "bg-green-500"
                            : "bg-zinc-800"
                        }`}>
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs text-zinc-300 mt-1 block">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <MessageInput onSend={scrollToBottom} />
            </>
          ) : (
            <NoConversationPlaceholder />
          )}
        </div>
      </div>
    </main>
  );
};

export default ChatPage;

const Spinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-zinc-500 border-t-transparent`}
    />
  );
};

const NoConversationPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-6">
    <img src="/spotify.png" alt="Spotify" className="size-16 animate-bounce" />
    <div className="text-center">
      <h3 className="text-zinc-300 text-lg font-medium mb-1">
        No conversation selected
      </h3>
      <p className="text-zinc-500 text-sm">Choose a friend to start chatting</p>
    </div>
  </div>
);
