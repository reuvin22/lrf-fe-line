import React from 'react';
import { Clock, MapPin, Calculator, Users, Car, FileText, Upload, Lock } from 'lucide-react';

function Manual() {
  const sections = [
    {
      icon: Clock,
      title: "How to Enter",
      description: `Use the "Today" screen to start/end segments in real-time, or add segments manually with specific start and end times.`
    },
    {
      icon: MapPin,
      title: "Segment Types",
      description: `Travel: Moving between locations. Site: On-site work (select assigned site). Office Work: Administrative tasks at the office.`
    },
    {
      icon: Calculator,
      title: "Overtime Calculation",
      description: `Hours exceeding 8h are calculated at 1.25× multiplier. Break time is automatically deducted based on total hours worked.`
    },
    {
      icon: Users,
      title: "Man-day Accounting",
      description: `If a Site segment is present for the day, it counts as 1 man-day for that site.`
    },
    {
      icon: Car,
      title: "Transportation Expenses",
      description: `Commuter pass expenses do NOT need to be entered. Only enter ad-hoc train/bus transportation costs incurred that day.`
    },
    {
      icon: FileText,
      title: "Subcontractor Reporting",
      description: `Only for site leaders. Report individually for both quasi-consignment and contract work. Same time can be set using "Bulk Setting".`
    },
    {
      icon: Upload,
      title: "OCR Upload",
      description: `Capture receipts and invoices. Select the correct category and site. Amounts are read automatically using OCR.`
    },
    {
      icon: Lock,
      title: "Closing Date",
      description: `Data for the current month can be edited until the 10th of the following month. Afterwards it is locked and view-only.`
    },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Manual</span>
      </div>
      <div className="p-4 space-y-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-2xl shadow-sm flex items-start gap-4"
          >
            <div className="bg-green-100 p-3 rounded-xl">
              <section.icon className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">
                {section.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {section.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Manual;