import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Video, 
  BookOpen, 
  HelpCircle, 
  Users, 
  Target, 
  Clock,
  CheckCircle,
  Play
} from 'lucide-react';

interface StepContent {
  text?: string;
  videoUrl?: string;
  questions?: Array<{
    question: string;
    options: string[];
    correct: number;
  }>;
}

interface Step {
  id: number;
  title: string;
  type: string;
  status: string;
  duration: string;
  content?: StepContent;
  notes?: string;
}

interface StepContentModalProps {
  step: Step | null;
  open: boolean;
  onClose: () => void;
  onComplete: (stepId: number, notes?: string) => void;
  onStart: (stepId: number) => void;
}

const stepTypeIcons = {
  document: FileText,
  video: Video,
  course: BookOpen,
  quiz: HelpCircle,
  meeting: Users,
  task: Target,
};

export function StepContentModal({ step, open, onClose, onComplete, onStart }: StepContentModalProps) {
  const [notes, setNotes] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [isCompleting, setIsCompleting] = useState(false);

  if (!step) return null;

  const IconComponent = stepTypeIcons[step.type as keyof typeof stepTypeIcons] || Target;

  const handleStart = () => {
    onStart(step.id);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    onComplete(step.id, notes || undefined);
    setIsCompleting(false);
    setNotes('');
    setQuizAnswers({});
    onClose();
  };

  const renderStepContent = () => {
    switch (step.type) {
      case 'document':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Document Content</h4>
              <p className="text-sm text-muted-foreground">
                {step.content?.text || 
                  "This is a sample document content. In a real implementation, this would display the actual document content, PDF viewer, or downloadable file."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              Read and review the document above
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Video Player Placeholder
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.content?.videoUrl || "sample-video.mp4"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              Watch the complete video
            </div>
          </div>
        );

      case 'course':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Course Module</h4>
              <p className="text-sm text-muted-foreground mb-3">
                This course covers essential topics for your role. Please review all sections carefully.
              </p>
              <div className="space-y-2">
                {['Introduction', 'Key Concepts', 'Best Practices', 'Summary'].map((section, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{section}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'quiz':
        const questions = step.content?.questions || [
          {
            question: "What is the primary goal of this onboarding process?",
            options: ["Learn company policies", "Meet team members", "Complete paperwork", "All of the above"],
            correct: 3
          }
        ];

        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-4">Knowledge Check</h4>
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="space-y-3">
                  <p className="font-medium">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((option, oIndex) => (
                      <label key={oIndex} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'meeting':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Meeting Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Type:</strong> Virtual Meeting</div>
                <div><strong>Duration:</strong> {step.duration}</div>
                <div><strong>Attendees:</strong> You, Manager, HR Representative</div>
                <div><strong>Agenda:</strong> Role overview, expectations, Q&A</div>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Meeting link will be sent via email. Please join on time and prepare any questions you may have.
              </p>
            </div>
          </div>
        );

      case 'task':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Task Instructions</h4>
              <p className="text-sm text-muted-foreground">
                Complete the following task as part of your onboarding process. This may involve submitting information, 
                completing forms, or other administrative tasks.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Review task requirements</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                <span>Complete required actions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                <span>Submit completion confirmation</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Step content will be displayed here based on the step type.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {step.title}
                <Badge variant="outline" className="text-xs capitalize">
                  {step.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                <Clock className="w-3 h-3" />
                {step.duration}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {renderStepContent()}

          {(step.status === 'in_progress' || step.status === 'completed') && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments about this step..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {step.status === 'completed' ? 'Close' : 'Cancel'}
          </Button>
          
          <div className="flex items-center gap-2">
            {step.status === 'available' && (
              <Button onClick={handleStart}>
                Start Step
              </Button>
            )}
            
            {step.status === 'in_progress' && (
              <Button onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? 'Completing...' : 'Mark Complete'}
              </Button>
            )}
            
            {step.status === 'completed' && (
              <Button onClick={handleComplete} variant="outline" disabled={isCompleting}>
                {isCompleting ? 'Updating...' : 'Update Notes'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}