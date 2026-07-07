import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import Loading from "./Loading";
import {
  selectIsAuthenticated,
  selectRole,
} from "../Redux/Reducers/auth";

function ProtectedRoute({ component: Component, roleRoute, ...rest }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector((state) => state.auth.loading);
  const roles = useSelector(selectRole); // This returns the array of role objects

  // Show loading while checking auth state
  if (loading || (isAuthenticated && !roles)) {
    return <Loading />;
  }

  return (
    <Route
      {...rest}
      render={(props) => {
        // Check authentication
        if (!isAuthenticated) {
          return (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: props.location },
              }}
            />
          );
        }

        // Check authorization (roles) if roleRoute is provided
        if (roleRoute) {
          // Extract just the roleIds from the nested structure
          const userRoleIds = roles.map(
            (roleObj) => roleObj.roleKPBPNId ?? roleObj.roleId ?? roleObj.id,
          );

          // Check if any of the user's roles match the required roles
          const hasRequiredRole = roleRoute.some((requiredRole) =>
            userRoleIds.includes(requiredRole)
          );

          if (!hasRequiredRole) {
            return (
              <Redirect
                to={{
                  pathname: "/unauthorized",
                  state: { from: props.location },
                }}
              />
            );
          }
        }

        // All checks passed - render component
        return <Component {...props} />;
      }}
    />
  );
}

export default ProtectedRoute;
