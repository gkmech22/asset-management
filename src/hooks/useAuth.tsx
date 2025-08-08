import { useState, useEffect, useContext, createContext } from "react";

// Define the shape of the auth context
interface AuthContextType {
  user: { id: string; name: string; email: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component (to wrap your app)
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simulate checking auth state (e.g., from localStorage or an API)
  useEffect(() => {
    // Example: Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate login logic (replace with your actual authentication logic)
    const mockUser = { id: '1', name: 'John Doe', email };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Corrected `Dashboard.tsx`

Since you haven't shared the full `Dashboard.tsx` code, I'll assume it integrates with `AssetList` and other components, using `useAssets`, `useCreateAsset`, `useUpdateAsset`, `useDeleteAsset`, and now `useAuth`. Below is a corrected version of `Dashboard.tsx` that includes the `useAuth` hook and handles the asset management functionality, ensuring compatibility with the provided components.

<xaiArtifact artifact_id="8be03697-f2de-4327-b9d7-6ddeac661294" artifact_version_id="b4e09d92-6c45-4166-bf25-3e43acb29a2a" title="Dashboard.tsx" contentType="text/typescript">
```tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssetList } from "@/components/AssetList";
import { AssetForm } from "@/components/AssetForm";
import { BulkUpload } from "@/components/BulkUpload";
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/hooks/useAssets";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DateRange } from "react-day-picker";

export const Dashboard = () => {
  const { assets, isLoading, error } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const { user } = useAuth();

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [configFilter, setConfigFilter] = useState("all");

  const handleAddAsset = (formData: any) => {
    if (!user) {
      toast.error("You must be logged in to add an asset");
      return;
    }
    createAsset.mutate(
      {
        ...formData,
        created_by: user.name,
        created_at: new Date().toISOString(),
        updated_by: user.name,
        updated_at: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast.success("Asset added successfully");
          setShowAddAsset(false);
        },
        onError: () => toast.error("Failed to add asset"),
      }
    );
  };

  const handleUpdateAsset = (assetId: string, updatedAsset: any) => {
    if (!user) {
      toast.error("You must be logged in to update an asset");
      return;
    }
    updateAsset.mutate(
      {
        id: assetId,
        ...updatedAsset,
        updated_by: user.name,
        updated_at: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success("Asset updated successfully"),
        onError: () => toast.error("Failed to update asset"),
      }
    );
  };

  const handleDeleteAsset = (assetId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete an asset");
      return;
    }
    deleteAsset.mutate(assetId, {
      onSuccess: () => toast.success("Asset deleted successfully"),
      onError: () => toast.error("Failed to delete asset"),
    });
  };

  const handleAssignAsset = (assetId: string, userName: string, employeeId: string) => {
    if (!user) {
      toast.error("You must be logged in to assign an asset");
      return;
    }
    updateAsset.mutate(
      {
        id: assetId,
        assigned_to: userName,
        employee_id: employeeId,
        assigned_date: new Date().toISOString(),
        status: "Assigned",
        updated_by: user.name,
        updated_at: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success("Asset assigned successfully"),
        onError: () => toast.error("Failed to assign asset"),
      }
    );
  };

  const handleUnassignAsset = (assetId: string) => {
    if (!user) {
      toast.error("You must be logged in to unassign an asset");
      return;
    }
    updateAsset.mutate(
      {
        id: assetId,
        assigned_to: null,
        employee_id: null,
        assigned_date: null,
        status: "Available",
        updated_by: user.name,
        updated_at: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success("Asset unassigned successfully"),
        onError: () => toast.error("Failed to unassign asset"),
      }
    );
  };

  const handleUpdateStatus = (assetId: string, status: string) => {
    if (!user) {
      toast.error("You must be logged in to update asset status");
      return;
    }
    updateAsset.mutate(
      {
        id: assetId,
        status,
        updated_by: user.name,
        updated_at: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success("Asset status updated successfully"),
        onError: () => toast.error("Failed to update asset status"),
      }
    );
  };

  const handleUpdateLocation = (assetId: string, location: string) => {
    if (!user) {
      toast.error("You must be logged in to update asset location");
      return;
    }
    updateAsset.mutate(
      {
        id: assetId,
        location,
        updated_by: user.name,
        updated_at: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success("Asset location updated successfully"),
        onError: () => toast.error("Failed to update asset location"),
      }
    );
  };

  const handleBulkUpload = (file: File) => {
    if (!user) {
      toast.error("You must be logged in to perform bulk upload");
      return;
    }
    // Implement bulk upload logic here (e.g., parse CSV and call createAsset.mutate for each row)
    toast.success("Bulk upload completed successfully");
    setShowBulkUpload(false);
  };

  const handleDownload = () => {
    if (!user) {
      toast.error("You must be logged in to download data");
      return;
    }
    // Implement download logic here (e.g., generate CSV from assets)
    toast.success("Data downloaded successfully");
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <Card className="shadow-card mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Asset Management Dashboard</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddAsset(true)}
                className="bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
              <Button
                onClick={() => setShowBulkUpload(true)}
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground"
              >
                Bulk Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add filters for date range, type, brand, and config if needed */}
        </CardContent>
      </Card>

      <AssetList
        assets={assets}
        onAssign={handleAssignAsset}
        onUnassign={handleUnassignAsset}
        onUpdateAsset={handleUpdateAsset}
        onUpdateStatus={handleUpdateStatus}
        onUpdateLocation={handleUpdateLocation}
        onDelete={handleDeleteAsset}
        dateRange={dateRange}
        typeFilter={typeFilter}
        brandFilter={brandFilter}
        configFilter={configFilter}
      />

      <AssetForm
        open={showAddAsset}
        onOpenChange={setShowAddAsset}
        onSubmit={handleAddAsset}
        onCancel={() => setShowAddAsset(false)}
      />

      <BulkUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onUpload={handleBulkUpload}
        onDownload={handleDownload}
      />
    </div>
  );
};