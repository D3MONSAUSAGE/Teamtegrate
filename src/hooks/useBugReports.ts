import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { BugReportFormData, SystemInfo } from '@/types/support';

export const useBugReports = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collectSystemInfo = (): SystemInfo => {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    
    // Simple browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Simple OS detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      browser,
      os,
      screen_resolution: `${screen.width}x${screen.height}`,
      user_agent: userAgent,
      current_page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };
  };

  const submitBugReport = async (formData: BugReportFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a bug report.",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      const systemInfo = collectSystemInfo();

      const { error } = await supabase
        .from('bug_reports')
        .insert({
          user_id: user.id,
          organization_id: user.organizationId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          steps_to_reproduce: formData.steps_to_reproduce || null,
          expected_behavior: formData.expected_behavior || null,
          actual_behavior: formData.actual_behavior || null,
          system_info: systemInfo as any,
        });

      if (error) {
        console.error('Error submitting bug report:', error);
        toast({
          title: "Error",
          description: "Failed to submit bug report. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Bug Report Submitted",
        description: "Thank you for your feedback! We'll review your report and get back to you soon.",
      });

      return true;
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitBugReport,
    isSubmitting,
  };
};