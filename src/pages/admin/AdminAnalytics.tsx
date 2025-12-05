import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Users, MousePointer, Mail, FileText, Search } from "lucide-react";

interface Event {
  id: string;
  session_id: string;
  event_type: string;
  ip_address: string | null;
  device: string | null;
  country: string | null;
  page_url: string | null;
  created_at: string;
  blog_id: string | null;
  related_search_id: string | null;
  web_result_id: string | null;
  blogs?: { title: string } | null;
  related_searches?: { title: string } | null;
  web_results?: { title: string } | null;
}

interface BreakdownItem {
  name: string;
  total_clicks: number;
  unique_clicks: number;
}

const AdminAnalytics = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    uniqueSessions: 0,
    uniqueIPs: 0,
    totalEmails: 0,
    pageViews: 0,
    blogClicks: 0,
    relatedSearchClicks: 0,
    visitNowClicks: 0,
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownType, setBreakdownType] = useState<'blog' | 'related_search'>('blog');
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [sessionsRes, eventsRes, emailsRes] = await Promise.all([
        supabase.from('tracking_sessions').select('session_id, ip_address'),
        supabase.from('tracking_events').select('*, blogs(title), related_searches(title), web_results(title)').order('created_at', { ascending: false }).limit(100),
        supabase.from('email_submissions').select('id', { count: 'exact' }),
      ]);
      
      const sessions = sessionsRes.data || [];
      const allEvents = eventsRes.data || [];
      
      const uniqueSessionIds = new Set(sessions.map(s => s.session_id));
      const uniqueIPs = new Set(sessions.map(s => s.ip_address).filter(Boolean));
      
      const pageViews = allEvents.filter(e => e.event_type === 'page_view').length;
      const blogClicks = allEvents.filter(e => e.event_type === 'blog_click').length;
      const relatedSearchClicks = allEvents.filter(e => e.event_type === 'related_search_click').length;
      const visitNowClicks = allEvents.filter(e => e.event_type === 'visit_now_click').length;
      
      setStats({
        totalSessions: sessions.length,
        uniqueSessions: uniqueSessionIds.size,
        uniqueIPs: uniqueIPs.size,
        totalEmails: emailsRes.count || 0,
        pageViews,
        blogClicks,
        relatedSearchClicks,
        visitNowClicks,
      });
      
      setEvents(allEvents as Event[]);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const openBreakdown = async (type: 'blog' | 'related_search') => {
    setBreakdownType(type);
    setShowBreakdown(true);
    
    const eventType = type === 'blog' ? 'blog_click' : 'related_search_click';
    const field = type === 'blog' ? 'blog_id' : 'related_search_id';
    
    const { data: eventsData } = await supabase
      .from('tracking_events')
      .select(`${field}, ip_address`)
      .eq('event_type', eventType);
    
    if (!eventsData) return;
    
    // Get names
    const ids = [...new Set(eventsData.map(e => e[field as keyof typeof e]).filter(Boolean))];
    const tableName = type === 'blog' ? 'blogs' : 'related_searches';
    
    const { data: items } = await supabase
      .from(tableName)
      .select('id, title')
      .in('id', ids as string[]);
    
    const itemMap = new Map((items || []).map(i => [i.id, i.title]));
    
    // Calculate breakdown
    const breakdownMap = new Map<string, { total: number; uniqueIPs: Set<string> }>();
    
    eventsData.forEach(event => {
      const id = event[field as keyof typeof event] as string;
      if (!id) return;
      
      if (!breakdownMap.has(id)) {
        breakdownMap.set(id, { total: 0, uniqueIPs: new Set() });
      }
      
      const item = breakdownMap.get(id)!;
      item.total++;
      if (event.ip_address) item.uniqueIPs.add(event.ip_address);
    });
    
    const breakdownData: BreakdownItem[] = Array.from(breakdownMap.entries()).map(([id, data]) => ({
      name: itemMap.get(id) || id,
      total_clicks: data.total,
      unique_clicks: data.uniqueIPs.size,
    })).sort((a, b) => b.total_clicks - a.total_clicks);
    
    setBreakdown(breakdownData);
  };

  const statCards = [
    { label: 'Total Sessions', value: stats.totalSessions, icon: Users },
    { label: 'Unique Sessions', value: stats.uniqueSessions, icon: Users },
    { label: 'Unique IPs', value: stats.uniqueIPs, icon: Users },
    { label: 'Total Emails', value: stats.totalEmails, icon: Mail },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Session Analytics</h1>
      
      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Click Stats with Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-muted-foreground text-xs">Page Views</p>
                <p className="text-xl font-bold text-foreground">{stats.pageViews}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-muted-foreground text-xs">Blog Clicks</p>
                <p className="text-xl font-bold text-foreground">{stats.blogClicks}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => openBreakdown('blog')}>View</Button>
          </div>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-muted-foreground text-xs">Related Search Clicks</p>
                <p className="text-xl font-bold text-foreground">{stats.relatedSearchClicks}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => openBreakdown('related_search')}>View</Button>
          </div>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <MousePointer className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-muted-foreground text-xs">Visit Now Clicks</p>
              <p className="text-xl font-bold text-foreground">{stats.visitNowClicks}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Breakdown Dialog */}
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{breakdownType === 'blog' ? 'Blog' : 'Related Search'} Click Breakdown</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Name</th>
                  <th className="text-right p-3 text-sm font-medium">Total Clicks</th>
                  <th className="text-right p-3 text-sm font-medium">Unique Clicks</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 text-sm">{item.name}</td>
                    <td className="p-3 text-sm text-right">{item.total_clicks}</td>
                    <td className="p-3 text-sm text-right">{item.unique_clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Recent Events */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-foreground">Event</th>
                <th className="text-left p-3 text-xs font-medium text-foreground">Session</th>
                <th className="text-left p-3 text-xs font-medium text-foreground">IP</th>
                <th className="text-left p-3 text-xs font-medium text-foreground">Device</th>
                <th className="text-left p-3 text-xs font-medium text-foreground">Country</th>
                <th className="text-left p-3 text-xs font-medium text-foreground">Page</th>
                <th className="text-left p-3 text-xs font-medium text-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 50).map((event) => (
                <tr key={event.id} className="border-t border-border">
                  <td className="p-3 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      event.event_type === 'page_view' ? 'bg-blue-500/20 text-blue-600' :
                      event.event_type === 'blog_click' ? 'bg-green-500/20 text-green-600' :
                      event.event_type === 'related_search_click' ? 'bg-purple-500/20 text-purple-600' :
                      'bg-orange-500/20 text-orange-600'
                    }`}>
                      {event.event_type}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground font-mono">{event.session_id?.slice(0, 12)}...</td>
                  <td className="p-3 text-xs text-muted-foreground">{event.ip_address || '-'}</td>
                  <td className="p-3 text-xs text-muted-foreground">{event.device || '-'}</td>
                  <td className="p-3 text-xs text-muted-foreground">{event.country || '-'}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-32 truncate">{event.page_url || '-'}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
