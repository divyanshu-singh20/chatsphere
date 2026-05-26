import { AnimatePresence } from 'framer-motion';
import IncomingCallScreen from './calls/IncomingCallScreen';
import OutgoingCallScreen from './calls/OutgoingCallScreen';
import ActiveCallScreen from './calls/ActiveCallScreen';
import CallTerminalScreen from './calls/CallTerminalScreen';

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

  return (
    <AnimatePresence mode="wait" initial={false}>
      {call.status === 'ringing' && call.isIncoming ? (
        <IncomingCallScreen key={`incoming-${call.callId || 'call'}`} call={call} soundBlocked={soundBlocked} onEnableSound={onEnableSound} onAccept={onAccept} onReject={onReject} />
      ) : null}

      {call.status === 'calling' ? (
        <OutgoingCallScreen key={`outgoing-${call.callId || 'call'}`} call={call} soundBlocked={soundBlocked} onEnableSound={onEnableSound} onCancel={onEnd} />
      ) : null}

      {(call.status === 'connecting' || call.status === 'connected' || call.status === 'in-call') ? (
        <ActiveCallScreen
          key={`active-${call.callId || 'call'}`}
          call={call}
          localStream={localStream}
          remoteStream={remoteStream}
          durationSeconds={durationSeconds}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onEnd={onEnd}
        />
      ) : null}

      {call.status === 'ended' && call.endedReason ? (
        <CallTerminalScreen key={`terminal-${call.callId || 'call'}`} call={call} />
      ) : null}
    </AnimatePresence>
  );
}