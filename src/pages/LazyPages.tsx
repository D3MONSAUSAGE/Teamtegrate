
import React, { Suspense } from 'react';
import LoadingFallback from '@/components/LoadingFallback';

// Lazy load heavy components
const CalendarPage = React.lazy(() => import('./CalendarPage'));
const FocusPage = React.lazy(() => import('./FocusPage'));
const ReportsPage = React.lazy(() => import('./ReportsPage'));
const DocumentsPage = React.lazy(() => import('./DocumentsPage'));
const ChatPage = React.lazy(() => import('./ChatPage'));
const TeamPage = React.lazy(() => import('./TeamPage'));
const ProfilePage = React.lazy(() => import('./ProfilePage'));
const SettingsPage = React.lazy(() => import('./SettingsPage'));
const OrganizationPage = React.lazy(() => import('./OrganizationPage'));
const FinancePage = React.lazy(() => import('./FinancePage'));
const NotebookPage = React.lazy(() => import('./NotebookPage'));
const JournalPage = React.lazy(() => import('./JournalPage'));

// Wrapper components with suspense
export const LazyCalendarPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <CalendarPage />
  </Suspense>
);

export const LazyFocusPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <FocusPage />
  </Suspense>
);

export const LazyReportsPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <ReportsPage />
  </Suspense>
);

export const LazyDocumentsPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <DocumentsPage />
  </Suspense>
);

export const LazyChatPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <ChatPage />
  </Suspense>
);

export const LazyTeamPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <TeamPage />
  </Suspense>
);

export const LazyProfilePage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <ProfilePage />
  </Suspense>
);

export const LazySettingsPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <SettingsPage />
  </Suspense>
);

export const LazyOrganizationPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <OrganizationPage />
  </Suspense>
);

export const LazyFinancePage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <FinancePage />
  </Suspense>
);

export const LazyNotebookPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <NotebookPage />
  </Suspense>
);

export const LazyJournalPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <JournalPage />
  </Suspense>
);
