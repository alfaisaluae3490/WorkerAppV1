// backend/routes/jobs.js
const express = require('express');
const multer = require('multer');
const { query } = require('../config/database');
const { uploadMultipleImages, deleteImage } = require('../config/cloudinary');
const { verifyToken, requireVerification } = require('../middleware/auth');
const { validateJobPost } = require('../middleware/validation');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ============================================
// POST /api/jobs
// Create a new job posting
// ============================================
router.post('/', verifyToken, requireVerification, upload.array('images', 5), validateJobPost, async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      budget_min,
      budget_max,
      location_address,
      city,
      province,
      latitude,
      longitude,
      preferred_date,
      preferred_time,
      gender_preference,
      requires_verification,
      requires_insurance,
    } = req.body;

    // Upload images to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadResults = await uploadMultipleImages(
          req.files.map(file => file.buffer),
          'jobs'
        );
        imageUrls = uploadResults.map(result => result.secure_url);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images'
        });
      }
    }

    // Create job in database
    const result = await query(
      `INSERT INTO jobs (
        customer_id, title, description, category_id, images,
        budget_min, budget_max, location_address, city, province,
        latitude, longitude, preferred_date, preferred_time,
        gender_preference, requires_verification, requires_insurance,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'open')
      RETURNING *`,
      [
        req.user.id,
        title,
        description,
        category_id || null,
        JSON.stringify(imageUrls),
        budget_min,
        budget_max,
        location_address,
        city,
        province,
        latitude || null,
        longitude || null,
        preferred_date || null,
        preferred_time || null,
        gender_preference || 'any',
        requires_verification || false,
        requires_insurance || false,
      ]
    );

    const job = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: { job }
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
});

// ============================================
// GET /api/jobs
// Get all jobs (with filters)
// ============================================
router.get('/', async (req, res) => {
  try {
    const {
      category,
      city,
      province,
      min_budget,
      max_budget,
      status = 'open',
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['j.status = $1'];
    let params = [status];
    let paramIndex = 2;

    // Add filters
    if (category) {
      whereConditions.push(`c.slug = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (city) {
      whereConditions.push(`LOWER(j.city) = LOWER($${paramIndex})`);
      params.push(city);
      paramIndex++;
    }

    if (province) {
      whereConditions.push(`LOWER(j.province) = LOWER($${paramIndex})`);
      params.push(province);
      paramIndex++;
    }

    if (min_budget) {
      whereConditions.push(`j.budget_max >= $${paramIndex}`);
      params.push(min_budget);
      paramIndex++;
    }

    if (max_budget) {
      whereConditions.push(`j.budget_min <= $${paramIndex}`);
      params.push(max_budget);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get jobs with customer info
    const result = await query(
      `SELECT 
        j.*,
        u.full_name as customer_name,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT COUNT(*) FROM bids WHERE job_id = j.id) as bids_count
      FROM jobs j
      LEFT JOIN users u ON j.customer_id = u.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM jobs j
       LEFT JOIN categories c ON j.category_id = c.id
       WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        jobs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// ============================================
// GET /api/jobs/:id
// Get single job details
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        j.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.profile_picture as customer_picture,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT COUNT(*) FROM bids WHERE job_id = j.id) as bids_count,
        (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) as customer_rating
      FROM jobs j
      LEFT JOIN users u ON j.customer_id = u.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: { job: result.rows[0] }
    });

  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
});

// ============================================
// GET /api/jobs/my/posted
// Get jobs posted by current user
// ============================================
router.get('/my/posted', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'j.customer_id = $1';
    let params = [req.user.id];

    if (status) {
      whereClause += ' AND j.status = $2';
      params.push(status);
    }

    const result = await query(
      `SELECT 
        j.*,
        c.name as category_name,
        (SELECT COUNT(*) FROM bids WHERE job_id = j.id) as bids_count,
        (SELECT COUNT(*) FROM bids WHERE job_id = j.id AND status = 'pending') as pending_bids
      FROM jobs j
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: { jobs: result.rows }
    });

  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// ============================================
// PUT /api/jobs/:id
// Update job (only if no accepted bids)
// ============================================
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job belongs to user
    const jobCheck = await query(
      'SELECT * FROM jobs WHERE id = $1 AND customer_id = $2',
      [id, req.user.id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized'
      });
    }

    // Check if job has accepted bids
    const bidCheck = await query(
      'SELECT id FROM bids WHERE job_id = $1 AND status = $2',
      [id, 'accepted']
    );

    if (bidCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit job with accepted bids'
      });
    }

    const {
      title,
      description,
      budget_min,
      budget_max,
      preferred_date,
      preferred_time,
    } = req.body;

    const result = await query(
      `UPDATE jobs SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        budget_min = COALESCE($3, budget_min),
        budget_max = COALESCE($4, budget_max),
        preferred_date = COALESCE($5, preferred_date),
        preferred_time = COALESCE($6, preferred_time)
      WHERE id = $7
      RETURNING *`,
      [title, description, budget_min, budget_max, preferred_date, preferred_time, id]
    );

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job: result.rows[0] }
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
});

// ============================================
// DELETE /api/jobs/:id
// Cancel/Delete job
// ============================================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job belongs to user
    const jobCheck = await query(
      'SELECT * FROM jobs WHERE id = $1 AND customer_id = $2',
      [id, req.user.id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized'
      });
    }

    const job = jobCheck.rows[0];

    // Check if job has active bookings
    const bookingCheck = await query(
      'SELECT id FROM bookings WHERE job_id = $1 AND status IN ($2, $3)',
      [id, 'confirmed', 'in_progress']
    );

    if (bookingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete job with active bookings'
      });
    }

    // Update status to cancelled instead of deleting
    await query(
      'UPDATE jobs SET status = $1 WHERE id = $2',
      ['cancelled', id]
    );

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

module.exports = router;