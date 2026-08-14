import React, { useState, useEffect } from "react";
import { transportationExpensesApi, siteAssignmentApi } from "../api/Api";
import { useNavigate, useLocation } from "react-router-dom";
import { useAttendanceContext } from "../context/AttendanceContext";
import Button from "../components/Button";
import { toast } from "react-toastify";
import ConfirmationModal from "../components/Modals/ConfirmationModal";
import { isAttendanceEditable } from "../utils/attendanceLock";
import { MOCK_SITE } from "../context/LocationContext";
import environment from "../environment";

function TransportationExpenseScreen({ onDone }) {
  const [amount, setAmount] = useState("");
  const [route, setRoute] = useState("");
  const [site, setSite] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [segmentSites, setSegmentSites] = useState([]);
  const [confirmData, setConfirmData] = useState({
    open: false,
    index: null,
    loading: false,
  });
  const [deletedIds, setDeletedIds] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "default";

  const { attendance, employee, closingDay, selectedDate } = useAttendanceContext();

  useEffect(() => {
    const fetchExistingExpenses = async () => {
      if (!attendance?.attendance_id) return;

      let existingExpenses = [];

      try {
        const res = await transportationExpensesApi.getAll({
          attendance_id: attendance.attendance_id,
        });

        const raw = res?.data?.data || [];

        existingExpenses = raw.map((exp) => {
          const matchedSite = segmentSites.find(
            (s) => String(s.id) === String(exp.site_id)
          );

          return {
            ...exp,
            id: exp.id ?? exp.expense_id,
            isExisting: true,
            site_name: exp.site_name || matchedSite?.name || "-",
          };
        });
      } catch (err) {
        console.error("Failed to fetch transport expenses:", err);
      }

      setExpenses(existingExpenses);
    };

    fetchExistingExpenses();
  }, [attendance, segmentSites, from]);
  useEffect(() => {
    if (!employee?.employee_id) return;

    const fetchAssignedSites = async () => {
      try {
        const res = await siteAssignmentApi.getAll({ employee_id: employee.employee_id });
        const inner = res.data?.data;
        const list = Array.isArray(inner)
          ? inner
          : Array.isArray(inner?.data)
            ? inner.data
            : [];

        const mapped = list
          .filter(v => v != null && String(v.worker_id ?? v.employee_id ?? "") === String(employee.employee_id))
          .map(v => ({
            id: v.site_id ?? v.site?.site_id,
            name: v.site_name ?? v.site?.site_name,
          }))
          .filter(s => s.id != null);

        if (mapped.length === 0 && !environment.VITE_LIFF_ENABLED) {
          setSegmentSites([{ id: MOCK_SITE.site_id, name: MOCK_SITE.site_name }]);
          return;
        }

        setSegmentSites(mapped);
      } catch (err) {
        console.error("Failed to fetch assigned sites:", err);
      }
    };

    fetchAssignedSites();
  }, [employee]);

  const isEditingFromCalendar = from === "calendar-detail";
  const editable = isAttendanceEditable(attendance?.work_date || selectedDate, closingDay);

  const handleRedirect = () => {
    if (from === "calendar-detail") {
      navigate("/calendar/detail");
    } else {
      navigate("/");
    }
  };

  const handleAdd = () => {
    if (!amount || !site) {
      toast.error("Amount and Site are required");
      return;
    }

    if (!attendance?.attendance_id || !attendance?.employee_id) {
      toast.error("System error: attendance not ready");
      return;
    }

    const selectedSiteId = Number(site);
    console.log("Selected site ID:", selectedSiteId);
    console.log("Available segmentSites IDs:", segmentSites.map(s => s.id));

    const selectedSite = segmentSites.find((s) => String(s.id) === site);
    if (!selectedSite) {
      toast.error("Selected site is invalid. Please select a site from the dropdown.");
      return;
    }

    if (editingExpense) {
      // Update existing expense in place
      setExpenses((prev) => [...prev, {
        ...editingExpense,
        amount: Number(amount),
        route: route || null,
        site_id: selectedSite.id,
        site_name: selectedSite.name,
        isUpdated: true,
      }]);
      setEditingExpense(null);
    } else {
      setExpenses((prev) => [...prev, {
        employee: attendance.employee_id,
        attendance_id: attendance.attendance_id,
        amount: Number(amount),
        route: route || null,
        site_id: selectedSite.id,
        site_name: selectedSite.name,
      }]);
    }

    setAmount("");
    setRoute("");
    setSite("");
  };

  const handleDone = async () => {
    if (!attendance?.attendance_id) return;

    const newExpenses = expenses.filter(exp => !exp.isExisting);
    const updatedExpenses = expenses.filter(exp => exp.isExisting && exp.isUpdated);

    setIsLoading(true);

    try {
      if (newExpenses.length > 0) {
        await transportationExpensesApi.create(
          newExpenses.map((exp) => ({
            employee_id: attendance.employee_id,
            attendance_id: attendance.attendance_id,
            amount: exp.amount,
            route: exp.route,
            site_id: exp.site_id,
          }))
        );
      }

      for (const exp of updatedExpenses) {
        await transportationExpensesApi.update(exp.id, [{
          employee_id: attendance.employee_id,
          attendance_id: attendance.attendance_id,
          amount: exp.amount,
          route: exp.route,
          site_id: exp.site_id,
        }]);
      }

      if (deletedIds.length > 0) {
        await transportationExpensesApi.delete({
          ids: deletedIds,
        });
      }

      toast.success("Saved Successfully!");
      onDone && onDone(expenses);
      handleRedirect();

    } catch (err) {
      console.error("❌ Failed:", err);
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    const exp = expenses[confirmData.index];
    if (!exp) return;

    if (exp.isExisting && exp.id) {
      setDeletedIds((prev) => [...prev, exp.id]);
    }

    setExpenses((prev) =>
      prev.filter((_, i) => i !== confirmData.index)
    );

    setConfirmData({ open: false, index: null, loading: false });

    toast.success("Removed");
  };

  const handleCancelDelete = () => {
    setConfirmData({ open: false, index: null });
  };

  if (isEditingFromCalendar && !editable) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 text-center space-y-4">
          <h1 className="text-lg font-semibold">Transportation Expenses</h1>
          <p className="text-sm text-gray-600">
            This month is locked. Transportation expenses are view-only.
          </p>
          <Button
            buttonStyle="secondary"
            text="Back to Calendar"
            onClick={() => navigate("/calendar/detail")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Transportation Expenses</h1>

      <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
        <p>※ No need to enter commuter pass expenses</p>
        <p>※ Enter ad-hoc transport costs (train/bus) only</p>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-500">Amount</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <span className="mr-2">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500">Route (optional)</label>
          <input
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Shinjuku → Site A"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Site</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <span className="text-gray-400 mr-2">📍</span>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="w-full outline-none bg-transparent text-gray-700"
            >
              <option value="">Select site</option>
              {segmentSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className={`w-full py-2 rounded-lg text-white ${editingExpense ? "bg-green-500" : "bg-blue-500"}`}
        >
          {editingExpense ? "✓ Update" : "+ Add Another"}
        </button>
      </div>

      <div className="space-y-2 mt-4">
        {expenses.map((exp, index) => (
          <div
            key={index}
            className="flex justify-between items-center border rounded-lg p-3 text-sm"
          >
            <div className="flex gap-4 items-center">
              <span>¥{exp.amount}</span>
              <span className="text-gray-600">{exp.route || "-"}</span>
              <span className="text-gray-500">{exp.site_name}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAmount(exp.amount);
                  setRoute(exp.route || "");
                  setSite(String(exp.site_id));
                  setEditingExpense(exp.isExisting ? exp : null);
                  setExpenses(prev => prev.filter((_, i) => i !== index));
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Edit"
              >
                ✏️
              </button>

              <button
                onClick={() => {
                  setConfirmData({
                    open: true,
                    index,
                    loading: false,
                  });
                }}
                className="text-red-500 hover:text-red-700"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2 pt-4">
        <Button
          buttonStyle="primary"
          text="Done"
          onClick={handleDone}
          loading={isLoading}
        />

        <Button
          buttonStyle="secondary"
          text={
            from === "calendar-detail"
              ? "Back to Calendar"
              : "Skip (no transport cost)"
          }
          onClick={handleRedirect}
        />
      </div>
      <ConfirmationModal
        message={
          confirmData.open
            ? `Delete expense ¥${expenses[confirmData.index]?.amount}?`
            : null
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmData({ open: false, index: null, loading: false })}
        loading={confirmData.loading}
      />
    </div>
  );
}

export default TransportationExpenseScreen;