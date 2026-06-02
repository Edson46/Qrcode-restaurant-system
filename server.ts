/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import db, { hashPassword, comparePassword, foodUnsplashIds, drinkUnsplashIds, fruitUnsplashIds } from './server/db';
import { UserRole, OrderStatus } from './src/types';
import qrcode from 'qrcode';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Custom session-verification and role protection helpers for RBAC
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const publicEndpoints = [
        { path: /^\/api\/menu$/, method: 'GET' },
        { path: /^\/api\/orders$/, method: 'POST' },
        { path: /^\/api\/orders$/, method: 'GET' },
        { path: /^\/api\/orders\/table\/\d+\/bill$/, method: 'POST' },
        { path: /^\/api\/notifications$/, method: 'POST' },
        { path: /^\/api\/qr\/\d+$/, method: 'GET' }
      ];

      const checkPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
      const isPublic = publicEndpoints.some(e => e.path.test(checkPath) && e.method === req.method);
      if (isPublic) {
        return next();
      }

      res.status(401).json({ error: 'Authentication Required: Please supply your floor staff PIN login.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const prefix = 'mock-jwt-token-';
    if (!token.startsWith(prefix)) {
      res.status(401).json({ error: 'Session token is corrupt or invalid.' });
      return;
    }

    const userId = token.substring(prefix.length);
    const user = db.getUsers().find(u => u.id === userId);
    if (!user) {
      res.status(401).json({ error: 'Session expired or staff user deleted.' });
      return;
    }

    (req as any).user = user;
    next();
  };

  const checkRole = (req: express.Request, res: express.Response, allowedRoles: string[]): boolean => {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: Staff session not found.' });
      return false;
    }
    
    if (user.role === 'Super Admin') {
      return true;
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    res.status(403).json({ error: `Access Denied: Action restricted. Required role: [${allowedRoles.join(', ')}]` });
    return false;
  };

  app.use(express.json());

  // Attach session authenticator to all /api/ endpoints except public auth login
  app.use('/api', (req, res, next) => {
    if (req.path === '/auth/login') {
      return next();
    }
    authenticateUser(req, res, next);
  });

  // Intercept image assets and fall back to public Unsplash CDN if they are still downloading in background
  app.use('/static/images', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'static', 'images', req.path);
    if (!fs.existsSync(filePath)) {
      // Parse file name to find category and index
      // e.g., /foods/food-12.jpg
      const match = req.path.match(/^\/(foods|drinks|fruits)\/(\w+)-(\d+)\.jpg$/);
      if (match) {
        const category = match[1]; // foods, drinks, fruits
        const idx = parseInt(match[3]) - 1;
        
        let unsplashId = '';
        if (category === 'foods' && idx >= 0 && idx < 40) {
          unsplashId = foodUnsplashIds[idx];
        } else if (category === 'drinks' && idx >= 0 && idx < 40) {
          unsplashId = drinkUnsplashIds[idx];
        } else if (category === 'fruits' && idx >= 0 && idx < 40) {
          unsplashId = fruitUnsplashIds[idx];
        }
        
        if (unsplashId) {
          const unsplashUrl = `https://images.unsplash.com/${unsplashId}?w=800&h=800&fit=crop&q=80`;
          res.redirect(unsplashUrl);
          return;
        }
      }
    }
    next();
  });

  // Static files for QR codes and local images
  app.get('/static/qr/table_:id.png', async (req, res, next) => {
    const tableId = Number(req.params.id);
    if (isNaN(tableId) || tableId < 1 || tableId > 100) {
      next();
      return;
    }

    const baseUrl = process.env.BASE_URL || process.env.APP_URL;
    const origin = baseUrl || (() => {
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      return `${protocol}://${host}`;
    })();
    const destinationUrl = `${origin.replace(/\/$/, '')}/table/${tableId}`;

    try {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for performance, unique per domain
      await qrcode.toFileStream(res, destinationUrl, {
        color: {
          dark: '#1e293b', // Deep charcoal
          light: '#f8fafc' // Slate light background
        },
        width: 300
      });
    } catch (err) {
      console.error('Dynamic static QR intercept error:', err);
      next();
    }
  });

  app.use('/static', express.static(path.join(process.cwd(), 'static')));

  // --- API ROUTING PANEL ---

  // Auth / Login API
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: 'Invalid username' });
      return;
    }

    if (!comparePassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    db.logAudit(user.id, user.username, user.role, 'Logged into Dashboard');

    res.json({
      token: `mock-jwt-token-${user.id}`,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });

  // Adding users (Admin/Manager limit)
  app.post('/api/auth/register', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    const requestor = (req as any).user;

    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      res.status(400).json({ error: 'Please supply username, password, and role.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Weak Password: Password must be at least 6 characters long.' });
      return;
    }

    // Role Escalation Protection: Only Super Admin can register an Admin/Super Admin
    if (role === 'Super Admin' && requestor.role !== 'Super Admin') {
      res.status(403).json({ error: 'Privilege Escalation Alert: Only Super Admin can register a Super Admin.' });
      return;
    }
    if (role === 'Admin' && requestor.role !== 'Super Admin') {
      res.status(403).json({ error: 'Privilege Escalation Alert: Only Super Admin can register an Admin.' });
      return;
    }

    const existing = db.getUserByUsername(username);
    if (existing) {
      res.status(400).json({ error: 'Username is already taken.' });
      return;
    }

    const newUser = db.addUser({
      username,
      role: role as UserRole,
      passwordHash: hashPassword(password)
    });

    db.logAudit(
      requestor.id,
      requestor.username,
      requestor.role,
      `Registered user "${username}" as role "${role}"`
    );

    res.json({ success: true, user: newUser });
  });

  // Audit Logs FETCH
  app.get('/api/audit-logs', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    const logs = db.getAuditLogs();
    res.json(logs);
  });

  // Users LIST
  app.get('/api/users', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    res.json(db.getUsers());
  });

  // Secure Password Reset for Super Admin / Admin
  app.post('/api/users/change-password', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    const requestor = (req as any).user;
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      res.status(400).json({ error: 'Please supply userId and newPassword' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Weak Password: Password must be at least 6 characters long.' });
      return;
    }

    const targetUser = db.getUsers().find(u => u.id === userId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Protection: only Super Admin can change password of another Super Admin or Admin
    if (targetUser.role === 'Super Admin' && requestor.role !== 'Super Admin') {
      res.status(403).json({ error: 'Unauthorized: Only Super Admin can change a Super Admin password.' });
      return;
    }
    if (targetUser.role === 'Admin' && requestor.role !== 'Super Admin' && requestor.id !== userId) {
      res.status(403).json({ error: 'Unauthorized: Only Super Admin can modify an Admin password.' });
      return;
    }

    const success = db.updateUserPassword(userId, hashPassword(newPassword));
    if (success) {
      db.logAudit(
        requestor.id,
        requestor.username,
        requestor.role,
        `Changed password for user "${targetUser.username}" (${targetUser.role})`
      );
      res.json({ success: true, message: `Successfully changed password for user ${targetUser.username}.` });
    } else {
      res.status(500).json({ error: 'Failed to update user password.' });
    }
  });

  // Secure User Deletion
  app.delete('/api/users/:id', (req, res) => {
    if (!checkRole(req, res, ['Super Admin'])) return;
    const requestor = (req as any).user;
    const { id } = req.params;

    if (requestor.id === id) {
      res.status(400).json({ error: 'Self Destruction Blocked: You cannot delete your own Super Admin account.' });
      return;
    }

    const targetUser = db.getUsers().find(u => u.id === id);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const success = db.deleteUser(id);
    if (success) {
      db.logAudit(
        requestor.id,
        requestor.username,
        requestor.role,
        `Deleted user account "${targetUser.username}" (${targetUser.role})`
      );
      res.json({ success: true, message: `Successfully deleted user account ${targetUser.username}.` });
    } else {
      res.status(500).json({ error: 'Failed to delete user.' });
    }
  });

  // System Core Reset Endpoint
  app.post('/api/system/reset-orders', (req, res) => {
    if (!checkRole(req, res, ['Super Admin'])) return;
    const requestor = (req as any).user;

    try {
      db.resetSystemOrders();
      db.logAudit(
        requestor.id,
        requestor.username,
        requestor.role,
        'Performed total system database factory reset (cleared all orders, payments, tables, and notifications)'
      );
      res.json({ success: true, message: 'Successfully completed total factory reset.' });
    } catch (err: any) {
      res.status(500).json({ error: `Database reset failed: ${err.message}` });
    }
  });

  // Menu APIs
  app.get('/api/menu', (req, res) => {
    res.json(db.getMenuItems());
  });

  app.post('/api/menu', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    const requestor = (req as any).user;

    const { name, category, price, description, imageUrl, isAvailable, base64Data } = req.body;
    if (!name || !category || typeof price !== 'number') {
      res.status(400).json({ error: 'Name, Category and Price (number) are required' });
      return;
    }

    const item = db.addMenuItem({
      name,
      category: category as 'Food' | 'Drink' | 'Fruit',
      price,
      description: description || '',
      imageUrl: imageUrl || '',
      isAvailable: isAvailable !== false
    });

    if (base64Data) {
      const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Val = matches[2];
        const buffer = Buffer.from(base64Val, 'base64');
        let ext = 'jpg';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
        
        const catFolder = item.category.toLowerCase() + 's';
        const savedName = `${item.id}_${Date.now()}.${ext}`;
        const relativePath = `/static/images/${catFolder}/${savedName}`;
        const absolutePath = path.join(process.cwd(), relativePath);
        
        try {
          fs.writeFileSync(absolutePath, buffer);
          item.imageUrl = relativePath;
          item.image_url = relativePath;
          item.image_name = savedName;
          db.updateMenuItem(item.id, {
            imageUrl: relativePath,
            image_url: relativePath,
            image_name: savedName
          });
        } catch (e) {
          console.error('Failed to save cuisine upload:', e);
        }
      }
    }

    db.logAudit(requestor.id, requestor.username, requestor.role, `Added menu item: "${name}" (${category})`);
    res.json(item);
  });

  app.put('/api/menu/:id', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    const requestor = (req as any).user;

    const { id } = req.params;
    const { base64Data, ...updatedFields } = req.body;
    
    let extraFields: any = {};
    if (base64Data) {
      const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Val = matches[2];
        const buffer = Buffer.from(base64Val, 'base64');
        let ext = 'jpg';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
        
        const existing = db.getMenuItems().find(i => i.id === id);
        if (existing) {
          const catFolder = existing.category.toLowerCase() + 's';
          const savedName = `${existing.id}_${Date.now()}.${ext}`;
          const relativePath = `/static/images/${catFolder}/${savedName}`;
          const absolutePath = path.join(process.cwd(), relativePath);
          
          try {
            if (existing.image_name && !existing.image_name.startsWith('food-') && !existing.image_name.startsWith('drink-') && !existing.image_name.startsWith('fruit-')) {
              const oldAbsPath = path.join(process.cwd(), 'static', 'images', catFolder, existing.image_name);
              if (fs.existsSync(oldAbsPath)) {
                fs.unlinkSync(oldAbsPath);
              }
            }
            
            fs.writeFileSync(absolutePath, buffer);
            extraFields.imageUrl = relativePath;
            extraFields.image_url = relativePath;
            extraFields.image_name = savedName;
          } catch (e) {
            console.error('Failed to update cuisine upload:', e);
          }
        }
      }
    }

    const result = db.updateMenuItem(id, { ...updatedFields, ...extraFields });
    if (!result) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    db.logAudit(requestor.id, requestor.username, requestor.role, `Updated menu item: "${result.name}"`);
    res.json(result);
  });

  app.delete('/api/menu/:id', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    const requestor = (req as any).user;

    const { id } = req.params;
    const { name } = req.query;
    db.deleteMenuItem(id);

    db.logAudit(
      requestor.id,
      requestor.username,
      requestor.role,
      `Deleted menu item: "${name || id}"`
    );
    res.json({ success: true });
  });

  // Upload menu image base64
  app.post('/api/menu/:id/image', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    const requestor = (req as any).user;

    const { id } = req.params;
    const { base64Data } = req.body;
    
    if (!base64Data) {
      res.status(400).json({ error: 'Missing base64Data' });
      return;
    }
    
    // Parse base64
    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches) {
       res.status(400).json({ error: 'Invalid base64 format' });
       return;
    }
    
    const mimeType = matches[1];
    const base64Val = matches[2];
    const buffer = Buffer.from(base64Val, 'base64');
    
    // Determine extension
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    
    // Find menu item
    const item = db.getMenuItems().find(i => i.id === id);
    if (!item) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }
    
    // Build path
    const catFolder = item.category.toLowerCase() + 's'; // foods, drinks, fruits
    const savedName = `${item.id}_${Date.now()}.${ext}`;
    const relativePath = `/static/images/${catFolder}/${savedName}`;
    const absolutePath = path.join(process.cwd(), relativePath);
    
    try {
      // Write file
      fs.writeFileSync(absolutePath, buffer);
      
      // Update db
      const updated = db.updateMenuItem(id, {
        imageUrl: relativePath,
        image_url: relativePath,
        image_name: savedName
      });
      
      db.logAudit(
        requestor.id,
        requestor.username,
        requestor.role,
        `Uploaded new image for "${item?.name}"`
      );
      res.json(updated);
    } catch (err: any) {
      console.error('Failed to save image:', err);
      res.status(500).json({ error: 'Failed to write image to disk: ' + err.message });
    }
  });

  // Delete menu image
  app.delete('/api/menu/:id/image', (req, res) => {
    if (!checkRole(req, res, ['Admin'])) return;
    const requestor = (req as any).user;

    const { id } = req.params;
    const item = db.getMenuItems().find(i => i.id === id);
    if (!item) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    // Try deleting old file on disk (only if it's a dynamic upload, not a seeded ID image)
    if (item.image_name && !item.image_name.startsWith('food-') && !item.image_name.startsWith('drink-') && !item.image_name.startsWith('fruit-')) {
      const catFolder = item.category.toLowerCase() + 's';
      const absolutePath = path.join(process.cwd(), 'static', 'images', catFolder, item.image_name);
      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (e) {
          // ignore error
        }
      }
    }

    const updated = db.updateMenuItem(id, {
      imageUrl: '',
      image_url: '',
      image_name: ''
    });

    db.logAudit(
      requestor.id,
      requestor.username,
      requestor.role,
      `Deleted image of "${item.name}"`
    );
    res.json(updated);
  });

  // Tables Routing
  app.get('/api/tables', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Manager', 'Cashier', 'Waiter'])) return;
    res.json(db.getTables());
  });

  // Expose a dynamic, 100% self-hosted QR code generator with no external dependencies
  app.get('/api/qr/:id', async (req, res) => {
    const tableId = Number(req.params.id);
    if (isNaN(tableId) || tableId < 1 || tableId > 100) {
      res.status(400).send('Invalid Table ID (1 to 100)');
      return;
    }

    const baseUrl = process.env.BASE_URL || process.env.APP_URL;
    const origin = baseUrl || (() => {
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      return `${protocol}://${host}`;
    })();
    const destinationUrl = `${origin.replace(/\/$/, '')}/table/${tableId}`;

    try {
      res.setHeader('Content-Type', 'image/png');
      await qrcode.toFileStream(res, destinationUrl, {
        color: {
          dark: '#1e293b', // Deep charcoal
          light: '#f8fafc' // Slate light background
        },
        width: 300
      });
    } catch (err) {
      console.error('Dynamic QR generation error:', err);
      res.status(500).send('QR Code generation failed');
    }
  });

  app.post('/api/tables/status', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Manager', 'Cashier', 'Waiter'])) return;
    const requestor = (req as any).user;

    const { id, status } = req.body;
    db.updateTableStatus(Number(id), status);
    db.logAudit(requestor.id, requestor.username, requestor.role, `Set Table ${id} status to ${status}`);
    res.json({ success: true });
  });

  // Active Orders APIs
  app.get('/api/orders', (req, res) => {
    // Both public customers and staff can fetch orders, handled by global middleware routing
    res.json(db.getOrders());
  });

  app.post('/api/orders', (req, res) => {
    const { tableId, items, notes } = req.body;
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Table number and order items are required' });
      return;
    }

    const order = db.placeOrder(Number(tableId), items, notes);
    db.logAudit('customer', `Table ${tableId}`, 'Customer', `Submitted new order of ${items.length} items`);
    res.json(order);
  });

  // Status updates
  app.put('/api/orders/:id/status', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen Staff', 'Bar Staff'])) return;
    const requestor = (req as any).user;

    const { id } = req.params;
    const { status } = req.body;
    const order = db.updateOrderStatus(id, status as OrderStatus);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    db.logAudit(requestor.id, requestor.username, requestor.role, `Changed order ${id} status to ${status}`);
    res.json(order);
  });

  // Billing Submission
  app.post('/api/orders/table/:id/bill', (req, res) => {
    const tableId = Number(req.params.id);
    const result = db.initiateBilling(tableId);
    db.logAudit('customer', `Table ${tableId}`, 'Customer', `Initiated billing checkout`);
    res.json(result);
  });

  // Payments / Cashier settlement
  app.post('/api/payments', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Cashier'])) return;
    const requestor = (req as any).user;

    const { tableId, method, amount } = req.body;
    if (!tableId || !method || !amount) {
      res.status(400).json({ error: 'Missing payment params (tableId, method, amount)' });
      return;
    }

    const result = db.registerPayment(Number(tableId), method, Number(amount));
    if (!result.success) {
      res.status(400).json({ error: result.message || 'Payment register failed.' });
      return;
    }

    db.logAudit(requestor.id, requestor.username, requestor.role, `Settled table ${tableId} bill of TZS ${amount.toLocaleString()} via ${method}`);
    res.json(result);
  });

  app.get('/api/payments', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Manager', 'Cashier'])) return;
    res.json(db.getPayments());
  });

  // Notifications API
  app.get('/api/notifications', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen Staff', 'Bar Staff'])) return;
    const { role } = req.query;
    res.json(db.getNotifications(role as UserRole));
  });

  app.post('/api/notifications', (req, res) => {
    const { message, type, role } = req.body;
    if (!message || !type || !role) {
      res.status(400).json({ error: 'Missing parameters message, type, role.' });
      return;
    }
    const notif = db.addNotification({ message, type, role });
    res.json(notif);
  });

  app.post('/api/notifications/read', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen Staff', 'Bar Staff'])) return;
    const { role } = req.body;
    db.markNotificationsAsRead(role as UserRole);
    res.json({ success: true });
  });

  app.post('/api/notifications/read-single', (req, res) => {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: 'Missing notification ID' });
      return;
    }
    db.markNotificationIdAsRead(id);
    res.json({ success: true });
  });

  // Reports
  app.get('/api/manager/stats', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Manager'])) return;
    res.json(db.getManagerReports());
  });

  // Privacy Settings Status API
  app.get('/api/privacy-status', (req, res) => {
    if (!checkRole(req, res, ['Super Admin', 'Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen Staff', 'Bar Staff'])) return;
    res.json(db.getPrivacySettings());
  });

  app.post('/api/privacy-status', (req, res) => {
    if (!checkRole(req, res, ['Super Admin', 'Admin'])) return;
    const requestor = (req as any).user;
    const { maskFinancialMetrics, maskCustomerData, maskPayments } = req.body;
    
    const updated = db.updatePrivacySettings({
      maskFinancialMetrics: !!maskFinancialMetrics,
      maskCustomerData: !!maskCustomerData,
      maskPayments: !!maskPayments
    });

    db.logAudit(
      requestor.id, 
      requestor.username, 
      requestor.role, 
      `Updated Global Privacy Filters (maskFinancial=${!!maskFinancialMetrics}, maskCustomer=${!!maskCustomerData}, maskPayments=${!!maskPayments})`
    );
    res.json(updated);
  });

  // Report Export Endpoint
  app.get('/api/manager/export', (req, res) => {
    if (!checkRole(req, res, ['Admin', 'Manager'])) return;
    const { type } = req.query; // e.g. 'csv'
    const stats = db.getManagerReports();
    const payments = db.getPayments();

    if (type === 'csv') {
      let csv = 'Payment ID,Table ID,Amount (TZS),Payment Method,Date\n';
      payments.forEach(p => {
        csv += `${p.id},${p.tableId},${p.amount},${p.paymentMethod},${p.createdAt}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
      res.status(200).send(csv);
      return;
    }

    res.status(400).json({ error: 'Invalid export type. Only csv is supported currently.' });
  });

  // --- VITE DEV AND PROD SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartMenu TZ is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
