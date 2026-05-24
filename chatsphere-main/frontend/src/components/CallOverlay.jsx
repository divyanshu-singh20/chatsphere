import IncomingCallScreen from './calls/IncomingCallScreen';
import OutgoingCallScreen from './calls/OutgoingCallScreen';
import ActiveCallScreen from './calls/ActiveCallScreen';

export default function CallOverlay({
  call,
  localStream,
  remoteStream,
  durationSeconds,
  soundBlocked,
  onEnableSound,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera
}) {
  if (!call || call.status === 'idle') return null;

  if (call.status === 'ringing' && call.isIncoming) {
    return <IncomingCallScreen call={call} soundBlocked={soundBlocked} onEnableSound={onEnableSound} onAccept={onAccept} onReject={onReject} />;
  }

  if (call.status === 'calling') {
    return <OutgoingCallScreen call={call} soundBlocked={soundBlocked} onEnableSound={onEnableSound} onCancel={onEnd} />;
  }

  if (call.status === 'connecting' || call.status === 'connected' || call.status === 'in-call') {
    return (
      <ActiveCallScreen
        call={call}
        localStream={localStream}
        remoteStream={remoteStream}
        durationSeconds={durationSeconds}
        onToggleMute={onToggleMute}
        onToggleCamera={onToggleCamera}
        onEnd={onEnd}
      />
    );
  }

  return null;
}