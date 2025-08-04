'use client';

import { format } from 'date-fns';
import { Check, Receipt, Trash2, Users, X } from 'lucide-react';

import { useState } from 'react';

import {
  calculateExpenseAmounts,
  markApartmentAsPaid,
  markApartmentAsUnpaid,
} from '@/lib/expense-utils';
import { updateExpense } from '@/lib/firestore';
import type { Expense, User } from '@/lib/types';

import { CategoryIcon } from '@/components/icons/category-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';

interface ExpenseItemProps {
  expense: Expense;
  users: User[];
  categories?: { id: string; name: string; icon?: string }[];
  currentUserApartment?: string;
  onExpenseUpdate?: (updatedExpense: Expense) => void;
  currentUserRole?: string; // 'admin' or 'user'
  onExpenseDelete?: (expenseId: string) => void;
}

export function ExpenseItem({
  expense,
  users,
  categories,
  currentUserApartment,
  onExpenseUpdate,
  currentUserRole,
  onExpenseDelete,
}: ExpenseItemProps) {
  const { toast } = useToast();
  const [loadingMap, setLoadingMap] = useState<{ [apartmentId: string]: boolean }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const calculation = calculateExpenseAmounts(expense);

  // Check if this is a cleaning expense
  const category = categories?.find(c => c.id === expense.categoryId);
  const isCleaningExpense =
    (typeof category?.name === 'string' ? category.name.toLowerCase() : '') === 'cleaning';

  // Helper function to format apartment display with owner(s)
  const formatApartmentWithUsers = (apartmentId: string, showYou: boolean = false) => {
    // Use apartmentId as the apartment name
    const apartmentName = apartmentId;
    // Find owners for this apartment
    const owners = users.filter(
      user =>
        user.apartment === apartmentId &&
        (user.propertyRole === 'owner' || user.propertyRole === 'tenant')
    );
    const ownerNames = owners.map(user => user.name).join(', ');
    const youSuffix = showYou ? ' (You)' : '';
    if (ownerNames) {
      return `${apartmentName} (Owner: ${ownerNames})${youSuffix}`;
    }
    return `${apartmentName}${youSuffix}`;
  };

  const handleMarkPaid = async (apartmentId: string) => {
    const isCurrentUserPayment = apartmentId === currentUserApartment;
    const isPayer = currentUserApartment === expense.paidByApartment;
    const currentUser = users.find(user => user.apartment === currentUserApartment);
    const isOwnerOrTenant =
      currentUser &&
      (currentUser.propertyRole === 'owner' || currentUser.propertyRole === 'tenant');

    // Allow if: user is owner/tenant of their own apartment, or user is the payer (can mark all)
    if (!isOwnerOrTenant && !isPayer) return;

    setLoadingMap(prev => ({ ...prev, [apartmentId]: true }));
    try {
      const updatedExpense = markApartmentAsPaid(expense, apartmentId);
      await updateExpense(expense.id, { paidByApartments: updatedExpense.paidByApartments });
      onExpenseUpdate?.(updatedExpense);

      const isUserMarkingOwnPayment = isCurrentUserPayment && !isPayer;

      toast({
        title: 'Payment Marked',
        description: isUserMarkingOwnPayment
          ? 'Your payment has been marked as paid'
          : `${apartmentId} marked as paid`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setLoadingMap(prev => ({ ...prev, [apartmentId]: false }));
    }
  };

  const handleMarkUnpaid = async (apartmentId: string) => {
    const isCurrentUserPayment = apartmentId === currentUserApartment;
    const isPayer = currentUserApartment === expense.paidByApartment;
    const currentUser = users.find(user => user.apartment === currentUserApartment);
    const isOwnerOrTenant =
      currentUser &&
      (currentUser.propertyRole === 'owner' || currentUser.propertyRole === 'tenant');

    // Allow if: user is owner/tenant of their own apartment, or user is the payer (can mark all)
    if (!isOwnerOrTenant && !isPayer) return;

    setLoadingMap(prev => ({ ...prev, [apartmentId]: true }));
    try {
      const updatedExpense = markApartmentAsUnpaid(expense, apartmentId);
      await updateExpense(expense.id, { paidByApartments: updatedExpense.paidByApartments });
      onExpenseUpdate?.(updatedExpense);

      const isUserMarkingOwnPayment = isCurrentUserPayment && !isPayer;

      toast({
        title: 'Payment Unmarked',
        description: isUserMarkingOwnPayment
          ? 'Your payment has been marked as unpaid'
          : `${apartmentId} marked as unpaid`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setLoadingMap(prev => ({ ...prev, [apartmentId]: false }));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          {/* Mobile: Stack everything vertically */}
          <div className="flex items-start gap-3 min-w-0">
            {category?.icon && <CategoryIcon name={category.icon} className="mt-1 flex-shrink-0" />}
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg leading-tight pr-2">
                {expense.description}
              </CardTitle>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 flex-wrap">
                  {category && <span className="font-medium text-foreground">{category.name}</span>}
                  {category && <span className="text-muted-foreground">•</span>}
                  <span className="whitespace-nowrap">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </span>
                  {expense.receipt && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Receipt className="h-4 w-4 flex-shrink-0" />
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="break-words">
                    Paid by {formatApartmentWithUsers(expense.paidByApartment)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount and actions section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-xl sm:text-2xl font-bold">
                ₹{(Number(expense.amount) || 0).toFixed(2)}
              </div>
              {calculation.adjustedAmount !== calculation.originalAmount && (
                <div className="text-sm text-muted-foreground">
                  Outstanding:{' '}
                  <span className="text-red-600 font-medium">
                    ₹{(Number(calculation.adjustedAmount) || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Admin Delete Button */}
            {currentUserRole === 'admin' && onExpenseDelete && (
              <div className="flex justify-start sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-100"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Delete Expense"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Expense</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this expense? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowDeleteDialog(false);
                          onExpenseDelete(expense.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment Status Overview - Hidden for cleaning expenses */}
        {!isCleaningExpense && (
          <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium">
                {calculation.paidApartments.length} of {expense.owedByApartments?.length || 0} paid
              </span>
            </div>
            <div className="flex justify-start sm:justify-end">
              <Badge
                variant={calculation.unpaidApartments.length === 0 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {calculation.unpaidApartments.length === 0 ? 'Fully Paid' : 'Pending'}
              </Badge>
            </div>
          </div>
        )}

        {/* Apartment Payment Status - Hidden for cleaning expenses */}
        {!isCleaningExpense && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Payment Status by Apartment</h4>
            <div className="space-y-3">
              {expense.owedByApartments?.map(apartmentId => {
                // Enable button if:
                // - current user is owner or tenant of this apartment
                // - current user apartment matches this apartment
                // - current user apartment is the payer (can toggle for all)
                const isCurrentUser = currentUserApartment === apartmentId;
                // Get current user info
                const currentUser = users.find(user => user.apartment === currentUserApartment);
                // Check if current user is owner/tenant of this specific apartment
                const isOwnerOrTenantOfThisApartment =
                  isCurrentUser &&
                  currentUser &&
                  (currentUser.propertyRole === 'owner' || currentUser.propertyRole === 'tenant');
                const isPayer = currentUserApartment === expense.paidByApartment;
                const isPaid = calculation.paidApartments.includes(apartmentId);

                return (
                  <div
                    key={apartmentId}
                    className={`flex flex-col gap-2 p-3 rounded-lg border ${
                      isPaid
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    {/* Apartment info row */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${isPaid ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}
                      />
                      <span className="text-sm font-medium break-words flex-1">
                        {formatApartmentWithUsers(apartmentId, isCurrentUser)}
                      </span>
                    </div>

                    {/* Amount and action row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        ₹{(Number(expense.perApartmentShare) || 0).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-2">
                        {(isOwnerOrTenantOfThisApartment || isPayer) && (
                          <div className="flex gap-1">
                            {isPaid ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkUnpaid(apartmentId)}
                                disabled={!!loadingMap[apartmentId]}
                                className="h-7 px-2 text-xs"
                                title={
                                  isPayer ? 'Mark as unpaid (Payer can mark all)' : 'Mark as unpaid'
                                }
                              >
                                {loadingMap[apartmentId] ? (
                                  <svg
                                    className="animate-spin h-3 w-3 text-gray-500"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="8"
                                      cy="8"
                                      r="7"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M15 8a7 7 0 01-7 7V13a5 5 0 005-5h2z"
                                    />
                                  </svg>
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                <span className="ml-1 hidden sm:inline">Unpaid</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkPaid(apartmentId)}
                                disabled={!!loadingMap[apartmentId]}
                                className="h-7 px-2 text-xs"
                                title={
                                  isPayer ? 'Mark as paid (Payer can mark all)' : 'Mark as paid'
                                }
                              >
                                {loadingMap[apartmentId] ? (
                                  <svg
                                    className="animate-spin h-3 w-3 text-gray-500"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="8"
                                      cy="8"
                                      r="7"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M15 8a7 7 0 01-7 7V13a5 5 0 005-5h2z"
                                    />
                                  </svg>
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                <span className="ml-1 hidden sm:inline">Paid</span>
                              </Button>
                            )}
                          </div>
                        )}
                        {!isOwnerOrTenantOfThisApartment && !isPayer && (
                          <Badge variant={isPaid ? 'default' : 'destructive'} className="text-xs">
                            {isPaid ? 'Paid' : 'Pending'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Receipt Dialog */}
        {expense.receipt && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Receipt className="h-4 w-4 mr-2" />
                View Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg break-words">
                  Receipt - {expense.description}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Expense from {format(new Date(expense.date), 'MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={expense.receipt}
                  alt="Receipt"
                  className="w-full h-auto rounded-lg border"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
