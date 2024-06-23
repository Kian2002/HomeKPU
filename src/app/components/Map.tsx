"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  const [distance, setDistance] = useState<string | undefined>();
  const [duration, setDuration] = useState<string | undefined>();
  const [locationAllowed, setLocationAllowed] = useState<boolean>(false);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        version: "weekly",
      });

      const { Map } = await loader.importLibrary("maps");
      const { Marker } = await loader.importLibrary("marker");

      const destination = { lat: 49.13216943248015, lng: -122.87144344744844 };

      const currentPosition = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);

          // Check if the user has allowed location access
          navigator.permissions
            .query({ name: "geolocation" })
            .then((result) => {
              if (result.state === "granted") {
                setLocationAllowed(true);
              }
            });
        }
      );

      // distance matrix
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [
            new google.maps.LatLng(
              currentPosition.coords.latitude,
              currentPosition.coords.longitude
            ),
          ],
          destinations: [
            new google.maps.LatLng(destination.lat, destination.lng),
          ],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
        },
        (response, status) => {
          if (status !== "OK") {
            console.error("Error was: " + status);
          } else {
            console.log(response);
            // draw route
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);
            const request = {
              origin: new google.maps.LatLng(
                currentPosition.coords.latitude,
                currentPosition.coords.longitude
              ),
              destination: new google.maps.LatLng(
                destination.lat,
                destination.lng
              ),
              travelMode: google.maps.TravelMode.DRIVING,
            };
            directionsService.route(request, (result, status) => {
              if (status === "OK") {
                directionsRenderer.setDirections(result);
              }
            });

            // draw distance
            setDistance(response?.rows[0].elements[0].distance.text);
            setDuration(response?.rows[0].elements[0].duration.text);
          }
        }
      );

      const mapOptions = {
        zoom: 11,
        center: {
          lat: (currentPosition.coords.latitude + destination.lat) / 2,
          lng: (currentPosition.coords.longitude + destination.lng) / 2,
        },
      };

      const map = new Map(mapRef.current as HTMLDivElement, mapOptions);

      const kpuMarker = new Marker({
        position: destination,
        map: map,
        title: "KPU",
      });

      const currentPositionMarker = new Marker({
        position: {
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
        },
        map: map,
        title: "Current Position",
      });
    };

    initMap();
  }, []);

  return (
    <div className="flex flex-col items-center justify-between p-6 w-full">
      <div ref={mapRef} className="w-full min-h-screen" />
      <div className="text-center absolute bottom-0 w-full">
        <p className="text-black text-xl font-bold">Distance: {distance}</p>
        <p className="text-black text-xl font-bold">Duration: {duration}</p>
      </div>

      {!locationAllowed && (
        <p className="text-center text-red-500 absolute top-20">
          Please allow location access to see the distance and duration from
          your location to the KPU library.
        </p>
      )}
    </div>
  );
}
