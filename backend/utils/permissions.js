class PermissionManager {
  // Define all available permissions in the system
  static PERMISSIONS = {
    // User Management
    'users.view': 'View users list and details',
    'users.create': 'Create new users',
    'users.update': 'Update user information',
    'users.delete': 'Delete users',
    'users.reset_password': 'Reset user passwords',
    'users.manage_cards': 'Manage user discount cards',
    'users.send_emails': 'Send emails to users',
    'users.export': 'Export user data',
    'users.bulk_operations': 'Perform bulk operations on users',

    // Shop Management
    'shops.view': 'View shops list and details',
    'shops.create': 'Create new shops',
    'shops.update': 'Update shop information',
    'shops.delete': 'Delete shops',
    'shops.approve': 'Approve shop registrations',
    'shops.reject': 'Reject shop registrations',
    'shops.block': 'Block/unblock shops',
    'shops.send_emails': 'Send emails to shops',
    'shops.export': 'Export shop data',
    'shops.bulk_operations': 'Perform bulk operations on shops',
    'shops.analytics': 'View shop analytics',

    // Discount Management
    'discounts.view': 'View discount rules',
    'discounts.create': 'Create discount rules',
    'discounts.update': 'Update discount rules',
    'discounts.delete': 'Delete discount rules',
    'discounts.toggle': 'Activate/deactivate discount rules',
    'discounts.bulk_operations': 'Perform bulk operations on discount rules',
    'discounts.test_calculation': 'Test discount calculations',

    // Content Management
    'content.banners.view': 'View banners',
    'content.banners.create': 'Create banners',
    'content.banners.update': 'Update banners',
    'content.banners.delete': 'Delete banners',
    'content.banners.reorder': 'Reorder banners',

    'content.blogs.view': 'View blogs',
    'content.blogs.create': 'Create blog posts',
    'content.blogs.update': 'Update blog posts',
    'content.blogs.delete': 'Delete blog posts',
    'content.blogs.publish': 'Publish/unpublish blog posts',

    'content.faqs.view': 'View FAQs',
    'content.faqs.create': 'Create FAQs',
    'content.faqs.update': 'Update FAQs',
    'content.faqs.delete': 'Delete FAQs',
    'content.faqs.reorder': 'Reorder FAQs',

    'content.upload': 'Upload images and files',

    // Analytics & Reports
    'analytics.dashboard': 'View dashboard analytics',
    'analytics.users': 'View user analytics',
    'analytics.shops': 'View shop analytics',
    'analytics.transactions': 'View transaction analytics',
    'analytics.revenue': 'View revenue analytics',
    'analytics.discounts': 'View discount analytics',
    'analytics.geographic': 'View geographic analytics',
    'analytics.export': 'Export analytics data',
    'analytics.custom_reports': 'Create custom reports',
    'analytics.realtime': 'View real-time analytics',
    'analytics.predictions': 'View predictive analytics',

    // Admin Management
    'admin.view': 'View admin list',
    'admin.create': 'Create new admins',
    'admin.update': 'Update admin information',
    'admin.delete': 'Delete admins',
    'admin.change_roles': 'Change admin roles',

    // System Settings
    'settings.view': 'View system settings',
    'settings.update': 'Update system settings',
    'settings.backup': 'Create system backups',
    'settings.maintenance': 'Enable maintenance mode',

    // Audit & Logs
    'audit.view': 'View audit logs',
    'audit.export': 'Export audit logs',
    'logs.view': 'View system logs',
    'logs.download': 'Download log files',
  };

  // Define role-based permission sets
  static ROLE_PERMISSIONS = {
    super_admin: [
      // Full access to everything
      ...Object.keys(this.PERMISSIONS),
    ],

    admin: [
      // User Management
      'users.view',
      'users.create',
      'users.update',
      'users.reset_password',
      'users.manage_cards',
      'users.send_emails',
      'users.export',
      'users.bulk_operations',

      // Shop Management
      'shops.view',
      'shops.update',
      'shops.approve',
      'shops.reject',
      'shops.block',
      'shops.send_emails',
      'shops.export',
      'shops.bulk_operations',
      'shops.analytics',

      // Discount Management
      'discounts.view',
      'discounts.create',
      'discounts.update',
      'discounts.delete',
      'discounts.toggle',
      'discounts.bulk_operations',
      'discounts.test_calculation',

      // Content Management
      'content.banners.view',
      'content.banners.create',
      'content.banners.update',
      'content.banners.delete',
      'content.banners.reorder',
      'content.blogs.view',
      'content.blogs.create',
      'content.blogs.update',
      'content.blogs.delete',
      'content.blogs.publish',
      'content.faqs.view',
      'content.faqs.create',
      'content.faqs.update',
      'content.faqs.delete',
      'content.faqs.reorder',
      'content.upload',

      // Analytics
      'analytics.dashboard',
      'analytics.users',
      'analytics.shops',
      'analytics.transactions',
      'analytics.revenue',
      'analytics.discounts',
      'analytics.geographic',
      'analytics.export',
      'analytics.custom_reports',

      // Settings (limited)
      'settings.view',
    ],

    moderator: [
      // User Management (limited)
      'users.view',
      'users.update',
      'users.manage_cards',
      'users.send_emails',

      // Shop Management (limited)
      'shops.view',
      'shops.update',
      'shops.send_emails',
      'shops.analytics',

      // Discount Management (view only)
      'discounts.view',
      'discounts.test_calculation',

      // Content Management
      'content.banners.view',
      'content.banners.create',
      'content.banners.update',
      'content.blogs.view',
      'content.blogs.create',
      'content.blogs.update',
      'content.faqs.view',
      'content.faqs.create',
      'content.faqs.update',
      'content.upload',

      // Analytics (limited)
      'analytics.dashboard',
      'analytics.users',
      'analytics.shops',
    ],
  };

  // Get permissions for a specific role
  static getPermissionsByRole(role) {
    return this.ROLE_PERMISSIONS[role] || [];
  }

  // Check if a role has a specific permission
  static hasPermission(role, permission) {
    const rolePermissions = this.getPermissionsByRole(role);
    return rolePermissions.includes(permission);
  }

  // Get permission groups for better organization
  static getPermissionGroups(role) {
    const permissions = this.getPermissionsByRole(role);
    const groups = {};

    permissions.forEach((permission) => {
      const parts = permission.split('.');
      const module = parts[0];
      const action = parts.slice(1).join('.');

      if (!groups[module]) {
        groups[module] = [];
      }

      groups[module].push({
        key: permission,
        action: action,
        description: this.PERMISSIONS[permission] || '',
      });
    });

    return groups;
  }

  // Get all available modules
  static getModules() {
    return [
      { key: 'users', name: 'User Management', icon: 'users' },
      { key: 'shops', name: 'Shop Management', icon: 'store' },
      { key: 'discounts', name: 'Discount Rules', icon: 'percent' },
      { key: 'content', name: 'Content Management', icon: 'file-text' },
      { key: 'analytics', name: 'Analytics & Reports', icon: 'bar-chart' },
      { key: 'admin', name: 'Admin Management', icon: 'shield' },
      { key: 'settings', name: 'System Settings', icon: 'settings' },
      { key: 'audit', name: 'Audit & Logs', icon: 'activity' },
    ];
  }
}

module.exports = PermissionManager;
