import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminBlogs from "./AdminBlogs";
import AdminRelatedSearches from "./AdminRelatedSearches";
import AdminWebResults from "./AdminWebResults";
import AdminAnalytics from "./AdminAnalytics";
import AdminPreLanding from "./AdminPreLanding";

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("blogs");
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">DO</span>
              </div>
              <span className="font-bold text-foreground">DataOrbit Admin</span>
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              View Site
            </Link>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
            <TabsTrigger value="related-searches">Related Searches</TabsTrigger>
            <TabsTrigger value="web-results">Web Results</TabsTrigger>
            <TabsTrigger value="pre-landing">Pre-Landing Pages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="blogs" className="mt-0">
            <AdminBlogs />
          </TabsContent>
          
          <TabsContent value="related-searches" className="mt-0">
            <AdminRelatedSearches />
          </TabsContent>
          
          <TabsContent value="web-results" className="mt-0">
            <AdminWebResults />
          </TabsContent>
          
          <TabsContent value="pre-landing" className="mt-0">
            <AdminPreLanding />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminLayout;