import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Asset } from '@/hooks/useAssets';

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  currentStatus: string;
  onSubmit: (assetId: string, status: string, data?: any) => void;
}

const statusOptions = [
  'Available',
  'Assigned',
  'Lost',
  'Emp damage',
  'Courier Damage',
  'Repair',
  'Scrap',
  'Return to Vendor'
];

const recoveryAmountStatuses = ['Lost', 'Emp damage', 'Courier Damage'];

export const StatusChangeDialog = ({ open, onOpenChange, asset, currentStatus, onSubmit }: StatusChangeDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [location, setLocation] = useState(asset.location);
  const [recoveryAmount, setRecoveryAmount] = useState<number | ''>('');

  const availableStatuses = currentStatus === 'Assigned' 
    ? statusOptions.filter(status => status !== 'Assigned')
    : statusOptions.filter(status => status !== 'Assigned');

  const showRecoveryAmount = recoveryAmountStatuses.includes(selectedStatus);
  const isReturnDialog = currentStatus === 'Assigned';

  const handleSubmit = () => {
    if (!selectedStatus) return;

    const data: any = {};
    
    if (isReturnDialog) {
      data.remarks = remarks;
      data.receivedBy = receivedBy;
      data.location = location;
    }
    
    if (showRecoveryAmount && recoveryAmount !== '') {
      data.recovery_amount = Number(recoveryAmount);
    }

    onSubmit(asset.id, selectedStatus, data);
    
    // Reset form
    setSelectedStatus('');
    setRemarks('');
    setReceivedBy('');
    setLocation(asset.location);
    setRecoveryAmount('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReturnDialog ? 'Return Asset' : 'Change Status'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isReturnDialog && (
            <>
              <div>
                <Label htmlFor="receivedBy">Received By</Label>
                <Input
                  id="receivedBy"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Enter receiver name"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                />
              </div>

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks (optional)"
                  rows={3}
                />
              </div>
            </>
          )}

          {showRecoveryAmount && (
            <div>
              <Label htmlFor="recoveryAmount">Recovery Amount (Optional)</Label>
              <Input
                id="recoveryAmount"
                type="number"
                value={recoveryAmount}
                onChange={(e) => setRecoveryAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter recovery amount"
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedStatus}>
            {isReturnDialog ? 'Return Asset' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};