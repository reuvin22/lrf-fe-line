import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Users } from "lucide-react";

function Dashboard() {
  const [openSite, setOpenSite] = useState("A");

  const toggleSite = (site) => {
    setOpenSite(openSite === site ? null : site);
  };

  const sites = [
    {
      id: "A",
      name: "Site A",
      status: "In Progress",
      statusStyle: "bg-green-600 text-white",
    },
    {
      id: "B",
      name: "Site B",
      status: "Completed",
      statusStyle: "bg-blue-500 text-white",
    },
    {
      id: "C",
      name: "Site C",
      status: "Not Started",
      statusStyle: "bg-gray-200 text-gray-600",
    },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">

      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Dashboard</span>
      </div>

      <div className="p-4 space-y-4">

        <div className="text-sm text-gray-500 flex items-center gap-2">
          ⏱ Last updated: 15:25
        </div>

        {sites.map((site) => (
          <div
            key={site.id}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => toggleSite(site.id)}
            >
              <div className="flex items-center gap-2">
                {openSite === site.id ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}

                <MapPin size={16} className="text-green-600" />
                <span className="font-semibold">{site.name}</span>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full ${site.statusStyle}`}
              >
                {site.status}
              </span>
            </div>

            {openSite === site.id && (
              <div className="border-t px-4 py-4 space-y-4">

                <div>
                  <p className="text-xs text-gray-500 mb-2">EMPLOYEES</p>

                  <div className="flex justify-between text-sm">
                    <span>Yamada</span>
                    <span className="text-gray-500">On-site</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Sato</span>
                    <span className="text-gray-500">Traveling</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">QUASI-DELEGATION</p>

                  <div className="flex justify-between items-center text-sm">
                    <span>○○ Electrical</span>

                    <div className="flex items-center gap-1 text-gray-500">
                      <Users size={14} />
                      <span>3 ppl</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">FIXED-PRICE</p>

                  <div className="flex justify-between items-center text-sm">
                    <span>△△ Construction</span>

                    <div className="flex items-center gap-1 text-gray-500">
                      <Users size={14} />
                      <span>2 ppl</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}

export default Dashboard;