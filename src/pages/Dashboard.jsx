import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Users } from "lucide-react";
import { dashboardApi, employeeApi, siteAssignmentApi } from "../api/Api";

function Dashboard() {
  const [openSite, setOpenSite] = useState(null);
  const [assignedSites, setAssignedSites] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isFetchingRef = useRef(false);

  const fetchDashboard = async () => {
    // Skip this tick if the previous fetch hasn't finished yet
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const now = new Date();
    const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const date = utc8.toISOString().split("T")[0];

    try {
      const [dashboardRes, siteRes, employeeRes] = await Promise.all([
        dashboardApi.getAll({ date }),
        siteAssignmentApi.getAll(),
        employeeApi.getAll(),
      ]);

      const attendanceList = dashboardRes.data.data || [];

      console.log("[Dashboard] dashboardApi raw response:", dashboardRes.data);
      console.log("[Dashboard] attendanceList:", attendanceList);

      const siteInner = siteRes.data?.data;
      const assignments = Array.isArray(siteInner)
        ? siteInner
        : Array.isArray(siteInner?.data)
          ? siteInner.data
          : [];

      const empInner = employeeRes.data?.data;
      const employeeList = Array.isArray(empInner)
        ? empInner
        : Array.isArray(empInner?.data)
          ? empInner.data
          : [];

      const employeeById = new Map();
      employeeList.forEach((emp) => {
        if (emp.employee_id != null) employeeById.set(String(emp.employee_id), emp);
        if (emp.id != null) employeeById.set(String(emp.id), emp);
      });

      console.log("[Dashboard] assignments sample:", assignments.slice(0, 2));
      console.log("[Dashboard] attendanceList sample:", attendanceList.slice(0, 2));
      console.log("[Dashboard] employees loaded:", employeeList.length);

      const siteMap = new Map();

      assignments.forEach((assignment) => {
        const site = assignment.site ?? assignment;
        if (!site || !site.site_id) return;

        if (!siteMap.has(site.site_id)) {
          siteMap.set(site.site_id, {
            id: site.site_id,
            name: site.site_name,
            contract_type: site.contract_type ?? null,
            employees: [],
            employeeMap: {},
          });
        }
      });

      const ensureSite = (siteId, siteName, contractType) => {
        if (!siteId) return null;
        if (!siteMap.has(siteId)) {
          siteMap.set(siteId, {
            id: siteId,
            name: siteName || `Site ${siteId}`,
            contract_type: contractType ?? null,
            employees: [],
            employeeMap: {},
          });
        }
        return siteMap.get(siteId);
      };

      attendanceList.forEach((attendance) => {
        (attendance.segments || []).forEach((seg) => {
          ensureSite(
            seg.site?.site_id ?? seg.site_id,
            seg.site?.site_name ?? seg.site_name,
            seg.site?.contract_type ?? null
          );
        });
        (attendance.attendance_subcontractor_segments || []).forEach((sub) => {
          ensureSite(
            sub.site?.site_id ?? sub.site_id,
            sub.site?.site_name ?? sub.site_name,
            sub.site?.contract_type ?? null
          );
        });
      });

      const groupedSites = Array.from(siteMap.values());
      console.log("[Dashboard] groupedSites:", groupedSites);

      attendanceList.forEach((attendance) => {
        const emp = attendance.employee;
        if (!emp) return;

        const resolvedId = emp.employee_id ?? emp.id ?? attendance.employee_id;
        if (!resolvedId) return;

        const ensureEmployeeOnSite = (site) => {
          if (!site.employeeMap[resolvedId]) {
            site.employeeMap[resolvedId] = {
              id: resolvedId,
              name: emp.name,
              status: emp.status,
              activities: [],
              contract_type: null,
            };
          }
          return site.employeeMap[resolvedId];
        };

        (attendance.segments || []).forEach((segment) => {
          const siteId = segment.site?.site_id ?? segment.site_id;
          const site = ensureSite(siteId, segment.site?.site_name ?? segment.site_name);
          if (!site) return;

          ensureEmployeeOnSite(site).activities.push(segment);
        });

        (attendance.attendance_subcontractor_segments || []).forEach((sub) => {
          const siteId = sub.site?.site_id ?? sub.site_id;
          const site = ensureSite(siteId, sub.site?.site_name ?? sub.site_name, sub.site?.contract_type ?? null);
          if (!site) return;
          ensureEmployeeOnSite(site).activities.push(sub);
        });
      });

      groupedSites.forEach((site) => {
        let siteHasActive = false;

        const buildRecord = (emp) => {
          const nowMs = new Date().getTime();
          const hasActivities = emp.activities.length > 0;
          const hasActive = emp.activities.some((act) => {
            const start = act.start_time ? new Date(act.start_time).getTime() : null;
            const end = act.end_time ? new Date(act.end_time).getTime() : null;
            return start !== null && start <= nowMs && (end === null || nowMs < end);
          });
          const allEnded = hasActivities && emp.activities.every((act) => {
            const end = act.end_time ? new Date(act.end_time).getTime() : null;
            return end !== null && end <= nowMs;
          });

          let segment;
          if (!hasActivities) segment = "Not Started";
          else if (hasActive) { segment = "In Progress"; siteHasActive = true; }
          else if (allEnded) segment = "Completed";
          else segment = "Not Started";

          return { id: emp.id, name: emp.name, status: emp.status, segment };
        };

        const quasiEmployees = [];
        const fixedEmployees = [];
        site.employees = [];

        Object.values(site.employeeMap).forEach((emp) => {
          const record = buildRecord(emp);
          if (site.contract_type === "QUASI_DELEGATION") {
            quasiEmployees.push(record);
          } else if (site.contract_type === "FIXED_PRICE") {
            fixedEmployees.push(record);
          } else {
            site.employees.push(record);
          }
        });

        site.subcontractors = {
          quasi: quasiEmployees,
          fixed: fixedEmployees,
        };

        const totalWorkers = site.employees.length + quasiEmployees.length + fixedEmployees.length;

        if (totalWorkers === 0) {
          site.status = "Not Started";
          site.statusStyle = "bg-gray-400 text-white";
        } else {
          site.status = siteHasActive ? "In Progress" : "Completed";
          site.statusStyle = siteHasActive ? "bg-yellow-500 text-white" : "bg-green-500 text-white";
        }

        site.totalWorkers = totalWorkers;
        delete site.employeeMap;
      });

      setAssignedSites(groupedSites);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // fetchDashboard is async — setState calls happen after awaits, not synchronously
    // eslint-disable-next-line
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
          {lastUpdated
            ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—"}
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

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={13} />
                  {site.totalWorkers} ppl
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${site.statusStyle}`}
                >
                  {site.status}
                </span>
              </div>
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
                              emp.segment === "In Progress"
                                ? "bg-yellow-500 text-white"
                                : emp.segment === "Completed"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-400 text-white"
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
                  <p className="text-xs text-gray-500 mb-2">
                    QUASI DELEGATION
                    {site.subcontractors.quasi.length > 0 && (
                      <span className="ml-1 text-gray-400">({site.subcontractors.quasi.length} ppl)</span>
                    )}
                  </p>

                  {site.subcontractors.quasi.length > 0 ? (
                    <div className="space-y-2">
                      {site.subcontractors.quasi.map((emp) => (
                        <div key={emp.id} className="flex justify-between items-center text-sm">
                          <span>{emp.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            emp.segment === "In Progress" ? "bg-yellow-500 text-white"
                            : emp.segment === "Completed" ? "bg-green-500 text-white"
                            : "bg-gray-400 text-white"
                          }`}>{emp.segment}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>No quasi delegation yet</span>
                      <span className="text-gray-400">0 ppl</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    FIXED PRICE
                    {site.subcontractors.fixed.length > 0 && (
                      <span className="ml-1 text-gray-400">({site.subcontractors.fixed.length} ppl)</span>
                    )}
                  </p>

                  {site.subcontractors.fixed.length > 0 ? (
                    <div className="space-y-2">
                      {site.subcontractors.fixed.map((emp) => (
                        <div key={emp.id} className="flex justify-between items-center text-sm">
                          <span>{emp.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            emp.segment === "In Progress" ? "bg-yellow-500 text-white"
                            : emp.segment === "Completed" ? "bg-green-500 text-white"
                            : "bg-gray-400 text-white"
                          }`}>{emp.segment}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>No fixed price yet</span>
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