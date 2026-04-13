import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Users } from "lucide-react";
import { dashboardApi, siteAssignmentApi } from "../api/Api";

function Dashboard() {
  const [openSite, setOpenSite] = useState(null);
  const [assignedSites, setAssignedSites] = useState([]);

  const fetchDashboard = async () => {
    const now = new Date();
    const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const date = utc8.toISOString().split("T")[0];

    try {
      const [dashboardRes, siteRes] = await Promise.all([
        dashboardApi.getAll({ date }),
        siteAssignmentApi.getAll(),
      ]);

      const attendanceList = dashboardRes.data.data || [];
      const assignments = siteRes.data.data || [];

      const siteMap = new Map();

      // ✅ STEP 1: CREATE SITES
      assignments.forEach((assignment) => {
        const site = assignment.site;
        if (!site || !site.site_id) return;

        if (!siteMap.has(site.site_id)) {
          siteMap.set(site.site_id, {
            id: site.site_id,
            name: site.site_name,
            employees: [],
            employeeMap: {},
            subcontractors: {
              quasi: {},
              fixed: {},
            },
          });
        }
      });

      const groupedSites = Array.from(siteMap.values());

      attendanceList.forEach((attendance) => {
        (attendance.activities || []).forEach((activity) => {
          const siteId = activity.site?.site_id;
          if (!siteId) return;

          const site = groupedSites.find((s) => s.id === siteId);
          if (!site) return;

          const emp = activity.employee;
          if (!emp) return;

          const empId = emp.id;

          if (!site.employeeMap[empId]) {
            site.employeeMap[empId] = {
              id: emp.id,
              name: emp.name,
              status: emp.status,
              activities: [],
            };
          }

          site.employeeMap[empId].activities.push(activity);
        });

        (attendance.attendance_subcontractor || []).forEach((sub) => {
          const siteId = sub.site?.site_id;
          if (!siteId) return;

          const site = groupedSites.find((s) => s.id === siteId);
          if (!site) return;

          const company = sub.subcontractor?.company_name || "Unknown";
          const empId = sub.employee_id;

          if (!empId) return;

          const employeeExists = Object.values(site.employeeMap).some(
            (e) => e.id === empId
          );

          if (!employeeExists) return;

          if (sub.contract_type === "QUASI_DELEGATION") {
            if (!site.subcontractors.quasi[company]) {
              site.subcontractors.quasi[company] = new Set();
            }
            site.subcontractors.quasi[company].add(empId);
          } else if (sub.contract_type === "FIXED_PRICE") {
            if (!site.subcontractors.fixed[company]) {
              site.subcontractors.fixed[company] = new Set();
            }
            site.subcontractors.fixed[company].add(empId);
          }
        });
      });

      groupedSites.forEach((site) => {
        let siteHasActive = false;

        site.employees = Object.values(site.employeeMap).map((emp) => {
          const sorted = [...emp.activities].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );

          const latest = sorted[0];
          let segmentLabel = "COMPLETED";

          if (latest) {
            const now = new Date().getTime();
            const end = latest.end_time
              ? new Date(latest.end_time).getTime()
              : null;

            const isActive = !latest.end_time || now <= end;

            if (isActive) {
              segmentLabel = latest.segment_type;
              siteHasActive = true;
            }
          }

          return {
            id: emp.id,
            name: emp.name,
            status: emp.status,
            segment: segmentLabel,
          };
        });

        site.subcontractors.quasi = Object.entries(site.subcontractors.quasi).map(
          ([company_name, workers]) => ({
            company_name,
            count: workers.size,
          })
        );

        site.subcontractors.fixed = Object.entries(site.subcontractors.fixed).map(
          ([company_name, workers]) => ({
            company_name,
            count: workers.size,
          })
        );

        if (site.employees.length === 0) {
          site.status = "Not Started";
          site.statusStyle = "bg-gray-400 text-white";
        } else {
          site.status = siteHasActive ? "In Progress" : "Completed";
          site.statusStyle = siteHasActive
            ? "bg-yellow-500 text-white"
            : "bg-green-500 text-white";
        }

        delete site.employeeMap;
      });

      setAssignedSites(groupedSites);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    
    const interval = setInterval(() => {
      fetchDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleSite = (siteId) => {
    setOpenSite(openSite === siteId ? null : siteId);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Dashboard</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Last Updated */}
        <div className="text-sm text-gray-500 flex items-center gap-2">
          ⏱ Last updated:{" "}
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {/* Sites */}
        {assignedSites.map((site) => (
          <div
            key={site.id}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Header */}
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

            {/* Content */}
            {openSite === site.id && (
              <div className="border-t px-4 py-4 space-y-4">
                {/* EMPLOYEES */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">EMPLOYEES</p>

                  {site.employees.length > 0 ? (
                    <div className="space-y-2">
                      {site.employees.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>{emp.name}</span>

                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              emp.segment === "TRAVEL"
                                ? "bg-green-600 text-white"
                                : emp.segment === "SITE"
                                ? "bg-blue-600 text-white"
                                : emp.segment === "OFFICE"
                                ? "bg-yellow-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {emp.segment}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>No employee data yet</span>
                      <span className="text-gray-400">0 ppl</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">QUASI DELEGATION</p>

                  {site.subcontractors.quasi.length > 0 ? (
                    site.subcontractors.quasi.map((sub, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{sub.company_name}</span>
                        <span>{sub.count} ppl</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>No subcontractor yet</span>
                      <span className="text-gray-400">0 ppl</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">FIXED PRICE</p>

                  {site.subcontractors.fixed.length > 0 ? (
                    site.subcontractors.fixed.map((sub, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{sub.company_name}</span>
                        <span>{sub.count} ppl</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>No subcontractor yet</span>
                      <span className="text-gray-400">0 ppl</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {!assignedSites.length && (
          <div className="text-center text-sm text-gray-500 py-10">
            No assigned sites found
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;