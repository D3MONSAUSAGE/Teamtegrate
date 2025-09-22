import { checklistInstanceService, ExecuteChecklistParams, VerifyChecklistParams } from '@/services/checklists';
import { z } from 'zod';

// Validation schemas
const ExecuteChecklistSchema = z.object({
  items: z.array(z.object({
    entryId: z.string().uuid(),
    executed_status: z.enum(['pass', 'fail', 'na']),
    value: z.any().optional(),
    note: z.string().max(2000).optional(),
    photo_urls: z.array(z.string().url()).optional(),
  })),
  submit: z.boolean(),
});

const VerifyChecklistSchema = z.object({
  items: z.array(z.object({
    entryId: z.string().uuid(),
    verified_status: z.enum(['pass', 'fail', 'na']),
  })),
  decision: z.enum(['approve', 'reject']),
  managerNote: z.string().max(2000).optional(),
});

/**
 * Get today's checklist summary
 */
export const getTodaySummary = async (orgId: string, teamId?: string) => {
  return await checklistInstanceService.getTodaySummary(orgId, teamId);
};

/**
 * List checklist instances for today
 */
export const listForToday = async (orgId: string, teamId?: string) => {
  return await checklistInstanceService.listForToday(orgId, teamId);
};

/**
 * Get checklist instance by ID
 */
export const getById = async (instanceId: string) => {
  return await checklistInstanceService.getById(instanceId);
};

/**
 * Execute checklist items and optionally submit
 */
export const executeChecklist = async (
  instanceId: string,
  body: z.infer<typeof ExecuteChecklistSchema>,
  actor: { id: string; name: string; email: string }
) => {
  // Validate input
  const validatedData = ExecuteChecklistSchema.parse(body);
  
  const params: ExecuteChecklistParams = {
    instanceId,
    items: validatedData.items,
    submit: validatedData.submit,
    actor
  };
  
  return await checklistInstanceService.execute(params);
};

/**
 * Verify checklist items and approve/reject
 */
export const verifyChecklist = async (
  instanceId: string,
  body: z.infer<typeof VerifyChecklistSchema>,
  actor: { id: string; name: string; email: string }
) => {
  // Validate input
  const validatedData = VerifyChecklistSchema.parse(body);
  
  const params: VerifyChecklistParams = {
    instanceId,
    items: validatedData.items,
    decision: validatedData.decision,
    managerNote: validatedData.managerNote,
    actor
  };
  
  return await checklistInstanceService.verify(params);
};

/**
 * Calculate progress for a checklist instance
 */
export const calculateProgress = (instance: any) => {
  return checklistInstanceService.calculateProgress(instance);
};

/**
 * Check if checklist is within time window
 */
export const isWithinTimeWindow = (instance: any) => {
  return checklistInstanceService.isWithinTimeWindow(instance);
};