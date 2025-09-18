import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const SettingsSidebar = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};