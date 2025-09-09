import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Trash2, GripVertical, Eye } from 'lucide-react';
import { useAssignmentRules } from '@/hooks/requests/useAssignmentRules';
import { AssignmentRuleEditor } from './AssignmentRuleEditor';
import { AssignmentRulePreview } from './AssignmentRulePreview';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';

interface AssignmentRulesManagerProps {
  requestTypeId: string;
  requestTypeName: string;
}

export const AssignmentRulesManager: React.FC<AssignmentRulesManagerProps> = ({
  requestTypeId,
  requestTypeName
}) => {
  const { rules, loading, createRule, updateRule, deleteRule, reorderRules } = useAssignmentRules(requestTypeId);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewRule, setPreviewRule] = useState<any>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedRules = Array.from(rules);
    const [movedRule] = reorderedRules.splice(result.source.index, 1);
    reorderedRules.splice(result.destination.index, 0, movedRule);

    reorderRules(reorderedRules);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowEditor(true);
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    setShowEditor(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this assignment rule?')) {
      await deleteRule(ruleId);
    }
  };

  const handleSaveRule = async (ruleData: any) => {
    let success = false;
    
    if (editingRule) {
      success = await updateRule(editingRule.id, ruleData);
    } else {
      success = await createRule({
        ...ruleData,
        request_type_id: requestTypeId
      });
    }

    if (success) {
      setShowEditor(false);
      setEditingRule(null);
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'role_based': return 'bg-blue-100 text-blue-800';
      case 'job_role_based': return 'bg-green-100 text-green-800';
      case 'team_hierarchy': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'first_available': return 'bg-blue-50 text-blue-700';
      case 'load_balanced': return 'bg-green-50 text-green-700';
      case 'expertise_based': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assignment Rules</CardTitle>
              <CardDescription>
                Configure how requests for "{requestTypeName}" are automatically assigned to approvers
              </CardDescription>
            </div>
            <Button onClick={handleCreateRule}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No assignment rules configured</p>
              <p className="text-sm mb-4">
                Create rules to automatically assign requests to the right approvers
              </p>
              <Button onClick={handleCreateRule} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="assignment-rules">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {rules.map((rule, index) => (
                      <Draggable key={rule.id} draggableId={rule.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-lg p-4 mb-3 bg-card transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 text-muted-foreground hover:text-foreground cursor-grab"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium">{rule.rule_name}</h4>
                                    <Badge className={getRuleTypeColor(rule.rule_type)}>
                                      {rule.rule_type.replace('_', ' ')}
                                    </Badge>
                                    <Badge variant="outline" className={getStrategyColor(rule.assignment_strategy)}>
                                      {rule.assignment_strategy.replace('_', ' ')}
                                    </Badge>
                                    {!rule.is_active && (
                                      <Badge variant="secondary">Inactive</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Priority: {rule.priority_order + 1}
                                    {rule.escalation_rules?.timeout_hours && (
                                      <span className="ml-4">
                                        Escalation: {rule.escalation_rules.timeout_hours}h timeout
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewRule(rule)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRule(rule)}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {showEditor && (
        <AssignmentRuleEditor
          rule={editingRule}
          requestTypeId={requestTypeId}
          open={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={handleSaveRule}
        />
      )}

      {previewRule && (
        <AssignmentRulePreview
          rule={previewRule}
          open={!!previewRule}
          onClose={() => setPreviewRule(null)}
        />
      )}
    </>
  );
};