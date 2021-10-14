import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-map-gl-geocoder/dist/mapbox-gl-geocoder.css'
import './mapbox-gl-geocoder-override.css'
import React, { useState, useRef, useCallback } from 'react'
import MapGL, { MapEvent } from 'react-map-gl'
import Geocoder from 'react-map-gl-geocoder'
import styles from './MapLocation.module.scss'
import { MapAction, mapReceptor } from '@xrengine/engine/src/map/MapReceptor'
const mapboxApiKey = 'pk.eyJ1IjoibmF2ZGVlcHlhZGF2IiwiYSI6ImNrc2EzM2pnejBqaWUyeHA0bW8xaXFwaWEifQ.hIpiYzWrUer4F31GpCqoHA'
const mapStyle = {
  width: '100%',
  height: '45vh'
}

interface Props {}

const MapView = (props: Props) => {
  const [state, setState] = useState({
    viewport: {
      latitude: 37.7577,
      longitude: -122.4376,
      zoom: 8
    },
    selectedLocation: null,
    selectedMarkerIndex: null,
    markers: []
  })

  const containerRef = useRef()
  const mapRef = useRef()

  const handleViewportChange = useCallback((newViewport) => {
    setState({
      ...state,
      viewport: newViewport,
      selectedLocation: newViewport
    })
  }, [])

  // if you are happy with Geocoder default settings, you can just use handleViewportChange directly
  const handleGeocoderViewportChange = useCallback(
    (newViewport) => {
      const geocoderDefaultOverrides = { transitionDuration: 1000 }
      console.log('Selected Location Position:')
      console.log(newViewport)
      return handleViewportChange({
        ...newViewport,
        ...geocoderDefaultOverrides
      })
    },
    [handleViewportChange]
  )

  const handleClickMap = useCallback((event: MapEvent) => {
    mapReceptor(MapAction.setCenterPoint(event.lngLat))
  }, [])

  const handleGeocoderResult = useCallback((event: any) => {
    const { center } = event.result
    mapReceptor(MapAction.setCenterPoint(center))
  }, [])

  const { viewport, selectedLocation, markers, selectedMarkerIndex } = state
  return (
    <div className={styles.locationSearch}>
      <div className={styles.mapglView} ref={containerRef}>
        <MapGL
          ref={mapRef}
          mapboxApiAccessToken={mapboxApiKey}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          {...viewport}
          {...mapStyle}
          onViewportChange={handleViewportChange}
          onClick={handleClickMap}
        >
          <Geocoder
            mapRef={mapRef}
            containerRef={containerRef}
            mapboxApiAccessToken={mapboxApiKey}
            onViewportChange={handleGeocoderViewportChange}
            placeholder={'Where would you like to go?'}
            position="top-left"
            limit={3}
            onResult={handleGeocoderResult}
          />
        </MapGL>
      </div>
    </div>
  )
}

export default MapView
