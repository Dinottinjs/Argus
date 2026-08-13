"use client";
import React from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, GeoJsonLayer, ArcLayer, BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { FlyToInterpolator, _GlobeView as GlobeView } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useArgusStore } from '@/store/useArgusStore';

// Removed INITIAL_VIEW_STATE as we now use controlled viewState from store

export default function GlobalMap() {
  const events = useArgusStore(s => s.events);
  const binaryPositions = useArgusStore(s => s.binaryPositions);
  const showHeatmap = useArgusStore(s => s.showHeatmap);
  const showScatterplot = useArgusStore(s => s.showScatterplot);
  const mapStyle = useArgusStore(s => s.mapStyle);
  const viewState = useArgusStore(s => s.viewState);
  const setViewState = useArgusStore(s => s.setViewState);
  const setSelectedCountry = useArgusStore(s => s.setSelectedCountry);
  const selectedCountry = useArgusStore(s => s.selectedCountry);
  
  const deckViewState = React.useMemo(() => {
    const baseState = { ...viewState, minZoom: 2.0, maxZoom: 20 };
    if (viewState.transitionDuration) {
      return {
        ...baseState,
        transitionInterpolator: new FlyToInterpolator()
      };
    }
    return baseState;
  }, [viewState]);

  const layers = React.useMemo(() => {
    const activeLayers = [];
    
    // Base Map TileLayer (ESRI Satellite)
    const baseTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      
    activeLayers.push(
      new TileLayer({
        id: 'base-map-tiles',
        data: [baseTileUrl],
        maxZoom: 19,
        minZoom: 0,
        renderSubLayers: props => {
          const { boundingBox } = props.tile;
          return new BitmapLayer(props, {
            data: undefined,
            image: props.data,
            bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]]
          });
        }
      })
    );
    
    // Country Polygons
    activeLayers.push(
      new GeoJsonLayer({
        id: 'countries-layer',
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1,
        getLineColor: [6, 182, 212, 100], // Cyan outlines
        getFillColor: (d: any) => {
          const isSelected = selectedCountry && d.properties.admin === selectedCountry.properties.admin;
          return isSelected ? [6, 182, 212, 50] : [0, 0, 0, 0]; // Transparent to show satellite map and prevent triangulation artifact
        },
        pickable: true,
        onClick: (info: any) => {
          if (info.object && info.object.properties) {
            const isSelected = selectedCountry && info.object.properties.admin === selectedCountry.properties.admin;
            setSelectedCountry(isSelected ? null : info.object);
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
          getFillColor: binaryPositions ? [255, 50, 50, 200] : ((d: any) => {
            if (d.type === 'CRITICAL' || d.is_conflict) return [255, 30, 30, 200]; // Vibrant Red
            if (d.type === 'HIGH') return [255, 120, 0, 200]; // Vibrant Orange
            if (d.type === 'MEDIUM' || d.type === 'NEWS') return [255, 230, 0, 180]; // Vibrant Yellow
            if (d.type === 'LOW' || d.type === 'INFO') return [0, 255, 100, 150]; // Vibrant Green
            return [0, 200, 255, 150]; // Default Cyan
          }),
          getRadius: binaryPositions ? 150000 : ((d: any) => d.type === 'CRITICAL' ? 400000 : d.type === 'HIGH' ? 200000 : 100000),
          radiusMinPixels: 6,
          radiusMaxPixels: 30,
          pickable: !binaryPositions // Disable picking on raw binary layer to save CPU
        })
      );
    }
    
    if (showHeatmap) {
      activeLayers.push(
        new HeatmapLayer({
          id: 'heatmap-layer',
          data: events.filter(e => e.coordinates && e.coordinates.length === 2 && e.coordinates[0] !== 0 && e.type !== 'ISS_TRACKER'),
          getPosition: (d: any) => d.coordinates,
          getWeight: (d: any) => d.type === 'CRITICAL' ? 10 : d.type === 'HIGH' ? 5 : 1,
          radiusPixels: 60,
          intensity: 2,
          threshold: 0.05
        })
      );
    }
    
    // ISS Tracker Layer
    const issEvent = events.find(e => e.type === 'ISS_TRACKER');
    if (issEvent && issEvent.coordinates) {
      activeLayers.push(
        new ScatterplotLayer({
          id: 'iss-layer',
          data: [issEvent],
          getPosition: (d: any) => d.coordinates,
          getFillColor: [255, 255, 255, 255],
          getLineColor: [6, 182, 212, 255], // Cyan outline
          stroked: true,
          lineWidthMinPixels: 3,
          getRadius: 400000,
          radiusMinPixels: 10,
          radiusMaxPixels: 30,
          pickable: true
        })
      );
    }
    // Stable Network / Cyber Arcs (Always visible)
    const networkEvents = events.filter(e => e.type === 'NETWORK_LINK' && e.coordinates && e.target_coordinates);
    
    if (networkEvents.length > 0) {
      activeLayers.push(
        new ArcLayer({
          id: 'network-arcs-layer',
          data: networkEvents,
          getSourcePosition: (d: any) => d.coordinates,
          getTargetPosition: (d: any) => d.target_coordinates,
          getSourceColor: [6, 182, 212, 255], // Cyan origin
          getTargetColor: [255, 50, 50, 255], // Red destination
          getWidth: 5,
          getHeight: 0.5,
          greatCircle: true,
          pickable: true
        })
      );
    }
    
    return activeLayers;
  }, [events, binaryPositions, showHeatmap, showScatterplot, selectedCountry]);
  return (
    <div className="relative w-full h-full bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center animate-pulse-slow">
      {/* Dark overlay for galaxy background so it's not too bright */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0"></div>
      <DeckGL
        // @ts-ignore
        views={[new GlobeView({ id: 'globe', resolution: 2 })]}
        layers={layers}
        // @ts-ignore
        viewState={deckViewState}
        onViewStateChange={({viewState}) => {
          // Globe view automatically handles wrapping, but we can limit latitude to prevent flipping upside down
          viewState.latitude = Math.min(85, Math.max(-85, viewState.latitude));
          setViewState(viewState);
        }}
        controller={true}
        getTooltip={({object}: any) => {
          if (!object) return null;
          if (object.properties && object.properties.admin) return object.properties.admin;
          return `${object.title}\nSource: ${object.source}`;
        }}
        className="z-10"
      >
        {/* No MapGL, Globe handles projection purely through deck.gl layers */}
      </DeckGL>
    </div>
  );
}
