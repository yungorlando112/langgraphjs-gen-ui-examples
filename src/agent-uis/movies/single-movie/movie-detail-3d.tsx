"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  PerspectiveCamera,
  useTexture,
  Text,
  Html,
  Sparkles,
  MeshDistortMaterial,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { Vector3, MathUtils, type Group, Color } from "three";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  Calendar,
  Clock,
  DollarSign,
  Play,
  ExternalLink,
  Info,
} from "lucide-react";
import { z } from "zod";

const MovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string().nullable(),
  original_language: z.string().nullable(),
  original_title: z.string().nullable(),
  runtime: z.number().nullable(),
  revenue: z.number().nullable(),
  release_date: z.string().nullable(),
  popularity: z.number().nullable(),
  vote_average: z.number().nullable(),
  vote_count: z.number().nullable(),
  budget: z.number().nullable(),
  year: z.string().nullable(),
  description: z.string().nullable(),
  poster_url: z.string().nullable(),
  pg_rating: z.string().nullable(),
  imdb_url: z.string().nullable(),
});

type Movie = z.infer<typeof MovieSchema>;

// Helper functions
const formatCurrency = (amount: number | null) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
};

const formatRuntime = (minutes: number | null) => {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// 3D Movie Poster component
const MoviePoster = ({
  movie,
  isHovered,
  setIsHovered,
}: {
  movie: Movie;
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
}) => {
  const groupRef = useRef<Group>(null);
  const texture = useTexture(
    movie.poster_url || "/placeholder.svg?height=500&width=300",
  );

  // Animate the poster
  useFrame((state) => {
    if (!groupRef.current) return;

    // Subtle floating animation
    groupRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

    // Rotate slightly based on mouse position
    const mouseX = state.mouse.x * 0.1;
    const mouseY = state.mouse.y * 0.1;
    groupRef.current.rotation.y = MathUtils.lerp(
      groupRef.current.rotation.y,
      mouseX,
      0.1,
    );
    groupRef.current.rotation.x = MathUtils.lerp(
      groupRef.current.rotation.x,
      -mouseY,
      0.1,
    );

    // Scale effect on hover
    if (isHovered) {
      groupRef.current.scale.x = MathUtils.lerp(
        groupRef.current.scale.x,
        1.05,
        0.1,
      );
      groupRef.current.scale.y = MathUtils.lerp(
        groupRef.current.scale.y,
        1.05,
        0.1,
      );
      groupRef.current.scale.z = MathUtils.lerp(
        groupRef.current.scale.z,
        1.05,
        0.1,
      );
    } else {
      groupRef.current.scale.x = MathUtils.lerp(
        groupRef.current.scale.x,
        1,
        0.1,
      );
      groupRef.current.scale.y = MathUtils.lerp(
        groupRef.current.scale.y,
        1,
        0.1,
      );
      groupRef.current.scale.z = MathUtils.lerp(
        groupRef.current.scale.z,
        1,
        0.1,
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      {/* Glow effect behind poster */}
      <mesh position={[0, 0, -0.1]} scale={[2.2, 3.2, 1]}>
        <planeGeometry />
        <MeshDistortMaterial
          color={new Color("#6d28d9")}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Movie Poster */}
      <mesh castShadow receiveShadow>
        <planeGeometry args={[2, 3]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Rating Stars */}
      {movie.vote_average && (
        <group position={[0, -1.7, 0.1]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.15}
            color="yellow"
            font="/fonts/Geist_Bold.json"
            anchorX="center"
          >
            {`${movie.vote_average.toFixed(1)}/10`}
          </Text>
          <mesh position={[-0.4, 0, 0]} scale={0.1}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="yellow"
              emissive="yellow"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      )}

      {/* Sparkles effect */}
      <Sparkles
        count={50}
        scale={[3, 4, 3]}
        size={0.4}
        speed={0.3}
        opacity={0.5}
        color="#ffffff"
      />
    </group>
  );
};

// 3D Movie Info component
const MovieInfo = ({
  movie,
  isVisible,
}: {
  movie: Movie;
  isVisible: boolean;
}) => {
  const groupRef = useRef<Group>(null);

  // Animate the info panel
  useFrame(() => {
    if (!groupRef.current) return;

    // Fade in/out effect
    if (isVisible) {
      groupRef.current.position.x = MathUtils.lerp(
        groupRef.current.position.x,
        3,
        0.1,
      );
      groupRef.current.rotation.y = MathUtils.lerp(
        groupRef.current.rotation.y,
        -0.2,
        0.1,
      );
    } else {
      groupRef.current.position.x = MathUtils.lerp(
        groupRef.current.position.x,
        5,
        0.1,
      );
      groupRef.current.rotation.y = MathUtils.lerp(
        groupRef.current.rotation.y,
        0.5,
        0.1,
      );
    }
  });

  return (
    <group ref={groupRef} position={[5, 0, 0]} rotation={[0, 0.5, 0]}>
      <Html transform distanceFactor={10} position={[0, 0, 0]} className="w-80">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/80 backdrop-blur-md text-white p-6 rounded-lg border border-purple-500/30 shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-2 text-purple-300">
            {movie.title}
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {movie.pg_rating && (
              <Badge className="bg-purple-900/60 hover:bg-purple-800 text-white border-none">
                {movie.pg_rating}
              </Badge>
            )}
            {movie.year && (
              <Badge className="bg-purple-900/60 hover:bg-purple-800 text-white border-none">
                {movie.year}
              </Badge>
            )}
            {movie.original_language && (
              <Badge className="bg-purple-900/60 hover:bg-purple-800 text-white border-none">
                {movie.original_language.toUpperCase()}
              </Badge>
            )}
          </div>

          {movie.vote_average && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  User Rating
                </span>
                <span className="text-sm font-bold">
                  {movie.vote_average.toFixed(1)}/10
                </span>
              </div>
              <Progress
                value={movie.vote_average * 10}
                className="h-2 bg-gray-700"
              >
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              </Progress>
              {movie.vote_count && (
                <div className="text-xs text-gray-400 mt-1 text-right">
                  Based on {movie.vote_count.toLocaleString()} votes
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 mb-4">
            {movie.runtime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-purple-300" />
                <span>{formatRuntime(movie.runtime)}</span>
              </div>
            )}

            {movie.release_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-purple-300" />
                <span>{formatDate(movie.release_date)}</span>
              </div>
            )}

            {movie.revenue && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-purple-300" />
                <span>Box Office: {formatCurrency(movie.revenue)}</span>
              </div>
            )}

            {movie.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-purple-300" />
                <span>Budget: {formatCurrency(movie.budget)}</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1 text-purple-300" />
              Overview
            </h3>
            <p className="text-sm text-gray-300 line-clamp-6">
              {movie.overview ||
                movie.description ||
                "No description available."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-none">
              <Play className="h-4 w-4 mr-2" />
              Watch Trailer
            </Button>

            {movie.imdb_url && (
              <Button
                variant="outline"
                className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-900/30"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                IMDb
              </Button>
            )}
          </div>
        </motion.div>
      </Html>
    </group>
  );
};

// Reflective Floor component
const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={2048}
        mixBlur={1}
        mixStrength={80}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050505"
        metalness={0.5}
      />
    </mesh>
  );
};

// Main 3D Scene
const MovieScene = ({ movie }: { movie: Movie }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { camera } = useThree();

  // Position camera
  useEffect(() => {
    camera.position.set(0, 0, 5);
    camera.lookAt(new Vector3(0, 0, 0));
  }, [camera]);

  return (
    <>
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 5, 15]} />

      <ambientLight intensity={0.3} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.15}
        penumbra={1}
        intensity={0.8}
        castShadow
      />
      <spotLight
        position={[-5, 5, 5]}
        angle={0.15}
        penumbra={1}
        intensity={0.4}
        castShadow
        color="#9333ea"
      />

      <Environment preset="night" />

      <group position={[0, 0, 0]}>
        <MoviePoster
          movie={movie}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
        />
        <MovieInfo movie={movie} isVisible={isHovered} />
      </group>

      <Floor />
    </>
  );
};

// Main component
const MovieDetail3D = ({ movie }: { movie: Movie }) => {
  return (
    <div className="relative w-full h-screen">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <MovieScene movie={movie} />
      </Canvas>

      {/* Movie Title Overlay */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          {movie.title}
        </h1>
        {movie.original_title && movie.original_title !== movie.title && (
          <h2 className="text-xl text-gray-300 mt-2 italic">
            {movie.original_title}
          </h2>
        )}
      </div>
    </div>
  );
};

export default MovieDetail3D;
