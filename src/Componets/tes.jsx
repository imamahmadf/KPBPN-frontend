import React from "react";
import { Route, Redirect, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import Loading from "./Loading";
import {
  selectIsAuthenticated,
  userRedux,
  selectRole,
} from "../Redux/Reducers/auth";
function ProtectedRoute({ component: Component, roleRoute, ...rest }) {
  const history = useHistory();
  const isAuthenticated = useSelector((state) => !!state.auth.token);
  const { UserRoles = [] } = useSelector((state) => state.user || {});
  const loading = useSelector((state) => state.auth.loading);
  const user = useSelector(userRedux);
  const role = useSelector(selectRole);
  // Show loading while checking auth state
  if (loading || (isAuthenticated && !UserRoles)) {
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
        if (roleRoute && !roleRoute.some((role) => UserRoles.includes(role))) {
          // You can redirect to unauthorized page or back to home
          return <Redirect to="/" />;
        }

        // All checks passed - render component
        return <Component {...props} />;
      }}
    />
  );
}

export default ProtectedRoute;
