import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useSidebarState() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Set sidebar state based on current route
  useEffect(() => {
    // Only keep sidebar open on dashboard (/)
    if (location.pathname === '/') {
      setCollapsed(false);
    } else {
      setCollapsed(true);
    }
  }, [location.pathname]);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const handleMouseEnter = () => {
    if (location.pathname !== '/') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const shouldBeExpanded = !collapsed || (collapsed && isHovered);

  return {
    collapsed,
    setCollapsed,
    toggleCollapsed,
    isHovered,
    shouldBeExpanded,
    handleMouseEnter,
    handleMouseLeave
  };
}
