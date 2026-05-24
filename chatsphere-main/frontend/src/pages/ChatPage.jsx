import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from '../components/ChatSidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageComposer from '../components/MessageComposer';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/EmptyState';
import TypingIndicator from '../components/TypingIndicator';
import HomePage from './HomePage';

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const {
    chats,
    users,
    messages,
    selectedChat,
    onlineUsers,
    typingUserIds,
    loadingChats,
    loadingMessages,
    selectChat,
    sendMessage,
    startTyping,
    stopTyping,
    startDirectChat,
    loadingUsers
  } = useChat();
  const scrollRef = useRef(null);
  const chatIdParam = params.id ? Number(params.id) : null;
  const isChatRoute = location.pathname.startsWith('/chat/');
  const routeChat = useMemo(() => chats.find((chat) => Number(chat.id) === chatIdParam) || null, [chats, chatIdParam]);
  const activeChat = chatIdParam
    ? routeChat || selectedChat
    : selectedChat || routeChat;

  useEffect(() => {
    console.log('[chat][render]', {
      path: location.pathname,
      chatIdParam,
      selectedChatId: selectedChat?.id || null,
      activeChatId: activeChat?.id || null,
      isChatRoute,
      mobileChatVisible: isChatRoute,
      mobileBreakpoint: typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
    });
  }, [location.pathname, chatIdParam, selectedChat?.id, activeChat?.id, isChatRoute]);

  const typingMembers = useMemo(() => {
    if (!activeChat || !typingUserIds.length) return [];
    return (activeChat.members || []).filter((member) => typingUserIds.includes(member.id) && member.id !== user?.id);
  }, [activeChat, typingUserIds, user?.id]);

  const typingText = useMemo(() => {
    if (!typingMembers.length) return '';
    if (typingMembers.length === 1) {
      return `${typingMembers[0].fullName || typingMembers[0].username || 'Someone'} is typing...`;
    }
    return 'Typing...';
  }, [typingMembers]);

  const handleMobileBack = () => {
    navigate('/chats', { replace: false });
  };

  const handleSelectChat = async (chat) => {
    if (!chat) return;
    console.log('[chat][select] click', { chatId: chat.id, currentSelectedChatId: selectedChat?.id || null });
    selectChat(chat);
    navigate(`/chat/${chat.id}`);
  };

  const handleStartDirectChat = async (userId) => {
    const created = await startDirectChat(userId);
    if (created?.id) {
      navigate(`/chat/${created.id}`);
    }
  };

  useEffect(() => {
    if (!chatIdParam) return;

    const matchingChat = chats.find((chat) => Number(chat.id) === chatIdParam);
    if (matchingChat && Number(selectedChat?.id) !== chatIdParam) {
      selectChat(matchingChat);
    }
  }, [chatIdParam, chats, selectedChat?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, activeChat?.id]);

  if (loadingChats) {
    return <div className="min-h-[100dvh] p-4 lg:p-6"><LoadingScreen label="Loading conversations" /></div>;
  }

  return (
    <div className="grid min-h-[100dvh] h-[100dvh] w-full grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[320px_1fr]">
      <div className="hidden lg:block">
        <ChatSidebar chats={chats} users={users} selectedChat={activeChat} onSelect={handleSelectChat} onlineUsers={onlineUsers} currentUserId={user?.id} loading={loadingChats} loadingUsers={loadingUsers} onStartDirect={handleStartDirectChat} />
      </div>
      
      <div className="relative hidden h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden lg:flex">
        <ChatHeader chat={activeChat} onlineUsers={onlineUsers} currentUserId={user?.id} />
        {typingText ? <TypingIndicator names={typingMembers.map(m => m.fullName || m.username)} /> : null}

        <div className="relative mx-4 mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-2xl">
          <div ref={scrollRef} className="glass-panel flex min-h-0 flex-1 flex-col overflow-y-auto p-4 wa-scroll">
            {activeChat ? (
              <div className="flex flex-1 flex-col gap-2">
                {loadingMessages ? <LoadingScreen label="Loading messages" /> : <MessageList messages={messages} currentUserId={user?.id} />}
              </div>
            ) : (
              <EmptyState
                title="Pick a conversation"
                description="Your direct chats and groups appear in the sidebar. Open one to start sending secure real-time messages."
              />
            )}
          </div>

          <div className="chat-composer">
            <MessageComposer
              disabled={!activeChat}
              onSend={sendMessage}
              onTyping={startTyping}
              onStopTyping={stopTyping}
            />
          </div>
        </div>
      </div>

      <div className="relative flex h-[100dvh] w-full overflow-hidden lg:hidden">
        {!isChatRoute ? (
          <HomePage
            chats={chats}
            onlineUsers={onlineUsers}
            currentUserId={user?.id}
            onSelectChat={async (chat) => {
              selectChat(chat);
              navigate(`/chat/${chat.id}`);
            }}
            loading={loadingChats}
            storageKey="mobile-chat-list-scroll"
          />
        ) : (
          <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--wa-bg)] text-[var(--wa-text)]">
            <ChatHeader chat={activeChat} onlineUsers={onlineUsers} currentUserId={user?.id} onBack={handleMobileBack} />
            {typingText ? <TypingIndicator names={typingMembers.map(m => m.fullName || m.username)} /> : null}

            <div className="relative mx-0 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[24px]">
              <div ref={scrollRef} className="glass-panel flex min-h-0 flex-1 flex-col overflow-y-auto p-3 pb-4 wa-scroll">
                <div className="flex flex-1 flex-col gap-1.5">
                  {loadingMessages ? <LoadingScreen label="Loading messages" /> : <MessageList messages={messages} currentUserId={user?.id} />}
                </div>
              </div>

              <div className="chat-composer">
                <MessageComposer
                  disabled={!activeChat}
                  onSend={sendMessage}
                  onTyping={startTyping}
                  onStopTyping={stopTyping}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}