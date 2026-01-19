import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useSidebarState() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Set sidebar state based on current route
  useEffect(() => {
    // Defaultly always closed
    setCollapsed(true);
  }, [location.pathname]);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const handleMouseEnter = () => {
    setIsHovered(true);
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
