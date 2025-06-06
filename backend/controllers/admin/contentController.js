const { Banner, Blog, FAQ, sequelize } = require('../../models');

class ContentController {
  // ============ BANNER MANAGEMENT ============

  /**
   * Get all banners
   * GET /api/admin/content/banners
   */
  static async getAllBanners(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      const whereClause = {};
      if (status !== undefined) {
        whereClause.isActive = status === 'active';
      }

      const { count, rows: banners } = await Banner.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [
          ['sortOrder', 'ASC'],
          ['createdAt', 'DESC'],
        ],
      });

      const pagination = Helpers.getPaginationData(page, limit, count);

      res.json(
        ApiResponse.paginated(
          banners,
          pagination,
          'Banners retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get banners error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get banner by ID
   * GET /api/admin/content/banners/:id
   */
  static async getBannerById(req, res) {
    try {
      const { id } = req.params;

      const banner = await Banner.findByPk(id);
      if (!banner) {
        return res.status(404).json(ApiResponse.error('Banner not found', 404));
      }

      res.json(ApiResponse.success(banner, 'Banner retrieved successfully'));
    } catch (error) {
      logger.error('Get banner by ID error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Create new banner
   * POST /api/admin/content/banners
   */
  static async createBanner(req, res) {
    try {
      const { title, description, link, sortOrder, startDate, endDate } =
        req.body;

      if (!req.file) {
        return res
          .status(400)
          .json(ApiResponse.error('Banner image is required', 400));
      }

      const banner = await Banner.create({
        title: title.trim(),
        description: description?.trim(),
        image: `/uploads/banners/${req.file.filename}`,
        link: link?.trim(),
        sortOrder: parseInt(sortOrder) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      });

      logger.info(`Banner created by admin: ${title}`);

      res
        .status(201)
        .json(ApiResponse.success(banner, 'Banner created successfully'));
    } catch (error) {
      logger.error('Create banner error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Update banner
   * PUT /api/admin/content/banners/:id
   */
  static async updateBanner(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const banner = await Banner.findByPk(id);
      if (!banner) {
        return res.status(404).json(ApiResponse.error('Banner not found', 404));
      }

      const allowedFields = [
        'title',
        'description',
        'link',
        'sortOrder',
        'isActive',
        'startDate',
        'endDate',
      ];
      const filteredUpdateData = {};

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          if (field === 'sortOrder') {
            filteredUpdateData[field] = parseInt(updateData[field]);
          } else if (
            ['startDate', 'endDate'].includes(field) &&
            updateData[field]
          ) {
            filteredUpdateData[field] = new Date(updateData[field]);
          } else {
            filteredUpdateData[field] = updateData[field];
          }
        }
      });

      if (req.file) {
        filteredUpdateData.image = `/uploads/banners/${req.file.filename}`;
      }

      await banner.update(filteredUpdateData);

      logger.info(`Banner updated by admin: ${banner.title}`);

      res.json(ApiResponse.success(banner, 'Banner updated successfully'));
    } catch (error) {
      logger.error('Update banner error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Delete banner
   * DELETE /api/admin/content/banners/:id
   */
  static async deleteBanner(req, res) {
    try {
      const { id } = req.params;

      const banner = await Banner.findByPk(id);
      if (!banner) {
        return res.status(404).json(ApiResponse.error('Banner not found', 404));
      }

      await banner.destroy();

      logger.info(`Banner deleted by admin: ${banner.title}`);

      res.json(ApiResponse.success(null, 'Banner deleted successfully'));
    } catch (error) {
      logger.error('Delete banner error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }
  /**
   * Toggle banner status
   * PUT /api/admin/content/banners/:id/toggle
   */
  static async toggleBannerStatus(req, res) {
    try {
      const { id } = req.params;

      const banner = await Banner.findByPk(id);
      if (!banner) {
        return res.status(404).json(ApiResponse.error('Banner not found', 404));
      }

      await banner.update({ isActive: !banner.isActive });

      logger.info(
        `Banner ${banner.isActive ? 'activated' : 'deactivated'} by admin: ${banner.title}`
      );
      res.json(
        ApiResponse.success(
          null,
          `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`
        )
      );
    } catch (error) {
      logger.error('Toggle banner status error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Reorder banners
   * PUT /api/admin/content/banners/reorder
   */
  static async reorderBanners(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { banners } = req.body;

      for (const bannerData of banners) {
        await Banner.update(
          { sortOrder: bannerData.sortOrder },
          {
            where: { id: bannerData.id },
            transaction,
          }
        );
      }

      await transaction.commit();

      logger.info(`Banners reordered by admin`);

      res.json(ApiResponse.success(null, 'Banners reordered successfully'));
    } catch (error) {
      await transaction.rollback();
      logger.error('Reorder banners error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  // ============ BLOG MANAGEMENT ============

  /**
   * Get all blogs
   * GET /api/admin/content/blogs
   */
  static async getAllBlogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status;
      const category = req.query.category;

      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
        ];
      }

      if (status) {
        if (status === 'published') {
          whereClause.isPublished = true;
        } else if (status === 'draft') {
          whereClause.isPublished = false;
        }
      }

      if (category) {
        whereClause.category = category;
      }

      const { count, rows: blogs } = await Blog.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      const pagination = Helpers.getPaginationData(page, limit, count);

      res.json(
        ApiResponse.paginated(blogs, pagination, 'Blogs retrieved successfully')
      );
    } catch (error) {
      logger.error('Get blogs error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get blog by ID
   * GET /api/admin/content/blogs/:id
   */
  static async getBlogById(req, res) {
    try {
      const { id } = req.params;

      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json(ApiResponse.error('Blog not found', 404));
      }

      res.json(ApiResponse.success(blog, 'Blog retrieved successfully'));
    } catch (error) {
      logger.error('Get blog by ID error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Create new blog
   * POST /api/admin/content/blogs
   */
  static async createBlog(req, res) {
    try {
      const {
        title,
        content,
        excerpt,
        category,
        tags,
        metaTitle,
        metaDescription,
        isPublished,
        publishedAt,
      } = req.body;

      const slug = Helpers.slugify(title);

      // Check if slug already exists
      const existingBlog = await Blog.findOne({ where: { slug } });
      if (existingBlog) {
        return res
          .status(400)
          .json(
            ApiResponse.error('A blog with similar title already exists', 400)
          );
      }

      const blog = await Blog.create({
        title: title.trim(),
        slug,
        content: content.trim(),
        excerpt: excerpt?.trim(),
        category: category?.trim(),
        tags: Array.isArray(tags) ? tags : [],
        metaTitle: metaTitle?.trim(),
        metaDescription: metaDescription?.trim(),
        featuredImage: req.file ? `/uploads/blogs/${req.file.filename}` : null,
        isPublished: isPublished || false,
        publishedAt:
          isPublished && publishedAt
            ? new Date(publishedAt)
            : isPublished
              ? new Date()
              : null,
        views: 0,
      });

      logger.info(`Blog created by admin: ${title}`);

      res
        .status(201)
        .json(ApiResponse.success(blog, 'Blog created successfully'));
    } catch (error) {
      logger.error('Create blog error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Update blog
   * PUT /api/admin/content/blogs/:id
   */
  static async updateBlog(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json(ApiResponse.error('Blog not found', 404));
      }

      const allowedFields = [
        'title',
        'content',
        'excerpt',
        'category',
        'tags',
        'metaTitle',
        'metaDescription',
        'isPublished',
      ];

      const filteredUpdateData = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      });

      // Update slug if title changed
      if (updateData.title && updateData.title !== blog.title) {
        const newSlug = Helpers.slugify(updateData.title);
        const existingBlog = await Blog.findOne({
          where: {
            slug: newSlug,
            id: { [Op.ne]: id },
          },
        });

        if (existingBlog) {
          return res
            .status(400)
            .json(
              ApiResponse.error('A blog with similar title already exists', 400)
            );
        }

        filteredUpdateData.slug = newSlug;
      }

      // Handle publishing
      if (updateData.isPublished && !blog.isPublished && !blog.publishedAt) {
        filteredUpdateData.publishedAt = new Date();
      } else if (!updateData.isPublished) {
        filteredUpdateData.publishedAt = null;
      }

      if (req.file) {
        filteredUpdateData.featuredImage = `/uploads/blogs/${req.file.filename}`;
      }

      await blog.update(filteredUpdateData);

      logger.info(`Blog updated by admin: ${blog.title}`);

      res.json(ApiResponse.success(blog, 'Blog updated successfully'));
    } catch (error) {
      logger.error('Update blog error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Delete blog
   * DELETE /api/admin/content/blogs/:id
   */
  static async deleteBlog(req, res) {
    try {
      const { id } = req.params;

      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json(ApiResponse.error('Blog not found', 404));
      }

      await blog.destroy();

      logger.info(`Blog deleted by admin: ${blog.title}`);

      res.json(ApiResponse.success(null, 'Blog deleted successfully'));
    } catch (error) {
      logger.error('Delete blog error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Toggle blog publish status
   * PUT /api/admin/content/blogs/:id/toggle-publish
   */
  static async toggleBlogPublish(req, res) {
    try {
      const { id } = req.params;

      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json(ApiResponse.error('Blog not found', 404));
      }

      const updateData = { isPublished: !blog.isPublished };

      if (!blog.isPublished && !blog.publishedAt) {
        updateData.publishedAt = new Date();
      } else if (blog.isPublished) {
        updateData.publishedAt = null;
      }

      await blog.update(updateData);

      logger.info(
        `Blog ${blog.isPublished ? 'published' : 'unpublished'} by admin: ${blog.title}`
      );

      res.json(
        ApiResponse.success(
          null,
          `Blog ${blog.isPublished ? 'published' : 'unpublished'} successfully`
        )
      );
    } catch (error) {
      logger.error('Toggle blog publish error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  // ============ FAQ MANAGEMENT ============

  /**
   * Get all FAQs
   * GET /api/admin/content/faqs
   */
  static async getAllFAQs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const category = req.query.category;
      const status = req.query.status;

      const whereClause = {};

      if (category) {
        whereClause.category = category;
      }

      if (status !== undefined) {
        whereClause.isActive = status === 'active';
      }

      const { count, rows: faqs } = await FAQ.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [
          ['sortOrder', 'ASC'],
          ['createdAt', 'DESC'],
        ],
      });

      const pagination = Helpers.getPaginationData(page, limit, count);

      res.json(
        ApiResponse.paginated(faqs, pagination, 'FAQs retrieved successfully')
      );
    } catch (error) {
      logger.error('Get FAQs error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get FAQ by ID
   * GET /api/admin/content/faqs/:id
   */
  static async getFAQById(req, res) {
    try {
      const { id } = req.params;

      const faq = await FAQ.findByPk(id);
      if (!faq) {
        return res.status(404).json(ApiResponse.error('FAQ not found', 404));
      }

      res.json(ApiResponse.success(faq, 'FAQ retrieved successfully'));
    } catch (error) {
      logger.error('Get FAQ by ID error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Create new FAQ
   * POST /api/admin/content/faqs
   */
  static async createFAQ(req, res) {
    try {
      const { question, answer, category, sortOrder } = req.body;

      const faq = await FAQ.create({
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        sortOrder: parseInt(sortOrder) || 0,
        isActive: true,
      });

      logger.info(`FAQ created by admin: ${question.substring(0, 50)}...`);

      res
        .status(201)
        .json(ApiResponse.success(faq, 'FAQ created successfully'));
    } catch (error) {
      logger.error('Create FAQ error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Update FAQ
   * PUT /api/admin/content/faqs/:id
   */
  static async updateFAQ(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const faq = await FAQ.findByPk(id);
      if (!faq) {
        return res.status(404).json(ApiResponse.error('FAQ not found', 404));
      }

      const allowedFields = [
        'question',
        'answer',
        'category',
        'sortOrder',
        'isActive',
      ];
      const filteredUpdateData = {};

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          if (field === 'sortOrder') {
            filteredUpdateData[field] = parseInt(updateData[field]);
          } else {
            filteredUpdateData[field] = updateData[field];
          }
        }
      });

      await faq.update(filteredUpdateData);

      logger.info(`FAQ updated by admin: ${faq.question.substring(0, 50)}...`);

      res.json(ApiResponse.success(faq, 'FAQ updated successfully'));
    } catch (error) {
      logger.error('Update FAQ error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Delete FAQ
   * DELETE /api/admin/content/faqs/:id
   */
  static async deleteFAQ(req, res) {
    try {
      const { id } = req.params;

      const faq = await FAQ.findByPk(id);
      if (!faq) {
        return res.status(404).json(ApiResponse.error('FAQ not found', 404));
      }

      await faq.destroy();

      logger.info(`FAQ deleted by admin: ${faq.question.substring(0, 50)}...`);

      res.json(ApiResponse.success(null, 'FAQ deleted successfully'));
    } catch (error) {
      logger.error('Delete FAQ error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Toggle FAQ status
   * PUT /api/admin/content/faqs/:id/toggle
   */
  static async toggleFAQStatus(req, res) {
    try {
      const { id } = req.params;

      const faq = await FAQ.findByPk(id);
      if (!faq) {
        return res.status(404).json(ApiResponse.error('FAQ not found', 404));
      }

      await faq.update({ isActive: !faq.isActive });

      logger.info(`FAQ ${faq.isActive ? 'activated' : 'deactivated'} by admin`);

      res.json(
        ApiResponse.success(
          null,
          `FAQ ${faq.isActive ? 'activated' : 'deactivated'} successfully`
        )
      );
    } catch (error) {
      logger.error('Toggle FAQ status error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Reorder FAQs
   * PUT /api/admin/content/faqs/reorder
   */
  static async reorderFAQs(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { faqs } = req.body;

      for (const faqData of faqs) {
        await FAQ.update(
          { sortOrder: faqData.sortOrder },
          {
            where: { id: faqData.id },
            transaction,
          }
        );
      }

      await transaction.commit();

      logger.info(`FAQs reordered by admin`);

      res.json(ApiResponse.success(null, 'FAQs reordered successfully'));
    } catch (error) {
      await transaction.rollback();
      logger.error('Reorder FAQs error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  // ============ GENERAL CONTENT OPERATIONS ============

  /**
   * Upload image for content
   * POST /api/admin/content/upload-image
   */
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json(ApiResponse.error('No image file provided', 400));
      }

      const { type = 'general' } = req.body;
      const imagePath = `/uploads/content/${req.file.filename}`;

      logger.info(
        `Image uploaded by admin: ${req.file.filename}, Type: ${type}`
      );

      res.json(
        ApiResponse.success(
          {
            imageUrl: imagePath,
            filename: req.file.filename,
            size: req.file.size,
            type: type,
          },
          'Image uploaded successfully'
        )
      );
    } catch (error) {
      logger.error('Upload image error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get content statistics
   * GET /api/admin/content/stats
   */
  static async getContentStats(req, res) {
    try {
      const totalBanners = await Banner.count();
      const activeBanners = await Banner.count({ where: { isActive: true } });

      const totalBlogs = await Blog.count();
      const publishedBlogs = await Blog.count({ where: { isPublished: true } });
      const draftBlogs = await Blog.count({ where: { isPublished: false } });

      const totalFAQs = await FAQ.count();
      const activeFAQs = await FAQ.count({ where: { isActive: true } });

      const blogCategories = await Blog.findAll({
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: { category: { [Op.ne]: null } },
        group: ['category'],
        raw: true,
      });

      const faqCategories = await FAQ.findAll({
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['category'],
        raw: true,
      });

      const stats = {
        banners: {
          total: totalBanners,
          active: activeBanners,
          inactive: totalBanners - activeBanners,
        },
        blogs: {
          total: totalBlogs,
          published: publishedBlogs,
          draft: draftBlogs,
        },
        faqs: {
          total: totalFAQs,
          active: activeFAQs,
          inactive: totalFAQs - activeFAQs,
        },
        blogCategories: blogCategories.reduce((acc, cat) => {
          acc[cat.category] = parseInt(cat.count);
          return acc;
        }, {}),
        faqCategories: faqCategories.reduce((acc, cat) => {
          acc[cat.category] = parseInt(cat.count);
          return acc;
        }, {}),
      };

      res.json(
        ApiResponse.success(stats, 'Content statistics retrieved successfully')
      );
    } catch (error) {
      logger.error('Get content stats error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }
}

module.exports = ContentController;
