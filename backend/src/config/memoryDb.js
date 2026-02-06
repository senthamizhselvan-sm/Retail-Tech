// Simple in-memory storage for testing when MongoDB is not available
const memoryStorage = {
  users: [
    {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      role: 'user'
    }
  ],
  inventoryItems: [],
  businessProfiles: [], // Add business profiles storage
  autoIncrement: {
    users: 1,
    inventoryItems: 1
  }
};

const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

class MemoryDatabase {
  // User operations
  static findUserByEmail(email) {
    return memoryStorage.users.find(user => user.email === email);
  }

  static findUserById(id) {
    return memoryStorage.users.find(user => user._id === id);
  }

  static createUser(userData) {
    const newUser = {
      _id: generateId(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStorage.users.push(newUser);
    return newUser;
  }

  // Inventory operations
  static findInventoryByBusinessId(businessId) {
    return memoryStorage.inventoryItems.filter(item => item.businessId === businessId);
  }

  static findInventoryById(id, businessId) {
    return memoryStorage.inventoryItems.find(item => 
      item._id === id && item.businessId === businessId
    );
  }

  static createInventoryItem(itemData) {
    const newItem = {
      _id: generateId(),
      ...itemData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStorage.inventoryItems.push(newItem);
    return newItem;
  }

  static updateInventoryItem(id, businessId, updateData) {
    const index = memoryStorage.inventoryItems.findIndex(item => 
      item._id === id && item.businessId === businessId
    );
    if (index !== -1) {
      memoryStorage.inventoryItems[index] = {
        ...memoryStorage.inventoryItems[index],
        ...updateData,
        updatedAt: new Date()
      };
      return memoryStorage.inventoryItems[index];
    }
    return null;
  }

  static deleteInventoryItem(id, businessId) {
    const index = memoryStorage.inventoryItems.findIndex(item => 
      item._id === id && item.businessId === businessId
    );
    if (index !== -1) {
      return memoryStorage.inventoryItems.splice(index, 1)[0];
    }
    return null;
  }

  // Business Profile operations
  static findBusinessProfile(userId) {
    return memoryStorage.businessProfiles.find(profile => profile.userId === userId);
  }

  static createBusinessProfile(profileData) {
    const newProfile = {
      _id: generateId(),
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStorage.businessProfiles.push(newProfile);
    return newProfile;
  }

  // For assistant - alias for inventory items
  static findInventoryItems(businessId) {
    return this.findInventoryByBusinessId(businessId);
  }

  static clearAll() {
    memoryStorage.users = memoryStorage.users.slice(0, 1); // Keep test user
    memoryStorage.inventoryItems = [];
  }
}

module.exports = MemoryDatabase;
