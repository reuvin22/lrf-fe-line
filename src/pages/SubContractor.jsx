import React, { useState, useEffect } from "react";
import { X, Clock, Plus } from "lucide-react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import Button from "../components/Button";
import LocationModal from "../components/Modals/LocationModal";
import {
  attendanceApi,
  attendanceSubcontractorSegmentApi,
  constructionSiteApi,
  employeeApi,
  siteSubContractorApi,
  subContractorApi,
  subContractorWorkerApi,
} from "../api/Api";
import { useLocation, useNavigate } from "react-router-dom";
import { useAttendanceContext } from "../context/AttendanceContext";
import { useLocationContext } from "../context/LocationContext";
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

  const navigate = useNavigate();
  const location = useLocation();
  const { attendance, employee } = useAttendanceContext();
  const { sites: assignedSites } = useLocationContext();
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const [subsRes, siteSubsRes, attendanceRes] = await Promise.all([
          subContractorApi.getAll(),
          siteSubContractorApi.getAll(),
          attendanceApi.getAll(),
        ]);

        const subs = subsRes.data.data || [];
        const siteSubs = siteSubsRes.data.data || [];
        const attendanceList = attendanceRes.data.data || [];

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
  }, []);

  const fetchAttendanceSubcontractor = async (subsList = []) => {
    try {
      const res = await attendanceSubcontractorSegmentApi.getAll({
        employee_id: employee?.employee_id,
        attendance_id: attendance?.attendance_id,
      });

      const raw = res.data.data || [];
      const grouped = {};

      raw.forEach((item) => {
        const siteId = item.site?.site_id;
        const subcontractorId = item.subcontractor?.subcontractor_id;

        const key = `${siteId}-${subcontractorId}`;

        if (!grouped[key]) {
          const matchedSub = subsList.find(
            (s) => Number(s.subcontractor_id) === Number(subcontractorId)
          );

          grouped[key] = {
            site_name: item.site?.site_name || "",
            site_id: siteId,
            company: item.subcontractor?.company_name || "",
            subcontractor_id: subcontractorId,
            contract: item.contract_type || "QUASI_DELEGATION",
            availableWorkers: matchedSub?.workers || [],
            workers: [],
          };
        }

        grouped[key].workers.push({
          uuid: item.uuid ?? null,
          name: item.worker?.name || "",
          worker_id: item.worker?.worker_id || null,
          start: item.start_time?.slice(11, 16),
          end: item.end_time?.slice(11, 16),
        });
      });

      setCompanies(Object.values(grouped));
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
        workers: [{ name: "", worker_id: null, start: "09:00", end: "17:30" }],
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
                { name: "", worker_id: null, start: "09:00", end: "17:30" },
              ],
            }
          : c
      )
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
        return {
          worker_id: worker.worker_id,
          employee_id: worker.employee_id || null,
        };
      }

      const empRes = await employeeApi.create({
        name: worker.name,
      });

      const employeeId = empRes.data.data.employee_id;

      const workerRes = await subContractorWorkerApi.create({
        subcontractor_id: company.subcontractor_id,
        name: worker.name,
        name_kana: "ダミー",
        status: "ACTIVE",
      });

      const workerId = workerRes.data.data.worker_id;
      console.log(workerId);
      return {
        worker_id: workerId,
        employee_id: employeeId,
      };
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
        let finalEmployeeId = employee?.employee_id;

        if (!worker.worker_id) {
          const ids = await ensureWorkerExists(worker, company);

          finalWorkerId = ids.worker_id;
          finalEmployeeId = ids.employee_id;
          console.log(finalWorkerId, finalEmployeeId);

          worker.worker_id = finalWorkerId;
          worker.employee_id = finalEmployeeId;
        }

        const payload = {
          attendance_id: attendance?.attendance_id,
          company_id: company.subcontractor_id,
          company_name: company.company,

          employee_id: finalEmployeeId,
          worker_id: finalWorkerId,

          worker_name: worker.name,
          site_id: company.site_id,
          site_name: company.site_name,
          contract_type: company.contract,
          start_time: `${today}T${worker.start}:00`,
          end_time: `${today}T${worker.end}:00`,
        };

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

      navigate(
        location.state?.from === "subcontractor"
          ? "/calendar/detail"
          : "/transportation-expenses"
      );
    } catch {
      toast.error("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (company, newValue) => {
    const selectedSub = allSubcontractors.find(
      (s) =>
        s.company_name ===
        (typeof newValue === "string"
          ? newValue
          : newValue?.company_name)
    );

    setCompanies((prev) =>
      prev.map((c) => {
        if (c !== company) return c;

        if (selectedSub) {
          return {
            ...c,
            company: selectedSub.company_name,
            subcontractor_id: selectedSub.subcontractor_id,
            availableWorkers: selectedSub.workers || [],
            workers: [
              {
                name: "",
                worker_id: null,
                start: "09:00",
                end: "17:30",
              },
            ],
          };
        }

        return {
          ...c,
          company:
            typeof newValue === "string"
              ? newValue
              : newValue?.company_name || "",
          subcontractor_id: null,
          availableWorkers: [],
          workers: [
            {
              name: "",
              worker_id: null,
              start: "09:00",
              end: "17:30",
            },
          ],
        };
      })
    );
  };

  const handleWorkerChange = (company, worker, newValue) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c !== company) return c;

        return {
          ...c,
          workers: c.workers.map((w) => {
            if (w !== worker) return w;

            if (typeof newValue === "string") {
              return {
                ...w,
                name: newValue,
                worker_id: null,
              };
            }

            if (newValue) {
              return {
                ...w,
                name: newValue.name,
                worker_id: newValue.worker_id,
              };
            }

            return w;
          }),
        };
      })
    );
  };

  const getCompanyValue = (company) => {
    return (
      allSubcontractors.find(
        (s) => s.company_name === company.company
      ) ||
      company.company ||
      ""
    );
  };

  const getWorkerValue = (company, worker) => {
    return (
      company.availableWorkers?.find(
        (w) => w.worker_id === worker.worker_id
      ) ||
      worker.name ||
      ""
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
              return constructionSites.some(
                (site) => site.site_id === company.site_id
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
                          <div className="flex flex-col gap-1">
                            {company.workers.length > 1 && (
                              <button
                                onClick={() => deleteWorker(company, worker)}
                                className="text-red-500 hover:text-red-700 place-self-end"
                              >
                                <X size={18} />
                              </button>
                            )}

                            <Autocomplete
                              freeSolo
                              options={workerOptions}
                              value={getWorkerValue(company, worker)}
                              onChange={(e, newValue) =>
                                handleWorkerChange(company, worker, newValue)
                              }
                              onInputChange={(e, newInputValue) =>
                                handleWorkerInputChange(company, worker, newInputValue)
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Select or type worker name"
                                  size="small"
                                  fullWidth
                                />
                              )}
                            />
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
                company.site_id &&
                constructionSites.some(
                  (site) => site.site_id === company.site_id
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
        sites={assignedSites}
        onSelectSite={handleSiteSelect}
      />
    </div>
  );
}

export default SubContractor;
