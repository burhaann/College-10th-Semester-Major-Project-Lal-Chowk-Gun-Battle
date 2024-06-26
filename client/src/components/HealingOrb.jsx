import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CylinderCollider } from '@react-three/rapier';

 export const HealingOrb = ({ position }) => {
  const glowRef = useRef();

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.rotation.y += 0.01;
    }
  });

  return (
    <RigidBody type="fixed" position={position} colliders={false} userData={{ type: 'healingOrb' }}>
      <CylinderCollider args={[2, 2]} sensor>
        <mesh>
          <sphereGeometry args={[2, 32, 32]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.2} />
        </mesh>
        <mesh ref={glowRef}>
          <torusGeometry args={[2.2, 0.1, 16, 100]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      </CylinderCollider>
    </RigidBody>
  );
};