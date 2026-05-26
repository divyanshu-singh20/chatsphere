import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ensureSocketConnected as connectSocket, getSocket } from '../services/socket';
import {
  cleanupConnection,
  createAnswer,
  createOffer,
  createPeerConnection,
  handleIceCandidate,
  handleRemoteAnswer,
  toSerializableIceCandidate,
  stopMediaStream
} from '../services/webrtc';
import callSoundManager from '../utils/callSoundManager';
import audioManager from '../utils/audioManager';
import { useAuth } from './AuthContext';
import { useChat } from '../hooks/useChat';
import CallContext from './call-state-context';

const CALL_EVENTS = {
  OFFER: 'call:offer',
  ANSWER: 'call:answer',
  ICE: 'call:ice-candidate',
  END: 'call:end',
  REJECT: 'call:reject'
};

const initialCallState = {
  status: 'idle',
  type: null,
  chatId: null,
  peerUser: null,
  isIncoming: false,
  isMuted: false,
  isCameraOff: false,
  callId: null,
  startedAt: null,
  connectedAt: null,
  endedAt: null,
  endedReason: null
};

const createTempCallId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    avatar: user.avatar
  };
};

const buildIceCandidateKey = (candidate) => {
  if (!candidate) return '';

  return [
    candidate.candidate || '',
    candidate.sdpMid || '',
    candidate.sdpMLineIndex ?? ''
  ].join('|');
};

const vibrateSafely = (pattern) => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;

  const hasUserActivation = navigator.userActivation?.isActive || navigator.userActivation?.hasBeenActive;
  if (!hasUserActivation) return;

  navigator.vibrate(pattern);
};

export function CallProvider({ children }) {
  const { user } = useAuth();
  const { selectedChat, chats, users } = useChat();

  const [call, setCall] = useState(initialCallState);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [soundBlocked, setSoundBlocked] = useState(false);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const resettingRef = useRef(false);
  const initializedRef = useRef(false);
  const callStartedRef = useRef(false);
  const currentCallRef = useRef(initialCallState);
  const pendingOfferRef = useRef(null);
  const pendingCallIdRef = useRef(null);
  const cameraFacingRef = useRef('user');
  const seenIceCandidateKeysRef = useRef(new Set());
  const unansweredCallTimeoutRef = useRef(null);
  const disconnectRecoveryTimeoutRef = useRef(null);
  const peerRecoveryAttemptRef = useRef(0);
  const peerGenerationRef = useRef(0);
  const appliedAnswerCallIdRef = useRef(null);
  const recoverPeerConnectionRef = useRef(null);
  const acceptingCallRef = useRef(false);
  const endingCallRef = useRef(false);
  const terminalResetTimeoutRef = useRef(null);
  const usersRef = useRef(users || []);
  const chatsRef = useRef(chats || []);

  useEffect(() => {
    usersRef.current = users || [];
  }, [users]);

  useEffect(() => {
    chatsRef.current = chats || [];
  }, [chats]);

  useEffect(() => {
    currentCallRef.current = call;
  }, [call]);

  const setCallState = useCallback((updater) => {
    setCall((current) => {
      const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
      currentCallRef.current = next;
      if (current.status !== next.status) {
        console.debug('[call][state-transition]', {
          callId: next.callId || null,
          from: current.status,
          to: next.status,
          chatId: next.chatId || null,
          isIncoming: !!next.isIncoming
        });
      }
      return next;
    });
  }, []);

  const setLocalStreamSafe = useCallback((stream) => {
    if (localStreamRef.current === stream) return;

    if (localStreamRef.current && localStreamRef.current !== stream) {
      logCallLifecycle('call', 'stream-remove', {
        target: 'local',
        streamId: localStreamRef.current.id || null
      });
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    if (stream) {
      logCallLifecycle('call', 'stream-attach', {
        target: 'local',
        streamId: stream.id || null,
        audioTracks: stream.getAudioTracks?.().length || 0,
        videoTracks: stream.getVideoTracks?.().length || 0
      });
    }
  }, []);

  const setRemoteStreamSafe = useCallback((stream) => {
    if (remoteStreamRef.current === stream) return;
    const previousStreamId = remoteStreamRef.current?.id || null;

    if (remoteStreamRef.current && remoteStreamRef.current !== stream) {
      logCallLifecycle('call', 'stream-remove', {
        target: 'remote',
        streamId: previousStreamId
      });
    }

    remoteStreamRef.current = stream;
    setRemoteStream(stream);

    console.debug('[webrtc][remote-stream-replaced]', {
      previousStreamId,
      nextStreamId: stream?.id || null,
      callId: currentCallRef.current.callId || null
    });

    if (stream) {
      logCallLifecycle('call', 'stream-attach', {
        target: 'remote',
        streamId: stream.id || null,
        audioTracks: stream.getAudioTracks?.().length || 0,
        videoTracks: stream.getVideoTracks?.().length || 0
      });

      const audioTracks = stream.getAudioTracks?.() || [];
      const videoTracks = stream.getVideoTracks?.() || [];
      console.log('[webrtc] remote stream', {
        streamId: stream.id,
        active: stream.active,
        audioTracks: audioTracks.length,
        videoTracks: videoTracks.length
      });
    }
  }, []);

  const clearUnansweredCallTimeout = useCallback(() => {
    if (unansweredCallTimeoutRef.current) {
      console.debug('[timer][cleanup]', {
        timer: 'unanswered-call',
        callId: currentCallRef.current.callId || null
      });
      window.clearTimeout(unansweredCallTimeoutRef.current);
      unansweredCallTimeoutRef.current = null;
    }
  }, []);

  const clearDisconnectRecoveryTimeout = useCallback(() => {
    if (disconnectRecoveryTimeoutRef.current) {
      console.debug('[timer][cleanup]', {
        timer: 'disconnect-recovery',
        callId: currentCallRef.current.callId || null
      });
      window.clearTimeout(disconnectRecoveryTimeoutRef.current);
      disconnectRecoveryTimeoutRef.current = null;
    }
  }, []);

  const clearTerminalResetTimeout = useCallback(() => {
    if (terminalResetTimeoutRef.current) {
      console.debug('[timer][cleanup]', {
        timer: 'terminal-reset',
        callId: currentCallRef.current.callId || null
      });
      window.clearTimeout(terminalResetTimeoutRef.current);
      terminalResetTimeoutRef.current = null;
    }
  }, []);

  const logSocketEmit = useCallback((event, payload) => {
    console.debug('[socket][emit]', {
      event,
      callId: payload?.callId || null,
      chatId: payload?.chatId || null,
      targetUserId: payload?.targetUserId || null,
      type: payload?.type || null,
      hasOffer: !!payload?.offer,
      hasAnswer: !!payload?.answer,
      candidate: payload?.candidate?.candidate || null
    });
  }, []);

  const pushGlobalLog = useCallback((tag, details) => {
    try {
      const g = window;
      if (!g) return;
      g.__callLog = g.__callLog || [];
      g.__callLog.push({ ts: new Date().toISOString(), tag, details });
    } catch (err) {
      // ignore
    }
  }, []);

  const logCallLifecycle = useCallback((scope, event, details = {}) => {
    const payload = {
      callId: currentCallRef.current.callId || null,
      chatId: currentCallRef.current.chatId || null,
      ...details
    };

    console.debug(`[${scope}][${event}]`, payload);
    pushGlobalLog(`${scope}:${event}`, payload);
  }, [pushGlobalLog]);

  useEffect(() => {
    recoverPeerConnectionRef.current = null;
  }, []);

  const emitSocketEvent = useCallback((socket, event, payload, ack) => {
    logSocketEmit(event, payload);
    if (typeof ack === 'function') {
      socket.emit(event, payload, ack);
      return;
    }

    socket.emit(event, payload);
  }, [logSocketEmit]);

  const findPeerUser = useCallback((chat, currentUserId = user?.id) => {
    if (!chat) return null;

    const members = chat.members || [];
    const peer = members.find((member) => Number(member.id) !== Number(currentUserId));
    if (peer) return normalizeUser(peer);

    const peerId = members.find((member) => Number(member.id) !== Number(currentUserId))?.id;
    if (!peerId) return null;

    const fromUsers = (usersRef.current || []).find((entry) => Number(entry.id) === Number(peerId));
    return normalizeUser(fromUsers);
  }, [user?.id]);

  const getLocalStream = useCallback(async (type = 'voice') => {
    const existing = localStreamRef.current;
    if (existing) {
      const wantsVideo = type === 'video';
      const hasVideo = (existing.getVideoTracks?.() || []).length > 0;
      if (!wantsVideo || hasVideo) {
        return existing;
      }
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }

    console.debug('[media][acquire-start]', {
      callId: currentCallRef.current.callId || null,
      type,
      hasExistingStream: !!existing
    });

    const wantsVideo = type === 'video';
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: wantsVideo ? { facingMode: cameraFacingRef.current || 'user' } : false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (!callStartedRef.current) {
      console.debug('[media][acquire-release]', {
        callId: currentCallRef.current.callId || null,
        reason: 'call-stopped-before-media-ready'
      });
      stopMediaStream(stream);
      return null;
    }

    setLocalStreamSafe(stream);
    console.debug('[media][acquire-success]', {
      callId: currentCallRef.current.callId || null,
      type,
      streamId: stream.id,
      audioTracks: stream.getAudioTracks?.().length || 0,
      videoTracks: stream.getVideoTracks?.().length || 0
    });
    return stream;
  }, [setLocalStreamSafe]);

  const attachPeerState = useCallback((peer, sessionId) => {
    return {
      peer,
      sessionId,
      addLocalTracks(stream) {
        if (!peer || !stream) return;
        const existingTrackIds = new Set((peer.getSenders?.() || []).map((sender) => sender.track?.id).filter(Boolean));
        stream.getTracks().forEach((track) => {
          if (!track?.id || existingTrackIds.has(track.id)) return;
          peer.addTrack(track, stream);
          existingTrackIds.add(track.id);
        });
        console.debug('[webrtc][track-added]', {
          sessionId: sessionId || null,
          source: 'local',
          audioTracks: stream.getAudioTracks?.().length || 0,
          videoTracks: stream.getVideoTracks?.().length || 0
        });
      }
    };
  }, []);

  const flushPendingIceCandidates = useCallback(async (peer, sessionId) => {
    if (!peer || !peer.remoteDescription || pendingIceCandidatesRef.current.length === 0) {
      return;
    }

    const queued = pendingIceCandidatesRef.current;
    pendingIceCandidatesRef.current = [];

    console.debug('[webrtc] flushing queued ice candidates', {
      sessionId: sessionId || null,
      count: queued.length
    });

    for (const entry of queued) {
      const key = entry.key || buildIceCandidateKey(entry.candidate);
      if (!key || seenIceCandidateKeysRef.current.has(key)) {
        continue;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await handleIceCandidate(peer, entry.candidate, sessionId);
        seenIceCandidateKeysRef.current.add(key);
      } catch (error) {
        console.warn('[webrtc] queued ice candidate failed', {
          sessionId: sessionId || null,
          error
        });
        pendingIceCandidatesRef.current.push(entry);
      }
    }
  }, []);

  const resetCallSession = useCallback((reason = 'ended', { keepEndedState = true } = {}) => {
    if (resettingRef.current) {
      console.debug('[call][reset] already resetting - skip', { reason });
      return;
    }

    resettingRef.current = true;
    peerGenerationRef.current += 1;
    const snapshot = currentCallRef.current;

    console.debug('[call][cleanup]', {
      callId: snapshot.callId || null,
      reason,
      localStreamId: localStreamRef.current?.id || null,
      remoteStreamId: remoteStreamRef.current?.id || null,
      peerPresent: !!peerRef.current
    });
    logCallLifecycle('call', 'cleanup', {
      reason,
      peerPresent: !!peerRef.current,
      localStreamId: localStreamRef.current?.id || null,
      remoteStreamId: remoteStreamRef.current?.id || null
    });
    try { pushGlobalLog('call:cleanup-start', { callId: snapshot.callId || null, reason }); } catch (e) {}

    try {
      audioManager.resumeBackgroundAudio();
    } catch (error) {
      // ignore
    }

    try {
      callSoundManager.stopAll();
    } catch (error) {
      // ignore
    }

    clearTerminalResetTimeout();

    clearUnansweredCallTimeout();
    clearDisconnectRecoveryTimeout();

    // cleanup peer connection and media
    try {
      cleanupConnection(peerRef.current);
    } catch (err) {
      console.warn('[call][cleanup] cleanupConnection failed', { error: err?.message || err });
    }
    logCallLifecycle('call', 'peer-cleanup', {
      reason,
      callId: snapshot.callId || null
    });
    peerRef.current = null;

    stopMediaStream(localStreamRef.current);
    stopMediaStream(remoteStreamRef.current);
    if (localStreamRef.current || remoteStreamRef.current) {
      logCallLifecycle('call', 'stream-remove', {
        target: 'both',
        localStreamId: localStreamRef.current?.id || null,
        remoteStreamId: remoteStreamRef.current?.id || null
      });
    }
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    pendingIceCandidatesRef.current = [];
    seenIceCandidateKeysRef.current.clear();
    pendingOfferRef.current = null;
    pendingCallIdRef.current = null;
    appliedAnswerCallIdRef.current = null;
    peerRecoveryAttemptRef.current = 0;
    cameraFacingRef.current = 'user';
    callStartedRef.current = false;
    acceptingCallRef.current = false;
    endingCallRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);
    setCallDurationSeconds(0);
    setSoundBlocked(false);

    console.debug('[call][reset]', {
      callId: snapshot.callId || null,
      reason,
      keepEndedState
    });
    logCallLifecycle('call', 'reset', {
      reason,
      keepEndedState
    });
    try { pushGlobalLog('call:reset', { callId: snapshot.callId || null, reason, keepEndedState }); } catch (e) {}

    if (keepEndedState) {
      setCallState({
        ...initialCallState,
        status: 'ended',
        type: snapshot.type,
        chatId: snapshot.chatId,
        peerUser: snapshot.peerUser,
        isIncoming: snapshot.isIncoming,
        isMuted: false,
        isCameraOff: snapshot.isCameraOff,
        callId: snapshot.callId,
        startedAt: snapshot.startedAt,
        connectedAt: snapshot.connectedAt,
        endedAt: new Date().toISOString(),
        endedReason: reason
      });
    } else {
      // update React state so UI resets to idle
      setCallState(initialCallState);
    }

    // finalize
    resettingRef.current = false;
  }, [clearDisconnectRecoveryTimeout, clearTerminalResetTimeout, clearUnansweredCallTimeout, setCallState]);

  const settleTerminalCall = useCallback((reason = 'ended') => {
    const normalizedReason = typeof reason === 'string' && reason.trim() ? reason : 'ended';

    clearTerminalResetTimeout();
    resetCallSession(normalizedReason, { keepEndedState: true });

    terminalResetTimeoutRef.current = window.setTimeout(() => {
      terminalResetTimeoutRef.current = null;
      resetCallSession(normalizedReason, { keepEndedState: false });
    }, 1200);
  }, [clearTerminalResetTimeout, resetCallSession]);

  const markConnected = useCallback(() => {
    setCallState((current) => {
      if (current.status === 'ended' || current.status === 'idle') {
        return current;
      }

      return {
        ...current,
        status: 'connected',
        connectedAt: current.connectedAt || new Date().toISOString()
      };
    });

    try {
      callSoundManager.stopAll();
    } catch (error) {
      // ignore
    }
  }, [setCallState]);

  const handlePeerStateChange = useCallback((state, sessionId) => {
    if (!callStartedRef.current) return;

    console.debug('[webrtc][state]', {
      sessionId: sessionId || null,
      connectionState: state.connectionState,
      iceConnectionState: state.iceConnectionState,
      signalingState: state.signalingState
    });

    if (state.connectionState === 'connected' || state.connectionState === 'completed') {
      clearDisconnectRecoveryTimeout();
      markConnected();
      return;
    }

    if (state.connectionState === 'disconnected') {
      console.warn('[webrtc][connection-disconnected]', {
        sessionId: sessionId || null,
        callId: currentCallRef.current.callId || null,
        chatId: currentCallRef.current.chatId || null
      });

      setCallState((current) => (
        current.status === 'ended' || current.status === 'idle'
          ? current
          : { ...current, status: 'connecting' }
      ));

      clearDisconnectRecoveryTimeout();
      const peerGeneration = peerGenerationRef.current;
      disconnectRecoveryTimeoutRef.current = window.setTimeout(() => {
        if (!callStartedRef.current) return;
        if (peerGenerationRef.current !== peerGeneration) return;

        console.warn('[webrtc][disconnect-timeout]', {
          sessionId: sessionId || null,
          callId: currentCallRef.current.callId || null
        });

        resetCallSession('disconnect-timeout');
      }, 12000);

      return;
    }

    if (state.connectionState === 'connecting' || state.iceConnectionState === 'checking') {
      setCallState((current) => (
        current.status === 'ended' || current.status === 'idle'
          ? current
          : { ...current, status: 'connecting' }
      ));
      return;
    }

    if (state.connectionState === 'failed' || state.connectionState === 'closed') {
      clearDisconnectRecoveryTimeout();
      const recoveryPromise = recoverPeerConnectionRef.current?.(sessionId, state.connectionState);
      if (recoveryPromise?.then) {
        recoveryPromise.then((recovered) => {
          if (!recovered) {
            resetCallSession('connection-lost');
          }
        }).catch((error) => {
          console.warn('[webrtc][recover] failed', { error: error?.message || error });
          resetCallSession('connection-lost');
        });
      } else {
        resetCallSession('connection-lost');
      }
      return;
    }
  }, [clearDisconnectRecoveryTimeout, markConnected, resetCallSession, setCallState]);

  const ensurePeerConnection = useCallback((sessionId) => {
    const existingPeer = peerRef.current;
    if (existingPeer) {
      const connectionState = existingPeer.connectionState || 'new';
      const iceConnectionState = existingPeer.iceConnectionState || 'new';

      if (connectionState !== 'closed' && connectionState !== 'failed' && iceConnectionState !== 'closed') {
        return existingPeer;
      }

      console.warn('[webrtc][peer-recreated]', {
        sessionId: sessionId || null,
        connectionState,
        iceConnectionState
      });

      cleanupConnection(existingPeer);
      peerRef.current = null;
    }

    const socket = getSocket();

    const peer = createPeerConnection({
      sessionId,
      onIceCandidate: (candidate) => {
        const targetUserId = Number(currentCallRef.current.peerUser?.id);
        if (!targetUserId || !candidate) return;

        const callId = pendingCallIdRef.current || currentCallRef.current.callId || null;
        emitSocketEvent(socket, CALL_EVENTS.ICE, {
          targetUserId,
          candidate: toSerializableIceCandidate(candidate),
          chatId: currentCallRef.current.chatId || null,
          callId
        });
      },
      onTrack: (stream) => {
        if (!stream) return;
        setRemoteStreamSafe(stream);
      },
      onStateChange: (state) => handlePeerStateChange(state, sessionId)
    });

    peerGenerationRef.current += 1;
    peerRef.current = peer;
    logCallLifecycle('call', 'peer-create', {
      sessionId: sessionId || null,
      connectionState: peer.connectionState || null,
      iceConnectionState: peer.iceConnectionState || null
    });
    return peer;
  }, [handlePeerStateChange, setRemoteStreamSafe]);

  const recoverPeerConnection = useCallback(async (sessionId, reason = 'reconnect') => {
    if (!callStartedRef.current) return false;
    if (peerRecoveryAttemptRef.current > 0) return false;
    if (!localStreamRef.current || !currentCallRef.current.peerUser) return false;

    peerRecoveryAttemptRef.current += 1;
    const current = currentCallRef.current;
    const targetUserId = Number(current.peerUser?.id);

    console.warn('[webrtc][recover]', {
      sessionId: sessionId || null,
      reason,
      callId: current.callId || null,
      targetUserId: targetUserId || null
    });
    logCallLifecycle('call', 'recover', {
      reason,
      sessionId: sessionId || null,
      targetUserId: targetUserId || null
    });

    if (peerRef.current) {
      try {
        cleanupConnection(peerRef.current);
      } catch (error) {
        console.warn('[webrtc][recover] cleanup failed', { error: error?.message || error });
      }
    }
    peerRef.current = null;

    const peer = ensurePeerConnection(sessionId || current.callId || pendingCallIdRef.current || createTempCallId());
    const peerHandle = attachPeerState(peer, sessionId || current.callId || pendingCallIdRef.current || null);
    peerHandle.addLocalTracks(localStreamRef.current);

    if (targetUserId) {
      const socket = connectSocket(localStorage.getItem('chatsphere_token') || localStorage.getItem('token'));
      if (typeof peer.restartIce === 'function') {
        try {
          peer.restartIce();
        } catch (error) {
          console.warn('[webrtc][recover] restartIce failed', { error: error?.message || error });
        }
      }

      const offer = await createOffer(peer, sessionId || current.callId || null, { iceRestart: true });
      emitSocketEvent(socket, CALL_EVENTS.OFFER, {
        targetUserId,
        chatId: current.chatId || null,
        type: current.type || 'voice',
        offer,
        callId: current.callId || pendingCallIdRef.current || sessionId || null,
        renegotiate: true
      });

      return true;
    }

    return false;
  }, [attachPeerState, ensurePeerConnection, emitSocketEvent]);

  useEffect(() => {
    recoverPeerConnectionRef.current = recoverPeerConnection;
  }, [recoverPeerConnection]);

  const endCall = useCallback((reason = 'ended') => {
    if (!callStartedRef.current) return;
    if (endingCallRef.current) return;

    endingCallRef.current = true;

    const normalizedReason = typeof reason === 'string' && reason.trim() ? reason : 'ended';

    const current = currentCallRef.current;
    const socket = connectSocket(localStorage.getItem('chatsphere_token') || localStorage.getItem('token'));
    const targetUserId = Number(current.peerUser?.id);

    console.debug('[call][end]', {
      callId: current.callId || null,
      from: user?.id || null,
      to: targetUserId || null,
      reason: normalizedReason
    });
    try { pushGlobalLog('call:end', { callId: current.callId || null, from: user?.id || null, to: targetUserId || null, reason: normalizedReason }); } catch (e) {}

    if (targetUserId) {
      emitSocketEvent(socket, CALL_EVENTS.END, {
        targetUserId,
        chatId: current.chatId || null,
        callId: pendingCallIdRef.current || current.callId || null,
        reason: normalizedReason
      });
    }

    callSoundManager.stopAll();
    settleTerminalCall(normalizedReason);
  }, [emitSocketEvent, settleTerminalCall]);

  const startCall = useCallback(async ({ chat = null, type = 'voice' } = {}) => {
    const activeChat = chat || selectedChat;
    if (!user || !activeChat) {
      toast.error('Select a chat to call');
      return;
    }

    if (callStartedRef.current) {
      toast.error('Call already active');
      return;
    }

    clearTerminalResetTimeout();

    const peerUser = normalizeUser(findPeerUser(activeChat, user.id));
    if (!peerUser) {
      toast.error('No recipient found');
      return;
    }

    callStartedRef.current = true;
    const sessionId = createTempCallId();
    pendingCallIdRef.current = sessionId;

    setCallState({
      ...initialCallState,
      status: 'calling',
      type,
      chatId: activeChat.id,
      peerUser,
      isIncoming: false,
      isMuted: false,
      isCameraOff: type !== 'video',
      callId: sessionId,
      startedAt: new Date().toISOString(),
      connectedAt: null,
      endedAt: null,
      endedReason: null
    });

    try {
      audioManager.pauseBackgroundAudio();
    } catch (error) {
      // ignore
    }

    const socket = connectSocket(localStorage.getItem('chatsphere_token') || localStorage.getItem('token'));

    try {
      const soundReady = await callSoundManager.unlock();
      setSoundBlocked(!soundReady);

      const stream = await getLocalStream(type);
      if (!stream) {
        throw new Error('Unable to access the microphone');
      }

      const peer = ensurePeerConnection(sessionId);
      const peerHandle = attachPeerState(peer, sessionId);
      peerHandle.addLocalTracks(stream);

      const offer = await createOffer(peer, sessionId);
      const callPayload = {
        targetUserId: peerUser.id,
        chatId: activeChat.id,
        type,
        offer,
        callId: sessionId
      };

      logCallLifecycle('call', 'offer', {
        sessionId,
        targetUserId: peerUser.id,
        direction: 'outgoing'
      });

      emitSocketEvent(socket, CALL_EVENTS.OFFER, callPayload, (ack) => {
        if (ack?.callId) {
          pendingCallIdRef.current = ack.callId;
          setCallState((current) => ({ ...current, callId: ack.callId }));
        }

        if (ack && ack.ok === false) {
          toast.error(ack.error || 'Unable to place call');
          resetCallSession('failed', { keepEndedState: false });
        }
      });

      clearUnansweredCallTimeout();
      unansweredCallTimeoutRef.current = window.setTimeout(() => {
        const activeCall = currentCallRef.current;
        if (activeCall.callId !== sessionId) return;
        if (activeCall.status !== 'calling') return;

        console.warn('[webrtc][timeout]', {
          callId: sessionId,
          chatId: activeCall.chatId || null,
          targetUserId: activeCall.peerUser?.id || null
        });

        endCall('missed');
      }, 45000);
    } catch (error) {
      console.error('startCall failed', error);
      toast.error(error?.message || 'Unable to start call');
      resetCallSession('failed', { keepEndedState: false });
    }
  }, [attachPeerState, clearTerminalResetTimeout, clearUnansweredCallTimeout, ensurePeerConnection, emitSocketEvent, endCall, findPeerUser, getLocalStream, resetCallSession, selectedChat, setCallState, setSoundBlocked, user]);

  const acceptCall = useCallback(async () => {
    if (!callStartedRef.current) return;
    if (acceptingCallRef.current) return;
    if (!pendingOfferRef.current || !currentCallRef.current.peerUser) {
      return;
    }

    if (currentCallRef.current.status !== 'ringing' && currentCallRef.current.status !== 'calling') {
      return;
    }

    const sessionId = currentCallRef.current.callId || pendingCallIdRef.current || createTempCallId();
    pendingCallIdRef.current = sessionId;
    acceptingCallRef.current = true;

    clearTerminalResetTimeout();
    callSoundManager.stopAll();

    console.debug('[webrtc][offer-received]', {
      callId: sessionId,
      chatId: currentCallRef.current.chatId || null,
      fromUserId: currentCallRef.current.peerUser?.id || null,
      type: currentCallRef.current.type || null
    });

    try {
      audioManager.pauseBackgroundAudio();
    } catch (error) {
      // ignore
    }

    const socket = connectSocket(localStorage.getItem('chatsphere_token') || localStorage.getItem('token'));

    try {
      const soundReady = await callSoundManager.unlock();
      setSoundBlocked(!soundReady);

      const stream = await getLocalStream(currentCallRef.current.type || 'voice');
      if (!stream) {
        throw new Error('Unable to access the microphone');
      }

      const peer = ensurePeerConnection(sessionId);
      const peerHandle = attachPeerState(peer, sessionId);
      peerHandle.addLocalTracks(stream);

      await peer.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      console.debug('[webrtc][remote-description-set]', {
        sessionId,
        descriptionType: 'offer'
      });
      await flushPendingIceCandidates(peer, sessionId);

      setCallState((current) => ({
        ...current,
        status: 'connecting',
        callId: sessionId,
        connectedAt: current.connectedAt || null
      }));

      const answer = await createAnswer(peer, sessionId);

      logCallLifecycle('call', 'answer', {
        sessionId,
        targetUserId: currentCallRef.current.peerUser.id,
        direction: 'outgoing'
      });

      emitSocketEvent(socket, CALL_EVENTS.ANSWER, {
        targetUserId: currentCallRef.current.peerUser.id,
        chatId: currentCallRef.current.chatId,
        answer,
        callId: sessionId
      });

      markConnected();
      console.debug('[webrtc][answer-emitted]', {
        callId: sessionId,
        chatId: currentCallRef.current.chatId || null,
        targetUserId: currentCallRef.current.peerUser.id,
        answerType: answer?.type || null,
        answerSdpLength: answer?.sdp?.length || 0
      });
    } catch (error) {
      console.error('acceptCall failed', error);

      const mediaBusy = error?.name === 'NotReadableError' || error?.name === 'NotAllowedError';
      if (currentCallRef.current.peerUser) {
        const socket = connectSocket(localStorage.getItem('chatsphere_token') || localStorage.getItem('token'));
        emitSocketEvent(socket, CALL_EVENTS.REJECT, {
          targetUserId: currentCallRef.current.peerUser.id,
          chatId: currentCallRef.current.chatId || null,
          callId: pendingCallIdRef.current || currentCallRef.current.callId || null,
          reason: mediaBusy ? 'device-busy' : 'media-failed'
        });
      }

      toast.error(mediaBusy ? 'Camera or microphone is busy' : (error?.message || 'Unable to answer call'));
      resetCallSession('failed', { keepEndedState: false });
    } finally {
      acceptingCallRef.current = false;
    }
  }, [attachPeerState, clearTerminalResetTimeout, ensurePeerConnection, emitSocketEvent, flushPendingIceCandidates, getLocalStream, markConnected, resetCallSession, setCallState, setSoundBlocked]);

  const rejectCall = useCallback((reason = 'rejected') => {
    if (!callStartedRef.current) return;
    if (endingCallRef.current) return;

    endingCallRef.current = true;

    const normalizedReason = typeof reason === 'string' && reason.trim() ? reason : 'rejected';

    const current = currentCallRef.current;
    const socket = connectSocket(localStorage.getItem('chatsphere_token') || localStorage.getItem('token'));
    const targetUserId = Number(current.peerUser?.id);

    if (targetUserId) {
      emitSocketEvent(socket, CALL_EVENTS.REJECT, {
        targetUserId,
        chatId: current.chatId || null,
        callId: pendingCallIdRef.current || current.callId || null,
        reason: normalizedReason
      });
    }

    if (normalizedReason === 'missed') {
      toast.error('Missed call');
    }

    callSoundManager.stopAll();
    resetCallSession(normalizedReason, { keepEndedState: false });
  }, [emitSocketEvent, resetCallSession]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;

    const nextMuted = !currentCallRef.current.isMuted;
    audioTracks.forEach((track) => {
      track.enabled = !nextMuted;
    });

    logCallLifecycle('call', 'media-toggle', {
      kind: 'audio',
      enabled: !nextMuted,
      streamId: stream.id || null
    });

    setCallState((current) => ({
      ...current,
      isMuted: nextMuted
    }));
  }, [setCallState]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (currentCallRef.current.type !== 'video') {
      toast.error('Camera controls are available in video calls only');
      return;
    }

    const videoTracks = stream.getVideoTracks();
    if (!videoTracks.length) {
      toast.error('No camera');
      return;
    }

    const nextCameraOff = !currentCallRef.current.isCameraOff;
    videoTracks.forEach((track) => {
      track.enabled = !nextCameraOff;
    });

    logCallLifecycle('call', 'media-toggle', {
      kind: 'video',
      enabled: !nextCameraOff,
      streamId: stream.id || null
    });

    setCallState((current) => ({
      ...current,
      isCameraOff: nextCameraOff
    }));
  }, [setCallState]);

  const switchCamera = useCallback(async () => {
    if (currentCallRef.current.type !== 'video') {
      toast.error('Camera switch is available in video calls only');
      return;
    }

    const peer = peerRef.current;
    const currentStream = localStreamRef.current;
    const currentVideoTrack = currentStream?.getVideoTracks?.()?.[0];
    const videoSender = peer?.getSenders?.().find((sender) => sender.track?.kind === 'video');

    if (!peer || !currentStream || !currentVideoTrack || !videoSender) {
      toast.error('No active video track');
      return;
    }

    const nextFacingMode = cameraFacingRef.current === 'user' ? 'environment' : 'user';

    try {
      const nextVideoStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: nextFacingMode }
      });

      const nextVideoTrack = nextVideoStream.getVideoTracks()[0];
      if (!nextVideoTrack) {
        stopMediaStream(nextVideoStream);
        toast.error('Unable to switch camera');
        return;
      }

      await videoSender.replaceTrack(nextVideoTrack);

      const nextStream = new MediaStream([
        ...currentStream.getAudioTracks(),
        nextVideoTrack
      ]);

      cameraFacingRef.current = nextFacingMode;
      currentVideoTrack.stop();
      setLocalStreamSafe(nextStream);
      stopMediaStream(nextVideoStream);
    } catch (error) {
      console.error('switchCamera failed', error);
      toast.error('Unable to switch camera');
    }
  }, [setLocalStreamSafe]);

  const handleIncomingOffer = useCallback((payload = {}) => {
    console.debug('[socket][receive]', {
      event: CALL_EVENTS.OFFER,
      callId: payload.callId || null,
      chatId: payload.chatId || null,
      fromUserId: payload.fromUserId || null,
      type: payload.type || null,
      hasOffer: !!payload.offer
    });

    if (!payload.offer || !payload.fromUserId) return;

    const incomingCallId = payload.callId || `${payload.fromUserId}:${payload.chatId || 'na'}:${payload.type || 'voice'}`;

    const isRenegotiation = callStartedRef.current
      && currentCallRef.current.callId
      && incomingCallId === currentCallRef.current.callId
      && Number(currentCallRef.current.peerUser?.id) === Number(payload.fromUserId);

    if (isRenegotiation) {
      console.debug('[webrtc][renegotiation-offer]', {
        callId: incomingCallId,
        chatId: payload.chatId || null,
        fromUserId: payload.fromUserId || null
      });

      pendingCallIdRef.current = incomingCallId;
      pendingOfferRef.current = payload.offer;
      pendingIceCandidatesRef.current = [];
      seenIceCandidateKeysRef.current.clear();

      const peerUser = normalizeUser(payload.fromUser) || currentCallRef.current.peerUser || normalizeUser({ id: payload.fromUserId });
      setCallState((current) => ({
        ...current,
        peerUser,
        status: 'connecting',
        callId: incomingCallId,
        endedAt: null,
        endedReason: null
      }));

      Promise.resolve().then(async () => {
        const socket = getSocket();
        try {
          const peer = ensurePeerConnection(incomingCallId);
          const peerHandle = attachPeerState(peer, incomingCallId);
          const stream = localStreamRef.current || await getLocalStream(currentCallRef.current.type || payload.type || 'voice');

          if (!stream) {
            throw new Error('Unable to acquire media for renegotiation');
          }

          peerHandle.addLocalTracks(stream);
          await peer.setRemoteDescription(new RTCSessionDescription(payload.offer));
          await flushPendingIceCandidates(peer, incomingCallId);
          const answer = await createAnswer(peer, incomingCallId);
          emitSocketEvent(socket, CALL_EVENTS.ANSWER, {
            targetUserId: payload.fromUserId,
            chatId: payload.chatId || null,
            answer,
            callId: incomingCallId,
            renegotiate: true
          });
          return;
        } catch (error) {
          console.warn('[webrtc][renegotiation-failed]', { error: error?.message || error });
        }
      });

      return;
    }

    if (callStartedRef.current) {
      if (pendingCallIdRef.current === incomingCallId) {
        return;
      }

      const socket = getSocket();
      socket.emit(CALL_EVENTS.REJECT, {
        targetUserId: payload.fromUserId,
        chatId: payload.chatId || null,
        callId: currentCallRef.current.callId || incomingCallId,
        reason: 'busy'
      });
      return;
    }

    callStartedRef.current = true;
    pendingCallIdRef.current = incomingCallId;
    pendingOfferRef.current = payload.offer;
    pendingIceCandidatesRef.current = [];
    seenIceCandidateKeysRef.current.clear();
    logCallLifecycle('call', 'offer', {
      callId: incomingCallId,
      fromUserId: payload.fromUserId || null,
      type: payload.type || null
    });

    const peerUser = normalizeUser(payload.fromUser) || findPeerUser({ members: [payload.fromUser || { id: payload.fromUserId }] }, user?.id) || normalizeUser({ id: payload.fromUserId });

    setCallState({
      ...initialCallState,
      status: 'ringing',
      type: payload.type || 'voice',
      chatId: payload.chatId || null,
      peerUser,
      isIncoming: true,
      isMuted: false,
      isCameraOff: (payload.type || 'voice') !== 'video',
      callId: incomingCallId,
      startedAt: new Date().toISOString(),
      connectedAt: null,
      endedAt: null,
      endedReason: null
    });

    callSoundManager.playRingtone().then((played) => setSoundBlocked(!played)).catch(() => {});
    vibrateSafely([300, 200, 300]);
  }, [attachPeerState, createAnswer, ensurePeerConnection, emitSocketEvent, findPeerUser, flushPendingIceCandidates, getLocalStream, setCallState, user?.id]);

  const handleIncomingAnswer = useCallback(async (payload = {}) => {
    const answerCallId = payload.callId || currentCallRef.current.callId || pendingCallIdRef.current || null;

    console.debug('[socket][receive]', {
      event: CALL_EVENTS.ANSWER,
      callId: answerCallId,
      chatId: payload.chatId || null,
      hasAnswer: !!payload.answer,
      answerType: payload.answer?.type || null
    });

    if (!payload?.answer) return;
    if (!callStartedRef.current) return;
    if (answerCallId && appliedAnswerCallIdRef.current === answerCallId) {
      console.debug('[webrtc][duplicate-answer-ignored]', {
        callId: answerCallId,
        chatId: payload.chatId || null
      });
      clearUnansweredCallTimeout();
      return;
    }

    console.debug('[webrtc][answer-received]', {
      callId: answerCallId,
      chatId: payload.chatId || null,
      answerType: payload.answer?.type || null,
      answerSdpLength: payload.answer?.sdp?.length || 0
    });

    const peer = peerRef.current;
    if (!peer) {
      console.warn('[webrtc] answer received before peer exists', {
        callId: payload.callId || null
      });
      return;
    }

    if (peer.remoteDescription?.type === 'answer') {
      console.warn('[webrtc][duplicate-answer-ignored]', {
        callId: payload.callId || null,
        chatId: payload.chatId || null
      });
      clearUnansweredCallTimeout();
      return;
    }

    try {
      appliedAnswerCallIdRef.current = answerCallId;

      const applied = await handleRemoteAnswer(peer, payload.answer, answerCallId);
      if (!applied) return;

      await flushPendingIceCandidates(peer, answerCallId);
      clearUnansweredCallTimeout();
      logCallLifecycle('call', 'answer', {
        callId: answerCallId
      });

      setCallState((current) => ({
        ...current,
        status: 'connecting',
        callId: answerCallId || current.callId || pendingCallIdRef.current || null
      }));

      markConnected();
    } catch (error) {
      console.error('[webrtc] remote answer failed', error);
      resetCallSession('failed', { keepEndedState: false });
    } finally {
      if (appliedAnswerCallIdRef.current === answerCallId) {
        appliedAnswerCallIdRef.current = null;
      }
    }
  }, [clearUnansweredCallTimeout, markConnected, resetCallSession, setCallState]);

  const handleIncomingIce = useCallback(async (payload = {}) => {
    console.debug('[socket][receive]', {
      event: CALL_EVENTS.ICE,
      callId: payload.callId || null,
      chatId: payload.chatId || null,
      candidate: payload.candidate?.candidate || null
    });

    console.debug('[webrtc][ice-received]', {
      callId: payload.callId || null,
      chatId: payload.chatId || null,
      candidate: payload.candidate?.candidate || null,
      sdpMid: payload.candidate?.sdpMid ?? null,
      sdpMLineIndex: payload.candidate?.sdpMLineIndex ?? null
    });

    if (!payload?.candidate) return;

    logCallLifecycle('call', 'ice', {
      callId: payload.callId || null,
      candidate: payload.candidate?.candidate || null
    });

    const candidateKey = buildIceCandidateKey(payload.candidate);
    if (!candidateKey || seenIceCandidateKeysRef.current.has(candidateKey)) {
      return;
    }

    const peer = peerRef.current;
    const sessionId = currentCallRef.current.callId || pendingCallIdRef.current || null;

    if (!peer || !peer.remoteDescription) {
      if (!pendingIceCandidatesRef.current.some((entry) => entry.key === candidateKey)) {
        pendingIceCandidatesRef.current.push({ key: candidateKey, candidate: payload.candidate });
      }
      console.debug('[webrtc] ice candidate queued until remote description exists', {
        callId: sessionId,
        queueSize: pendingIceCandidatesRef.current.length
      });
      return;
    }

    try {
      await handleIceCandidate(peer, payload.candidate, sessionId);
      seenIceCandidateKeysRef.current.add(candidateKey);
      console.debug('[webrtc][ice-applied]', {
        callId: sessionId,
        candidate: payload.candidate?.candidate || null
      });
    } catch (error) {
      console.warn('[webrtc] addIce failed', {
        callId: sessionId,
        error
      });
      if (!pendingIceCandidatesRef.current.some((entry) => entry.key === candidateKey)) {
        pendingIceCandidatesRef.current.push({ key: candidateKey, candidate: payload.candidate });
      }
    }
  }, []);

  const handleIncomingReject = useCallback((payload = {}) => {
    console.debug('[socket][receive]', {
      event: CALL_EVENTS.REJECT,
      callId: payload.callId || null,
      chatId: payload.chatId || null,
      reason: payload.reason || null
    });

    console.debug('[call][remote-reject]', { callId: payload.callId || null, reason: payload.reason || null });
    try { pushGlobalLog('call:remote-reject', { callId: payload.callId || null, reason: payload.reason || null }); } catch (e) {}

    if (!callStartedRef.current) return;

    if (payload.callId && currentCallRef.current.callId && payload.callId !== currentCallRef.current.callId) {
      return;
    }

    if (payload.reason === 'missed') {
      toast.error('Missed call');
    } else {
      toast.error('Call rejected');
    }

    settleTerminalCall(payload.reason || 'rejected');
  }, [settleTerminalCall]);

  const handleIncomingEnd = useCallback((payload = {}) => {
    console.debug('[socket][receive]', {
      event: CALL_EVENTS.END,
      callId: payload.callId || null,
      chatId: payload.chatId || null,
      reason: payload.reason || null
    });

    console.debug('[call][remote-end]', { callId: payload.callId || null, reason: payload.reason || null });
    try { pushGlobalLog('call:remote-end', { callId: payload.callId || null, reason: payload.reason || null }); } catch (e) {}

    if (!callStartedRef.current) return;

    if (payload.callId && currentCallRef.current.callId && payload.callId !== currentCallRef.current.callId) {
      return;
    }

    settleTerminalCall(payload.reason || 'ended');
  }, [settleTerminalCall]);

  const handleSocketDisconnect = useCallback((reason) => {
    console.debug('[socket][disconnect]', {
      reason,
      callActive: callStartedRef.current,
      callId: currentCallRef.current.callId || null
    });

    if (callStartedRef.current) {
      clearDisconnectRecoveryTimeout();
      console.warn('[socket][disconnect-grace-start]', {
        reason,
        callId: currentCallRef.current.callId || null,
        timeoutMs: 12000
      });
      disconnectRecoveryTimeoutRef.current = window.setTimeout(() => {
        if (!callStartedRef.current) return;

        console.warn('[socket][disconnect-grace-end]', {
          reason,
          callId: currentCallRef.current.callId || null
        });

        resetCallSession('disconnect', { keepEndedState: false });
      }, 12000);
    }
  }, [clearDisconnectRecoveryTimeout, resetCallSession]);

  useEffect(() => {
    if (!user) {
      resetCallSession('idle', { keepEndedState: false });
      return undefined;
    }

    window.__callLog = window.__callLog || [];

    const socket = getSocket();
    const token = localStorage.getItem('chatsphere_token') || localStorage.getItem('token');
    if (token) {
      socket.auth = { token };
    }

    if (!socket.connected) {
      socket.connect();
    }

    const listeners = [
      [CALL_EVENTS.OFFER, handleIncomingOffer],
      [CALL_EVENTS.ANSWER, handleIncomingAnswer],
      [CALL_EVENTS.ICE, handleIncomingIce],
      [CALL_EVENTS.REJECT, handleIncomingReject],
      [CALL_EVENTS.END, handleIncomingEnd]
    ];

    listeners.forEach(([eventName, handler]) => {
      console.debug('[socket][listener-register]', { event: eventName });
      socket.off(eventName, handler);
      socket.on(eventName, handler);
    });

    const handleReconnect = () => {
      console.debug('[socket][reconnect-success]', { callActive: callStartedRef.current, callId: currentCallRef.current.callId || null });
      clearDisconnectRecoveryTimeout();

      if (callStartedRef.current && currentCallRef.current.status !== 'ended' && currentCallRef.current.status !== 'idle') {
        recoverPeerConnection(currentCallRef.current.callId || pendingCallIdRef.current || null, 'socket-reconnect').catch((error) => {
          console.warn('[webrtc][recover] failed', { error: error?.message || error });
        });
      }
    };

    const handleReconnectAttempt = (attempt) => {
      console.debug('[socket][reconnect-start]', {
        attempt,
        callActive: callStartedRef.current,
        callId: currentCallRef.current.callId || null
      });
    };

    const handleReconnectError = (error) => {
      console.warn('[socket][reconnect-failure]', {
        callActive: callStartedRef.current,
        callId: currentCallRef.current.callId || null,
        message: error?.message || String(error)
      });
    };

    socket.off('reconnect_attempt', handleReconnectAttempt);
    console.debug('[socket][listener-register]', { event: 'reconnect_attempt' });
    socket.on('reconnect_attempt', handleReconnectAttempt);

    socket.off('reconnect', handleReconnect);
    console.debug('[socket][listener-register]', { event: 'reconnect' });
    socket.on('reconnect', handleReconnect);

    socket.off('reconnect_error', handleReconnectError);
    console.debug('[socket][listener-register]', { event: 'reconnect_error' });
    socket.on('reconnect_error', handleReconnectError);

    socket.off('disconnect', handleSocketDisconnect);
    console.debug('[socket][listener-register]', { event: 'disconnect' });
    socket.on('disconnect', handleSocketDisconnect);

    initializedRef.current = true;

    return () => {
      listeners.forEach(([eventName, handler]) => {
        console.debug('[socket][listener-remove]', { event: eventName });
        socket.off(eventName, handler);
      });
      console.debug('[socket][listener-remove]', { event: 'reconnect_attempt' });
      socket.off('reconnect_attempt', handleReconnectAttempt);
      console.debug('[socket][listener-remove]', { event: 'reconnect' });
      socket.off('reconnect', handleReconnect);
      console.debug('[socket][listener-remove]', { event: 'reconnect_error' });
      socket.off('reconnect_error', handleReconnectError);
      console.debug('[socket][listener-remove]', { event: 'disconnect' });
      socket.off('disconnect', handleSocketDisconnect);
      initializedRef.current = false;
      clearTerminalResetTimeout();
      clearUnansweredCallTimeout();
      clearDisconnectRecoveryTimeout();
      resetCallSession('idle', { keepEndedState: false });
    };
  }, [clearDisconnectRecoveryTimeout, clearTerminalResetTimeout, clearUnansweredCallTimeout, handleIncomingAnswer, handleIncomingEnd, handleIncomingIce, handleIncomingOffer, handleIncomingReject, handleSocketDisconnect, resetCallSession, user]);

  useEffect(() => {
    if (!user) return undefined;

    const handleVisibilityChange = () => {
      const visible = typeof document !== 'undefined' ? !document.hidden : true;
      console.debug('[browser][visibility-change]', {
        visible,
        hidden: typeof document !== 'undefined' ? document.hidden : null,
        state: typeof document !== 'undefined' ? document.visibilityState : null,
        callActive: callStartedRef.current,
        callId: currentCallRef.current.callId || null
      });

      if (!visible) {
        return;
      }

      clearDisconnectRecoveryTimeout();

      if (callStartedRef.current) {
        const socket = getSocket();
        if (!socket.connected) {
          console.debug('[socket][reconnect-start]', {
            reason: 'visibilitychange',
            callId: currentCallRef.current.callId || null
          });
          socket.connect();
        }
      }
    };

    const handlePageShow = () => {
      console.debug('[browser][pageshow]', {
        callActive: callStartedRef.current,
        callId: currentCallRef.current.callId || null
      });
      clearDisconnectRecoveryTimeout();
    };

    const handlePageHide = () => {
      console.debug('[browser][pagehide]', {
        callActive: callStartedRef.current,
        callId: currentCallRef.current.callId || null
      });

      if (callStartedRef.current) {
        endCall('refresh');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [clearDisconnectRecoveryTimeout, user]);

  useEffect(() => {
    if (!user) return undefined;

    const unlockFromGesture = async () => {
      const ok = await callSoundManager.unlock();
      setSoundBlocked(!ok);
    };

    window.addEventListener('pointerdown', unlockFromGesture, { once: true, passive: true });
    window.addEventListener('touchstart', unlockFromGesture, { once: true, passive: true });
    window.addEventListener('keydown', unlockFromGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockFromGesture);
      window.removeEventListener('touchstart', unlockFromGesture);
      window.removeEventListener('keydown', unlockFromGesture);
    };
  }, [user]);

  useEffect(() => {
    if (!call.connectedAt || (call.status !== 'connected' && call.status !== 'connecting')) {
      setCallDurationSeconds(0);
      return undefined;
    }

    const started = new Date(call.connectedAt).getTime();
    const tick = () => setCallDurationSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, [call.connectedAt, call.status]);

  useEffect(() => () => {
    clearDisconnectRecoveryTimeout();
    clearTerminalResetTimeout();
    resetCallSession('idle', { keepEndedState: false });
  }, [clearDisconnectRecoveryTimeout, clearTerminalResetTimeout, resetCallSession]);

  const unlockCallSound = useCallback(async () => {
    const ok = await callSoundManager.unlock();
    setSoundBlocked(!ok);
    return ok;
  }, []);

  const value = useMemo(() => ({
    call,
    localStream,
    remoteStream,
    callDurationSeconds,
    soundBlocked,
    unlockCallSound,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera
  }), [
    acceptCall,
    call,
    callDurationSeconds,
    endCall,
    localStream,
    remoteStream,
    rejectCall,
    soundBlocked,
    startCall,
    switchCamera,
    toggleCamera,
    toggleMute,
    unlockCallSound
  ]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export { CallContext };
