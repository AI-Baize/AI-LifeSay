import { NavLink } from 'react-router-dom';

// B-1：主导航由「今日/周报/设置」改为「今日/场景/历史/设置」4 项。
// B-2：周报从一级导航降为历史内入口（由 P23/P24 可达），不丢现有周报功能。
export const NAV_ITEMS = [
  { to: '/today', label: '今日' },
  { to: '/scenes', label: '场景' },
  { to: '/history/calendar', label: '历史' },
  { to: '/settings', label: '设置' }
] as const;

export function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="主导航">
      {NAV_ITEMS.map(item => (
        <NavLink key={item.to} to={item.to}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
