import React, { useState } from "react";
import { X, Clock, Plus } from "lucide-react";
import Button from "../Button";

function SubContractorModal({
  open,
  setOpen,
  sites,
  employeeId,
  attendanceId,
  onRefetch,
  expenses,
  openTransportModalParent, // parent setter for Transportation modal
}) {
  const [companies, setCompanies] = useState([
    {
      company: "",
      contract: "QUASI_DELEGATION",
      workers: [{ name: "", start: "09:00", end: "17:30" }],
    },
  ]);

  if (!open) return null;

  const addWorker = (companyIndex) => {
    const updated = [...companies];
    updated[companyIndex].workers.push({ name: "", start: "09:00", end: "17:30" });
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
      { company: "", contract: "QUASI_DELEGATION", workers: [{ name: "", start: "09:00", end: "17:30" }] },
    ]);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
      />
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Subcontractor Report</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Site: <span className="font-medium">Site A</span>
        </p>

        <div className="space-y-6">
          {companies.map((company, cIndex) => (
            <div key={cIndex} className="border rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-600">Company</label>
                <button
                  onClick={() => deleteCompany(cIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>

              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={company.company}
                onChange={(e) => {
                  const updated = [...companies];
                  updated[cIndex].company = e.target.value;
                  setCompanies(updated);
                }}
              >
                <option value="">Select company</option>
                <option>○○ Electrical</option>
                <option>△△ Construction</option>
              </select>

              {/* Contract Type */}
              <div className="flex flex-col mt-1">
                <label className="text-sm text-gray-600">Contract Type</label>
                <select
                  className="w-full border rounded-lg p-2 mt-1 text-sm"
                  value={company.contract}
                  onChange={(e) => {
                    const updated = [...companies];
                    updated[cIndex].contract = e.target.value;
                    setCompanies(updated);
                  }}
                >
                  <option value="QUASI_DELEGATION">Quasi-delegation</option>
                  <option value="FIXED_PRICE">Fixed price</option>
                </select>
              </div>

              {/* Workers */}
              <div className="space-y-3 mt-2">
                {company.workers.map((worker, wIndex) => (
                  <div key={wIndex} className="flex items-center gap-2 w-full">
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        placeholder="Worker name"
                        value={worker.name}
                        onChange={(e) => {
                          const updated = [...companies];
                          updated[cIndex].workers[wIndex].name = e.target.value;
                          setCompanies(updated);
                        }}
                        className="w-full border rounded-lg p-2"
                      />
                      <div className="flex gap-2">
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

                    {company.workers.length > 1 && (
                      <button
                        onClick={() => deleteWorker(cIndex, wIndex)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Worker Actions */}
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
          ))}
        </div>

        {/* Add Company */}
        <button
          onClick={addCompany}
          className="mt-4 text-green-600 flex items-center gap-1 text-sm"
        >
          <Plus size={16} /> Add Another Company
        </button>

        {/* Display Entered */}
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
            text="Next (Transportation)"
            onClick={() => {
              setOpen(false);                  // close Subcontractor modal
              openTransportModalParent(true);  // open Transportation modal in parent
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