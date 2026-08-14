import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, MapPin, Users, Receipt } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";
import { dashboardApi, employeeApi, siteAssignmentApi, sitesApi, siteSubContractorApi, subContractorApi, subContractorWorkerApi, invoiceDocumentApi } from "../api/Api";

const STATUS_FILTERS = ["NEEDS_REVIEW", "CONFIRMED", "REJECTED", "ERROR"];

const DOCUMENT_TYPE_LABELS = {
  INVOICE: "請求書",
  MONTHLY_STATEMENT: "月締め合計請求書",
  QUOTATION: "見積書",
  OTHER: "その他",
};

const STATUS_BADGE_STYLE = {
  CONFIRMED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ERROR: "bg-red-100 text-red-700",
  NEEDS_REVIEW: "bg-orange-100 text-orange-700",
};

const formatYen = (amount) => `¥${Math.round(amount ?? 0).toLocaleString()}`;

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredFilters = location.state?.filters;

  const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? "attendance");
  const [openSite, setOpenSite] = useState(null);
  const [assignedSites, setAssignedSites] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isFetchingRef = useRef(false);

  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState(restoredFilters?.invoiceStatusFilter ?? "");
  const [uploadedByFilter, setUploadedByFilter] = useState(restoredFilters?.uploadedByFilter ?? "");
  const [dateFilter, setDateFilter] = useState(restoredFilters?.dateFilter ?? "");
  const [siteFilter, setSiteFilter] = useState(restoredFilters?.siteFilter ?? "");
  const [allEmployees, setAllEmployees] = useState([]);
  const [allInvoiceSites, setAllInvoiceSites] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allInvoicesLoading, setAllInvoicesLoading] = useState(false);

  const fetchDashboard = async () => {
    // Skip this tick if the previous fetch hasn't finished yet
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const now = new Date();
    const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const date = utc8.toISOString().split("T")[0];

    try {
      const [dashboardRes, siteAssignRes, employeeRes, siteRes, subContractorRes, subContractorWorkerRes, siteSubcontractorRes] = await Promise.all([
        dashboardApi.getAll({ date }),
        siteAssignmentApi.getAll(),
        employeeApi.getAll(),
        sitesApi.getAll(),
        subContractorApi.getAll(),
        subContractorWorkerApi.getAll(),
        siteSubContractorApi.getAll()
      ]);
      const allSites = siteRes.data.data || [];
      const attendanceList = dashboardRes.data.data || [];
      const subContractorList = subContractorRes.data.data || [];
      const subContractorWorkerList = subContractorWorkerRes.data.data || [];
      const siteSubcontractorList = siteSubcontractorRes.data?.data || []
      console.log('THIS IS Subcontractor: ', siteSubcontractorList)
      console.log('THIS IS WORKERS: ', subContractorWorkerList)
      const subContractorById = new Map();
      subContractorList.forEach((sub) => {
        const id = sub.subcontractor_id ?? sub.id;
        if (id != null) subContractorById.set(String(id), sub);
      });


      const siteSubMap = new Map();

      siteSubcontractorList.forEach((item) => {
          const siteId = String(item.site_id);
          const subId = String(item.subcontractor_id);

          if (!siteSubMap.has(siteId)) {
              siteSubMap.set(siteId, new Set());
          }

          siteSubMap.get(siteId).add(subId);
      });
      // Match a worker name → its subcontractor (from subcontractor-workers table)
      const normalizeName = (str) =>
        (str ?? "").replace(/\[.*?\]\s*/g, "").trim().toLowerCase();
      const subContractorByWorkerName = new Map();
      subContractorWorkerList.forEach((worker) => {
        const key = normalizeName(worker.name);
        if (!key) return;
        const subId = String(worker.subcontractor_id ?? worker.sub_contractor_id ?? worker.subcontractor?.id ?? "");
        if (!subId) return;
        subContractorByWorkerName.set(key, subId);
      });

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

      // Guard: skip this refetch if any response came back incomplete.
      // Committing partial data overwrites a good snapshot and makes the
      // whole dashboard flicker / show inconsistent values.
      const snapshotComplete =
        Array.isArray(allSites) && allSites.length > 0 &&
        Array.isArray(attendanceList) &&
        Array.isArray(subContractorList) &&
        Array.isArray(subContractorWorkerList) &&
        Array.isArray(assignments) &&
        Array.isArray(employeeList);

      if (!snapshotComplete) {
        console.warn("[Dashboard] Incomplete data — skipping update to avoid inconsistency");
        return;
      }

      const employeeById = new Map();
      employeeList.forEach((emp) => {
        if (emp.employee_id != null) employeeById.set(String(emp.employee_id), emp);
        if (emp.id != null) employeeById.set(String(emp.id), emp);
      });

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

        const ensureEmployeeOnSite = (site) => {
          if (!site.employeeMap[resolvedId]) {
            site.employeeMap[resolvedId] = {
              id: resolvedId,
              name: emp.name,
              status: emp.status,
              activities: [],
              // subName -> { name, contract_type, workers: { workerKey: [segments] } }
              subcontractorMap: {},
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
          const contractType = sub.site?.contract_type ?? sub.contract_type ?? null;
          const subId = sub.subcontractor_id ?? sub.subcontractor?.id ?? emp.subcontractor_id ?? emp.subcontractor?.id;
          const subName = sub.subcontractor?.company_name ?? sub.subcontractor?.name ?? sub.subcontractor_name
            ?? sub.company_name
            ?? emp.subcontractor?.name ?? emp.subcontractor_name
            ?? (subId ? subContractorById.get(String(subId))?.company_name : null)
            ?? "Unknown";
          const site = ensureSite(siteId, sub.site?.site_name ?? sub.site_name, contractType);
          if (!site) return;

          const empEntry = ensureEmployeeOnSite(site);
          if (!empEntry.subcontractorMap[subName]) {
            empEntry.subcontractorMap[subName] = {
              name: subName,
              contract_type: contractType,
              workers: {},
            };
          }
          const subGroup = empEntry.subcontractorMap[subName];
          const workerKey = String(
            sub.worker_id ?? sub.worker_name ?? sub.uuid ?? `w-${Object.keys(subGroup.workers).length}`
          );
          if (!subGroup.workers[workerKey]) subGroup.workers[workerKey] = [];
          subGroup.workers[workerKey].push(sub);
        });
      });

      groupedSites.forEach((site) => {
        const nowMs = new Date().getTime();

        const isActive = (act) => {
          const start = act.start_time ? new Date(act.start_time).getTime() : null;
          const end = act.end_time ? new Date(act.end_time).getTime() : null;
          return start !== null && start <= nowMs && (end === null || nowMs < end);
        };

        const quasiMap = {};
        const fixedMap = {};

        const buildRecord = (emp) => {
          const hasActivities = emp.activities.length > 0;
          const hasActive = emp.activities.some(isActive);
          const allEnded = hasActivities && emp.activities.every((act) => {
            const end = act.end_time ? new Date(act.end_time).getTime() : null;
            return end !== null && end <= nowMs;
          });

          let segment;
          if (!hasActivities) segment = "Not Started";
          else if (hasActive) segment = "In Progress";
          else if (allEnded) segment = "Completed";
          else segment = "Not Started";

          // Aggregate this employee's subcontractors into site-level groups.
          // Count every worker regardless of status (completed still counts as 1).
          Object.values(emp.subcontractorMap).forEach((s) => {
            const total = Object.keys(s.workers).length;
            if (total === 0) return;
            const bucket = s.contract_type === "FIXED_PRICE" ? fixedMap : quasiMap;
            bucket[s.name] = (bucket[s.name] || 0) + total;
          });

          const matchedSubId =
              subContractorByWorkerName.get(normalizeName(emp.name));

          if (matchedSubId) {

              const allowedSubs =
                  siteSubMap.get(String(site.id));

              if (allowedSubs?.has(String(matchedSubId))) {

                  const sub = subContractorById.get(String(matchedSubId));

                  if (sub) {

                      const bucket =
                          sub.contract_type === "FIXED_PRICE"
                              ? fixedMap
                              : quasiMap;

                      const company =
                          sub.company_name ??
                          sub.name;

                      bucket[company] =
                          (bucket[company] || 0) + 1;
                  }
              }
          }

          return { id: emp.id, name: emp.name, status: emp.status, segment };
        };

        const workerByEmployeeId = new Map();

subContractorWorkerList.forEach(worker => {
    workerByEmployeeId.set(
        String(worker.employee_id),
        worker.subcontractor_id
    );
});
        site.employees = Object.values(site.employeeMap).map(buildRecord);

        const quasiGroups = Object.entries(quasiMap).map(([name, count]) => ({ name, count }));
        const fixedGroups = Object.entries(fixedMap).map(([name, count]) => ({ name, count }));
        site.subcontractors = { quasi: quasiGroups, fixed: fixedGroups };

        const totalQuasi = quasiGroups.reduce((sum, g) => sum + g.count, 0);
        const totalFixed = fixedGroups.reduce((sum, g) => sum + g.count, 0);
        const totalWorkers = site.employees.length + totalQuasi + totalFixed;

        if (totalWorkers === 0) {
          site.status = "Not Started";
          site.statusStyle = "bg-gray-400 text-white";
        } else {
          // Completed only once every employee on site has finished up —
          // even one person still Not Started/In Progress keeps the whole
          // site In Progress.
          const allEmployeesComplete =
            site.employees.length > 0 &&
            site.employees.every((e) => e.segment === "Completed");
          site.status = allEmployeesComplete ? "Completed" : "In Progress";
          site.statusStyle = allEmployeesComplete ? "bg-green-500 text-white" : "bg-yellow-500 text-white";
        }

        site.totalWorkers = totalWorkers;
        delete site.employeeMap;
      });

      setAssignedSites(groupedSites);
      setLastUpdated(new Date());
      setDashboardLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setDashboardLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (activeTab !== "attendance") return;

    // fetchDashboard is async — setState calls happen after awaits, not synchronously
    // eslint-disable-next-line
    fetchDashboard();

    const interval = setInterval(() => {
      fetchDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const toggleSite = (siteId) => {
    setOpenSite(openSite === siteId ? null : siteId);
  };

  useEffect(() => {
    if (activeTab !== "invoices") return;

    const loadFilterOptions = async () => {
      try {
        const [empRes, siteRes] = await Promise.all([employeeApi.getAll(), sitesApi.getAll()]);
        const empInner = empRes.data?.data;
        setAllEmployees(Array.isArray(empInner) ? empInner : Array.isArray(empInner?.data) ? empInner.data : []);
        const siteInner = siteRes.data?.data;
        setAllInvoiceSites(Array.isArray(siteInner) ? siteInner : Array.isArray(siteInner?.data) ? siteInner.data : []);
      } catch (err) {
        console.error("[Dashboard] Failed to load filter options:", err);
      }
    };

    loadFilterOptions();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "invoices") return;

    const fetchAllInvoices = async () => {
      setAllInvoicesLoading(true);
      try {
        const res = await invoiceDocumentApi.getAll({
          status: invoiceStatusFilter || undefined,
          uploaded_by: uploadedByFilter || undefined,
          billing_month: dateFilter || undefined,
          site_id: siteFilter || undefined,
        });
        const inner = res.data?.data;
        setAllInvoices(Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : []);
      } catch (err) {
        console.error("[Dashboard] Failed to load invoice documents:", err);
        toast.error("Failed to load invoices");
        setAllInvoices([]);
      } finally {
        setAllInvoicesLoading(false);
      }
    };

    fetchAllInvoices();
  }, [activeTab, invoiceStatusFilter, uploadedByFilter, dateFilter, siteFilter]);
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Dashboard</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium cursor-pointer ${
              activeTab === "attendance" ? "bg-green-600 text-white" : "bg-white text-gray-500"
            }`}
          >
            <Users size={16} />
            Attendance
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium cursor-pointer ${
              activeTab === "invoices" ? "bg-green-600 text-white" : "bg-white text-gray-500"
            }`}
          >
            <Receipt size={16} />
            Invoices
          </button>
        </div>

        {activeTab === "attendance" && dashboardLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <CircularProgress size={28} sx={{ color: "#16a34a" }} />
            <p className="text-sm text-gray-500">Data is loading, please wait...</p>
          </div>
        )}

        {activeTab === "attendance" && !dashboardLoading && (
        <>
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
        </>
        )}

        {activeTab === "invoices" && (
        <>
        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          <select
            className="bg-white rounded-xl shadow-sm px-3 py-2 text-sm cursor-pointer focus:outline-none"
            value={uploadedByFilter}
            onChange={(e) => setUploadedByFilter(e.target.value)}
          >
            <option value="">All Uploaders</option>
            {allEmployees.map((emp) => (
              <option key={emp.employee_id ?? emp.id} value={emp.employee_id ?? emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          <select
            className="bg-white rounded-xl shadow-sm px-3 py-2 text-sm cursor-pointer focus:outline-none"
            value={invoiceStatusFilter}
            onChange={(e) => setInvoiceStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="month"
            className="bg-white rounded-xl shadow-sm px-3 py-2 text-sm cursor-pointer focus:outline-none"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <select
            className="bg-white rounded-xl shadow-sm px-3 py-2 text-sm cursor-pointer focus:outline-none"
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="">All Sites</option>
            {allInvoiceSites.map((site) => (
              <option key={site.site_id ?? site.id} value={site.site_id ?? site.id}>
                {site.site_name ?? site.name}
              </option>
            ))}
          </select>
        </div>

        {allInvoicesLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <CircularProgress size={28} sx={{ color: "#16a34a" }} />
            <p className="text-sm text-gray-500">Loading data...</p>
          </div>
        ) : allInvoices.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-10">
            No invoices found
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500 uppercase">
                  <th className="px-3 py-2 whitespace-nowrap">Vendor</th>
                  <th className="px-3 py-2 whitespace-nowrap">Issue Date</th>
                  <th className="px-3 py-2 whitespace-nowrap">Billing Month</th>
                  <th className="px-3 py-2 whitespace-nowrap">Type</th>
                  <th className="px-3 py-2 whitespace-nowrap text-right">Subtotal</th>
                  <th className="px-3 py-2 whitespace-nowrap text-right">Tax</th>
                  <th className="px-3 py-2 whitespace-nowrap text-right">Total (incl.)</th>
                  <th className="px-3 py-2 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {allInvoices.map((doc) => (
                  <tr
                    key={doc.document_id}
                    onClick={() =>
                      doc.document_id &&
                      navigate(`/ocr/${doc.document_id}/review`, {
                        state: {
                          from: "dashboard",
                          filters: { invoiceStatusFilter, uploadedByFilter, dateFilter, siteFilter },
                        },
                      })
                    }
                    className="border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 whitespace-nowrap font-medium">
                      {doc.subcontractor_name || doc.vendor_name_raw || "Unknown"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{doc.issue_date ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{doc.billing_month ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                      {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type ?? "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">{formatYen(doc.subtotal)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">{formatYen(doc.tax_amount)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right font-medium">
                      {formatYen(doc.total_with_tax)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          STATUS_BADGE_STYLE[doc.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;