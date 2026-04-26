import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";

type SettingsRow = {
  business_name: string;
  phone: string;
  location: string;
  delivery_fee_kes: number;
  delivery_estimate: string;
  pickup_estimate: string;
  announcement_enabled: boolean;
  announcement_message: string;
  announcement_bg_color: string;
};

export default function AdminSettings() {
  const qc = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq('id', 'global').single();
      if (error) throw error;
      return data as SettingsRow;
    },
  });

  const [form, setForm] = useState<SettingsRow | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { error } = await supabase.from('site_settings').update(form).eq('id', 'global');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
      alert("Settings saved successfully!");
    },
    onError: (err) => {
      alert("Error saving settings: " + err.message);
    }
  });

  if (isLoading || !form) {
    return <AdminLayout><div className="p-8">Loading settings...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage global store configuration</p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic details about the bakery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input 
                value={form.business_name} 
                onChange={e => setForm({...form, business_name: e.target.value})} 
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
              />
            </div>
            <div>
              <Label>Physical Location</Label>
              <Input 
                value={form.location} 
                onChange={e => setForm({...form, location: e.target.value})} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order & Delivery</CardTitle>
            <CardDescription>Logistics and fulfillment settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Delivery Fee (KES)</Label>
              <Input 
                type="number"
                value={form.delivery_fee_kes} 
                onChange={e => setForm({...form, delivery_fee_kes: Number(e.target.value)})} 
              />
            </div>
            <div>
              <Label>Delivery Time Estimate</Label>
              <Input 
                value={form.delivery_estimate} 
                onChange={e => setForm({...form, delivery_estimate: e.target.value})} 
                placeholder="e.g. 45-90 minutes"
              />
            </div>
            <div>
              <Label>Pickup Time Estimate</Label>
              <Input 
                value={form.pickup_estimate} 
                onChange={e => setForm({...form, pickup_estimate: e.target.value})} 
                placeholder="e.g. 30-60 minutes"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Announcement Banner</CardTitle>
            <CardDescription>Show a dismissible banner at the top of the website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch 
                checked={form.announcement_enabled}
                onCheckedChange={v => setForm({...form, announcement_enabled: v})}
              />
              <Label>Enable Banner</Label>
            </div>
            {form.announcement_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Message</Label>
                  <Input 
                    value={form.announcement_message} 
                    onChange={e => setForm({...form, announcement_message: e.target.value})} 
                    placeholder="e.g. 20% off all wedding cakes this weekend!"
                  />
                </div>
                <div>
                  <Label>Background Color (Tailwind class)</Label>
                  <Input 
                    value={form.announcement_bg_color} 
                    onChange={e => setForm({...form, announcement_bg_color: e.target.value})} 
                    placeholder="e.g. bg-primary, bg-destructive, bg-black"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
