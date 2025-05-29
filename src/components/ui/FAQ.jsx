import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Card from './Card';

const FAQ = ({ questions, className = '' }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {questions.map((item, index) => (
        <Card key={index} className="p-0 overflow-hidden">
          <button
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleFAQ(index)}
          >
            <span className="font-medium text-gray-900">
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
            <div className="px-6 pb-4 text-gray-600">
              <p>
                {typeof item === 'string' 
                  ? 'This is the answer content for the FAQ. You can add the actual content here.'
                  : item.answer || 'This is the answer content for the FAQ. You can add the actual content here.'
                }
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default FAQ;
