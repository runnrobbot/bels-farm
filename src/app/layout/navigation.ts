import {
  LayoutDashboard,
  Beef,
  HeartPulse,
  Baby,
  Wheat,
  ScanLine,
  Boxes,
  Truck,
  Users,
  Contact,
  Wallet,
  PiggyBank,
  ShoppingCart,
  MessagesSquare,
  ListChecks,
  CalendarDays,
  FileBarChart,
  Newspaper,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { paths } from '@/app/routes/paths';
import type { Resource } from '@/features/auth/types';

export interface NavItem {
  label: string; // i18n key under `nav`
  to: string;
  icon: LucideIcon;
  resource: Resource;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

/**
 * Sidebar navigation, grouped by domain. Each item declares the resource it
 * requires; the sidebar filters items the current user can't view, so the menu
 * adapts to the dynamic permission set with no hardcoded role logic.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Operations',
    items: [
      { label: 'dashboard', to: paths.dashboard, icon: LayoutDashboard, resource: 'dashboard' },
      { label: 'livestock', to: paths.livestock, icon: Beef, resource: 'livestock' },
      { label: 'scan', to: paths.scan, icon: ScanLine, resource: 'livestock' },
      { label: 'health', to: paths.health, icon: HeartPulse, resource: 'health' },
      { label: 'breeding', to: paths.breeding, icon: Baby, resource: 'breeding' },
      { label: 'feeding', to: paths.feeding, icon: Wheat, resource: 'feeding' },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { label: 'inventory', to: paths.inventory, icon: Boxes, resource: 'inventory' },
      { label: 'suppliers', to: paths.suppliers, icon: Truck, resource: 'supplier' },
      { label: 'employees', to: paths.employees, icon: Users, resource: 'employee' },
    ],
  },
  {
    heading: 'Commerce',
    items: [
      { label: 'customers', to: paths.customers, icon: Contact, resource: 'customer' },
      { label: 'chat', to: paths.chat, icon: MessagesSquare, resource: 'chat' },
      { label: 'finance', to: paths.finance, icon: Wallet, resource: 'finance' },
      { label: 'qurban', to: paths.qurban, icon: PiggyBank, resource: 'qurban' },
      { label: 'purchases', to: paths.purchases, icon: ShoppingCart, resource: 'livestock' },
    ],
  },
  {
    heading: 'Planning',
    items: [
      { label: 'tasks', to: paths.tasks, icon: ListChecks, resource: 'task' },
      { label: 'calendar', to: paths.calendar, icon: CalendarDays, resource: 'calendar' },
      { label: 'reports', to: paths.reports, icon: FileBarChart, resource: 'report' },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'cms', to: paths.cms, icon: Newspaper, resource: 'cms' },
      { label: 'audit', to: paths.audit, icon: ScrollText, resource: 'audit' },
      { label: 'settings', to: paths.settings, icon: Settings, resource: 'settings' },
    ],
  },
];
