import { useState } from "react";
import { Modal } from "antd";

const ExpandableText = ({ text, maxLength = 100, actionLabel = "" }: { text: string, maxLength?: number, actionLabel?: string }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <p className="text-gray-800">
                <span className="break-word">
                    {text.length > maxLength ? text.slice(0, maxLength - 20) : text}
                </span>
                {text.length > maxLength && (
                    <span
                        onClick={() => setIsModalOpen(true)}
                        className="cursor-pointer"
                    >&nbsp;...
                        <span className="ml-1 !text-sm font-medium text-blue-500 underline">{actionLabel}</span>
                    </span>
                )}
            </p>
            <Modal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                className="!font-poppins !max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl !max-w-[95vw] min-w-[50vw] flex flex-col"
            >
                <div className="p-8 pt-10">
                    <p className="mb-4">{text}</p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="bg-blue-500 text-white font-medium px-4 py-2 rounded-lg"
                        >
                            Close
                        </button>
                    </div>
                </div>

            </Modal>
        </div>
    );
};

export default ExpandableText;
