import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

interface RelatedSearch {
  id: string;
  title: string;
  position: number;
  blog_id: string;
  blogs: { title: string } | null;
}

interface Blog {
  id: string;
  title: string;
}

const AdminRelatedSearches = () => {
  const { toast } = useToast();
  const [searches, setSearches] = useState<RelatedSearch[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<RelatedSearch | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    blog_id: '',
    position: '1',
  });

  const fetchData = async () => {
    const [searchesRes, blogsRes] = await Promise.all([
      supabase.from('related_searches').select('*, blogs(title)').order('created_at', { ascending: false }),
      supabase.from('blogs').select('id, title').order('title'),
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
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', blog_id: '', position: '1' });
    setEditingSearch(null);
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
              <DialogTitle>{editingSearch ? 'Edit Related Search' : 'Create New Related Search'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Select Blog</label>
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
                <label className="text-sm font-medium text-foreground">Search Title</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Position</label>
                <Input type="number" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} min="1" />
              </div>
              <Button type="submit" className="w-full">{editingSearch ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-foreground">Title</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Blog</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Position</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {searches.map((search) => (
                <tr key={search.id} className="border-t border-border">
                  <td className="p-4 text-sm text-foreground">{search.title}</td>
                  <td className="p-4 text-sm text-muted-foreground">{search.blogs?.title || '-'}</td>
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
