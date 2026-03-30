import React, { useState } from "react";
import { transportationExpensesApi } from "../api/Api";
import { useNavigate } from "react-router-dom";
import { useAttendanceContext } from "../context/AttendanceContext";
import Button from "../components/Button"; // import your reusable Button
import CONSTANTS from "../constants/Constants";
import { useLocationContext } from "../context/LocationContext";

function TransportationExpenseScreen({ onDone }) {
  const [amount, setAmount] = useState("");
  const [route, setRoute] = useState("");
  const [site, setSite] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { attendance } = useAttendanceContext();
  const SITE_OPTIONS = CONSTANTS.SITE_OPTIONS
  const { sites } = useLocationContext()
  const handleAdd = () => {
    console.log(attendance)
    if (!amount || !site) {
      alert("Amount and Site are required");
      return;
    }
    console.log(attendance)
    if (!attendance?.attendance_id) {
      console.error("❌ attendance_id is missing");
      alert("System error: attendance not ready");
      return;
    }
    console.log(sites)
    if (!attendance?.employee_id) {
      console.error("❌ employee_id is missing");
      alert("System error: employee not ready");
      return;
    }
    const selectedSite = SITE_OPTIONS.find((s) => s.id === Number(site));
    const newExpense = {
      employee: attendance.employee_id,
      attendance_id: attendance.attendance_id,
      amount: Number(amount),
      route: route || null,
      site_id: selectedSite.id,
      site_name: selectedSite.name,
    };

    setExpenses((prev) => [...prev, newExpense]);

    setAmount("");
    setRoute("");
    setSite("");
  };

  const handleDone = async () => {
    if (!attendance.attendance_id) {
      console.error("❌ attendance_id missing on submit");
      return;
    }

    if (expenses.length === 0) {
      onDone && onDone([]);
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const payload = expenses.map((exp) => ({
        employee_id: attendance.employee_id,
        attendance_id: attendance.attendance_id,
        amount: exp.amount,
        route: exp.route,
        site_id: exp.site_id,
      }));

      console.log("📦 FINAL PAYLOAD:", payload);

      await transportationExpensesApi.create(payload);

      onDone && onDone(expenses);
      navigate("/");
    } catch (err) {
      console.error("❌ Failed to save expenses:", err);
      alert("Failed to save expenses");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Transportation Expenses</h1>

      <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
        <p>※ No need to enter commuter pass expenses</p>
        <p>※ Enter ad-hoc transport costs (train/bus) only</p>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        {/* Amount */}
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

        {/* Route */}
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

        {/* Site */}
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
              {SITE_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          className="w-full bg-blue-500 text-white py-2 rounded-lg"
        >
          + Add Another
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 mt-4">
        {expenses.map((exp, index) => (
          <div
            key={index}
            className="flex justify-between border rounded-lg p-3 text-sm"
          >
            <span>¥{exp.amount}</span>
            <span className="text-gray-600">{exp.route || "-"}</span>
            <span className="text-gray-500">{exp.site_name}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2 pt-4">
        <Button
          buttonStyle="primary"
          text="Done"
          onClick={handleDone}
          loading={isLoading}
        />

        <Button
          buttonStyle="secondary"
          text="Skip (no transport cost)"
          onClick={() => navigate("/")}
        />
      </div>
    </div>
  );
}

export default TransportationExpenseScreen;