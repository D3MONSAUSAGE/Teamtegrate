
import React from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamSkillMatrixProps {
  skillMatrixData: Array<{
    subject: string;
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  }>;
}

const TeamSkillMatrix: React.FC<TeamSkillMatrixProps> = ({ skillMatrixData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Skill Matrix</CardTitle>
        <CardDescription>Skill assessment across different areas</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <div className="text-xs mb-2 text-center">
          <span className="mr-4">A: Task Completion</span>
          <span className="mr-4">B: Communication</span>
          <span className="mr-4">C: Collaboration</span>
          <span className="mr-4">D: Technical Skills</span>
          <span>E: Problem Solving</span>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillMatrixData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar name="A" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Radar name="B" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            <Radar name="C" dataKey="C" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
            <Radar name="D" dataKey="D" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
            <Radar name="E" dataKey="E" stroke="#0088fe" fill="#0088fe" fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TeamSkillMatrix;
