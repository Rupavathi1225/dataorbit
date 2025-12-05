import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search, Globe, Users, Eye, MousePointer } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalSearches: 0,
    totalWebResults: 0,
    totalSessions: 0,
    totalPageViews: 0,
    totalClicks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [blogs, searches, results, sessions, events] = await Promise.all([
        supabase.from('blogs').select('id', { count: 'exact' }),
        supabase.from('related_searches').select('id', { count: 'exact' }),
        supabase.from('web_results').select('id', { count: 'exact' }),
        supabase.from('tracking_sessions').select('id', { count: 'exact' }),
        supabase.from('tracking_events').select('event_type'),
      ]);
      
      const pageViews = events.data?.filter(e => e.event_type === 'page_view').length || 0;
      const clicks = events.data?.filter(e => e.event_type !== 'page_view').length || 0;
      
      setStats({
        totalBlogs: blogs.count || 0,
        totalSearches: searches.count || 0,
        totalWebResults: results.count || 0,
        totalSessions: sessions.count || 0,
        totalPageViews: pageViews,
        totalClicks: clicks,
      });
    };
    
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Blogs', value: stats.totalBlogs, icon: FileText, color: 'bg-blue-500' },
    { label: 'Related Searches', value: stats.totalSearches, icon: Search, color: 'bg-green-500' },
    { label: 'Web Results', value: stats.totalWebResults, icon: Globe, color: 'bg-purple-500' },
    { label: 'Total Sessions', value: stats.totalSessions, icon: Users, color: 'bg-orange-500' },
    { label: 'Page Views', value: stats.totalPageViews, icon: Eye, color: 'bg-pink-500' },
    { label: 'Total Clicks', value: stats.totalClicks, icon: MousePointer, color: 'bg-teal-500' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
