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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmpRow {
  employee_id: string;
  employee_name: string;
  asset_type: string;
  model: string | null;
  dispatched: number;
  received: number;
  pending: number;
}

interface EmployeeSummaryProps {
  currentUser: string;
}

const EmployeeSummary: React.FC<EmployeeSummaryProps> = ({ currentUser }) => {
  const [rows, setRows] = useState<EmpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('employee_summary');

      if (error) {
        console.error('RPC Error:', error);
        setError(`RPC failed: ${error.message}`);
        setRows([]);
      } else {
        console.log('Employee Data:', data);  // Debug log
        setRows(data || []);
        if (data && data.length === 0) {
          setError('No employee data. Check if orders have employee details and "Inward"/"Outward" types.');
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
          <p className="mt-2">Loading employee summary…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employee Summary</CardTitle>
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
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Dispatched</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right font-semibold">Pending</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      {error ? error : 'No employee data found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.employee_id}</TableCell>
                      <TableCell>{r.employee_name}</TableCell>
                      <TableCell>{r.asset_type}</TableCell>
                      <TableCell>{r.model ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.dispatched}</TableCell>
                      <TableCell className="text-right">{r.received}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          r.pending > 0 ? 'text-orange-600' : r.pending < 0 ? 'text-red-600' : ''
                        }`}
                      >
                        {r.pending}
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

export default EmployeeSummary;