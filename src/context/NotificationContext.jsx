import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (title, type = 'general', status = 'info') => {
    const newAlert = {
      id: Date.now(),
      title,
      type,
      status,
      time: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newAlert, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
