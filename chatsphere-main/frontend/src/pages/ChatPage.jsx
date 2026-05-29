import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
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
import api from '../services/api';

export default function ChatPage() {
  const { user, logout } = useAuth();
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
    editMessage,
    deleteMessage,
    reactToMessage,
    startDirectChat,
    loadingUsers,
    replyingToMessage,
    setReplyingToMessage,
    refreshChats,
    setChats
  } = useChat();
  const scrollRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false));
  const chatIdParam = params.id ? Number(params.id) : null;
  const isChatRoute = location.pathname.startsWith('/chat/');
  const routeChat = useMemo(() => chats.find((chat) => Number(chat.id) === chatIdParam) || null, [chats, chatIdParam]);
  const activeChat = chatIdParam
    ? routeChat || selectedChat
    : selectedChat || routeChat;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
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
    setReplyingToMessage(null);
    selectChat(chat);
    navigate(`/chat/${chat.id}`);
  };

  const handleStartDirectChat = async (userId) => {
    const created = await startDirectChat(userId);
    if (created?.id) {
      navigate(`/chat/${created.id}`);
    }
  };

  const handleReply = (message) => {
    setReplyingToMessage(message);
  };

  const handleClearReply = () => {
    setReplyingToMessage(null);
  };

  const handleReact = async (message, emoji) => {
    await reactToMessage(message.id, emoji);
  };

  const handleEdit = async (message) => {
    const nextContent = window.prompt('Edit message', message.content || '');
    if (nextContent === null) return;
    await editMessage(message.id, nextContent.trim());
  };

  const handleDelete = async (message) => {
    const confirmed = window.confirm('Delete this message for everyone?');
    if (!confirmed) return;
    await deleteMessage(message.id);
  };

  const handleSendMessage = async (payload) => {
    const response = await sendMessage({ ...payload, replyToId: replyingToMessage?.id || payload.replyToId });
    if (replyingToMessage) {
      setReplyingToMessage(null);
    }
    return response;
  };

  const handleBlockUser = async (chat) => {
    const peer = (chat?.members || []).find((member) => Number(member.id) !== Number(user?.id));
    if (!peer?.id) return;

    const confirmed = window.confirm(`Block ${peer.fullName || peer.username}? You will no longer be able to chat with them.`);
    if (!confirmed) return;

    try {
      await api.post(`/users/block/${peer.id}`);
      toast.success('User blocked');
      await refreshChats();
      setChats((current) => current.filter((entry) => Number(entry.id) !== Number(chat.id)));
      if (Number(activeChat?.id) === Number(chat.id)) {
        selectChat(null);
        navigate('/chats', { replace: true });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to block user');
    }
  };

  useEffect(() => {
    if (!chatIdParam) return;

    const matchingChat = chats.find((chat) => Number(chat.id) === chatIdParam);
    if (matchingChat && Number(selectedChat?.id) !== chatIdParam) {
      setReplyingToMessage(null);
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
    <div className="chat-shell grid min-h-[100dvh] h-[100dvh] w-full grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[320px_1fr]">
      {!isMobile ? (
        <>
          <div className="hidden lg:block">
            <ChatSidebar chats={chats} users={users} selectedChat={activeChat} onSelect={handleSelectChat} onlineUsers={onlineUsers} currentUserId={user?.id} loading={loadingChats} loadingUsers={loadingUsers} onStartDirect={handleStartDirectChat} />
          </div>

          <div className="relative hidden h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden lg:flex">
            <ChatHeader chat={activeChat} onlineUsers={onlineUsers} currentUserId={user?.id} onBlockUser={handleBlockUser} />
            {typingText ? <TypingIndicator names={typingMembers.map((m) => m.fullName || m.username)} /> : null}

            <div className="relative mx-4 mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/5 bg-[rgba(15,15,15,0.55)] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <div ref={scrollRef} className="chat-background flex min-h-0 flex-1 flex-col overflow-y-auto p-4 wa-scroll">
                {activeChat ? (
                  <div className="flex flex-1 flex-col gap-2">
                    {loadingMessages ? <LoadingScreen label="Loading messages" /> : <MessageList messages={messages} currentUserId={user?.id} onReply={handleReply} onReact={handleReact} onEdit={handleEdit} onDelete={handleDelete} />}
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
                  onSend={handleSendMessage}
                  onTyping={startTyping}
                  onStopTyping={stopTyping}
                  replyToMessage={replyingToMessage}
                  onClearReply={handleClearReply}
                />
              </div>
            </div>
          </div>
        </>
      ) : !isChatRoute ? (
        <HomePage
          chats={chats}
          onlineUsers={onlineUsers}
          currentUserId={user?.id}
          user={user}
          logout={logout}
          onSelectChat={async (chat) => {
            selectChat(chat);
            navigate(`/chat/${chat.id}`);
          }}
          loading={loadingChats}
          storageKey="mobile-chat-list-scroll"
        />
      ) : (
        <div className="chat-shell relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--wa-bg)] text-[var(--wa-text)]">
          <ChatHeader chat={activeChat} onlineUsers={onlineUsers} currentUserId={user?.id} onBack={handleMobileBack} onBlockUser={handleBlockUser} />
          {typingText ? <TypingIndicator names={typingMembers.map((m) => m.fullName || m.username)} /> : null}

          <div className="relative mx-0 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px] border border-white/5 bg-[rgba(14,14,14,0.58)] shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl">
            <div ref={scrollRef} className="chat-background flex min-h-0 flex-1 flex-col overflow-y-auto p-3 pb-4 wa-scroll">
              <div className="flex flex-1 flex-col gap-1.5">
                {loadingMessages ? <LoadingScreen label="Loading messages" /> : <MessageList messages={messages} currentUserId={user?.id} onReply={handleReply} onReact={handleReact} onEdit={handleEdit} onDelete={handleDelete} />}
              </div>
            </div>

            <div className="chat-composer">
              <MessageComposer
                disabled={!activeChat}
                onSend={handleSendMessage}
                onTyping={startTyping}
                onStopTyping={stopTyping}
                replyToMessage={replyingToMessage}
                onClearReply={handleClearReply}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}