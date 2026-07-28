import { Router, Response } from 'express';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { User } from '../models/User.js';
import { protect, isAdmin, AuthRequest } from '../middleware/auth.js';
import { getIO } from '../socket.js';

const router = Router();

// @route POST /api/orders
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalAmount,
      discountAmount,
      couponCode,
      paymentMethod,
      transactionId,
      senderPhone,
      paymentScreenshot,
    } = req.body;

    if (!items || !items.length || !paymentMethod || !transactionId || !senderPhone) {
      return res.status(400).json({
        success: false,
        message: 'Items, payment method, transaction ID and sender phone are required',
      });
    }

    // Generate Order Number: SUB-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SUB-${dateStr}-${randomSuffix}`;

    const formattedItems = items.map((item: any) => ({
      product: item.product,
      title: item.title,
      image: item.image || '',
      category: item.category || '',
      price: Number(item.price) || 0,
      discount: Number(item.discount) || 0,
      quantity: Number(item.quantity) || 1,
      duration: item.duration || '1 Month',
      accessType: item.accessType || 'Shared',
      finalAmount: (Number(item.price) || 0) * (Number(item.quantity) || 1),
    }));

    // 1. Create Order in MongoDB
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      customerName: customerName || req.user.name,
      customerEmail: customerEmail || req.user.email,
      customerPhone: customerPhone || req.user.phone || senderPhone,
      items: formattedItems,
      totalAmount: Number(totalAmount) || 0,
      discountAmount: Number(discountAmount) || 0,
      couponCode: couponCode || '',
      paymentMethod,
      transactionId: transactionId.trim().toUpperCase(),
      senderPhone: senderPhone.trim(),
      paymentStatus: 'pending',
      orderStatus: 'pending',
      deliveryStatus: 'pending',
    });

    // 2. Create Payment in MongoDB
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      paymentMethod,
      transactionId: transactionId.trim().toUpperCase(),
      senderPhone: senderPhone.trim(),
      amount: Number(totalAmount) || 0,
      paymentScreenshot: paymentScreenshot || '',
      status: 'pending',
    });

    // 3. Create Activity Logs
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Order Created',
      details: `Created Order #${order.orderNumber} for ৳${order.totalAmount} (${paymentMethod})`,
    });

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Payment Submitted',
      details: `Submitted ${paymentMethod} payment TrxID: ${transactionId} for Order #${order.orderNumber}`,
    });

    // 4. Create Notifications for User and Admins
    await Notification.create({
      user: req.user._id,
      title: 'Order Placed Successfully!',
      message: `Your order #${order.orderNumber} has been submitted with ${paymentMethod} Trx ID: ${transactionId}. Admin will verify shortly.`,
      type: 'order',
      link: '/user/orders',
    });

    // Notify all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    for (const admin of adminUsers) {
      await Notification.create({
        user: admin._id,
        title: '🛍️ New Order Submitted',
        message: `New order #${order.orderNumber} (৳${order.totalAmount}) placed by ${order.customerName}. Payment TrxID: ${transactionId}`,
        type: 'order',
        link: '/admin/orders',
      });
    }

    // 5. Realtime Socket Emission
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('order:created', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
      });

      io.to(`user_${req.user._id}`).emit('notification:new', {
        title: 'Order Placed',
        message: `Order #${order.orderNumber} placed successfully.`,
      });
    }

    res.status(201).json({ success: true, order, payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/orders/my-orders
router.get('/my-orders', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/orders/track/:query
router.get('/track/:query', async (req: AuthRequest, res: Response) => {
  try {
    const q = req.params.query.trim();

    const orders = await Order.find({
      $or: [{ orderNumber: q }, { customerPhone: q }, { transactionId: q }],
    })
      .select('orderNumber customerName items totalAmount paymentMethod paymentStatus orderStatus deliveryStatus createdAt deliveredCredentials deliveryInstructions')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/orders (Admin - Search, Filter, Pagination, Sort)
router.get('/', protect, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentStatus, search, sortBy, sortOrder, page = 1, limit = 50 } = req.query;
    let queryFilter: any = {};

    if (status) queryFilter.orderStatus = status;
    if (paymentStatus) queryFilter.paymentStatus = paymentStatus;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      queryFilter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { customerEmail: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: q, $options: 'i' } },
        { transactionId: { $regex: q, $options: 'i' } },
        { senderPhone: { $regex: q, $options: 'i' } },
      ];
    }

    const sortField = (sortBy as string) || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Order.countDocuments(queryFilter);
    const orders = await Order.find(queryFilter)
      .populate('user', 'name email phone')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      orders,
      pagination: {
        totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/orders/:id/approve (Admin)
router.put('/:id/approve', protect, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { deliveredCredentials, deliveryInstructions, adminNotes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.paymentStatus = 'verified';
    order.orderStatus = 'completed';
    order.deliveryStatus = 'delivered';
    if (deliveredCredentials) order.deliveredCredentials = deliveredCredentials;
    if (deliveryInstructions !== undefined) order.deliveryInstructions = deliveryInstructions;
    if (adminNotes !== undefined) order.adminNotes = adminNotes;
    order.verifiedBy = req.user?._id;
    order.completedAt = new Date();

    await order.save();

    // Update Payment document in MongoDB
    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        status: 'verified',
        verifiedBy: req.user?._id,
        verifiedAt: new Date(),
        adminNotes: adminNotes || '',
      }
    );

    // Create Activity Logs
    await ActivityLog.create({
      user: req.user?._id,
      userName: req.user?.name,
      action: 'Payment Approved',
      details: `Approved payment & verified TrxID ${order.transactionId} for Order #${order.orderNumber}`,
    });

    await ActivityLog.create({
      user: req.user?._id,
      userName: req.user?.name,
      action: 'Product Delivered',
      details: `Delivered login credentials for Order #${order.orderNumber} to ${order.customerEmail}`,
    });

    // Send Notification
    await Notification.create({
      user: order.user,
      title: '🎉 Order Approved & Credentials Delivered!',
      message: `Your order #${order.orderNumber} is completed! Access your account credentials/keys in your User Dashboard now.`,
      type: 'order',
      link: '/user/orders',
    });

    // Automatic Review Request Notification
    const reviewProdId = order.items && order.items.length > 0 ? order.items[0].product : null;
    await Notification.create({
      user: order.user,
      title: '⭐ Share Your Experience!',
      message: 'Your order has been completed. Please share your experience by leaving a review.',
      type: 'order',
      link: reviewProdId ? `/products/${reviewProdId}` : '/user/orders',
    });

    const io = getIO();
    if (io) {
      io.to(`user_${order.user}`).emit('order:updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'completed',
        credentials: order.deliveredCredentials,
      });
      io.to(`user_${order.user}`).emit('notification:new', {
        title: 'Order Completed!',
        message: `Credentials delivered for #${order.orderNumber}.`,
      });
    }

    res.json({ success: true, message: 'Order approved and delivered successfully', order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PATCH /api/orders/:id/status (Admin - Generic status update)
router.patch('/:id/status', protect, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orderStatus, paymentStatus, deliveryStatus, deliveredCredentials, deliveryInstructions, adminNotes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (deliveryStatus) order.deliveryStatus = deliveryStatus;
    if (deliveredCredentials) order.deliveredCredentials = deliveredCredentials;
    if (deliveryInstructions !== undefined) order.deliveryInstructions = deliveryInstructions;
    if (adminNotes !== undefined) order.adminNotes = adminNotes;

    if (orderStatus === 'completed') {
      order.paymentStatus = 'verified';
      order.deliveryStatus = 'delivered';
      order.completedAt = new Date();
    } else if (orderStatus === 'cancelled') {
      order.paymentStatus = order.paymentStatus === 'refunded' ? 'refunded' : 'rejected';
      order.deliveryStatus = 'cancelled';
    }

    order.verifiedBy = req.user?._id;
    await order.save();

    // Sync Payment record
    let payStatus: 'pending' | 'verified' | 'rejected' | 'refunded' = 'pending';
    if (order.paymentStatus === 'verified') payStatus = 'verified';
    else if (order.paymentStatus === 'rejected') payStatus = 'rejected';
    else if (order.paymentStatus === 'refunded') payStatus = 'refunded';

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        status: payStatus,
        verifiedBy: req.user?._id,
        verifiedAt: payStatus === 'verified' ? new Date() : undefined,
        adminNotes: adminNotes || '',
      }
    );

    // Create Activity Log
    await ActivityLog.create({
      user: req.user?._id,
      userName: req.user?.name,
      action: orderStatus === 'completed' ? 'Product Delivered' : 'Order Updated',
      details: `Updated Order #${order.orderNumber} status to ${orderStatus} (Payment: ${order.paymentStatus})`,
    });

    // Send Notification
    await Notification.create({
      user: order.user,
      title: `Order #${order.orderNumber} ${orderStatus.toUpperCase()}`,
      message: `Your order status has been updated to ${orderStatus}. Check details in dashboard.`,
      type: 'order',
      link: '/user/orders',
    });

    if (orderStatus === 'completed') {
      const reviewProdId = order.items && order.items.length > 0 ? order.items[0].product : null;
      await Notification.create({
        user: order.user,
        title: '⭐ Share Your Experience!',
        message: 'Your order has been completed. Please share your experience by leaving a review.',
        type: 'order',
        link: reviewProdId ? `/products/${reviewProdId}` : '/user/orders',
      });
    }

    res.json({ success: true, message: 'Order status updated successfully', order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/orders/:id/reject (Admin)
router.put('/:id/reject', protect, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rejectionReason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const reason = rejectionReason || 'Transaction ID not verified or payment not received.';

    order.paymentStatus = 'rejected';
    order.orderStatus = 'cancelled';
    order.deliveryStatus = 'cancelled';
    order.adminNotes = reason;
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        status: 'rejected',
        rejectionReason: reason,
        adminNotes: reason,
        verifiedBy: req.user?._id,
      }
    );

    // Activity Log
    await ActivityLog.create({
      user: req.user?._id,
      userName: req.user?.name,
      action: 'Payment Rejected',
      details: `Rejected payment for Order #${order.orderNumber}. Reason: ${reason}`,
    });

    await Notification.create({
      user: order.user,
      title: '❌ Order Cancelled / Payment Rejected',
      message: `Your order #${order.orderNumber} was cancelled. Reason: ${reason}`,
      type: 'order',
      link: '/user/orders',
    });

    const io = getIO();
    if (io) {
      io.to(`user_${order.user}`).emit('order:updated', {
        orderId: order._id,
        status: 'cancelled',
        reason,
      });
    }

    res.json({ success: true, message: 'Order rejected successfully', order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/orders/:id (Get single order details)
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone avatar')
      .populate('verifiedBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Ensure non-admins can only view their own orders
    if (req.user?.role !== 'admin' && order.user._id.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PATCH /api/orders/:id/notes (Admin - Update internal notes)
router.patch('/:id/notes', protect, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { adminNotes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.adminNotes = adminNotes || '';
    await order.save();

    res.json({ success: true, message: 'Internal notes updated', order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PATCH /api/orders/:id/assign (Admin - Assign staff)
router.patch('/:id/assign', protect, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { staffId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.assignedTo = staffId || null;
    await order.save();

    res.json({ success: true, message: 'Staff assigned successfully', order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route DELETE /api/orders/:id (Admin - Delete order)
router.delete('/:id', protect, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Delete associated payment
    await Payment.deleteMany({ order: req.params.id });

    await ActivityLog.create({
      user: req.user?._id,
      userName: req.user?.name,
      action: 'Order Deleted',
      details: `Deleted Order #${order.orderNumber} (৳${order.totalAmount})`,
    });

    res.json({ success: true, message: 'Order and payment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
