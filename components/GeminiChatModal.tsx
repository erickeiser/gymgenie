
import React, { useState } from 'react';
import { BotIcon, LoaderIcon } from './icons';

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModify: (request: string) => Promise<void>;
  isLoading: boolean;
}

const GeminiChatModal: React.FC<GeminiChatModalProps> = ({ isOpen, onClose, onModify, isLoading }) => {
  const [request, setRequest] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim() || isLoading) return;
    await onModify(request);
    setRequest('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-light-dark rounded-lg shadow-xl p-6 w-full max-w-lg flex flex-col h-[70vh] max-h-[500px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <BotIcon className="w-6 h-6 text-brand-blue"/>
            <h2 className="text-xl font-bold text-white">Modify Your Plan</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="flex-grow bg-brand-dark p-4 rounded-md overflow-y-auto mb-4">
            <p className="text-gray-300">
                How can I adjust your workout today? You can say things like:
            </p>
            <ul className="text-gray-400 text-sm list-disc list-inside mt-2 space-y-1">
                <li>"Swap bench press for dumbbell press on my push day."</li>
                <li>"I'm feeling sore, make today's leg workout a bit easier."</li>
                <li>"I only have 20 minutes for weights today."</li>
                <li>"Add more bicep exercises to my upper body days."</li>
            </ul>
        </div>
        
        {isLoading && (
            <div className="text-center text-brand-blue flex items-center justify-center p-4">
                <LoaderIcon className="w-8 h-8 mr-2"/>
                <span className="text-lg">Updating your plan...</span>
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <input
              type="text"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder={isLoading ? "Please wait..." : "Type your request here..."}
              className="flex-grow w-full bg-brand-dark border border-brand-gray text-white rounded-md p-3 focus:ring-brand-blue focus:border-brand-blue"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !request.trim()}
              className="bg-brand-blue text-white font-bold py-3 px-6 rounded-md hover:bg-blue-600 transition-colors disabled:bg-brand-gray disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeminiChatModal;
