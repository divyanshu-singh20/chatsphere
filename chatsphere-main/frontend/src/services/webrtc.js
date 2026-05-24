const buildIceServers = () => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential
    });
  }

  return iceServers;
};

export const RTC_CONFIGURATION = {
  iceServers: buildIceServers(),
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

const logStreamSummary = (stream, label) => {
  if (!stream) return;

  const audioTracks = stream.getAudioTracks?.() || [];
  const videoTracks = stream.getVideoTracks?.() || [];

  console.debug('[webrtc][stream]', label, {
    id: stream.id,
    active: stream.active,
    audioTracks: audioTracks.map((track) => ({
      id: track.id,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      label: track.label
    })),
    videoTracks: videoTracks.map((track) => ({
      id: track.id,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      label: track.label
    }))
  });
};

const logPeerSummary = (peer, label, sessionId) => {
  if (!peer) return;

  console.debug('[webrtc][pc]', label, {
    sessionId: sessionId || null,
    connectionState: peer.connectionState,
    iceConnectionState: peer.iceConnectionState,
    signalingState: peer.signalingState,
    senders: peer.getSenders().map((sender) => ({
      trackKind: sender.track?.kind || null,
      trackId: sender.track?.id || null,
      trackEnabled: sender.track?.enabled ?? null,
      trackReadyState: sender.track?.readyState || null
    })),
    transceivers: peer.getTransceivers().map((transceiver) => ({
      mid: transceiver.mid,
      direction: transceiver.direction,
      currentDirection: transceiver.currentDirection,
      senderTrackKind: transceiver.sender?.track?.kind || null,
      receiverTrackKind: transceiver.receiver?.track?.kind || null
    }))
  });
};

export const createPeerConnection = ({
  sessionId,
  onIceCandidate,
  onTrack,
  onStateChange
} = {}) => {
  const peer = new RTCPeerConnection(RTC_CONFIGURATION);
  const inboundStream = new MediaStream();
  const seenTrackIds = new Set();

  console.log('[webrtc] peer connection created', {
    sessionId: sessionId || null,
    iceServers: RTC_CONFIGURATION.iceServers.map((server) => server.urls),
    iceTransportPolicy: RTC_CONFIGURATION.iceTransportPolicy
  });

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('[webrtc] sending ice candidate', { sessionId: sessionId || null });
      onIceCandidate?.(event.candidate);
    } else {
      console.log('[webrtc] end of candidates', { sessionId: sessionId || null });
    }
  };

  peer.ontrack = (event) => {
    const [eventStream] = event.streams || [];
    const track = event.track;

    if (!track || seenTrackIds.has(track.id)) {
      return;
    }

    seenTrackIds.add(track.id);

    if (!inboundStream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
      inboundStream.addTrack(track);
      console.debug('[webrtc][track-added]', {
        sessionId: sessionId || null,
        kind: track.kind,
        id: track.id,
        source: 'remote'
      });
    }

    const resolvedStream = eventStream || new MediaStream(inboundStream.getTracks());

    console.debug('[webrtc][remote-stream-received]', {
      sessionId: sessionId || null,
      kind: track.kind,
      id: track.id,
      audioTracks: resolvedStream.getAudioTracks().length,
      videoTracks: resolvedStream.getVideoTracks().length
    });

    logStreamSummary(resolvedStream, 'remote track event stream');

    onTrack?.(resolvedStream);
  };

  peer.onconnectionstatechange = () => {
    console.log('[webrtc] connection state:', {
      sessionId: sessionId || null,
      state: peer.connectionState
    });

    logPeerSummary(peer, 'connection-state-change', sessionId);
    onStateChange?.(getPeerState(peer));
  };

  peer.oniceconnectionstatechange = () => {
    console.log('[webrtc] ice state:', {
      sessionId: sessionId || null,
      state: peer.iceConnectionState
    });

    logPeerSummary(peer, 'ice-connection-state-change', sessionId);
    onStateChange?.(getPeerState(peer));
  };

  peer.onsignalingstatechange = () => {
    console.log('[webrtc] signaling state:', {
      sessionId: sessionId || null,
      state: peer.signalingState
    });

    logPeerSummary(peer, 'signaling-state-change', sessionId);
    onStateChange?.(getPeerState(peer));
  };

  return peer;
};

const getPeerState = (peer) => ({
  connectionState: peer?.connectionState || 'new',
  iceConnectionState: peer?.iceConnectionState || 'new',
  signalingState: peer?.signalingState || 'stable'
});

const normalizeSessionDescription = (description) => {
  if (!description) return null;

  if (typeof description.toJSON === 'function') {
    const json = description.toJSON();
    if (json?.type && json?.sdp) {
      return { type: json.type, sdp: json.sdp };
    }
  }

  return {
    type: description.type || null,
    sdp: description.sdp || null
  };
};

const normalizeIceCandidate = (candidate) => {
  if (!candidate) return null;

  if (typeof candidate.toJSON === 'function') {
    const json = candidate.toJSON();
    return {
      candidate: json.candidate || null,
      sdpMid: json.sdpMid ?? null,
      sdpMLineIndex: json.sdpMLineIndex ?? null,
      usernameFragment: json.usernameFragment ?? null
    };
  }

  return {
    candidate: candidate.candidate || null,
    sdpMid: candidate.sdpMid ?? null,
    sdpMLineIndex: candidate.sdpMLineIndex ?? null,
    usernameFragment: candidate.usernameFragment ?? null
  };
};

export const createOffer = async (peer, sessionId) => {
  if (!peer) throw new Error('Peer connection is required to create an offer');

  console.debug('[webrtc][offer-created]', { sessionId: sessionId || null });
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  console.debug('[webrtc][local-description-set]', {
    sessionId: sessionId || null,
    type: offer.type || null,
    sdpLength: offer.sdp?.length || 0
  });
  return normalizeSessionDescription(offer);
};

export const createAnswer = async (peer, sessionId) => {
  if (!peer) throw new Error('Peer connection is required to create an answer');

  console.debug('[webrtc][answer-created]', { sessionId: sessionId || null });
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  console.debug('[webrtc][local-description-set]', {
    sessionId: sessionId || null,
    type: answer.type || null,
    sdpLength: answer.sdp?.length || 0
  });
  return normalizeSessionDescription(answer);
};

export const handleRemoteAnswer = async (peer, answer, sessionId) => {
  if (!peer || !answer || answer.type !== 'answer' || !answer.sdp) {
    return false;
  }

  console.debug('[webrtc][answer-received]', {
    sessionId: sessionId || null,
    type: answer.type || null,
    sdpLength: answer.sdp?.length || 0
  });
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
  console.debug('[webrtc][remote-description-set]', {
    sessionId: sessionId || null,
    descriptionType: 'answer'
  });
  return true;
};

export const handleIceCandidate = async (peer, candidate, sessionId) => {
  if (!peer || !candidate) {
    return false;
  }

  await peer.addIceCandidate(new RTCIceCandidate(candidate));
  console.debug('[webrtc][ice-applied]', {
    sessionId: sessionId || null,
    candidate: candidate.candidate || null,
    sdpMid: candidate.sdpMid ?? null,
    sdpMLineIndex: candidate.sdpMLineIndex ?? null
  });
  return true;
};

export const toSerializableIceCandidate = normalizeIceCandidate;

export const cleanupConnection = (peer) => {
  if (!peer) return;

  try {
    console.debug('[webrtc][peer-cleanup]', {
      connectionState: peer.connectionState || null,
      iceConnectionState: peer.iceConnectionState || null,
      signalingState: peer.signalingState || null,
      senderCount: peer.getSenders().length,
      receiverCount: peer.getReceivers().length
    });

    peer.onicecandidate = null;
    peer.ontrack = null;
    peer.onconnectionstatechange = null;
    peer.oniceconnectionstatechange = null;
    peer.onsignalingstatechange = null;

    peer.getSenders().forEach((sender) => {
      try {
        sender.replaceTrack(null);
      } catch (error) {
        // Ignore cleanup failures.
      }

      try {
        sender.track?.stop?.();
      } catch (error) {
        // Ignore cleanup failures.
      }
    });

    peer.getReceivers().forEach((receiver) => {
      try {
        receiver.track?.stop?.();
      } catch (error) {
        // Ignore cleanup failures.
      }
    });

    peer.close();
  } catch (error) {
    console.warn('[webrtc] cleanup failed', error);
  }
};

export const stopMediaStream = (stream) => {
  if (!stream) return;

  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (error) {
      // Ignore cleanup errors for already-ended tracks.
    }
  });
};
