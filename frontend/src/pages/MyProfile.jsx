import { useContext, useEffect, useRef, useState } from "react";
import { assets } from "../assets/assets";
import api from "../config/api";
import { AppContext } from "../context/AppContext";

const MyProfile = () => {
  const { setProfileImage } = useContext(AppContext);
  const [userData, setUserData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await api.getUserProfile();
        if (result.success) {
          setUserData({
            name:    result.user.name  || "",
            image:   result.user.profile_image ? `http://localhost:5000${result.user.profile_image}` : null,
            email:   result.user.email || "",
            phone:   result.user.phone || "",
            address: { line1: result.user.address_line1 || "", line2: result.user.address_line2 || "" },
            gender:  result.user.gender || "Male",
            dob:     result.user.dob    || "2000-01-01",
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.updateProfile({
        name: userData.name, phone: userData.phone,
        address_line1: userData.address.line1, address_line2: userData.address.line2,
        gender: userData.gender, dob: userData.dob,
        ...(imageFile ? { profile_image: imageFile } : {}),
      });
      if (result.success) {
        if (result.user?.profile_image) {
          const newUrl = `http://localhost:5000${result.user.profile_image}`;
          setUserData((prev) => ({ ...prev, image: newUrl }));
          setProfileImage(newUrl);
        }
        setImageFile(null); setImagePreview(null); setIsEdit(false);
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => { setIsEdit(false); setImageFile(null); setImagePreview(null); };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!userData) return <div className="text-center py-10">Failed to load profile</div>;

  const displayImage = imagePreview || userData.image || assets.profile_pic;

  return (
    <div className="max-w-lg flex flex-col gap-2 text-sm">
      <div className="relative w-36 group">
        <img className="w-36 h-36 rounded object-cover" src={displayImage} alt="Profile"
          onError={(e) => { e.target.src = assets.profile_pic; }} />
        {isEdit && (
          <>
            <div onClick={() => fileInputRef.current.click()}
              className="absolute inset-0 bg-black bg-opacity-40 rounded flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-xs">Change Photo</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </>
        )}
        {imageFile && (
          <span className="absolute -bottom-2 left-0 right-0 text-center text-xs bg-green-500 text-white rounded px-1 py-0.5">
            New photo selected
          </span>
        )}
      </div>

      {isEdit ? (
        <input className="bg-gray-50 text-3xl font-medium max-w-60 mt-4 border-b border-gray-300 focus:outline-none"
          type="text" value={userData.name} onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))} />
      ) : (
        <p className="font-medium text-3xl text-neutral-800 mt-4">{userData.name}</p>
      )}

      <hr className="bg-zinc-400 h-[1px] border-none" />

      <div>
        <p className="text-neutral-500 underline mt-3">CONTACT INFORMATION</p>
        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
          <p className="font-medium">Email id :</p>
          <p className="text-blue-500">{userData.email}</p>
          <p className="font-medium">Phone :</p>
          {isEdit ? (
            <input className="bg-gray-100 max-w-52 px-1" type="text" value={userData.phone}
              onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))} />
          ) : <p className="text-blue-400">{userData.phone || "Not provided"}</p>}
          <p className="font-medium">Address:</p>
          {isEdit ? (
            <div>
              <input className="bg-gray-50 w-full px-1 mb-1" type="text" value={userData.address.line1} placeholder="Address Line 1"
                onChange={(e) => setUserData((prev) => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} />
              <input className="bg-gray-50 w-full px-1" type="text" value={userData.address.line2} placeholder="Address Line 2"
                onChange={(e) => setUserData((prev) => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} />
            </div>
          ) : (
            <p className="text-gray-500">{userData.address.line1 || "Not provided"}{userData.address.line1 && <br />}{userData.address.line2}</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-neutral-500 underline mt-3">BASIC INFORMATION</p>
        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
          <p className="font-medium">Gender:</p>
          {isEdit ? (
            <select className="max-w-20 bg-gray-100" value={userData.gender}
              onChange={(e) => setUserData((prev) => ({ ...prev, gender: e.target.value }))}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          ) : <p className="text-gray-400">{userData.gender}</p>}
          <p className="font-medium">Birthday:</p>
          {isEdit ? (
            <input className="max-w-28 bg-gray-100" type="date" value={userData.dob}
              onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))} />
          ) : <p className="text-gray-400">{userData.dob}</p>}
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        {isEdit ? (
          <>
            <button onClick={handleSave} disabled={saving}
              className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all disabled:opacity-50">
              {saving ? "Saving..." : "Save Information"}
            </button>
            <button onClick={handleCancelEdit}
              className="border border-gray-300 px-8 py-2 rounded-full hover:bg-gray-100 transition-all text-gray-500">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setIsEdit(true)}
            className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all">
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default MyProfile;