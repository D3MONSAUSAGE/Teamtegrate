import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useCreateQuizOverride, useUpdateQuizOverride } from '@/hooks/useQuizOverrides';

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
  const [overrideScore, setOverrideScore] = useState(
    existingOverride?.override_score?.toString() || '0'
  );
  const [reason, setReason] = useState(existingOverride?.reason || '');

  const createMutation = useCreateQuizOverride();
  const updateMutation = useUpdateQuizOverride();

  const isEditing = !!existingOverride;
  const maxPoints = question?.points || 1;
  const originalScore = userAnswer?.score || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const scoreValue = parseInt(overrideScore);
    
    if (!overrideScore || isNaN(scoreValue) || scoreValue < 0 || scoreValue > maxPoints) {
      console.error('Invalid override score:', overrideScore);
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      console.error('Reason must be at least 5 characters');
      return;
    }

    if (!question?.id || !quizAttemptId) {
      console.error('Missing required data for override');
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
      if (isEditing) {
        await updateMutation.mutateAsync({
          overrideId: existingOverride.id,
          updates: {
            override_score: scoreValue,
            reason: reason.trim()
          }
        });
      } else {
        await createMutation.mutateAsync(overrideData);
      }
      
      // Reset form and close dialog
      onOpenChange(false);
      setOverrideScore('0');
      setReason('');
    } catch (error) {
      console.error('Error applying override:', error);
      // Error is already handled by the mutation hooks
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setOverrideScore(existingOverride?.override_score?.toString() || '0');
    setReason(existingOverride?.reason || '');
  };

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-100">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>
                {isEditing ? 'Edit Manual Override' : 'Manual Answer Override'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Override the automated scoring for this question
              </p>
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
                  isNaN(parseInt(overrideScore)) ||
                  parseInt(overrideScore) < 0 ||
                  parseInt(overrideScore) > maxPoints
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