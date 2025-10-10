import { memo, useState } from 'react';
import { View, Image } from 'react-native';
import { MapView, Camera, RasterLayer, RasterSource, UserLocation } from '@maplibre/maplibre-react-native';
import pinImage from '../../assets/pin.png';

const EventMap = memo(({ coordinatesRef, onCoordinatesChange }) => {
  const [mapFollowUser, setMapFollowUser] = useState(true);

  return (
    <View style={{ position: 'relative' }}>
      <MapView
        style={{ width: '100%', height: 300 }}
        onRegionWillChange={() => setMapFollowUser(false)}
        onRegionDidChange={(feature) => {
          coordinatesRef.current = feature.geometry.coordinates;
          onCoordinatesChange(Date.now());
        }}
      >
        <RasterSource
          id="osm"
          tileUrlTemplates={['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png']}
          tileSize={256}
        >
          <RasterLayer id="osm-layer" sourceID="osm" />
        </RasterSource>
        <UserLocation visible />
        <Camera zoomLevel={18} followUserLocation={mapFollowUser} followUserMode="compass" />
      </MapView>
      <View style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 10 }}>
        <Image source={pinImage} />
      </View>
    </View>
  );
});

export default EventMap;
