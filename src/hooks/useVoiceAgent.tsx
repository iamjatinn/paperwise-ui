import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceAgentProps {
  onQuestion: (question: string, useVoice: boolean) => void;
  onCommand: (command: string, text?: string) => void;
}

// Extended TypeScript declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useVoiceAgent = ({ onQuestion, onCommand }: UseVoiceAgentProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout>();
  const restartTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true); // Track if component is mounted
  const { toast } = useToast();

  // Fuzzy matching for commands
  const fuzzyMatch = (input: string, target: string): boolean => {
    const inputClean = input.toLowerCase().trim();
    const targetClean = target.toLowerCase().trim();
    
    // Exact match
    if (inputClean === targetClean) return true;
    
    // Common misrecognitions
    const misrecognitions: { [key: string]: string[] } = {
      'pause': ['pose', 'paws', 'pauses', 'poz', 'paul', 'police'],
      'play': ['plaque', 'plague', 'plea', 'player', 'pray'],
      'stop': ['stops', 'stomp', 'stap', 'shop', 'stock'],
      'summarize': ['summarise', 'summary', 'summaries', 'samurai', 'some arise', 'summarize', 'summarizing'],
      'summarise': ['summarize', 'summary', 'summaries', 'samurai', 'some arise', 'summarize', 'summarizing'],
      'explain': ['explains', 'explained', 'exclaim', 'explanation', 'explaining'],
      'send': ['cent', 'sent', 'sand', 'scent', 'said', 'send it'],
      'clear': ['cleared', 'cleaning', 'claire', 'clare']
    };
    
    // Check if input is a common misrecognition of target
    if (misrecognitions[targetClean]?.includes(inputClean)) {
      return true;
    }
    
    // Simple similarity check for close matches
    if (Math.abs(inputClean.length - targetClean.length) <= 3) {
      let matches = 0;
      const minLength = Math.min(inputClean.length, targetClean.length);
      for (let i = 0; i < minLength; i++) {
        if (inputClean[i] === targetClean[i]) matches++;
      }
      const similarity = matches / Math.max(inputClean.length, targetClean.length);
      return similarity > 0.6; // 60% similarity threshold
    }
    
    return false;
  };

  // Helper function to execute commands
  const executeCommand = useCallback((command: string, text: string) => {
    // For send command, check if we have a transcript to send
    if (command === 'send') {
      if (transcript.trim().length > 0) {
        console.log('📤 SENDING via voice command:', transcript);
        onQuestion(transcript, true);
        setTranscript('');
        playBeep();
      } else {
        console.log('❌ No transcript to send for voice command');
        toast({
          title: "No text to send",
          description: "Please speak something first.",
          variant: "destructive",
        });
      }
    } else {
      onCommand(command, text);
    }
    
    // Clear transcript for non-send commands
    if (command !== 'send') {
      setTranscript('');
    }
  }, [transcript, onQuestion, onCommand, toast]);

  // Process voice commands
  const processVoiceCommand = useCallback((text: string): boolean => {
    const commands = {
      'pause': 'pause', 
      'play': 'play',
      'stop': 'stop_speech',
      'summarize': 'summarize',
      'summarise': 'summarize',
      'explain': 'explain',
      'clear': 'clear',
      'help': 'help',
      'what is this about': 'what_about',
      'tell me about this': 'what_about',
      'send': 'send',
      'send now': 'send',
      'go': 'send',
      'search': 'send',
      'ask': 'send'
    };

    const cleanText = text.toLowerCase().trim();
    
    console.log(`🔍 Checking for commands in: "${cleanText}"`);
    
    // First check for exact matches
    for (const [phrase, command] of Object.entries(commands)) {
      if (cleanText === phrase) {
        console.log(`🎯 Exact command detected: ${command} from "${text}"`);
        executeCommand(command, text);
        return true;
      }
    }
    
    // Then check for fuzzy matches
    for (const [phrase, command] of Object.entries(commands)) {
      if (fuzzyMatch(cleanText, phrase)) {
        console.log(`🎯 Fuzzy command detected: ${command} from "${text}" (original: "${phrase}")`);
        executeCommand(command, text);
        return true;
      }
    }
    
    // Check for partial matches (if the command is part of a longer sentence)
    for (const [phrase, command] of Object.entries(commands)) {
      if (cleanText.includes(phrase)) {
        console.log(`🎯 Partial command detected: ${command} from "${text}"`);
        executeCommand(command, text);
        return true;
      }
    }
    
    return false;
  }, [executeCommand]);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isMountedRef.current) {
      console.log('🚫 Component not mounted, skipping recognition init');
      return null;
    }
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      setHasPermission(false);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      if (!isMountedRef.current) return;
      setIsListening(true);
      setHasPermission(true);
      console.log('🎤 Speech recognition started with improved accuracy');
    };

    recognition.onresult = (event: any) => {
      if (!isMountedRef.current) return;

      let finalTranscript = '';
      let interimTranscript = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        confidence = result[0].confidence;
        
        if (result.isFinal) {
          console.log(`🔊 Final transcript: "${transcript}" | Confidence: ${confidence}`);
        }
        
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      
      console.log('🎤 Speech detected:', {
        final: finalTranscript,
        interim: interimTranscript,
        current: currentTranscript,
        hasFinal: !!finalTranscript,
        confidence: confidence
      });

      if (currentTranscript.trim()) {
        setTranscript(currentTranscript.trim());
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        console.log('⏰ Cleared previous silence timer');
      }

      const textToCheck = finalTranscript || currentTranscript;
      if (textToCheck.trim()) {
        const isCommand = processVoiceCommand(textToCheck.trim().toLowerCase());
        if (isCommand) {
          console.log('🎯 Command processed, skipping auto-send');
          return;
        }
      }

      // IMMEDIATE SEND for final results
      if (finalTranscript.trim() && finalTranscript.trim().length > 1) {
        console.log('🚀 IMMEDIATE SEND - Final result detected:', finalTranscript.trim());
        handleAutoSend(finalTranscript.trim());
        return;
      }

      // Set up silence detection for interim results
      if (currentTranscript.trim().length > 1 && !finalTranscript) {
        console.log('⏰ Setting up auto-send timer for:', currentTranscript.trim());
        silenceTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          const finalText = currentTranscript.trim();
          if (finalText.length > 0) {
            console.log('🚀 SILENCE DETECTED - Auto-sending:', finalText);
            handleAutoSend(finalText);
          }
        }, 5000);
      }
    };

    recognition.onerror = (event: any) => {
      if (!isMountedRef.current) return;
      
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone blocked",
          description: "Please allow microphone access in your browser settings.",
          variant: "destructive",
        });
        setIsListening(false);
        setHasPermission(false);
      } else if (event.error === 'audio-capture') {
        toast({
          title: "No microphone",
          description: "No microphone was found. Please ensure a microphone is connected.",
          variant: "destructive",
        });
        setIsListening(false);
        setHasPermission(false);
      } else if (event.error === 'aborted') {
        console.log('🎤 Speech recognition aborted (normal stop)');
        setIsListening(false);
      } else {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (!isMountedRef.current) return;
      
      console.log('🎤 Speech recognition ended');
      setIsListening(false);
      
      // Only auto-restart if we're still mounted and have permission
      if (isMountedRef.current && hasPermission && recognitionRef.current === recognition) {
        console.log('🔄 Auto-restarting speech recognition in 2 seconds...');
        restartTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && recognitionRef.current === recognition) {
            try {
              recognition.start();
              console.log('🎤 Speech recognition auto-restarted');
            } catch (error) {
              console.error('Failed to auto-restart recognition:', error);
            }
          }
        }, 2000);
      }
    };

    return recognition;
  }, [toast, processVoiceCommand, hasPermission]);

  const handleAutoSend = useCallback((text: string) => {
    if (text.trim().length > 0) {
      console.log('🚀 AUTO-SENDING question to AI:', text);
      onQuestion(text, true);
      setTranscript('');
      playBeep();
    } else {
      console.log('❌ Empty text in handleAutoSend');
    }
  }, [onQuestion]);

  const playBeep = () => {
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
      
      console.log('🔊 Played auto-send beep');
    } catch (error) {
      console.warn('Could not play beep sound:', error);
    }
  };

  // Clean up all timeouts and recognition
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up voice agent...');
    
    // Clear all timeouts
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Recognition already stopped');
      }
      recognitionRef.current = null;
    }
    
    setIsListening(false);
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    try {
      // First check permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      
      // Clean up any existing instance
      cleanup();
      
      // Initialize new recognition
      recognitionRef.current = initializeRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.start();
        console.log('🎤 Voice Agent started successfully');
        toast({
          title: "🎤 Voice Agent Active",
          description: "I'm always listening. Speak naturally and I'll auto-send quickly.",
        });
      }
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      toast({
        title: "Microphone access required",
        description: "Please allow microphone access to use voice features.",
        variant: "destructive",
      });
    }
  }, [initializeRecognition, toast, cleanup]);

  // Stop listening - COMPLETE stop, no auto-restart
  const stopListening = useCallback(() => {
    console.log('🛑 Stopping voice agent completely...');
    isMountedRef.current = false; // Prevent any restarts
    cleanup();
    
    toast({
      title: "🎤 Voice Agent Stopped",
      description: "Voice agent has been manually stopped.",
    });
  }, [cleanup, toast]);

  // Manual send function
  const manualSend = useCallback(() => {
    if (transcript.trim().length > 0) {
      console.log('📤 MANUALLY sending question:', transcript);
      onQuestion(transcript, true);
      setTranscript('');
      playBeep();
    } else {
      console.log('❌ No transcript for manual send');
      toast({
        title: "No text to send",
        description: "Please speak something first.",
        variant: "destructive",
      });
    }
  }, [transcript, onQuestion, toast]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Speech synthesis functions
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s?/g, '')
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/\n/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('🔊 Started speaking:', cleanText.substring(0, 100));
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('🔊 Finished speaking');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
      return utterance;
    }
    return null;
  }, []);

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      console.log('🔊 Speech stopped');
    }
  }, []);

  const pauseSpeech = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
      console.log('🔊 Speech paused');
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
      console.log('🔊 Speech resumed');
    }
  }, []);

  // Auto-start on component mount
  useEffect(() => {
    console.log('🎤 Voice Agent mounting - starting listening...');
    isMountedRef.current = true;
    startListening();
    
    return () => {
      console.log('🎤 Voice Agent unmounting - cleaning up...');
      isMountedRef.current = false; // Prevent any callbacks after unmount
      cleanup();
      stopSpeech();
    };
  }, [startListening, cleanup, stopSpeech]);

  return {
    isListening,
    isSpeaking,
    transcript,
    hasPermission,
    startListening,
    stopListening,
    toggleListening,
    manualSend,
    speakText,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    clearTranscript: () => setTranscript(''),
  };
};