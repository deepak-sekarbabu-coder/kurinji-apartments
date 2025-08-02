import { addDoc, collection } from 'firebase/firestore';

import { db } from './firebase';
import type { Apartment, Notification } from './types';

export interface PaymentDistribution {
  totalAmount: number; // Amount owed by other apartments (excluding paying apartment's share)
  payingApartment: Apartment;
  otherApartments: {
    apartment: Apartment;
    share: number;
  }[];
  description?: string;
  category?: string;
  dueDate?: Date;
  totalWithPayerShare: number; // Original total amount including paying apartment's share
}

export function distributePayment(
  amount: number,
  payingApartment: Apartment,
  allApartments: Apartment[],
  description: string = 'Shared expense',
  category: string = 'Utilities',
  dueDate?: Date
): PaymentDistribution {
  // Check if this is a cleaning expense - if so, don't split it
  if (category.toLowerCase() === 'cleaning') {
    return {
      totalAmount: 0, // No amount owed by other apartments
      payingApartment,
      otherApartments: [], // No other apartments owe anything
      description,
      category,
      dueDate,
      totalWithPayerShare: amount, // Only the paying apartment bears the cost
    };
  }

  // Filter out the paying apartment
  const otherApartments = allApartments.filter(apt => apt.id !== payingApartment.id);

  if (otherApartments.length === 0) {
    throw new Error('No other apartments to distribute payment to');
  }

  // Calculate share per apartment (equal distribution)
  const sharePerApartment = amount / allApartments.length;
  const totalOwed = sharePerApartment * otherApartments.length;

  return {
    totalAmount: totalOwed, // Only show the amount owed by other apartments
    payingApartment,
    otherApartments: otherApartments.map(apartment => ({
      apartment,
      share: parseFloat(sharePerApartment.toFixed(2)), // Round to 2 decimal places
    })),
    description,
    category,
    dueDate,
    totalWithPayerShare: amount, // Store the original total including payer's share
  };
}

export async function sendPaymentRequests(
  payment: PaymentDistribution,
  userId?: string
): Promise<void> {
  const batch: Promise<unknown>[] = [];
  const now = new Date().toISOString();
  const dueDate =
    payment.dueDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default to 7 days from now

  // Create a notification for each owing apartment
  payment.otherApartments.forEach(({ apartment, share }) => {
    if (apartment.id === payment.payingApartment.id) return; // Skip the paying apartment

    const notification: Omit<Notification, 'id'> = {
      type: 'payment_request',
      title: `Payment Request from ${payment.payingApartment.name}`,
      message: `${payment.description || 'Shared expense'}. Your share: ₹${share.toFixed(2)}`,
      amount: share,
      currency: '₹',
      fromApartmentId: payment.payingApartment.id,
      toApartmentId: apartment.id,
      isRead: false,
      createdAt: now,
      dueDate,
      status: 'pending',
      category: payment.category,
      requestedBy: userId,
    };

    batch.push(addDoc(collection(db, 'notifications'), notification));
  });

  try {
    await Promise.all(batch);
  } catch (error) {
    console.error('Error sending payment requests:', error);
    throw new Error('Failed to send payment requests');
  }
}

export function formatPaymentDistribution(payment: PaymentDistribution): string {
  const { totalAmount, payingApartment, otherApartments, description } = payment;

  const lines = [
    `💰 ${description || 'Payment Distribution'}`,
    `----------------------`,
    `Paying Apartment: ${payingApartment.name}`,
    `Total Amount: ₹${totalAmount.toFixed(2)}`,
    `Shared among ${otherApartments.length} apartments`,
    `----------------------`,
  ];

  // Add each apartment's share
  otherApartments.forEach(({ apartment, share }) => {
    lines.push(`${apartment.name} owes: ₹${share.toFixed(2)}`);
  });

  return lines.join('\n');
}
