import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useCreateQuizOverride, useUpdateQuizOverride } from '@/hooks/useQuizOverrides';
import { useToast } from '@/hooks/use-toast';
import { enhancedNotifications } from '@/utils/enhancedNotifications';

interface QuizOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: any;
  userAnswer: any;
  quizAttemptId: string;
  existingOverride?: any;
}

const QuizOverrideDialog: React.FC<QuizOverrideDialogProps> = ({
  open,
  onOpenChange,
  question,
  userAnswer,
  quizAttemptId,
  existingOverride
}) => {
  const [overrideScore, setOverrideScore] = useState('0');
  const [reason, setReason] = useState('');

  const createMutation = useCreateQuizOverride();
  const updateMutation = useUpdateQuizOverride();
  const { toast } = useToast();

  const isEditing = !!existingOverride?.id;
  const maxPoints = question?.points || 1;
  const originalScore = userAnswer?.score || 0;

  // Enhanced state management with better validation
  useEffect(() => {
    console.log('🔧 Override Dialog State Update:', {
      open,
      isEditing,
      existingOverride,
      question: question?.id,
      userAnswer: userAnswer?.answer
    });

    if (open) {
      // Reset form when dialog opens
      if (existingOverride?.id) {
        console.log('📝 Loading existing override:', existingOverride);
        setOverrideScore(existingOverride.override_score?.toString() || '0');
        setReason(existingOverride.reason || '');
      } else {
        console.log('✨ Setting up new override');
        setOverrideScore('0');
        setReason('');
      }
    }
  }, [open, existingOverride]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Starting override submission:', {
      isEditing,
      overrideScore,
      reason: reason.trim(),
      questionId: question?.id,
      quizAttemptId,
      existingOverrideId: existingOverride?.id
    });
    
    // Enhanced validation with detailed logging
    const scoreValue = parseInt(overrideScore);
    
    if (!overrideScore || isNaN(scoreValue) || scoreValue < 0 || scoreValue > maxPoints) {
      console.error('❌ Invalid override score:', { overrideScore, scoreValue, maxPoints });
      enhancedNotifications.error('Invalid score value. Please enter a number between 0 and ' + maxPoints);
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      console.error('❌ Reason validation failed:', { reason: reason.trim(), length: reason.trim().length });
      enhancedNotifications.error('Please provide a detailed justification (minimum 5 characters)');
      return;
    }

    if (!question?.id || !quizAttemptId) {
      console.error('❌ Missing required data:', { questionId: question?.id, quizAttemptId });
      enhancedNotifications.error('Missing required question or attempt information');
      return;
    }

    // Validate existing override for updates
    if (isEditing && !existingOverride?.id) {
      console.error('❌ Edit mode but no valid existing override:', existingOverride);
      enhancedNotifications.error('Cannot update override: Invalid override data');
      return;
    }

    const overrideData = {
      quiz_attempt_id: quizAttemptId,
      question_id: question.id,
      original_score: originalScore,
      override_score: scoreValue,
      reason: reason.trim()
    };

    try {
      if (isEditing && existingOverride?.id) {
        console.log('📝 Updating existing override:', {
          overrideId: existingOverride.id,
          oldScore: existingOverride.override_score,
          newScore: scoreValue,
          oldReason: existingOverride.reason?.substring(0, 50) + '...',
          newReason: reason.trim().substring(0, 50) + '...'
        });
        
        await updateMutation.mutateAsync({
          overrideId: existingOverride.id,
          updates: {
            override_score: scoreValue,
            reason: reason.trim()
          }
        });
        
        console.log('✅ Override updated successfully');
        enhancedNotifications.success('Quiz override updated successfully!');
      } else {
        console.log('✨ Creating new override:', overrideData);
        
        await createMutation.mutateAsync(overrideData);
        
        console.log('✅ Override created successfully');
        enhancedNotifications.success('Quiz override applied successfully!');
      }
      
      // Reset form and close dialog
      console.log('🔄 Resetting form and closing dialog');
      onOpenChange(false);
      setOverrideScore('0');
      setReason('');
    } catch (error: any) {
      console.error('💥 Error applying override:', error);
      
      // Extract detailed error information
      const errorDetails = {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        originalError: error
      };
      
      console.error('💥 Detailed error information:', errorDetails);
      
      // Show enhanced error message
      let errorMessage = 'Failed to apply override. ';
      
      if (error?.message?.includes('RLS')) {
        errorMessage += 'Permission denied. Please check your access rights.';
      } else if (error?.message?.includes('duplicate')) {
        errorMessage += 'An override already exists for this question.';
      } else if (error?.code) {
        errorMessage += `Database error (${error.code}): ${error.message}`;
      } else {
        errorMessage += error?.message || 'Please try again.';
      }
      
      enhancedNotifications.error(errorMessage, {
        description: error?.hint || 'If this problem persists, please contact support.',
        duration: 8000
      });
    }
  };

  const handleCancel = () => {
    console.log('❌ Cancel override dialog');
    onOpenChange(false);
    // Reset to original values or empty for new override
    if (existingOverride?.id) {
      setOverrideScore(existingOverride.override_score?.toString() || '0');
      setReason(existingOverride.reason || '');
    } else {
      setOverrideScore('0');
      setReason('');
    }
  };

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-labelledby="override-dialog-title">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-100">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle id="override-dialog-title">
                {isEditing ? 'Edit Manual Override' : 'Manual Answer Override'}
              </DialogTitle>
              <DialogDescription>
                Override the automated scoring for this question with manual evaluation and justification.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Banner */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Manual override will replace automatic scoring. Justification required.
            </p>
          </div>

          {/* Question Context */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Question</Label>
              <p className="text-sm bg-gray-50 p-2 rounded border">
                {question.question_text}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Student's Answer</Label>
                <p className="text-sm bg-red-50 p-2 rounded border border-red-200">
                  {userAnswer?.answer || 'No answer provided'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Correct Answer</Label>
                <p className="text-sm bg-green-50 p-2 rounded border border-green-200">
                  {question.correct_answer}
                </p>
              </div>
            </div>

            {/* Current Scoring */}
            <div className="flex items-center gap-4 p-2 bg-gray-50 rounded border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current:</span>
                <Badge variant={originalScore > 0 ? "default" : "destructive"}>
                  {originalScore} / {maxPoints} pts
                </Badge>
                {originalScore > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              {existingOverride && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">
                    Override: {existingOverride.override_score} / {maxPoints} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Override Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="override-score">
                New Score (0 - {maxPoints} points)
              </Label>
              <Input
                id="override-score"
                type="number"
                min="0"
                max={maxPoints}
                value={overrideScore}
                onChange={(e) => setOverrideScore(e.target.value)}
                placeholder="Enter new score"
                required
              />
            </div>

            <div>
              <Label htmlFor="override-reason">
                Justification (Required)
              </Label>
              <Textarea
                id="override-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're overriding the automatic score..."
                rows={2}
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={
                  createMutation.isPending || 
                  updateMutation.isPending ||
                  !reason.trim() ||
                  reason.trim().length < 5 ||
                  isNaN(parseInt(overrideScore)) ||
                  parseInt(overrideScore) < 0 ||
                  parseInt(overrideScore) > maxPoints ||
                  (isEditing && !existingOverride?.id)
                }
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? 'Applying...' 
                  : isEditing 
                    ? 'Update Override' 
                    : 'Apply Override'
                }
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizOverrideDialog;