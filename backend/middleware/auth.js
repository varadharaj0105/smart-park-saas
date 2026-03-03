import jwt from "jsonwebtoken";

// Verify JWT and attach user info to req.user
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Expect payload to contain: user_id, role, tenant_id
    req.user = {
      id: decoded.user_id || decoded.id,
      role: decoded.role,
      tenant_id: decoded.tenant_id,
    };

    if (!req.user.id || !req.user.role || !req.user.tenant_id) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("JWT verify error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

// Restrict route access to specific roles
export function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return next();
  };
}

