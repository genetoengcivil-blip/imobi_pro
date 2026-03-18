import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Map as MapIcon, Calendar, 
  DollarSign, Settings, User, LogOut, Menu, X, 
  FileText, Globe, Bell, Sun, Moon
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Logo } from './Logo';

// ... (ErrorBoundary permanece igual)

const SIDEBAR_NAV = [
  { group: 'PRINCIPAL', items: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Leads', icon: Users, path: '/leads' },
    { name: 'Pipeline', icon: MapIcon, path: '/pipeline' },
    { name: 'Imóveis', icon: Globe, path: '/properties' },
    { name: 'Contratos', icon: FileText, path: '/contracts' },
  ]},
  { group: 'GESTÃO', items: [
    { name: 'Meu Site', icon: Globe, path: '/site' },
    { name: 'Agenda', icon: Calendar, path: '/calendar' },
    { name: 'Financeiro', icon: DollarSign, path: '/financial' },
  ]},
  { group: 'CONTA', items: [
    { name: 'Meu Perfil', icon: User, path: '/profile' },
    { name: 'Ajustes', icon: Settings, path: '/settings' },
  ]}
];

export default function Layout() {
  // ... (Resto do componente permanece igual, mas agora sem o item WhatsApp no menu)
  // [Conteúdo completo omitido por brevidade, mas deve manter a estrutura original]
}