import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const ITEM_CATEGORIES = [
  { value: "",                  label: "Select a category..."   },
  { value: "Mobile Phones",     label: "📱 Mobile Phones"       },
  { value: "Keys",              label: "🔑 Keys"                },
  { value: "Notes & Books",     label: "📚 Notes & Books"       },
  { value: "Lunches & Bottles", label: "🍱 Lunches & Bottles"   },
  { value: "Wearables",         label: "⌚ Wearables"           },
  { value: "Wallets & Bags",    label: "👜 Wallets & Bags"      },
  { value: "Electronics",       label: "💻 Electronics"         },
  { value: "Others",            label: "📦 Others"              },
];

const Report = () => {
  const [formData, setFormData] = useState({
    name: "",         // backend: name
    speciality: "",   // backend: speciality (used for category filtering)
    location: "",     // backend: address_line1
    time_found: "",   // backend: address_line2
    description: "",  // backend: about
    image: null,      // backend: image
  });
  const [loading, setLoading] = useState(false);
  const [fileLabel, setFileLabel] = useState("No file chosen");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
      setFileLabel(files[0]?.name || "No file chosen");
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to submit a report");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // Map to the exact field names the backend items route expects
      const payload = {
        name:          formData.name,
        speciality:    formData.speciality,
        address_line1: formData.location,
        address_line2: formData.time_found,
        about:         formData.description,
        image:         formData.image,
      };

      const result = await api.createItem(payload);

      if (result.success) {
        alert("Thank you for reporting the found item!");
        setFormData({ name: "", speciality: "", location: "", time_found: "", description: "", image: null });
        setFileLabel("No file chosen");
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
      } else {
        alert(result.message || "Failed to submit report");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-10">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Report Found Item</h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Black Wallet, Samsung Galaxy S23"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <div className="relative">
            <select
              name="speciality"
              value={formData.speciality}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-3 pr-10 appearance-none bg-white focus:ring-2 focus:ring-primary focus:outline-none text-gray-700 cursor-pointer"
            >
              {ITEM_CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value} disabled={value === ""}>{label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Location Found */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location Found</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Where did you find it?"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />
        </div>

        {/* Time Found */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Found</label>
          <input
            type="time"
            name="time_found"
            value={formData.time_found}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description / Characteristics</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the item you found..."
            rows="4"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo (proof)</label>
          <label className="flex items-center gap-3 w-full border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-primary transition-colors">
            <span className="bg-primary text-white text-sm px-3 py-1 rounded-md whitespace-nowrap">Choose File</span>
            <span className="text-gray-500 text-sm truncate">{fileLabel}</span>
            <input type="file" name="image" accept="image/*" onChange={handleChange} className="hidden" />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:scale-105 transition-transform duration-200 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
};

export default Report;