/**
 * Admin Banners Management Page
 * Features:
 * - Create banners with image upload
 * - List all banners
 * - Toggle banner active/inactive status
 * - Delete banner with automatic storage cleanup
 * - Drag & drop support
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ImageUpload';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadAndSaveBanner,
  deleteBanner,
} from '@/lib/imageUpload';
import { useAuth } from '@/hooks/useAuth';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  image_path: string;
  link_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function AdminBanners() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);
  const [togglingBannerId, setTogglingBannerId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    link_url: '',
    is_active: true,
    sort_order: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch banners
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      toast.error('Failed to fetch banners');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBanner = async () => {
    if (!formData.title) {
      toast.error('Banner title is required');
      return;
    }

    if (!selectedFile) {
      toast.error('Please upload an image');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsUploadingImage(true);
      await uploadAndSaveBanner(
        selectedFile,
        {
          title: formData.title,
          subtitle: formData.subtitle,
          link_url: formData.link_url,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        },
        user.id
      );

      toast.success('Banner created successfully');
      setIsCreateOpen(false);
      resetForm();
      await fetchBanners();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create banner';
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string, imagePath: string) => {
    try {
      await deleteBanner(bannerId, imagePath);
      toast.success('Banner deleted successfully');
      setDeletingBannerId(null);
      await fetchBanners();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete banner';
      toast.error(message);
    }
  };

  const handleToggleBannerStatus = async (
    bannerId: string,
    currentStatus: boolean
  ) => {
    try {
      setTogglingBannerId(bannerId);
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !currentStatus })
        .eq('id', bannerId);

      if (error) throw error;

      toast.success(
        `Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      );
      await fetchBanners();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    } finally {
      setTogglingBannerId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      link_url: '',
      is_active: true,
      sort_order: 0,
    });
    setSelectedFile(null);
    setUploadKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Banners</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
            <DialogHeader>
              <DialogTitle>Create Banner</DialogTitle>
              <DialogDescription>
                Upload an image and add banner details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Banner Image *
                </label>
                <ImageUpload
                  key={uploadKey}
                  onImageSelect={(file) => setSelectedFile(file)}
                  disabled={isUploadingImage}
                  label="Upload Banner Image"
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Title *
                </label>
                <Input
                  placeholder="Banner title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Subtitle
                </label>
                <Input
                  placeholder="Banner subtitle (optional)"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                />
              </div>

              {/* Link URL */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Link URL
                </label>
                <Input
                  placeholder="/products (optional)"
                  value={formData.link_url}
                  onChange={(e) =>
                    setFormData({ ...formData, link_url: e.target.value })
                  }
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sort Order
                </label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isUploadingImage}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBanner}
                  disabled={isUploadingImage || !selectedFile || !formData.title}
                  className="gap-2"
                >
                  {isUploadingImage && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create Banner
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Banner List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No banners yet. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="h-16 w-24 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {banner.title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {banner.link_url || '-'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={() =>
                            handleToggleBannerStatus(banner.id, banner.is_active)
                          }
                          disabled={togglingBannerId === banner.id}
                        />
                      </TableCell>
                      <TableCell>{banner.sort_order}</TableCell>
                      <TableCell className="flex gap-2">
                        <AlertDialog
                          open={deletingBannerId === banner.id}
                          onOpenChange={(open) => {
                            if (!open) setDeletingBannerId(null);
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingBannerId(banner.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete the banner and its image from storage.
                              This action cannot be undone.
                            </AlertDialogDescription>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteBanner(banner.id, banner.image_path)
                                }
                                className="bg-destructive"
                              >
                                Delete
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
