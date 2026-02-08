import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AddressManager from '@/components/AddressManager';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    setEmail(user.email || '');
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated successfully!' });
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
      <h1 className="text-3xl font-display font-bold mb-8">My Profile</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm">Email</Label>
              <Input value={email} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Full Name</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter your Mobile Number" />
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" /> My Addresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddressManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
