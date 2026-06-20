import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Users } from "lucide-react";
import { dashboardApi, employeeApi, siteAssignmentApi, sitesApi, siteSubContractorApi, subContractorApi, subContractorWorkerApi } from "../api/Api";

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
      const [dashboardRes, siteAssignRes, employeeRes, siteRes, subContractorWorkers, subContractorRes, siteSubContractorRes] = await Promise.all([
        dashboardApi.getAll({ date }),
        siteAssignmentApi.getAll(),
        employeeApi.getAll(),
        sitesApi.getAll(),
        subContractorWorkerApi.getAll(),
        subContractorApi.getAll(),
        siteSubContractorApi.getAll()
      ]);
      const allSites = siteRes.data.data || [];
      const attendanceList = dashboardRes.data.data || [];
      const subContractorList = subContractorRes.data.data || [];
      const subContractorWorkerList = subContractorWorkers.data.data || [];

      const subContractorById = new Map();
      subContractorList.forEach((sub) => {
        const id = sub.subcontractor_id ?? sub.id;
        if (id != null) subContractorById.set(String(id), sub);
      });

      // Count workers per subcontractor
      const workerCountById = new Map();
      subContractorWorkerList.forEach((worker) => {
        const subId = String(
          worker.subcontractor_id ?? worker.sub_contractor_id ?? worker.subcontractor?.id ?? ""
        );
        if (!subId) return;
        workerCountById.set(subId, (workerCountById.get(subId) || 0) + 1);
      });

      // Shape: each subcontractor with its workers array
      const subContractorWithWorkers = subContractorList.map((sub) => {
        const subId = String(sub.subcontractor_id ?? sub.id);
        const workers = subContractorWorkerList.filter((worker) => {
          const workerId = String(
            worker.subcontractor_id ?? worker.sub_contractor_id ?? worker.subcontractor?.id ?? ""
          );
          return workerId === subId;
        });
        return {
          id: sub.subcontractor_id ?? sub.id,
          name: sub.company_name,
          workers,
        };
      });
      console.log("[Dashboard] subContractorWithWorkers:", subContractorWithWorkers);

      // Build site → subcontractor assignments map from siteSubContractor data
      const siteSubContractorList = siteSubContractorRes.data?.data || [];
      const siteSubContractorMap = new Map();
      siteSubContractorList.forEach((item) => {
        const siteId = item.site_id ?? item.site?.site_id;
        const subId = String(item.subcontractor_id ?? item.subcontractor?.id ?? "");
        const contractType = item.contract_type;
        const sub = subContractorById.get(subId);
        if (!siteId || !subId || !contractType) return;
        if (!siteSubContractorMap.has(siteId)) siteSubContractorMap.set(siteId, []);
        siteSubContractorMap.get(siteId).push({
          name: sub?.company_name ?? sub?.name ?? item.subcontractor?.company_name ?? item.subcontractor?.name ?? "Unknown",
          contract_type: contractType,
          count: workerCountById.get(subId) || 0,
        });
      });
      console.log("[Dashboard] siteSubContractorMap:", Object.fromEntries(siteSubContractorMap));

      console.log("[Dashboard] dashboardApi raw response:", dashboardRes.data);
      console.log("[Dashboard] attendanceList:", attendanceList);

      const siteInner = siteAssignRes.data?.data;
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

      assignments.forEach((assignment) => {
        const empId = String(
          assignment.employee_id ??
          assignment.employee?.employee_id ??
          assignment.employee?.id ??
          ""
        );
        if (!empId) return;
        const emp = employeeById.get(empId);
        if (!emp) return;
        const assignedSiteId = assignment.site_id ?? assignment.site?.site_id;
        const matchedSite = allSites.find(
          (s) => String(s.id ?? s.site_id) === String(assignedSiteId)
        );
        console.log(
          `[Dashboard] Employee: ${emp.name} → Site: ${matchedSite?.name ?? matchedSite?.site_name ?? "Unknown"} (site_id: ${assignedSiteId})`
        );
      });

      const siteMap = new Map();

      allSites.forEach((s) => {
        const siteId = s.site_id ?? s.id;
        const siteName = s.site_name ?? s.name;
        if (!siteId) return;
        siteMap.set(siteId, {
          id: siteId,
          name: siteName,
          contract_type: s.contract_type ?? null,
          employees: [],
          employeeMap: {},
        });
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

        const ensureEmployeeOnSite = (site, contractType = null, subcontractorName = null) => {
          if (!site.employeeMap[resolvedId]) {
            site.employeeMap[resolvedId] = {
              id: resolvedId,
              name: emp.name,
              status: emp.status,
              activities: [],
              contract_type: contractType,
              subcontractor_name: subcontractorName,
            };
          } else if (contractType && !site.employeeMap[resolvedId].contract_type) {
            site.employeeMap[resolvedId].contract_type = contractType;
            site.employeeMap[resolvedId].subcontractor_name = subcontractorName;
          }
          return site.employeeMap[resolvedId];
        };

        (attendance.segments || []).forEach((segment) => {
          const siteId = segment.site?.site_id ?? segment.site_id;
          const site = ensureSite(siteId, segment.site?.site_name ?? segment.site_name);
          if (!site) return;

          ensureEmployeeOnSite(site, null).activities.push(segment);
        });

        (attendance.attendance_subcontractor_segments || []).forEach((sub) => {
          const siteId = sub.site?.site_id ?? sub.site_id;
          const contractType = sub.site?.contract_type ?? sub.contract_type ?? null;
          const subId = sub.subcontractor_id ?? sub.subcontractor?.id ?? emp.subcontractor_id ?? emp.subcontractor?.id;
          const subName = sub.subcontractor?.name ?? sub.subcontractor_name
            ?? emp.subcontractor?.name ?? emp.subcontractor_name
            ?? (subId ? subContractorById.get(String(subId)) : null)
            ?? "Unknown";
          const site = ensureSite(siteId, sub.site?.site_name ?? sub.site_name, contractType);
          if (!site) return;
          ensureEmployeeOnSite(site, contractType, subName).activities.push(sub);
        });
      });

      groupedSites.forEach((site) => {
        let siteHasActive = false;
        console.log('THIS IS FUCKING SITE: ', site)
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

        site.employees = [];
        Object.values(site.employeeMap).forEach((emp) => {
          const record = buildRecord(emp);
          if (!emp.contract_type) site.employees.push(record);
        });

        const siteAssignments = siteSubContractorMap.get(site.id) || [];
        const quasiGroups = siteAssignments
          .filter((a) => a.contract_type === "QUASI_DELEGATION")
          .map((a) => ({ name: a.name, count: a.count }));
        const fixedGroups = siteAssignments
          .filter((a) => a.contract_type === "FIXED_PRICE")
          .map((a) => ({ name: a.name, count: a.count }));

        site.subcontractors = {
          quasi: quasiGroups,
          fixed: fixedGroups,
        };

        const totalQuasi = quasiGroups.reduce((sum, g) => sum + g.count, 0);
        const totalFixed = fixedGroups.reduce((sum, g) => sum + g.count, 0);
        const totalWorkers = site.employees.length + totalQuasi + totalFixed;

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
  <p className="text-xs text-gray-500 mb-2">
    EMPLOYEES
    {site?.employees?.length > 0 && (
      <span className="ml-1 text-gray-400">
        ({site.employees.length} ppl)
      </span>
    )}
  </p>

  {site?.employees?.length > 0 ? (
    <div className="space-y-2">
      {site.employees.map((emp) => {
        const status =
          emp.segment === "In Progress"
            ? "bg-yellow-500 text-white"
            : emp.segment === "Completed"
            ? "bg-green-500 text-white"
            : "bg-gray-400 text-white";

        return (
          <div
            key={emp.id}
            className="flex justify-between items-center text-sm"
          >
            <span className="font-medium">{emp.name || "Unknown"}</span>

            <span className={`text-xs px-2 py-1 rounded ${status}`}>
              {emp.segment || "Not Started"}
            </span>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">No employee assigned</span>
      <span className="text-gray-400">0 ppl</span>
    </div>
  )}
</div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    QUASI DELEGATION
                    {site.subcontractors.quasi.length > 0 && (
                      <span className="ml-1 text-gray-400">
                        ({site.subcontractors.quasi.reduce((sum, g) => sum + g.count, 0)} ppl)
                      </span>
                    )}
                  </p>

                  {site.subcontractors.quasi.length > 0 ? (
                    <div className="space-y-2">
                      {site.subcontractors.quasi.map((group) => (
                        <div key={group.name} className="flex justify-between items-center text-sm">
                          <span>{group.name}</span>
                          <span className="text-gray-500">{group.count} ppl</span>
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
                      <span className="ml-1 text-gray-400">
                        ({site.subcontractors.fixed.reduce((sum, g) => sum + g.count, 0)} ppl)
                      </span>
                    )}
                  </p>

                  {site.subcontractors.fixed.length > 0 ? (
                    <div className="space-y-2">
                      {site.subcontractors.fixed.map((group) => (
                        <div key={group.name} className="flex justify-between items-center text-sm">
                          <span>{group.name}</span>
                          <span className="text-gray-500">{group.count} ppl</span>
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