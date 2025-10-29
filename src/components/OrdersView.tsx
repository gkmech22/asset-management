'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CreateOrder from "./CreateOrder";
import ViewOrders from "./ViewOrders";
import StockSummary from "./StockSummary";          // <-- new
import EmployeeSummary from "./EmployeeSummary";    // <-- new

interface OrdersViewProps {
  userRole: string | null;
  currentUser: string;  // email or user.id
}

const OrdersView: React.FC<OrdersViewProps> = ({ userRole, currentUser }) => {
  const [activeTab, setActiveTab] = useState('create-order');

  if (!['Super Admin', 'Admin', 'Operator'].includes(userRole || '')) {
    return (
      <Card>
        <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
        <CardContent>
          <p>You do not have permission to access Orders.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Orders Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create-order">Create Order</TabsTrigger>
          <TabsTrigger value="view-orders">View Orders</TabsTrigger>
          <TabsTrigger value="stock-summary">Stock Summary</TabsTrigger>
          <TabsTrigger value="employee-summary">Employee Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="create-order">
          <CreateOrder currentUser={currentUser} userRole={userRole} />
        </TabsContent>

        <TabsContent value="view-orders">
          <ViewOrders currentUser={currentUser} userRole={userRole} />
        </TabsContent>

        <TabsContent value="stock-summary">
          <StockSummary currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="employee-summary">
          <EmployeeSummary currentUser={currentUser} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersView;