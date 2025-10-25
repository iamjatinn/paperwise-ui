import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Square, 
  Volume2,
  MessageCircle
} from 'lucide-react';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';
import { useToast } from '@/hooks/use-toast';

interface VoiceInterfaceProps {
  onQuestion?: (question: string) => void;
  onCommand?: (command: string) => void;
  onAutoStop?: () => void;
  disabled?: boolean;
  compact?: boolean;
  continuous?: boolean;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onQuestion,
  onCommand,
  onAutoStop,
  disabled = false,
  compact = false,
  continuous = false
}) => {
  const { toast } = useToast();

  const handleTranscript = (text: string) => {
    console.log('Voice transcript:', text);
    
    if (onQuestion && text.trim().length > 2) {
      onQuestion(text);
    }
  };

  const handleCommand = (command: string) => {
    console.log('Voice command:', command);
    onCommand?.(command);
    
    if (command === 'ask' && transcript) {
      onQuestion?.(transcript);
    }
  };

  const {
    isListening,
    isSupported,
    transcript,
    toggleListening,
    stopListening,
    clearTranscript
  } = useVoiceInterface({
    onTranscript: handleTranscript,
    onCommand: handleCommand,
    onAutoStop: onAutoStop,
    continuous: continuous
  });

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
      
      toast({
        title: "🔊 Speaking response",
        description: "Playing audio response...",
      });
    } else {
      toast({
        title: "Text-to-speech not supported",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive",
      });
    }
  };

  if (!isSupported && !compact) {
    return (
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-800">
          🎤 Voice interface not supported in your browser. 
          Try Chrome, Edge, or Safari for voice features.
        </p>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={() => toggleListening(continuous)}
          disabled={disabled}
          className={`relative ${
            isListening 
              ? 'animate-pulse bg-red-500 text-white border-red-500' 
              : ''
          }`}
        >
          {isListening ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
        
        {transcript && (
          <div className="flex-1 text-sm text-muted-foreground truncate">
            "{transcript}"
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Voice Interface
        </h3>
        
        <div className="flex gap-2">
          <Button
            variant={isListening ? "destructive" : "default"}
            onClick={() => toggleListening(continuous)}
            disabled={disabled}
            className="gap-2"
          >
            {isListening ? (
              <>
                <Square className="w-4 h-4" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Voice
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTextToSpeech("Hello! I'm ready to help you analyze your documents. Try saying 'What is this document about?' or 'Summarize the key points.'")}
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Voice Status */}
      {isListening && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <div className="flex gap-1">
            <div className="w-2 h-6 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm font-medium text-primary">Listening... Speak now</span>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">You said:</p>
            <Button variant="ghost" size="sm" onClick={clearTranscript}>
              Clear
            </Button>
          </div>
          <Card className="p-3 bg-accent">
            <p className="text-sm">"{transcript}"</p>
          </Card>
          
          {onQuestion && (
            <Button 
              onClick={() => onQuestion(transcript)}
              className="w-full"
            >
              Ask This Question
            </Button>
          )}
        </div>
      )}

      {/* Voice Commands Help */}
      <div className="pt-4 border-t">
        <p className="text-sm font-medium mb-2">Try saying:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Card className="p-2 bg-accent/50">
            <span className="font-medium">"What is this about"</span>
          </Card>
          <Card className="p-2 bg-accent/50">
            <span className="font-medium">"Summarize key points"</span>
          </Card>
          <Card className="p-2 bg-accent/50">
            <span className="font-medium">"Explain the main findings"</span>
          </Card>
          <Card className="p-2 bg-accent/50">
            <span className="font-medium">"Show me sources"</span>
          </Card>
          {continuous && (
            <>
              <Card className="p-2 bg-accent/50">
                <span className="font-medium">"Stop"</span>
              </Card>
              <Card className="p-2 bg-accent/50">
                <span className="font-medium">"Pause" / "Play"</span>
              </Card>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default VoiceInterface;