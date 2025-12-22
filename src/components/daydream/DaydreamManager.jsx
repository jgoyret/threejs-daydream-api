import { useState, useRef, useEffect } from 'react';
import { createStream, updateStream } from '../../services/daydreamAPI';

/**
 * DaydreamManager - Manages WebRTC streaming to/from Daydream API
 * Captures canvas, sends via WHIP, and receives processed stream
 */
export default function DaydreamManager({ canvasRef, onStreamReady, onError, apiKey }) {
  const [streamData, setStreamData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, connecting, loading, streaming, error
  const [pipelineState, setPipelineState] = useState(null); // LOADING, DEGRADED_INFERENCE, etc.
  const peerConnectionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const statusIntervalRef = useRef(null);
  const apiKeyRef = useRef(apiKey);

  // Keep apiKey ref updated
  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  /**
   * Start streaming: Create stream session and send canvas via WebRTC
   */
  const startStreaming = async (params = {}) => {
    try {
      setStatus('connecting');

      // 1. Create stream on Daydream
      console.log('Creating Daydream stream with params:', params);
      const stream = await createStream(apiKeyRef.current, params);

      setStreamData(stream);
      console.log('Stream created:', stream);

      // 2. Capture media stream (either test video or canvas)
      let captureStream;

      if (params.useVideoTest) {
        // Use test video instead of canvas
        console.log('🎬 Using test video instead of canvas');
        const video = document.createElement('video');
        video.src = 'https://qermkkrhilxobhfrefim.supabase.co/storage/v1/object/public/catolmedia/biovideo.mp4?t=2024-10-11T17%3A07%3A38.511Z';
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;

        await video.play();
        captureStream = video.captureStream(30);
        console.log('✅ Test video stream captured');
      } else {
        // Use canvas as normal
        if (!canvasRef.current) {
          throw new Error('Canvas not available');
        }
        const canvas = canvasRef.current;
        captureStream = canvas.captureStream(30);
        console.log('✅ Canvas stream captured');
      }

      mediaStreamRef.current = captureStream;

      // 3. Setup WebRTC connection via WHIP
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // Add video track to peer connection
      captureStream.getTracks().forEach(track => {
        pc.addTrack(track, captureStream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to WHIP endpoint
      console.log('Connecting to WHIP URL:', stream.whip_url);
      const whipResponse = await fetch(stream.whip_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!whipResponse.ok) {
        throw new Error(`WHIP connection failed: ${whipResponse.status}`);
      }

      const answerSdp = await whipResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      setIsStreaming(true);
      // Keep status as 'connecting' until pipeline is ready

      // Wait for pipeline to be ready (state: DEGRADED_INFERENCE or similar)
      if (onStreamReady && stream.id) {
        console.log('🔍 Waiting for pipeline to be ready:', stream.id);

        try {
          let attempts = 0;
          const maxAttempts = 120; // 120 seconds max (pipeline loading can take a while)
          let pipelineReady = false;
          let whepUrl = null;

          while (attempts < maxAttempts && !pipelineReady) {
            const { getStreamStatus } = await import('../../services/daydreamAPI');
            const statusData = await getStreamStatus(apiKeyRef.current, stream.id);

            console.log(`📊 Attempt ${attempts + 1}: Checking pipeline state...`);

            const gatewayStatus = statusData?.data?.gateway_status;
            const currentState = statusData?.data?.state;
            whepUrl = gatewayStatus?.whep_url;

            // Update pipeline state for UI
            if (currentState) {
              setPipelineState(currentState);
              console.log(`📊 Pipeline state: ${currentState}`);
            }

            // Update status based on pipeline state
            if (currentState === 'LOADING') {
              setStatus('loading');
              console.log('⏳ Pipeline is loading...');
            }

            // Check if pipeline is ready (DEGRADED_INFERENCE or ONLINE means it's running)
            if (currentState === 'DEGRADED_INFERENCE' || currentState === 'ONLINE' || currentState === 'INFERENCE' || currentState === 'RUNNING') {
              pipelineReady = true;
              console.log('✅ Pipeline ready! State:', currentState);
              setStatus('streaming');
              if (whepUrl) {
                onStreamReady(whepUrl);
              }
              break;
            }

            // Wait 1 second before next attempt
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          if (!pipelineReady) {
            console.error('❌ Pipeline not ready after 120 seconds');
            // Still provide WHEP URL if available, user can try
            if (whepUrl) {
              console.log('⚠️ Providing WHEP URL anyway:', whepUrl);
              setStatus('streaming');
              onStreamReady(whepUrl);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching stream status:', error);
        }
      }

      console.log('Streaming started successfully');

      // Start status polling every 5 seconds
      startStatusPolling(stream.id);

    } catch (error) {
      console.error('Error starting stream:', error);
      setStatus('error');
      if (onError) onError(error);
    }
  };

  /**
   * Poll stream status every 5 seconds
   */
  const startStatusPolling = (streamId) => {
    console.log('🔄 Starting status polling every 5s...');

    const pollStatus = async () => {
      try {
        const { getStreamStatus } = await import('../../services/daydreamAPI');
        const statusData = await getStreamStatus(apiKeyRef.current, streamId);

        console.log('📊 Stream Status Update:', {
          state: statusData?.data?.state,
          fps: statusData?.data?.inference_status?.fps,
          inputFps: statusData?.data?.input_status?.fps,
          lastError: statusData?.data?.inference_status?.last_error
        });

        // Log errors if any
        if (statusData?.data?.inference_status?.last_error) {
          console.warn('⚠️ Stream has error:', statusData.data.inference_status.last_error);
        }

      } catch (error) {
        console.error('❌ Error polling status:', error);
      }
    };

    // Poll immediately, then every 5 seconds
    pollStatus();
    statusIntervalRef.current = setInterval(pollStatus, 5000);
  };

  /**
   * Stop streaming and cleanup
   * Note: Daydream API doesn't support DELETE, streams will auto-expire
   */
  const stopStreaming = () => {
    try {
      // Stop status polling
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
        console.log('🔄 Stopped status polling');
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Stop media stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Note: Stream will remain active on Daydream until it auto-expires
      // The API doesn't support DELETE method to manually close streams
      console.log('Local streaming stopped. Stream will auto-expire on Daydream.');

      setStreamData(null);
      setIsStreaming(false);
      setStatus('idle');
      setPipelineState(null);

    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  };

  /**
   * Update stream parameters dynamically
   */
  const updateParams = async (params) => {
    if (!streamData?.id) {
      console.error('❌ Cannot update: No stream ID');
      return;
    }

    try {
      console.log('🔄 Updating stream params:', params);
      console.log('📝 Stream ID:', streamData.id);

      const updated = await updateStream(apiKeyRef.current, streamData.id, params);

      console.log('✅ Update response:', updated);
      setStreamData(updated);

      // Check status after update to see if it applied
      setTimeout(async () => {
        try {
          const { getStreamStatus } = await import('../../services/daydreamAPI');
          const statusData = await getStreamStatus(apiKeyRef.current, streamData.id);

          console.log('📊 Status after update:', {
            state: statusData?.data?.state,
            lastParams: statusData?.data?.inference_status?.last_params,
            lastError: statusData?.data?.inference_status?.last_error
          });

          if (statusData?.data?.inference_status?.last_error) {
            console.error('❌ Update error from status:', statusData.data.inference_status.last_error);
          } else {
            console.log('✅ Stream parameters updated successfully');
          }
        } catch (e) {
          console.error('❌ Error checking status after update:', e);
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Error updating params:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      if (isStreaming) {
        stopStreaming();
      }
    };
  }, [isStreaming]);

  return {
    startStreaming,
    stopStreaming,
    updateParams,
    isStreaming,
    status,
    pipelineState,
    streamData
  };
}
