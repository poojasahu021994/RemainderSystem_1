import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {

    const [title, setTitle] = useState("");
    const [datetime, setDatetime] = useState("");
    const [reminders, setReminders] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [repeatDaily, setRepeatDaily] = useState(false);

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const shownIds = useRef(new Set());

    // 🔐 Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // 📥 Fetch reminders
    const fetchReminders = async () => {
        try {
            const res = await axios.get(
                "https://remainderssystem.onrender.com/api/reminders/",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setReminders(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchReminders();
    }, []);

    // 🔔 Notification polling (LIVE)
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(
                    "https://remainderssystem.onrender.com/api/reminders/notifications/",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                res.data.forEach((reminder) => {
                    if (!shownIds.current.has(reminder.id)) {
                        shownIds.current.add(reminder.id);

                        // sound alert
                        const audio = new Audio(
                            "https://www.soundjay.com/buttons/sounds/beep-01a.mp3"
                        );
                        audio.play().catch(() => {});

                        // popup alert
                        alert(`🔔 Reminder: ${reminder.title}`);
                    }
                });

            } catch (err) {
                console.log("Notification error:", err);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    // ➕ Create reminder
    const handleCreateReminder = async () => {
        try {
            await axios.post(
                "https://remainderssystem.onrender.com/api/reminders/",
                {
                    title,
                    reminder_time: datetime,
                    repeat_daily: repeatDaily
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setTitle("");
            setDatetime("");
            setRepeatDaily(false);

            fetchReminders();

        } catch (error) {
            console.log(error);
        }
    };

    // ✏ Update reminder
    const handleUpdateReminder = async () => {
        try {
            await axios.put(
                `https://remainderssystem.onrender.com/api/reminders/${editingId}/`,
                {
                    title,
                    reminder_time: datetime,
                    repeat_daily: repeatDaily
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setEditingId(null);
            setTitle("");
            setDatetime("");
            setRepeatDaily(false);

            fetchReminders();

        } catch (error) {
            console.log(error);
        }
    };

    // 🗑 Delete reminder
    const handleDelete = async (id) => {
        try {
            await axios.delete(
                `https://remainderssystem.onrender.com/api/reminders/${id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            fetchReminders();

        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">

            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">
                        Smart Reminder Dashboard
                    </h2>

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg"
                    >
                        Logout
                    </button>
                </div>

                {/* FORM */}
                <div className="bg-gray-50 p-6 rounded-xl shadow mb-8">

                    <input
                        type="text"
                        placeholder="Reminder Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 border rounded-lg mb-4"
                    />

                    <input
                        type="datetime-local"
                        value={datetime}
                        onChange={(e) => setDatetime(e.target.value)}
                        className="w-full p-3 border rounded-lg mb-4"
                    />

                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            checked={repeatDaily}
                            onChange={(e) => setRepeatDaily(e.target.checked)}
                        />
                        <label>Repeat Daily</label>
                    </div>

                    {editingId ? (
                        <button
                            onClick={handleUpdateReminder}
                            className="w-full bg-yellow-500 text-white py-3 rounded-lg"
                        >
                            Update Reminder
                        </button>
                    ) : (
                        <button
                            onClick={handleCreateReminder}
                            className="w-full bg-indigo-500 text-white py-3 rounded-lg"
                        >
                            Create Reminder
                        </button>
                    )}
                </div>

                {/* LIST */}
                <h3 className="text-xl font-semibold mb-4">
                    Your Reminders
                </h3>

                <div className="grid gap-4">

                    {reminders.length === 0 && (
                        <p className="text-gray-500">No reminders yet</p>
                    )}

                    {reminders.map((r) => (
                        <div
                            key={r.id}
                            className="border p-4 rounded-xl flex justify-between items-center"
                        >

                            <div>
                                <p className="font-bold">{r.title}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(r.reminder_time).toLocaleString()}
                                </p>

                                <p className="text-xs mt-1">
                                    {r.repeat_daily ? "Daily" : "One-Time"}
                                </p>
                            </div>

                            <div className="flex gap-2">

                                <button
                                    onClick={() => handleDelete(r.id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded"
                                >
                                    Delete
                                </button>

                                <button
                                    onClick={() => {
                                        setEditingId(r.id);
                                        setTitle(r.title);
                                        setDatetime(r.reminder_time.slice(0, 16));
                                        setRepeatDaily(r.repeat_daily);
                                    }}
                                    className="bg-green-500 text-white px-3 py-1 rounded"
                                >
                                    Edit
                                </button>

                            </div>

                        </div>
                    ))}

                </div>

            </div>
        </div>
    );
}