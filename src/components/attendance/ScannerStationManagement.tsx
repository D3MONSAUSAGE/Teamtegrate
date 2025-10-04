import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MapPin, Monitor, Wifi, WifiOff, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ScannerStationManagement: React.FC = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStation, setNewStation] = useState({
    station_name: '',
    location: ''
  });

  useEffect(() => {
    if (user) {
      fetchStations();
    }
  }, [user]);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_scanner_stations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStations(data || []);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      toast.error('Failed to load scanner stations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStation = async () => {
    if (!newStation.station_name || !newStation.location) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('qr_scanner_stations')
        .insert({
          organization_id: user?.organizationId,
          station_name: newStation.station_name,
          location: newStation.location,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Scanner station created successfully');
      setStations([data, ...stations]);
      setDialogOpen(false);
      setNewStation({ station_name: '', location: '' });
    } catch (error) {
      console.error('Failed to create station:', error);
      toast.error('Failed to create scanner station');
    }
  };

  const toggleStationStatus = async (stationId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('qr_scanner_stations')
        .update({ is_active: !currentStatus })
        .eq('id', stationId);

      if (error) throw error;

      toast.success(`Station ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchStations();
    } catch (error) {
      console.error('Failed to toggle station:', error);
      toast.error('Failed to update station status');
    }
  };

  const getScannerUrl = (stationId: string) => {
    return `${window.location.origin}/scanner-station?station=${stationId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading stations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Scanner Stations
            </CardTitle>
            <CardDescription>
              Manage wall-mounted QR scanner stations for attendance tracking
            </CardDescription>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Station
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Scanner Station</DialogTitle>
                <DialogDescription>
                  Register a new wall-mounted scanner station
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="station-name">Station Name</Label>
                  <Input
                    id="station-name"
                    placeholder="e.g., Main Entrance, Warehouse Floor"
                    value={newStation.station_name}
                    onChange={(e) => setNewStation({ ...newStation, station_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Physical Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Building A - Floor 1, Near Break Room"
                    value={newStation.location}
                    onChange={(e) => setNewStation({ ...newStation, location: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateStation} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Station
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {stations.length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">No Scanner Stations</p>
            <p className="text-sm text-muted-foreground">
              Add your first scanner station to enable QR-based attendance
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {stations.map((station) => (
              <Card key={station.id} className="border-l-4 border-l-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Monitor className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{station.station_name}</h3>
                          <Badge variant={station.is_active ? 'secondary' : 'outline'} className={station.is_active ? 'bg-success/10 text-success border-success/20' : ''}>
                            {station.is_active ? (
                              <><Wifi className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><WifiOff className="h-3 w-3 mr-1" /> Inactive</>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {station.location}
                        </div>

                        {station.last_scan_at && (
                          <p className="text-xs text-muted-foreground">
                            Last scan: {new Date(station.last_scan_at).toLocaleString()}
                          </p>
                        )}

                        {/* Scanner URL */}
                        <div className="flex items-center gap-2 mt-2">
                          <Input 
                            value={getScannerUrl(station.id)} 
                            readOnly 
                            className="text-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(getScannerUrl(station.id))}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(getScannerUrl(station.id), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={station.is_active ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleStationStatus(station.id, station.is_active)}
                    >
                      {station.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};