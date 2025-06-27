
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, Star, Code, Users as UsersIcon, Brain, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SkillsCompetenciesSection = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Mock skills data based on user role
  const getTechnicalSkills = (role: string) => {
    const baseSkills = [
      { name: "Project Management", level: 85, category: "Management" },
      { name: "Team Leadership", level: 78, category: "Leadership" },
      { name: "Communication", level: 92, category: "Soft Skills" },
      { name: "Problem Solving", level: 88, category: "Analytical" }
    ];

    const roleSpecificSkills = {
      superadmin: [
        { name: "System Architecture", level: 95, category: "Technical" },
        { name: "Security Management", level: 90, category: "Technical" },
        { name: "Strategic Planning", level: 85, category: "Management" }
      ],
      admin: [
        { name: "Database Management", level: 82, category: "Technical" },
        { name: "User Management", level: 88, category: "Management" },
        { name: "Compliance", level: 75, category: "Regulatory" }
      ],
      manager: [
        { name: "Team Development", level: 90, category: "Leadership" },
        { name: "Budget Management", level: 73, category: "Finance" },
        { name: "Performance Analysis", level: 80, category: "Analytics" }
      ],
      user: [
        { name: "Task Execution", level: 85, category: "Operational" },
        { name: "Documentation", level: 78, category: "Technical" },
        { name: "Quality Assurance", level: 82, category: "Quality" }
      ]
    };

    return [...baseSkills, ...(roleSpecificSkills[role as keyof typeof roleSpecificSkills] || roleSpecificSkills.user)];
  };

  const skills = getTechnicalSkills(user.role);

  const certifications = [
    { name: "Project Management Professional", issuer: "PMI", date: "2023", status: "Active" },
    { name: "Agile Certified Practitioner", issuer: "PMI", date: "2023", status: "Active" },
    { name: "Leadership Excellence", issuer: "Internal", date: "2024", status: "Completed" }
  ];

  const learningGoals = [
    { goal: "Advanced Data Analytics", progress: 65, target: "Q2 2024" },
    { goal: "Strategic Leadership", progress: 40, target: "Q3 2024" },
    { goal: "Digital Transformation", progress: 25, target: "Q4 2024" }
  ];

  const getSkillColor = (level: number) => {
    if (level >= 90) return "text-green-600";
    if (level >= 75) return "text-blue-600";
    if (level >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getSkillBadgeVariant = (category: string) => {
    const variants: Record<string, any> = {
      "Technical": "default",
      "Management": "secondary",
      "Leadership": "destructive",
      "Soft Skills": "outline"
    };
    return variants[category] || "outline";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Skills & Competencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Skills & Competencies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.map((skill, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{skill.name}</span>
                  <Badge variant={getSkillBadgeVariant(skill.category)} className="text-xs">
                    {skill.category}
                  </Badge>
                </div>
                <span className={`text-sm font-semibold ${getSkillColor(skill.level)}`}>
                  {skill.level}%
                </span>
              </div>
              <Progress value={skill.level} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certifications & Learning */}
      <div className="space-y-6">
        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{cert.name}</div>
                  <div className="text-xs text-muted-foreground">{cert.issuer} • {cert.date}</div>
                </div>
                <Badge variant={cert.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                  {cert.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-orange-600" />
              Development Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {learningGoals.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{goal.goal}</span>
                  <span className="text-xs text-muted-foreground">{goal.target}</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {goal.progress}% Complete
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SkillsCompetenciesSection;
