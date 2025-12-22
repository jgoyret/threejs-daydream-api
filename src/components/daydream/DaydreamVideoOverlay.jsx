import { useRef, useEffect } from 'react';
import { WebRTCPlayer } from '@eyevinn/webrtc-player';

/**
 * DaydreamVideoOverlay - Displays the AI-processed video stream
 * This is the actual canvas the player sees and interacts with
 */
export default function DaydreamVideoOverlay({ outputStreamUrl, isStreaming, status, pipelineState }) {
  const videoWebRTCRef = useRef(null);
  const playerRef = useRef(null);

  // Setup WebRTC player - single connection only
  useEffect(() => {
    if (!outputStreamUrl || !videoWebRTCRef.current || !isStreaming) {
      return;
    }

    // Prevent duplicate connections
    if (playerRef.current) {
      console.log('[WebRTC] Player already exists, skipping duplicate connection');
      return;
    }

    const video = videoWebRTCRef.current;
    const whepUrl = outputStreamUrl;
    console.log('[WebRTC] Setting up WHEP connection:', whepUrl);

    let timeoutId;

    const setupPlayer = async () => {
      try {
        console.log('[WebRTC] Creating WebRTC player...');
        const player = new WebRTCPlayer({
          video: video,
          type: 'whep',
          statsTypeFilter: '^candidate-*|^inbound-rtp'
        });

        playerRef.current = player;
        const streamUrl = new URL(whepUrl);

        console.log('[WebRTC] Loading stream...');
        await player.load(streamUrl);
        console.log('✅ [WebRTC] Stream connected successfully!');

      } catch (error) {
        console.error('❌ [WebRTC] Connection failed:', error);

        // Cleanup on failure
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {}
          playerRef.current = null;
        }
      }
    };

    // Wait a bit before connecting (stream should already be live when URL arrives)
    console.log('[WebRTC] Waiting 2s before connecting...');
    timeoutId = setTimeout(setupPlayer, 2000);

    return () => {
      console.log('[WebRTC] Cleaning up connection...');
      if (timeoutId) clearTimeout(timeoutId);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [outputStreamUrl, isStreaming]);

  // Show loading spinner while connecting or loading pipeline
  if (status === 'connecting' || status === 'loading') {
    // Determine message based on status and pipeline state
    let mainMessage = 'Starting stream...';
    let subMessage = 'Connecting to Daydream AI';

    if (status === 'loading' || pipelineState === 'LOADING') {
      mainMessage = 'Loading pipeline...';
      subMessage = 'Initializing AI model';
    } else if (pipelineState) {
      subMessage = `Status: ${pipelineState}`;
    }

    return (
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 40 }}
      >
        <div
          style={{
            width: '1920px',
            height: '1080px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            boxShadow: '0 0 100px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col items-center gap-6">
            {/* Spinner */}
            <div className="relative">
              <div
                className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"
              />
            </div>
            {/* Message */}
            <div className="text-white text-xl font-medium">
              {mainMessage}
            </div>
            <div className="text-white/60 text-sm">
              {subMessage}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isStreaming || !outputStreamUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: '1920px',
          height: '1080px',
          position: 'relative'
        }}
      >
        <video
          ref={videoWebRTCRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            boxShadow: '0 0 100px rgba(0, 0, 0, 0.8)'
          }}
        />
      </div>
    </div>
  );
}
