import React, { useState, useEffect } from "react";
import { X, Clock, Plus } from "lucide-react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import Button from "../components/Button";
import {
  attendanceApi,
  attendanceSubcontractorSegment,
  constructionSiteApi,
  siteSubContractorApi,
  subContractorApi,
  subContractorReportApi,
} from "../api/Api";
import { useLocation, useNavigate } from "react-router-dom";
import { useAttendanceContext } from "../context/AttendanceContext";
import { loggedInUser } from "../utils/loggedInUser";

function SubContractor({ sites, constructionSite, subContractor = [], onRefetch }) {
  const [companies, setCompanies] = useState([]);
  const [allSubcontractors, setAllSubcontractors] = useState([]);
  const [siteSubcontractors, setSiteSubcontractors] = useState([]);
  const [data, setData] = useState([]);
  const [constructionSites, setConstructionSites] = useState([]);
  const [allSegments, setAllSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletedWorkers, setDeletedWorkers] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { attendance } = useAttendanceContext();

  const fetchSegment = async () => {
    try {
      const res = await attendanceApi.getAll();
      const attendanceList = res.data.data || [];

      const segments = attendanceList.flatMap((a) => a.segments || []);
      const subcontractorSegments = attendanceList.flatMap(
        (a) => a.attendance_subcontractor_segments || []
      );

      setAllSegments(segments);

      const validSegments = segments.filter((s) => s.site_name?.trim());

      const mapped = validSegments.flatMap((s) => {
        const matchedSubs = subcontractorSegments.filter(
          (sub) => Number(sub.segment_id) === Number(s.segment_id)
        );

        if (!matchedSubs.length) return [];

        const groupedByCompany = matchedSubs.reduce((acc, curr) => {
          const key = `${curr.segment_id}-${curr.company_id}`;

          if (!acc[key]) {
            acc[key] = {
              site_name: s.site_name,
              site_id: Number(s.site_id),
              segment_id: curr.segment_id,
              attendance_id: curr.attendance_id,
              company: curr.company_name,
              subcontractor_id: curr.company_id,
              workers: [],
              contract: curr.contract_type || "QUASI_DELEGATION",
            };
          }

          acc[key].workers.push({
            id: curr.id,
            name: curr.worker_name,
            worker_id: curr.worker_id,
            start: curr.start_time?.slice(11, 16),
            end: curr.end_time?.slice(11, 16),
          });

          return acc;
        }, {});

        return Object.values(groupedByCompany);
      });

      setCompanies(mapped);
      return mapped;
    } catch (err) {
      console.error("Error fetching segments:", err);
      return [];
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await subContractorApi.getAll();
      const subs = res.data.data || [];
      setAllSubcontractors(subs);
      return subs;
    } catch (err) {
      console.error("Error fetching subcontractors:", err);
      return [];
    }
  };

  const fetchSiteSubcontractor = async () => {
    try {
      const res = await siteSubContractorApi.getAll();
      const siteSubs = res.data.data || [];
      setSiteSubcontractors(siteSubs);
      return siteSubs;
    } catch (err) {
      console.error("Error fetching site subcontractors:", err);
      return [];
    }
  };

  const computeData = (companiesList, allSubs, siteSubs) => {
    if (!companiesList.length || !allSubs.length || !siteSubs.length) return;

    const companySiteIds = companiesList.map((c) => Number(c.site_id));
    const filteredSiteSubs = siteSubs.filter((v) => companySiteIds.includes(Number(v.site_id)));

    const sitesWithCompanies = companiesList.map((company) => {
      const matchingSiteSubs = filteredSiteSubs.filter((ss) => ss.site_id === company.site_id);

      const companiesForSite = matchingSiteSubs.map((ss) => {
        const sub = allSubs.find((s) => s.subcontractor_id === ss.subcontractor_id);
        return {
          ...sub,
          workers: sub?.workers || [],
          pivot: ss,
          company_id: sub?.subcontractor_id,
          company_name: sub?.company_name || "",
        };
      });

      return {
        ...company,
        subcontractors: companiesForSite,
      };
    });

    setData(sitesWithCompanies);
  };

  useEffect(() => {
    const init = async () => {
      if (location.state?.from !== "subcontractor") return; // Only fetch for subcontractor

      const [companiesRes, subsRes, siteSubsRes] = await Promise.all([
        fetchSegment(),
        fetchCompanies(),
        fetchSiteSubcontractor(),
      ]);

      computeData(companiesRes, subsRes, siteSubsRes);
    };

    init();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await constructionSiteApi.getAll();
      const sitesList = res.data.data || [];

      const segmentSiteIds = allSegments.map((s) => Number(s.site_id));
      const filteredSites = sitesList
        .filter((site) => segmentSiteIds.includes(Number(site.site_id)))
        .map((site) => {
          const subcontractorsForSite = siteSubcontractors
            .filter((ss) => Number(ss.site_id) === Number(site.site_id))
            .map((ss) => {
              const sub = allSubcontractors.find(
                (s) => Number(s.subcontractor_id) === Number(ss.subcontractor_id)
              );

              const matchedSegment = allSegments.find(
                (seg) => Number(seg.site_id) === Number(site.site_id)
              );

              return {
                ...sub,
                company_name: sub?.company_name || "",
                subcontractor_id: sub?.subcontractor_id,
                workers: sub?.workers || [],
                segment_id: matchedSegment?.segment_id || null,
              };
            });

          return {
            ...site,
            subcontractors: subcontractorsForSite,
          };
        });

      setConstructionSites(filteredSites);

      if (location.state?.from === "subcontractor" && !companies.length && filteredSites.length > 0) {
      const firstSite = filteredSites[0];
      const firstSub = firstSite.subcontractors[0];

      setCompanies([
        {
          site_name: firstSite.site_name,
          site_id: firstSite.site_id,
          company: firstSub?.company_name || "",
          subcontractor_id: firstSub?.subcontractor_id || null,
          contract: firstSite.contract_type || "QUASI_DELEGATION",
          workers: firstSub?.workers?.length
            ? firstSub.workers.map((w) => ({
                ...w,
                start: w.start || "09:00",
                end: w.end || "17:30",
              }))
            : [{ name: "", start: "09:00", end: "17:30" }],
        },
      ]);
    }
    } catch (err) {
      console.error("Error fetching construction sites:", err);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [allSubcontractors, siteSubcontractors, allSegments]);

  const addCompany = () => {
    if (constructionSites.length === 0) {
      alert("No available construction sites");
      return;
    }

    const firstSite = constructionSites[0];
    const contractType = sites?.contract_type || "QUASI_DELEGATION";

   const matchedSegment = allSegments.find(
      (s) => Number(s.site_id) === Number(firstSite.site_id)
    );

    const segmentId = matchedSegment?.segment_id || null;

    setCompanies((prev) => [
      ...prev,
      {
        site_name: firstSite.site_name,
        site_id: firstSite.site_id,
        segment_id: segmentId,
        company: "",
        subcontractor_id: null,
        contract: contractType,
        workers: [{ name: "", start: "09:00", end: "17:30" }],
        id: null,
      },
    ]);
  };

  const deleteCompanyApi = async (companyIndex) => {
    const company = companies[companyIndex];
    if (!company.id) {
      deleteCompany(companyIndex);
      return;
    }
    try {
      await siteSubContractorApi.delete(company.id);
      deleteCompany(companyIndex);
    } catch (err) {
      console.error("Error deleting company:", err);
    }
  };

  const deleteCompany = (companyIndex) => {
    setCompanies((prev) => {
      const updated = [...prev];
      const removed = updated.splice(companyIndex, 1)[0];
      if (removed?.id) {
        setDeletedCompanies((prevDeleted) => [...prevDeleted, removed.id]);
      }
      return updated;
    });
  };

  const addWorker = (companyIndex) => {
    setCompanies((prev) => {
      const updated = [...prev];

      updated[companyIndex].workers.push({
        company_id: null,
        name: "",
        worker_id: null,
        start: "09:00",
        end: "17:30",
        employee_id: null,
        subcontractor_id: null,
      });

      return updated;
    });
  };

  const deleteWorker = (companyIndex, workerIndex) => {
    const worker = companies[companyIndex].workers[workerIndex];

    if (worker.id) {
      setDeletedWorkers((prev) => [...prev, worker.id]);
    }

    setCompanies((prev) =>
      prev.map((company, cIdx) =>
        cIdx === companyIndex
          ? {
              ...company,
              workers: company.workers.filter((_, wIdx) => wIdx !== workerIndex),
            }
          : company
      )
    );
  };

  const bulkSet = (companyIndex, start, end) => {
    setCompanies((prev) => {
      const updated = [...prev];
      updated[companyIndex].workers = updated[companyIndex].workers.map((w) => ({
        ...w,
        start,
        end,
      }));
      return updated;
    });
  };

  const saveCompany = async (company) => {
    try {
      if (!company.site_name?.trim()) return;
      if (!company.workers.length) return;

      const today = new Date().toISOString().split("T")[0];
      
      for (const worker of company.workers) {
        if (!worker.name?.trim()) continue;
        if (!company.segment_id) {
          console.error("Missing segment_id:", company);
          continue;
        }
        const payload = {
          attendance_id: attendance.attendance_id,
          segment_id: company.segment_id,
          company_id: company.subcontractor_id,
          company_name: company.company,
          employee_id: loggedInUser.employee_id,
          worker_id: worker.worker_id || null,
          worker_name: worker.name,
          site_id: company.site_id,
          site_name: company.site_name,
          contract_type: company.contract || "QUASI_DELEGATION",
          start_time: `${today}T${worker.start}:00`,
          end_time: `${today}T${worker.end}:00`,
        };

        console.log("Payload to backend:", payload);

        if (worker.id) {
          await attendanceSubcontractorSegment.update(worker.id, payload);
        } else {
          const res = await attendanceSubcontractorSegment.create(payload);

          worker.id = res?.data?.id || res?.data?.data?.id;
          worker.segment_id = company.segment_id;
        }
      }
    } catch (err) {
      console.error("Error saving company report:", err);
      alert("Error saving company report. Please check worker data.");
    }
  };

  const handleNext = async () => {
    if (location.state?.from !== "subcontractor") {
      navigate("/transportation-expenses");
      return;
    }

    setLoading(true);

    try {
      const validCompanies = companies.filter(
        (c) =>
          constructionSites.some((site) => site.site_id === c.site_id) &&
          (c.company?.trim() || c.subcontractor_id)
      );

      for (const company of validCompanies) {
        if (!company.workers.length) {
          alert(`Please add at least one worker for "${company.company}".`);
          setLoading(false);
          return;
        }

        const hasEmptyWorker = company.workers.some((w) => !w.name?.trim());
        if (hasEmptyWorker) {
          alert(`All workers must have a name for "${company.company}".`);
          setLoading(false);
          return;
        }
      }

      for (const workerId of deletedWorkers) {
        await attendanceSubcontractorSegment.delete(workerId);
      }

      for (const company of validCompanies) {
        await saveCompany(company);
      }

      setDeletedWorkers([]);
      onRefetch?.();
      alert("Update successful!");
    } catch (err) {
      console.error(err);
      alert("Error updating data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full p-6 space-y-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Subcontractor Report</h1>
        </div>

        <div className="space-y-6">
          {location.state?.from === "subcontractor" &&
            companies
              .filter((company) =>
                constructionSites.some((site) => site.site_id === company.site_id)
              )
            .map((company, cIndex) => {
              const currentSite = constructionSites.find(
                (site) => site.site_id === company.site_id
              );

              const companyOptions =
                currentSite?.subcontractors?.map((sub) => sub.company_name) || [];

              const selectedSubcontractor = currentSite?.subcontractors?.find(
                (sub) => sub.company_name === company.company
              );

              return (
                <div key={cIndex} className="border rounded-xl p-4 space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Site: <span className="font-medium">{company.site_name}</span>
                  </p>

                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-600">Company</label>
                    <button
                      onClick={() => deleteCompanyApi(cIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <Autocomplete
                    freeSolo
                    options={companyOptions}
                    value={company.company || null}
                    onChange={(e, newValue) => {
                      const updated = [...companies];
                      const selectedSub = currentSite?.subcontractors?.find(
                        (sub) => sub.company_name === newValue
                      );
                      const matchedSegment = allSegments.find(
                        (s) => Number(s.site_id) === Number(currentSite.site_id)
                      );
                      updated[cIndex].company = newValue || "";
                      updated[cIndex].subcontractor_id = selectedSub?.subcontractor_id || null;

                      updated[cIndex].segment_id = matchedSegment?.segment_id || company.segment_id || null;
                      setCompanies(updated);
                    }}
                    onInputChange={(e, newInputValue) => {
                      const updated = [...companies];
                      updated[cIndex].company = newInputValue || "";

                      const selectedSub = currentSite?.subcontractors?.find(
                        (sub) => sub.company_name === newInputValue
                      );
                      updated[cIndex].subcontractor_id = selectedSub?.subcontractor_id || null;

                      // DO NOT auto-fill worker names anymore
                      setCompanies(updated);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select Company"
                        size="small"
                        fullWidth
                      />
                    )}
                  />

                  <div className="mt-2">
                    <label className="text-sm text-gray-600">Contract Type</label>
                    <p className="text-sm">{company.contract}</p>
                  </div>

                  <div className="space-y-3 mt-2">
                    {company.workers.map((worker, wIndex) => {
                      const selectedWorkerIds = company.workers
                        .filter((_, idx) => idx !== wIndex)
                        .map((w) => w.worker_id)
                        .filter(Boolean);

                      const workerOptions =
                        selectedSubcontractor?.workers?.filter(
                          (option) => !selectedWorkerIds.includes(option.worker_id)
                        ) || [];
                      console.log(workerOptions)
                      return (
                        <div key={wIndex} className="relative border rounded-lg p-2">
                          <div className="flex flex-col gap-1">
                            {company.workers.length > 1 && (
                              <button
                                onClick={() => deleteWorker(cIndex, wIndex)}
                                className="text-red-500 hover:text-red-700 place-self-end"
                              >
                                <X size={18} />
                              </button>
                            )}

                            <Autocomplete
  freeSolo
  options={workerOptions}
  getOptionLabel={(option) =>
    typeof option === "string" ? option : option.name || ""
  }
  value={worker.name || null}
  onChange={(e, newValue) => {
    const updated = [...companies];
    updated[cIndex].workers[wIndex].name =
      typeof newValue === "string" ? newValue : newValue?.name || "";

    // If using worker_id
    updated[cIndex].workers[wIndex].worker_id =
      typeof newValue === "string" ? null : newValue?.worker_id || null;

    setCompanies(updated);
  }}
  onInputChange={(e, newInputValue) => {
    const updated = [...companies];
    updated[cIndex].workers[wIndex].name = newInputValue || "";
    updated[cIndex].workers[wIndex].worker_id = null;
    setCompanies(updated);
  }}
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
                                onChange={(e) => {
                                  const updated = [...companies];
                                  updated[cIndex].workers[wIndex].start = e.target.value;
                                  setCompanies(updated);
                                }}
                                className="w-full outline-none text-sm min-w-0"
                              />
                            </div>

                            <div className="flex items-center border rounded-lg px-2 py-1 flex-1 min-w-0">
                              <Clock size={16} className="mr-1 text-gray-400" />
                              <input
                                type="time"
                                value={worker.end}
                                onChange={(e) => {
                                  const updated = [...companies];
                                  updated[cIndex].workers[wIndex].end = e.target.value;
                                  setCompanies(updated);
                                }}
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
                      onClick={() => addWorker(cIndex)}
                      className="text-green-600 text-sm flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Worker
                    </button>

                    <button
                      onClick={() => bulkSet(cIndex, "09:00", "18:00")}
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

          {companies.filter(
              (company) =>
                company.site_id &&
                constructionSites.some((site) => site.site_id === company.site_id)
            )
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
    </div>
  );
}

export default SubContractor;