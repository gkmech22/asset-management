'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';  // Add if not present

interface StockRow {
  warehouse: string;
  asset_type: string;
  model: string | null;
  inward: number;
  outward: number;
  stock: number;
}

interface StockSummaryProps {
  currentUser: string;
}

const StockSummary: React.FC<StockSummaryProps> = ({ currentUser }) => {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      // REMOVED .eq('created_by', currentUser) - functions now broad, RLS handles
      const { data, error } = await supabase.rpc('stock_summary');

      if (error) {
        console.error('RPC Error:', error);  // Check browser console
        setError(`RPC failed: ${error.message}`);
        setRows([]);
      } else {
        console.log('Stock Data:', data);  // Debug log
        setRows(data || []);
        if (data && data.length === 0) {
          setError('No stock data. Check if orders have "Inward"/"Outward" types.');
        }
      }
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(`Fetch failed: ${err.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [currentUser]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="mx-auto animate-spin h-6 w-6" />
          <p className="mt-2">Loading stock summary…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Summary</CardTitle>
          <Button size="sm" variant="outline" onClick={fetchSummary}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>

        {error && (
          <Alert variant="destructive" className="mx-6 mb-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Inward</TableHead>
                  <TableHead className="text-right">Outward</TableHead>
                  <TableHead className="text-right font-semibold">Stock</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      {error ? error : 'No stock data found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.warehouse}</TableCell>
                      <TableCell>{r.asset_type}</TableCell>
                      <TableCell>{r.model ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.inward}</TableCell>
                      <TableCell className="text-right">{r.outward}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          r.stock > 0 ? 'text-green-600' : r.stock < 0 ? 'text-red-600' : ''
                        }`}
                      >
                        {r.stock}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockSummary;