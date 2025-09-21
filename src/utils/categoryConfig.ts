import { Calendar, Clock, DollarSign, FileText, Users, Settings, CheckCircle } from 'lucide-react';

export const categoryIcons = {
  time_schedule: Clock,
  hr_admin: Users,
  training: FileText,
  financial: DollarSign,
  it_access: Settings,
  custom: CheckCircle
};

export const categoryColors = {
  time_schedule: 'from-blue-500/10 to-blue-600/10 border-blue-200 hover:border-blue-300',
  hr_admin: 'from-green-500/10 to-green-600/10 border-green-200 hover:border-green-300',
  training: 'from-purple-500/10 to-purple-600/10 border-purple-200 hover:border-purple-300',
  financial: 'from-yellow-500/10 to-yellow-600/10 border-yellow-200 hover:border-yellow-300',
  it_access: 'from-red-500/10 to-red-600/10 border-red-200 hover:border-red-300',
  custom: 'from-gray-500/10 to-gray-600/10 border-gray-200 hover:border-gray-300'
};

export const categoryBadgeColors = {
  time_schedule: 'bg-blue-50 text-blue-700 border-blue-200',
  hr_admin: 'bg-green-50 text-green-700 border-green-200',
  training: 'bg-purple-50 text-purple-700 border-purple-200',
  financial: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  it_access: 'bg-red-50 text-red-700 border-red-200',
  custom: 'bg-gray-50 text-gray-700 border-gray-200'
};