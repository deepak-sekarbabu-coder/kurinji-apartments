'use client';

import { Bell, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import * as React from 'react';

import type { Expense, User } from '@/lib/types';
import { Category } from '@/lib/types';

import type { ExpensesListProps } from '@/components/expenses/expenses-list';
import { OutstandingBalance } from '@/components/outstanding-balance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface DashboardViewProps {
  user: User | null;
  expenses: Expense[];
  users: User[];
  categories: Category[];
  currentUserApartment: string | undefined;
  currentUserRole: string;
  apartmentBalances: Record<
    string,
    {
      name: string;
      balance: number;
      owes: Record<string, number>;
      isOwed: Record<string, number>;
    }
  >;
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete?: (expenseId: string) => void;
  ExpensesList: React.ComponentType<ExpensesListProps>;
}

export function DashboardView({
  user,
  expenses,
  users,
  categories,
  currentUserApartment,
  currentUserRole,
  apartmentBalances,
  onExpenseUpdate,
  onExpenseDelete,
  ExpensesList,
}: DashboardViewProps) {
  const currentApartmentBalance = currentUserApartment
    ? apartmentBalances[currentUserApartment]
    : null;

  const loggedInUserBalance = currentApartmentBalance ? currentApartmentBalance.balance : 0;

  return (
    <div className="grid gap-6">
      {/* Outstanding Balance Alert */}
      <OutstandingBalance expenses={expenses} currentUserApartment={currentUserApartment} />

      {/* Apartment Balances */}
      {currentApartmentBalance && (
        <Card>
          <CardHeader>
            <CardTitle>Apartment Balances</CardTitle>
            <CardDescription>Summary of amounts owed between apartments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* What you are owed */}
            {Object.entries(currentApartmentBalance.isOwed).map(
              ([apartmentId, amount]) =>
                amount > 0 && (
                  <div
                    key={`owed-${apartmentId}`}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-800/30">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {apartmentBalances[apartmentId]?.name || 'Unknown Apartment'}
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-green-200">
                          owes your apartment
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-green-700 dark:text-green-400">
                      ₹{amount.toFixed(2)}
                    </span>
                  </div>
                )
            )}

            {/* What you owe */}
            {Object.entries(currentApartmentBalance.owes).map(
              ([apartmentId, amount]) =>
                amount > 0 && (
                  <div
                    key={`owes-${apartmentId}`}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-800/30">
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          You owe {apartmentBalances[apartmentId]?.name || 'Unknown Apartment'}
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-red-200">
                          for shared expenses
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-red-700 dark:text-red-400">
                      ₹{amount.toFixed(2)}
                    </span>
                  </div>
                )
            )}

            {/* Net balance */}
            {currentApartmentBalance.balance !== 0 && (
              <div
                className={`mt-4 p-4 rounded-lg ${currentApartmentBalance.balance > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {currentApartmentBalance.balance > 0
                        ? 'Your apartment is owed'
                        : 'Your apartment owes'}
                    </p>
                    <p
                      className={`text-sm ${currentApartmentBalance.balance > 0 ? 'text-muted-foreground dark:text-green-200' : 'text-muted-foreground dark:text-red-200'}`}
                    >
                      {currentApartmentBalance.balance > 0
                        ? 'in total across all apartments'
                        : 'in total to other apartments'}
                    </p>
                  </div>
                  <span
                    className={`text-xl font-bold ${currentApartmentBalance.balance > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
                  >
                    {currentApartmentBalance.balance > 0 ? '+' : ''}₹
                    {Math.abs(currentApartmentBalance.balance).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>The last 5 expenses added to your apartment.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesList
              expenses={expenses}
              limit={5}
              users={users}
              categories={categories}
              currentUserApartment={currentUserApartment}
              currentUserRole={currentUserRole}
              onExpenseUpdate={onExpenseUpdate}
              onExpenseDelete={onExpenseDelete}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
            <CardDescription>Your personal balance status and account overview.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-4">
              <Bell className="h-6 w-6 text-accent" />
              <div className="grid gap-1">
                <p className="text-sm font-medium">Welcome to Kurinji Apartments, {user?.name}!</p>
                <p className="text-sm text-muted-foreground">Here is a summary of your account.</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-4">
              <Wallet
                className={`h-6 w-6 ${Math.abs(loggedInUserBalance) < 0.01 ? 'text-green-600' : loggedInUserBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
              />
              <div className="grid gap-1">
                <p className="text-sm font-medium">
                  Your balance is{' '}
                  {Math.abs(loggedInUserBalance) < 0.01
                    ? '₹0.00'
                    : loggedInUserBalance >= 0
                      ? `-₹${loggedInUserBalance.toFixed(2)}`
                      : `+₹${Math.abs(loggedInUserBalance).toFixed(2)}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.abs(loggedInUserBalance) < 0.01
                    ? 'You are all settled up.'
                    : loggedInUserBalance > 0
                      ? 'Others owe you money.'
                      : 'You have outstanding balances.'}
                </p>
              </div>
            </div>
            {loggedInUserBalance < -0.01 && (
              <>
                <Separator />
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Settle Up Reminder</p>
                    <p className="text-sm text-muted-foreground">
                      Please pay your outstanding balance to keep the records updated.
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
