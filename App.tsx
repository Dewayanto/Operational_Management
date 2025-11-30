
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { 
  Mic, Settings, Activity, 
  Layout, Play, Square, AlertCircle, FileUp, Loader, CheckCircle, PieChart
} from 'lucide-react';
import { AppLevel, ToolType, InfographicData } from './types';
import { getSystemInstruction, toolsDeclarations } from './constants';
import { createPcmBlob, decodeAudioData } from './utils/audioUtils';

// Tools Components
import InfographicView from './components/Tools/InfographicView';
import Visualizer from './components/Visualizer';

const App: React.FC = () => {
  // State
  const [level, setLevel] = useState<AppLevel>(AppLevel.INTERMEDIATE);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.DASHBOARD);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<string>("Ready");
  const [error, setError] = useState<string | null>(null);
  
  // File Upload State
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Infographic Data State
  const [infographicData, setInfographicData] = useState<InfographicData>({
    title: "Operations Dashboard",
    summary: "Ready to analyze operational data. Upload a document or start speaking to generate insights.",
    metrics: [],
    processFlow: [],
    chartData: [],
    chartTitle: "Key Metrics"
  });
  
  // Refs for Audio & AI
  const isLiveRef = useRef(false); 
  const fileContextRef = useRef<string | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Helper to clean JSON string from Markdown
  const cleanJson = (text: string) => {
    let clean = text.trim();
    // Robustly remove markdown code blocks
    clean = clean.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    return clean.trim();
  };

  // Initialize Output Audio Context
  const initOutputAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 // Output rate for Gemini
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Helper: File to Base64 (for PDFs)
  const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  // Handle File Upload and Generate Initial Infographic
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setError(null);
    setFileName(file.name);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contentParts = [];

      // 1. Prepare Content
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
        const textContent = await file.text();
        contentParts = [
          { text: `[FILE CONTENT: ${file.name}]\n${textContent}` },
        ];
      } else {
        const filePart = await fileToGenerativePart(file);
        contentParts = [
          filePart,
        ];
      }

      // 2. Define Schema for Infographic Extraction
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ['up', 'down', 'neutral'] }
              }
            }
          },
          processFlow: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          chartTitle: { type: Type.STRING },
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          }
        },
        required: ["title", "summary", "metrics", "processFlow"]
      };

      // 3. Call GenerateContent (REST) to get initial analysis JSON
      const model = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            ...contentParts,
            { text: "Analyze this document for Operations Management context. Extract key data into the specified JSON structure to build an infographic." }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema
        }
      });

      const response = await model;
      const textResponse = response.text || "{}";
      
      // 4. Update UI with new Infographic safely
      try {
        const cleanedText = cleanJson(textResponse);
        const newInfographic = JSON.parse(cleanedText) as InfographicData;
        
        // Ensure arrays exist even if API returns null/undefined
        newInfographic.metrics = newInfographic.metrics || [];
        newInfographic.processFlow = newInfographic.processFlow || [];
        newInfographic.chartData = newInfographic.chartData || [];
        
        setInfographicData(newInfographic);
        setActiveTool(ToolType.INFOGRAPHIC);
        
        // Store plain text summary for Live Context
        fileContextRef.current = `User uploaded ${file.name}. \nSummary: ${newInfographic.summary}\nMetrics: ${JSON.stringify(newInfographic.metrics)}`;
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        setError("Failed to process document visualization. However, the text was read.");
        // We still set file context even if viz fails
        fileContextRef.current = `User uploaded ${file.name}. The visual generation failed, but the document is ready for discussion.`;
      }
      
      setIsProcessingFile(false);

      // 5. Reconnect Live Session if active to inject context
      if (isLiveRef.current) {
        setStatus("Updating Context...");
        disconnect();
        setTimeout(() => {
          connectToLive();
        }, 800);
      }

    } catch (err) {
      console.error(err);
      setError("Analysis failed. Ensure file is readable and API key is valid.");
      setIsProcessingFile(false);
      setFileName(null);
      fileContextRef.current = null;
    }
  };

  // Connect to Gemini Live API
  const connectToLive = async () => {
    setError(null);
    setStatus("Connecting...");
    setIsConnecting(true);
    
    try {
      initOutputAudioContext();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputContextRef.current = inputCtx;
      
      const source = inputCtx.createMediaStreamSource(stream);
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      inputAnalyserRef.current = analyser;

      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (e) => {
        if (!isLiveRef.current) return; 

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        sessionPromiseRef.current?.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      let finalInstruction = getSystemInstruction(level);
      if (fileContextRef.current) {
        finalInstruction += `\n\n[CONTEXT UPDATE]\n${fileContextRef.current}`;
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } 
          },
          systemInstruction: finalInstruction,
          tools: [{ functionDeclarations: toolsDeclarations }],
        },
        callbacks: {
          onopen: () => {
            setStatus("Connected");
            isLiveRef.current = true;
            setIsLive(true);
            setIsConnecting(false);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
               playAudioChunk(base64Audio);
            }

            if (msg.toolCall) {
              const responses = [];
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'updateInfographic') {
                  // Safe access to args
                  const args = (fc.args || {}) as any;
                  console.log("Updating infographic:", args);
                  
                  // Update Infographic State safely with fallback
                  setInfographicData(prev => ({
                    title: args.title || prev.title,
                    summary: args.summary || prev.summary,
                    metrics: args.metrics || prev.metrics || [],
                    processFlow: args.processFlow || prev.processFlow || [],
                    chartData: args.chartData || prev.chartData || [],
                    chartTitle: args.chartTitle || prev.chartTitle
                  }));
                  
                  setActiveTool(ToolType.INFOGRAPHIC);

                  responses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { result: "Infographic updated on user screen." }
                  });
                }
              }

              if (responses.length > 0) {
                 sessionPromiseRef.current?.then(session => {
                   session.sendToolResponse({
                     functionResponses: responses
                   });
                 });
              }
            }
          },
          onclose: () => {
            setStatus("Disconnected");
            isLiveRef.current = false;
            setIsLive(false);
            setIsConnecting(false);
          },
          onerror: (err) => {
            console.error("Live Error:", err);
            // Don't crash app on error, just log and reset state
            setStatus("Connection Interrupted");
            isLiveRef.current = false;
            setIsLive(false);
            setIsConnecting(false);
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setError("Failed to connect. Please check permissions.");
      setStatus("Error");
      isLiveRef.current = false;
      setIsLive(false);
      setIsConnecting(false);
    }
  };

  const playAudioChunk = async (base64: string) => {
    if (!audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const rawData = atob(base64);
      const bytes = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);

      const buffer = await decodeAudioData(bytes, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const start = Math.max(now, nextStartTimeRef.current);
      source.start(start);
      nextStartTimeRef.current = start + buffer.duration;
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const disconnect = () => {
    // 1. Immediate UI Update
    isLiveRef.current = false;
    setIsLive(false);
    setStatus("Stopped");
    
    // 2. Async Cleanup
    setTimeout(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
      }
      
      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => {
           try {
             session.close();
           } catch(e) { console.log("Session close error", e) }
        });
        sessionPromiseRef.current = null;
      }
    }, 0);
  };

  const toggleLive = () => {
    if (isLiveRef.current) {
      disconnect();
    } else {
      connectToLive();
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-16 md:w-20 bg-slate-900 text-white flex flex-col items-center py-6 gap-6 z-20">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
          <Activity size={24} />
        </div>
        
        <div className="flex-1 flex flex-col gap-4 w-full items-center">
           <button 
             onClick={() => setActiveTool(ToolType.DASHBOARD)}
             className={`p-3 rounded-xl transition-all ${activeTool === ToolType.DASHBOARD ? 'bg-slate-700 text-blue-400' : 'text-slate-400 hover:text-white'}`}
             title="Home Dashboard"
           >
             <Layout size={20} />
           </button>
           
           <button 
             onClick={() => setActiveTool(ToolType.INFOGRAPHIC)}
             className={`p-3 rounded-xl transition-all ${activeTool === ToolType.INFOGRAPHIC ? 'bg-slate-700 text-blue-400' : 'text-slate-400 hover:text-white'}`}
             title="Visual Infographic"
           >
             <PieChart size={20} />
           </button>

           <div className="w-10 h-px bg-slate-700 my-2"></div>
           
           {/* Upload Button */}
           <label className="cursor-pointer p-3 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all relative group">
              <input 
                type="file" 
                accept="application/pdf,text/plain,text/csv,text/x-csv,application/vnd.ms-excel,application/json" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isProcessingFile}
              />
              {isProcessingFile ? (
                <Loader size={20} className="animate-spin text-emerald-500" />
              ) : fileName ? (
                <div className="relative">
                  <FileUp size={20} className="text-emerald-500"/>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                </div>
              ) : (
                <FileUp size={20} />
              )}
           </label>
        </div>

        <div className="mb-4">
           <Settings size={20} className="text-slate-500 hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">DEWAYANTO <span className="text-slate-400 font-light">| OPS ANALYTICS</span></h1>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <p className="text-xs text-slate-500 font-medium">{status}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
               {(Object.keys(AppLevel) as Array<keyof typeof AppLevel>).map((lvlKey) => (
                 <button
                   key={lvlKey}
                   onClick={() => setLevel(AppLevel[lvlKey])}
                   disabled={isLive}
                   className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${level === AppLevel[lvlKey] ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'} ${isLive ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   {AppLevel[lvlKey]}
                 </button>
               ))}
            </div>
          </div>
        </header>

        {/* Dynamic Tool Content */}
        <main className="flex-1 overflow-hidden relative">
          {error && (
            <div className="absolute top-6 right-6 z-50 bg-red-100 text-red-700 px-4 py-2 rounded-lg border border-red-200 shadow-sm flex items-center gap-2">
               <AlertCircle size={16} /> {error}
            </div>
          )}

          {activeTool === ToolType.DASHBOARD && (
             <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto p-6">
               <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100">
                 <h2 className="text-3xl font-bold text-slate-800 mb-3">Operational Intelligence Agent</h2>
                 <p className="text-slate-600 mb-8 text-lg">
                   I analyze operational data and visualize it instantly. 
                   <br/>Upload a report (PDF/CSV) or start speaking to build your dashboard.
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setActiveTool(ToolType.INFOGRAPHIC)}>
                      <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><PieChart size={18} className="text-blue-500"/> Visual Infographics</h3>
                      <p className="text-sm text-slate-500">Auto-generated charts, process maps, and key metrics from your data.</p>
                    </div>
                    <label className="p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept="application/pdf,text/plain,text/csv,text/x-csv,application/vnd.ms-excel,application/json" 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                      <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><FileUp size={18} className="text-emerald-500"/> Upload Data</h3>
                      <p className="text-sm text-slate-500">I will extract the numbers and visualize them for you immediately.</p>
                    </label>
                 </div>

                 {fileName && (
                   <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 flex items-center gap-3">
                     <CheckCircle size={20} />
                     <span className="font-medium">"{fileName}" analyzed. Check the Infographic tab.</span>
                   </div>
                 )}
               </div>
             </div>
          )}
          
          {activeTool === ToolType.INFOGRAPHIC && <InfographicView data={infographicData} />}

        </main>

        {/* Live Audio Control Bar */}
        <div className="h-24 bg-white border-t px-6 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
           <div className="flex items-center gap-5 flex-1">
              <button 
                onClick={toggleLive}
                disabled={isConnecting}
                className={`flex items-center justify-center w-14 h-14 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${isLive ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {isConnecting ? (
                  <Loader size={22} className="animate-spin" />
                ) : (
                  isLive ? <Square size={22} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1"/>
                )}
              </button>
              
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800">
                  {isLive ? "Professor is listening..." : "Start Consultation"}
                </span>
                <span className="text-xs text-slate-500">
                  {isLive ? "Discussing & Updating Infographics..." : "Click play to analyze your data"}
                </span>
              </div>
           </div>

           {/* Audio Visualizer */}
           <div className="w-1/3 h-12 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden relative">
              <Visualizer analyser={inputAnalyserRef.current} isActive={isLive} />
              {!isLive && <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">Microphone Inactive</div>}
           </div>

           <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                <Mic size={12} />
                <span>Voice: Charon (55yo)</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default App;
