// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware/auth');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function getDomainFromEmail(email) {
    const parts = email.split('@');
    if (parts.length === 2) {
        return parts[1]; // Return the domain part (after '@')
    }
    return null; // Return null if the email is invalid or doesn't contain '@'
}

// Function to send a verification email
const sendVerificationEmail = (email, code) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_NAME,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: email,
            subject: 'Account Verification',
            text: `Your verification code is: ${code}`
        };

        return transporter.sendMail(mailOptions);
    } catch (error) {
        return false
    }

};
const generateVerificationCode = () => {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    return verificationCode
}
// Registration route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Check if the email already exists
        const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkEmailQuery, [email], async (err, results) => {
            if (results.length > 0) {
                return res.status(409).json({ error: 'Email already registered.' });
            }

            // Generate a verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000);

            // Store the email and verification code in the database
            const insertVerificationQuery = 'INSERT INTO verification (email, code) VALUES (?, ?)';
            db.query(insertVerificationQuery, [email, verificationCode], (err, result) => {
                if (err) return res.status(500).json({ error: 'Database error' });

                // Send verification email
                const sent = sendVerificationEmail(email, verificationCode);
                if (sent == false) return res.status(500).json({ error: 'Internal server error 60 ' });
                return res.status(201).json({ message: 'User registered successfully. Check your email for verification code.' });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/resend', async (req, res) => {
    const { email } = req.body;
    const code = generateVerificationCode();
    deletequery = "delete from verification where email = ?"
    db.query(deletequery, [email]);

    const sql = 'INSERT INTO verification (email, code, expires_at) VALUES (?, ?, ?)';
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    db.query(sql, [email, code, expiresAt], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Send the email with the new verification code
        const sent = sendVerificationEmail(email, code);
        if (sent == false) return res.status(500).json({ error: 'Internal server error 80 ' });
        res.status(200).json({ message: 'Verification code resent' });
    });
});

router.post('/resend-login', async (req, res) => {
    const { email } = req.body;
    const code = generateVerificationCode();
    deletequery = "delete from login_verification where email = ?"
    db.query(deletequery, [email]);

    const sql = 'INSERT INTO login_verification (email, code, expires_at) VALUES (?, ?, ?)';
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    db.query(sql, [email, code, expiresAt], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Send the email with the new verification code
        try {
            const sent = sendVerificationEmail(email, code);
            if (sent == false) return res.status(500).json({ error: 'Internal server error 90 ' });
            return res.status(200).json({ message: 'Verification code resent' });
        } catch (error) {
            return res.status(500).json({ error: 'Unable to resend Verification Code. Please try again later.' });
        }
    });
});

// Verification route
router.post('/verify', async (req, res) => {
    const { organization, email, code, firstname, lastname, password } = req.body
    try {
        const sql = 'SELECT * FROM verification WHERE email = ?';
        db.query(sql, [email], async (err, results) => {

            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(404).json({ error: 'Verification entry not found' });

            const verificationEntry = results[0];
            const currentTime = new Date();
            const codeExpiresAt = new Date(verificationEntry.expires_at);

            // Check if the code is expired
            if (currentTime > codeExpiresAt) {
                return res.status(400).json({ error: 'Verification code has expired' });
            }

            // Check if the code matches
            if (verificationEntry.code !== code) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }


            const add_tenant = `INSERT INTO tenants (tenant_name, tenant_domain) VALUES (?, ?)`;

            db.query(add_tenant, [organization, getDomainFromEmail(email)], async (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to register tenant' });
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                const userSql = 'INSERT INTO users (username, email, password_hash, tenant_id,isadmin) VALUES (?, ?, ?, ?, ?)';
                db.query(userSql, [`${firstname} ${lastname}`, email, hashedPassword, results.insertId, 1], (err, result) => {
                    console.log('====================================');
                    console.log(err);
                    console.log('====================================');
                    if (err) return res.status(500).json({ error: 'Database error' });

                    db.query('DELETE FROM verification WHERE email = ?', [email]);
                    res.status(201).json({ message: 'Registered successfully' });
                });
            })

        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' });

        // Generate a verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        // Store the email and verification code in the database
        const checkCode = 'SELECT * FROM login_verification WHERE email = ?';
        db.query(checkCode, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: `Error: ${err}` })

            if (results.length > 0) {
                insertVerificationQuery = 'UPDATE login_verification SET code = ? where email = ?';
                deletequery = "delete from login_verification where email = ?"
                db.query(deletequery, [email], (err, result) => {
                    if (err) return res.status(500).json({ error: `Server error with code 140` });
                });
            }

            insertVerificationQuery = 'INSERT INTO login_verification (code, email) VALUES (?, ?)';

            db.query(insertVerificationQuery, [verificationCode, email], (err, result) => {
                if (err) return res.status(500).json({ error: `error : ${err}` });


                try {
                    const sent = sendVerificationEmail(email, verificationCode);
                    if (sent == false) return res.status(500).json({ error: 'Internal server error 180 ' });
                    return res.status(201).json({ message: 'Verify login. Check your email for verification code.' });
                } catch (error) {
                    return res.status(500).json({ error: 'Unable to send Verification Code. Please try again later.' });
                }
            });
        })



    });
});

router.post('/verify-login', async (req, res) => {
    const { email, password, code } = req.body;
    let rememberme = req.body.rememberme ? req.body.rememberme : false
    try {
        const sql = 'SELECT * FROM users WHERE email = ?';
        db.query(sql, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

            const user = results[0];
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' });
            const sql = 'SELECT * FROM login_verification WHERE email = ?';
            db.query(sql, [email], async (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                if (results.length === 0) return res.status(404).json({ error: 'Verification entry not found' });

                const verificationEntry = results[0];
                const currentTime = new Date();
                const codeExpiresAt = new Date(verificationEntry.expires_at);

                // Check if the code is expired
                if (currentTime > codeExpiresAt) {
                    return res.status(400).json({ error: 'Verification code has expired' });
                }

                // Check if the code matches
                if (verificationEntry.code !== code) {
                    return res.status(400).json({ error: 'Invalid verification code' });
                }
                const sql = 'SELECT * FROM users WHERE email = ?';
                db.query(sql, [email], async (err, results) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    if (results.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

                    const user = results[0];

                    const token = rememberme ? jwt.sign({ id: user.user_id, email: user.email, isadmin: user.isadmin, tenant_id: user.tenant_id }, JWT_SECRET) : jwt.sign({ id: user.user_id, email: user.email, isadmin: user.isadmin, tenant_id: user.tenant_id }, JWT_SECRET, { expiresIn: '1d' })

                    if (user.isadmin == '1') {
                        const allorganization = "select id from organization where tenant_id = ?"
                        db.query(allorganization, [user.tenant_id], (err, idResult) => {
                            if (err) return res.status(500).json({ error: 'Database error' });
                            deletequery = "delete from login_verification where email = ?"
                            db.query(deletequery, [email]);
                            return res.status(200).json({ message: 'Login successful', token, name: user.username, organization_id: `${idResult[0].id}` });

                        });

                    }
                    else {
                        return res.json({ message: 'Login successful', token, name: user.username, organization_id: user.organization_id });
                    }
                })
            });
        })
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', verifyToken, (req, res) => {
    const userId = req.user

    const sql = 'SELECT username,email,isadmin FROM users WHERE user_id = ?';
    db.query(sql, [userId], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const user = results[0]

        return res.status(200).json({ name: user.username, isadmin: user.isadmin, email: user.email })
    })
});


router.get('/users', verifyToken, (req, res) => {
    const userId = req.user
    const tenantId = req.tenant
    const isadmin = req.isadmin == 1 ? true : false
    if (!isadmin) return res.status(401).json({ "error": "You don't have the permission." })

    const sql = 'SELECT user_id,username,email,isadmin,created_at,banned FROM users WHERE tenant_id = ?';
    db.query(sql, [tenantId], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const users = results

        return res.status(200).json(users)
    })
});

router.get('/organizations', verifyToken, (req, res) => {
    const user_id = req.user
    const tenantId = req.tenant
    const isadmin = req.isadmin == 1 ? true : false

    let sql = ""
    if (isadmin) {

        sql = 'SELECT * FROM organization WHERE tenant_id = ?';
    }
    else {
        sql = 'SELECT * FROM organization WHERE id = (SELECT organization_id FROM users WHERE user_id = ?);'

    }
    db.query(sql, [isadmin ? tenantId : user_id], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const organizations = results

        return res.status(200).json({ organizations: organizations })
    })
});

router.post('/create_user', verifyToken, async (req, res) => {
    const { username, email, password, userType, organization_id } = req.body;
    const isadmin = req.isadmin === 1;  // Ensure the admin check is correct
    const tenantId = req.tenant;

    if (!username || !email || !password || !userType) {
        return res.status(400).json({ error: 'Please provide all fields' });
    }

    // Only allow admins to create users
    if (!isadmin) return res.status(401).json({ 'error': "You don't have the permission to create a new user!" });

    try {
        // Check if email already exists
        const emailCheckQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(emailCheckQuery, [email], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error occurred during user creation.' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            try {
                // Hash the password before storing it
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert new user into the database
                const insertUserQuery = 'INSERT INTO users (username, email, password_hash, isadmin, tenant_id,organization_id) VALUES (?, ?, ?, ?, ?, ?);';
                db.query(
                    insertUserQuery,
                    [username, email, hashedPassword, userType === 'admin' ? 1 : 0, tenantId, parseInt(organization_id)],
                    (err, result) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).json({ error: 'Failed to create user' });
                        }

                        // Return the success response with user details
                        const user_type = userType == 'admin' ? 1 : 0
                        return res.status(200).json({
                            message: 'User created successfully',
                            user: {
                                id: result.insertId,
                                username,
                                email,
                                user_type,
                                created_at: 'now'

                            }
                        });
                    }
                );
            } catch (hashError) {
                return res.status(500).json({ error: 'Error hashing password' });
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/create_organization', verifyToken, async (req, res) => {
    const { name } = req.body;
    const isadmin = req.isadmin === 1;  // Ensure the admin check is correct
    const tenantId = req.tenant;

    if (!name) {
        return res.status(400).json({ error: 'Please provide all fields' });
    }

    // Only allow admins to create users
    if (!isadmin) return res.status(401).json({ 'error': "You don't have the permission to create a new user!" });

    try {
        // Check if email already exists
        const nameCheckQuery = 'SELECT * FROM organization WHERE name = ?';
        db.query(nameCheckQuery, [name], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error occurred during organization creation.' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Organization name already in use' });
            }

            // Insert new user into the database
            const insertOrgQuery = 'INSERT INTO organization (name, tenant_id) VALUES (?, ?);';
            db.query(
                insertOrgQuery,
                [name, tenantId],
                (err, result) => {
                    if (err) {

                        return res.status(500).json({ error: 'Failed to create organization' });
                    }

                    return res.status(200).json({
                        message: 'Organization created successfully',
                        organization: {
                            id: result.insertId,
                            name,
                            created_date: 'now'

                        }
                    });
                }
            );

        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/users/:id', verifyToken, (req, res) => {
    try {
        const { id } = req.params;
        const intId = parseInt(id, 10);
        const userId = req.user ? req.user : false
        const isadmin = req.isadmin == 1 ? true : false
        const tenantId = req.tenant ? req.tenant : false
        if (!userId || !tenantId) return res.status(401).json({ 'error': "Login first" })
        if (!isadmin) return res.status(401).json({ 'error': "You don't have the permission to ban users." })
        if (userId == intId) return res.status(403).json({ error: "You can't ban yourself" })

        try {

            const sql = "update users set banned = case when banned = 1 then 0 else 1 end where user_id = ? and tenant_id = ?"

            db.query(sql, [intId, tenantId], async (err, results) => {
                if (err) return res.status(500).json({ "error": `error occurred while retrieving uploaded file ${err}` })
                return res.status(200).json({ "message": 'User ban status successfully changed ', result: results });
            });

        } catch (error) {
            res.status(500).json({ "error": `Error occurred ${error}` })
        }
    }
    catch (error) {
        res.status(500).json({ "error": `Error occurred ${error}` })
    }

})

router.put('/users/role/:id', verifyToken, (req, res) => {
    try {
        const { id } = req.params;
        const intId = parseInt(id, 10);


        const userId = req.user ? req.user : false
        const isadmin = req.isadmin == 1 ? true : false
        const tenantId = req.tenant ? req.tenant : false
        if (!userId || !tenantId) return res.status(401).json({ 'error': "Login first" })
        if (!isadmin) return res.status(401).json({ 'error': "You don't have the permission to ban users." })
        if (userId == intId) return res.status(403).json({ error: "You can't change your own role." })
        try {

            const sql = "update users set isadmin = case when isadmin = 1 then 0 else 1 end where user_id = ? and tenant_id = ?"

            db.query(sql, [intId, tenantId], async (err, results) => {
                if (err) return res.status(500).json({ "error": `error occurred while retrieving uploaded file ${err}` })
                return res.status(200).json({ "message": 'User role successfully changed!', result: results });
            });

        } catch (error) {
            res.status(500).json({ "error": `Error occurred ${error}` })
        }
    }
    catch (error) {
        res.status(500).json({ "error": `Error occurred ${error}` })
    }

})

router.put('/update', verifyToken, (req, res) => {
    try {
        const { email, password, oldPassword } = req.body
        const userId = req.user ? req.user : false
        const tenantId = req.tenant ? req.tenant : false
        if (!userId || !tenantId) return res.status(401).json({ 'error': "Login first" })
        try {
            const sqluser = 'SELECT * FROM users WHERE email = ?';
            db.query(sqluser, [email], async (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                if (results.length === 0) return res.status(400).json({ error: 'Invalid current password' });
                const user = results[0];
                const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
                if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' })
                const sql = "update users set password_hash = ? where user_id = ?"
                const hashedPassword = await bcrypt.hash(password, 10);
                db.query(sql, [hashedPassword, userId], async (err, results) => {
                    if (err) return res.status(500).json({ "error": `error occurred while updating password ${err}` })
                    return res.status(200).json({ "message": 'Password successfully updated!' });
                });

            })




        } catch (error) {
            res.status(500).json({ "error": `Error occurred ${error}` })
        }
    }
    catch (error) {
        res.status(500).json({ "error": `Error occurred ${error}` })
    }

})

router.delete('/users/remove/:id', verifyToken, (req, res) => {
    try {
        const { id } = req.params;
        const intId = parseInt(id, 10);
        const userId = req.user ? req.user : false
        const isadmin = req.isadmin == 1 ? true : false
        const tenantId = req.tenant ? req.tenant : false
        if (!userId || !tenantId) return res.status(401).json({ 'error': "Login first" })
        if (!isadmin) return res.status(401).json({ 'error': "You don't have the permission to ban users." })
        if (userId == intId) return res.status(403).json({ error: "You can't remove yourself" })
        try {
            const sql = "delete from users where user_id = ? and tenant_id = ?"
            db.query(sql, [intId, tenantId], async (err, results) => {
                if (err) return res.status(500).json({ "error": `error occurred while retrieving uploaded file ${err}` })
                return res.status(200).json({ "message": 'User successfully Removed ', result: results });
            });

        } catch (error) {
            res.status(500).json({ "error": `Error occurred ${error}` })
        }
    }
    catch (error) {
        res.status(500).json({ "error": `Error occurred ${error}` })
    }

})



module.exports = router;
