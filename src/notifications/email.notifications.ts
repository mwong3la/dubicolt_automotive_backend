import { User } from '../database/models/User';
import { Order } from '../database/models/Order';
import { PartRequest } from '../database/models/PartRequest';
import { Quotation } from '../database/models/Quotation';
import { orderIdWhere, partRequestIdWhere } from '../dubicolt/id-lookup';
import { formatKes, sendEmail } from '../services/email.service';

function appBaseUrl(): string {
  return process.env.APP_BASE_URL?.trim() || 'http://localhost:3000';
}

async function adminRecipients(): Promise<string[]> {
  const configured = process.env.ADMIN_NOTIFICATION_EMAIL?.split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  if (configured?.length) return configured;

  const admins = await User.findAll({
    where: { role: 'admin' },
    attributes: ['email'],
  });
  return admins.map((admin) => admin.email).filter(Boolean);
}

async function safeSend(task: () => Promise<void>) {
  try {
    await task();
  } catch (error) {
    console.error('[email:failed]', error);
  }
}

export function notifyOrderPlaced(orderNumber: string, userId: string) {
  return safeSend(async () => {
    const order = await Order.findOne({
      where: { order_number: orderNumber, user_id: userId },
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
    if (!order?.user?.email) return;

    const url = `${appBaseUrl()}/dashboard/orders/${order.order_number}`;
    await sendEmail({
      to: order.user.email,
      subject: `Order ${order.order_number} placed — payment required`,
      text: [
        `Hi ${order.user.name || 'there'},`,
        '',
        `Your order ${order.order_number} has been placed.`,
        `Total: ${formatKes(Number(order.total))}`,
        '',
        `Complete M-Pesa payment here: ${url}`,
      ].join('\n'),
    });
  });
}

export function notifyPaymentCompleted(orderId: string) {
  return safeSend(async () => {
    const order = await Order.findOne({
      where: orderIdWhere(orderId) as never,
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
    if (!order?.user?.email) return;

    const url = `${appBaseUrl()}/dashboard/orders/${order.order_number}`;
    await sendEmail({
      to: order.user.email,
      subject: `Payment received for order ${order.order_number}`,
      text: [
        `Hi ${order.user.name || 'there'},`,
        '',
        `We received your payment for order ${order.order_number}.`,
        `Amount: ${formatKes(Number(order.total))}`,
        '',
        `Track your order: ${url}`,
      ].join('\n'),
    });
  });
}

export function notifyOrderStatusUpdated(orderId: string, status: string) {
  return safeSend(async () => {
    const order = await Order.findOne({
      where: orderIdWhere(orderId) as never,
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
    if (!order?.user?.email) return;

    const label = status.replace(/_/g, ' ');
    const url = `${appBaseUrl()}/dashboard/orders/${order.order_number}`;
    await sendEmail({
      to: order.user.email,
      subject: `Order ${order.order_number} is now ${label}`,
      text: [
        `Hi ${order.user.name || 'there'},`,
        '',
        `Your order ${order.order_number} status changed to ${label}.`,
        '',
        `View details: ${url}`,
      ].join('\n'),
    });
  });
}

export function notifyPartRequestSubmitted(requestNumber: string, userId: string) {
  return safeSend(async () => {
    const request = await PartRequest.findOne({
      where: { request_number: requestNumber, user_id: userId },
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
    if (!request) return;

    const buyerUrl = `${appBaseUrl()}/dashboard/sourcing/${request.request_number}`;
    const adminUrl = `${appBaseUrl()}/admin/sourcing/${request.request_number}`;

    if (request.user?.email) {
      await sendEmail({
        to: request.user.email,
        subject: `Part request ${request.request_number} submitted`,
        text: [
          `Hi ${request.user.name || 'there'},`,
          '',
        `We received your part request for ${request.part_name}.`,
        `Vehicle: ${request.vehicle.make} ${request.vehicle.model} ${request.vehicle.year}`,
        '',
        `Track progress: ${buyerUrl}`,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }

    const admins = await adminRecipients();
    if (admins.length) {
      await sendEmail({
        to: admins,
        subject: `New part request ${request.request_number}`,
        text: [
          `A new part request was submitted.`,
          `Customer: ${request.user?.name ?? 'Unknown'} (${request.user?.email ?? 'no email'})`,
          `Part: ${request.part_name}`,
          `Vehicle: ${request.vehicle.make} ${request.vehicle.model} ${request.vehicle.year}`,
          '',
          `Review: ${adminUrl}`,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }
  });
}

export function notifyQuotationCreated(requestId: string, quotationId: string) {
  return safeSend(async () => {
    const request = await PartRequest.findOne({
      where: partRequestIdWhere(requestId) as never,
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
    const quote = await Quotation.findByPk(quotationId);
    if (!request?.user?.email || !quote) return;

    const url = `${appBaseUrl()}/dashboard/sourcing/${request.request_number}`;
    await sendEmail({
      to: request.user.email,
      subject: `Quote ready for ${request.part_name}`,
      text: [
        `Hi ${request.user.name || 'there'},`,
        '',
        `A supplier quote is ready for your request ${request.request_number}.`,
        `Part: ${request.part_name}`,
        `Price: ${formatKes(Number(quote.price))}`,
        `Lead time: ${quote.lead_time_days} day(s)`,
        '',
        `Review quote: ${url}`,
      ].join('\n'),
    });
  });
}

export function notifyQuotationAccepted(orderNumber: string, userId: string) {
  return safeSend(async () => {
    const order = await Order.findOne({
      where: { order_number: orderNumber, user_id: userId },
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
    if (!order?.user?.email) return;

    const url = `${appBaseUrl()}/dashboard/orders/${order.order_number}`;
    await sendEmail({
      to: order.user.email,
      subject: `Quote accepted — order ${order.order_number} created`,
      text: [
        `Hi ${order.user.name || 'there'},`,
        '',
        `You accepted a sourcing quote. Order ${order.order_number} was created.`,
        `Amount due: ${formatKes(Number(order.total))}`,
        '',
        `Complete payment and track fulfilment: ${url}`,
      ].join('\n'),
    });
  });
}

export function notifyQuotationRejected(requestNumber: string, quotationId: string, userId: string) {
  return safeSend(async () => {
    const request = await PartRequest.findOne({
      where: { request_number: requestNumber, user_id: userId },
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
    const quote = await Quotation.findByPk(quotationId);
    if (!request || !quote) return;

    const adminUrl = `${appBaseUrl()}/admin/sourcing/${request.request_number}`;
    const admins = await adminRecipients();
    if (!admins.length) return;

    await sendEmail({
      to: admins,
      subject: `Quote rejected — ${request.request_number}`,
      text: [
        'A customer rejected a sourcing quotation.',
        '',
        `Request: ${request.request_number}`,
        `Customer: ${request.user?.name ?? 'Unknown'} (${request.user?.email ?? 'no email'})`,
        `Part: ${request.part_name}`,
        `Vehicle: ${request.vehicle.make} ${request.vehicle.model} ${request.vehicle.year}`,
        `Rejected price: ${formatKes(Number(quote.price))}`,
        '',
        `Prepare a revised quote: ${adminUrl}`,
      ].join('\n'),
    });
  });
}

export function notifyDeliveryUpdated(orderNumber: string, status: string, proofUrl?: string) {
  return safeSend(async () => {
    const order = await Order.findOne({
      where: { order_number: orderNumber },
      include: [{ model: User, attributes: ['name', 'email'] }],
    });
    if (!order?.user?.email) return;

    const label = status.replace(/_/g, ' ');
    const url = `${appBaseUrl()}/dashboard/orders/${order.order_number}`;
    const lines = [
      `Hi ${order.user.name || 'there'},`,
      '',
      `Delivery update for order ${order.order_number}: ${label}.`,
    ];
    if (proofUrl) lines.push('', `Proof of delivery: ${proofUrl}`);
    lines.push('', `Track your order: ${url}`);

    await sendEmail({
      to: order.user.email,
      subject: `Delivery update — order ${order.order_number}`,
      text: lines.join('\n'),
    });
  });
}

export function notifyWelcome(userId: string) {
  return safeSend(async () => {
    const user = await User.findByPk(userId, { attributes: ['name', 'email'] });
    if (!user?.email) return;

    await sendEmail({
      to: user.email,
      subject: 'Welcome to Dubicolt Automotive',
      text: [
        `Hi ${user.name || 'there'},`,
        '',
        'Your account is ready. Browse compatible parts, place orders, and track sourcing requests from your dashboard.',
        '',
        `Marketplace: ${appBaseUrl()}/marketplace`,
      ].join('\n'),
    });
  });
}
