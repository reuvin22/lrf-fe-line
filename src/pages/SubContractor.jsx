import React, { useState, useEffect } from "react";
import { X, Clock, Plus } from "lucide-react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import Button from "../components/Button";
import LocationModal from "../components/Modals/LocationModal";
import {
  attendanceApi,
  attendanceSubcontractorSegmentApi,
  constructionSiteApi,
  siteAssignmentApi,
  siteSubContractorApi,
  subContractorApi,
  subContractorWorkerApi,
} from "../api/Api";
import { useLocation, useNavigate } from "react-router-dom";
import { useAttendanceContext } from "../context/AttendanceContext";
import { toast } from "react-toastify";

function SubContractor({ onRefetch }) {
  const [companies, setCompanies] = useState([]);
  const [allSubcontractors, setAllSubcontractors] = useState([]);
  const [siteSubcontractors, setSiteSubcontractors] = useState([]);
  const [constructionSites, setConstructionSites] = useState([]);
  const [allSegments, setAllSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletedWorkers, setDeletedWorkers] = useState([]);
  const [openSitePicker, setOpenSitePicker] = useState(false);
  const [assignedSites, setAssignedSites] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { attendance, employee } = useAttendanceContext();
  const effectiveAttendanceId =
    location.state?.attendance_id ||
    attendance?.attendance_id ||
    attendance?.id;

  const parseSegmentTime = (value) => {
    if (!value) return "00:00";
    // ISO datetime: "2026-05-09T09:00:00" or "2026-05-09 9:00:00" (with or without padding)
    if (typeof value === "string" && (value.includes("T") || value.includes(" "))) {
      const timePart = value.includes("T") ? value.split("T")[1] : value.split(" ")[1];
      if (timePart) {
        const [hh, mm] = timePart.split(":");
        return `${String(parseInt(hh, 10)).padStart(2, "0")}:${String(parseInt(mm, 10)).padStart(2, "0")}`;
      }
    }
    // Excel serial number: 46151.375
    const num = Number(value);
    if (!isNaN(num) && num > 0) {
      const fraction = num % 1;
      const totalMinutes = Math.round(fraction * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    return "00:00";
  };

  async function fetchAttendanceSubcontractor(subsList = []) {
    try {
      const attendanceId =
        location.state?.attendance_id ||
        attendance?.attendance_id ||
        attendance?.id;
      const employeeId = employee?.employee_id;

      console.log("[fetchAttendanceSubcontractor] attendance_id:", attendanceId, "employee_id:", employeeId);

      if (!attendanceId) {
        setCompanies([]);
        return;
      }

      const res = await attendanceSubcontractorSegmentApi.getAll({
        employee_id: employeeId,
        attendance_id: attendanceId,
      });

      console.log("[fetchAttendanceSubcontractor] raw API response:", res.data);

      const segInner = res.data?.data;
      const allRaw = Array.isArray(segInner)
        ? segInner
        : Array.isArray(segInner?.data)
          ? segInner.data
          : [];

      const raw = allRaw.filter(
        (item) => String(item.attendance_id) === String(attendanceId)
      );

      console.log("[fetchAttendanceSubcontractor] segments matched to attendance_id:", raw);

      const grouped = {};

      raw.forEach((item) => {
        const key = `${item.site_id}-${item.company_id}`;

        if (!grouped[key]) {
          grouped[key] = {
            site_name: item.site_name || "",
            site_id: item.site_id,
            company: item.company_name || "",
            subcontractor_id: item.company_id,
            contract: item.contract_type || "QUASI_DELEGATION",
            availableWorkers: [],
            workersLoading: false,
            workers: [],
          };
        }

        grouped[key].workers.push({
          uuid: item.uuid ?? null,
          name: item.worker_name || "",
          name_kana: item.name_kana || "",
          status: item.status || "ACTIVE",
          worker_id: item.worker_id || null,
          start: parseSegmentTime(item.start_time),
          end: parseSegmentTime(item.end_time),
          inputMode: "dropdown",
        });
      });

      const companiesData = Object.values(grouped);
      console.log("[fetchAttendanceSubcontractor] grouped companies:", companiesData);

      // Fetch workers so dropdowns have options to select from
      const workersRes = await subContractorWorkerApi.getAll();
      const wInner = workersRes.data?.data;
      const allWorkers = Array.isArray(wInner)
        ? wInner
        : Array.isArray(wInner?.data)
          ? wInner.data
          : [];

      const finalCompanies = companiesData.map((c) => {
        const matched = allWorkers.filter(
          (w) => String(w.subcontractor_id) === String(c.subcontractor_id)
        );
        // Fall back to the segment workers themselves so existing names are always selectable
        const availableWorkers = matched.length > 0
          ? matched
          : c.workers.map((w) => ({ worker_id: w.worker_id, name: w.name, subcontractor_id: c.subcontractor_id }));

        return { ...c, availableWorkers };
      });

      console.log("[fetchAttendanceSubcontractor] final companies:", finalCompanies);
      setCompanies(finalCompanies);
    } catch (err) {
      console.error("❌ Error fetching attendance segment:", err);
    }
  };

  const buildConstructionSites = async (subs, siteSubs, segments) => {
    try {
      const res = await constructionSiteApi.getAll();
      const sitesList = res.data.data || [];

      const segmentSiteIds = segments.map((s) => Number(s.site_id));

      const filteredSites = sitesList
        .filter((site) => segmentSiteIds.includes(Number(site.site_id)))
        .map((site) => {
          const subcontractorsForSite = siteSubs
            .filter((ss) => Number(ss.site_id) === Number(site.site_id))
            .map((ss) => {
              const sub = subs.find(
                (s) =>
                  Number(s.subcontractor_id) === Number(ss.subcontractor_id)
              );

              return {
                ...sub,
                workers: sub?.workers || [],
                subcontractor_id: sub?.subcontractor_id,
                company_name: sub?.company_name,
              };
            });

          return {
            ...site,
            subcontractors: subcontractorsForSite,
          };
        });

      setConstructionSites(filteredSites);
      setCompanies([]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (location.state?.from === "subcontractor" && !effectiveAttendanceId) return;

    const init = async () => {
      try {
        setLoading(true);

        const [subsRes, siteSubsRes, attendanceRes, siteAssignRes] = await Promise.all([
          subContractorApi.getAll(),
          siteSubContractorApi.getAll(),
          attendanceApi.getAll(),
          siteAssignmentApi.getAll(),
        ]);

        const attInner2 = attendanceRes.data?.data;
        const attendanceList2 = Array.isArray(attInner2) ? attInner2 : Array.isArray(attInner2?.data) ? attInner2.data : [];
        const currentAttendance = attendanceList2.find(a => String(a.employee_id) === String(employee?.employee_id));
        const attendanceEmployeeId = currentAttendance?.employee_id ?? employee?.employee_id;
        console.log("[SubContractor] attendanceEmployeeId for site filter:", attendanceEmployeeId);

        const rawSites = siteAssignRes.data.data ?? siteAssignRes.data;
        const siteList = Array.isArray(rawSites) ? rawSites : [];
        const mapped = siteList
          .filter(v => v != null && String(v.worker_id ?? "") === String(attendanceEmployeeId ?? ""))
          .map(v => { const s = v.site ?? v; return { site_id: s.site_id, site_name: s.site_name }; })
          .filter(s => s.site_id != null);
        console.log("[SubContractor] assigned sites", mapped);
        setAssignedSites(mapped);

        const subsInner = subsRes.data?.data;
        const subs = Array.isArray(subsInner) ? subsInner : Array.isArray(subsInner?.data) ? subsInner.data : [];

        const siteSubsInner = siteSubsRes.data?.data;
        const siteSubs = Array.isArray(siteSubsInner) ? siteSubsInner : Array.isArray(siteSubsInner?.data) ? siteSubsInner.data : [];

        const attInner = attendanceRes.data?.data;
        const attendanceList = Array.isArray(attInner) ? attInner : Array.isArray(attInner?.data) ? attInner.data : [];
        const segments = attendanceList.flatMap((a) => a.segments || []);

        setAllSubcontractors(subs);
        setSiteSubcontractors(siteSubs);
        setAllSegments(segments);

        if (location.state?.from === "subcontractor") {
          await fetchAttendanceSubcontractor(subs);
        } else {
          await buildConstructionSites(subs, siteSubs, segments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAttendanceId, employee?.employee_id, location.state?.from]);

  const addCompany = () => {
    if (assignedSites.length === 0 && constructionSites.length === 0) {
      toast.error("No available construction sites");
      return;
    }
    setOpenSitePicker(true);
  };

  const handleSiteSelect = (site) => {
    setCompanies((prev) => [
      ...prev,
      {
        site_name: site.site_name,
        site_id: site.site_id,
        company: "",
        subcontractor_id: null,
        contract: "QUASI_DELEGATION",
        workers: [{ name: "", name_kana: "", status: "ACTIVE", worker_id: null, start: "09:00", end: "17:30", inputMode: "dropdown" }],
      },
    ]);
  };

  const addWorker = (company) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c === company
          ? {
              ...c,
              workers: [
                ...c.workers,
                { name: "", name_kana: "", status: "ACTIVE", worker_id: null, start: "09:00", end: "17:30", inputMode: "dropdown" },
              ],
            }
          : c
      )
    );
  };

  const handleWorkerInputMode = (company, worker, mode) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c !== company) return c;
        return {
          ...c,
          workers: c.workers.map((w) =>
            w !== worker
              ? w
              : { ...w, inputMode: mode, name: "", name_kana: "", status: "ACTIVE", worker_id: null }
          ),
        };
      })
    );
  };

  const handleWorkerFieldChange = (company, worker, field, value) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c !== company) return c;
        return {
          ...c,
          workers: c.workers.map((w) =>
            w !== worker ? w : { ...w, [field]: value }
          ),
        };
      })
    );
  };

  const deleteWorker = (company, worker) => {
    if (worker.uuid) {
      setDeletedWorkers((prev) => [...prev, worker.uuid]);
    }

    setCompanies((prev) =>
      prev.map((c) =>
        c === company
          ? { ...c, workers: c.workers.filter((w) => w !== worker) }
          : c
      )
    );
  };

  const bulkSet = (company, start, end) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c === company
          ? { ...c, workers: c.workers.map((w) => ({ ...w, start, end })) }
          : c
      )
    );
  };

  const deleteCompanyApi = (company) => {
    const uuids = company.workers.map((w) => w.uuid).filter(Boolean);

    console.log("🗑️ Deleting site/company:", company.site_name, "|", company.company);
    console.log("🗑️ Worker UUIDs to delete:", uuids);

    if (uuids.length > 0) {
      setDeletedWorkers((prev) => [...prev, ...uuids]);
    }

    setCompanies((prev) => prev.filter((c) => c !== company));
  };

  const ensureWorkerExists = async (worker, company) => {
    try {
      if (worker.worker_id && !worker.worker_id.startsWith("temp-")) {
        return { worker_id: worker.worker_id };
      }

      const workerRes = await subContractorWorkerApi.create({
        subcontractor_id: company.subcontractor_id,
        name: worker.name,
        name_kana: worker.name_kana || "",
        status: worker.status || "ACTIVE",
      });

      const workerId = workerRes.data.data.worker_id;
      return { worker_id: workerId };
    } catch (err) {
      console.error("❌ Failed to create worker:", err);
      throw err;
    }
  };

  const saveCompany = async (company) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      for (const worker of company.workers) {
        let finalWorkerId = worker.worker_id;
        const finalEmployeeId = employee?.employee_id;

        if (!worker.worker_id) {
          const ids = await ensureWorkerExists(worker, company);
          finalWorkerId = ids.worker_id;
          worker.worker_id = finalWorkerId;
        }

        const payload = {
          attendance_id: effectiveAttendanceId,
          company_id: company.subcontractor_id,
          company_name: company.company,
          subcontractor_id: company.subcontractor_id,

          employee_id: finalEmployeeId,
          worker_id: finalWorkerId,

          worker_name: worker.name,
          site_id: company.site_id,
          site_name: company.site_name,
          contract_type: company.contract,
          start_time: `${today}T${worker.start}:00`,
          end_time: `${today}T${worker.end}:00`,
        };
        console.log("[saveCompany] payload:", payload);

        if (worker.uuid) {
          await attendanceSubcontractorSegmentApi.update(worker.uuid, payload);
        } else {
          const res = await attendanceSubcontractorSegmentApi.create(payload);
          worker.uuid = res.data.data.uuid;
        }
      }

      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      for (const id of deletedWorkers) {
        await attendanceSubcontractorSegmentApi.delete(id);
      }

      for (const company of companies) {
        await saveCompany(company);
      }

      setDeletedWorkers([]);
      toast.success("Saved successfully!");

      onRefetch?.();

      if (location.state?.from !== "subcontractor") {
        navigate("/transportation-expenses");
      }
    } catch {
      toast.error("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (company, newValue) => {
    const selectedSub = allSubcontractors.find(
      (s) =>
        s.company_name ===
        (typeof newValue === "string" ? newValue : newValue?.company_name)
    );

    if (selectedSub) {
      const subId = selectedSub.subcontractor_id;

      setCompanies((prev) =>
        prev.map((c) =>
          c !== company
            ? c
            : {
                ...c,
                company: selectedSub.company_name,
                subcontractor_id: subId,
                availableWorkers: [],
                workersLoading: true,
                workers: [{ name: "", worker_id: null, start: "09:00", end: "17:30" }],
              }
        )
      );

      let workers = [];
      try {
        const res = await subContractorWorkerApi.getAll();
        const raw = res.data.data ?? res.data;
        const all = Array.isArray(raw) ? raw : [];
        workers = all.filter(
          w => String(w.subcontractor_id) === String(subId)
        );
        console.log("[SubContractor] workers for", selectedSub.company_name, workers);
      } catch (err) {
        console.error("Failed to fetch workers:", err);
      }

      setCompanies((prev) =>
        prev.map((c) =>
          String(c.subcontractor_id) === String(subId)
            ? { ...c, availableWorkers: workers, workersLoading: false }
            : c
        )
      );
    } else {
      setCompanies((prev) =>
        prev.map((c) =>
          c !== company
            ? c
            : {
                ...c,
                company: typeof newValue === "string" ? newValue : newValue?.company_name || "",
                subcontractor_id: null,
                availableWorkers: [],
                workers: [{ name: "", worker_id: null, start: "09:00", end: "17:30" }],
              }
        )
      );
    }
  };

  const handleWorkerChange = (company, worker, newValue) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c !== company) return c;
        return {
          ...c,
          workers: c.workers.map((w) => {
            if (w !== worker) return w;
            return newValue
              ? { ...w, name: newValue.name, worker_id: newValue.worker_id, subcontractor_id: newValue.subcontractor_id ?? null }
              : { ...w, name: "", worker_id: null, subcontractor_id: null };
          }),
        };
      })
    );
  };

  const getCompanyValue = (company) => company.company || "";

  const getWorkerValue = (company, worker) => {
    if (!worker.worker_id && !worker.name) return null;
    return (
      company.availableWorkers?.find(
        (w) => String(w.worker_id) === String(worker.worker_id)
      ) ?? (worker.name ? { name: worker.name, worker_id: worker.worker_id } : null)
    );
  };

  const handleWorkerTimeChange = (company, worker, field, value) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c !== company) return c;

        return {
          ...c,
          workers: c.workers.map((w) =>
            w !== worker ? w : { ...w, [field]: value }
          ),
        };
      })
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full p-6 space-y-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Subcontractor Report</h1>
        </div>

        <div className="space-y-6">
          {companies
            .filter((company) => {
              if (location.state?.from === "subcontractor") return true;
              return (
                constructionSites.some(s => String(s.site_id) === String(company.site_id)) ||
                assignedSites.some(s => String(s.site_id) === String(company.site_id))
              );
            })
            .map((company, cIndex) => {
              const companyOptions = allSubcontractors.map(
                (sub) => sub.company_name
              );

              return (
                <div key={cIndex} className="border rounded-xl p-4 space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Site:{" "}
                    <span className="font-medium">{company.site_name}</span>
                  </p>

                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-600">Company</label>
                    <button
                      onClick={() => deleteCompanyApi(company)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <Autocomplete
                    freeSolo
                    options={companyOptions}
                    value={getCompanyValue(company)}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : option?.company_name ?? ""
                    }
                    onChange={(e, newValue) =>
                      handleCompanyChange(company, newValue)
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select or type Company"
                        size="small"
                        fullWidth
                      />
                    )}
                  />

                  <div className="mt-2">
                    <label className="text-sm text-gray-600">
                      Contract Type
                    </label>
                    <p className="text-sm">{company.contract}</p>
                  </div>

                  <div className="space-y-3 mt-2">
                    {company.workers.map((worker, wIndex) => {
                      const selectedWorkers = company.workers
                        .filter((_, idx) => idx !== wIndex)
                        .map((w) => ({
                          worker_id: w.worker_id,
                          name: w.name,
                        }));

                      const workerOptions =
                        company.availableWorkers?.filter((option) => {
                          return !selectedWorkers.some(
                            (w) =>
                              (w.worker_id &&
                                w.worker_id === option.worker_id) ||
                              (!w.worker_id && w.name === option.name)
                          );
                        }) || [];

                      return (
                        <div
                          key={wIndex}
                          className="relative border rounded-lg p-2"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleWorkerInputMode(company, worker, "dropdown")}
                                  className={`text-xs px-2 py-1 rounded ${worker.inputMode !== "manual" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}
                                >
                                  Select
                                </button>
                                <button
                                  onClick={() => handleWorkerInputMode(company, worker, "manual")}
                                  className={`text-xs px-2 py-1 rounded ${worker.inputMode === "manual" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}
                                >
                                  Manual
                                </button>
                              </div>
                              {company.workers.length > 1 && (
                                <button
                                  onClick={() => deleteWorker(company, worker)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={18} />
                                </button>
                              )}
                            </div>

                            {worker.inputMode === "manual" ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Name"
                                  value={worker.name}
                                  onChange={(e) => handleWorkerFieldChange(company, worker, "name", e.target.value)}
                                  className="w-full border rounded-lg p-2 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Name (Kana)"
                                  value={worker.name_kana || ""}
                                  onChange={(e) => handleWorkerFieldChange(company, worker, "name_kana", e.target.value)}
                                  className="w-full border rounded-lg p-2 text-sm"
                                />
                                <select
                                  value={worker.status || "ACTIVE"}
                                  onChange={(e) => handleWorkerFieldChange(company, worker, "status", e.target.value)}
                                  className="w-full border rounded-lg p-2 text-sm"
                                >
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="INACTIVE">INACTIVE</option>
                                </select>
                              </div>
                            ) : (
                              <Autocomplete
                                options={workerOptions}
                                value={getWorkerValue(company, worker)}
                                getOptionLabel={(option) => option?.name ?? ""}
                                isOptionEqualToValue={(option, value) =>
                                  String(option?.worker_id) === String(value?.worker_id)
                                }
                                loading={company.workersLoading ?? false}
                                loadingText="Loading workers..."
                                noOptionsText={company.workersLoading ? "Loading..." : "No workers found"}
                                onChange={(e, newValue) =>
                                  handleWorkerChange(company, worker, newValue)
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Select worker"
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                      ...params.InputProps,
                                      endAdornment: (
                                        <>
                                          {company.workersLoading && (
                                            <CircularProgress size={16} />
                                          )}
                                          {params.InputProps.endAdornment}
                                        </>
                                      ),
                                    }}
                                  />
                                )}
                              />
                            )}
                          </div>

                          <div className="flex gap-2 mt-2">
                            <div className="flex items-center border rounded-lg px-2 py-1 flex-1 min-w-0">
                              <Clock size={16} className="mr-1 text-gray-400" />
                              <input
                                type="time"
                                value={worker.start}
                                onChange={(e) =>
                                  handleWorkerTimeChange(company, worker, "start", e.target.value)
                                }
                              />
                            </div>

                            <div className="flex items-center border rounded-lg px-2 py-1 flex-1 min-w-0">
                              <Clock size={16} className="mr-1 text-gray-400" />
                              <input
                                  type="time"
                                  value={worker.end}
                                  onChange={(e) =>
                                    handleWorkerTimeChange(company, worker, "end", e.target.value)
                                  }
                                  className="w-full outline-none text-sm min-w-0"
                                />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={() => addWorker(company)}
                      className="text-green-600 text-sm flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Worker
                    </button>

                    <button
                      onClick={() => bulkSet(company, "09:00", "18:00")}
                      className="text-blue-600 text-sm"
                    >
                      Bulk Set: Same time for all
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        <button
          onClick={addCompany}
          className="mt-4 text-green-600 flex items-center gap-1 text-sm"
        >
          <Plus size={16} /> Add Another Company
        </button>

        <div className="mt-6 border-t pt-4 space-y-3">
          <p className="font-semibold text-sm">Entered</p>

          {companies
            .filter((company) => {
              if (location.state?.from === "subcontractor") return true;
              return (
                company.site_id && (
                  constructionSites.some(s => String(s.site_id) === String(company.site_id)) ||
                  assignedSites.some(s => String(s.site_id) === String(company.site_id))
                )
              );
            })
            .map((company, cIndex) => (
              <div key={cIndex}>
                <p className="text-sm font-medium">
                  ■ {company.company || "Company"} ({company.contract})
                </p>

                {company.workers.map((w, i) => (
                  <p key={i} className="text-xs text-gray-600 ml-2">
                    {w.name || "Worker"} {w.start}-{w.end}
                  </p>
                ))}
              </div>
            ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            buttonStyle="active"
            onClick={handleNext}
            customButton="flex-1"
            loading={loading}
            text={
              <div className="flex items-center justify-center gap-2">
                {loading && <CircularProgress size={18} color="inherit" />}
                <span>
                  {location.state?.from === "subcontractor"
                    ? "Update"
                    : "Next (Transportation)"}
                </span>
              </div>
            }
          />

          <Button
            buttonStyle="default"
            text={
              location.state?.from === "subcontractor"
                ? "Back to Calendar"
                : "Skip"
            }
            onClick={() => {
              if (location.state?.from === "subcontractor") {
                navigate("/calendar/detail");
              } else {
                navigate("/transportation-expenses");
              }
            }}
            customButton="flex-1"
          />
        </div>
      </div>

      <LocationModal
        open={openSitePicker}
        onClose={() => setOpenSitePicker(false)}
        onSelectSite={handleSiteSelect}
      />
    </div>
  );
}

export default SubContractor;
