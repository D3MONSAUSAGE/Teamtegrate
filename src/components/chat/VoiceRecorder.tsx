import React, { useState } from 'react';
import { Mic, MicOff, Pause, Play, Square, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVoiceRecorder, VoiceRecording } from '@/hooks/useVoiceRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (recording: VoiceRecording) => void;
  onCancel: () => void;
  isActive: boolean;
  className?: string;
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  onCancel, 
  isActive,
  className 
}: VoiceRecorderProps) {
  const [currentRecording, setCurrentRecording] = useState<VoiceRecording | null>(null);
  
  const {
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
  } = useVoiceRecorder({
    maxDuration: 300, // 5 minutes
    enableTranscription: true
  });

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      setCurrentRecording(null);
      await startRecording();
    } catch (error) {
      console.error('Error starting voice recording:', error);
      // Handle microphone permission errors
      if (error instanceof Error && error.message.includes('Permission')) {
        alert('Microphone permission is required to record voice messages. Please allow access and try again.');
      }
    }
  };

  const handleStopRecording = async () => {
    try {
      const recording = await stopRecording();
      if (recording) {
        setCurrentRecording(recording);
      }
    } catch (error) {
      console.error('Error stopping voice recording:', error);
    }
  };

  const handleSendRecording = () => {
    if (currentRecording) {
      try {
        onRecordingComplete(currentRecording);
        setCurrentRecording(null);
      } catch (error) {
        console.error('Error sending voice recording:', error);
      }
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setCurrentRecording(null);
    onCancel();
  };

  if (!isActive) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleStartRecording}
        className={cn("text-muted-foreground hover:text-primary", className)}
        title="Record voice message"
      >
        <Mic className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className={cn("p-4 space-y-4 border-primary/20 bg-background/50 backdrop-blur", className)}>
      {/* Recording Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRecording && !isPaused && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          <span className="text-sm font-medium">
            {!isRecording && !currentRecording && "Ready to record"}
            {isRecording && !isPaused && "Recording..."}
            {isRecording && isPaused && "Paused"}
            {currentRecording && !isProcessing && "Recording complete"}
            {isProcessing && "Processing..."}
          </span>
        </div>
        
        <span className="text-sm text-muted-foreground font-mono">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Waveform Visualization */}
      <div className="h-16 flex items-center justify-center bg-muted/30 rounded-lg">
        <WaveformVisualizer 
          waveform={waveform} 
          isActive={isRecording && !isPaused}
          className="w-full h-full"
        />
      </div>

      {/* Transcript (if available) */}
      {currentRecording?.transcript && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
          <p className="text-sm">{currentRecording.transcript}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {!isRecording && !currentRecording && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancelRecording}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={handleStartRecording}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </>
        )}

        {isRecording && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancelRecording}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={isPaused ? resumeRecording : pauseRecording}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={handleStopRecording}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}

        {currentRecording && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancelRecording}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleStartRecording}
              title="Record again"
            >
              <MicOff className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={handleSendRecording}
              className="bg-primary hover:bg-primary/90"
              disabled={isProcessing}
            >
              <Send className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {isProcessing && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Transcribing audio...
          </div>
        </div>
      )}
    </Card>
  );
}