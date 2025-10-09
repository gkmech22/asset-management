import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PendingRequest {
  id: string;
  request_type: "assign" | "return";
  asset_id: string;
  requested_by: string;
  requested_at: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  assign_to?: string;
  employee_id?: string;
  employee_email?: string;
  return_remarks?: string;
  return_location?: string;
  return_status?: string;
  asset_condition?: string;
  received_by?: string;
  configuration?: string;
  approved_by?: string;
  approved_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  assets?: {
    asset_id: string;
    name: string;
    type: string;
    brand: string;
    serial_number: string;
    configuration?: string;
    location: string;
    status: string;
    assigned_to?: string;
    employee_id?: string;
  };
}

const locations = [
  "Mumbai Office",
  "Hyderabad WH",
  "Ghaziabad WH",
  "Bhiwandi WH",
  "Patiala WH",
  "Bangalore Office",
  "Kolkata WH",
  "Trichy WH",
  "Gurugram Office",
  "Indore WH",
  "Bangalore WH",
  "Jaipur WH"
];

const allStatuses = ["Available", "Scrap/Damage", "Sale", "Lost", "Emp Damage", "Courier Damage"];

export const PendingRequests = ({ onRefresh }) => {
  const { user } = useAuth() || { user: null };
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  
  const [editedAssignTo, setEditedAssignTo] = useState("");
  const [editedEmployeeId, setEditedEmployeeId] = useState("");
  const [editedReturnLocation, setEditedReturnLocation] = useState("");
  const [editedReturnStatus, setEditedReturnStatus] = useState("");
  const [editedAssetCondition, setEditedAssetCondition] = useState("");
  const [editedRemarks, setEditedRemarks] = useState("");
  const [editedConfiguration, setEditedConfiguration] = useState("");
  const [approverComments, setApproverComments] = useState("");

  useEffect(() => {
    fetchUserRole();
    fetchRequests();
  }, [user]);

  const fetchUserRole = async () => {
    if (!user?.email) return;
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();
    setUserRole(data?.role || null);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_requests')
        .select(`
          *,
          assets (
            asset_id,
            name,
            type,
            brand,
            serial_number,
            configuration,
            location,
            status,
            assigned_to,
            employee_id
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as PendingRequest[]);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setEditMode(false);
    setEditedAssignTo(request.assign_to || "");
    setEditedEmployeeId(request.employee_id || "");
    setEditedReturnLocation(request.return_location || "");
    setEditedReturnStatus(request.return_status || "");
    setEditedAssetCondition(request.asset_condition || "");
    setEditedRemarks(request.return_remarks || "");
    setEditedConfiguration(request.configuration || "");
    setApproverComments("");
    setShowDetailsDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user?.email) return;

    if (selectedRequest.status !== 'pending') {
      toast.error('Request already processed');
      return;
    }
    
    const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';
    if (!isAdmin) {
      toast.error('Only Super Admin and Admin can approve requests');
      return;
    }

    try {
      if (selectedRequest.request_type === 'assign') {
        await supabase
          .from('assets')
          .update({
            assigned_to: editMode ? editedAssignTo : selectedRequest.assign_to,
            employee_id: editMode ? editedEmployeeId : selectedRequest.employee_id,
            status: 'Assigned',
            assigned_date: new Date().toISOString(),
            updated_by: user.email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedRequest.asset_id);
      } else {
        await supabase
          .from('assets')
          .update({
            status: editMode ? editedReturnStatus : selectedRequest.return_status || 'Available',
            assigned_to: null,
            employee_id: null,
            assigned_date: null,
            return_date: new Date().toISOString(),
            received_by: selectedRequest.received_by || user.email,
            location: editMode ? editedReturnLocation : selectedRequest.return_location,
            asset_condition: editMode ? editedAssetCondition : selectedRequest.asset_condition,
            remarks: editMode ? editedRemarks : selectedRequest.return_remarks,
            configuration: editMode ? editedConfiguration : selectedRequest.configuration,
            updated_by: user.email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedRequest.asset_id);
      }

      const { error: requestError } = await supabase
        .from('pending_requests')
        .update({
          status: 'approved',
          approved_by: user.email,
          approved_at: new Date().toISOString(),
          approver_comments: approverComments || null,
        })
        .eq('id', selectedRequest.id);

      if (requestError) throw requestError;

      toast.success('Request approved successfully');
      setShowDetailsDialog(false);
      fetchRequests();
      onRefresh?.();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request: ' + (error.message || 'Unknown error'));
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user?.email) return;

    if (selectedRequest.status !== 'pending') {
      toast.error('Request already processed');
      return;
    }
    
    const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';
    if (!isAdmin) {
      toast.error('Only Super Admin and Admin can reject requests');
      return;
    }

    try {
      const { error: requestError } = await supabase
        .from('pending_requests')
        .update({
          status: 'rejected',
          approved_by: user.email,
          approved_at: new Date().toISOString(),
          approver_comments: approverComments || null,
        })
        .eq('id', selectedRequest.id);

      if (requestError) throw requestError;

      toast.success('Request rejected');
      setShowDetailsDialog(false);
      fetchRequests();
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleCancel = async (request) => {
    if (!user?.email) return;

    if (request.status !== 'pending') {
      toast.error('Cannot cancel processed request');
      return;
    }
    
    if (request.requested_by !== user.email) {
      toast.error('You can only cancel your own requests');
      return;
    }

    try {
      await supabase
        .from('pending_requests')
        .update({
          status: 'cancelled',
          cancelled_by: user.email,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      toast.success('Request cancelled');
      fetchRequests();
      onRefresh?.();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    }
  };

  const openCommentInNewTab = (comment) => {
    if (comment) {
      const commentWindow = window.open("", "_blank");
      if (commentWindow) {
        commentWindow.document.write(`
          <html>
            <head>
              <title>Comment Details</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                p { font-size: 16px; }
              </style>
            </head>
            <body>
              <h1>Approver Comment</h1>
              <p>${comment.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </body>
          </html>
        `);
        commentWindow.document.close();
      } else {
        toast.error("Popup blocked. Please allow popups to view comments.");
      }
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return null;
  }

  const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';

  const filteredRequests = requests
    .filter((request) => filterStatus === 'all' || request.status === filterStatus)
    .filter((request) => {
      const asset = request.assets;
      const searchLower = searchTerm.toLowerCase();
      return (
        request.assets?.asset_id.toLowerCase().includes(searchLower) ||
        (asset?.name || '').toLowerCase().includes(searchLower) ||
        (asset?.type || '').toLowerCase().includes(searchLower) ||
        (asset?.brand || '').toLowerCase().includes(searchLower) ||
        (asset?.serial_number || '').toLowerCase().includes(searchLower) ||
        (request.requested_by || '').toLowerCase().includes(searchLower) ||
        (request.assign_to || '').toLowerCase().includes(searchLower) ||
        (request.employee_id || '').toLowerCase().includes(searchLower) ||
        (asset?.assigned_to || '').toLowerCase().includes(searchLower) ||
        (asset?.employee_id || '').toLowerCase().includes(searchLower) ||
        (request.return_remarks || '').toLowerCase().includes(searchLower)
      );
    });

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Requests
            <Badge variant="secondary">{filteredRequests.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-32"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg" style={{ minHeight: '100px', maxHeight: '100px' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={request.request_type === 'assign' ? 'default' : 'secondary'}>
                      {request.request_type.toUpperCase()}
                    </Badge>
                    <span className="font-medium text-sm">{request.assets?.asset_id}</span>
                    <span className="text-sm text-muted-foreground">{request.assets?.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Requested by: {request.requested_by} • {new Date(request.requested_at).toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-blue-600 mt-1">
                    {request.request_type === 'assign' ? (
                      <>Assign to: {request.assign_to} ({request.employee_id})</>
                    ) : (
                      <>Returning from: {request.assets?.assigned_to} ({request.assets?.employee_id})</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {request.approver_comments && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openCommentInNewTab(request.approver_comments)}
                      className="ml-2"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Comment
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleViewDetails(request)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Badge variant={
                    request.status === 'approved' ? 'success' :
                    request.status === 'rejected' ? 'destructive' :
                    request.status === 'pending' ? 'secondary' :
                    request.status === 'cancelled' ? 'outline' : 'secondary'
                  }>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                  {request.status === 'pending' && request.requested_by === user?.email && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(request)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Request Details - {selectedRequest?.request_type === 'assign' ? 'Assignment' : 'Return'}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Asset ID</Label>
                  <div className="text-sm font-medium">{selectedRequest.assets?.asset_id}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Asset Name</Label>
                  <div className="text-sm">{selectedRequest.assets?.name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="text-sm">{selectedRequest.assets?.type}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Brand</Label>
                  <div className="text-sm">{selectedRequest.assets?.brand}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Serial Number</Label>
                  <div className="text-sm">{selectedRequest.assets?.serial_number}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Current Status</Label>
                  <div className="text-sm">{selectedRequest.assets?.status}</div>
                </div>
              </div>

              {selectedRequest.request_type === 'assign' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Assign To</Label>
                    {editMode && isAdmin ? (
                      <Input value={editedAssignTo} onChange={(e) => setEditedAssignTo(e.target.value)} />
                    ) : (
                      <div className="text-sm font-medium">{selectedRequest.assign_to}</div>
                    )}
                  </div>
                  <div>
                    <Label>Employee ID</Label>
                    {editMode && isAdmin ? (
                      <Input value={editedEmployeeId} onChange={(e) => setEditedEmployeeId(e.target.value)} />
                    ) : (
                      <div className="text-sm font-medium">{selectedRequest.employee_id}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.request_type === 'return' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Return Location</Label>
                    {editMode && isAdmin ? (
                      <Select value={editedReturnLocation} onValueChange={setEditedReturnLocation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{selectedRequest.return_location}</div>
                    )}
                  </div>
                  <div>
                    <Label>Return Status</Label>
                    {editMode && isAdmin ? (
                      <Select value={editedReturnStatus} onValueChange={setEditedReturnStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{selectedRequest.return_status || 'Available'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Asset Condition</Label>
                    {editMode && isAdmin ? (
                      <Input value={editedAssetCondition} onChange={(e) => setEditedAssetCondition(e.target.value)} />
                    ) : (
                      <div className="text-sm">{selectedRequest.asset_condition || 'N/A'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Employee ID</Label>
                    {editMode && isAdmin ? (
                      <Input value={editedEmployeeId} onChange={(e) => setEditedEmployeeId(e.target.value)} />
                    ) : (
                      <div className="text-sm">{selectedRequest.assets?.employee_id || 'N/A'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Configuration</Label>
                    {editMode && isAdmin ? (
                      <Input value={editedConfiguration} onChange={(e) => setEditedConfiguration(e.target.value)} />
                    ) : (
                      <div className="text-sm">{selectedRequest.configuration || 'N/A'}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label>Remarks</Label>
                    {editMode && isAdmin ? (
                      <Textarea value={editedRemarks} onChange={(e) => setEditedRemarks(e.target.value)} />
                    ) : (
                      <div className="text-sm">{selectedRequest.return_remarks || 'N/A'}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Requested By</Label>
                  <div className="text-sm">{selectedRequest.requested_by}</div>
                  <Label className="text-xs text-muted-foreground mt-2">Requested At</Label>
                  <div className="text-sm">{new Date(selectedRequest.requested_at).toLocaleString()}</div>
                </div>

                {selectedRequest.status !== 'pending' && (
                  <>
                    {selectedRequest.status === 'cancelled' && selectedRequest.cancelled_at && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Cancelled By</Label>
                        <div className="text-sm">{selectedRequest.cancelled_by}</div>
                        <Label className="text-xs text-muted-foreground mt-2">Cancelled At</Label>
                        <div className="text-sm">{new Date(selectedRequest.cancelled_at).toLocaleString()}</div>
                      </div>
                    )}
                    {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && selectedRequest.approved_at && (
                      <div>
                        <Label className="text-xs text-muted-foreground">{selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} By</Label>
                        <div className="text-sm">{selectedRequest.approved_by}</div>
                        <Label className="text-xs text-muted-foreground mt-2">{selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} At</Label>
                        <div className="text-sm">{new Date(selectedRequest.approved_at).toLocaleString()}</div>
                        {selectedRequest.approver_comments && (
                          <>
                            <Label className="text-xs text-muted-foreground mt-2">Approver Comments</Label>
                            <div className="text-sm">{selectedRequest.approver_comments}</div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {isAdmin && selectedRequest.status === 'pending' && (
                <div className="pt-4 border-t space-y-4">
                  <div>
                    <Label>Approver Comments (Optional)</Label>
                    <Textarea value={approverComments} onChange={(e) => setApproverComments(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2">
                    {!editMode && (
                      <Button variant="outline" onClick={() => setEditMode(true)}>
                        Edit Before Approval
                      </Button>
                    )}
                    {editMode && (
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button variant="destructive" onClick={handleReject}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button onClick={handleApprove}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};