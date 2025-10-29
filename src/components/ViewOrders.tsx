'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditOrderDialog from "./EditOrderDialog";

interface Order {
  id: string;
  order_type: string;
  asset_type: string;
  model: string | null;
  quantity: number;
  warehouse: string;
  sales_order: string;
  employee_id: string;
  employee_name: string;
  serial_numbers: string[];
  order_date: string;
  created_by: string;
}

interface ViewOrdersProps {
  currentUser: string;
  userRole: string | null;
}

const ViewOrders: React.FC<ViewOrdersProps> = ({ currentUser, userRole }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedSerials, setExpandedSerials] = useState<Set<string>>(new Set());

  const toggleSerials = (orderId: string) => {
    setExpandedSerials(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_type,
          asset_type,
          model,
          quantity,
          warehouse,
          sales_order,
          employee_id,
          employee_name,
          serial_numbers,
          order_date,
          created_by
        `)
        .eq('created_by', currentUser)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      alert('Error loading orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('orders').delete().eq('id', deleteId);
    if (error) {
      alert('Failed to delete: ' + error.message);
    } else {
      setOrders(prev => prev.filter(o => o.id !== deleteId));
    }
    setDeleteId(null);
  };

  const filtered = orders.filter(o =>
    o.sales_order.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.asset_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.model && o.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
    o.warehouse.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="mx-auto animate-spin h-6 w-6" />
          <p className="mt-2">Loading your orders...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardTitle>Your Orders</CardTitle>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales Order</TableHead>
                  <TableHead>Order type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead>Serial numbers</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                      {searchQuery ? 'No matching orders.' : 'You have no orders yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o) => {
                    const isExpanded = expandedSerials.has(o.id);
                    const visibleSerials = isExpanded ? o.serial_numbers : o.serial_numbers.slice(0, 2);
                    const hasMore = o.serial_numbers.length > 2;

                    return (
                      <TableRow key={o.id}>
                        {/* Sales Order */}
                        <TableCell className="font-medium text-blue-600">
                          {o.sales_order}
                        </TableCell>

                        {/* Order type */}
                        <TableCell>
                          <Badge variant="outline">{o.order_type}</Badge>
                        </TableCell>

                        {/* Location */}
                        <TableCell>{o.warehouse}</TableCell>

                        {/* Employee */}
                        <TableCell>
                          <div>
                            <div className="font-medium">{o.employee_name}</div>
                            <div className="text-xs text-muted-foreground">{o.employee_id}</div>
                          </div>
                        </TableCell>

                        {/* Asset Type */}
                        <TableCell>{o.asset_type}</TableCell>

                        {/* Model */}
                        <TableCell>{o.model || '—'}</TableCell>

                        {/* Quantity */}
                        <TableCell className="text-center">{o.quantity}</TableCell>

                        {/* Serial numbers */}
                        <TableCell>
                          {o.serial_numbers.length === 0 ? (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1">
                              {visibleSerials.map((s, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {s}
                                </Badge>
                              ))}
                              {hasMore && !isExpanded && (
                                <button
                                  onClick={() => toggleSerials(o.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                                >
                                  +{o.serial_numbers.length - 2} more
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              )}
                              {isExpanded && (
                                <button
                                  onClick={() => toggleSerials(o.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                                >
                                  Show less
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          {new Date(o.order_date).toLocaleDateString()}
                        </TableCell>

                        {/* Created By */}
                        <TableCell>{o.created_by}</TableCell>

                        {/* Actions */}
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditOrder(o)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteId(o.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editOrder && (
        <EditOrderDialog
          order={editOrder}
          open={!!editOrder}
          onOpenChange={(open) => !open && setEditOrder(null)}
          onSuccess={(updated) => {
            setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
            setEditOrder(null);
          }}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order and its serial numbers will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ViewOrders;