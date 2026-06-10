import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const hasRole = (roles) => {
    if (!user) return false;
    if (!roles || roles.length === 0) return true;
    return roles.includes(user.role);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
  };
}
