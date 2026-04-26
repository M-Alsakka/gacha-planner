import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const label =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="profile-menu">
      <button
        className="profile-menu__trigger"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="profile-menu__avatar">{label}</span>
      </button>

      {open && (
        <div className="profile-menu__dropdown">
          <div className="profile-menu__info">
            <strong>{user?.displayName || user?.username || 'Owner'}</strong>
            <span>{user?.email}</span>
          </div>

          <Link
            to="/profile"
            className="profile-menu__item"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>

          <button
            type="button"
            className="profile-menu__item profile-menu__item--danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}