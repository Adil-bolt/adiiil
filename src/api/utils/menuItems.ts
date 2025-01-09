import { 
  LayoutDashboard, 
  Calendar, 
  UserCheck, 
  CreditCard, 
  Package, 
  UserPlus,
  Settings,
  Save,
  Bell,
  BarChart,
  Users,
  TrendingUp
} from 'lucide-react';

export const menuItems = [
  { 
    icon: Calendar, 
    label: 'Agenda',
    path: '/agenda2', 
    permissions: ['view_appointments']
  },
  {
    icon: LayoutDashboard,
    label: 'Tableau de bord',
    path: '/',
    permissions: ['view_dashboard']
  },
  { 
    icon: CreditCard, 
    label: 'Paiement', 
    path: '/billing', 
    permissions: ['view_billing']
  },
  { 
    icon: Users, 
    label: 'Patients',
    path: '/patients2',
    permissions: ['view_patients']
  },
  { 
    icon: Bell,
    label: 'Notifications',
    path: '/notifications',
    permissions: ['manage_users']
  },
  { 
    icon: Package,
    label: 'Gestion Cabinet',
    isSubmenu: true,
    permissions: ['admin'],
    submenu: [
      {
        icon: Package,
        label: 'Fournitures',
        path: '/supplies',
        permissions: ['admin']
      },
      {
        icon: UserPlus,
        label: 'Utilisateurs',
        path: '/users',
        permissions: ['admin']
      },
      {
        icon: Settings,
        label: 'Paramètres',
        path: '/settings',
        permissions: ['admin']
      },
      {
        icon: Save,
        label: 'Sauvegarde',
        path: '/backup',
        permissions: ['admin']
      }
    ]
  },
  {
    icon: BarChart,
    label: 'Statistiques',
    path: '/statistics',
    permissions: ['view_statistics']
  }
];