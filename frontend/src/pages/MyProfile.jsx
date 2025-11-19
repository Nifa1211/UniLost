import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import api from "../config/api";
import { AppContext } from "../context/AppContext";

const MyProfile = () => {
  const { setToken, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await api.getUserProfile();
        if (result.success) {
          setUserData({
            name: result.user.name || "",
            image: result.user.profile_image
              ? `http://localhost:5000${result.user.profile_image}`
              : assets.profile_pic,
            email: result.user.email || "",
            phone: result.user.phone || "",
            address: {
              line1: result.user.address_line1 || "",
              line2: result.user.address_line2 || "",
            },
            gender: result.user.gender || "Male",
            dob: result.user.dob || "2000-01-01",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle text field updates
  const handleSave = async () => {
    try {
      const result = await api.updateProfile({
        name: userData.name,
        phone: userData.phone,
        address_line1: userData.address.line1,
        address_line2: userData.address.line2,
        gender: userData.gender,
        dob: userData.dob,
      });

      if (result.success) {
        alert("Profile updated successfully!");
        setIsEdit(false);
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update profile");
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("profile_image", file);

    try {
      setUploading(true);
      const result = await api.updateProfileImage(formData);
      if (result.success) {
        alert("Profile image updated successfully!");
        setUserData((prev) => ({
          ...prev,
          image: `http://localhost:5000${result.profile_image}`,
        }));
      } else {
        alert(result.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm");
      return;
    }

    if (
      !window.confirm(
        "Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted."
      )
    ) {
      return;
    }

    setDeleteLoading(true);

    try {
      const result = await api.deleteAccount(deleteConfirmText);
      if (result.success) {
        alert("Your account has been permanently deleted.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        navigate("/");
      } else {
        alert(result.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!userData) {
    return <div className="text-center py-10">Failed to load profile</div>;
  }

  return (
    <div className="max-w-lg flex flex-col gap-2 text-sm">
      <div className="relative w-36">
        <img
          className="w-36 h-36 rounded object-cover border"
          src={selectedImage || userData.image}
          alt="Profile"
        />
        <label
          htmlFor="file-upload"
          className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-opacity-80"
          title="Upload new profile image"
        >
          📷
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {uploading && (
          <p className="text-xs text-gray-500 mt-1">Uploading...</p>
        )}
      </div>

      {isEdit ? (
        <input
          className="bg-gray-50 text-3xl font-medium max-w-60 mt-4"
          type="text"
          value={userData.name}
          onChange={(e) =>
            setUserData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      ) : (
        <p className="font-medium text-3xl text-neutral-800 mt-4">
          {userData.name}
        </p>
      )}

      <hr className="bg-zinc-400 h-[1px] border-none" />

      <div>
        <p className="text-neutral-500 underline mt-3">CONTACT INFORMATION</p>
        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
          <p className="font-medium">Email id :</p>
          <p className="text-blue-500">{userData.email}</p>

          <p className="font-medium">Phone :</p>
          {isEdit ? (
            <input
              className="bg-gray-100 max-w-52"
              type="text"
              value={userData.phone}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          ) : (
            <p className="text-blue-400">{userData.phone || "Not provided"}</p>
          )}

          <p className="font-medium">Address:</p>
          {isEdit ? (
            <p>
              <input
                className="bg-gray-50 w-full"
                type="text"
                value={userData.address.line1}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line1: e.target.value },
                  }))
                }
                placeholder="Address Line 1"
              />
              <br />
              <input
                className="bg-gray-50 w-full mt-1"
                type="text"
                value={userData.address.line2}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line2: e.target.value },
                  }))
                }
                placeholder="Address Line 2"
              />
            </p>
          ) : (
            <p className="text-gray-500">
              {userData.address.line1 || "Not provided"}
              {userData.address.line1 && <br />}
              {userData.address.line2}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="text-neutral-500 underline mt-3">BASIC INFORMATION</p>
        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
          <p className="font-medium">Gender:</p>
          {isEdit ? (
            <select
              className="max-w-20 bg-gray-100"
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, gender: e.target.value }))
              }
              value={userData.gender}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <p className="text-gray-400">{userData.gender}</p>
          )}

          <p className="font-medium">Birthday:</p>
          {isEdit ? (
            <input
              className="max-w-28 bg-gray-100"
              type="date"
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, dob: e.target.value }))
              }
              value={userData.dob}
            />
          ) : (
            <p className="text-gray-400">{userData.dob}</p>
          )}
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        {isEdit ? (
          <button
            className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
            onClick={handleSave}
          >
            Save Information
          </button>
        ) : (
          <button
            className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
            onClick={() => setIsEdit(true)}
          >
            Edit
          </button>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mt-10 border border-red-300 rounded-lg p-6 bg-red-50">
        <p className="text-red-700 font-semibold text-lg mb-2">⚠️ Danger Zone</p>
        <p className="text-red-600 text-sm mb-4">
          Once you delete your account, there is no going back. This will
          permanently delete your account.
        </p>
        <button
          className="border border-red-600 text-red-600 px-6 py-2 rounded-full hover:bg-red-600 hover:text-white transition-all"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Account
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Delete Account
            </h2>
            <p className="text-gray-700 mb-4">
              This action <strong>cannot be undone</strong>. This will permanently
              delete:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
              <li>Your account and profile</li>
              <li>All your appointments</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Please type <strong className="text-red-600">DELETE</strong> to
              confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full border border-gray-300 rounded px-4 py-2 mb-6 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <div className="flex gap-4">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                className="flex-1 bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {deleteLoading ? "Deleting..." : "Delete My Account"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleteLoading}
                className="flex-1 border border-gray-300 px-6 py-2 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
