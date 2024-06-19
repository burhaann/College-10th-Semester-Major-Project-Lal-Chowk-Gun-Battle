import {
  Billboard,
  CameraControls,
  OrbitControls,
  Text,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier";
import { isHost } from "playroomkit";
import { useEffect, useRef, useState } from "react";
import { CharacterSoldier } from "./CharacterSoldier";
const MOVEMENT_SPEED = 202;
const FIRE_RATE = 380;
export const WEAPON_OFFSET = {
  x: -0.2,
  y: 0.8,
  z: 0.8,
};

export const CharacterController = ({
  state,
  joystick,
  userPlayer,
  onKilled,
  onFire,
  downgradedPerformance,
  ...props
}) => {
  const group = useRef();
  const character = useRef();
  const rigidbody = useRef();
  const [animation, setAnimation] = useState("Idle");
  const [weapon, setWeapon] = useState("AK");
  const lastShoot = useRef(0);

  const scene = useThree((state) => state.scene);
  const spawnRandomly = () => {
    const spawns = [];
    for (let i = 0; i < 1000; i++) {
      const spawn = scene.getObjectByName(`spawn_${i}`);
      if (spawn) {
        spawns.push(spawn);
      } else {
        break;
      }
    }
    const spawnPos = spawns[Math.floor(Math.random() * spawns.length)].position;
    rigidbody.current.setTranslation(spawnPos);
  };

  useEffect(() => {
    if (isHost()) {
      spawnRandomly();
    }
  }, []);

  useEffect(() => {
    if (state.state.dead) {
      const audio = new Audio("/audios/dead.mp3");
      audio.volume = 0.5;
      audio.play();
    }
  }, [state.state.dead]);

  useEffect(() => {
    if (state.state.health < 100) {
      const audio = new Audio("/audios/hurt.mp3");
      audio.volume = 0.4;
      audio.play();
    }
  }, [state.state.health]);

  //Pree F to fire the weapon

  // Function to fire a bullet
  const fireBullet = () => {
    // Get the player's current rotation
    const playerRotationY = character.current.rotation.y;

    // Calculate the direction vector based on the player's rotation
    const direction = {
      x: Math.sin(playerRotationY),
      y: 0,
      z: Math.cos(playerRotationY),
    };

    // Set animation based on movement state
    setAnimation(
      keys.current.w || keys.current.a || keys.current.s || keys.current.d
        ? "Run_Shoot"
        : "Idle_Shoot"
    );

    // Fire bullet logic
    if (isHost() && Date.now() - lastShoot.current > FIRE_RATE) {
      lastShoot.current = Date.now();
      const newBullet = {
        id: `${state.id}-${+new Date()}`,
        position: vec3(rigidbody.current.translation()),
        angle: playerRotationY, // Use player's rotation as the angle
        player: state.id,
      };
      onFire(newBullet);
    }
  };
  // Key state
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  // Key press handler
  const handleKeyPress = (event) => {
    const key = event.key.toLowerCase();
    // Map arrow keys to corresponding WASD keys
    const keyMap = {
      arrowup: "w",
      arrowleft: "a",
      arrowdown: "s",
      arrowright: "d",
    };

    if (keys.current.hasOwnProperty(key)) {
      keys.current[key] = event.type === "keydown";
    } else if (key in keyMap && keys.current.hasOwnProperty(keyMap[key])) {
      keys.current[keyMap[key]] = event.type === "keydown";
    }

    // Handle fire button (F key)
    if (event.key === "f" || event.key === "F") {
      fireBullet();
    }
  };
  useEffect(() => {
    // Add event listeners for key press
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keyup", handleKeyPress);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("keyup", handleKeyPress);
    };
  }, []);

  useFrame((_, delta) => {
    // CAMERA FOLLOW
    if (controls.current) {
      const cameraDistanceY = window.innerWidth < 1024 ? 20 : 20;
      const cameraDistanceZ = window.innerWidth < 1024 ? 16 : 16;
      const playerWorldPos = vec3(rigidbody.current.translation());
      controls.current.setLookAt(
        playerWorldPos.x,
        playerWorldPos.y + (state.state.dead ? 12 : cameraDistanceY - 5),
        playerWorldPos.z + (state.state.dead ? 2 : cameraDistanceZ),
        playerWorldPos.x,
        playerWorldPos.y + 1.5,
        playerWorldPos.z,
        true
      );
    }

    if (state.state.dead) {
      setAnimation("Death");
      return;
    }

    // Update player position based on keys
    const moveDirection = { x: 0, y: 0, z: 0 };

    if (keys.current.w) moveDirection.z -= 1;
    if (keys.current.s) moveDirection.z += 1;
    if (keys.current.a) moveDirection.x -= 1;
    if (keys.current.d) moveDirection.x += 1;

    if (moveDirection.x !== 0 || moveDirection.z !== 0) {
      const magnitude = Math.sqrt(moveDirection.x ** 2 + moveDirection.z ** 2);
      const normalizedDirection = {
        x: (moveDirection.x / magnitude) * MOVEMENT_SPEED * delta,
        z: (moveDirection.z / magnitude) * MOVEMENT_SPEED * delta,
      };

      const impulse = {
        x: normalizedDirection.x,
        y: 0,
        z: normalizedDirection.z,
      };

      rigidbody.current.applyImpulse(impulse, true);

      const angle = Math.atan2(-moveDirection.z, moveDirection.x) + Math.PI / 2;
      character.current.rotation.y = angle;
      setAnimation("Run");
    } else {
      // Update player position based on joystick state
      const angle = joystick.angle();
      if (joystick.isJoystickPressed() && angle) {
        setAnimation("Run");
        character.current.rotation.y = angle;

        // move character in its own direction
        const impulse = {
          x: Math.sin(angle) * MOVEMENT_SPEED * delta,
          y: 0,
          z: Math.cos(angle) * MOVEMENT_SPEED * delta,
        };

        rigidbody.current.applyImpulse(impulse, true);
      } else {
        setAnimation("Idle");
      }
    }

    // Check if fire button is pressed
    if (joystick.isPressed("fire")) {
      const angle = character.current.rotation.y;
      // fire
      setAnimation(
        joystick.isJoystickPressed() && angle ? "Run_Shoot" : "Idle_Shoot"
      );
      if (isHost()) {
        if (Date.now() - lastShoot.current > FIRE_RATE) {
          lastShoot.current = Date.now();
          const newBullet = {
            id: state.id + "-" + +new Date(),
            position: vec3(rigidbody.current.translation()),
            angle,
            player: state.id,
          };
          onFire(newBullet);
        }
      }
    }

    if (isHost()) {
      state.setState("pos", rigidbody.current.translation());
    } else {
      const pos = state.getState("pos");
      if (pos) {
        rigidbody.current.setTranslation(pos);
      }
    }
  });
  const controls = useRef();
  const directionalLight = useRef();

  useEffect(() => {
    if (character.current && userPlayer) {
      directionalLight.current.target = character.current;
    }
  }, [character.current]);

  return (
    <group {...props} ref={group}>
      {userPlayer && <CameraControls ref={controls} />}
      <RigidBody
        ref={rigidbody}
        colliders={false}
        linearDamping={12}
        lockRotations
        type={isHost() ? "dynamic" : "kinematicPosition"}
        onIntersectionEnter={({ other }) => {
          if (
            isHost() &&
            other.rigidBody.userData.type === "bullet" &&
            state.state.health > 0
          ) {
            const newHealth =
              state.state.health - other.rigidBody.userData.damage;
            if (newHealth <= 0) {
              state.setState("deaths", state.state.deaths + 1);
              state.setState("dead", true);
              state.setState("health", 0);
              rigidbody.current.setEnabled(false);
              setTimeout(() => {
                spawnRandomly();
                rigidbody.current.setEnabled(true);
                state.setState("health", 100);
                state.setState("dead", false);
              }, 2000);
              onKilled(state.id, other.rigidBody.userData.player);
            } else {
              state.setState("health", newHealth);
            }
          }
        }}
      >
        <PlayerInfo state={state.state} />
        <group ref={character}>
          <CharacterSoldier
            color={state.state.profile?.color}
            animation={animation}
            weapon={weapon}
          />
          {userPlayer && (
            <Crosshair
              position={[WEAPON_OFFSET.x, WEAPON_OFFSET.y, WEAPON_OFFSET.z]}
            />
          )}
        </group>
        {userPlayer && (
          // Finally I moved the light to follow the player
          // This way we won't need to calculate ALL the shadows but only the ones
          // that are in the camera view
          <directionalLight
            ref={directionalLight}
            position={[25, 18, -25]}
            intensity={0.3}
            castShadow={!downgradedPerformance} // Disable shadows on low-end devices
            shadow-camera-near={0}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />
        )}
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  );
};

const PlayerInfo = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;
  return (
    <Billboard position-y={2.5}>
      <Text position-y={0.36} fontSize={0.4}>
        {name}
        <meshBasicMaterial color={state.profile.color} />
      </Text>
      <mesh position-z={-0.1}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh scale-x={health / 100} position-x={-0.5 * (1 - health / 100)}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Billboard>
  );
};

const Crosshair = (props) => {
  return (
    <group {...props}>
      <mesh position-z={1}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.9} />
      </mesh>
      <mesh position-z={2}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.85} />
      </mesh>
      <mesh position-z={3}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.8} />
      </mesh>

      <mesh position-z={4.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.7} transparent />
      </mesh>

      <mesh position-z={6.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.6} transparent />
      </mesh>

      <mesh position-z={9}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.2} transparent />
      </mesh>
    </group>
  );
};
