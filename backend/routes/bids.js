// backend/routes/bids.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// ============================================
// POST /api/bids - Place a bid on a job (Worker only)
// ============================================
router.post('/', verifyToken, requireRole('worker'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { job_id, bid_amount, proposal, estimated_duration } = req.body;
    const worker_id = req.user.id;

    // Validate required fields
    if (!job_id || !bid_amount || !proposal) {
      return res.status(400).json({ 
        success: false, 
        message: 'Job ID, bid amount, and proposal are required' 
      });
    }

    // Validate bid amount
    if (bid_amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bid amount must be greater than 0' 
      });
    }

    // Validate proposal length
    if (proposal.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Proposal must be at least 10 characters long' 
      });
    }

    // Check if job exists and is still open
    const jobResult = await client.query(
      'SELECT * FROM jobs WHERE id = $1',
      [job_id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found' 
      });
    }

    const job = jobResult.rows[0];

    // Cannot bid on own job
    if (job.customer_id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot bid on your own job' 
      });
    }

    // Check if job is still open
    if (job.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'This job is no longer accepting bids' 
      });
    }

    // Check if worker already placed a bid on this job
    const existingBidResult = await client.query(
      'SELECT * FROM bids WHERE job_id = $1 AND worker_id = $2',
      [job_id, worker_id]
    );

    if (existingBidResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already placed a bid on this job' 
      });
    }

    // Get worker profile to check if complete
    const workerProfileResult = await client.query(
      'SELECT * FROM worker_profiles WHERE user_id = $1',
      [worker_id]
    );

    if (workerProfileResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete your worker profile before placing bids' 
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    // Insert bid
    const bidResult = await client.query(
      `INSERT INTO bids 
       (job_id, worker_id, amount, message, estimated_duration, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [job_id, worker_id, bid_amount, proposal, estimated_duration || null, 'pending']
    );

    // Create notification for customer
    await client.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        job.customer_id,
        'new_bid',
        'New Bid Received',
        `You received a new bid of $${bid_amount} on your job "${job.title}"`,
        bidResult.rows[0].id
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: bidResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error placing bid:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to place bid. Please try again.' 
    });
  } finally {
    client.release();
  }
});

// ============================================
// GET /api/bids/job/:jobId - Get all bids for a job (Customer only)
// ============================================
router.get('/job/:jobId', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists and belongs to customer
    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found' 
      });
    }

    const job = jobResult.rows[0];

    // Only job owner can view bids
    if (job.customer_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view bids on your own jobs' 
      });
    }

    // Get all bids with worker details
    const bidsResult = await pool.query(
      `SELECT 
        b.*,
        u.full_name as worker_name,
        u.email as worker_email,
        u.phone as worker_phone,
        u.profile_picture,
        wp.bio,
        wp.hourly_rate,
        (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) as rating,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as total_reviews,
        (SELECT COUNT(*) FROM bookings WHERE worker_id = u.id AND status = 'completed') as total_jobs_completed
       FROM bids b
       JOIN users u ON b.worker_id = u.id
       LEFT JOIN worker_profiles wp ON b.worker_id = wp.user_id
       WHERE b.job_id = $1
       ORDER BY 
         CASE 
           WHEN b.status = 'pending' THEN 1
           WHEN b.status = 'accepted' THEN 2
           ELSE 3
         END,
         b.created_at DESC`,
      [jobId]
    );

    res.json({
      success: true,
      data: bidsResult.rows,
      total: bidsResult.rows.length
    });

  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bids. Please try again.' 
    });
  }
});

// ============================================
// GET /api/bids/my - Get my bids (Worker only)
// ============================================
router.get('/my', verifyToken, requireRole('worker'), async (req, res) => {
  try {
    const worker_id = req.user.id;
    const { status } = req.query;

    let queryText = `
      SELECT 
        b.*,
        j.title as job_title,
        j.description as job_description,
        j.budget_min,
        j.budget_max,
        j.location,
        j.city,
        j.province,
        j.status as job_status,
        j.images as job_images,
        u.full_name as customer_name,
        u.phone as customer_phone
       FROM bids b
       JOIN jobs j ON b.job_id = j.id
       JOIN users u ON j.customer_id = u.id
       WHERE b.worker_id = $1
    `;

    const params = [worker_id];

    // Filter by status if provided
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      queryText += ' AND b.status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY b.created_at DESC';

    const bidsResult = await pool.query(queryText, params);

    res.json({
      success: true,
      data: bidsResult.rows,
      total: bidsResult.rows.length
    });

  } catch (error) {
    console.error('Error fetching my bids:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch your bids. Please try again.' 
    });
  }
});

// ============================================
// PUT /api/bids/:bidId/accept - Accept a bid (Customer only)
// ============================================
router.put('/:bidId/accept', verifyToken, requireRole('customer'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { bidId } = req.params;
    const customer_id = req.user.id;

    // Get bid details
    const bidResult = await client.query(
      `SELECT b.*, j.customer_id, j.title as job_title, j.id as job_id
       FROM bids b
       JOIN jobs j ON b.job_id = j.id
       WHERE b.id = $1`,
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bid not found' 
      });
    }

    const bid = bidResult.rows[0];

    // Check if customer owns this job
    if (bid.customer_id !== customer_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only accept bids on your own jobs' 
      });
    }

    // Check if bid is still pending
    if (bid.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `This bid has already been ${bid.status}` 
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    // 1. Update bid status to accepted
    await client.query(
      'UPDATE bids SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', bidId]
    );

    // 2. Reject all other pending bids for this job
    await client.query(
      'UPDATE bids SET status = $1, updated_at = NOW() WHERE job_id = $2 AND id != $3 AND status = $4',
      ['rejected', bid.job_id, bidId, 'pending']
    );

    // 3. Update job status to assigned
    await client.query(
      'UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2',
      ['assigned', bid.job_id]
    );

    // 4. Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings 
       (job_id, customer_id, worker_id, agreed_price, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [bid.job_id, customer_id, bid.worker_id, bid.bid_amount, 'confirmed']
    );

    // 5. Create notification for worker
    await client.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        bid.worker_id,
        'bid_accepted',
        'Your Bid Was Accepted!',
        `Congratulations! Your bid of $${bid.bid_amount} for "${bid.job_title}" was accepted`,
        bookingResult.rows[0].id
      ]
    );

    // 6. Notify rejected bidders
    const rejectedBidsResult = await client.query(
      'SELECT worker_id FROM bids WHERE job_id = $1 AND id != $2 AND status = $3',
      [bid.job_id, bidId, 'rejected']
    );

    for (const rejectedBid of rejectedBidsResult.rows) {
      await client.query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          rejectedBid.worker_id,
          'bid_rejected',
          'Bid Not Accepted',
          `Your bid for "${bid.job_title}" was not accepted. The customer has chosen another worker.`,
          bid.job_id
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Bid accepted successfully',
      data: {
        bid: bid,
        booking: bookingResult.rows[0]
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting bid:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to accept bid. Please try again.' 
    });
  } finally {
    client.release();
  }
});

// ============================================
// PUT /api/bids/:bidId/reject - Reject a bid (Customer only)
// ============================================
router.put('/:bidId/reject', verifyToken, requireRole('customer'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { bidId } = req.params;
    const customer_id = req.user.id;

    // Get bid details
    const bidResult = await client.query(
      `SELECT b.*, j.customer_id, j.title as job_title
       FROM bids b
       JOIN jobs j ON b.job_id = j.id
       WHERE b.id = $1`,
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bid not found' 
      });
    }

    const bid = bidResult.rows[0];

    // Check if customer owns this job
    if (bid.customer_id !== customer_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only reject bids on your own jobs' 
      });
    }

    // Check if bid is still pending
    if (bid.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `This bid has already been ${bid.status}` 
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    // Update bid status to rejected
    await client.query(
      'UPDATE bids SET status = $1, updated_at = NOW() WHERE id = $2',
      ['rejected', bidId]
    );

    // Create notification for worker
    await client.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        bid.worker_id,
        'bid_rejected',
        'Bid Not Accepted',
        `Your bid for "${bid.job_title}" was not accepted by the customer.`,
        bidId
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Bid rejected successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting bid:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject bid. Please try again.' 
    });
  } finally {
    client.release();
  }
});

// ============================================
// DELETE /api/bids/:bidId - Withdraw a bid (Worker only)
// ============================================
router.delete('/:bidId', verifyToken, requireRole('worker'), async (req, res) => {
  try {
    const { bidId } = req.params;
    const worker_id = req.user.id;

    // Get bid details
    const bidResult = await pool.query(
      'SELECT * FROM bids WHERE id = $1',
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bid not found' 
      });
    }

    const bid = bidResult.rows[0];

    // Check if worker owns this bid
    if (bid.worker_id !== worker_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only withdraw your own bids' 
      });
    }

    // Can only withdraw pending bids
    if (bid.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only withdraw pending bids' 
      });
    }

    // Delete the bid
    await pool.query('DELETE FROM bids WHERE id = $1', [bidId]);

    res.json({
      success: true,
      message: 'Bid withdrawn successfully'
    });

  } catch (error) {
    console.error('Error withdrawing bid:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to withdraw bid. Please try again.' 
    });
  }
});

// ============================================
// GET /api/bids/:bidId - Get single bid details
// ============================================
router.get('/:bidId', verifyToken, async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user.id;

    // Get bid with all details
    const bidResult = await pool.query(
      `SELECT 
        b.*,
        j.title as job_title,
        j.description as job_description,
        j.customer_id,
        u.full_name as worker_name,
        wp.rating,
        wp.total_reviews,
        wp.profile_picture
       FROM bids b
       JOIN jobs j ON b.job_id = j.id
       JOIN users u ON b.worker_id = u.id
       LEFT JOIN worker_profiles wp ON b.worker_id = wp.user_id
       WHERE b.id = $1`,
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bid not found' 
      });
    }

    const bid = bidResult.rows[0];

    // Check permission (either job owner or bid owner)
    if (bid.customer_id !== userId && bid.worker_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view this bid' 
      });
    }

    res.json({
      success: true,
      data: bid
    });

  } catch (error) {
    console.error('Error fetching bid:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bid details. Please try again.' 
    });
  }
});

module.exports = router;