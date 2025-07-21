import { centroid, centerOfMass } from '@turf/turf'

export function getCentroid(geojson) {
  return centroid(geojson)
}

export function getCenterOfMass(geojson) {
  return centerOfMass(geojson)
}
