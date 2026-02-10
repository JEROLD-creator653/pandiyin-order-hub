import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, MapPin, Pencil, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import CountryCodeSelect, { getMaxPhoneLength } from './CountryCodeSelect';
import { fetchPincodeDetails } from '@/lib/pincodeApi';
import {
  normalizePhoneNumber,
  splitPhoneIfContainsCountryCode,
  debounce,
} from '@/lib/addressHelpers';

export interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  area?: string | null;
  city: string;
  district?: string | null;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface AddressManagerProps {
  onSelect?: (address: Address) => void;
  selectable?: boolean;
  selectedId?: string | null;
}

const emptyForm = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  area: '',
  city: 'Madurai',
  district: '',
  state: 'Tamil Nadu',
  pincode: '',
};

export default function AddressManager({
  onSelect,
  selectable = false,
  selectedId,
}: AddressManagerProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [countryCode, setCountryCode] = useState('+91');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const pincodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    setAddresses(data || []);
  };

  useEffect(() => {
    load();
  }, [user]);

  useEffect(() => {
    if (selectable && onSelect && addresses.length > 0 && !selectedId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      onSelect(def);
    }
  }, [selectable, onSelect, addresses, selectedId]);

  // Debounced pincode lookup
  const handlePincodeChange = useCallback((pincode: string) => {
    setForm((f) => ({ ...f, pincode }));

    // Clear previous timeout
    if (pincodeTimeoutRef.current) {
      clearTimeout(pincodeTimeoutRef.current);
    }

    // Only fetch if exactly 6 digits
    if (pincode.length !== 6) {
      return;
    }

    setPincodeLoading(true);

    // Debounce 300ms
    pincodeTimeoutRef.current = setTimeout(async () => {
      const result = await fetchPincodeDetails(pincode);

      if (result) {
        setForm((f) => ({
          ...f,
          area: result.area,
          city: result.city,
          district: result.district,
          state: result.state,
        }));
      } else {
        toast({
          title: 'Invalid pincode',
          description: 'Could not find location for this pincode',
          variant: 'destructive',
        });
      }

      setPincodeLoading(false);
    }, 300);
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setCountryCode('+91');
    setDialogOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);

    // Split phone number to separate country code and phone digits
    const { countryCode: code, phoneNumber } =
      splitPhoneIfContainsCountryCode(a.phone);

    setCountryCode(code);

    setForm({
      full_name: a.full_name,
      phone: phoneNumber, // Store only digits, no country code
      address_line1: a.address_line1,
      address_line2: a.address_line2 || '',
      area: a.area || '',
      city: a.city,
      district: a.district || '',
      state: a.state,
      pincode: a.pincode,
    });

    setDialogOpen(true);
  };

  const save = async () => {
    if (
      !user ||
      !form.full_name ||
      !form.phone ||
      !form.address_line1 ||
      !form.pincode
    ) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const maxLen = getMaxPhoneLength(countryCode);

    // Normalize phone to digits only
    const phoneDigitsOnly = normalizePhoneNumber(form.phone, countryCode);

    // Validate phone length
    if (phoneDigitsOnly.length > maxLen) {
      toast({
        title: `Phone number too long for ${countryCode}`,
        variant: 'destructive',
      });
      return;
    }

    // Store separately: countryCode and phoneNumber (digits only)
    const payload = {
      full_name: form.full_name,
      phone: phoneDigitsOnly, // Only digits, no country code
      address_line1: form.address_line1,
      address_line2: form.address_line2,
      area: form.area || null,
      city: form.city,
      district: form.district || null,
      state: form.state,
      pincode: form.pincode,
      user_id: user.id,
      is_default: addresses.length === 0,
    };

    try {
      if (editing) {
        await supabase.from('addresses').update(payload).eq('id', editing.id);
        toast({ title: 'Address updated' });
      } else {
        await supabase.from('addresses').insert(payload);
        toast({ title: 'Address saved' });
      }
      setDialogOpen(false);
      load();
    } catch (error) {
      toast({
        title: 'Error saving address',
        variant: 'destructive',
      });
      console.error(error);
    }
  };

  const remove = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    toast({ title: 'Address removed' });
    load();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id);
    toast({ title: 'Default address updated' });
    load();
  };

  const selectAddress = (a: Address) => {
    if (onSelect) onSelect(a);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Saved Addresses
        </h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={openNew}
              className="gap-1 rounded-full text-xs"
            >
              <Plus className="h-3 w-3" /> Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Address' : 'Add Address'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Full Name *</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Phone *</Label>
                <div className="flex items-center">
                  <CountryCodeSelect value={countryCode} onChange={setCountryCode}/>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="rounded-l-none h-12 text-sm bg-background focus-visible:ring-2 focus-visible:ring-green-700/40 focus-visible:ring-offset-0 outline-none"
                    placeholder="9876543210"
                    maxLength={getMaxPhoneLength(countryCode)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Address Line 1 *</Label>
                <Input
                  value={form.address_line1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address_line1: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Address Line 2</Label>
                <Input
                  value={form.address_line2}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address_line2: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Pincode *</Label>
                <div className="relative">
                  <Input
                    value={form.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    maxLength={6}
                    placeholder="625001"
                  />
                  {pincodeLoading && (
                    <Loader2 className="h-3 w-3 animate-spin absolute right-2 top-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Area / Village */}
              <div className="space-y-1">
                <Label className="text-xs">Area / Village</Label>
                <div className="relative">
                  <Input
                    value={form.area}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, area: e.target.value }))
                    }
                    disabled={pincodeLoading}
                  />
                  {pincodeLoading && (
                    <Loader2 className="h-3 w-3 animate-spin absolute right-2 top-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* City / Taluk */}
              <div className="space-y-1">
                <Label className="text-xs">City / Taluk</Label>
                <div className="relative">
                  <Input
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    disabled={pincodeLoading}
                  />
                  {pincodeLoading && (
                    <Loader2 className="h-3 w-3 animate-spin absolute right-2 top-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* District */}
              <div className="space-y-1">
                <Label className="text-xs">District</Label>
                <div className="relative">
                  <Input
                    value={form.district}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, district: e.target.value }))
                    }
                    disabled={pincodeLoading}
                  />
                  {pincodeLoading && (
                    <Loader2 className="h-3 w-3 animate-spin absolute right-2 top-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* State */}
              <div className="space-y-1">
                <Label className="text-xs">State</Label>
                <div className="relative">
                  <Input
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                    disabled={pincodeLoading}
                  />
                  {pincodeLoading && (
                    <Loader2 className="h-3 w-3 animate-spin absolute right-2 top-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              <Button onClick={save} className="w-full">
                {editing ? 'Update' : 'Save'} Address
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          No saved addresses yet. Add one for quick checkout!
        </p>
      )}

      <div className="grid gap-2">
        {addresses.map((a) => {
          const isSelected = selectedId === a.id;
          return (
            <Card
              key={a.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectable ? 'hover:border-primary' : ''
              } ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`}
              onClick={() => selectable && selectAddress(a)}
            >
              <CardContent className="p-3 flex items-start gap-3">
                {selectable && (
                  <div
                    className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {a.full_name}
                    </span>
                    {a.is_default && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {a.address_line1}
                    {a.address_line2 ? `, ${a.address_line2}` : ''}, {a.city} -{' '}
                    {a.pincode}
                  </p>
                  <p className="text-xs text-muted-foreground">+91 {a.phone}</p>
                </div>
                <div
                  className="flex gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!a.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDefault(a.id)}
                      title="Set as default"
                    >
                      <MapPin className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => remove(a.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
