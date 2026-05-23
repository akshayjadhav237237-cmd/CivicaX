/**
 * Role-based access control middleware factory.
 * Usage: roleGuard('government', 'admin')
 * @param {...string} allowedRoles - Roles that are permitted
 */
const roleGuard = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions', code: 'FORBIDDEN' });
  }
  next();
};

module.exports = { roleGuard };
