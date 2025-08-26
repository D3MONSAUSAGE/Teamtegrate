import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface VoiceRecording {
  audioBlob: Blob;
  duration: number;
  waveform: number[];
  transcript?: string;
}

interface UseVoiceRecorderOptions {
  maxDuration?: number; // in seconds
  enableTranscription?: boolean;
}

export function useVoiceRecorder({
  maxDuration = 300, // 5 minutes default
  enableTranscription = true
}: UseVoiceRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  const initializeAudioContext = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
      throw error;
    }
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const analyze = () => {
      if (!isRecording || isPaused) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average amplitude for waveform
      const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
      const normalizedAmplitude = average / 255;
      
      setWaveform(prev => [...prev.slice(-99), normalizedAmplitude]); // Keep last 100 samples
      
      animationRef.current = requestAnimationFrame(analyze);
    };
    
    analyze();
  }, [isRecording, isPaused]);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | undefined> => {
    if (!enableTranscription || !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return undefined;
    }

    try {
      setIsProcessing(true);
      
      // Convert blob to audio URL for playback during transcription
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve) => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        let transcript = '';
        
        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }
        };
        
        recognition.onend = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(transcript.trim() || undefined);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          URL.revokeObjectURL(audioUrl);
          resolve(undefined);
        };
        
        // Play audio and start recognition
        audio.play().then(() => {
          recognition.start();
        }).catch(() => {
          resolve(undefined);
        });
      });
    } catch (error) {
      console.error('Transcription error:', error);
      return undefined;
    } finally {
      setIsProcessing(false);
    }
  }, [enableTranscription]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await initializeAudioContext();
      
      chunksRef.current = [];
      setWaveform([]);
      setDuration(0);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // This will be handled by stopRecording method
      };
      
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDuration(elapsed);
        
        // Auto-stop at max duration
        if (elapsed >= maxDuration * 1000) {
          stopRecording();
          toast.warning(`Recording stopped - maximum duration of ${maxDuration / 60} minutes reached`);
        }
      }, 100);
      
      mediaRecorder.start(100); // Record in 100ms chunks
      setIsRecording(true);
      
      analyzeAudio();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  }, [initializeAudioContext, analyzeAudio, maxDuration, enableTranscription, transcribeAudio, waveform]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      analyzeAudio();
    }
  }, [isRecording, isPaused, analyzeAudio]);

  const stopRecording = useCallback((): Promise<VoiceRecording | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }
      
      // Store resolve function to call from the existing onstop handler
      const handleStop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const finalDuration = Date.now() - startTimeRef.current;
        
        // Clean up stream
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        
        setIsRecording(false);
        setIsPaused(false);
        
        // Transcribe audio if enabled
        let transcript: string | undefined;
        if (enableTranscription) {
          transcript = await transcribeAudio(audioBlob);
        }
        
        // Return the recording data
        const recording: VoiceRecording = {
          audioBlob,
          duration: finalDuration,
          waveform: [...waveform],
          transcript
        };
        
        resolve(recording);
      };
      
      // Set up the stop handler
      mediaRecorderRef.current.onstop = handleStop;
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      mediaRecorderRef.current.stop();
    });
  }, [isRecording, enableTranscription, transcribeAudio, waveform]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      chunksRef.current = [];
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setWaveform([]);
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    waveform,
    isProcessing,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording
  };
}