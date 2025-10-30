// Theme helper utility to determine colors based on user role

export const getThemeColors = () => {
  const role = localStorage.getItem('role') || localStorage.getItem('userType');
  const armyUnitId = localStorage.getItem('army_unit_id');
  const isArmyOfficer = armyUnitId && armyUnitId !== 'null';
  const isAdmin = role === 'admin';

  if (isAdmin) {
    // Dark theme for Admin
    return {
      primary: '#1f2937', // dark gray-800
      headerBg: '#1f2937',
      sidebarBg: '#1f2937',
      footerBg: '#1f2937',
      gradientFrom: '#374151', // gray-700
      gradientTo: '#1f2937', // gray-800
      cardBg: '#111827', // gray-900
      text: '#f9fafb', // gray-50
      textSecondary: '#d1d5db', // gray-300
      accent: '#6b7280', // gray-500
      ring: '#4b5563', // gray-600
    };
  } else if (isArmyOfficer) {
    // Green theme for Army Officer
    return {
      primary: '#059669', // green-600
      headerBg: '#059669',
      sidebarBg: '#059669',
      footerBg: '#059669',
      gradientFrom: '#10b981', // green-500
      gradientTo: '#059669', // green-600
      cardBg: '#047857', // green-700
      text: '#ffffff',
      textSecondary: '#d1fae5', // green-100
      accent: '#34d399', // green-400
      ring: '#10b981', // green-500
    };
  } else {
    // Default blue theme for Defence Officer
    return {
      primary: 'rgb(11,80,162)', // blue
      headerBg: 'rgb(11,80,162)',
      sidebarBg: 'rgb(11,80,162)',
      footerBg: 'rgb(11,80,162)',
      gradientFrom: '#2563eb', // blue-600
      gradientTo: '#0ea5e9', // sky-500
      cardBg: '#1e40af', // blue-800
      text: '#ffffff',
      textSecondary: '#dbeafe', // blue-100
      accent: '#3b82f6', // blue-500
      ring: '#2563eb', // blue-600
    };
  }
};

export const getTableHeaderClass = () => {
  const role = localStorage.getItem('role') || localStorage.getItem('userType');
  const armyUnitId = localStorage.getItem('army_unit_id');
  const isArmyOfficer = armyUnitId && armyUnitId !== 'null';
  const isAdmin = role === 'admin';

  if (isAdmin) {
    return 'bg-gray-800 text-white';
  } else if (isArmyOfficer) {
    return 'bg-green-600 text-white';
  } else {
    return 'bg-blue-600 text-white';
  }
};

export const getButtonClass = (variant = 'primary') => {
  const role = localStorage.getItem('role') || localStorage.getItem('userType');
  const armyUnitId = localStorage.getItem('army_unit_id');
  const isArmyOfficer = armyUnitId && armyUnitId !== 'null';
  const isAdmin = role === 'admin';

  if (variant === 'primary') {
    if (isAdmin) {
      return 'bg-gray-700 hover:bg-gray-800 text-white';
    } else if (isArmyOfficer) {
      return 'bg-green-600 hover:bg-green-700 text-white';
    } else {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  }
  return '';
};

export const getGradientTextClass = () => {
  const role = localStorage.getItem('role') || localStorage.getItem('userType');
  const armyUnitId = localStorage.getItem('army_unit_id');
  const isArmyOfficer = armyUnitId && armyUnitId !== 'null';
  const isAdmin = role === 'admin';

  if (isAdmin) {
    return 'from-gray-600 to-gray-800';
  } else if (isArmyOfficer) {
    return 'from-green-600 to-green-800';
  } else {
    return 'from-blue-600 to-sky-500';
  }
};

export const getAccentColorClass = () => {
  const role = localStorage.getItem('role') || localStorage.getItem('userType');
  const armyUnitId = localStorage.getItem('army_unit_id');
  const isArmyOfficer = armyUnitId && armyUnitId !== 'null';
  const isAdmin = role === 'admin';

  if (isAdmin) {
    return {
      bg: 'bg-gray-700',
      text: 'text-gray-600',
      ring: 'ring-gray-600',
      border: 'border-gray-600',
    };
  } else if (isArmyOfficer) {
    return {
      bg: 'bg-green-600',
      text: 'text-green-600',
      ring: 'ring-green-600',
      border: 'border-green-600',
    };
  } else {
    return {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      ring: 'ring-blue-600',
      border: 'border-blue-600',
    };
  }
};
