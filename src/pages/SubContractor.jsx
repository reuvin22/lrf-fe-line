import React, { useState, useEffect } from "react";
import { X, Clock, Plus } from "lucide-react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import Button from "../components/Button";
import {
  attendanceApi,
  siteSubContractorApi,
  subContractorApi,
} from "../api/Api";
import { useNavigate } from "react-router-dom";

function SubContractor({ sites, constructionSite, subContractor = [], onRefetch }) {
  const [companies, setCompanies] = useState([]);
  const [allSubcontractors, setAllSubcontractors] = useState([]);
  const [siteSubcontractors, setSiteSubcontractors] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const fetchSegment = async () => {
    try {
      const res = await attendanceApi.getAll();
      const attendanceList = res.data.data || [];

      const allSegments = attendanceList.flatMap(
        (attendance) => attendance.segments || []
      );

      const validSegments = allSegments.filter(
        (segment) => segment.site_name && segment.site_name.trim() !== ""
      );

      const mapped = validSegments.map((segment) => ({
        site_name: segment.site_name,
        site_id: Number(segment.site_id),
        company: "",
        contract: sites?.contract_type || "QUASI_DELEGATION",
        workers: [{ name: "", start: "09:00", end: "17:30" }],
        id: null,
      }));

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

  // ================= FILTER =================

  const computeData = (companiesList, allSubs, siteSubs) => {
    if (!companiesList.length || !allSubs.length || !siteSubs.length) return;

    const companySiteIds = companiesList.map((c) => Number(c.site_id));

    const filteredSiteSubs = siteSubs.filter((v) =>
      companySiteIds.includes(Number(v.site_id))
    );

    const subcontractorIds = [
      ...new Set(filteredSiteSubs.map((v) => v.subcontractor_id)),
    ];

    const sub = allSubs.filter((v) =>
      subcontractorIds.includes(v.subcontractor_id)
    );

    setData(sub);
  };

  // ================= INIT =================

  useEffect(() => {
    const init = async () => {
      const [companiesRes, subsRes, siteSubsRes] = await Promise.all([
        fetchSegment(),
        fetchCompanies(),
        fetchSiteSubcontractor(),
      ]);

      computeData(companiesRes, subsRes, siteSubsRes);
    };

    init();
  }, []);

  // ================= WORKERS =================

  const addWorker = (companyIndex) => {
    const updated = [...companies];
    updated[companyIndex].workers.push({
      name: "",
      start: "09:00",
      end: "17:30",
    });
    setCompanies(updated);
  };

  const deleteWorker = (companyIndex, workerIndex) => {
    const updated = [...companies];
    if (updated[companyIndex].workers.length > 1) {
      updated[companyIndex].workers.splice(workerIndex, 1);
      setCompanies(updated);
    }
  };

  const addCompany = () => {
    if (!constructionSite?.name?.trim()) return;

    setCompanies([
      ...companies,
      {
        site_name: constructionSite.name,
        site_id: constructionSite.id,
        company: "",
        contract: sites?.contract_type || "QUASI_DELEGATION",
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
    const updated = [...companies];
    updated.splice(companyIndex, 1);
    setCompanies(updated);
  };

  const bulkSet = (companyIndex, start, end) => {
    const updated = [...companies];
    updated[companyIndex].workers = updated[companyIndex].workers.map((w) => ({
      ...w,
      start,
      end,
    }));
    setCompanies(updated);
  };

  // ================= SAVE =================

  const saveCompany = async (company) => {
    try {
      if (!company.site_name?.trim()) return;

      const sub = data.find((s) => s.company_name === company.company);
      if (!sub) return;

      const payload = {
        site_id: company.site_id,
        subcontractor_id: sub.subcontractor_id,
        contract_type: company.contract,
      };

      if (company.id) {
        await siteSubContractorApi.update(company.id, payload);
      } else {
        const { data } = await siteSubContractorApi.create(payload);
        company.id = data.id;
      }
    } catch (err) {
      console.error("Error saving company:", err);
    }
  };

    const handleNext = async () => {
    setLoading(true); // Start loading

    try {
        // Validate all companies and workers
        for (const company of companies) {
        if (!company.site_name?.trim() || !company.company?.trim()) {
            alert("Error: Please fill in all company names.");
            setLoading(false);
            return;
        }

        if (!company.workers.length || company.workers.some((w) => !w.name?.trim())) {
            alert(`Error: All workers must have a name for company "${company.company}".`);
            setLoading(false);
            return;
        }

        const subExists = data.find((s) => s.company_name === company.company);
        if (!subExists) {
            alert(`Error: Selected company "${company.company}" does not exist in subcontractor data.`);
            setLoading(false);
            return;
        }
        }

        // Save each company
        for (const company of companies) {
        await saveCompany(company);
        }

        onRefetch?.();
        navigate("/transportation-expenses");
    } catch (err) {
        console.error(err);
        alert("Error saving data. Please try again.");
    } finally {
        setLoading(false); // Stop loading
    }
    };
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full p-6 space-y-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Subcontractor Report</h1>
        </div>

        <div className="space-y-6">
          {companies.map((company, cIndex) => {
            const selectedCompanyNames = companies
              .map((c) => c.company)
              .filter((name, i) => name && i !== cIndex);

            const companyOptions = [
              ...new Set(
                data
                  .map((c) => c.company_name)
                  .filter((name) => !selectedCompanyNames.includes(name))
              ),
            ];

            const selectedCompany = data.find(
              (c) => c.company_name === company.company
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
                  options={companyOptions}
                  value={company.company}
                  onChange={(e, newValue) => {
                    const updated = [...companies];
                    updated[cIndex].company = newValue || "";
                    updated[cIndex].workers = [
                      { name: "", start: "09:00", end: "17:30" },
                    ];
                    updated[cIndex].contract =
                      sites?.contract_type || "QUASI_DELEGATION";
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
                    const allWorkerNames =
                      selectedCompany?.workers?.map((w) => w.name) || [];
                    const selectedNames = company.workers
                      .map((w, i) => (i !== wIndex ? w.name : null))
                      .filter(Boolean);
                    const workerOptions = allWorkerNames.filter(
                      (name) => !selectedNames.includes(name)
                    );

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
                            value={worker.name}
                            onInputChange={(e, newValue) => {
                              const updated = [...companies];
                              updated[cIndex].workers[wIndex].name = newValue;
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

          {companies.map((company, cIndex) => (
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
                loading={loading} // this disables the button automatically
                text={
                    <div className="flex items-center justify-center gap-2">
                    {loading && <CircularProgress size={18} color="inherit" />}
                    <span>Next (Transportation)</span>
                    </div>
                }
            />
            <Button
            buttonStyle="default"
            text="Skip"
            onClick={() => navigate("/transportation-expenses")}
            customButton="flex-1"
            />
        </div>
      </div>
    </div>
  );
}

export default SubContractor;