// Contour line shader - draws contour lines based on elevation
// Applied to terrain surface via ShaderMaterial

// Vertex Shader
/*
varying float vElevation;

void main() {
  vElevation = position.z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
*/

// Fragment Shader
/*
uniform float contourInterval;
uniform float contourThickness;
uniform vec3 contourColor;
uniform vec3 majorContourColor;
uniform float majorInterval; // e.g., every 5th contour

varying float vElevation;

void main() {
  float modElev = mod(vElevation, contourInterval);
  float majorModElev = mod(vElevation, contourInterval * majorInterval);
  
  float contourLine = 1.0 - smoothstep(0.0, contourThickness, abs(modElev));
  float majorLine = 1.0 - smoothstep(0.0, contourThickness * 2.0, abs(majorModElev));
  
  if (majorLine > 0.5) {
    gl_FragColor = vec4(majorContourColor, majorLine);
  } else if (contourLine > 0.5) {
    gl_FragColor = vec4(contourColor, contourLine * 0.7);
  } else {
    discard;
  }
}
*/
