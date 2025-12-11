import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Download, Copy, CheckCircle, XCircle } from "lucide-react";

interface RelatedSearch {
  id: string;
  title: string;
  position: number;
  blog_id: string;
  web_result_page: number;
  blogs: { title: string; slug: string } | null;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
}

const AdminRelatedSearches = () => {
  const { toast } = useToast();
  const [searches, setSearches] = useState<RelatedSearch[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<RelatedSearch | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    blog_id: '',
    position: '1',
    web_result_page: '1',
  });

  const fetchData = async () => {
    const [searchesRes, blogsRes] = await Promise.all([
      supabase.from('related_searches').select('*, blogs(title, slug)').order('created_at', { ascending: false }),
      supabase.from('blogs').select('id, title, slug').order('title'),
    ]);
    
    if (searchesRes.data) setSearches(searchesRes.data as RelatedSearch[]);
    if (blogsRes.data) setBlogs(blogsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchData = {
      title: formData.title,
      blog_id: formData.blog_id,
      position: parseInt(formData.position),
      web_result_page: parseInt(formData.web_result_page),
    };
    
    if (editingSearch) {
      const { error } = await supabase
        .from('related_searches')
        .update(searchData)
        .eq('id', editingSearch.id);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Related search updated successfully' });
        setIsDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('related_searches').insert(searchData);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Related search created successfully' });
        setIsDialogOpen(false);
        fetchData();
      }
    }
    
    resetForm();
  };

  const handleEdit = (search: RelatedSearch) => {
    setEditingSearch(search);
    setFormData({
      title: search.title,
      blog_id: search.blog_id,
      position: search.position.toString(),
      web_result_page: search.web_result_page.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this related search?')) return;
    
    const { error } = await supabase.from('related_searches').delete().eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Related search deleted successfully' });
      setSelectedIds(prev => prev.filter(i => i !== id));
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', blog_id: '', position: '1', web_result_page: '1' });
    setEditingSearch(null);
  };

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.length === searches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(searches.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const copyLinks = () => {
    const selectedSearches = searches.filter(s => selectedIds.includes(s.id));
    const links = selectedSearches.map(s => `${getBaseUrl()}/wr/${s.id}`).join('\n');
    navigator.clipboard.writeText(links);
    toast({ title: 'Copied', description: `${selectedSearches.length} link(s) copied to clipboard` });
  };

  const exportCSV = (all: boolean) => {
    const dataToExport = all ? searches : searches.filter(s => selectedIds.includes(s.id));
    const headers = ['Title', 'Blog', 'Page', 'Position', 'Link'];
    const rows = dataToExport.map(s => [
      s.title,
      s.blogs?.title || '',
      s.web_result_page,
      s.position,
      `${getBaseUrl()}/wr/${s.id}`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `related_searches_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Exported', description: `${dataToExport.length} related search(es) exported` });
  };

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} related search(es)?`)) return;
    const { error } = await supabase.from('related_searches').delete().in('id', selectedIds);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${selectedIds.length} related search(es) deleted` });
      setSelectedIds([]);
      fetchData();
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Related Searches</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Related Search</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSearch ? 'Edit Related Search' : 'Add Related Search'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Blog *</label>
                <Select value={formData.blog_id} onValueChange={(v) => setFormData({ ...formData, blog_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select blog" /></SelectTrigger>
                  <SelectContent>
                    {blogs.map((blog) => (
                      <SelectItem key={blog.id} value={blog.id}>{blog.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Title (visible to users)</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g., Best Social Media Platforms 2024"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Web Result Page (1-4)</label>
                  <Select value={formData.web_result_page} onValueChange={(v) => setFormData({ ...formData, web_result_page: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Page 1</SelectItem>
                      <SelectItem value="2">Page 2</SelectItem>
                      <SelectItem value="3">Page 3</SelectItem>
                      <SelectItem value="4">Page 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Position (1-4)</label>
                  <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Position 1</SelectItem>
                      <SelectItem value="2">Position 2</SelectItem>
                      <SelectItem value="3">Position 3</SelectItem>
                      <SelectItem value="4">Position 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingSearch ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.length} of {searches.length} selected</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <Button variant="outline" size="sm" onClick={() => exportCSV(true)}>
              <Download className="w-4 h-4 mr-1" />Export All CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(false)}>
              <Download className="w-4 h-4 mr-1" />Export Selected ({selectedIds.length})
            </Button>
            <Button variant="outline" size="sm" onClick={copyLinks}>
              <Copy className="w-4 h-4 mr-1" />Copy
            </Button>
            <Button variant="destructive" size="sm" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />Delete ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 w-12">
                  <Checkbox 
                    checked={selectedIds.length === searches.length && searches.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Title</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Blog</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Page</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Position</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {searches.map((search) => (
                <tr key={search.id} className="border-t border-border">
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedIds.includes(search.id)}
                      onCheckedChange={() => toggleSelect(search.id)}
                    />
                  </td>
                  <td className="p-4 text-sm text-foreground">{search.title}</td>
                  <td className="p-4 text-sm text-muted-foreground">{search.blogs?.title || '-'}</td>
                  <td className="p-4 text-sm text-muted-foreground">Page {search.web_result_page}</td>
                  <td className="p-4 text-sm text-muted-foreground">{search.position}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(search)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(search.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRelatedSearches;