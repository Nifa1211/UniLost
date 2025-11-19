import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [approvedItems, setApprovedItems] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem("token");
      const isAdmin = localStorage.getItem("isAdmin") === "true";

      if (!token || !isAdmin) {
        alert("Admin access required. Please login as admin.");
        navigate("/login");
        return;
      }

      try {
        const [statsRes, reportsRes, itemsRes] = await Promise.all([
          api.getAdminStats(),
          api.getPendingReports(),
          api.getAdminItems(),
        ]);

        if (statsRes.success) setStats(statsRes.stats);
        if (reportsRes.success) setPendingReports(reportsRes.reports);
        if (itemsRes.success) setApprovedItems(itemsRes.items);
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleApprove = async (id) => {
    if (window.confirm("Approve this report?")) {
      const res = await api.approveReport(id);
      if (res.success) {
        alert("Report approved and added to Found Items.");
        setPendingReports(pendingReports.filter((r) => r.id !== id));
        const itemsRes = await api.getAdminItems();
        if (itemsRes.success) setApprovedItems(itemsRes.items);
      } else alert(res.message || "Failed to approve report");
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Reject this report?")) {
      const res = await api.rejectReport(id);
      if (res.success) {
        alert("Report rejected.");
        setPendingReports(pendingReports.filter((r) => r.id !== id));
      } else alert(res.message || "Failed to reject report");
    }
  };

  if (loading)
    return <div className="text-center py-20 text-gray-600">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">
        Admin Dashboard
      </h1>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(stats).map(([key, value]) => (
            <div
              key={key}
              className="bg-white shadow-md rounded-lg p-4 text-center border"
            >
              <p className="text-sm text-gray-500 capitalize">{key}</p>
              <p className="text-2xl font-bold text-primary">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b pb-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-2 px-3 font-medium border-b-2 ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-gray-600"
          }`}
        >
          Pending Reports
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`pb-2 px-3 font-medium border-b-2 ${
            activeTab === "approved"
              ? "border-primary text-primary"
              : "border-transparent text-gray-600"
          }`}
        >
          Approved Items
        </button>
      </div>

      {/* Pending Reports */}
      {activeTab === "pending" && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Reports</h2>
          {pendingReports.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No pending reports found.
            </p>
          ) : (
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
                        className="bg-green-600 text-white py-1 px-3 rounded text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="bg-yellow-500 text-white py-1 px-3 rounded text-xs"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Approved Items */}
      {activeTab === "approved" && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Approved Items</h2>
          {approvedItems.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No approved items yet.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 border-b">Item</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedItems.map((i) => (
                  <tr key={i.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{i.name}</td>
                    <td className="p-3 capitalize">{i.status}</td>
                    <td className="p-3">
                      <button
                        className="bg-red-600 text-white py-1 px-3 rounded text-xs"
                        onClick={async () => {
                          if (window.confirm("Delete this item?")) {
                            const res = await api.deleteAdminItem(i.id);
                            if (res.success)
                              setApprovedItems(
                                approvedItems.filter((x) => x.id !== i.id)
                              );
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
