import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceInterfaceProps {
  onTranscript?: (text: string) => void;
  onCommand?: (command: string) => void;
  onAutoStop?: () => void; // Add this line
  continuous?: boolean;
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export const useVoiceInterface = ({ 
  onTranscript, 
  onCommand, 
  onAutoStop, // Add this parameter
  continuous = false 
}: UseVoiceInterfaceProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(continuous);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Voice commands mapping
  const voiceCommands: Record<string, string> = {
    'ask': 'ask',
    'question': 'ask',
    'query': 'ask',
    'search': 'ask',
    'find': 'ask',
    'summarize': 'summarize',
    'summary': 'summarize',
    'explain': 'explain',
    'what does this mean': 'explain',
    'compare': 'compare',
    'show sources': 'sources',
    'show references': 'sources',
    'clear': 'clear',
    'stop': 'stop',
    'pause': 'pause',
    'play': 'play',
    'resume': 'play',
    'help': 'help',
    'voice mode': 'voice_mode',
    'text mode': 'text_mode'
  };

  const playBeep = () => {
    // Create a simple beep sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play beep sound:', error);
    }
  };

  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = isContinuousMode;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "🎤 Listening...",
        description: "Speak your question or command",
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          // Reset silence timer when we get final results
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      
      // Process final transcript
      if (finalTranscript) {
        onTranscript?.(finalTranscript);
        processVoiceCommand(finalTranscript.toLowerCase());
        
        // Auto-stop after processing in continuous mode
        if (isContinuousMode) {
          playBeep(); // Play beep when question is detected
          onAutoStop?.(); // Call the auto-stop callback
        }
      }

      // Set up silence detection for continuous mode
      if (isContinuousMode && interimTranscript && !silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          if (interimTranscript.trim().length > 2) {
            playBeep(); // Play beep when silence is detected
            onAutoStop?.(); // Call the auto-stop callback
          }
        }, 2000); // 2 seconds of silence
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice features.",
          variant: "destructive",
        });
      } else if (event.error !== 'aborted') {
        toast({
          title: "Voice recognition error",
          description: "Failed to process voice input. Please try again.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };

    recognitionRef.current = recognition;
  }, [onTranscript, onAutoStop, isContinuousMode, toast]); // Add onAutoStop to dependencies

  const processVoiceCommand = (text: string) => {
    // Check for specific commands
    for (const [phrase, command] of Object.entries(voiceCommands)) {
      if (text.includes(phrase)) {
        onCommand?.(command);
        
        toast({
          title: `🎯 Command: ${command}`,
          description: `Executing "${phrase}"`,
        });
        return;
      }
    }

    // Default to question if no specific command matched
    if (text.length > 5) { // Only treat as question if meaningful length
      onCommand?.('ask');
    }
  };

  const startListening = useCallback((continuous: boolean = false) => {
    if (!isSupported) {
      initializeSpeechRecognition();
    }

    setIsContinuousMode(continuous);

    try {
      if (recognitionRef.current) {
        recognitionRef.current.continuous = continuous;
      }
      recognitionRef.current?.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Failed to start voice recognition",
        description: "Please try again or check microphone permissions.",
        variant: "destructive",
      });
    }
  }, [isSupported, initializeSpeechRecognition, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    toast({
      title: "🎤 Voice stopped",
      description: "Voice recognition has been stopped.",
    });
  }, [toast]);

  const toggleListening = useCallback((continuous: boolean = false) => {
    if (isListening) {
      stopListening();
    } else {
      startListening(continuous);
    }
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const setContinuousMode = useCallback((continuous: boolean) => {
    setIsContinuousMode(continuous);
  }, []);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    isContinuousMode,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    setContinuousMode,
    playBeep,
  };
};