import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminHelpDesk = () => {
    const [tickets, setTickets] = useState([]);
    const [responseMap, setResponseMap] = useState({});

    const fetchAllTickets = async () => {
        const res = await axios.get("/api/helpdesk/all");
        setTickets(res.data);
    };

    const handleResponseChange = (id, value) => {
        setResponseMap((prev) => ({ ...prev, [id]: value }));
    };

    const handleRespond = async (id) => {
        await axios.put(`/api/helpdesk/${id}/respond`, {
            response: responseMap[id],
        });
        fetchAllTickets();
    };

    useEffect(() => {
        fetchAllTickets();
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-4">
            <h2 className="text-xl font-semibold mb-4">
                HelpDesk Tickets (Admin)
            </h2>
            {tickets.map((ticket) => (
                <div
                    key={ticket._id}
                    className="border p-4 mb-4 rounded shadow-sm"
                >
                    <p>
                        <strong>User:</strong> {ticket.user.name} ({ticket.role}
                        )
                    </p>
                    <p>
                        <strong>Subject:</strong> {ticket.subject}
                    </p>
                    <p>
                        <strong>Message:</strong> {ticket.message}
                    </p>
                    <p>
                        <strong>Status:</strong> {ticket.status}
                    </p>
                    {ticket.response ? (
                        <p className="text-green-700">
                            <strong>Response:</strong> {ticket.response}
                        </p>
                    ) : (
                        <>
                            <textarea
                                placeholder="Type your response"
                                className="w-full p-2 border rounded mt-2"
                                rows="3"
                                value={responseMap[ticket._id] || ""}
                                onChange={(e) =>
                                    handleResponseChange(
                                        ticket._id,
                                        e.target.value
                                    )
                                }
                            />
                            <button
                                onClick={() => handleRespond(ticket._id)}
                                className="mt-2 bg-blue-600 text-white px-4 py-1 rounded"
                            >
                                Send Response
                            </button>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AdminHelpDesk;
