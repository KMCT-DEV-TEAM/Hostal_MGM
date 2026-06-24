import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';

export default function SendNotificationModal({ isOpen, onClose, onSend, recipient = "Admin" }) {
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Send Notification"
            subtitle={`Send notification to ${recipient}`}
            maxWidth="max-w-md"
            zIndex={60}
            footer={
                <div className="flex gap-3 justify-end w-full">
                    <button
                        type="button"
                        onClick={() => onSend(message)}
                        className="px-6 py-2 bg-[#0A437A] text-white rounded-lg text-sm font-medium hover:bg-[#0A437A]/90 transition-colors cursor-pointer"
                    >
                        Send
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-[#0A437A] text-[#0A437A] bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="border-b border-gray-100 -mx-8 mb-6"></div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Text a message..."
                        className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A] resize-none shadow-sm"
                    />
                </div>
            </div>
        </Modal>
    );
}
