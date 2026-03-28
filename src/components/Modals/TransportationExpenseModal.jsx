import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, MapPin } from "lucide-react";
import Button from "../Button";
import { transportationExpensesApi } from "../../api/Api";

const SITE_OPTIONS = [
  { id: 1, name: "Site A - Shinjuku Tower", icon: MapPin },
  { id: 2, name: "Site B - Shibuya Office", icon: MapPin },
  { id: 3, name: "Site C - Roppongi Hills", icon: MapPin },
];

function TransportationExpenseModal({
  open,
  setOpen,
  sites = SITE_OPTIONS,
  expenses: initialExpenses = [],
  attendanceId,
  employeeId,
  onRefetch,
  onDelete
}) {
  const [expenses, setExpenses] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reset expenses whenever modal opens
  useEffect(() => {
    if (open) {
      // Ensure each expense has employee_id and site_id as number
      const normalized = (initialExpenses || []).map(exp => ({
        ...exp,
        employee_id: employeeId,
        site_id: exp.site_id ? Number(exp.site_id) : null
      }));
      setExpenses(normalized);
      setDeletedIds([]);
    }
  }, [open, initialExpenses, employeeId]);

  const addExpense = () => {
    setExpenses(prev => [
      ...prev,
      {
        tempId: Date.now(),
        attendance_id: attendanceId,
        employee_id: employeeId,
        amount: "",
        route: "",
        site_id: null,
        site_name: ""
      }
    ]);
  };

  const deleteExpense = index => {
    const expenseToDelete = expenses[index];
    if (expenseToDelete?.id) {
      setDeletedIds(prev => [...prev, expenseToDelete.id]);
      if (onDelete) onDelete(expenseToDelete.id);
    }
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const updateExpense = (index, field, value) => {
    setExpenses(prev =>
      prev.map((exp, i) =>
        i === index
          ? {
              ...exp,
              [field]: field === "site_id" ? Number(value) : value,
              ...(field === "site_id"
                ? { site_name: sites.find(s => s.id === Number(value))?.name || "" }
                : {})
            }
          : exp
      )
    );
  };

  const hasChanges = useMemo(() => {
    if (expenses.length !== initialExpenses.length) return true;
    return expenses.some((exp, i) => {
      const initExp = initialExpenses[i];
      return (
        exp.amount !== initExp?.amount ||
        exp.route !== initExp?.route ||
        exp.site_id !== initExp?.site_id
      );
    });
  }, [expenses, initialExpenses]);

  const handleDone = async () => {
    if (!expenses.length && !deletedIds.length) {
      setOpen(false);
      return;
    }

    try {
      setLoading(true);

      if (deletedIds.length) {
        await transportationExpensesApi.bulkDelete(deletedIds);
      }

      const payload = expenses
        .filter(exp => !exp.id)
        .map(exp => ({
          attendance_id: attendanceId,
          employee_id: employeeId,
          amount: Number(exp.amount) || 0,
          route: exp.route || "",
          site_id: exp.site_id || null
        }));

      if (payload.length) {
        await transportationExpensesApi.create(payload);
      }

      await onRefetch();
      setOpen(false);
    } catch (error) {
      console.error("Failed to update transportation expenses:", error);
    } finally {
      setLoading(false);
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Transportation Expenses</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={22} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          ※ No need to enter commuter pass expenses
          <br />
          ※ Enter ad-hoc transport costs (train/bus) only
        </p>

        <div className="flex flex-col gap-4">
          {expenses.map((expense, index) => (
            <div key={expense.id || expense.tempId || index} className="border rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Expense {index + 1}</span>
                <button
                  onClick={() => deleteExpense(index)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 w-8 h-8 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Amount (¥)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={expense.amount}
                  onChange={e => updateExpense(index, "amount", e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Route (optional)</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={expense.route}
                  onChange={e => updateExpense(index, "route", e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Site</label>
                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={expense.site_id || ""}
                  onChange={e => updateExpense(index, "site_id", Number(e.target.value))}
                >
                  <option value="">Select site</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addExpense}
          className="mt-4 flex items-center gap-1 text-sm text-green-600 font-medium hover:text-green-800"
        >
          <Plus size={16} /> Add Another
        </button>

        <div className="flex gap-3 mt-6">
          <Button
            buttonStyle="primary"
            text="Done"
            onClick={handleDone}
            loading={loading}
            disabled={!hasChanges && !deletedIds.length}
          />
          <Button
            buttonStyle="secondary"
            text="Skip (no transport cost)"
            onClick={() => setOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default TransportationExpenseModal;