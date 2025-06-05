
export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    type: 'task' | 'event';
    data: any;
  };
}
