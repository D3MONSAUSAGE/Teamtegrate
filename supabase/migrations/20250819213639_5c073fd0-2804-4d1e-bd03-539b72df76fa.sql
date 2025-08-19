-- Create schedule management system tables

-- Schedule Templates table
CREATE TABLE public.schedule_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shift Templates table
CREATE TABLE public.shift_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    template_id UUID REFERENCES public.schedule_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
    max_employees INTEGER DEFAULT 1,
    min_employees INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Employee Schedules table
CREATE TABLE public.employee_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    shift_template_id UUID REFERENCES public.shift_templates(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'missed', 'excused'
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(employee_id, scheduled_date, scheduled_start_time)
);

-- Schedule Periods table
CREATE TABLE public.schedule_periods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shift Swap Requests table
CREATE TABLE public.shift_swap_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    schedule_id UUID REFERENCES public.employee_schedules(id) ON DELETE CASCADE,
    target_employee_id UUID,
    target_schedule_id UUID REFERENCES public.employee_schedules(id) ON DELETE CASCADE,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'cancelled'
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Employee Availability table
CREATE TABLE public.employee_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for schedule_templates
CREATE POLICY "Users can view schedule templates in their organization"
ON public.schedule_templates FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage schedule templates"
ON public.schedule_templates FOR ALL
USING (
    organization_id = get_current_user_organization_id() 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
    )
);

-- Create RLS policies for shift_templates
CREATE POLICY "Users can view shift templates in their organization"
ON public.shift_templates FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage shift templates"
ON public.shift_templates FOR ALL
USING (
    organization_id = get_current_user_organization_id() 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
    )
);

-- Create RLS policies for employee_schedules
CREATE POLICY "Users can view schedules in their organization"
ON public.employee_schedules FOR SELECT
USING (
    organization_id = get_current_user_organization_id() 
    AND (
        employee_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin', 'superadmin')
        )
    )
);

CREATE POLICY "Managers can manage employee schedules"
ON public.employee_schedules FOR ALL
USING (
    organization_id = get_current_user_organization_id() 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
    )
);

CREATE POLICY "Employees can update their actual times"
ON public.employee_schedules FOR UPDATE
USING (
    organization_id = get_current_user_organization_id() 
    AND employee_id = auth.uid()
)
WITH CHECK (
    organization_id = get_current_user_organization_id() 
    AND employee_id = auth.uid()
);

-- Create RLS policies for schedule_periods
CREATE POLICY "Users can view schedule periods in their organization"
ON public.schedule_periods FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage schedule periods"
ON public.schedule_periods FOR ALL
USING (
    organization_id = get_current_user_organization_id() 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
    )
);

-- Create RLS policies for shift_swap_requests
CREATE POLICY "Users can view relevant shift swap requests"
ON public.shift_swap_requests FOR SELECT
USING (
    organization_id = get_current_user_organization_id() 
    AND (
        requester_id = auth.uid() 
        OR target_employee_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin', 'superadmin')
        )
    )
);

CREATE POLICY "Employees can create shift swap requests"
ON public.shift_swap_requests FOR INSERT
WITH CHECK (
    organization_id = get_current_user_organization_id() 
    AND requester_id = auth.uid()
);

CREATE POLICY "Employees can update their swap requests"
ON public.shift_swap_requests FOR UPDATE
USING (
    organization_id = get_current_user_organization_id() 
    AND (
        requester_id = auth.uid() 
        OR target_employee_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin', 'superadmin')
        )
    )
);

-- Create RLS policies for employee_availability
CREATE POLICY "Users can view availability in their organization"
ON public.employee_availability FOR SELECT
USING (
    organization_id = get_current_user_organization_id() 
    AND (
        employee_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin', 'superadmin')
        )
    )
);

CREATE POLICY "Employees can manage their availability"
ON public.employee_availability FOR ALL
USING (
    organization_id = get_current_user_organization_id() 
    AND employee_id = auth.uid()
);

CREATE POLICY "Managers can manage all availability"
ON public.employee_availability FOR ALL
USING (
    organization_id = get_current_user_organization_id() 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
    )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_schedule_templates_updated_at
    BEFORE UPDATE ON public.schedule_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_templates_updated_at
    BEFORE UPDATE ON public.shift_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_schedules_updated_at
    BEFORE UPDATE ON public.employee_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_periods_updated_at
    BEFORE UPDATE ON public.schedule_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_swap_requests_updated_at
    BEFORE UPDATE ON public.shift_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_availability_updated_at
    BEFORE UPDATE ON public.employee_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_employee_schedules_employee_date ON public.employee_schedules(employee_id, scheduled_date);
CREATE INDEX idx_employee_schedules_organization ON public.employee_schedules(organization_id);
CREATE INDEX idx_shift_swap_requests_requester ON public.shift_swap_requests(requester_id);
CREATE INDEX idx_shift_swap_requests_target ON public.shift_swap_requests(target_employee_id);
CREATE INDEX idx_employee_availability_employee ON public.employee_availability(employee_id, day_of_week);