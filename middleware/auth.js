const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is defined and matches the signing secret

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    // Split token and get the actual token part
    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    jwt.verify(tokenParts[1], JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: "Token has expired" });
            }
            return res.status(401).json({ error: `Unauthorized: ${err.message} ` });
        }
        req.user = decoded.id;
        req.tenant = decoded.tenant_id;
        req.isadmin = decoded.isadmin;
        next();
    });
};

module.exports = verifyToken;
