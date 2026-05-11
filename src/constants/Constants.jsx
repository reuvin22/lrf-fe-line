import { MapPin } from "lucide-react";

const CONSTANTS = {
  SubContractors: [
    {
      subcontractor_id: 1,
      company_name: "ABC Construction",
      contact_person: "John Doe",
      contact_phone: "09171234567",
      status: "active",
      created_at: "2026-03-28T10:00:00Z",
      updated_at: "2026-03-28T10:00:00Z",
    },
    {
      subcontractor_id: 2,
      company_name: "XYZ Engineering",
      contact_person: "Jane Smith",
      contact_phone: "09179876543",
      status: "terminated",
      created_at: "2026-03-27T09:30:00Z",
      updated_at: "2026-03-27T15:45:00Z",
    },
    {
      subcontractor_id: 3,
      company_name: "Delta Builders",
      contact_person: "Alice Johnson",
      contact_phone: "09221234567",
      status: "active",
      created_at: "2026-03-26T08:15:00Z",
      updated_at: "2026-03-26T12:00:00Z",
    },
  ],

  SITE_OPTIONS: [
    { id: 1, name: "Site A - Shinjuku Tower", icon: MapPin },
    { id: 2, name: "Site B - Shibuya Office", icon: MapPin },
    { id: 3, name: "Site C - Roppongi Hills", icon: MapPin },
  ],
};

export default CONSTANTS;