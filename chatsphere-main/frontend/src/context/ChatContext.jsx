import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { SOCKET_EVENTS } from '../utils/constants';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUserIds, setTypingUserIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const selectedChatRef = useRef(null);
  const chatsRef = useRef([]);
  const handledMessageIdsRef = useRef(new Set());
  const handledClientMsgIdsRef = useRef(new Set());
  const notificationCooldownRef = useRef(new Map());
  const listenersAttachedRef = useRef(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  const dedupeUsersById = useCallback((list = []) => {
    const seen = new Set();
    return list.filter((entry) => {
      const id = Number(entry?.id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, []);

  const dedupeIds = useCallback((list = []) => {
    const seen = new Set();
    return list
      .map((value) => Number(value))
      .filter((value) => value && !seen.has(value) && seen.add(value));
  }, []);

  const dedupeMessagesById = useCallback((list = []) => {
    const seen = new Set();
    return list.filter((entry) => {
      const id = Number(entry?.id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, []);

  const mergeChatsUnique = useCallback((list = []) => {
    const map = new Map();
    list.forEach((chat) => {
      const id = Number(chat?.id);
      if (!id) return;
      map.set(id, chat);
    });
    return Array.from(map.values());
  }, []);

  const sortChatsByUpdatedAt = useCallback((list = []) => (
    [...list].sort((a, b) => new Date(b.updatedAt || b.lastMessageAt || 0) - new Date(a.updatedAt || a.lastMessageAt || 0))
  ), []);

  const upsertChat = useCallback((list = [], nextChat, { prepend = false } = {}) => {
    if (!nextChat?.id) return list;
    const id = Number(nextChat.id);
    const exists = list.some((chat) => Number(chat?.id) === id);
    if (!exists) {
      return prepend ? [nextChat, ...list] : [...list, nextChat];
    }
    return list.map((chat) => (Number(chat?.id) === id ? { ...chat, ...nextChat } : chat));
  }, []);

  const applyPresenceToMember = useCallback((member, payload) => {
    if (Number(member?.id) !== Number(payload?.userId)) return member;
    return {
      ...member,
      isOnline: !!payload.isOnline,
      lastSeenAt: payload.lastSeenAt || member.lastSeenAt || null
    };
  }, []);

  const applyPresenceToChat = useCallback((chat, payload) => {
    if (!chat) return chat;
    return {
      ...chat,
      members: (chat.members || []).map((member) => applyPresenceToMember(member, payload))
    };
  }, [applyPresenceToMember]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    if (!user) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
      oscillator.onended = () => context.close();
    } catch (error) {
      console.warn('notification sound failed', error);
    }
  };

  const mergeMessageRecord = useCallback((current = [], nextMessage) => {
    if (!nextMessage?.id) return current;
    const nextId = Number(nextMessage.id);
    const exists = current.some((message) => Number(message?.id) === nextId);
    if (!exists) return [...current, nextMessage];
    return current.map((message) => (Number(message?.id) === nextId ? { ...message, ...nextMessage } : message));
  }, []);

  const patchMessagesInChat = useCallback((chatId, patcher) => {
    setMessages((current) => current.map((message) => {
      if (Number(message.chatId) !== Number(chatId)) return message;
      return patcher(message);
    }));
  }, []);

  const patchMessageById = useCallback((messageId, patcher) => {
    setMessages((current) => current.map((message) => (
      Number(message.id) === Number(messageId) ? patcher(message) : message
    )));
  }, []);

  const showBrowserNotification = (message) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      const now = Date.now();
      const lastShown = notificationCooldownRef.current.get(message.chatId) || 0;
      if (now - lastShown < 1500) return;
      notificationCooldownRef.current.set(message.chatId, now);
      const title = message.sender?.fullName || 'New message';
      const body = message.content || 'Sent a message';
      new Notification(title, {
        body,
        icon: message.sender?.avatar || undefined,
        tag: `chat-${message.chatId}`
      });
    } catch (error) {
      console.warn('browser notification failed', error);
    }
  };

  const bumpChat = (incomingMessage, unreadDelta = 0) => {
    const chatId = Number(incomingMessage.chatId);
    setChats((current) => {
      const index = current.findIndex((chat) => Number(chat.id) === chatId);
      const existing = index >= 0 ? current[index] : null;
      const timestamp = incomingMessage.createdAt || new Date().toISOString();
      const nextChat = {
        ...(existing || { id: chatId }),
        lastMessage: incomingMessage,
        lastMessageAt: timestamp,
        updatedAt: timestamp,
        updatedLabel: new Date(timestamp).toLocaleDateString(),
        unreadCount: Math.max(0, Number(existing?.unreadCount || 0) + unreadDelta)
      };
      const next = upsertChat(current, nextChat, { prepend: true });
      return sortChatsByUpdatedAt(mergeChatsUnique(next));
    });
  };

  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const { data } = await api.get('/chats');
      const normalized = (data.chats || []).map((chat) => ({ ...chat, unreadCount: Number(chat.unreadCount || 0) }));
      setChats(sortChatsByUpdatedAt(mergeChatsUnique(normalized)));
    } catch (err) {
      console.warn('failed to reload chats', err);
    } finally {
      setLoadingChats(false);
    }
  }, [mergeChatsUnique, sortChatsByUpdatedAt]);

  const markChatSeen = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      await api.patch(`/messages/${chatId}/seen`, { chatId });
    } catch (error) {
      console.warn('failed to mark chat seen', error?.message || error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get('/users');
      setUsers(dedupeUsersById(data.users || []));
    } catch (err) {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [dedupeUsersById]);

  const handleIncomingMessage = async (message, options = {}) => {
    // If server message already handled by id, skip
    if (!message) return;
    if (message.id && handledMessageIdsRef.current.has(message.id)) return;

    // If it's an ack/replay for a client-generated message, replace the temp message
    if (message.clientMsgId && handledClientMsgIdsRef.current.has(message.clientMsgId)) {
      // replace temp message with server-assigned id
      setMessages((current) => current.map((m) => (m.clientMsgId === message.clientMsgId ? { ...m, ...message, id: message.id } : m)));
      if (message.id) handledMessageIdsRef.current.add(message.id);
      handledClientMsgIdsRef.current.delete(message.clientMsgId);
      return;
    }

    if (message.id) handledMessageIdsRef.current.add(message.id);
    console.log('[socket][receive_message] NEW MESSAGE:', message);

    const currentChatId = selectedChatRef.current?.id ? Number(selectedChatRef.current.id) : null;
    const incomingChatId = Number(message.chatId);
    const isOwnMessage = Number(message.senderId) === Number(user?.id);
    const isActiveChat = currentChatId === incomingChatId;

    // Always update sidebar (last message, timestamp, move to top)
    bumpChat(message, !isOwnMessage && !isActiveChat ? 1 : 0);

    // If the chat doesn't exist locally, refresh chats from server
    const exists = chatsRef.current.some((c) => Number(c.id) === incomingChatId);
    if (!exists) {
      // fetch latest chats in background
      loadChats();
    }

    // If active chat, append to messages
    if (isActiveChat) {
      setMessages((current) => {
        const next = current.map((entry) => {
          if (message.clientMsgId && entry.clientMsgId === message.clientMsgId) {
            return { ...entry, ...message, id: message.id };
          }
          if (entry.id && message.id && Number(entry.id) === Number(message.id)) {
            return { ...entry, ...message };
          }
          return entry;
        });
        if (next.some((entry) => Number(entry.id) === Number(message.id))) return next;
        return [...next, message];
      });
    } else if (!isOwnMessage) {
      // not active, notify user
      setNotifications((current) => [{ id: message.id, message, read: false }, ...current]);
      playNotificationSound();
      showBrowserNotification(message);
    }

    if (options.forceNotify && !isActiveChat && !isOwnMessage) {
      setNotifications((current) => [{ id: message.id, message, read: false }, ...current]);
    }
  };

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    const token = localStorage.getItem('chatsphere_token') || localStorage.getItem('token');
    if (token) {
      socket.auth = { token };
    }
    if (!socket.connected) {
      socket.connect();
    }

    if (listenersAttachedRef.current) return;
    listenersAttachedRef.current = true;

    const handleOnlineUsers = (payload) => setOnlineUsers(dedupeIds(payload || []));
    const handleTyping = ({ chatId, userId }) => {
      if (selectedChatRef.current?.id === chatId && userId !== user.id) {
        setTypingUserIds((current) => Array.from(new Set([...current, userId])));
      }
    };
    const handleStopTyping = ({ chatId, userId }) => {
      if (selectedChatRef.current?.id === chatId) {
        setTypingUserIds((current) => current.filter((id) => id !== userId));
      }
    };
    const handleReceiveMessage = (message) => handleIncomingMessage(message);
    const handleSendMessage = (message) => handleIncomingMessage(message);
    const handleMessageReceived = (message) => handleIncomingMessage(message);
    const handleMessageUpdated = (message) => handleIncomingMessage(message);
    const handleNewMessageNotification = (payload) => {
      if (payload?.message) handleIncomingMessage(payload.message, { forceNotify: true });
    };
    const handleSidebarUpdate = (payload) => {
      if (payload?.message) bumpChat(payload.message, 0);
    };
    const handleMessageDelivered = (payload) => {
      if (!payload) return;
      const chatId = Number(payload.chatId || payload.message?.chatId);
      const messageId = payload.messageId || payload.message?.id || null;
      const deliveredAt = payload.deliveredAt || new Date().toISOString();
      if (messageId) {
        patchMessageById(messageId, (message) => ({ ...message, status: 'delivered', deliveredAt }));
      } else if (chatId) {
        patchMessagesInChat(chatId, (message) => (
          Number(message.senderId) === Number(user?.id)
            ? { ...message, status: 'delivered', deliveredAt }
            : message
        ));
      }
    };
    const handleMessageSeen = (payload) => {
      if (!payload) return;
      const chatId = Number(payload.chatId || payload.message?.chatId);
      const seenAt = payload.seenAt || new Date().toISOString();
      patchMessagesInChat(chatId, (message) => (
        Number(message.senderId) === Number(user?.id)
          ? { ...message, status: 'seen', seenAt }
          : message
      ));
    };
    const handleMessageEdited = (payload) => {
      if (!payload?.id) return;
      patchMessageById(payload.id, (message) => ({ ...message, ...payload }));
    };
    const handleMessageDeleted = (payload) => {
      if (!payload?.id) return;
      patchMessageById(payload.id, (message) => ({
        ...message,
        ...payload,
        content: payload.deletedForEveryone ? 'This message was deleted' : message.content
      }));
    };
    const handleMessageReaction = (payload) => {
      if (!payload?.messageId) return;
      patchMessageById(payload.messageId, (message) => {
        const reactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
        const adjustReaction = (emoji, delta) => {
          const index = reactions.findIndex((reaction) => reaction.emoji === emoji);
          if (index < 0) {
            if (delta > 0) reactions.push({ emoji, count: delta });
            return;
          }
          const nextCount = Number(reactions[index].count || 1) + delta;
          if (nextCount <= 0) {
            reactions.splice(index, 1);
            return;
          }
          reactions[index] = { ...reactions[index], count: nextCount };
        };
        if (payload.removed) {
          adjustReaction(payload.emoji, -1);
          return { ...message, reactions };
        }
        if (payload.previousEmoji && payload.previousEmoji !== payload.emoji) {
          adjustReaction(payload.previousEmoji, -1);
        }
        adjustReaction(payload.emoji, 1);
        return { ...message, reactions };
      });
    };
    const handleAccountStatusChange = (payload) => {
      const blockedUserId = Number(payload?.userId);
      if (!blockedUserId || blockedUserId === Number(user?.id)) return;

      if (payload?.status !== 'blocked') return;

      setUsers((current) => current.filter((entry) => Number(entry.id) !== blockedUserId));
      setOnlineUsers((current) => current.filter((entryId) => Number(entryId) !== blockedUserId));
      setChats((current) => {
        const next = current
          .map((chat) => {
            const nextMembers = (chat.members || []).filter((member) => Number(member.id) !== blockedUserId && (Number(member.id) === Number(user?.id) || member.status === 'approved'));
            if (!chat.isGroup && nextMembers.length < 2) return null;
            if (chat.isGroup && nextMembers.length < 2) return null;
            return { ...chat, members: nextMembers };
          })
          .filter(Boolean);
        return sortChatsByUpdatedAt(mergeChatsUnique(next));
      });

      const activeChat = selectedChatRef.current;
      if (activeChat && (activeChat.members || []).some((member) => Number(member.id) === blockedUserId)) {
        setSelectedChat(null);
        setMessages([]);
      }
    };
    const handleUserPresence = (payload) => {
      if (!payload?.userId) return;
      const next = {
        userId: Number(payload.userId),
        isOnline: payload.type !== 'offline',
        lastSeenAt: payload.lastSeenAt || null
      };

      setOnlineUsers((current) => {
        const hasUser = current.includes(next.userId);
        if (next.isOnline) {
          return hasUser ? current : [...current, next.userId];
        }
        return current.filter((value) => value !== next.userId);
      });

      setUsers((current) => current.map((entry) => applyPresenceToMember(entry, next)));
      setChats((current) => current.map((chat) => applyPresenceToChat(chat, next)));
      setSelectedChat((current) => applyPresenceToChat(current, next));
    };
    const handleUserApproved = (payload) => {
      const userPayload = payload?.user || payload;
      if (!userPayload || Number(userPayload.id) === Number(user?.id)) return;

      // Merge into users list (deduped)
      setUsers((current) => {
        const next = [userPayload, ...current.filter((u) => Number(u.id) !== Number(userPayload.id))];
        return dedupeUsersById(next);
      });

      // If any existing direct chat involves this user, update chat members
      setChats((current) => current.map((chat) => {
        if (!chat || !chat.members) return chat;
        const hasMember = (chat.members || []).some((m) => Number(m.id) === Number(userPayload.id));
        if (!hasMember) return chat;
        return { ...chat, members: (chat.members || []).map((m) => (Number(m.id) === Number(userPayload.id) ? { ...m, ...userPayload } : m)) };
      }));
    };
    const handleUnreadCountUpdate = (payload) => {
      if (!payload?.chatId) return;
      setChats((current) => sortChatsByUpdatedAt(mergeChatsUnique(current.map((chat) => {
        if (Number(chat.id) !== Number(payload.chatId)) return chat;
        // If server sends an absolute unread count, prefer it over delta.
        if (typeof payload.unreadCount === 'number') {
          return { ...chat, unreadCount: Math.max(0, Number(payload.unreadCount)) };
        }
        return chat;
      }))));
    };

    socket.off(SOCKET_EVENTS.ONLINE_USERS);
    socket.off(SOCKET_EVENTS.TYPING);
    socket.off(SOCKET_EVENTS.STOP_TYPING);
    socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
    socket.off(SOCKET_EVENTS.SEND_MESSAGE);
    socket.off(SOCKET_EVENTS.MESSAGE_RECEIVED);
    socket.off(SOCKET_EVENTS.MESSAGE_UPDATED);
    socket.off(SOCKET_EVENTS.NEW_MESSAGE_NOTIFICATION);
    socket.off(SOCKET_EVENTS.SIDEBAR_UPDATE);
    socket.off(SOCKET_EVENTS.UNREAD_COUNT_UPDATE);
    socket.off('message:sent');
    socket.off('message:delivered');
    socket.off('message:seen');
    socket.off('message:edited');
    socket.off('message:deleted');
    socket.off('message:reaction');
    socket.off('account:status-changed');
    socket.off('user:online');
    socket.off('user:offline');
    socket.off('user:approved');
    socket.off('user:status-updated');

    socket.on(SOCKET_EVENTS.ONLINE_USERS, handleOnlineUsers);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    socket.on(SOCKET_EVENTS.STOP_TYPING, handleStopTyping);
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, handleSendMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(SOCKET_EVENTS.NEW_MESSAGE_NOTIFICATION, handleNewMessageNotification);
    socket.on(SOCKET_EVENTS.SIDEBAR_UPDATE, handleSidebarUpdate);
    socket.on(SOCKET_EVENTS.UNREAD_COUNT_UPDATE, handleUnreadCountUpdate);
    socket.on('message:sent', handleIncomingMessage);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('message:seen', handleMessageSeen);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:reaction', handleMessageReaction);
    socket.on('account:status-changed', handleAccountStatusChange);
    socket.on('user:online', (payload) => handleUserPresence({ ...payload, type: 'online' }));
    socket.on('user:offline', (payload) => handleUserPresence({ ...payload, type: 'offline' }));
    socket.on('user:approved', handleUserApproved);
    socket.on('user:status-updated', handleUserPresence);

    return () => {
      listenersAttachedRef.current = false;
      socket.off(SOCKET_EVENTS.ONLINE_USERS, handleOnlineUsers);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
      socket.off(SOCKET_EVENTS.STOP_TYPING, handleStopTyping);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SOCKET_EVENTS.SEND_MESSAGE, handleSendMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE_NOTIFICATION, handleNewMessageNotification);
      socket.off(SOCKET_EVENTS.SIDEBAR_UPDATE, handleSidebarUpdate);
      socket.off(SOCKET_EVENTS.UNREAD_COUNT_UPDATE, handleUnreadCountUpdate);
      socket.off('message:sent', handleIncomingMessage);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('message:seen', handleMessageSeen);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:reaction', handleMessageReaction);
      socket.off('account:status-changed', handleAccountStatusChange);
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('user:approved', handleUserApproved);
      socket.off('user:status-updated', handleUserPresence);
    };
  }, [user, dedupeIds, mergeChatsUnique, sortChatsByUpdatedAt]);

  useEffect(() => {
    if (!user) return;

    // reuse loadChats defined above
    loadChats();
    loadUsers();
  }, [user, loadChats, loadUsers]);

  const selectChat = async (chat) => {
    const socket = getSocket();
    console.log('[chat][selectChat]', { chatId: chat?.id || null, previousChatId: selectedChat?.id || null, socketConnected: socket.connected });
    if (selectedChat?.id && selectedChat.id !== chat?.id) {
      socket.emit(SOCKET_EVENTS.LEAVE_CHAT, { chatId: selectedChat.id });
      console.log('[chat][room] leave-chat emitted', { chatId: selectedChat.id });
    }
    setSelectedChat(chat);
    if (chat?.id) {
      setChats((current) => mergeChatsUnique(current.map((entry) => Number(entry.id) === Number(chat.id) ? { ...entry, unreadCount: 0 } : entry)));
    }
    if (!chat) return;

    socket.emit(SOCKET_EVENTS.JOIN_CHAT, { chatId: chat.id });
    console.log('[chat][room] join-chat emitted', { chatId: chat.id });

    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/messages/${chat.id}`);
      setMessages(dedupeMessagesById(data.messages || []));
      await markChatSeen(chat.id);
    } finally {
      setLoadingMessages(false);
    }
  };

  const startDirectChat = async (userId) => {
    try {
      const { data } = await api.post('/chats/direct', { userId });
      const created = data.chat;
      if (!created) return null;
      // prepend or replace existing chat preview
      setChats((current) => sortChatsByUpdatedAt(mergeChatsUnique(upsertChat(current, created, { prepend: true }))));
      // select the created chat (this will join socket room and load messages)
      await selectChat(created);
      return created;
    } catch (error) {
      console.error('startDirectChat error', error);
      return null;
    }
  };

  const sendMessage = async ({ content, files = [], replyToId }) => {
    if (!selectedChat) return null;

    // If files are present, continue to use REST multipart upload (fallback)
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('chatId', selectedChat.id);
      formData.append('content', content || '');
      if (replyToId) formData.append('replyToId', replyToId);
      files.forEach((file) => formData.append('files', file));

      const { data } = await api.post('/messages', formData, {
      });
      setMessages((current) => dedupeMessagesById([...current, data.message]));
      handledMessageIdsRef.current.add(data.message.id);
      bumpChat(data.message, 0);
      return data.message;
    }

    // Text-only: try optimistic socket send with clientMsgId
    const chatId = selectedChat.id;
    const clientMsgId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const tempMsg = {
      id: clientMsgId,
      clientMsgId,
      chatId,
      content,
      type: 'text',
      files: [],
      replyToId,
      sender: user,
      createdAt: now,
      sending: true,
    };

    setMessages((current) => [...current, tempMsg]);
    handledClientMsgIdsRef.current.add(clientMsgId);
    bumpChat(tempMsg, 0);

    const socket = getSocket();
    if (socket && socket.connected) {
      return new Promise((resolve, reject) => {
        socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { chatId, content, replyToId, clientMsgId }, (ack) => {
          if (ack && ack.ok && ack.message) {
            const serverMsg = ack.message;
            // replace temp with server msg
            setMessages((current) => current.map((m) => (m.clientMsgId === clientMsgId ? serverMsg : m)));
            if (serverMsg.id) handledMessageIdsRef.current.add(serverMsg.id);
            handledClientMsgIdsRef.current.delete(clientMsgId);
            bumpChat(serverMsg, 0);
            resolve(serverMsg);
          } else {
            // mark as failed
            setMessages((current) => current.map((m) => (m.clientMsgId === clientMsgId ? { ...m, sending: false, failed: true } : m)));
            handledClientMsgIdsRef.current.delete(clientMsgId);
            reject(new Error('Socket send failed'));
          }
        });
      });
    }

    // socket not connected: fallback to REST
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('content', content || '');
    if (replyToId) formData.append('replyToId', replyToId);
    const { data } = await api.post('/messages', formData, {
    });
    setMessages((current) => current.map((m) => (m.clientMsgId === clientMsgId ? data.message : m)));
    if (data.message?.id) handledMessageIdsRef.current.add(data.message.id);
    handledClientMsgIdsRef.current.delete(clientMsgId);
    bumpChat(data.message, 0);
    return data.message;
  };

  const editMessage = useCallback(async (messageId, content) => {
    const { data } = await api.patch(`/messages/${messageId}`, { content });
    if (data?.message) {
      handleIncomingMessage(data.message, { forceNotify: true });
    }
    return data?.message || null;
  }, [handleIncomingMessage]);

  const deleteMessage = useCallback(async (messageId) => {
    const { data } = await api.delete(`/messages/${messageId}`);
    if (data?.message) {
      handleIncomingMessage(data.message, { forceNotify: true });
    }
    return data?.message || null;
  }, [handleIncomingMessage]);

  const reactToMessage = useCallback(async (messageId, emoji) => {
    const { data } = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return data?.reaction || null;
  }, []);

  const startTyping = () => {
    const socket = getSocket();
    if (!selectedChat) return;
    const receiverIds = (selectedChat.members || [])
      .map((member) => Number(member.id))
      .filter((memberId) => memberId && memberId !== Number(user?.id));
    socket.emit(SOCKET_EVENTS.TYPING, {
      chatId: selectedChat.id,
      senderId: user?.id,
      receiverIds
    });
  };

  const stopTyping = () => {
    const socket = getSocket();
    if (!selectedChat) return;
    const receiverIds = (selectedChat.members || [])
      .map((member) => Number(member.id))
      .filter((memberId) => memberId && memberId !== Number(user?.id));
    socket.emit(SOCKET_EVENTS.STOP_TYPING, {
      chatId: selectedChat.id,
      senderId: user?.id,
      receiverIds
    });
  };

  const value = useMemo(
    () => ({
      chats,
      users,
      replyingToMessage,
      setReplyingToMessage,
      messages,
      selectedChat,
      onlineUsers,
      loadingUsers,
      typingUserIds,
      notifications,
      loadingChats,
      loadingMessages,
      selectChat,
      startDirectChat,
      setMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      reactToMessage,
      startTyping,
      stopTyping,
      setNotifications,
      setChats
    }),
    [chats, messages, selectedChat, onlineUsers, typingUserIds, notifications, loadingChats, loadingMessages, users, loadingUsers, replyingToMessage, editMessage, deleteMessage, reactToMessage]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export { ChatContext };