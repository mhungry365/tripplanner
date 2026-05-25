const STYLE_MAP = ['budget', 'balanced', 'luxury']
const STYLES    = ['backpacker', 'budget', 'balanced', 'comfort', 'luxury']

export function calculateCompatibility(profileA, profileB) {
  let score = 0
  const factors = []

  const advDiff = Math.abs((profileA.adventure_score || 0) - (profileB.adventure_score || 0))
  const advScore = Math.round(20 - (advDiff / 100) * 20)
  score += advScore
  factors.push({ name: 'Adventure Style', emoji: '⚡', score: advScore, max: 20 })

  const foodDiff = Math.abs((profileA.foodie_score || 0) - (profileB.foodie_score || 0))
  const foodScore = Math.round(15 - (foodDiff / 100) * 15)
  score += foodScore
  factors.push({ name: 'Food Passion', emoji: '🍜', score: foodScore, max: 15 })

  const cultDiff = Math.abs((profileA.culture_score || 0) - (profileB.culture_score || 0))
  const cultScore = Math.round(15 - (cultDiff / 100) * 15)
  score += cultScore
  factors.push({ name: 'Culture Interest', emoji: '🎭', score: cultScore, max: 15 })

  const styleA   = STYLE_MAP[profileA.budget_style ?? 1] ?? 'balanced'
  const styleB   = STYLE_MAP[profileB.budget_style ?? 1] ?? 'balanced'
  const styleDiff = Math.abs(STYLES.indexOf(styleA) - STYLES.indexOf(styleB))
  const styleScore = Math.round(20 - (styleDiff / 4) * 20)
  score += styleScore
  factors.push({ name: 'Budget Style', emoji: '💰', score: styleScore, max: 20 })

  const countriesA    = profileA.countries_visited || []
  const countriesB    = profileB.countries_visited || []
  const sharedCountries = countriesA.filter(c => countriesB.includes(c))
  const destScore     = Math.min(20, sharedCountries.length * 5)
  score += destScore
  factors.push({ name: 'Shared Destinations', emoji: '🌍', score: destScore, max: 20, shared: sharedCountries })

  const dreamA    = profileA.bucket_list || []
  const dreamB    = profileB.bucket_list || []
  const sharedDreams = dreamA.filter(d => dreamB.includes(d))
  const dreamScore = Math.min(10, sharedDreams.length * 3)
  score += dreamScore
  factors.push({ name: 'Dream Destinations', emoji: '✨', score: dreamScore, max: 10, shared: sharedDreams })

  let label, emoji, color
  if      (score >= 85) { label = 'Perfect Match';      emoji = '🔥'; color = '#E24B4A' }
  else if (score >= 70) { label = 'Great Match';        emoji = '⭐'; color = '#F59E0B' }
  else if (score >= 55) { label = 'Good Match';         emoji = '✈️'; color = '#3B82F6' }
  else if (score >= 40) { label = 'Some Common Ground'; emoji = '🌍'; color = '#8B5CF6' }
  else                  { label = 'Different Styles';   emoji = '🗺️'; color = '#6B7280' }

  return { score, label, emoji, color, factors }
}

export function getCompatibilityMessage(score, nameB) {
  if (score >= 85) return `You and ${nameB} are made to travel together! 🔥`
  if (score >= 70) return `You and ${nameB} would have an amazing trip! ⭐`
  if (score >= 55) return `You and ${nameB} have good travel chemistry! ✈️`
  if (score >= 40) return `You and ${nameB} could make it work! 🌍`
  return `You and ${nameB} have very different travel styles 🗺️`
}
