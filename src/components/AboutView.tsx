import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutView = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <img src="/creator.png" alt="LEAD GROUP Logo" className="h-24 w-auto mx-auto mb-10" onError={() => console.error("Logo image failed to load")} />
          <p className="text-gray-500">
            Thank you for using the Asset Management System. This application is designed to streamline the management of IT infrastructure assets, ensuring efficient tracking, allocation, and maintenance.
          </p>
          <p className="text-gray-500 mt-4">
            Crafted by 🤓 IT Infra minds, for IT Infra needs.
          </p>
          <p className="text-gray-500 mt-4">
            For any queries please reach out to Mr. Karthik G / Mohan Prasad at <a href="mailto:karthik.g@leadschool.in">karthik.g@leadschool.in</a> / <a href="mailto:mohan.prasad@leadschool.in">mohan.prasad@leadschool.in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutView;