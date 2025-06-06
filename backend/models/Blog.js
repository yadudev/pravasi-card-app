const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Blog = sequelize.define(
    'Blog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for the blog post',
      },
      title: {
        type: DataTypes.STRING(300),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Blog title cannot be empty',
          },
          len: {
            args: [5, 300],
            msg: 'Blog title must be between 5 and 300 characters',
          },
        },
        comment: 'Blog post title/headline',
      },
      slug: {
        type: DataTypes.STRING(350),
        allowNull: false,
        unique: {
          msg: 'A blog post with this slug already exists',
        },
        validate: {
          notEmpty: {
            msg: 'Blog slug cannot be empty',
          },
          isValidSlug(value) {
            if (!/^[a-z0-9-]+$/.test(value)) {
              throw new Error(
                'Slug can only contain lowercase letters, numbers, and hyphens'
              );
            }
          },
          len: {
            args: [3, 350],
            msg: 'Blog slug must be between 3 and 350 characters',
          },
        },
        comment: 'URL-friendly version of the title',
      },
      content: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Blog content cannot be empty',
          },
          len: {
            args: [100, 50000],
            msg: 'Blog content must be between 100 and 50,000 characters',
          },
        },
        comment: 'Main blog post content (HTML allowed)',
      },
      excerpt: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: 'Blog excerpt cannot exceed 500 characters',
          },
        },
        comment: 'Short summary/excerpt of the blog post',
      },
      featuredImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isValidImagePath(value) {
            if (value) {
              const validExtensions = [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif',
                '.webp',
              ];
              const hasValidExtension = validExtensions.some((ext) =>
                value.toLowerCase().endsWith(ext)
              );
              if (!hasValidExtension) {
                throw new Error(
                  'Featured image must be a valid image file (jpg, jpeg, png, gif, webp)'
                );
              }
            }
          },
        },
        comment: 'Path to the featured/cover image',
      },
      imageAlt: {
        type: DataTypes.STRING(200),
        allowNull: true,
        validate: {
          len: {
            args: [0, 200],
            msg: 'Image alt text cannot exceed 200 characters',
          },
        },
        comment: 'Alternative text for the featured image',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Category cannot exceed 100 characters',
          },
        },
        comment: 'Blog post category',
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        validate: {
          isArrayOfStrings(value) {
            if (
              value &&
              (!Array.isArray(value) ||
                !value.every((item) => typeof item === 'string'))
            ) {
              throw new Error('Tags must be an array of strings');
            }
            if (value && value.length > 20) {
              throw new Error('Cannot have more than 20 tags');
            }
          },
        },
        comment: 'Array of tags for the blog post',
      },
      isPublished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the blog post is published and visible to public',
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: {
            msg: 'Published date must be a valid date',
          },
        },
        comment: 'Date when the blog post was published',
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: {
            msg: 'Scheduled date must be a valid date',
          },
          isFutureDate(value) {
            if (value && new Date(value) <= new Date()) {
              throw new Error('Scheduled date must be in the future');
            }
          },
        },
        comment: 'Date when the blog post should be automatically published',
      },
      views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Views count cannot be negative',
          },
        },
        comment: 'Number of times the blog post has been viewed',
      },
      readingTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: 1,
            msg: 'Reading time must be at least 1 minute',
          },
        },
        comment: 'Estimated reading time in minutes',
      },
      status: {
        type: DataTypes.ENUM('draft', 'review', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Current status of the blog post',
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'featured'),
        allowNull: false,
        defaultValue: 'normal',
        comment: 'Priority level for blog post promotion',
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this blog post should be featured prominently',
      },
      allowComments: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether comments are allowed on this blog post',
      },
      commentCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Comment count cannot be negative',
          },
        },
        comment: 'Number of approved comments on this blog post',
      },
      metaTitle: {
        type: DataTypes.STRING(70),
        allowNull: true,
        validate: {
          len: {
            args: [0, 70],
            msg: 'Meta title should not exceed 70 characters for SEO',
          },
        },
        comment: 'SEO meta title (recommended: 50-60 characters)',
      },
      metaDescription: {
        type: DataTypes.STRING(165),
        allowNull: true,
        validate: {
          len: {
            args: [0, 165],
            msg: 'Meta description should not exceed 165 characters for SEO',
          },
        },
        comment: 'SEO meta description (recommended: 150-160 characters)',
      },
      metaKeywords: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: 'Meta keywords cannot exceed 500 characters',
          },
        },
        comment: 'SEO meta keywords (comma-separated)',
      },
      canonicalUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: 'Canonical URL must be a valid URL',
          },
        },
        comment: 'Canonical URL for SEO (if different from default)',
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the admin who authored this blog post',
      },
      editorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the admin who last edited this blog post',
      },
      language: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: 'en',
        validate: {
          isIn: {
            args: [
              ['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
            ],
            msg: 'Language must be a supported language code',
          },
        },
        comment: 'Language code for the blog post',
      },
      socialShares: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          facebook: 0,
          twitter: 0,
          linkedin: 0,
          whatsapp: 0,
          pinterest: 0,
        },
        comment: 'Social media share counts',
      },
      relatedPosts: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        validate: {
          isArrayOfNumbers(value) {
            if (
              value &&
              (!Array.isArray(value) ||
                !value.every((item) => Number.isInteger(item)))
            ) {
              throw new Error(
                'Related posts must be an array of blog post IDs'
              );
            }
            if (value && value.length > 5) {
              throw new Error('Cannot have more than 5 related posts');
            }
          },
        },
        comment: 'Array of related blog post IDs',
      },
    },
    {
      tableName: 'blogs',
      timestamps: true,
      underscored: false,
      paranoid: true, // Enable soft deletes

      // Model options
      defaultScope: {
        attributes: { exclude: ['authorId', 'editorId'] },
      },

      scopes: {
        // Published blogs only
        published: {
          where: {
            isPublished: true,
            status: 'published',
            publishedAt: {
              [sequelize.Sequelize.Op.lte]: new Date(),
            },
          },
        },

        // Draft blogs
        draft: {
          where: {
            status: 'draft',
          },
        },

        // Featured blogs
        featured: {
          where: {
            isFeatured: true,
            isPublished: true,
            status: 'published',
          },
        },

        // Blogs by category
        byCategory: (category) => ({
          where: {
            category: category,
            isPublished: true,
            status: 'published',
          },
        }),

        // Recent blogs
        recent: {
          where: {
            isPublished: true,
            status: 'published',
          },
          order: [['publishedAt', 'DESC']],
        },

        // Popular blogs (by views)
        popular: {
          where: {
            isPublished: true,
            status: 'published',
          },
          order: [['views', 'DESC']],
        },

        // Include author info
        withAuthor: {
          attributes: { include: ['authorId', 'editorId'] },
        },

        // SEO optimized scope
        seo: {
          attributes: [
            'id',
            'title',
            'slug',
            'excerpt',
            'metaTitle',
            'metaDescription',
            'metaKeywords',
            'canonicalUrl',
            'featuredImage',
            'publishedAt',
            'category',
            'tags',
          ],
        },
      },

      // Indexes for better performance
      indexes: [
        {
          fields: ['slug'],
          unique: true,
        },
        {
          fields: ['isPublished'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['publishedAt'],
        },
        {
          fields: ['category'],
        },
        {
          fields: ['isFeatured'],
        },
        {
          fields: ['priority'],
        },
        {
          fields: ['language'],
        },
        {
          fields: ['authorId'],
        },
        {
          name: 'blog_published_featured',
          fields: ['isPublished', 'isFeatured', 'publishedAt'],
        },
        {
          name: 'blog_category_published',
          fields: ['category', 'isPublished', 'publishedAt'],
        },
        {
          name: 'blog_search',
          fields: ['title', 'content'],
          type: 'FULLTEXT',
        },
      ],

      // Model hooks
      hooks: {
        beforeValidate: (blog, options) => {
          // Trim string fields
          if (blog.title) blog.title = blog.title.trim();
          if (blog.excerpt) blog.excerpt = blog.excerpt.trim();
          if (blog.category) blog.category = blog.category.trim();
          if (blog.metaTitle) blog.metaTitle = blog.metaTitle.trim();
          if (blog.metaDescription)
            blog.metaDescription = blog.metaDescription.trim();

          // Auto-generate slug if not provided
          if (blog.title && !blog.slug) {
            blog.slug = blog.title
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/[\s_-]+/g, '-')
              .replace(/^-+|-+$/g, '');
          }

          // Auto-calculate reading time
          if (blog.content && !blog.readingTime) {
            const wordsPerMinute = 200;
            const wordCount = blog.content
              .replace(/<[^>]*>/g, '')
              .split(/\s+/).length;
            blog.readingTime = Math.max(
              1,
              Math.ceil(wordCount / wordsPerMinute)
            );
          }

          // Auto-generate excerpt if not provided
          if (blog.content && !blog.excerpt) {
            const plainText = blog.content.replace(/<[^>]*>/g, '');
            blog.excerpt =
              plainText.substring(0, 200) +
              (plainText.length > 200 ? '...' : '');
          }
        },

        beforeCreate: (blog, options) => {
          // Set author if admin context is available
          if (options.adminId) {
            blog.authorId = options.adminId;
          }

          // Set published date if publishing
          if (
            blog.isPublished &&
            blog.status === 'published' &&
            !blog.publishedAt
          ) {
            blog.publishedAt = new Date();
          }
        },

        beforeUpdate: (blog, options) => {
          // Set editor if admin context is available
          if (options.adminId) {
            blog.editorId = options.adminId;
          }

          // Handle publishing status changes
          if (blog.changed('isPublished') || blog.changed('status')) {
            if (
              blog.isPublished &&
              blog.status === 'published' &&
              !blog.publishedAt
            ) {
              blog.publishedAt = new Date();
            } else if (!blog.isPublished || blog.status !== 'published') {
              blog.publishedAt = null;
            }
          }

          // Update reading time if content changed
          if (blog.changed('content')) {
            const wordsPerMinute = 200;
            const wordCount = blog.content
              .replace(/<[^>]*>/g, '')
              .split(/\s+/).length;
            blog.readingTime = Math.max(
              1,
              Math.ceil(wordCount / wordsPerMinute)
            );
          }
        },
      },
    }
  );

  // Class methods
  Blog.getPublishedBlogs = function (options = {}) {
    return this.scope('published').findAll({
      order: [['publishedAt', 'DESC']],
      ...options,
    });
  };

  Blog.getFeaturedBlogs = function (limit = 5) {
    return this.scope('featured').findAll({
      order: [['publishedAt', 'DESC']],
      limit,
    });
  };

  Blog.getBlogsByCategory = function (category, options = {}) {
    return this.scope({ method: ['byCategory', category] }).findAll({
      order: [['publishedAt', 'DESC']],
      ...options,
    });
  };

  Blog.getRecentBlogs = function (limit = 10) {
    return this.scope('recent').findAll({
      limit,
    });
  };

  Blog.getPopularBlogs = function (limit = 10) {
    return this.scope('popular').findAll({
      limit,
    });
  };

  Blog.searchBlogs = function (query, options = {}) {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.and]: [
          {
            [sequelize.Sequelize.Op.or]: [
              { title: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
              { content: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
              { excerpt: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
            ],
          },
          {
            isPublished: true,
            status: 'published',
          },
        ],
      },
      order: [['publishedAt', 'DESC']],
      ...options,
    });
  };

  Blog.getBlogsByTag = function (tag, options = {}) {
    return this.findAll({
      where: {
        tags: {
          [sequelize.Sequelize.Op.contains]: [tag],
        },
        isPublished: true,
        status: 'published',
      },
      order: [['publishedAt', 'DESC']],
      ...options,
    });
  };

  Blog.getCategories = async function () {
    const categories = await this.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        category: { [sequelize.Sequelize.Op.ne]: null },
        isPublished: true,
        status: 'published',
      },
      group: ['category'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true,
    });

    return categories.map((cat) => ({
      name: cat.category,
      count: parseInt(cat.count),
    }));
  };

  Blog.getAllTags = async function () {
    const blogs = await this.findAll({
      attributes: ['tags'],
      where: {
        tags: { [sequelize.Sequelize.Op.ne]: null },
        isPublished: true,
        status: 'published',
      },
      raw: true,
    });

    const tagCounts = {};
    blogs.forEach((blog) => {
      if (blog.tags && Array.isArray(blog.tags)) {
        blog.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Instance methods
  Blog.prototype.incrementViews = async function () {
    return await this.increment('views');
  };

  Blog.prototype.incrementSocialShare = async function (platform) {
    const validPlatforms = [
      'facebook',
      'twitter',
      'linkedin',
      'whatsapp',
      'pinterest',
    ];
    if (!validPlatforms.includes(platform)) {
      throw new Error('Invalid social media platform');
    }

    const currentShares = this.socialShares || {};
    currentShares[platform] = (currentShares[platform] || 0) + 1;

    return await this.update({ socialShares: currentShares });
  };

  Blog.prototype.getUrl = function () {
    return `/blog/${this.slug}`;
  };

  Blog.prototype.getImageUrl = function () {
    return this.featuredImage
      ? this.featuredImage.startsWith('http')
        ? this.featuredImage
        : `${process.env.BASE_URL || ''}${this.featuredImage}`
      : null;
  };

  Blog.prototype.getPlainTextContent = function (maxLength = null) {
    const plainText = this.content.replace(/<[^>]*>/g, '');
    return maxLength
      ? plainText.substring(0, maxLength) +
          (plainText.length > maxLength ? '...' : '')
      : plainText;
  };

  Blog.prototype.getWordCount = function () {
    return this.getPlainTextContent().split(/\s+/).length;
  };

  Blog.prototype.isPublishedNow = function () {
    return (
      this.isPublished &&
      this.status === 'published' &&
      this.publishedAt &&
      new Date(this.publishedAt) <= new Date()
    );
  };

  Blog.prototype.duplicate = async function (newTitle) {
    const duplicateData = {
      title: newTitle || `${this.title} (Copy)`,
      content: this.content,
      excerpt: this.excerpt,
      category: this.category,
      tags: this.tags ? [...this.tags] : [],
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      metaKeywords: this.metaKeywords,
      allowComments: this.allowComments,
      language: this.language,
      isPublished: false,
      status: 'draft',
    };

    return await Blog.create(duplicateData);
  };

  Blog.prototype.getRelatedBlogs = async function (limit = 5) {
    if (this.relatedPosts && this.relatedPosts.length > 0) {
      return await Blog.findAll({
        where: {
          id: { [sequelize.Sequelize.Op.in]: this.relatedPosts },
          isPublished: true,
          status: 'published',
        },
        limit,
      });
    }

    // Auto-find related blogs by category and tags
    const whereClause = {
      id: { [sequelize.Sequelize.Op.ne]: this.id },
      isPublished: true,
      status: 'published',
    };

    if (this.category) {
      whereClause.category = this.category;
    }

    return await Blog.findAll({
      where: whereClause,
      order: [['publishedAt', 'DESC']],
      limit,
    });
  };

  // Association method (called from models/index.js)
  Blog.associate = function (models) {
    // Blog belongs to Admin (author)
    Blog.belongsTo(models.Admin, {
      foreignKey: 'authorId',
      as: 'author',
      constraints: false,
    });

    // Blog belongs to Admin (editor)
    Blog.belongsTo(models.Admin, {
      foreignKey: 'editorId',
      as: 'editor',
      constraints: false,
    });
  };

  return Blog;
};
