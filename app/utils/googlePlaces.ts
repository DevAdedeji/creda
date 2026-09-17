let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | undefined

export function loadGooglePlaces(apiKey: string): Promise<google.maps.PlacesLibrary> {
  if (!placesLibraryPromise) {
    placesLibraryPromise = import('@googlemaps/js-api-loader').then(
      ({ setOptions, importLibrary }) => {
        setOptions({ key: apiKey, v: 'weekly' })
        return importLibrary('places')
      },
    )
  }
  return placesLibraryPromise
}
