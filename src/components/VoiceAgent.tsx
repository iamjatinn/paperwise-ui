import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Mic, 
  Square,
  Volume2,
  VolumeX,
  Pause,
  Play,
  MessageCircle,
  Send
} from 'lucide-react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { useToast } from '@/hooks/use-toast';

interface VoiceAgentProps {
  onQuestion: (question: string, useVoice: boolean) => void;
  disabled?: boolean;
}

// const VoiceAgent: React.FC<VoiceAgentProps> = ({ onQuestion, disabled = false }) => {
//   const { toast } = useToast();

//   const handleCommand = (command: string, text?: string) => {
//     console.log(`Executing command: ${command}`, text);
    
//     switch (command) {
//       case 'stop_listening':
//         stopListening();
//         break;
//       case 'stop_speech':
//         stopSpeech();
//         toast({
//           title: "⏹️ Stopped",
//           description: "Speech stopped",
//         });
//         break;
//       case 'pause':
//         pauseSpeech();
//         toast({
//           title: "⏸️ Paused", 
//           description: "Speech paused",
//         });
//         break;
//       case 'play':
//         resumeSpeech();
//         toast({
//           title: "▶️ Resumed",
//           description: "Speech resumed", 
//         });
//         break;
//       case 'summarize':
//         onQuestion("Please provide a comprehensive summary of this document", true);
//         break;
//       case 'explain':
//         onQuestion("Explain the main concepts and findings in simple terms", true);
//         break;
//       case 'what_about':
//         onQuestion("What is this document about?", true);
//         break;
//       case 'send':
//         manualSend();
//         break;
//       case 'clear':
//         clearTranscript();
//         toast({
//           title: "🗑️ Cleared",
//           description: "Transcript cleared",
//         });
//         break;
//       case 'help':
//         toast({
//           title: "🎤 Voice Commands",
//           description: "Say: 'stop' (speech), 'pause', 'play', 'summarize', 'explain', 'what is this about', 'send', 'stop listening' (deactivate), or ask any question",
//         });
//         break;
//     }
//   };

//   const {
//     isListening,
//     isSpeaking,
//     transcript,
//     hasPermission,
//     toggleListening,
//     stopListening,
//     manualSend,
//     speakText,
//     stopSpeech,
//     pauseSpeech,
//     resumeSpeech,
//     clearTranscript,
//   } = useVoiceAgent({
//     onQuestion,
//     onCommand: handleCommand,
//   });

//   // return (
//   //   <Card className="p-6 space-y-4">
//   //     <div className="flex items-center justify-between">
//   //       <h3 className="font-semibold flex items-center gap-2">
//   //         <MessageCircle className="w-5 h-5 text-primary" />
//   //         Voice Agent
//   //         {isListening && (
//   //           <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
//   //             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//   //             Always On
//   //           </span>
//   //         )}
//   //       </h3>
//   //     </div>

//   //     {/* Permission Status */}
//   //     {hasPermission === false && (
//   //       <Card className="p-3 bg-red-50 border-red-200">
//   //         <div className="flex items-center gap-2">
//   //           <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//   //           <span className="text-sm font-medium text-red-800">
//   //             Microphone access denied. Please allow microphone permissions in your browser settings.
//   //           </span>
//   //         </div>
//   //       </Card>
//   //     )}

//   //     {/* Status Display */}
//   //     <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
//   //       <div className="flex items-center justify-between">
//   //         <div className="flex items-center gap-3">
//   //           <div className={`w-3 h-3 rounded-full ${
//   //             isListening ? 'bg-green-500 animate-pulse' : 
//   //             isSpeaking ? 'bg-blue-500' : 'bg-red-500'
//   //           }`} />
//   //           <div>
//   //             <p className="text-sm font-medium">
//   //               {isListening ? '🎤 Always Listening' : 
//   //                isSpeaking ? '🔊 Speaking Response' : 
//   //                '❌ Not Listening'}
//   //             </p>
//   //             <p className="text-xs text-muted-foreground">
//   //               {hasPermission === false 
//   //                 ? 'Microphone permission required - check browser settings'
//   //                 : isListening ? 'Speak naturally - I auto-send after pauses' :
//   //                  isSpeaking ? 'Say "stop", "pause", or "play" to control' :
//   //                  'Click Start to activate voice agent'}
//   //             </p>
//   //           </div>
//   //         </div>
          
//   //         {/* Stop Button */}
//   //         {isListening && (
//   //           <Button
//   //             variant="destructive"
//   //             size="sm"
//   //             onClick={stopListening}
//   //             className="gap-2"
//   //           >
//   //             <Square className="w-4 h-4" />
//   //             Stop Agent
//   //           </Button>
//   //         )}
//   //       </div>
//   //     </div>

//   //     {/* Transcript Display */}
//   //     {transcript && (
//   //       <div className="space-y-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
//   //         <div className="flex items-center justify-between">
//   //           <p className="text-sm font-medium text-amber-800">You said:</p>
//   //           <div className="flex gap-1">
//   //             <Button
//   //               variant="outline"
//   //               size="sm"
//   //               onClick={() => speakText(transcript)}
//   //               className="h-8 w-8 p-0"
//   //             >
//   //               <Volume2 className="w-3 h-3" />
//   //             </Button>
//   //             <Button
//   //               variant="outline"
//   //               size="sm"
//   //               onClick={clearTranscript}
//   //             >
//   //               Clear
//   //             </Button>
//   //           </div>
//   //         </div>
//   //         <p className="text-sm text-amber-700">"{transcript}"</p>
          
//   //         {/* Manual Send Button */}
//   //         <div className="flex gap-2 pt-2">
//   //           <Button
//   //             onClick={manualSend}
//   //             size="sm"
//   //             className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600"
//   //           >
//   //             <Send className="w-4 h-4" />
//   //             Send Question Now
//   //           </Button>
//   //         </div>
          
//   //         {/* Auto-send Indicator */}
//   //         <div className="flex items-center gap-2 text-xs text-amber-600">
//   //           <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
//   //           <span>I'll auto-send when you pause speaking for 5 seconds</span>
//   //         </div>
//   //       </div>
//   //     )}

//   //     {/* Speech Controls */}
//   //     {isSpeaking && (
//   //       <Card className="p-3 bg-blue-50 border-blue-200">
//   //         <div className="flex items-center justify-between">
//   //           <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
//   //             <div className="flex gap-1">
//   //               <div className="w-1 h-3 bg-blue-500 rounded-full animate-bounce"></div>
//   //               <div className="w-1 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//   //               <div className="w-1 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//   //             </div>
//   //             AI is speaking your answer...
//   //           </span>
//   //           <div className="flex gap-1">
//   //             <Button
//   //               variant="outline"
//   //               size="sm"
//   //               onClick={pauseSpeech}
//   //               className="h-8 w-8 p-0"
//   //             >
//   //               <Pause className="w-3 h-3" />
//   //             </Button>
//   //             <Button
//   //               variant="outline"
//   //               size="sm"
//   //               onClick={resumeSpeech}
//   //               className="h-8 w-8 p-0"
//   //             >
//   //               <Play className="w-3 h-3" />
//   //             </Button>
//   //             <Button
//   //               variant="outline"
//   //               size="sm"
//   //               onClick={stopSpeech}
//   //               className="h-8 w-8 p-0"
//   //             >
//   //               <VolumeX className="w-3 h-3" />
//   //             </Button>
//   //           </div>
//   //         </div>
//   //       </Card>
//   //     )}

//   //     {/* Quick Actions */}
//   //     <div className="grid grid-cols-2 gap-2">
//   //       <Button
//   //         variant="outline"
//   //         size="sm"
//   //         onClick={() => onQuestion("What is this document about?", true)}
//   //         disabled={disabled || !isListening}
//   //       >
//   //         What is this?
//   //       </Button>
//   //       <Button
//   //         variant="outline"
//   //         size="sm"
//   //         onClick={() => onQuestion("Summarize the key points", true)}
//   //         disabled={disabled || !isListening}
//   //       >
//   //         Summarize
//   //       </Button>
//   //     </div>

//   //     {/* Voice Commands Help */}
//   //     <div className="pt-3 border-t">
//   //       <p className="text-sm font-medium mb-2">Voice Commands:</p>
//   //       <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
//   //         <span>• "Stop" (stops speech)</span>
//   //         <span>• "Pause" / "Play"</span>
//   //         <span>• "Summarize this"</span>
//   //         <span>• "What is this about?"</span>
//   //         <span>• "Explain simply"</span>
//   //         <span>• "Send" (send now)</span>
//   //         <span>• "Stop listening" (deactivate)</span>
//   //         <span>• Ask any question</span>
//   //       </div>
//   //       <p className="text-xs text-muted-foreground mt-2">
//   //         💡 <strong>Always listening</strong> - I auto-send when you pause speaking
//   //       </p>
//   //     </div>
//   //   </Card>
//   // );
// };

// Make sure this is the last line and it's a default export
//export default VoiceAgent;