
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

interface ChatbotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define specific responses for common user questions
const COMMON_QUERIES = {
  'create task': [
    "To create a new task, click the 'New Task' button at the top of the Dashboard page. You can also create tasks directly from the Calendar or Projects page.",
    "Creating a task is easy! Click the '+' button or 'New Task' button on the dashboard, then fill in the task details like title, description, deadline, and priority."
  ],
  'calendar': [
    "You can switch between day, week, and month views in the calendar using the view selector at the top of the calendar page.",
    "To see your tasks in the calendar, navigate to the Calendar page from the sidebar menu."
  ],
  'deadline': [
    "To set a task deadline, use the date picker in the task creation form. You can also edit deadlines later by clicking on a task and updating its details."
  ],
  'priority': [
    "Tasks can be set to Low, Medium, or High priority when creating or editing a task. You can filter tasks by priority in the Tasks page."
  ],
  'project': [
    "To create a new project, go to the Projects page and click the 'New Project' button.",
    "You can add tasks to projects when creating a new task or by editing an existing task and selecting a project from the dropdown."
  ],
  'assign': [
    "To assign a task to a team member, open the task details and click on the 'Assign' button."
  ],
  'help': [
    "I can help you with creating tasks, managing your calendar, working with projects, and more. What would you like assistance with?"
  ]
};

// Fallback responses for when no specific match is found
const FALLBACK_RESPONSES = [
  "I'm here to help you manage your tasks and projects. Could you ask more specifically about tasks, calendar, or project management?",
  "I can assist with task creation, calendar management, project organization, and team coordination. What would you like to know more about?",
  "If you're looking for help with a specific feature, try asking about tasks, calendar, projects, or team management."
];

const ChatbotDialog: React.FC<ChatbotDialogProps> = ({ open, onOpenChange }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your TaskAssistant AI. How can I help you with your tasks and calendar today?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Find a relevant response based on user input
  const findRelevantResponse = (userInput: string): string => {
    const lowercaseInput = userInput.toLowerCase();
    
    // Check for keyword matches
    for (const [keyword, responses] of Object.entries(COMMON_QUERIES)) {
      if (lowercaseInput.includes(keyword)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // Return fallback response if no match
    return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Generate AI response based on user input
    setTimeout(() => {
      const relevantResponse = findRelevantResponse(userMessage.content);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: relevantResponse,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            TaskAssistant AI
          </DialogTitle>
          <DialogDescription className="sr-only">
            Chat with TaskAssistant AI to get help with your tasks and calendar
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 h-[50vh]">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {message.role === 'user' ? (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        U
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          AI
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg p-3 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your calendar or tasks..."
            className="resize-none min-h-[80px]"
          />
          <Button onClick={handleSend} className="self-end" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotDialog;
