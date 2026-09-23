// Terrain vertex shader - elevation-based coloring
// Used with Three.js ShaderMaterial for advanced terrain rendering

// Vertex Shader
varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vElevation = position.z;
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
/*
uniform float minElevation;
uniform float maxElevation;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

vec3 elevationColor(float t) {
  // Low = green, mid = brown, high = white
  vec3 low = vec3(0.2, 0.5, 0.1);
  vec3 mid = vec3(0.5, 0.35, 0.15);
  vec3 high = vec3(0.9, 0.9, 0.95);
  
  if (t < 0.5) {
    return mix(low, mid, t * 2.0);
  }
  return mix(mid, high, (t - 0.5) * 2.0);
}

void main() {
  float t = clamp((vElevation - minElevation) / (maxElevation - minElevation), 0.0, 1.0);
  vec3 color = elevationColor(t);
  
  // Simple directional lighting
  vec3 lightDir = normalize(vec3(1.0, 2.0, 1.0));
  float diffuse = max(dot(vNormal, lightDir), 0.0);
  color *= 0.3 + 0.7 * diffuse;
  
  gl_FragColor = vec4(color, 1.0);
}
*/
