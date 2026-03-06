import React from 'react';
import { Clock, MapPin, Calculator, Users, Car, FileText, Upload, Lock } from 'lucide-react';

function Manual() {
  const sections = [
    {
      icon: Clock,
      title: "Input Method",
      description: `Real-time recording: Tap "Start Segment" and select the type (Travel / Site / Office) to start the timer. You can also add past segments manually.`
    },
    {
      icon: MapPin,
      title: "Segment Types",
      description: `Travel: Moving between sites. Site: Work at construction sites (counted as 1 person). Office: Work in the office.`
    },
    {
      icon: Calculator,
      title: "Overtime Calculation",
      description: `Hours exceeding 8 are calculated at 1.25x. Break time is deducted from total hours according to conditions.`
    },
    {
      icon: Users,
      title: "Labor Calculation",
      description: `If there is a site segment on a given day, it counts as 1 labor unit. Used for billing and resource management.`
    },
    {
      icon: Car,
      title: "Transportation Expenses",
      description: `No need to input commuter pass costs. Only enter actual train or bus expenses incurred on the day.`
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
      description: `Data for the current month can be edited until the 10th of the following month. Afterwards, it is locked (🔒) and view-only.`
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-green-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText size={24} /> Manual
        </h1>
        <p className="text-sm mt-1">Input Methods and Rules</p>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-sm flex items-start gap-4">
            <section.icon className="text-green-600 mt-1" size={24} />
            <div>
              <h2 className="font-semibold text-gray-900">{section.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Manual;