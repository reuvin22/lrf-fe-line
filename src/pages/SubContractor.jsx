import React, { useState, useEffect } from "react";
import { X, Clock, Plus } from "lucide-react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import Button from "../components/Button";
import LocationModal from "../components/Modals/LocationModal";
import {
  attendanceApi,
  attendanceSubcontractorSegmentApi,
  constructionSiteApi,
  getAttendanceSubcontractor,
  siteSubContractorApi,
  subContractorApi,
  subContractorReportApi,
} from "../api/Api";
import { useLocation, useNavigate } from "react-router-dom";
import { useAttendanceContext } from "../context/AttendanceContext";
import { useLocationContext } from "../context/LocationContext";
import { toast } from "react-toastify";

function SubContractor({ sites, constructionSite, subContractor = [], onRefetch }) {
  const [companies, setCompanies] = useState([]);
  const [allSubcontractors, setAllSubcontractors] = useState([]);
  const [siteSubcontractors, setSiteSubcontractors] = useState([]);
  const [data, setData] = useState([]);
  const [constructionSites, setConstructionSites] = useState([]);
  const [allSegments, setAllSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletedWorkers, setDeletedWorkers] = useState([]);
  const [openSitePicker, setOpenSitePicker] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { attendance, employee } = useAttendanceContext();
  const { sites: assignedSites } = useLocationContext();

  const generateTempWorkerId = () => {
    return Date.now() + Math.floor(Math.random() * 1000);
  };
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

        const groupedBySiteCompany = {};

        matchedSubs.forEach((sub) => {
          const key = `${s.site_id}-${sub.company_id}`; // group by site + company

          if (!groupedBySiteCompany[key]) {
            groupedBySiteCompany[key] = {
              site_name: s.site_name,
              site_id: Number(s.site_id),
              segment_id: sub.segment_id,
              segment_ids: [],
              attendance_ids: [],
              company: sub.company_name,
              subcontractor_id: sub.company_id,
              workers: [],
              contract: sub.contract_type || "QUASI_DELEGATION",
            };
          }

          groupedBySiteCompany[key].segment_ids.push(sub.segment_id);
          groupedBySiteCompany[key].attendance_ids.push(sub.attendance_id);

          groupedBySiteCompany[key].workers.push({
            id: sub.id,
            name: sub.worker_name,
            worker_id: sub.worker_id,
            start: sub.start_time?.slice(11, 16),
            end: sub.end_time?.slice(11, 16),
          });
        });

        return Object.values(groupedBySiteCompany);
      });

      setCompanies(mapped);
      return mapped;
    } catch (err) {
      console.error("Error fetching segments:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchSegment();
  }, []);

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

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  useEffect(() => {
    fetchSiteSubcontractor();
  }, []);

  const computeData = (companiesList, allSubs, siteSubs) => {
    if (!companiesList.length || !allSubs.length || !siteSubs.length) return;

    const companySiteIds = companiesList.map((c) => Number(c.site_id));
    const filteredSiteSubs = siteSubs.filter((v) =>
      companySiteIds.includes(Number(v.site_id))
    );

    const sitesWithCompanies = companiesList.map((company) => {
      const matchingSiteSubs = filteredSiteSubs.filter(
        (ss) => ss.site_id === company.site_id
      );

      const companiesForSite = matchingSiteSubs.map((ss) => {
        const sub = allSubs.find((s) => s.subcontractor_id === ss.subcontractor_id);
        return {
          ...sub,
          workers: [{ name: "", start: "09:00", end: "17:30" }],
          pivot: ss,
          company_id: sub?.subcontractor_id,
          company_name:
            location.state?.from === "subcontractor" ? sub?.company_name || "" : "",
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
  }, [location.state]);

  const fetchAttendanceSubcontractor = async () => {
    try {
      const res = await getAttendanceSubcontractor.getAll({
        employee_id: employee?.employee_id,
      });

      const raw = res.data.data || [];

      const grouped = {};

      raw.forEach((item) => {
        const key = `${item.site.site_id}-${item.subcontractor.subcontractor_id}`;

        if (!grouped[key]) {
          grouped[key] = {
            site_name: item.site.site_name,
            site_id: item.site.site_id,
            company: item.subcontractor.company_name,
            subcontractor_id: item.subcontractor.subcontractor_id,
            contract: item.contract_type,
            workers: [],
          };
        }

        grouped[key].workers.push({
          id: item.id,
          name: item.worker.name,
          worker_id: item.worker.worker_id,
          start: item.start_time?.slice(11, 16),
          end: item.end_time?.slice(11, 16),
        });
      });

      const formatted = Object.values(grouped);

      setCompanies(formatted);
    } catch (err) {
      console.error("Error failed: ", err);
    }
  };

  useEffect(() => {
    fetchAttendanceSubcontractor();
  }, []);

  useEffect(() => {
    subContractorApi.getAll().then((res) => {
      setAllSubcontractors(res.data.data || []);
    });

    siteSubContractorApi.getAll().then((res) => {
      setSiteSubcontractors(res.data.data || []);
    });

    attendanceApi.getAll().then((res) => {
      const attendanceList = res.data.data || [];
      const segments = attendanceList.flatMap((a) => a.segments || []);
      setAllSegments(segments);
    });
  }, []);

  useEffect(() => {
    const fetchSites = async () => {
      const res = await constructionSiteApi.getAll();
      const sitesList = res.data.data || [];

      const filteredSites = sitesList.map((site) => {
        const subcontractorsForSite = siteSubcontractors
          .filter((ss) => Number(ss.site_id) === Number(site.site_id))
          .map((ss) => {
            const sub = allSubcontractors.find(
              (s) => Number(s.subcontractor_id) === Number(ss.subcontractor_id)
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
    };

    fetchSites();
  }, [allSubcontractors, siteSubcontractors]);

  // =========================
  // ✅ FIX: HYDRATE WORKERS IN EDIT MODE
  // =========================
  useEffect(() => {
    if (location.state?.from !== "subcontractor") return;
    if (!constructionSites.length || !companies.length) return;

    setCompanies((prev) =>
      prev.map((company) => {
        const site = constructionSites.find(
          (s) => Number(s.site_id) === Number(company.site_id)
        );

        const matchedSub = site?.subcontractors?.find(
          (s) =>
            Number(s.subcontractor_id) ===
            Number(company.subcontractor_id)
        );

        return {
          ...company
        };
      })
    );
  }, [constructionSites, companies.length]);


  const deduplicateCompanies = (companiesList) => {
    const seen = new Set();
    return companiesList.filter((company) => {
      if (seen.has(company.site_name)) return false;
      seen.add(company.site_name);
      return true;
    });
  };

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
                (seg) =>
                  Number(seg.site_id) === Number(site.site_id) &&
                  Number(seg.segment_id) === Number(ss.segment_id)
              );

              return {
                ...sub,
                company_name: sub?.company_name || "",
                subcontractor_id: sub?.subcontractor_id,
                workers: sub?.workers || [],
                segment_ids: matchedSegment ? [matchedSegment.segment_id] : [],
                segments: matchedSegment ? [matchedSegment] : [],
              };
            });

          return {
            ...site,
            subcontractors: subcontractorsForSite,
          };
        });

      setConstructionSites(filteredSites);

      const isEditMode = location.state?.from === "subcontractor";

      const allCompanies = filteredSites.flatMap((site) =>
        site.subcontractors.length
          ? site.subcontractors.map((sub) => ({
              site_name: site.site_name,
              site_id: site.site_id,

              // ✅ FIX HERE
              company: isEditMode ? sub?.company_name || "" : "",

              subcontractor_id: isEditMode ? sub?.subcontractor_id || null : null,

              contract: site.contract_type || "QUASI_DELEGATION",
              workers: [
                {
                  name: "",
                  worker_id: null,
                  start: "09:00",
                  end: "17:30",
                },
              ],
              segments: sub.segment_ids,
            }))
          : [
              {
                site_name: site.site_name,
                site_id: site.site_id,

                // ✅ also here
                company: "",
                subcontractor_id: null,

                contract: site.contract_type || "QUASI_DELEGATION",
                workers: [{ name: "", start: "09:00", end: "17:30" }],
                segments: [],
              },
            ]
      );
      setCompanies(deduplicateCompanies(allCompanies));
    } catch (err) {
      console.error("Error fetching construction sites:", err);
    }
  };

  useEffect(() => {
    if (location.state?.from === "subcontractor") return;
    fetchSites();
  }, [allSubcontractors, siteSubcontractors, allSegments]);

  const addCompany = () => {
    if (assignedSites.length === 0 && constructionSites.length === 0) {
      toast.error("No available construction sites");
      return;
    }
    setOpenSitePicker(true);
  };

  const handleSiteSelect = (site) => {
    const contractType = constructionSites.find(
      (s) => Number(s.site_id) === Number(site.site_id)
    )?.contract_type || "QUASI_DELEGATION";

    const matchedSegment = allSegments.find(
      (s) => Number(s.site_id) === Number(site.site_id)
    );

    setCompanies((prev) => [
      ...prev,
      {
        site_name: site.site_name,
        site_id: site.site_id,
        segment_id: matchedSegment?.segment_id || null,
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

      // ✅ KEY FIX: collect ALL worker IDs from removed company
      if (removed?.workers?.length) {
        const workerIdsToDelete = removed.workers
          .filter((w) => w.id)
          .map((w) => w.id);

        setDeletedWorkers((prevDeleted) => [
          ...prevDeleted,
          ...workerIdsToDelete,
        ]);
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

  const ensureSegment = async (company) => {
    let segmentId =
      company.segment_id ||
      (Array.isArray(company.segment_ids) ? company.segment_ids[0] : null);
    if (segmentId) return segmentId;
    const matchedSegment = allSegments.find(
      (s) => Number(s.site_id) === Number(company.site_id)
    );

    if (matchedSegment) {
      return matchedSegment.segment_id;
    }
    console.error("❌ No segment found for site:", company.site_name);
    return null;
  };

const saveCompany = async (company) => {
  try {
    if (!company.site_name?.trim()) return;
    if (!company.workers?.length) return;

    const today = new Date().toISOString().split("T")[0];

    const segmentId = await ensureSegment(company);

    if (!segmentId) {
      throw new Error(`Missing segment for site "${company.site_name}"`);
    }

    for (const worker of company.workers) {
      if (!worker.name?.trim()) {
        throw new Error(`Worker name is required for site "${company.site_name}"`);
      }

      if (!company.subcontractor_id) {
        throw new Error(`Company must be selected for site "${company.site_name}"`);
      }

      if (!worker.start || !worker.end) {
        throw new Error(`Start/End time required for "${worker.name}"`);
      }

      const payload = {
        attendance_id: attendance?.attendance_id, // ✅ FIX
        segment_id: segmentId,

        company_id: company.subcontractor_id,
        company_name: company.company?.trim(),

        employee_id: employee?.employee_id,
        worker_id: worker.worker_id,
        worker_name: worker.name,

        site_id: company.site_id,
        site_name: company.site_name,

        contract_type: company.contract || "QUASI_DELEGATION",

        start_time: `${today}T${worker.start}:00`,
        end_time: `${today}T${worker.end}:00`,
      };

      console.log("✅ FINAL PAYLOAD:", payload);

      if (worker.id) {
        await attendanceSubcontractorSegmentApi.update(worker.id, payload);
      } else {
        const res = await attendanceSubcontractorSegmentApi.create(payload);

        const newId = res?.data?.id || res?.data?.data?.id;

        worker.id = newId;
        worker.segment_id = segmentId;
      }
    }
  } catch (err) {
    console.error("❌ Error saving company report:", err.message);
    toast.error(err.message);
  }
};

  const handleNext = async () => {
    const isEditMode = location.state?.from === "subcontractor";
    setLoading(true);

    try {
      let validCompanies = companies.filter(
        (c) =>
          constructionSites.some((site) => site.site_id === c.site_id) &&
          (c.company?.trim() || c.subcontractor_id || c.workers?.length)
      );
      validCompanies = mergeDuplicateCompanies(validCompanies);
      console.log("✅ Valid companies:", validCompanies);
      for (const company of validCompanies) {
        if (!company.workers.length) {
          toast.error(`Please add at least one worker for "${company.company}".`);
          setLoading(false);
          return;
        }

        const hasEmptyWorker = company.workers.some((w) => !w.name?.trim());
        if (hasEmptyWorker) {
          toast.error(`All workers must have a name for "${company.company}".`);
          setLoading(false);
          return;
        }
      }

      for (const workerId of deletedWorkers) {
        console.log("🗑️ Deleting worker:", workerId);
        await attendanceSubcontractorSegmentApi.delete(workerId);
      }

      for (const company of validCompanies) {
        console.log("📦 Saving company:", company);
        await saveCompany(company);
      }

      setDeletedWorkers([]);

      console.log("🎉 All companies saved");

      onRefetch?.();
      toast.success("Saved successfully!");
      if (isEditMode) {
        navigate("/calendar/detail");
      } else {
        navigate("/transportation-expenses");
      }

    } catch (err) {
      console.error("❌ Error in handleNext:", err);
      toast.error("Error updating data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mergeDuplicateCompanies = (companiesList) => {
    const map = {};

    companiesList.forEach((company) => {
      const key = `${company.site_id}-${company.subcontractor_id || company.company}`;

      if (!map[key]) {
        map[key] = { ...company, workers: [...company.workers] };
      } else {
        // ✅ merge workers instead of creating new company
        map[key].workers = [...map[key].workers, ...company.workers];
      }
    });

    return Object.values(map);
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
              return constructionSites.some((site) => site.site_id === company.site_id);
            })
            .map((company, cIndex) => {
              const currentSite = constructionSites.find(
                (site) => site.site_id === company.site_id
              );

              const alreadySelectedCompanies = companies
                .filter((c, i) => i !== cIndex && c.site_id === company.site_id && c.company)
                .map((c) => c.company);

              const companyOptions = (
                currentSite?.subcontractors?.map((sub) => sub.company_name) || []
              ).filter((name) => !alreadySelectedCompanies.includes(name));

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
                    value={company.company || ""}
                    onChange={(e, newValue) => {
                      const updated = [...companies];

                      const selectedSub = currentSite?.subcontractors?.find(
                        (sub) => sub.company_name === newValue
                      );

                      const isFromList = !!selectedSub;

                      updated[cIndex].company = newValue || "";

                      if (isFromList) {
                        updated[cIndex].subcontractor_id = selectedSub.subcontractor_id;
                        updated[cIndex].availableWorkers = selectedSub.workers || [];
                      } else {
                        // ✅ NEW COMPANY
                        updated[cIndex].subcontractor_id = null;
                        updated[cIndex].availableWorkers = [];
                      }

                      // ✅ IMPORTANT FIX: CLEAR workers completely
                      updated[cIndex].workers = [
                        {
                          name: "",
                          worker_id: null,
                          start: "09:00",
                          end: "17:30",
                        },
                      ];

                      setCompanies(updated);
                    }}
                    onInputChange={(e, newInputValue) => {
                      const updated = [...companies];

                      updated[cIndex].company = newInputValue || "";

                      // ✅ treat as NEW company
                      updated[cIndex].subcontractor_id = null;
                      updated[cIndex].availableWorkers = [];

                      // ✅ CLEAR worker selection (IMPORTANT)
                      updated[cIndex].workers = [
                        {
                          name: "",
                          worker_id: null,
                          start: "09:00",
                          end: "17:30",
                        },
                      ];

                      setCompanies(updated);
                    }}
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
                    <label className="text-sm text-gray-600">Contract Type</label>
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
                              (w.worker_id && w.worker_id === option.worker_id) ||
                              (!w.worker_id && w.name === option.name)
                          );
                        }) || [];
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
                              key={`${company.company}-${wIndex}`}
                              getOptionLabel={(option) =>
                                typeof option === "string" ? option : option.name || ""
                              }
                              value={worker.name || ""}
                              onChange={(e, newValue) => {
                                const updated = [...companies];

                                if (typeof newValue === "string") {
                                  // ✅ manual input → generate temp ID
                                  updated[cIndex].workers[wIndex].name = newValue;
                                  updated[cIndex].workers[wIndex].worker_id = generateTempWorkerId();
                                } else if (newValue && newValue.worker_id) {
                                  // ✅ selected from list
                                  updated[cIndex].workers[wIndex].name = newValue.name;
                                  updated[cIndex].workers[wIndex].worker_id = newValue.worker_id;
                                } else {
                                  updated[cIndex].workers[wIndex].name = "";
                                  updated[cIndex].workers[wIndex].worker_id = null;
                                }

                                setCompanies(updated);
                              }}
                              onInputChange={(e, newInputValue) => {
                                const updated = [...companies];

                                updated[cIndex].workers[wIndex].name = newInputValue || "";

                                if (newInputValue) {
                                  // ✅ generate temp ID while typing
                                  updated[cIndex].workers[wIndex].worker_id = generateTempWorkerId();
                                } else {
                                  updated[cIndex].workers[wIndex].worker_id = null;
                                }

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

          {companies.filter((company) => {
              if (location.state?.from === "subcontractor") return true;
              return (
                company.site_id &&
                constructionSites.some((site) => site.site_id === company.site_id)
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