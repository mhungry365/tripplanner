export const APP_NAME = 'HolidaysDairy'
export const APP_TAGLINE = 'Your Journey. Your Story.'

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
]

export const TRIP_STATUSES = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',    dot: '#9ca3af' },
  planning:  { label: 'Planning',  color: 'bg-sky-100 text-sky-700',      dot: '#0ea5e9' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700',  dot: '#10b981' },
  ongoing:   { label: 'Ongoing',   color: 'bg-amber-100 text-amber-700',  dot: '#f59e0b' },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700',dot: '#8b5cf6' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600',      dot: '#ef4444' },
}

export const TRANSPORT_TYPES = [
  { value: 'flight',      label: 'Flight',       icon: '✈️' },
  { value: 'train',       label: 'Train',        icon: '🚄' },
  { value: 'bullet_train',label: 'Bullet Train', icon: '🚅' },
  { value: 'bus',         label: 'Bus',          icon: '🚌' },
  { value: 'metro',       label: 'Metro',        icon: '🚇' },
  { value: 'taxi',        label: 'Taxi / Uber',  icon: '🚕' },
  { value: 'ferry',       label: 'Ferry',        icon: '⛴️' },
  { value: 'car_rental',  label: 'Car Rental',   icon: '🚗' },
  { value: 'walk',        label: 'Walking',      icon: '🚶' },
  { value: 'cable_car',   label: 'Cable Car',    icon: '🚡' },
]

export const ACTIVITY_CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing', icon: '🏛️', color: 'bg-blue-50 text-blue-700' },
  { value: 'food',        label: 'Food & Dining',icon: '🍜', color: 'bg-orange-50 text-orange-700' },
  { value: 'transport',   label: 'Transport',   icon: '🚄', color: 'bg-sky-50 text-sky-700' },
  { value: 'accommodation',label:'Accommodation',icon: '🏨', color: 'bg-purple-50 text-purple-700' },
  { value: 'shopping',    label: 'Shopping',    icon: '🛍️', color: 'bg-pink-50 text-pink-700' },
  { value: 'nature',      label: 'Nature',      icon: '🌿', color: 'bg-green-50 text-green-700' },
  { value: 'culture',     label: 'Culture',     icon: '🎭', color: 'bg-yellow-50 text-yellow-700' },
  { value: 'adventure',   label: 'Adventure',   icon: '🧗', color: 'bg-red-50 text-red-700' },
  { value: 'wellness',    label: 'Wellness',    icon: '🧘', color: 'bg-teal-50 text-teal-700' },
]
