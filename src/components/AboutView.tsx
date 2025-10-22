import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutView = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Thank you for using the Asset Management System. This application is designed to streamline the management of IT infrastructure assets, ensuring efficient tracking, allocation, and maintenance.
          </p>
          <p className="text-gray-500 mt-4">
            Crafted by 🤓 IT Infra minds, for IT Infra needs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutView;