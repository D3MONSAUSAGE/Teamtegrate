
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/SimpleAuthContext"
import Index from "./pages/Index"
import SimpleLoginPage from "./pages/SimpleLoginPage"
import DashboardPage from "./pages/DashboardPage"
import AppLayout from "./components/AppLayout"

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
              <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
