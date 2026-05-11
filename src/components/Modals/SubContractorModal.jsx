import React, { useState, useEffect } from "react";
import { X, Clock, Plus } from "lucide-react";
import Button from "../Button";
import { Autocomplete, TextField } from "@mui/material";
import { siteSubContractorApi } from "../../api/Api";

function SubContractorModal({
  open,
  setOpen,
  sites,
  openTransportModalParent,
  constructionSite,
  subContractor = [],
  siteSubcontractor = [],
  onRefetch,
}) {
  const [companies, setCompanies] = useState([
    {
      company: "",
      contract: sites?.contract_type || "QUASI_DELEGATION",
      workers: [{ name: "", start: "09:00", end: "17:30" }],
      id: null,
    },
  ]);

  const companyOptions = subContractor.map((c) => c.company_name) || [];

  const fetchCompanies = async (siteId) => {
    try {
      const { data } = await siteSubContractorApi.getAll({ site_id: siteId });

      const mapped = data.map((item) => {
        const sub = subContractor.find(
          (s) => s.subcontractor_id === item.subcontractor_id
        );

        return {
          company: sub?.company_name || "",
          contract: item.contract_type,
          workers:
            sub?.workers?.map((w) => ({
              name: w.name || "",
              start: "09:00",
              end: "17:30",
            })) || [{ name: "", start: "09:00", end: "17:30" }],
          id: item.id,
        };
      });

      if (mapped.length) {
        setCompanies(mapped);
      }
    } catch (err) {
      console.error("Error fetching subcontractors:", err);
    }
  };

  useEffect(() => {
    if (open && constructionSite?.id) {
      fetchCompanies(constructionSite.id);
    }
  }, [open, constructionSite]);

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
    setCompanies([
      ...companies,
      {
        company: "",
        contract: sites?.contract_type || "QUASI_DELEGATION",
        workers: [{ name: "", start: "09:00", end: "17:30" }],
        id: null,
      },
    ]);
  };

  const deleteCompany = (companyIndex) => {
    const updated = [...companies];
    updated.splice(companyIndex, 1);
    setCompanies(updated);
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

  const bulkSet = (companyIndex, start, end) => {
    const updated = [...companies];
    updated[companyIndex].workers = updated[companyIndex].workers.map((w) => ({
      ...w,
      start,
      end,
    }));
    setCompanies(updated);
  };

  const saveCompany = async (company) => {
    try {
      const sub = subContractor.find(
        (s) => s.company_name === company.company
      );
      if (!sub) return;

      const payload = {
        site_id: constructionSite.id,
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
      />

      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">
            Subcontractor Report
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={22} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Site:{" "}
          <span className="font-medium">
            {constructionSite?.name || "Site"}
          </span>
        </p>

        <div className="space-y-6">
          {companies.map((company, cIndex) => {
            const workerOptions =
              subContractor
                .find((c) => c.company_name === company.company)
                ?.workers?.map((w) => w.name) || [];

            return (
              <div
                key={cIndex}
                className="border rounded-xl p-4 space-y-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-600">
                    Company
                  </label>
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
                      sites?.contract_type ||
                      "QUASI_DELEGATION";
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
                  <label className="text-sm text-gray-600">
                    Contract Type
                  </label>
                  <p className="text-sm">{company.contract}</p>
                </div>

                <div className="space-y-3 mt-2">
                  {company.workers.map((worker, wIndex) => (
                    <div
                      key={wIndex}
                      className="relative border rounded-lg p-2"
                    >
                      <div className="flex flex-col gap-1">
                        {company.workers.length > 1 && (
                          <button
                            onClick={() =>
                              deleteWorker(cIndex, wIndex)
                            }
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
                            updated[cIndex].workers[wIndex].name =
                              newValue;
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
                        <div className="flex items-center border rounded-lg px-2 py-1 flex-1">
                          <Clock
                            size={16}
                            className="mr-1 text-gray-400"
                          />
                          <input
                            type="time"
                            value={worker.start}
                            onChange={(e) => {
                              const updated = [...companies];
                              updated[cIndex].workers[wIndex].start =
                                e.target.value;
                              setCompanies(updated);
                            }}
                            className="w-full outline-none text-sm"
                          />
                        </div>

                        <div className="flex items-center border rounded-lg px-2 py-1 flex-1">
                          <Clock
                            size={16}
                            className="mr-1 text-gray-400"
                          />
                          <input
                            type="time"
                            value={worker.end}
                            onChange={(e) => {
                              const updated = [...companies];
                              updated[cIndex].workers[wIndex].end =
                                e.target.value;
                              setCompanies(updated);
                            }}
                            className="w-full outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => addWorker(cIndex)}
                    className="text-green-600 text-sm flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Worker
                  </button>

                  <button
                    onClick={() =>
                      bulkSet(cIndex, "09:00", "18:00")
                    }
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
            text="Save"
            onClick={async () => {
              for (const company of companies) {
                await saveCompany(company);
              }
              onRefetch?.();
              setOpen(false);
            }}
            customButton="flex-1"
          />

          <Button
            buttonStyle="active"
            text="Next (Transportation)"
            onClick={() => {
              setOpen(false);
              openTransportModalParent(true);
            }}
            customButton="flex-1"
          />

          <Button
            buttonStyle="secondary"
            text="Skip"
            onClick={() => setOpen(false)}
            customButton="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

export default SubContractorModal;