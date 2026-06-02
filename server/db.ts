/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import qrcode from 'qrcode';
import bcrypt from 'bcryptjs';
import { MenuItem, RestaurantTable, Order, OrderItem, Payment, Notification, AuditLog, User, UserRole, OrderStatus } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'database.json');
const STATIC_QR_DIR = path.join(process.cwd(), 'static', 'qr');

// Curated Unsplash IDs for 40 Foods, 40 Drinks, 40 Fruits
const foodUnsplashIds = [
  'photo-1565299624946-b28f40a0ae38', 'photo-1546069901-ba9599a7e63c', 'photo-1567620905732-2d1ec7ab7445',
  'photo-1540189549336-e6e99c3679fe', 'photo-1555939594-58d7cb561ad1', 'photo-1512621776951-a57141f2eefd',
  'photo-1484723091739-30a097e8f929', 'photo-1504674900247-0877df9cc836', 'photo-1482049016688-2d3e1b311543',
  'photo-1473093295043-cdd812d0e601', 'photo-1476224203421-9ac39bcb3327', 'photo-1498837167922-ddd27525d352',
  'photo-1529042410759-befb1204b468', 'photo-1490645935967-10de6ba17061', 'photo-1544025162-d76694265947',
  'photo-1504754524776-8f4f37790ca0', 'photo-1551183053-bf91a1d81141', 'photo-1515003844-1098c543a824',
  'photo-1534422298391-e4f8c172dddb', 'photo-1432139555190-58524dae6a55', 'photo-1533089860891-a7c6fe34c55e',
  'photo-1564834724105-918b73d1b9e0', 'photo-1608897013039-887f21d8c804', 'photo-1543353071-10c8ba85a904',
  'photo-1414235077428-338989a2e8c0', 'photo-1506084868230-bb9d95c24759', 'photo-1604382355076-af4b0eb60143',
  'photo-1585032226651-759b368d7246', 'photo-1512058564366-18510be2db19', 'photo-1526318896980-cf78c088247c',
  'photo-1589301760014-d929f3979dbc', 'photo-1574484284002-5dd7fc1d8d06', 'photo-1551818255-e6e10975bc17',
  'photo-1562967914-608f82629710', 'photo-1551024601-bec78aea704b', 'photo-1568901346375-23c9450c58cd',
  'photo-1585238342024-78d387f4a707', 'photo-1594212699903-ec8a3eca50f5', 'photo-1626082927389-6cd097cdc6ec',
  'photo-1603052875302-d376b7c0638a'
];

const drinkUnsplashIds = [
  'photo-1513558161293-cdaf765ed2fd', 'photo-1497534446932-c925b458314e', 'photo-1551024709-8f23befc6f87',
  'photo-1544787219-7f47ccb76574', 'photo-1514432324607-a09d9b4aefdd', 'photo-1563227812-0ea4c22e6cc8',
  'photo-1551893086-c0a59533b940', 'photo-1536935338788-846bb9981813', 'photo-1595981267035-7b04ec877f96',
  'photo-1517256064527-09c53b2d0bc6', 'photo-1538081468248-137bc7d35319', 'photo-1579954115545-a95591f28bfc',
  'photo-1498804103079-a6351b050096', 'photo-1541167760496-1628856ab772', 'photo-1578314675249-a6910f80cc4e',
  'photo-1522012147041-30a1120a123d', 'photo-1527960656376-74dfb2c1f49a', 'photo-1507133750040-4a8f57021571',
  'photo-1556881286-fc6915169721', 'photo-1548695602-b223c2394574', 'photo-1561701216-0e101ba035e9',
  'photo-1595981266696-613d8d648fff', 'photo-1587314168485-3236d6710814', 'photo-1510591509382-74947dd7f55c',
  'photo-1572490122747-3968b75cc699', 'photo-1542556014-f7724fe950fb', 'photo-1541658016709-82535e94bc69',
  'photo-1570968915860-54d5c301fc9f', 'photo-1534353436294-0dbd4bdac845', 'photo-1557142046-c704a3adf364',
  'photo-1513360309081-36f52278a327', 'photo-1532713031318-7b8d44e4d1c0', 'photo-1556742049-0cfed4f6a45d',
  'photo-1560512823-829485b8bf24', 'photo-1518085033989-2479f6498a87', 'photo-1592317450782-a072bf485647',
  'photo-1595981267035-7b04ec877f96', 'photo-1596797882244-16223126f423', 'photo-1552611052-33e04de081de',
  'photo-1622483767028-3f66f32aef97'
];

const fruitUnsplashIds = [
  'photo-1571771894821-ce9b6c11b08e', 'photo-1560806887-1e4cd0b6cbd6', 'photo-1582979512210-99b6a53386f9',
  'photo-1553279768-865429fa0078', 'photo-1550258987-190a2d41a8ba', 'photo-1587049352846-4a222e784d38',
  'photo-1528825871115-3581a5387919', 'photo-1523049673857-eb18f1d7b578', 'photo-1534531173927-aeb928d54385',
  'photo-1537640538966-79f369143f8f', 'photo-1464965911861-746a04b4bca6', 'photo-1514813582136-4c91f6874e4c',
  'photo-1590502596717-29916f1555df', 'photo-1591238372138-161cffa24a9a', 'photo-1584947938361-b5597ea844c8',
  'photo-1536631580005-59b3afc766e4', 'photo-1598425261053-ec4b68e9185a', 'photo-1547849940-e14bde66a2cb',
  'photo-1599940824399-b87987ceb72a', 'photo-1521245367615-5606d0cb7483', 'photo-1585250951163-9d8a1dbfb9cd',
  'photo-1519162584242-71d53d4e68b6', 'photo-1490645935967-10de6ba17061', 'photo-1543157145-f78b636d023d',
  'photo-1605291410756-3c0f4dfbc524', 'photo-1610970881699-44a5587cabec', 'photo-1611080626919-7cf5a9dbab5b',
  'photo-1619546813926-a78fa6372cd2', 'photo-1524222839446-49a71f008859', 'photo-1513530534585-c7b1394c6d51',
  'photo-1596797882244-16223126f423', 'photo-1560806887-1e4cd0b6cbd6', 'photo-1595272172859-e3347f4803d2',
  'photo-1534531173927-aeb928d54385', 'photo-1615485290382-441e4d049cb5', 'photo-1506084868230-bb9d95c24759',
  'photo-1549417229-aa67d3263c09', 'photo-1511690656952-34342bb7c2f2', 'photo-1544025162-d76694265947',
  'photo-1537640538966-79f369143f8f'
];

export { foodUnsplashIds, drinkUnsplashIds, fruitUnsplashIds };

interface DatabaseSchema {
  users: Array<User & { passwordHash: string }>;
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  orders: Order[];
  payments: Payment[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  privacySettings?: {
    maskFinancialMetrics: boolean;
    maskCustomerData: boolean;
    maskPayments: boolean;
  };
}

// Password hashing using bcrypt
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// Compare password key using bcrypt with legacy SHA256 fallback
export function comparePassword(password: string, hash: string): boolean {
  try {
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return bcrypt.compareSync(password, hash);
    }
  } catch (err) {
    // Ignore and fallback
  }
  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  return legacyHash === hash;
}

class DB {
  private data: DatabaseSchema = {
    users: [],
    menuItems: [],
    tables: [],
    orders: [],
    payments: [],
    notifications: [],
    auditLogs: [],
    privacySettings: {
      maskFinancialMetrics: false,
      maskCustomerData: false,
      maskPayments: false
    }
  };

  constructor() {
    this.init();
  }

  private init() {
    // Ensure static/qr directory exists
    if (!fs.existsSync(STATIC_QR_DIR)) {
      fs.mkdirSync(STATIC_QR_DIR, { recursive: true });
    }

    // Ensure image folders exist
    const imageDirs = [
      path.join(process.cwd(), 'static', 'images', 'foods'),
      path.join(process.cwd(), 'static', 'images', 'drinks'),
      path.join(process.cwd(), 'static', 'images', 'fruits')
    ];
    imageDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error('Error reading database file, starting fresh', err);
        this.data = {
          users: [],
          menuItems: [],
          tables: [],
          orders: [],
          payments: [],
          notifications: [],
          auditLogs: [],
          privacySettings: {
            maskFinancialMetrics: false,
            maskCustomerData: false,
            maskPayments: false
          }
        };
      }
    }

    // Seed defaults if needed
    let modified = false;

    if (!this.data.privacySettings) {
      this.data.privacySettings = {
        maskFinancialMetrics: false,
        maskCustomerData: false,
        maskPayments: false
      };
      modified = true;
    }

    if (this.data.users.length === 0) {
      this.seedUsers();
      modified = true;
    }

    if (this.data.menuItems.length === 0) {
      this.seedMenuItems();
      modified = true;
    }

    if (this.data.tables.length === 0) {
      this.seedTables();
      modified = true;
    }

    // Ensure Super Admin exists at all times
    const hasSuperAdmin = this.data.users.some(u => u.role === 'Super Admin');
    if (!hasSuperAdmin) {
      console.log('Provisioning Super Admin user default in database...');
      this.data.users.push({
        id: crypto.randomUUID(),
        username: 'superadmin',
        role: 'Super Admin',
        passwordHash: hashPassword('superadmin123'),
        createdAt: new Date().toISOString()
      });
      modified = true;
    }

    // Proactively upgrade any legacy SHA255/SHA256 password hash inside database.json to bcrypt safely
    let userHashesUpdated = false;
    this.data.users = this.data.users.map(u => {
      const hash = u.passwordHash;
      if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$')) {
        const defaultPasswords: Record<string, string> = {
          'superadmin': 'superadmin123',
          'admin': 'admin123',
          'manager': 'manager123',
          'cashier': 'cashier123',
          'waiter': 'waiter123',
          'kitchen': 'kitchen123',
          'bar': 'bar123'
        };
        const defaultPass = defaultPasswords[u.username.toLowerCase()];
        if (defaultPass) {
          u.passwordHash = hashPassword(defaultPass);
          userHashesUpdated = true;
        }
      }
      return u;
    });

    if (userHashesUpdated) {
      modified = true;
    }

    // Dynamic field migration for existing menu items
    let schemaModified = false;
    this.data.menuItems = this.data.menuItems.map((item, idx) => {
      let changed = false;
      if (!item.image_url) {
        if (item.category === 'Food') {
          item.image_url = `/static/images/foods/food-${idx % 40 + 1}.jpg`;
        } else if (item.category === 'Drink') {
          item.image_url = `/static/images/drinks/drink-${idx % 40 + 1}.jpg`;
        } else {
          item.image_url = `/static/images/fruits/fruit-${idx % 40 + 1}.jpg`;
        }
        changed = true;
      }
      if (!item.image_name) {
        if (item.category === 'Food') {
          item.image_name = `food-${idx % 40 + 1}.jpg`;
        } else if (item.category === 'Drink') {
          item.image_name = `drink-${idx % 40 + 1}.jpg`;
        } else {
          item.image_name = `fruit-${idx % 40 + 1}.jpg`;
        }
        changed = true;
      }
      if (!item.imageUrl) {
        item.imageUrl = item.image_url;
        changed = true;
      }
      if (changed) schemaModified = true;
      return item;
    });

    if (modified || schemaModified) {
      this.save();
    }

    // Generate QR Codes for tables that do not have them physically written yet
    this.generateQRForTables();

    // Trigger background image downloads safely
    this.downloadSeedImages();
  }

  private downloadSeedImages() {
    console.log('Initiating static seed image synchronization in background...');
    this.data.menuItems.forEach((item, idx) => {
      let relativePath = '';
      let unsplashId = '';
      
      if (item.category === 'Food') {
        const fIdx = idx % 40;
        relativePath = `/static/images/foods/food-${fIdx + 1}.jpg`;
        unsplashId = foodUnsplashIds[fIdx] || foodUnsplashIds[0];
      } else if (item.category === 'Drink') {
        const dIdx = idx % 40;
        relativePath = `/static/images/drinks/drink-${dIdx + 1}.jpg`;
        unsplashId = drinkUnsplashIds[dIdx] || drinkUnsplashIds[0];
      } else if (item.category === 'Fruit') {
        const fIdx = idx % 40;
        relativePath = `/static/images/fruits/fruit-${fIdx + 1}.jpg`;
        unsplashId = fruitUnsplashIds[fIdx] || fruitUnsplashIds[0];
      }
      
      const filePath = path.join(process.cwd(), relativePath);
      if (!fs.existsSync(filePath)) {
        const downloadUrl = `https://images.unsplash.com/${unsplashId}?w=800&h=800&fit=crop&q=80`;
        fetch(downloadUrl)
          .then(async (res) => {
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              fs.writeFileSync(filePath, Buffer.from(buffer));
            }
          })
          .catch(() => {
            // Silence background download errors
          });
      }
    });
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database.json', err);
    }
  }

  private seedUsers() {
    console.log('Seeding default staff users...');
    const roles: { username: string; password: string; role: UserRole }[] = [
      { username: 'superadmin', password: 'superadmin123', role: 'Super Admin' },
      { username: 'admin', password: 'admin123', role: 'Admin' },
      { username: 'manager', password: 'manager123', role: 'Manager' },
      { username: 'cashier', password: 'cashier123', role: 'Cashier' },
      { username: 'waiter', password: 'waiter123', role: 'Waiter' },
      { username: 'kitchen', password: 'kitchen123', role: 'Kitchen Staff' },
      { username: 'bar', password: 'bar123', role: 'Bar Staff' }
    ];

    this.data.users = roles.map(r => ({
      id: crypto.randomUUID(),
      username: r.username,
      role: r.role,
      passwordHash: hashPassword(r.password),
      createdAt: new Date().toISOString()
    }));
  }

  private seedMenuItems() {
    console.log('Seeding 120+ menu items across regions...');
    const foods = [
      'Pilau', 'Wali Kuku', 'Wali Maharage', 'Ugali Samaki', 'Ugali Nyama',
      'Ugali Kuku', 'Chips Kuku', 'Chips Mayai', 'Chips Mishkaki', 'Burger',
      'Pizza', 'Biryani', 'Fried Rice', 'Beef Stew', 'Chicken Curry',
      'Chapati Maharage', 'Chapati Ndengu', 'Spaghetti', 'Macaroni', 'Mishkaki',
      'Nyama Choma', 'Kuku Choma', 'Fish Grill', 'Goat Meat', 'Rice Beans',
      'Rice Beef', 'Rice Chicken', 'Rice Fish', 'Beef Burger', 'Chicken Burger',
      'Hot Dog', 'Sandwich', 'Vegetable Rice', 'Coconut Rice', 'Pilau Beef',
      'Pilau Chicken', 'Pilau Fish', 'Beef Pilau', 'Chicken Pilau', 'Family Combo'
    ];

    const drinks = [
      'Coca Cola', 'Fanta Orange', 'Fanta Blackcurrant', 'Sprite', 'Pepsi',
      'Mirinda', 'Water Small', 'Water Large', 'Soda', 'Juice Mango',
      'Juice Orange', 'Juice Pineapple', 'Juice Passion', 'Juice Mixed', 'Milk Shake Vanilla',
      'Milk Shake Chocolate', 'Milk Shake Strawberry', 'Coffee Black', 'Coffee Milk', 'Tea Black',
      'Tea Milk', 'Tea Masala', 'Energy Drink', 'Malt Drink', 'Lemon Juice',
      'Ginger Juice', 'Iced Tea', 'Iced Coffee', 'Smoothie Mango', 'Smoothie Banana',
      'Smoothie Avocado', 'Smoothie Mixed', 'Espresso', 'Cappuccino', 'Latte',
      'Mocha', 'Hot Chocolate', 'Fresh Milk', 'Yoghurt Drink', 'Special Juice'
    ];

    const fruits = [
      'Banana', 'Apple', 'Orange', 'Mango', 'Pineapple',
      'Watermelon', 'Papaya', 'Avocado', 'Passion Fruit', 'Grapes',
      'Strawberry', 'Pear', 'Lemon', 'Lime', 'Coconut',
      'Guava', 'Jackfruit', 'Dates', 'Plum', 'Peach',
      'Kiwi', 'Mixed Fruit Bowl', 'Fruit Salad', 'Fruit Platter', 'Banana Bowl',
      'Apple Bowl', 'Orange Bowl', 'Mango Bowl', 'Pineapple Bowl', 'Watermelon Bowl',
      'Papaya Bowl', 'Avocado Bowl', 'Tropical Mix', 'Fresh Mix', 'Premium Mix',
      'Family Fruit Pack', 'Kids Fruit Pack', 'Healthy Bowl', 'Vitamin Bowl', 'Special Fruit Combo'
    ];

    // Map base pricing structures
    const items: MenuItem[] = [];

    foods.forEach((food, idx) => {
      items.push({
        id: `food-${idx + 1}`,
        name: food,
        category: 'Food',
        price: 3500 + (idx % 8) * 2000 + (food.includes('Combo') || food.includes('Pizza') ? 8000 : 0),
        description: `Delicious traditional and modern ${food} prepared fresh by our local chefs.`,
        imageUrl: `/static/images/foods/food-${idx + 1}.jpg`,
        image_url: `/static/images/foods/food-${idx + 1}.jpg`,
        image_name: `food-${idx + 1}.jpg`,
        isAvailable: true
      });
    });

    drinks.forEach((drink, idx) => {
      items.push({
        id: `drink-${idx + 1}`,
        name: drink,
        category: 'Drink',
        price: 1500 + (idx % 6) * 1200 + (drink.includes('Smoothie') || drink.includes('Shake') ? 2500 : 0),
        description: `Refreshing ${drink} served chilled or hot per your preference.`,
        imageUrl: `/static/images/drinks/drink-${idx + 1}.jpg`,
        image_url: `/static/images/drinks/drink-${idx + 1}.jpg`,
        image_name: `drink-${idx + 1}.jpg`,
        isAvailable: true
      });
    });

    fruits.forEach((fruit, idx) => {
      items.push({
        id: `fruit-${idx + 1}`,
        name: fruit,
        category: 'Fruit',
        price: 1000 + (idx % 5) * 1000 + (fruit.includes('Pack') || fruit.includes('Combo') ? 4000 : 0),
        description: `Sweet, fresh organic ${fruit} sourced from domestic farms.`,
        imageUrl: `/static/images/fruits/fruit-${idx + 1}.jpg`,
        image_url: `/static/images/fruits/fruit-${idx + 1}.jpg`,
        image_name: `fruit-${idx + 1}.jpg`,
        isAvailable: true
      });
    });

    this.data.menuItems = items;
  }

  private seedTables() {
    console.log('Seeding 100 restaurant tables with structural schemas...');
    const tables: RestaurantTable[] = [];
    for (let i = 1; i <= 100; i++) {
      tables.push({
        id: i,
        qrPath: `/static/qr/table_${i}.png`,
        status: 'Empty'
      });
    }
    this.data.tables = tables;
  }

  private async generateQRForTables() {
    console.log('Regenerating and verifying table QR Code exports (Table 1 to Table 100)...');
    const baseUrl = process.env.BASE_URL || process.env.APP_URL || 'http://localhost:3000';
    console.log(`Using base URL for QR codes: ${baseUrl}`);
    for (let i = 1; i <= 100; i++) {
      const qrPath = path.join(STATIC_QR_DIR, `table_${i}.png`);
      try {
        const content = `${baseUrl}/table/${i}`;
        await qrcode.toFile(qrPath, content, {
          color: {
            dark: '#1e293b', // Deep charcoal
            light: '#f8fafc' // Slate light background
          },
          width: 300
        });
      } catch (err) {
        console.error(`Failed to generate QR for Table ${i}:`, err);
      }
    }
    console.log('QR table assets synchronized successfully.');
  }

  // --- API Functions ---

  // AUTH
  public getUsers() {
    return this.data.users.map(({ passwordHash, ...user }) => user);
  }

  public getUserByUsername(username: string) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public updateUserPassword(userId: string, passwordHash: string): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.passwordHash = passwordHash;
      this.save();
      return true;
    }
    return false;
  }

  public deleteUser(userId: string): boolean {
    const originalLength = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== userId);
    if (this.data.users.length < originalLength) {
      this.save();
      return true;
    }
    return false;
  }

  public resetSystemOrders(): void {
    this.data.orders = [];
    this.data.payments = [];
    this.data.notifications = [];
    this.data.tables = this.data.tables.map(t => ({ ...t, status: 'Empty' }));
    this.save();
  }

  public addUser(user: Omit<User, 'id' | 'createdAt'> & { passwordHash: string }) {
    const newUser = {
      id: crypto.randomUUID(),
      username: user.username,
      role: user.role,
      passwordHash: user.passwordHash,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return { id: newUser.id, username: newUser.username, role: newUser.role };
  }

  public logAudit(userId: string, username: string, role: string, action: string) {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      userId,
      username,
      role,
      action,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  // TABLES
  public getTables() {
    return this.data.tables;
  }

  public updateTableStatus(tableId: number, status: 'Empty' | 'Ordering' | 'Occupied' | 'Billing') {
    const table = this.data.tables.find(t => t.id === tableId);
    if (table) {
      table.status = status;
      this.save();
    }
  }

  // MENU ITEMS
  public getMenuItems() {
    return this.data.menuItems;
  }

  public addMenuItem(item: Omit<MenuItem, 'id'>) {
    const newItem: MenuItem = {
      id: `${item.category.toLowerCase()}-${Date.now()}`,
      ...item
    };
    this.data.menuItems.push(newItem);
    this.save();
    return newItem;
  }

  public updateMenuItem(id: string, updated: Partial<MenuItem>) {
    const item = this.data.menuItems.find(i => i.id === id);
    if (item) {
      Object.assign(item, updated);
      this.save();
      return item;
    }
    return null;
  }

  public deleteMenuItem(id: string) {
    this.data.menuItems = this.data.menuItems.filter(i => i.id !== id);
    this.save();
    return true;
  }

  // ORDERS
  public getOrders() {
    return this.data.orders;
  }

  public getOrder(id: string) {
    return this.data.orders.find(o => o.id === id);
  }

  public placeOrder(tableId: number, items: Array<Omit<OrderItem, 'id'>>, notes?: string) {
    const orderItems: OrderItem[] = items.map(it => ({
      id: crypto.randomUUID(),
      ...it
    }));

    const totalAmount = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const newOrder: Order = {
      id: crypto.randomUUID(),
      tableId,
      status: 'Pending',
      items: orderItems,
      totalAmount,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);
    this.updateTableStatus(tableId, 'Ordering');

    // Create a real-time notification
    this.addNotification({
      message: `New order submitted from Table ${tableId} (TZS ${totalAmount.toLocaleString()})`,
      type: 'OrderPlaced',
      role: 'Waiter'
    });

    this.save();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = this.data.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();

      const timeStr = new Date().toISOString();
      if (status === 'Accepted') order.acceptedAt = timeStr;
      if (status === 'Preparing') order.acceptedAt = order.acceptedAt || timeStr;
      if (status === 'Ready') order.preparedAt = timeStr;
      if (status === 'Served') {
        order.servedAt = timeStr;
        this.updateTableStatus(order.tableId, 'Occupied');
      }

      if (status === 'Completed' || status === 'Cancelled' || status === 'Paid') {
        if (status === 'Completed' || status === 'Paid') {
          this.updateTableStatus(order.tableId, 'Empty');
        } else if (status === 'Cancelled') {
          this.updateTableStatus(order.tableId, 'Empty');
        }
      }

      // Add a status notification
      let targetRole: UserRole = 'Waiter';
      if (status === 'Accepted') targetRole = 'Kitchen Staff'; // Or 'Bar Staff'
      if (status === 'Ready') targetRole = 'Waiter'; // Notify wait staff to serve
      if (status === 'Served') targetRole = 'Cashier'; // Waiter served -> ready for check

      this.addNotification({
        message: `Order for Table ${order.tableId} updated to ${status}`,
        type: 'StatusUpdated',
        role: targetRole
      });

      this.save();
      return order;
    }
    return null;
  }

  // PAYMENTS AND BILLING
  public initiateBilling(tableId: number) {
    this.updateTableStatus(tableId, 'Billing');
    const tableOrders = this.data.orders.filter(o => o.tableId === tableId && (o.status === 'Served' || o.status === 'Ready' || o.status === 'Accepted' || o.status === 'Preparing'));
    const pendingSum = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    this.addNotification({
      message: `Table ${tableId} is requesting their bill (Total: TZS ${pendingSum.toLocaleString()})`,
      type: 'BillRequested',
      role: 'Cashier'
    });
    this.save();
    return { success: true, pendingSum, ordersCount: tableOrders.length };
  }

  public registerPayment(tableId: number, method: Payment['paymentMethod'], amount: number) {
    const tableOrders = this.data.orders.filter(o => o.tableId === tableId && (o.status === 'Served' || o.status === 'Ready' || o.status === 'Accepted' || o.status === 'Preparing'));

    if (tableOrders.length === 0) {
      return { success: false, message: 'No active orders on this table.' };
    }

    const payId = crypto.randomUUID();
    
    // Generate realistic payment platform transaction IDs
    const randAlphaNum = (len: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let res = '';
      for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };

    let txnId = 'COLL-CH-' + Math.floor(100000 + Math.random() * 900000); // Cash Ticket number
    if (method === 'MPesa') {
      txnId = 'TXN-MP-' + randAlphaNum(8);
    } else if (method === 'Airtel Money') {
      txnId = 'TXN-AM-' + randAlphaNum(8);
    } else if (method === 'Card') {
      txnId = 'TXN-CC-' + randAlphaNum(8);
    }

    const calculatedTax = Math.round(amount * 18 / 118); // 18% inclusive local VAT
    const calculatedCost = Math.round(amount * 0.35);    // raw culinary cost model (~35%)
    const calculatedProfit = amount - calculatedTax - calculatedCost;

    const newPayment: Payment = {
      id: payId,
      orderId: tableOrders[0].id, // Reference to main order
      tableId,
      amount,
      paymentMethod: method,
      status: 'Completed',
      createdAt: new Date().toISOString(),
      transactionId: txnId,
      taxAmount: calculatedTax,
      costAmount: calculatedCost,
      netProfit: calculatedProfit
    };

    this.data.payments.push(newPayment);

    // Update orders to Paid and Completed
    tableOrders.forEach(o => {
      o.status = 'Paid';
      o.updatedAt = new Date().toISOString();
    });

    this.updateTableStatus(tableId, 'Empty');

    this.addNotification({
      message: `Table ${tableId} check paid via ${method} (TZS ${amount.toLocaleString()})`,
      type: 'StatusUpdated',
      role: 'Manager'
    });

    this.save();
    return { success: true, payment: newPayment };
  }

  public getPayments() {
    return this.data.payments;
  }

  public getPrivacySettings() {
    if (!this.data.privacySettings) {
      this.data.privacySettings = {
        maskFinancialMetrics: false,
        maskCustomerData: false,
        maskPayments: false
      };
    }
    return this.data.privacySettings;
  }

  public updatePrivacySettings(settings: { maskFinancialMetrics: boolean; maskCustomerData: boolean; maskPayments: boolean }) {
    this.data.privacySettings = settings;
    this.save();
    return this.data.privacySettings;
  }

  // NOTIFICATIONS
  public addNotification(notif: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      message: notif.message,
      type: notif.type,
      role: notif.role,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(newNotification);
    if (this.data.notifications.length > 200) {
      this.data.notifications.pop();
    }
    this.save();
    return newNotification;
  }

  public getNotifications(role?: UserRole) {
    if (role) {
      return this.data.notifications.filter(n => n.role === role || n.type === 'Emergency');
    }
    return this.data.notifications;
  }

  public markNotificationsAsRead(role: UserRole) {
    this.data.notifications.forEach(n => {
      if (n.role === role || n.type === 'Emergency') {
        n.isRead = true;
      }
    });
    this.save();
  }

  public markNotificationIdAsRead(id: string) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  // STATS & ANALYTICS FOR MANAGER
  public getManagerReports() {
    const now = new Date();
    const payments = this.data.payments;
    const orders = this.data.orders;

    // Helper functions for backward-compatible payment calculation
    const getTax = (p: Payment) => p.taxAmount ?? Math.round(p.amount * 18 / 118);
    const getCost = (p: Payment) => p.costAmount ?? Math.round(p.amount * 0.35);
    const getProfit = (p: Payment) => p.netProfit ?? (p.amount - getTax(p) - getCost(p));

    // Filter payments for daily revenue metrics
    const dailyPayments = payments.filter(p => {
      const pDate = new Date(p.createdAt);
      return pDate.toDateString() === now.toDateString();
    });
    const dailySalesTotal = dailyPayments.reduce((sum, p) => sum + p.amount, 0);
    const dailyTaxTotal = dailyPayments.reduce((sum, p) => sum + getTax(p), 0);
    const dailyProfitTotal = dailyPayments.reduce((sum, p) => sum + getProfit(p), 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const weeklyPayments = payments.filter(p => new Date(p.createdAt) >= oneWeekAgo);
    const weeklySalesTotal = weeklyPayments.reduce((sum, p) => sum + p.amount, 0);
    const weeklyTaxTotal = weeklyPayments.reduce((sum, p) => sum + getTax(p), 0);
    const weeklyProfitTotal = weeklyPayments.reduce((sum, p) => sum + getProfit(p), 0);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const monthlyPayments = payments.filter(p => new Date(p.createdAt) >= oneMonthAgo);
    const monthlySalesTotal = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthlyTaxTotal = monthlyPayments.reduce((sum, p) => sum + getTax(p), 0);
    const monthlyProfitTotal = monthlyPayments.reduce((sum, p) => sum + getProfit(p), 0);

    // Payment method platform breakdown
    const paymentBreakdown = {
      Cash: { amount: 0, count: 0 },
      MPesa: { amount: 0, count: 0 },
      'Airtel Money': { amount: 0, count: 0 },
      Card: { amount: 0, count: 0 }
    };

    payments.forEach(p => {
      const methodKey = p.paymentMethod;
      if (methodKey === 'MPesa' || methodKey === 'Airtel Money' || methodKey === 'Card' || methodKey === 'Cash') {
        paymentBreakdown[methodKey].amount += p.amount;
        paymentBreakdown[methodKey].count += 1;
      } else {
        // Fallback for Mixer / Custom
        paymentBreakdown['Cash'].amount += p.amount;
        paymentBreakdown['Cash'].count += 1;
      }
    });

    // Filter item preferences
    const itemFreqMap: Record<string, { count: number; category: string; name: string }> = {};
    orders.forEach(o => {
      o.items.forEach(it => {
        if (!itemFreqMap[it.menuItemId]) {
          itemFreqMap[it.menuItemId] = { count: 0, category: it.category, name: it.name };
        }
        itemFreqMap[it.menuItemId].count += it.quantity;
      });
    });

    const frequencyList = Object.values(itemFreqMap);
    const popularFoods = frequencyList
      .filter(f => f.category === 'Food')
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const popularDrinks = frequencyList
      .filter(f => f.category === 'Drink')
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const popularFruits = frequencyList
      .filter(f => f.category === 'Fruit')
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Table activity
    const activeTablesCount = this.data.tables.filter(t => t.status !== 'Empty').length;
    const completedOrdersCount = this.data.orders.filter(o => o.status === 'Paid' || o.status === 'Completed').length;

    // Staff activity audit logs mapping
    const recentActivityCount = this.data.auditLogs.slice(0, 10);

    // Revenue history plotting (e.g. past 7 days)
    const chartData: { date: string; revenue: number; tax: number; profit: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      const dayPayments = payments.filter(p => new Date(p.createdAt).toDateString() === d.toDateString());
      const dayRev = dayPayments.reduce((sum, p) => sum + p.amount, 0);
      const dayTax = dayPayments.reduce((sum, p) => sum + getTax(p), 0);
      const dayProfit = dayPayments.reduce((sum, p) => sum + getProfit(p), 0);

      const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString());

      chartData.push({
        date: dStr,
        revenue: dayRev,
        tax: dayTax,
        profit: dayProfit,
        orders: dayOrders.length
      });
    }

    return {
      dailySalesTotal,
      dailyTaxTotal,
      dailyProfitTotal,
      weeklySalesTotal,
      weeklyTaxTotal,
      weeklyProfitTotal,
      monthlySalesTotal,
      monthlyTaxTotal,
      monthlyProfitTotal,
      paymentBreakdown,
      popularFoods,
      popularDrinks,
      popularFruits,
      activeTablesCount,
      completedOrdersCount,
      chartData,
      recentActivity: recentActivityCount
    };
  }
}

export const db = new DB();
export default db;
