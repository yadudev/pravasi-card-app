
const ShopDetailsModal = ({ shop, isOpen, onClose }) => {
  if (!isOpen || !shop) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img 
            src={shop.image} 
            alt={shop.name}
            className="w-full h-48 object-cover rounded-t-2xl"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {shop.discount}
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-2">{shop.name}</h3>
          <div className="flex items-center mb-4">
            <Star className="text-yellow-400 fill-current" size={16} />
            <span className="ml-1 font-semibold">{shop.rating}</span>
            <span className="ml-2 text-gray-600">{shop.address}</span>
          </div>
          
          <p className="text-gray-700 mb-4">{shop.description}</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center">
              <Clock size={16} className="text-gray-600 mr-3" />
              <span>{shop.timing}</span>
            </div>
            <div className="flex items-center">
              <Phone size={16} className="text-gray-600 mr-3" />
              <span>{shop.phone}</span>
            </div>
            <div className="flex items-center">
              <MapPin size={16} className="text-gray-600 mr-3" />
              <span>{shop.address}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Special Offers</h4>
            <ul className="space-y-1">
              {shop.specialOffers.map((offer, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {offer}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-3">
            <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Use Discount
            </button>
            <button className="flex-1 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
              <ExternalLink size={16} className="mr-2" />
              Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetailsModal