import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Card from './Card';

const FAQ = ({ questions, className = '' }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className={`space-y-4  ${className}`}>
      {questions.map((item, index) => (
        <div key={index} className="pt-4 border-t-1  overflow-hidden">
          <button
            className="w-full text-left flex items-center justify-between transition-colors"
            onClick={() => toggleFAQ(index)}
          >
            <span className="font-semibold text-gray-900">
              {typeof item === 'string' ? item : item.question}
            </span>
            <Plus 
              size={20} 
              className={`text-gray-500 transition-transform duration-200 ${
                expandedFAQ === index ? 'rotate-45' : ''
              }`} 
            />
          </button>
          {expandedFAQ === index && (
            <div className="px-6 pt-2 text-gray-600">
              <p>
                {typeof item === 'string' 
                  ? 'This is the answer content for the FAQ. You can add the actual content here.'
                  : item.answer || 'This is the answer content for the FAQ. You can add the actual content here.'
                }
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FAQ;
