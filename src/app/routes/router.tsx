import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { SiteLayout } from '@/components/site/SiteLayout';
import { PortalLayout } from '@/components/site/PortalLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { paths } from './paths';
import { NotFound } from '@/pages/system/NotFound';

// Route-based code splitting for the heavier pages.
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const CatalogPage = lazy(() => import('@/pages/public/CatalogPage'));
const ListingDetailPage = lazy(() => import('@/pages/public/ListingDetailPage'));
const QurbanPage = lazy(() => import('@/pages/public/QurbanPage'));
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'));
const TestimonialsPage = lazy(() => import('@/pages/public/TestimonialsPage'));
const FaqPage = lazy(() => import('@/pages/public/FaqPage'));
const ArticlesPage = lazy(() => import('@/pages/public/ArticlesPage'));
const ArticleDetailPage = lazy(() => import('@/pages/public/ArticleDetailPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('@/pages/auth/UpdatePasswordPage'));
const PortalQurbanPage = lazy(() => import('@/pages/portal/PortalQurbanPage'));
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const LivestockPage = lazy(() => import('@/pages/app/LivestockPage'));
const AnimalDetailPage = lazy(() => import('@/pages/app/AnimalDetailPage'));
const CustomersPage = lazy(() => import('@/pages/app/CustomersPage'));
const SuppliersPage = lazy(() => import('@/pages/app/SuppliersPage'));
const EmployeesPage = lazy(() => import('@/pages/app/EmployeesPage'));
const InventoryPage = lazy(() => import('@/pages/app/InventoryPage'));
const FinancePage = lazy(() => import('@/pages/app/FinancePage'));
const TasksPage = lazy(() => import('@/pages/app/TasksPage'));
const CmsPage = lazy(() => import('@/pages/app/CmsPage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));
const ChatInboxPage = lazy(() => import('@/pages/app/ChatInboxPage'));
const HealthPage = lazy(() => import('@/pages/app/HealthPage'));
const BreedingPage = lazy(() => import('@/pages/app/BreedingPage'));
const FeedingPage = lazy(() => import('@/pages/app/FeedingPage'));
const QurbanAdminPage = lazy(() => import('@/pages/app/QurbanPage'));
const CalendarPage = lazy(() => import('@/pages/app/CalendarPage'));
const ReportsPage = lazy(() => import('@/pages/app/ReportsPage'));
const AuditPage = lazy(() => import('@/pages/app/AuditPage'));
const ScanPage = lazy(() => import('@/pages/app/ScanPage'));
const PurchasesPage = lazy(() => import('@/pages/app/PurchasesPage'));

export const router = createBrowserRouter([
  // Public marketing site (shared layout, own warm palette).
  {
    element: <SiteLayout />,
    children: [
      { path: paths.home, element: <HomePage /> },
      { path: paths.about, element: <AboutPage /> },
      { path: paths.catalog, element: <CatalogPage /> },
      { path: paths.catalogSpecies(':species'), element: <CatalogPage /> },
      { path: paths.listing(':id'), element: <ListingDetailPage /> },
      { path: paths.qurbanPublic, element: <QurbanPage /> },
      { path: paths.gallery, element: <GalleryPage /> },
      { path: paths.testimonials, element: <TestimonialsPage /> },
      { path: paths.faq, element: <FaqPage /> },
      { path: paths.articles, element: <ArticlesPage /> },
      { path: paths.article(':slug'), element: <ArticleDetailPage /> },
      { path: paths.contact, element: <ContactPage /> },
    ],
  },

  { path: paths.login, element: <LoginPage /> },
  { path: paths.forgotPassword, element: <ForgotPasswordPage /> },
  { path: paths.updatePassword, element: <UpdatePasswordPage /> },
  { path: paths.register, element: <RegisterPage /> },

  // Customer self-service portal (any authenticated user).
  {
    path: paths.portal,
    element: <ProtectedRoute />,
    children: [
      {
        element: <PortalLayout />,
        children: [
          { index: true, element: <Navigate to={paths.portalQurban} replace /> },
          { path: 'qurban', element: <PortalQurbanPage /> },
        ],
      },
    ],
  },

  // Authenticated application.
  {
    path: '/app',
    element: <ProtectedRoute resource="dashboard" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'scan', element: <ScanPage /> },
        ],
      },
    ],
  },
  {
    path: paths.livestock,
    element: <ProtectedRoute resource="livestock" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <LivestockPage /> },
          { path: ':id', element: <AnimalDetailPage /> },
        ],
      },
    ],
  },

  // Module routes — schema/types ready, full UI delivered per phase.
  guarded(paths.health, 'health', <HealthPage />),
  guarded(paths.breeding, 'breeding', <BreedingPage />),
  guarded(paths.feeding, 'feeding', <FeedingPage />),
  guarded(paths.inventory, 'inventory', <InventoryPage />),
  guarded(paths.suppliers, 'supplier', <SuppliersPage />),
  guarded(paths.customers, 'customer', <CustomersPage />),
  guarded(paths.chat, 'chat', <ChatInboxPage />),
  guarded(paths.employees, 'employee', <EmployeesPage />),
  guarded(paths.finance, 'finance', <FinancePage />),
  guarded(paths.tasks, 'task', <TasksPage />),
  guarded(paths.cms, 'cms', <CmsPage />),
  guarded(paths.settings, 'settings', <SettingsPage />),
  guarded(paths.qurban, 'qurban', <QurbanAdminPage />),
  guarded(paths.purchases, 'livestock', <PurchasesPage />),
  guarded(paths.calendar, 'calendar', <CalendarPage />),
  guarded(paths.reports, 'report', <ReportsPage />),
  guarded(paths.audit, 'audit', <AuditPage />),

  { path: '*', element: <NotFound /> },
]);

/** Helper to build a permission-guarded route within the app shell. */
function guarded(
  path: string,
  resource: Parameters<typeof ProtectedRoute>[0]['resource'],
  element: React.ReactNode,
) {
  return {
    path,
    element: <ProtectedRoute resource={resource} />,
    children: [{ element: <AppLayout />, children: [{ index: true, element }] }],
  };
}
