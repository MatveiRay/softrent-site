"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type City = {
  id: string;
  lat: number;
  lng: number;
  phase: number;
};

const CITIES: City[] = [
  { id: "uluwatu", lat: -8.83, lng: 115.08, phase: 0 },
  { id: "sumba", lat: -9.65, lng: 119.36, phase: 0.5 },
  { id: "tulum", lat: 20.21, lng: -87.43, phase: 1.0 },
  { id: "sayulita", lat: 20.87, lng: -105.44, phase: 1.5 },
  { id: "costarica", lat: 9.93, lng: -84.08, phase: 2.0 },
  { id: "maafushi", lat: 3.94, lng: 73.49, phase: 2.5 },
  { id: "senja", lat: 69.32, lng: 17.41, phase: 3.0 },
  { id: "zermatt", lat: 46.02, lng: 7.75, phase: 3.5 },
  { id: "hokkaido", lat: 42.81, lng: 140.69, phase: 4.0 },
  { id: "dolomites", lat: 46.41, lng: 11.85, phase: 4.5 },
  { id: "lofoten", lat: 68.13, lng: 13.87, phase: 5.0 },
  { id: "cairngorms", lat: 57.08, lng: -3.67, phase: 5.5 },
];

function latLngToVec3(
  lat: number,
  lng: number,
  radius: number
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

function Earth() {
  const texture = useTexture("/earth-night.jpg");

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
  }, [texture]);

  return (
    <mesh>
      <sphereGeometry args={[2, 48, 48]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function Atmosphere() {
  return (
    <>
      {/* inner soft glow */}
      <mesh scale={2.04}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#d4b896"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
      {/* outer haze */}
      <mesh scale={2.18}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#d4b896"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}

function Pin({ lat, lng, phase }: City) {
  const pos = useMemo(() => latLngToVec3(lat, lng, 2.005), [lat, lng]);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!haloRef.current) return;
    const t = state.clock.elapsedTime + phase;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
    haloRef.current.scale.setScalar(1 + 0.45 * pulse);
    (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.5 - 0.4 * pulse;
  });

  return (
    <group position={pos}>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#d4b896" transparent opacity={0.45} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshBasicMaterial color="#f5e0bd" toneMapped={false} />
      </mesh>
    </group>
  );
}

function GlobeScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <Earth />
      <Atmosphere />
      {CITIES.map((c) => (
        <Pin key={c.id} {...c} />
      ))}
    </group>
  );
}

export default function Globe() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0.3, 5.6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <GlobeScene />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.55}
          dampingFactor={0.08}
          enableDamping
          minPolarAngle={Math.PI * 0.25}
          maxPolarAngle={Math.PI * 0.75}
        />
      </Canvas>
    </div>
  );
}
