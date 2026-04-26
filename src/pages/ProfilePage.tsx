import { useAuth } from '../auth/AuthContext';
import '../styles/profile.css';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <div className="profile-card">
        <h1 className="profile-card__title">Profile</h1>

        <div className="profile-card__grid">
          <div className="profile-card__row">
            <span>Email</span>
            <strong>{user?.email || '-'}</strong>
          </div>

          <div className="profile-card__row">
            <span>Username</span>
            <strong>{user?.username || '-'}</strong>
          </div>

          <div className="profile-card__row">
            <span>Display Name</span>
            <strong>{user?.displayName || '-'}</strong>
          </div>

          <div className="profile-card__row">
            <span>Role</span>
            <strong>{user?.role || '-'}</strong>
          </div>

          <div className="profile-card__row">
            <span>Status</span>
            <strong>{user?.status || '-'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}