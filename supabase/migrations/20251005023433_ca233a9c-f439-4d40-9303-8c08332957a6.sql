-- Enable full row replication for real-time updates
ALTER TABLE time_entries REPLICA IDENTITY FULL;

-- Add time_entries to real-time publication so WebSocket subscriptions receive events
ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;