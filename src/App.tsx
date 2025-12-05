import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import BlogPage from "./pages/BlogPage";
import WebResultsPage from "./pages/WebResultsPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/blog/:categorySlug/:slug" element={<BlogPage />} />
          <Route path="/wr=:page" element={<WebResultsPage />} />
          
          {/* Admin Route - Single page with tabs */}
          <Route path="/admin" element={<AdminLayout />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;