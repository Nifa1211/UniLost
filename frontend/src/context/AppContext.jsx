import { createContext, useEffect, useState } from "react";
import api from "../config/api";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null); // shared across navbar + profile
  const currencySymbol = '$';

  // Fetch all items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const result = await api.getItems();
        if (result.success) {
          const mappedItems = result.items.map(item => ({
            _id: item.id.toString(),
            name: item.name,
            image: `http://localhost:5000${item.image}`,
            speciality: item.speciality,
            degree: item.degree,
            experience: item.experience,
            about: item.about,
            address: {
              line1: item.address_line1 || '',
              line2: item.address_line2 || ''
            }
          }));
          setDoctors(mappedItems);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Fetch user + profile image whenever token changes
  useEffect(() => {
    if (!token) {
      setUser(null);
      setProfileImage(null);
      return;
    }
    const fetchUser = async () => {
      try {
        const result = await api.getUserProfile();
        if (result.success) {
          setUser(result.user);
          setProfileImage(
            result.user.profile_image
              ? `http://localhost:5000${result.user.profile_image}`
              : null
          );
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [token]);

  const value = {
    doctors,
    currencySymbol,
    loading,
    token,
    setToken,
    user,
    setUser,
    profileImage,
    setProfileImage, // call this after saving a new photo
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;