import type { LocationCandidate, OfficialFishingPointRef } from './contracts'

export interface TransientCoordinates { latitude: number; longitude: number }

function radians(value: number) { return value * Math.PI / 180 }

export function distanceKm(from: TransientCoordinates, to: Pick<OfficialFishingPointRef, 'latitude' | 'longitude'>) {
  const earthKm = 6371
  const lat = radians(to.latitude - from.latitude)
  const lon = radians(to.longitude - from.longitude)
  const a = Math.sin(lat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(lon / 2) ** 2
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function rankLocationCandidates(location: TransientCoordinates, points: OfficialFishingPointRef[], maxDistanceKm = 80): LocationCandidate[] {
  return points.map((point) => ({ point, mappingMethod: 'DISTANCE_CANDIDATE' as const, distanceKm: distanceKm(location, point), userConfirmed: false as const }))
    .filter((candidate) => candidate.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

