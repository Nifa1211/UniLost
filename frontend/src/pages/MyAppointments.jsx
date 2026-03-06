import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalId, setModalId] = useState(null); // appointment id for resolve modal
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const result = await api.getMyAppointments();
        if (result.success) setAppointments(result.appointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const result = await api.cancelAppointment(id);
      if (result.success) {
        setAppointments((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: "cancelled" } : a)
        );
      } else {
        alert(result.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel appointment");
    }
  };

  const handleResolved = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });
      const result = await response.json();
      if (result.success) {
        setAppointments((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: "completed" } : a)
        );
        setModalId(null);
      } else {
        alert(result.message || "Failed to mark as resolved");
      }
    } catch (err) {
      console.error("Resolve error:", err);
      alert("Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await api.cancelAppointment(id);
      if (result.success) {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
        setModalId(null);
      } else {
        alert(result.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading appointments...</div>;
  }

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">My Appointments</p>

      {appointments.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No appointments yet</p>
      ) : (
        <div>
          {appointments.map((item) => (
            <div
              className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
              key={item.id}
            >
              {/* Image */}
              <div>
                <img
                  className="w-32 bg-indigo-50"
                  src={`http://localhost:5000${item.item_image}`}
                  alt={item.item_name}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/128x96?text=No+Image"; }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-sm text-zinc-600">
                <p className="text-neutral-800 font-semibold">{item.item_name}</p>
                <p>{item.speciality}</p>
                <p className="text-zinc-700 font-medium mt-1">Address:</p>
                <p className="text-xs">{item.address_line1}</p>
                <p className="text-xs">{item.address_line2}</p>
                <p className="text-xs mt-1">
                  <span className="text-sm text-neutral-700 font-medium">Date & Time:</span>{" "}
                  {item.appointment_date} | {item.appointment_time}
                </p>
                <p className="text-xs mt-1">
                  <span className="text-sm text-neutral-700 font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    item.status === "pending"   ? "bg-yellow-100 text-yellow-800" :
                    item.status === "confirmed" ? "bg-green-100 text-green-800"  :
                    item.status === "completed" ? "bg-blue-100 text-blue-800"    :
                    item.status === "cancelled" ? "bg-red-100 text-red-800"      :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {item.status}
                  </span>
                </p>
              </div>

              <div></div>

              {/* Actions */}
              <div className="flex flex-col gap-2 justify-end">
                {item.status === "pending" && (
                  <>
                    <button
                      onClick={() => setModalId(item.id)}
                      className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-green-600 hover:text-white transition-all duration-300"
                    >
                      Resolved?
                    </button>
                    <button
                      onClick={() => handleCancel(item.id)}
                      className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all duration-300"
                    >
                      Cancel Appointment
                    </button>
                  </>
                )}
                {item.status === "completed" && (
                  <span className="text-sm text-green-600 text-center sm:min-w-48 py-2">
                    ✅ Item Recovered
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Resolve Modal ── */}
      {modalId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Was the item recovered?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Choose an option below to update this appointment.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleResolved(modalId)}
                className="w-full py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                ✅ Resolved — Item Recovered
              </button>
              <button
                onClick={() => handleDelete(modalId)}
                className="w-full py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                🗑️ Delete this appointment
              </button>
              <button
                onClick={() => { setModalId(null); navigate(`/appointment/${appointments.find(a => a.id === modalId)?.item_id}`); }}
                className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                ↩ Not Resolved — Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;