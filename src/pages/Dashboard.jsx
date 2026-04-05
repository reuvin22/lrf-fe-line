import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Users } from "lucide-react";
import { attendanceApi, siteAssignmentApi } from "../api/Api";

function Dashboard() {
  const [openSite, setOpenSite] = useState(null);
  const [assignedSites, setAssignedSites] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const toggleSite = (siteId) => {
    setOpenSite(openSite === siteId ? null : siteId);
  };

  const fetchAssignedSites = async () => {
    try {
      const [siteRes, attendanceRes] = await Promise.all([
        siteAssignmentApi.getAll(),
        attendanceApi.getAll(),
      ]);

      const assignments = siteRes.data.data || [];
      const attendanceList = attendanceRes.data.data || [];

      const groupedSites = assignments.reduce((acc, assignment) => {
        const siteId = assignment.site?.site_id;
        const siteName = assignment.site?.site_name;
        if (!siteId || !siteName) return acc;

        let existingSite = acc.find((s) => s.id === siteId);

        const siteSegments = attendanceList
          .flatMap((a) => a.segments || [])
          .filter((seg) => Number(seg.site_id) === Number(siteId));

        let status = "Not Started";
        let statusStyle = "bg-gray-400 text-white";

        if (siteSegments.some((s) => s.start_time && !s.end_time)) {
          status = "In Progress";
          statusStyle = "bg-yellow-500 text-white";
        } else if (
          siteSegments.length > 0 &&
          siteSegments.every((s) => s.start_time && s.end_time)
        ) {
          status = "Completed";
          statusStyle = "bg-green-500 text-white";
        }

        const employeeSegments = attendanceList
          .filter((a) => a.employee_id === assignment.employee?.id)
          .flatMap((a) => a.segments || []);

        const matchedSegment = employeeSegments.find(
          (seg) => Number(seg.site_id) === Number(siteId) && !seg.end_time
        );

        const employees = matchedSegment
          ? [
              {
                id: assignment.employee?.id,
                name: assignment.employee?.name,
                segment: matchedSegment.segment_type,
                contract_type: assignment.site.contract_type,
                client_name: assignment.site.client_name,
              },
            ]
          : [];

        if (!existingSite) {
          acc.push({
            id: siteId,
            name: siteName,
            status,
            statusStyle,
            employees: employees,
            subcontractors: { quasi: [], fixed: [] },
          });
          existingSite = acc.find((s) => s.id === siteId);
        } else {
          existingSite.employees.push(...employees);
          existingSite.status = status;
          existingSite.statusStyle = statusStyle;
        }

        ["quasi", "fixed"].forEach((typeKey) => {
          const subs = existingSite.employees
            .filter(
              (emp) =>
                emp.contract_type ===
                (typeKey === "quasi" ? "QUASI_DELEGATION" : "FIXED_PRICE")
            )
            .reduce((accSub, emp) => {
              const sub = accSub.find((s) => s.company_name === emp.client_name);
              if (sub) sub.count += 1;
              else accSub.push({ company_name: emp.client_name, count: 1 });
              return accSub;
            }, []);

          existingSite.subcontractors[typeKey] = subs.length > 0 ? subs : [];
        });

        return acc;
      }, []);

      setAssignedSites(groupedSites);
      if (groupedSites.length && !openSite) setOpenSite(groupedSites[0].id);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching assigned sites:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const pollData = async () => {
      if (!isMounted) return;
      await fetchAssignedSites();
      if (isMounted) setTimeout(pollData, 5000);
    };

    pollData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Dashboard</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-sm text-gray-500 flex items-center gap-2">
          ⏱ Last updated:{" "}
          {lastUpdated
            ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Loading..."}
        </div>

        {assignedSites.map((site) => (
          <div key={site.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => toggleSite(site.id)}
            >
              <div className="flex items-center gap-2">
                {openSite === site.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <MapPin size={16} className="text-green-600" />
                <span className="font-semibold">{site.name}</span>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${site.statusStyle}`}>
                {site.status}
              </span>
            </div>

            {openSite === site.id && (
              <div className="border-t px-4 py-4 space-y-4">
                {/* Employees */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">EMPLOYEES</p>
                  {site.employees.length > 0 ? (
                    <div className="space-y-2">
                      {site.employees.map((emp) => (
                        <div key={emp.id} className="flex justify-between text-sm">
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

                {/* QUASI DELEGATION */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">QUASI DELEGATION</p>
                  {site.subcontractors?.quasi.length > 0 ? (
                    site.subcontractors.quasi.map((sub, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>{sub.company_name}</span>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users size={14} />
                          <span>{sub.count} ppl</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>No subcontractor yet</span>
                      <span className="text-gray-400">0 ppl</span>
                    </div>
                  )}
                </div>

                {/* FIXED PRICE */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">FIXED PRICE</p>
                  {site.subcontractors?.fixed.length > 0 ? (
                    site.subcontractors.fixed.map((sub, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>{sub.company_name}</span>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users size={14} />
                          <span>{sub.count} ppl</span>
                        </div>
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