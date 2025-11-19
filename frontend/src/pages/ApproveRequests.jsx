import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const ApproveRequests = () => {
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingReports = async () => {
      const token = localStorage.getItem("token");
      const isAdmin = localStorage.getItem("isAdmin") === "true";

      if (!token || !isAdmin) {
        alert("Admin access required. Please login as admin.");
        navigate("/login");
        return;
      }

      try {
        const result = await api.getPendingReports();
        if (result.success) {
          setPendingReports(result.reports || []);
        }
      } catch (error) {
        console.error("Error fetching pending reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingReports();
  }, [navigate]);

  const handleApprove = async (id) => {
    if (window.confirm("Approve this report?")) {
      const res = await api.approveReport(id);
      if (res.success) {
        alert("✅ Report approved and added to Found Items!");
        setPendingReports(pendingReports.filter((r) => r.id !== id));
      } else alert(res.message || "Failed to approve report");
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Reject this report?")) {
      const res = await api.rejectReport(id);
      if (res.success) {
        alert("❌ Report rejected.");
        setPendingReports(pendingReports.filter((r) => r.id !== id));
      } else alert(res.message || "Failed to reject report");
    }
  };

  if (loading)
    return <div className="text-center py-20 text-gray-600">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          Approve Pending Reports
        </h1>
        <button
          onClick={() => navigate("/admin")}
          className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      {pendingReports.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          No pending reports found.
        </p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border-b">Item</th>
                <th className="p-3 border-b">User</th>
                <th className="p-3 border-b">Location</th>
                <th className="p-3 border-b">Time</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingReports.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{r.item_type}</p>
                    <p className="text-xs text-gray-500">{r.description}</p>
                    {r.media && (
                      <a
                        href={`http://localhost:5000${r.media}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline text-xs"
                      >
                        View Media
                      </a>
                    )}
                  </td>
                  <td className="p-3">
                    {r.user_name}
                    <br />
                    <span className="text-xs text-gray-500">
                      {r.user_email}
                    </span>
                  </td>
                  <td className="p-3">{r.location}</td>
                  <td className="p-3">{r.time_found}</td>
                  <td className="p-3 space-y-2">
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="bg-green-600 text-white py-1 px-3 rounded text-xs hover:opacity-90"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      className="bg-yellow-500 text-white py-1 px-3 rounded text-xs hover:opacity-90"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApproveRequests;
