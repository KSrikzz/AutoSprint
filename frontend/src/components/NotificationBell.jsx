import React, { useState, useEffect, useRef } from 'react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, createNotificationStream } from '../services/api';

const NOTIF_ICONS = {
  task_assigned: '📋',
  status_changed: '🔄',
  sprint_ending: '⏰',
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const panelRef = useRef(null);
  const streamRef = useRef(null);

  // Load initial notifications
  useEffect(() => {
    loadNotifications();
    
    // Set up SSE stream
    streamRef.current = createNotificationStream((newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setHasNew(true);
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications([]);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setShowPanel(!showPanel); setHasNew(false); }}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 ${
            hasNew ? 'bg-red-500 animate-pulse' : 'bg-blue-600'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-2xl shadow-black/30 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-700/50">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors cursor-pointer group"
                  onClick={() => handleMarkRead(notif.id)}
                >
                  <span className="text-base mt-0.5 shrink-0">{NOTIF_ICONS[notif.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {notif.created_at
                        ? new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 text-xs transition-opacity shrink-0"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-slate-500 text-xs">No notifications</p>
              <p className="text-slate-600 text-[10px] mt-1">You're all caught up!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
