// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import DocumentViewer from "./pages/DocumentViewer";
import Comparison from "./pages/Comparison";
import NotFound from "./pages/NotFound";
import MultiDocumentQA from "./pages/MultiDocumentQA";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/document/:id" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />
              <Route path="/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
              <Route path="/multi-qa" element={
                  <ProtectedRoute>
                    <MultiDocumentQA />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;