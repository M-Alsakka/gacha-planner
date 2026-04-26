import { NavLink } from "react-router-dom";
import { ProfileMenu } from "./ProfileMenu";
import "../styles/layout.css";

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <NavLink to="/" className="navbar__brand">
          Gacha Planner
        </NavLink>

        <nav className="navbar__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/games"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
          >
            Games
          </NavLink>
          <NavLink
            to="/task-templates"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
          >
            Templates
          </NavLink>
        </nav>
      </div>

      <div className="navbar__right">
        <ProfileMenu />
      </div>
    </header>
  );
}
