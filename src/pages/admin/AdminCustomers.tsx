import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setCustomers(data || []));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-sans">Customers ({customers.length})</h2>
      {customers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No customers yet.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
              <TableBody>
                {customers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name || 'Unnamed'}</TableCell>
                    <TableCell>{c.phone || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
