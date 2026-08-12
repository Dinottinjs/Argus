"use client";
import React from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map as MapGL } from 'react-map-gl/maplibre';
import { FlyToInterpolator } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useArgusStore } from '@/store/useArgusStore';

// Removed INITIAL_VIEW_STATE as we now use controlled viewState from store

const CARTO_DARK_MATTER = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO'
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

const ESRI_SATELLITE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, Aerogrid, IGN, IGP, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

export default function GlobalMap() {
  const { 
    events, binaryPositions, showHeatmap, showScatterplot, mapStyle,
    viewState, setViewState, setSelectedCountry, selectedCountry
  } = useArgusStore();
  
  // Convert zustand viewState (which has transitionDuration) into deck.gl props
  const deckViewState = React.useMemo(() => {
    if (viewState.transitionDuration) {
      return {
        ...viewState,
        transitionInterpolator: new FlyToInterpolator()
      };
    }
    return viewState;
  }, [viewState]);

  const layers = React.useMemo(() => {
    const activeLayers = [];
    
    // Country Polygons
    activeLayers.push(
      new GeoJsonLayer({
        id: 'countries-layer',
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1,
        getLineColor: [6, 182, 212, 100], // Cyan outlines
        getFillColor: (d: any) => d.properties.admin === selectedCountry ? [6, 182, 212, 50] : [0, 0, 0, 0],
        pickable: true,
        onClick: (info: any) => {
          if (info.object && info.object.properties) {
            setSelectedCountry(info.object.properties.admin === selectedCountry ? null : info.object.properties.admin);
          }
        },
        updateTriggers: {
          getFillColor: [selectedCountry]
        }
      })
    );
    
    if (showScatterplot) {
      activeLayers.push(
        new ScatterplotLayer({
          id: 'scatter-layer',
          // If we have binary positions, we use them for ultra-fast GPU rendering
          data: binaryPositions ? { length: binaryPositions.length / 2, attributes: { getPosition: { value: binaryPositions, size: 2 } } } : events.filter(e => e.coordinates && e.coordinates.length === 2 && e.coordinates[0] !== 0),
          getPosition: binaryPositions ? undefined : ((d: any) => d.coordinates),
          getFillColor: binaryPositions ? [255, 50, 50, 200] : ((d: any) => d.type === 'CRITICAL' ? [255, 0, 0, 200] : d.type === 'HIGH' ? [255, 165, 0, 180] : [0, 255, 255, 150]),
          getRadius: binaryPositions ? 150000 : ((d: any) => d.type === 'CRITICAL' ? 300000 : d.type === 'HIGH' ? 150000 : 80000),
          radiusMinPixels: 4,
          radiusMaxPixels: 20,
          pickable: !binaryPositions // Disable picking on raw binary layer to save CPU
        })
      );
    }
    
    if (showHeatmap) {
      activeLayers.push(
        new HeatmapLayer({
          id: 'heatmap-layer',
          data: events.filter(e => e.coordinates && e.coordinates.length === 2 && e.coordinates[0] !== 0),
          getPosition: (d: any) => d.coordinates,
          getWeight: (d: any) => d.type === 'CRITICAL' ? 10 : d.type === 'HIGH' ? 5 : 1,
          radiusPixels: 40,
          intensity: 1,
          threshold: 0.1
        })
      );
    }
    
    return activeLayers;
  }, [events, binaryPositions, showHeatmap, showScatterplot, selectedCountry]);
  return (
    <div className="relative w-full h-full">
      <DeckGL
        viewState={deckViewState}
        onViewStateChange={({viewState}) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getTooltip={({object}: any) => {
          if (!object) return null;
          if (object.properties && object.properties.admin) return object.properties.admin;
          return `${object.title}\nSource: ${object.source}`;
        }}
      >
        <MapGL
          mapStyle={mapStyle === 'satellite' ? (ESRI_SATELLITE as any) : (CARTO_DARK_MATTER as any)}
          renderWorldCopies={false}
        />
      </DeckGL>
    </div>
  );
}
