
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/SimpleAuthContext"
import Index from "./pages/Index"
import SimpleLoginPage from "./pages/SimpleLoginPage"
import Dashboard from "./pages/Dashboard"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<SimpleLoginPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
